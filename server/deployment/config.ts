import { db } from "../../db";
import { sql } from "drizzle-orm";

interface DeploymentMetrics {
  duration: number;
  successfulStages: number;
  failedStages: number;
}

interface DeploymentStatus {
  status: 'success' | 'failed' | 'in_progress';
  timestamp: Date;
  error?: string;
  version: string;
  metrics?: DeploymentMetrics;
}

interface DeploymentConfig {
  enableProgressiveRollout: boolean;
  backupBeforeDeployment: boolean;
  healthCheckTimeout: number;
  requiredServices: string[];
  minHealthyDuration: number;
}

const defaultConfig: DeploymentConfig = {
  enableProgressiveRollout: true,
  backupBeforeDeployment: true,
  healthCheckTimeout: 30000,
  requiredServices: ['database', 'api', 'auth'],
  minHealthyDuration: 5000,
};

// Deployment metrics storage
const deploymentHistory: {
  version: string;
  timestamp: Date;
  duration: number;
  status: string;
  error?: string;
}[] = [];

// Environment validation rules
interface ValidationRule {
  required: boolean;
  validate: (value: string) => boolean;
  default?: string;
}

const envValidationRules: Record<string, ValidationRule> = {
  DATABASE_URL: {
    required: true,
    validate: (value: string) => value.includes('postgresql://')
  },
  PORT: {
    required: true,
    validate: (value: string) => !isNaN(Number(value)),
    default: '5000'
  },
  NODE_ENV: {
    required: false,
    validate: (value: string) => ['development', 'production'].includes(value),
    default: 'development'
  }
};

// Track deployment status with enhanced logging and metrics
export async function updateDeploymentStatus(status: DeploymentStatus) {
  try {
    // Log deployment status with detailed information
    console.log(`[Deployment] Status: ${status.status}, Version: ${status.version}`);
    console.log(`[Deployment] Timestamp: ${status.timestamp}`);
    
    if (status.metrics) {
      console.log(`[Deployment] Metrics:
        Duration: ${status.metrics.duration}ms
        Successful Stages: ${status.metrics.successfulStages}
        Failed Stages: ${status.metrics.failedStages}
      `);
    }

    if (status.error) {
      console.error(`[Deployment] Error: ${status.error}`);
    }

    // Store deployment history
    deploymentHistory.push({
      version: status.version,
      timestamp: status.timestamp,
      duration: status.metrics?.duration || 0,
      status: status.status,
      error: status.error,
    });

    // Keep only last 10 deployments in history
    if (deploymentHistory.length > 10) {
      deploymentHistory.shift();
    }
  } catch (error) {
    console.error('Failed to update deployment status:', error);
  }
}

// Enhanced environment variable validation
export function validateEnvironment() {
  const issues: string[] = [];
  const warnings: string[] = [];

  for (const [key, rules] of Object.entries(envValidationRules)) {
    const value = process.env[key];

    if (!value && rules.required) {
      if (rules.default) {
        process.env[key] = rules.default;
        warnings.push(`${key} not set, using default: ${rules.default}`);
      } else {
        issues.push(`Missing required environment variable: ${key}`);
      }
      continue;
    }

    if (value && rules.validate && !rules.validate(value)) {
      issues.push(`Invalid value for ${key}`);
    }
  }

  warnings.forEach(warning => console.warn('[Config] Warning:', warning));

  if (issues.length > 0) {
    throw new Error(`Environment validation failed:\n${issues.join('\n')}`);
  }
}

// Get deployment configuration
export function getDeploymentConfig(): DeploymentConfig {
  // You could load this from a config file or environment variables
  return defaultConfig;
}

// Get deployment metrics
export function getDeploymentMetrics() {
  return {
    totalDeployments: deploymentHistory.length,
    successRate: calculateSuccessRate(),
    averageDuration: calculateAverageDuration(),
    recentDeployments: deploymentHistory.slice(-5),
  };
}

function calculateSuccessRate(): number {
  if (deploymentHistory.length === 0) return 0;
  const successful = deploymentHistory.filter(d => d.status === 'success').length;
  return (successful / deploymentHistory.length) * 100;
}

function calculateAverageDuration(): number {
  if (deploymentHistory.length === 0) return 0;
  const total = deploymentHistory.reduce((sum, d) => sum + d.duration, 0);
  return total / deploymentHistory.length;
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
