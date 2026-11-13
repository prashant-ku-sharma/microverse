import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
// A localhost-only static fixture serving the real PARASITE build, not a fake remote module.
const root = fileURLToPath(
  new URL('../../apps/parasite/dist/', import.meta.url),
);
const milliseconds = Number(process.argv[2] ?? 20000);
if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > 60000)
  throw new Error('Delay must be 0–60000 milliseconds');
const mime = {
  '.js': 'text/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};
const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5000');
  response.setHeader('Cache-Control', 'no-store');
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, 'http://127.0.0.1:5001').pathname,
    );
    const path = resolve(root, `.${pathname}`);
    if (
      !path.startsWith(root.endsWith(sep) ? root : root + sep) ||
      !(await stat(path)).isFile()
    ) {
      response.writeHead(404).end();
      return;
    }
    const body = await readFile(path);
    if (pathname === '/remoteEntry.js')
      await new Promise((resolveDelay) =>
        setTimeout(resolveDelay, milliseconds),
      );
    if (!response.destroyed) {
      response.setHeader(
        'Content-Type',
        mime[extname(path)] ?? 'application/octet-stream',
      );
      response.end(body);
    }
  } catch {
    if (!response.destroyed) response.writeHead(404).end();
  }
});
server.listen(5001, '127.0.0.1', () =>
  console.log(
    `Real PARASITE static build on 5001; remoteEntry.js delayed by ${milliseconds}ms`,
  ),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    server.closeAllConnections();
    server.close();
    process.exit(0);
  });
