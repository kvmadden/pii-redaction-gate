import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('../docs', import.meta.url)))
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.gif': 'image/gif', '.md': 'text/plain' }
const flagIndex = process.argv.indexOf('--port')
const rawPort = flagIndex >= 0 ? process.argv[flagIndex + 1] : (process.env.PORT ?? '3000')
const port = Number(rawPort)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Invalid inspector port: provide --port or PORT between 1 and 65535')
  process.exit(1)
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    const target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
    if (!target.startsWith(root + path.sep)) {
      res.writeHead(403).end()
      return
    }
    const content = await fs.readFile(target)
    res.writeHead(200, {
      'Content-Type': types[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    })
    res.end(content)
  } catch {
    res.writeHead(404).end('Not found')
  }
})

server.listen(port, '127.0.0.1', () => console.log(`Redaction inspector: http://127.0.0.1:${port}`))
