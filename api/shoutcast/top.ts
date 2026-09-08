export default async function handler() {
  const response = await fetch('https://directory.shoutcast.com/Home/Top')
  return new Response(await response.text(), {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
  })
}