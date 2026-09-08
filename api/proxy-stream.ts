export default async function handler(request: any, response: any) {
  const targetUrl = request.query?.url
  if (!targetUrl || typeof targetUrl !== 'string') {
    return response.status(400).send('Missing url parameter')
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Winamp/5.8 (RadioCore)',
        'Icy-MetaData': '1',
      },
    })

    if (!upstream.ok || !upstream.body) {
      return response.status(upstream.status || 502).send('Upstream stream error')
    }

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg'
    response.setHeader('Content-Type', contentType)
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')

    const reader = upstream.body.getReader()
    request.on('close', () => {
      reader.cancel().catch(() => {})
    })

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      response.write(Buffer.from(value))
    }
    response.end()
  } catch (error: any) {
    if (!response.headersSent) {
      response.status(500).send(error.message)
    }
  }
}
