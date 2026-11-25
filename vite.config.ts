import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * The site is frequently embedded in a sandboxed iframe (opaque origin "null").
 * Module + HMR requests from an opaque origin are cross-origin, so the dev and
 * preview servers must answer with permissive CORS headers or the app boots blank.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Private-Network': 'true',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    cors: true,
    headers: corsHeaders,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
    cors: true,
    headers: corsHeaders,
  },
});
