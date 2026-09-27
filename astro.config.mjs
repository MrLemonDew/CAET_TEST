import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// Check if we are running a production build (Cloudflare) or testing (StackBlitz)
const isBuild = process.argv.includes('build');

export default defineConfig({
  // Only use the Cloudflare adapter during "build", not during StackBlitz "dev"
  ...(isBuild ? { output: 'server', adapter: cloudflare() } : {}),
  vite: {
    plugins: [tailwindcss()]
  }
});
