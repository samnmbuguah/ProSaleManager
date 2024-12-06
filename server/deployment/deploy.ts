import { runDeploymentPipeline } from './ci';
import { runPreDeploymentChecks } from './config';

let deploymentInProgress = false;

export async function handleDeployment() {
  if (deploymentInProgress) {
    return { success: false, error: 'Deployment already in progress' };
  }

  try {
    deploymentInProgress = true;

    // Run pre-deployment checks with retry
    let preChecks;
    for (let i = 0; i < 3; i++) {
      preChecks = await runPreDeploymentChecks();
      if (preChecks.success) break;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
    }

    if (!preChecks?.success) {
      throw new Error(`Pre-deployment checks failed: ${preChecks?.error}`);
    }

    // Run deployment pipeline
    const pipelineResult = await runDeploymentPipeline();
    if (!pipelineResult.success) {
      throw new Error(`Deployment pipeline failed: ${pipelineResult.error}`);
    }

    console.log('[Deployment] Successfully completed deployment process');
    return { success: true };
  } catch (error) {
    console.error('[Deployment] Failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    deploymentInProgress = false;
  }
}
