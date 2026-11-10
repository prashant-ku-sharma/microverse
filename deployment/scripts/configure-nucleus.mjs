import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const [environment, target] = process.argv.slice(2);
if (!['development', 'production'].includes(environment) || !target)
  throw new Error(
    'Usage: node deployment/scripts/configure-nucleus.mjs development|production TARGET_DIRECTORY',
  );
const destination = resolve(root, target);
await mkdir(destination, { recursive: true });
for (const name of ['config.json', 'remotes.json', 'fallback.json'])
  await cp(
    resolve(root, 'deployment/registry', environment, name),
    resolve(destination, name),
  );
console.log(
  `Installed ${environment} runtime configuration in ${destination}. Production .example origins must be replaced before use.`,
);
