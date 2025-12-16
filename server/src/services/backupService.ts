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
    // Check for OAuth2 credentials first
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    // Check for Service Account credentials
    const credentials = process.env.GOOGLE_DRIVE_CREDENTIALS;

    if ((!clientId || !clientSecret || !refreshToken) && !credentials) {
      throw new Error('Google Drive credentials not configured. Set GOOGLE_DRIVE_CREDENTIALS (Service Account) or CLIENT_ID/SECRET/REFRESH_TOKEN (OAuth2)');
    }

    try {
      let auth;

      if (clientId && clientSecret && refreshToken) {
        // Use OAuth2 (Standard User Account) - PREFERRED for Personal Gmail
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oAuth2Client.setCredentials({ refresh_token: refreshToken });
        auth = oAuth2Client;
        console.log('Using OAuth2 credentials for Google Drive.');
      } else if (credentials) {
        // Use Service Account
        const credentialsJson = JSON.parse(credentials);
        console.log('Using Service Account credentials for Google Drive.');
        auth = new google.auth.GoogleAuth({
          credentials: credentialsJson,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
      }

      const drive = google.drive({ version: 'v3', auth });
      const fileName = path.basename(filePath);

      const fileMetadata = {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
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

  async performBackup(force: boolean = false): Promise<void> {
    try {
      if (!force && process.env.NODE_ENV !== 'production') {
        console.log('Backup skipped: Not in production environment');
        return;
      }

      // If forced, we might want to bypass the dialect check or ensure we have a fallback
      // But usually local dev is sqlite, so mysqldump won't work unless we have mysql credentials for a local mysql instance.
      // We will warn but try to proceed if config exists.
      if (this.config.dialect !== 'mysql') {
        if (force) {
          console.warn('⚠️  Warning: Performing backup on non-MySQL database. This may fail if mysqldump is not compatible.');
        } else {
          console.log('Backup skipped: Database is not MySQL');
          return;
        }
      }

      console.log('Starting database backup...');
      const backupFile = await this.createBackup();

      if (backupFile) {
        try {
          console.log(`Uploading backup ${backupFile} to Drive...`);
          await this.uploadToDrive(backupFile);

          await this.cleanupOldBackups(
            parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10)
          );
          console.log('✅ Backup process completed successfully');
        } catch (uploadError) {
          console.error('❌ Error during backup upload/cleanup:', uploadError);
          throw uploadError;
        } finally {
          // Clean up the local backup file after upload
          try {
            if (fs.existsSync(backupFile)) {
              fs.unlinkSync(backupFile);
              console.log('Cleaned up local backup file');
            }
          } catch (cleanupError) {
            console.error('Error cleaning up backup file:', cleanupError);
          }
        }
      }
    } catch (error) {
      console.error('❌ Backup process failed:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const backupService = new BackupService();
export default backupService;

