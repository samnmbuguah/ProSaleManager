import { db } from "../../db";
import { sql } from "drizzle-orm";
import { updateDeploymentStatus } from "./config";
import { createDatabaseBackup } from "../db/backup";
import path from "path";
import fs from "fs/promises";

interface PipelineStage {
  name: string;
  execute: () => Promise<void>;
}

interface DeploymentVersion {
  version: string;
  timestamp: Date;
  stages: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  metrics?: {
    duration: number;
    successfulStages: number;
    failedStages: number;
  };
}

let currentDeployment: DeploymentVersion | null = null;

async function validateStaticAssets() {
  const clientDir = path.join(process.cwd(), 'client');
  const requiredAssets = ['index.html', 'src/main.tsx'];
  
  for (const asset of requiredAssets) {
    const assetPath = path.join(clientDir, asset);
    try {
      await fs.access(assetPath);
    } catch {
      throw new Error(`Required static asset missing: ${asset}`);
    }
  }
}

async function verifyDatabaseBackup(backupFile: string) {
  const backupPath = path.join(process.cwd(), 'backups', backupFile);
  try {
    const stats = await fs.stat(backupPath);
    if (stats.size === 0) {
      throw new Error('Backup file is empty');
    }
    return true;
  } catch (error) {
    throw new Error(`Backup verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function performHealthCheck() {
  const response = await fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/health');
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  const health = await response.json();
  if (health.status !== 'healthy') {
    throw new Error(`Unhealthy service state: ${health.status}`);
  }
}

export async function runDeploymentPipeline() {
  const version = process.env.REPL_SLUG || 'local';
  const timestamp = new Date();
  let backupFilename: string | undefined;
  
  currentDeployment = {
    version,
    timestamp,
    stages: [],
    status: 'pending',
  };

  const startTime = Date.now();
  let successfulStages = 0;
  let failedStages = 0;
  
  try {
    await updateDeploymentStatus({
      status: 'in_progress',
      timestamp,
      version,
    });

    currentDeployment.status = 'in_progress';

    const stages: PipelineStage[] = [
      {
        name: 'Pre-deployment Database Backup',
        execute: async () => {
          const backup = await createDatabaseBackup();
          if (!backup.success || !backup.filename) {
            throw new Error('Database backup failed');
          }
          backupFilename = backup.filename;
          await verifyDatabaseBackup(backup.filename);
        }
      },
      {
        name: 'Database Migration Check',
        execute: async () => {
          await db.execute(sql`
            SELECT EXISTS (
              SELECT 1 FROM pg_tables 
              WHERE tablename = 'drizzle_migrations'
            )
          `);
        }
      },
      {
        name: 'Environment Validation',
        execute: async () => {
          const requiredVars = ['DATABASE_URL', 'PORT'];
          const missingVars = requiredVars.filter(v => !process.env[v]);
          if (missingVars.length > 0) {
            throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
          }
        }
      },
      {
        name: 'Static Asset Validation',
        execute: async () => {
          await validateStaticAssets();
        }
      },
      {
        name: 'Database Connection',
        execute: async () => {
          await db.execute(sql`SELECT 1`);
        }
      },
      {
        name: 'Progressive Rollout Check',
        execute: async () => {
          // Implement basic health monitoring before proceeding
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for service to stabilize
          await performHealthCheck();
        }
      }
    ];

    // Execute pipeline stages
    for (const stage of stages) {
      try {
        console.log(`[CI/CD] Executing stage: ${stage.name}`);
        currentDeployment.stages.push(stage.name);
        await stage.execute();
        console.log(`[CI/CD] Stage completed: ${stage.name}`);
        successfulStages++;
      } catch (error) {
        failedStages++;
        console.error(`[CI/CD] Stage failed: ${stage.name}`, error);
        throw error;
      }
    }

    const deploymentDuration = Date.now() - startTime;
    currentDeployment.metrics = {
      duration: deploymentDuration,
      successfulStages,
      failedStages
    };
    currentDeployment.status = 'completed';

    await updateDeploymentStatus({
      status: 'success',
      timestamp: new Date(),
      version,
      metrics: currentDeployment.metrics
    });

    return { success: true, backupFilename, metrics: currentDeployment.metrics };
  } catch (error) {
    const deploymentDuration = Date.now() - startTime;
    currentDeployment.metrics = {
      duration: deploymentDuration,
      successfulStages,
      failedStages
    };
    currentDeployment.status = 'failed';

    await updateDeploymentStatus({
      status: 'failed',
      timestamp: new Date(),
      version,
      error: error instanceof Error ? error.message : 'Unknown error',
      metrics: currentDeployment.metrics
    });

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      backupFilename,
      metrics: currentDeployment.metrics
    };
  }
}
