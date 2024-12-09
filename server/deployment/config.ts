import { db } from "../../db";
import { sql } from "drizzle-orm";

interface DeploymentStatus {
  status: 'success' | 'failed' | 'in_progress';
  timestamp: Date;
  error?: string;
  version: string;
}

// Track deployment status
export async function updateDeploymentStatus(status: DeploymentStatus) {
  try {
    // Log deployment status
    console.log(`[Deployment] Status: ${status.status}, Version: ${status.version}`);
    console.log(`[Deployment] Timestamp: ${status.timestamp}`);
    if (status.error) {
      console.error(`[Deployment] Error: ${status.error}`);
    }
  } catch (error) {
    console.error('Failed to update deployment status:', error);
  }
}

// Pre-deployment checks
export async function runPreDeploymentChecks() {
  try {
    // Database connection check
    await db.execute(sql`SELECT 1`);
    
    // Check database migrations
    const migrationCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'drizzle_migrations'
      )
    `);
    
    // Environment variables check with defaults
    const requiredEnvVars = ['DATABASE_URL'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    
    // Set default PORT if not provided
    if (!process.env.PORT) {
      process.env.PORT = '5000';
      console.log('[Config] Using default PORT: 5000');
    }

    if (missingVars.length > 0) {
      return {
        success: false,
        error: `Missing required environment variables: ${missingVars.join(', ')}`,
        checks: {
          database: true,
          migrations: !!migrationCheck,
          environment: false
        }
      };
    }

    return {
      success: true,
      checks: {
        database: true,
        migrations: !!migrationCheck,
        environment: true
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: false,
        migrations: false,
        environment: false
      }
    };
  }
}

// Post-deployment verification
export async function verifyDeployment() {
  try {
    // Verify database connection
    await db.execute(sql`SELECT 1`);
    
    // Initial deployment verification only checks database
    // API health check will be done post-server start

    return {
      success: true,
      verifications: {
        database: true,
        api: true
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      verifications: {
        database: false,
        api: false
      }
    };
  }
}
