import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5173,
      host: true, // Allow connections from subdomains like demo.local
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '.local', // allow all *.local subdomains for local dev
        'demo.local',
        'branch.local',
        'eltee.local'
      ],
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    define: {
      'process.env': env
    },
    build: {
      chunkSizeWarningLimit: Infinity
    }
  }
})
