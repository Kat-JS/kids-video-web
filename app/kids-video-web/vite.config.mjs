import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
preview: {
    port: 8080,
    host: '0.0.0.0',
    // This allows any host (like your .a.run.app URL) to access the app
    allowedHosts: true 
  },
  // Optional: Add this if you also see the error during local docker tests
  server: {
    allowedHosts: true
  }
});
