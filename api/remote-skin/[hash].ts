import { Buffer } from 'node:buffer'

export default async function handler(request: any, response: any) {
  const hash = request.query.hash
  const upstream = await fetch(`https://r2.webampskins.org/skins/${encodeURIComponent(hash)}.wsz`)
  response.status(upstream.status).setHeader('Content-Type', upstream.headers.get('Content-Type') || 'application/octet-stream')
  response.send(Buffer.from(await upstream.arrayBuffer()))
}