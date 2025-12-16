import { backupService } from '../src/services/backupService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function triggerBackup() {
    console.log('🚀 Triggering Manual Backup...');

    // Force production mode if not set, to ensure backupService logic allowed it (though we will modify service to allow force)
    // But for now, let's respect the service logic which checks NODE_ENV
    if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  NODE_ENV is not "production". Standard backupService might skip execution unless modified.');
        console.warn('   Setting NODE_ENV=production for this process temporarily...');
        process.env.NODE_ENV = 'production';
    }

    try {
        console.log('⏳ Starting backup process...');
        // We are calling performBackup. If we haven't modified it yet to accept 'force', 
        // we need to rely on the environment variables being correct.
        await backupService.performBackup();
        console.log('✅ Manual backup completed successfully!');
    } catch (error) {
        console.error('❌ Manual backup failed:', error);
        process.exit(1);
    }
}

triggerBackup();
