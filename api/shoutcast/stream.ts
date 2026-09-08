export default async function handler(request: any, response: any) {
  const body = typeof request.body === 'string' ? request.body : new URLSearchParams(request.body || {}).toString()
  const upstream = await fetch('https://directory.shoutcast.com/Player/GetStreamUrl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  response.status(upstream.status).setHeader('Content-Type', upstream.headers.get('Content-Type') || 'application/json').send(await upstream.text())
}