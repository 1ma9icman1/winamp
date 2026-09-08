export default async function handler(request: any, response: any) {
  const body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body || {})
  const upstream = await fetch('https://HQ9I5Z6IM5-dsn.algolia.net/1/indexes/Skins/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-algolia-application-id': 'HQ9I5Z6IM5',
      'x-algolia-api-key': '6466695ec3f624a5fccf46ec49680e51',
    },
    body,
  })
  response.status(upstream.status).setHeader('Content-Type', upstream.headers.get('Content-Type') || 'application/json').send(await upstream.text())
}