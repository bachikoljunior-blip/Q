import { defineConfig } from 'vite';
import { buildIdentity } from './scripts/build-identity.mjs';
export default defineConfig({
  define: { __Q_BUILD_INFO__: JSON.stringify(await buildIdentity()) },
  base: './',
  assetsInclude: ['**/*.{glb,png,webp,mp3,wav}'],
  build: {
    manifest: true,
    target: 'es2022',
    emptyOutDir: true,
    assetsInlineLimit: file=>/\.(?:glb|png|webp|mp3|wav)$/.test(file)?false:undefined,
    rollupOptions: { output: { manualChunks: { three: ['three'] } } }
  },
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] }
});
