import './config/env.js';
import env from './config/env.js';
import app from './app.js';
import { syncDatabase } from './db/sync.js';

const port = env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database
    await syncDatabase();
    
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