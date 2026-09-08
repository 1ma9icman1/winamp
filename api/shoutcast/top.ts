export default async function handler() {
  const response = await fetch('https://directory.shoutcast.com/Home/Top', {
    method: 'POST',
  })
  return new Response(await response.text(), {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
  })
}