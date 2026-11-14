import { writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  applications,
  remoteIds,
  filesFrom,
  digest,
  targetsFrom,
  productionPolicy,
  versionPattern,
} from './platform.mjs';
export async function prepare(
  app,
  version,
  commit,
  targets,
  directory = resolve(`apps/${app}/dist`),
) {
  if (
    !applications.includes(app) ||
    !versionPattern.test(version) ||
    !/^[a-f0-9]{40}$/.test(commit)
  )
    throw new Error('Invalid deployment build identity');
  const files = await filesFrom(directory);
  const headers = `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Access-Control-Allow-Origin: ${targets.ecosystem.origin}\n/mockServiceWorker.js\n  Cache-Control: no-store\n`;
  const mutablePages = [
    '/',
    '/index.html',
    '/products',
    '/products/*',
    '/cart',
    '/profile',
    '/offers',
    '/ecosystem',
    '/deployment.json',
    '/404.html',
  ]
    .map((path) => `${path}\n  Cache-Control: no-cache\n`)
    .join('');
  if (app === 'ecosystem') {
    // Policy stays in the Host deployment; only active/fallback registry data is proxied.
    const policy = productionPolicy(targets);
    await mkdir(resolve(directory, 'nucleus'), { recursive: true });
    await writeFile(
      resolve(directory, 'nucleus/config.json'),
      JSON.stringify(policy),
    );
    await rm(resolve(directory, 'nucleus/remotes.json'), { force: true });
    await rm(resolve(directory, 'nucleus/fallback.json'), { force: true });
    await writeFile(
      resolve(directory, '_redirects'),
      `/nucleus/remotes.json ${targets.nucleus.origin}/nucleus/remotes.json 200!\n/nucleus/fallback.json ${targets.nucleus.origin}/nucleus/fallback.json 200!\n/nucleus/* /404.html 404\n/* /index.html 200\n`,
    );
    const sources = remoteIds.map((id) => targets[id].origin).join(' ');
    await writeFile(
      resolve(directory, '_headers'),
      headers +
        mutablePages +
        `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/nucleus/*\n  Cache-Control: no-store\n/*\n  Content-Security-Policy: default-src 'self'; script-src 'self' ${sources}; connect-src 'self' ${sources}; style-src 'self' 'unsafe-inline' ${sources}; img-src 'self' data: ${sources}; font-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'\n`,
    );
  } else {
    const prefix = `/releases/${version}`;
    const release = {
      id: app,
      version,
      compatibility: { hostApi: 1, mycelium: 1, reactMajor: 19, muiMajor: 9 },
    };
    const manifest = {
      schemaVersion: 1,
      release,
      commit,
      files: Object.fromEntries(
        Object.entries(files).map(([path, body]) => [
          prefix + path,
          digest(body),
        ]),
      ),
    };
    // Move all compiled assets under a unique base; root index keeps standalone BrowserRouter paths.
    const staging = resolve(directory, '..', `.release-${version}`);
    await cp(directory, staging, {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
    await rm(directory, { recursive: true });
    await mkdir(resolve(directory, `releases/${version}`), { recursive: true });
    await cp(staging, resolve(directory, `releases/${version}`), {
      recursive: true,
    });
    await rm(staging, { recursive: true });
    await writeFile(
      resolve(directory, `releases/${version}/release.json`),
      JSON.stringify(manifest),
    );
    await writeFile(resolve(directory, 'index.html'), files['/index.html']);
    await writeFile(
      resolve(directory, 'mockServiceWorker.js'),
      files['/mockServiceWorker.js'],
    );
    await writeFile(
      resolve(directory, '_headers'),
      headers +
        mutablePages +
        `/releases/*\n  Cache-Control: public, max-age=31536000, immutable\n`,
    );
    await writeFile(
      resolve(directory, '_redirects'),
      '/releases/* /404.html 404\n/* /index.html 200\n',
    );
  }
  await writeFile(resolve(directory, '404.html'), 'Not found');
  await writeFile(
    resolve(directory, 'deployment.json'),
    JSON.stringify({
      app,
      version,
      commit,
      policy: app === 'ecosystem' ? productionPolicy(targets) : undefined,
    }),
  );
}
if (process.argv[1]?.endsWith('/prepare-deployment.mjs'))
  await prepare(
    process.env.APP,
    process.env.RELEASE_VERSION,
    process.env.GITHUB_SHA,
    targetsFrom(process.env.DEPLOY_TARGETS_JSON),
  );
