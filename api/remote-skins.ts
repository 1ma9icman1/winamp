export default async function handler(request: Request) {
  const body = await request.text()
  const response = await fetch('https://HQ9I5Z6IM5-dsn.algolia.net/1/indexes/Skins/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-algolia-application-id': 'HQ9I5Z6IM5',
      'x-algolia-api-key': '6466695ec3f624a5fccf46ec49680e51',
    },
    body,
  })
  return new Response(await response.text(), {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
  })
}