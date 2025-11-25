import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Setting the third parameter to '' loads all env vars regardless of the `VITE_` prefix.
  // Fix: Cast process to any to avoid TS error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This replaces process.env.API_KEY in the code with the actual string value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ''),
      // This prevents "process is not defined" errors for other random access
      'process.env': {},
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // Ensure manifest and sw are included if they are in the root
      rollupOptions: {
        input: {
          main: 'index.html',
          sw: 'sw.js',
          // manifest: 'manifest.json' // handled via link in html usually, but good to be safe if needed
        }
      }
    }
  };
});