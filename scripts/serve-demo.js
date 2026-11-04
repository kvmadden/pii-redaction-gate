import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
const root = path.resolve(new URL('../docs', import.meta.url).pathname)
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.gif':'image/gif', '.md':'text/plain', '.woff2':'font/woff2'}
const server = http.createServer(async (req, res) => {
 try {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end()
 return }
  const content = await fs.readFile(target)
  res.writeHead(200, {'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control':'no-store'})
  res.end(content)
 } catch { res.writeHead(404).end('Not found') }
})
server.listen(8769, '127.0.0.1', () => console.log('Redaction inspector: http://127.0.0.1:8769'))
