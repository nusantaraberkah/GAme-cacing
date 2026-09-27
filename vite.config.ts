import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function gameWebSocketPlugin(): Plugin {
  return {
    name: 'game-websocket-server',
    configureServer(server) {
      if (server.httpServer) {
        import('./server/gameServer.ts').then(({ setupWebSocketServer }) => {
          setupWebSocketServer(server.httpServer!);
        }).catch(err => {
          console.error('Failed to setup dev websocket:', err);
        });
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gameWebSocketPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
