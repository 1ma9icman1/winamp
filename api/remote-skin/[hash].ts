export default async function handler(request: Request, context: { params: { hash: string } }) {
  const response = await fetch(`https://r2.webampskins.org/skins/${encodeURIComponent(context.params.hash)}.wsz`)
  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream' },
  })
}