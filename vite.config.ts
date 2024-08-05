import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4567',
        changeOrigin: true,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/three/examples/jsm/libs/draco/**/*',
          dest: 'libs/draco'
        }
      ]
    })
  ],
})
