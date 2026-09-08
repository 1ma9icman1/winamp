import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api/remote-skins': {
        target: 'https://HQ9I5Z6IM5-dsn.algolia.net',
        changeOrigin: true,
        rewrite: () => '/1/indexes/Skins/query',
        headers: {
          'x-algolia-application-id': 'HQ9I5Z6IM5',
          'x-algolia-api-key': '6466695ec3f624a5fccf46ec49680e51',
        },
      },
      '/api/remote-skin': {
        target: 'https://r2.webampskins.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/remote-skin/, '/skins'),
      },
      '/api/shoutcast/top': {
        target: 'https://directory.shoutcast.com',
        changeOrigin: true,
        rewrite: () => '/Home/Top',
      },
      '/api/shoutcast/search': {
        target: 'https://directory.shoutcast.com',
        changeOrigin: true,
        rewrite: () => '/Search/UpdateSearch',
      },
      '/api/shoutcast/stream': {
        target: 'https://directory.shoutcast.com',
        changeOrigin: true,
        rewrite: () => '/Player/GetStreamUrl',
      },
    },
  },
})
