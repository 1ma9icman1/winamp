export default async function handler(request: Request) {
  const body = await request.text()
  const response = await fetch('https://directory.shoutcast.com/Player/GetStreamUrl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  return new Response(await response.text(), {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
  })
}