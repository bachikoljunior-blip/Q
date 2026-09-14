import { defineConfig } from 'vite';
export default defineConfig({
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
