import { access, copyFile, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const version = process.argv[2];
if (!version || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version))
  throw new Error('Supply a stable release version, e.g. 1.1.0');
const root = fileURLToPath(new URL('../../', import.meta.url));
const destination = resolve(root, 'deployment/.local/cart/releases', version);
let exists = false;
try {
  await access(destination);
  exists = true;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (exists)
  throw new Error(
    'Release directory already exists. Releases are immutable; choose a new version.',
  );
const result = spawnSync(
  'pnpm',
  [
    '--filter',
    '@microverse/symbiont',
    'build',
    '--base',
    `/releases/${version}/`,
    '--outDir',
    destination,
  ],
  {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, VITE_REMOTE_VERSION: version },
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
// Standalone release pages still need one origin-root MSW transport worker.
const releaseWorker = resolve(destination, 'mockServiceWorker.js');
const rootWorker = resolve(root, 'deployment/.local/cart/mockServiceWorker.js');
try {
  await copyFile(releaseWorker, rootWorker, constants.COPYFILE_EXCL);
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  if (!(await readFile(releaseWorker)).equals(await readFile(rootWorker)))
    throw new Error(
      'Preview worker protocol differs; use a separate preview root.',
      { cause: error },
    );
}
console.log(`Built Cart ${version} at ${destination}; Host was not built.`);
