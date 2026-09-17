import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://maria-galieva.ru',
  output: 'static',
  publicDir: './assets',
  build: {
    assets: '_astro',
  },
});
