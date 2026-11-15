import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  policySchema,
  validateRegistry,
  remoteIds,
  versionPattern,
} from './platform.mjs';

export function pagesConfiguration(site, version) {
  const url = new URL(site);
  if (
    url.protocol !== 'https:' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    !/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(url.pathname)
  )
    throw new Error(
      'Use an HTTPS Pages URL ending with a canonical directory path',
    );
  if (!versionPattern.test(version))
    throw new Error('Use a unique stable release version');
  const base = url.pathname;
  const paths = Object.fromEntries(
    remoteIds.map((id) => [id, `${base}remotes/${id}/`]),
  );
  const policy = policySchema.parse({
    schemaVersion: 1,
    environment: 'production',
    registry: '/nucleus/remotes.json',
    fallback: '/nucleus/fallback.json',
    trustedOrigins: [url.origin],
    remoteBasePaths: paths,
  });
  const registry = validateRegistry(
    {
      schemaVersion: 1,
      features: { cartEvents: true, offerEvents: true },
      remotes: Object.fromEntries(
        remoteIds.map((id) => [
          id,
          {
            name: id[0].toUpperCase() + id.slice(1),
            version,
            entry: `${url.origin}${paths[id]}releases/${version}/remoteEntry.js`,
            enabled: true,
            compatibility: {
              hostApi: 1,
              mycelium: 1,
              reactMajor: 19,
              muiMajor: 9,
            },
          },
        ]),
      ),
    },
    policy,
  );
  return { base, policy, registry };
}

async function build() {
  const [site, version] = process.argv.slice(2);
  const { base, policy, registry } = pagesConfiguration(site, version);
  // Unique output avoids accidentally retaining stale release files between local builds.
  const output = resolve(`deployment/.local/pages-${version}`);
  await mkdir(resolve('deployment/.local'), { recursive: true });
  await mkdir(output); // Refuse to overwrite an already prepared release version.
  const env = {
    ...process.env,
    VITE_ROUTER_MODE: 'hash',
    VITE_MOCK_WORKER_URL: `${base}mockServiceWorker.js`,
    VITE_REMOTE_VERSION: version,
  };
  for (const id of [...remoteIds, 'ecosystem']) {
    const appBase =
      id === 'ecosystem'
        ? base
        : `${policy.remoteBasePaths[id]}releases/${version}/`;
    const result = spawnSync(
      'pnpm',
      [
        '--filter',
        `@microverse/${id}`,
        'exec',
        'vite',
        'build',
        '--base',
        appBase,
      ],
      { env, stdio: 'inherit' },
    );
    if (result.status !== 0) throw new Error(`${id} build failed`);
    const target =
      id === 'ecosystem'
        ? output
        : resolve(output, `remotes/${id}/releases/${version}`);
    await cp(`apps/${id}/dist`, target, { recursive: true });
  }
  await mkdir(resolve(output, 'nucleus'), { recursive: true });
  for (const [file, data] of Object.entries({
    'config.json': policy,
    'remotes.json': registry,
    'fallback.json': registry,
  }))
    await writeFile(
      resolve(output, 'nucleus', file),
      JSON.stringify(data, null, 2) + '\n',
    );
  await writeFile(resolve(output, '.nojekyll'), '');
  console.log(`Pages artifact: ${output}`);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await build();
