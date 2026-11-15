import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(
  `deployment/.local/pages-${process.env.PAGES_VERSION ?? '1.0.1'}`,
);
const base = '/microverse/';
const origin = 'http://127.0.0.1:5010';
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, origin).pathname);
    if (!path.startsWith(base)) throw new Error('Outside project');
    let file = resolve(root, path.slice(base.length));
    if (file !== root && !file.startsWith(root + sep))
      throw new Error('Outside artifact');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    let body = await readFile(file);
    // Local HTTP verification uses the explicit development policy; production artifact stays HTTPS-only.
    if (path.startsWith(base + 'nucleus/')) {
      const value = JSON.parse(body.toString());
      if (value.trustedOrigins) {
        value.environment = 'development';
        value.trustedOrigins = [origin];
      }
      if (value.remotes)
        for (const remote of Object.values(value.remotes)) {
          const url = new URL(remote.entry);
          remote.entry = origin + url.pathname;
        }
      body = Buffer.from(JSON.stringify(value));
    }
    res.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
server.listen(5010, '127.0.0.1');
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => server.close());
