import { defineConfig } from 'vite';
import { buildIdentity } from './scripts/build-identity.mjs';
export default defineConfig({
  define: { __Q_BUILD_INFO__: JSON.stringify(await buildIdentity()) },
  base: './',
  assetsInclude: ['**/*.glb'],
  build: {
    manifest: true,
    target: 'es2022',
    emptyOutDir: true,
    assetsInlineLimit: file=>file.endsWith('.glb')?false:undefined,
    rollupOptions: { output: { manualChunks: { three: ['three'] } } }
  },
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] }
});
