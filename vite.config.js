import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  // Load env file from the frontend directory explicitly
  const envDir = path.resolve(__dirname);
  const envFile = path.join(envDir, '.env');
  
  // Manually read and parse .env file since Vite's loadEnv isn't working
  let env = {};
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    // Remove BOM characters and split into lines
    const cleanContent = envContent.replace(/^\uFEFF/, ''); // Remove BOM
    const lines = cleanContent.split('\n');
    
    lines.forEach((line, index) => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key.startsWith('VITE_')) {
          env[key] = value;
        }
      }
    });
  }
  
  return {
    base: './',
    plugins: [react()],
    define: {
      // Explicitly define environment variables for the client
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL),
      'import.meta.env.VITE_GOOGLE_SHEETS_API_KEY': JSON.stringify(env.VITE_GOOGLE_SHEETS_API_KEY),
      'import.meta.env.VITE_STREAM_API_KEY': JSON.stringify(env.VITE_STREAM_API_KEY),
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/static': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/token': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/admin': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
