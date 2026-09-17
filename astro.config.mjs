import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  publicDir: './assets',
  build: {
    assets: '_astro',
  },
});
