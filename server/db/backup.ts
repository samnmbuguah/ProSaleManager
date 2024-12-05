import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface BackupResult {
  success: boolean;
  filename?: string;
  error?: string;
  timestamp: Date;
}

export async function createDatabaseBackup(): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const filename = `backup-${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);

  try {
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Create backup using pg_dump
    const { DATABASE_URL } = process.env;
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    await execAsync(`pg_dump "${DATABASE_URL}" > "${filepath}"`);

    // Maintain only last 7 backups
    const files = await fs.readdir(backupDir);
    const backupFiles = files.filter(f => f.startsWith('backup-')).sort();
    
    if (backupFiles.length > 7) {
      const filesToDelete = backupFiles.slice(0, backupFiles.length - 7);
      await Promise.all(
        filesToDelete.map(file => fs.unlink(path.join(backupDir, file)))
      );
    }

    console.log(`[Backup] Successfully created backup: ${filename}`);
    return {
      success: true,
      filename,
      timestamp: new Date()
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Backup] Failed to create backup:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      timestamp: new Date()
    };
  }
}

// Initialize backup schedule
export function initializeBackupSchedule() {
  const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const RETRY_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
  let retryCount = 0;
  let lastBackupAttempt = 0;
  
  async function scheduleBackup() {
    try {
      console.log('[Backup] Starting scheduled backup...');
      const result = await createDatabaseBackup();
      
      if (result.success) {
        console.log('[Backup] Scheduled backup completed successfully:', result.filename);
        retryCount = 0;
        lastBackupAttempt = Date.now();
      } else {
        console.error('[Backup] Scheduled backup failed:', result.error);
        // Implement retry logic
        if (retryCount < 3) {
          retryCount++;
          console.log(`[Backup] Scheduling retry attempt ${retryCount} in 30 minutes...`);
          setTimeout(scheduleBackup, RETRY_INTERVAL);
        } else {
          console.error('[Backup] Maximum retry attempts reached. Will try again in next scheduled backup.');
          retryCount = 0;
        }
      }
    } catch (error) {
      console.error('[Backup] Error in backup schedule:', error);
      // Implement retry logic for unexpected errors
      if (retryCount < 3) {
        retryCount++;
        console.log(`[Backup] Scheduling retry attempt ${retryCount} in 30 minutes due to error...`);
        setTimeout(scheduleBackup, RETRY_INTERVAL);
      }
    }
  }

  // Run first backup immediately
  scheduleBackup();
  
  // Schedule subsequent backups
  setInterval(() => {
    const timeSinceLastBackup = Date.now() - lastBackupAttempt;
    // Only attempt new backup if at least 12 hours have passed since last attempt
    if (timeSinceLastBackup >= BACKUP_INTERVAL / 2) {
      scheduleBackup();
    }
  }, BACKUP_INTERVAL);
}
