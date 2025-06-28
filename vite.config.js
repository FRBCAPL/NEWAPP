import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  // Load env file from the frontend directory explicitly
  const envDir = path.resolve(__dirname);
  const envFile = path.join(envDir, '.env');
  
  console.log('🔧 Vite config - Environment variables loaded:');
  console.log('🔧 Mode:', mode);
  console.log('🔧 Env directory:', envDir);
  console.log('🔧 Env file path:', envFile);
  console.log('🔧 Env file exists:', fs.existsSync(envFile));
  
  // Manually read and parse .env file since Vite's loadEnv isn't working
  let env = {};
  if (fs.existsSync(envFile)) {
    console.log('🔧 Manually reading .env file...');
    const envContent = fs.readFileSync(envFile, 'utf8');
    console.log('🔧 .env file content:', envContent);
    
    // Remove BOM characters and split into lines
    const cleanContent = envContent.replace(/^\uFEFF/, ''); // Remove BOM
    const lines = cleanContent.split('\n');
    
    lines.forEach((line, index) => {
      line = line.trim();
      console.log(`🔧 Line ${index + 1}: "${line}"`);
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key.startsWith('VITE_')) {
          env[key] = value;
          console.log(`🔧 Parsed: ${key} = ${value}`);
        }
      }
    });
  }
  
  console.log('🔧 VITE_BACKEND_URL:', env.VITE_BACKEND_URL);
  console.log('🔧 VITE_GOOGLE_SHEETS_API_KEY:', env.VITE_GOOGLE_SHEETS_API_KEY ? 'SET' : 'NOT SET');
  console.log('🔧 VITE_STREAM_API_KEY:', env.VITE_STREAM_API_KEY ? 'SET' : 'NOT SET');

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
