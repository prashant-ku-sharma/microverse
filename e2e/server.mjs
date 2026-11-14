import { createServer } from 'node:http';
import {
  readFile,
  readdir,
  mkdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  digest,
  validateRegistry,
  policySchema,
} from '../deployment/scripts/platform.mjs';
const root = process.cwd(),
  fixtureRoot = resolve(root, 'deployment/.local/e2e');
const existing = await fetch('http://127.0.0.1:5005/ready', {
  signal: AbortSignal.timeout(500),
}).catch(() => null);
if (existing?.ok)
  throw new Error(
    'Another test fixture is running; refusing to replace its release files',
  );
await rm(fixtureRoot, { recursive: true, force: true });
await mkdir(fixtureRoot, { recursive: true });
const apps = ['ecosystem', 'parasite', 'symbiont', 'commensal', 'mutant'];
const original = JSON.parse(
  await readFile('apps/ecosystem/public/nucleus/remotes.json'),
);
const policy = policySchema.parse(
  JSON.parse(await readFile('apps/ecosystem/public/nucleus/config.json')),
);
// Build only SYMBIONT twice. ECOSYSTEM is already built and is never rebuilt during release switching.
for (const version of ['1.0.0', '1.0.1']) {
  const result = spawnSync(
    'pnpm',
    [
      '--filter',
      '@microverse/symbiont',
      'build',
      '--base',
      `/releases/${version}/`,
      '--outDir',
      resolve(fixtureRoot, 'symbiont/releases', version),
    ],
    { stdio: 'inherit', env: { ...process.env, VITE_REMOTE_VERSION: version } },
  );
  if (result.status !== 0)
    throw new Error('Independent test release build failed');
}
async function hashes(directory, prefix = '') {
  const result = {};
  for (const item of (await readdir(directory, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )) {
    const path = `${prefix}/${item.name}`;
    if (item.isDirectory())
      Object.assign(result, await hashes(resolve(directory, item.name), path));
    else result[path] = digest(await readFile(resolve(directory, item.name)));
  }
  return result;
}
const hostFiles = await hashes(resolve(root, 'apps/ecosystem/dist'));
const hostArtifact = digest(JSON.stringify(hostFiles));
const evidence = {
  mode: 'local-static-publication-not-Netlify',
  hostArtifact,
  hostFileCount: Object.keys(hostFiles).length,
  symbiontEntries: {},
};
for (const version of ['1.0.0', '1.0.1'])
  evidence.symbiontEntries[version] = digest(
    await readFile(
      resolve(fixtureRoot, `symbiont/releases/${version}/remoteEntry.js`),
    ),
  );
await writeFile(
  resolve(fixtureRoot, 'build-evidence.json'),
  JSON.stringify(evidence, null, 2),
);
let state = {
  offline: [],
  symbiontVersion: null,
  incompatible: false,
  invalidRegistry: false,
  published: ['1.0.0'],
};
function registry() {
  const value = structuredClone(original);
  if (state.symbiontVersion)
    value.remotes.symbiont = {
      ...value.remotes.symbiont,
      version: state.symbiontVersion,
      entry: `http://127.0.0.1:5002/releases/${state.symbiontVersion}/remoteEntry.js`,
    };
  if (state.incompatible) value.remotes.symbiont.version = '9.0.0';
  return validateRegistry(value, policy);
}
const mime = {
  '.js': 'text/javascript',
  '.html': 'text/html',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.css': 'text/css',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};
const servers = apps.map((app, index) => {
  const base = resolve(root, `apps/${app}/dist`);
  return createServer(async (request, response) => {
    const url = new URL(request.url, `http://127.0.0.1:${5000 + index}`);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5000');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    function json(value, status = 200) {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(value));
    }
    try {
      if (
        app === 'ecosystem' &&
        url.pathname === '/__e2e/control' &&
        request.method === 'POST'
      ) {
        let text = '';
        for await (const chunk of request) {
          text += chunk;
          if (text.length > 2000) throw new Error('Control request too large');
        }
        const command = JSON.parse(text);
        if (command.reset)
          state = {
            offline: [],
            symbiontVersion: null,
            incompatible: false,
            invalidRegistry: false,
            published: ['1.0.0'],
          };
        else {
          if (command.publish === '1.0.1') state.published.push('1.0.1');
          if (command.offline) {
            if (!command.offline.every((id) => apps.includes(id)))
              throw new Error('Unknown fixture target');
            state.offline = command.offline;
          }
          if ('symbiontVersion' in command) {
            if (!state.published.includes(command.symbiontVersion))
              throw new Error('Publish before promotion');
            state.symbiontVersion = command.symbiontVersion;
          }
          state.incompatible = command.incompatible ?? state.incompatible;
          state.invalidRegistry =
            command.invalidRegistry ?? state.invalidRegistry;
        }
        return json({
          ...evidence,
          selectedVersion: registry().remotes.symbiont.version,
          published: state.published,
        });
      }
      if (app === 'ecosystem' && url.pathname === '/__e2e/evidence')
        return json({
          ...evidence,
          hostArtifactNow: digest(JSON.stringify(await hashes(base))),
        });
      if (app === 'ecosystem' && url.pathname === '/nucleus/remotes.json')
        return json(state.invalidRegistry ? {} : registry());
      if (state.offline.includes(app))
        return json({ message: 'Controlled unavailable remote fixture' }, 503);
      let directory = base;
      if (app === 'symbiont' && url.pathname.startsWith('/releases/')) {
        const version = url.pathname.split('/')[2];
        if (!state.published.includes(version))
          return json({ message: 'Not published' }, 404);
        directory = resolve(fixtureRoot, 'symbiont');
        response.setHeader(
          'Cache-Control',
          'public, max-age=31536000, immutable',
        );
      }
      let path = resolve(directory, `.${decodeURIComponent(url.pathname)}`);
      if (path !== directory && !path.startsWith(directory + sep))
        return json({}, 403);
      try {
        if ((await stat(path)).isDirectory())
          path = resolve(path, 'index.html');
        await stat(path);
      } catch {
        if (
          extname(url.pathname) ||
          url.pathname.startsWith('/releases/') ||
          url.pathname.startsWith('/nucleus/')
        )
          return json({}, 404);
        path = resolve(directory, 'index.html');
      }
      response.setHeader(
        'Content-Type',
        mime[extname(path)] ?? 'application/octet-stream',
      );
      response.end(await readFile(path));
    } catch (error) {
      json({ message: error.message }, 500);
    }
  });
});
await Promise.all(
  servers.map(
    (server, index) =>
      new Promise((done, reject) => {
        server.once('error', reject);
        server.listen(5000 + index, '127.0.0.1', done);
      }),
  ),
);
const readiness = createServer((_request, response) => {
  response.writeHead(200);
  response.end('Test fixture listeners ready');
});
await new Promise((done, reject) => {
  readiness.once('error', reject);
  readiness.listen(5005, '127.0.0.1', done);
});
servers.push(readiness);
console.log(
  'Five real built apps ready on 5000–5004. Test-only control endpoints are not deployment artifacts.',
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    servers.forEach((server) => {
      server.closeAllConnections();
      server.close();
    });
    process.exit(0);
  });
