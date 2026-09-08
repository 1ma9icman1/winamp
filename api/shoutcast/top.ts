export default async function handler(_request: any, response: any) {
  const upstream = await fetch('https://directory.shoutcast.com/Home/Top', {
    method: 'POST',
  })
  response.status(upstream.status).setHeader('Content-Type', upstream.headers.get('Content-Type') || 'application/json').send(await upstream.text())
}