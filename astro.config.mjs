// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import db from '@astrojs/db';
import node from '@astrojs/node';
import clerk from '@clerk/astro';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [clerk(), db()],
  adapter: node({ mode: 'standalone' }),
  output: 'server'
});