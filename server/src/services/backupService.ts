import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

interface DatabaseConfig {
  dialect: string;
  host?: string;
  username?: string;
  password?: string;
  database?: string;
  storage?: string;
}

class BackupService {
  private backupDir: string;
  private config: DatabaseConfig;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDir();
    this.config = this.getDbConfig();
  }

  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  private getDbConfig(): DatabaseConfig {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      return {
        dialect: 'mysql',
        host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
        username: process.env.DB_USER || process.env.MYSQL_USER || '',
        password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQL_DATABASE || '',
      };
    } else {
      return {
        dialect: 'sqlite',
        storage: process.env.SQLITE_PATH || path.resolve(process.cwd(), 'database.sqlite'),
      };
    }
  }

  async createBackup(): Promise<string | null> {
    if (this.config.dialect !== 'mysql') {
      console.log('Skipping backup: Only MySQL databases are backed up');
      return null;
    }

    if (!this.config.host || !this.config.username || !this.config.password || !this.config.database) {
      throw new Error('MySQL configuration incomplete for backup');
    }

    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup-${date}.sql`);

    try {
      // Using --no-tablespaces to avoid SUPER privilege requirements
      // Using single quotes properly escaped for password
      const command = `mysqldump --no-tablespaces -h ${this.config.host} -u ${this.config.username} -p'${this.config.password}' ${this.config.database} > ${backupFile}`;

      const { stderr } = await execAsync(command);

      if (stderr && !stderr.includes('mysqldump: [Warning]')) {
        console.warn('Backup stderr:', stderr);
      }

      console.log('Backup created successfully:', backupFile);
      return backupFile;
    } catch (error) {
      console.error('Backup failed:', error);
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadToDrive(filePath: string): Promise<string> {
    if (!process.env.GOOGLE_DRIVE_FOLDER_ID || !process.env.GOOGLE_DRIVE_CREDENTIALS) {
      throw new Error('Google Drive credentials not configured. Set GOOGLE_DRIVE_FOLDER_ID and GOOGLE_DRIVE_CREDENTIALS');
    }

    try {
      const credentialsJson = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
      
      // Handle both OAuth2 client credentials and service account
      let auth;
      if (credentialsJson.web) {
        // OAuth2 client credentials format
        // For automated backups, we need to use OAuth2 with refresh token
        // This requires additional setup - consider using service account instead
        throw new Error(
          'OAuth2 client credentials detected. For automated backups, please use a Service Account JSON instead. ' +
          'Create a service account in Google Cloud Console and download the JSON key.'
        );
      } else if (credentialsJson.type === 'service_account') {
        // Service account format (preferred for automated backups)
        auth = new google.auth.GoogleAuth({
          credentials: credentialsJson,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
      } else {
        // Try to use as-is (might be service account without type field)
        auth = new google.auth.GoogleAuth({
          credentials: credentialsJson,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
      }

      const drive = google.drive({ version: 'v3', auth });
      const fileName = path.basename(filePath);

      const fileMetadata = {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: 'application/sql',
        body: fs.createReadStream(filePath),
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      console.log('File uploaded to Google Drive:', response.data.id);
      return response.data.id || '';
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      throw error;
    }
  }

  async cleanupOldBackups(daysToKeep: number = 7): Promise<void> {
    const files = fs
      .readdirSync(this.backupDir)
      .filter((file) => file.endsWith('.sql'))
      .map((file) => ({
        name: file,
        time: fs.statSync(path.join(this.backupDir, file)).mtime.getTime(),
      }));

    const now = Date.now();
    const cutoff = now - daysToKeep * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      if (file.time < cutoff) {
        fs.unlinkSync(path.join(this.backupDir, file.name));
        console.log('Deleted old backup:', file.name);
      }
    });
  }

  async performBackup(): Promise<void> {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Backup skipped: Not in production environment');
        return;
      }

      if (this.config.dialect !== 'mysql') {
        console.log('Backup skipped: Database is not MySQL');
        return;
      }

      console.log('Starting database backup...');
      const backupFile = await this.createBackup();

      if (backupFile) {
        try {
          await this.uploadToDrive(backupFile);
          await this.cleanupOldBackups(
            parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10)
          );
          console.log('Backup process completed successfully');
        } catch (uploadError) {
          console.error('Error during backup upload/cleanup:', uploadError);
          throw uploadError;
        } finally {
          // Clean up the local backup file after upload
          try {
            fs.unlinkSync(backupFile);
            console.log('Cleaned up local backup file');
          } catch (cleanupError) {
            console.error('Error cleaning up backup file:', cleanupError);
          }
        }
      }
    } catch (error) {
      console.error('Backup process failed:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const backupService = new BackupService();
export default backupService;

