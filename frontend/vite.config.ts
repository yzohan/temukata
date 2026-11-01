import fs from 'node:fs';

// Fix Node v24 Windows sandbox issue where fs.realpathSync.native throws EPERM
try {
  if (fs.realpathSync && fs.realpathSync.native) {
    fs.realpathSync.native = fs.realpathSync;
  }
} catch {}

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
});
