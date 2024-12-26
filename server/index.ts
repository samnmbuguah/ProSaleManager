import './src/config/env';
import env from './src/config/env';
import app from './src/app';
import { syncDatabase } from './src/db/sync';

const port = env.PORT;

async function startServer() {
  try {
    // Sync database
    const dbSynced = await syncDatabase();
    if (!dbSynced) {
      throw new Error('Failed to sync database');
    }

    // Start server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
