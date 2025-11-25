import { defineConfig } from 'vite';

export default defineConfig({
  root: './index.html', // permet de servir index.html au bon endroit
  server: {
    port: 5173, // le port utilisé plus haut dans .env
  },
});
