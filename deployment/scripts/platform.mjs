import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  policySchema,
  validateRegistry,
  releaseSchema,
  remoteIds,
} from '../../apps/ecosystem/src/nucleus/schema.ts';
export { policySchema, validateRegistry, releaseSchema, remoteIds };
export const applications = ['ecosystem', ...remoteIds];
export const digest = (body, algorithm = 'sha256') =>
  createHash(algorithm).update(body).digest('hex');
export const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export function targetsFrom(raw) {
  const targets = JSON.parse(raw ?? '{}');
  const origins = new Set(),
    sites = new Set();
  for (const id of [...applications, 'nucleus']) {
    const target = targets[id];
    if (!target || !/^[a-zA-Z0-9-]{8,80}$/.test(target.siteId))
      throw new Error(`Configure the ${id} Netlify site ID`);
    const url = new URL(target.origin);
    if (
      url.origin !== target.origin ||
      url.protocol !== 'https:' ||
      !url.hostname.endsWith('.netlify.app') ||
      url.hostname.includes('--') ||
      origins.has(url.origin) ||
      sites.has(target.siteId)
    )
      throw new Error(
        'Use six distinct production HTTPS Netlify site origins and IDs',
      );
    origins.add(url.origin);
    sites.add(target.siteId);
  }
  return targets;
}
export function productionPolicy(targets) {
  return policySchema.parse({
    schemaVersion: 1,
    environment: 'production',
    registry: '/nucleus/remotes.json',
    fallback: '/nucleus/fallback.json',
    trustedOrigins: remoteIds.map((id) => targets[id].origin),
  });
}
export async function filesFrom(directory, prefix = '') {
  const files = {};
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.isSymbolicLink()) throw new Error('Do not deploy symbolic links');
    const path = `${prefix}/${item.name}`;
    if (item.isDirectory())
      Object.assign(
        files,
        await filesFrom(resolve(directory, item.name), path),
      );
    else if (item.isFile())
      files[path] = await readFile(resolve(directory, item.name));
  }
  return files;
}
export function client(token, fetcher = fetch) {
  if (!token) throw new Error('NETLIFY_AUTH_TOKEN is required');
  return async (path, method = 'GET', body, raw = false) => {
    const response = await fetcher(`https://api.netlify.com/api/v1${path}`, {
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(30000),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': raw ? 'application/octet-stream' : 'application/json',
      },
      body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    });
    if (!response.ok)
      throw new Error(
        `Netlify ${method} failed (${response.status}); credentials are not logged`,
      );
    return response.status === 204 ? null : response.json();
  };
}
export async function publicFile(url, fetcher = fetch, expectedCors) {
  const response = await fetcher(url, {
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(
      `Public deployment verification failed (${response.status})`,
    );
  if (
    expectedCors &&
    response.headers.get('access-control-allow-origin') !== expectedCors
  )
    throw new Error('Remote CORS does not allow the configured Host');
  if (
    expectedCors &&
    !/immutable/.test(response.headers.get('cache-control') ?? '')
  )
    throw new Error(
      'Versioned remote assets must be served with immutable caching',
    );
  if (
    expectedCors &&
    new URL(url).pathname.endsWith('.js') &&
    !/javascript/.test(response.headers.get('content-type') ?? '')
  )
    throw new Error('Remote JavaScript MIME type is invalid');
  return Buffer.from(await response.arrayBuffer());
}
export async function jsonAt(url, fetcher = fetch) {
  return JSON.parse((await publicFile(url, fetcher)).toString());
}
export async function siteState(api, target) {
  const site = await api(`/sites/${target.siteId}`);
  if (
    site.id !== target.siteId ||
    new URL(site.ssl_url).origin !== target.origin
  )
    throw new Error('Configured site identity/origin does not match Netlify');
  const files = {};
  if (site.published_deploy) {
    for (let page = 1; page <= 1000; page++) {
      const batch = await api(
        `/sites/${target.siteId}/files?page=${page}&per_page=100`,
      );
      if (!Array.isArray(batch) || batch.length > 100)
        throw new Error('Invalid Netlify file page');
      for (const item of batch) {
        if (
          typeof item.path !== 'string' ||
          !item.path.startsWith('/') ||
          !/^[a-f0-9]{40}$/.test(item.sha) ||
          Object.hasOwn(files, item.path)
        )
          throw new Error(
            'Invalid or repeated retained asset; abort pagination',
          );
        files[item.path] = item.sha;
      }
      if (batch.length < 100)
        return { deployId: site.published_deploy.id, files };
    }
    throw new Error('Retained asset pagination exceeds the bounded limit');
  }
  return { deployId: null, files };
}
/** Draft first; caller verifies public bytes before publishing. Existing digests preserve historical releases. */
export async function draftDeploy(
  api,
  target,
  previous,
  additions,
  {
    immutablePrefix,
    pause = (ms) => new Promise((r) => setTimeout(r, ms)),
  } = {},
) {
  if (
    immutablePrefix &&
    Object.keys(previous.files).some((path) => path.startsWith(immutablePrefix))
  )
    throw new Error(
      'Release version already exists; never overwrite immutable assets',
    );
  const files = {
    ...previous.files,
    ...Object.fromEntries(
      Object.entries(additions).map(([path, body]) => [
        path,
        digest(body, 'sha1'),
      ]),
    ),
  };
  const created = await api(`/sites/${target.siteId}/deploys`, 'POST', {
    draft: true,
    files,
  });
  if (!/^[a-zA-Z0-9-]+$/.test(created.id) || !Array.isArray(created.required))
    throw new Error('Invalid deploy receipt');
  for (const sha of created.required) {
    const item = Object.entries(additions).find(
      ([, body]) => digest(body, 'sha1') === sha,
    );
    if (!item)
      throw new Error(
        'Netlify lost a retained asset; refusing an incomplete deployment',
      );
    const [path, body] = item;
    await api(
      `/deploys/${created.id}/files${path.split('/').map(encodeURIComponent).join('/')}`,
      'PUT',
      body,
      true,
    );
  }
  for (let attempt = 0; attempt < 120; attempt++) {
    const deploy = await api(`/deploys/${created.id}`);
    if (deploy.state === 'error')
      throw new Error('Netlify draft processing failed');
    if (deploy.state === 'ready') {
      const url = new URL(deploy.deploy_ssl_url);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== `${created.id}--${new URL(target.origin).hostname}`
      )
        throw new Error('Unexpected draft deployment origin');
      return { id: created.id, origin: url.origin };
    }
    await pause(1000);
  }
  throw new Error('Netlify deploy readiness timed out');
}
export async function publishDraft(api, target, previous, draft) {
  const current = await siteState(api, target);
  if (current.deployId !== previous.deployId)
    throw new Error(
      'Published deploy changed concurrently; rerun against the current snapshot',
    );
  await api(`/sites/${target.siteId}/deploys/${draft.id}/restore`, 'POST');
  const published = await siteState(api, target);
  if (published.deployId !== draft.id)
    throw new Error('Netlify did not confirm publication');
}
export async function verifyFiles(origin, files, fetcher = fetch) {
  for (const [path, body] of Object.entries(files)) {
    if (path === '/_headers' || path === '/_redirects') continue; // Netlify control files are not served publicly.
    const actual = await publicFile(origin + path, fetcher);
    if (digest(actual) !== digest(body))
      throw new Error(`Published bytes differ at ${path}`);
  }
}
export async function verifyRelease(
  origin,
  id,
  version,
  fetcher = fetch,
  hostOrigin,
) {
  if (!remoteIds.includes(id) || !versionPattern.test(version))
    throw new Error('Invalid release identity');
  const prefix = `/releases/${version}/`;
  const manifest = await jsonAt(`${origin}${prefix}release.json`, fetcher);
  const release = releaseSchema.parse(manifest.release);
  if (
    release.id !== id ||
    release.version !== version ||
    !/^[a-f0-9]{40}$/.test(manifest.commit)
  )
    throw new Error('Release identity/provenance mismatch');
  if (
    manifest.schemaVersion !== 1 ||
    !manifest.files ||
    typeof manifest.files !== 'object' ||
    Array.isArray(manifest.files) ||
    Object.keys(manifest.files).length > 2000 ||
    !manifest.files[`${prefix}remoteEntry.js`] ||
    !manifest.files[`${prefix}index.html`]
  )
    throw new Error('Incomplete release manifest');
  for (const [path, sha] of Object.entries(manifest.files)) {
    if (
      !path.startsWith(prefix) ||
      /[^a-zA-Z0-9/_.-]|(?:^|\/)\.{1,2}(?:\/|$)/.test(path) ||
      !/^[a-f0-9]{64}$/.test(sha)
    )
      throw new Error('Invalid release asset path/hash');
    if (digest(await publicFile(origin + path, fetcher, hostOrigin)) !== sha)
      throw new Error(`Release integrity check failed: ${path}`);
  }
  return release;
}
