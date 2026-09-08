import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'audio-stream-proxy',
      configureServer(server) {
        server.middlewares.use('/api/proxy-stream', async (req, res) => {
          const urlObj = new URL(req.url || '', 'http://localhost')
          const targetUrl = urlObj.searchParams.get('url')
          if (!targetUrl) {
            res.statusCode = 400
            res.end('Missing url parameter')
            return
          }
          try {
            const upstream = await fetch(targetUrl, {
              headers: { 'User-Agent': 'Winamp/5.8 (RadioCore)', 'Icy-MetaData': '1' },
            })
            if (!upstream.ok || !upstream.body) {
              res.statusCode = upstream.status || 502
              res.end('Upstream stream error')
              return
            }
            res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Cache-Control', 'no-cache, no-store')
            const reader = upstream.body.getReader()
            req.on('close', () => {
              reader.cancel().catch(() => {})
            })
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              res.write(Buffer.from(value))
            }
            res.end()
          } catch (err: any) {
            if (!res.headersSent) {
              res.statusCode = 500
              res.end(err.message)
            }
          }
        })
      },
    },
  ],
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
