// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

import db from '@astrojs/db';
import node from '@astrojs/node';
import clerk from '@clerk/astro';
import react from '@astrojs/react';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': srcDir,
      },
    },
  },

  integrations: [clerk(), db(), react()],
  adapter: node({ mode: 'standalone' }),
  output: 'server',
});
