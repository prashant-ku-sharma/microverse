import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
  applications,
  remoteIds,
  targetsFrom,
  productionPolicy,
  digest,
  siteState,
  draftDeploy,
  publishDraft,
  verifyRelease,
  filesFrom,
  client,
} from './platform.mjs';
import { prepare } from './prepare-deployment.mjs';
import { deployApplication } from './deploy-application.mjs';
import {
  manageNucleus as gatedManageNucleus,
  snapshotHash,
} from './manage-nucleus.mjs';
const manageNucleus = (...args) =>
  gatedManageNucleus(...args, async () => ({ testDouble: true }));
const targets = Object.fromEntries(
  [...applications, 'nucleus'].map((id) => [
    id,
    { siteId: `${id}-site-0000`, origin: `https://${id}-test.netlify.app` },
  ]),
);
const commit = 'a'.repeat(40);
function fixture() {
  const published = new Map(),
    drafts = new Map(),
    blobs = new Map(),
    writes = [];
  let counter = 0;
  const save = (id, files) => {
    for (const body of Object.values(files))
      blobs.set(digest(body, 'sha1'), body);
    published.set(id, { id: `initial-${id}`, files: { ...files } });
  };
  const host = {
    '/nucleus/config.json': Buffer.from(
      JSON.stringify(productionPolicy(targets)),
    ),
    '/deployment.json': Buffer.from('host-build-unchanged'),
  };
  save('ecosystem', host);
  const api = async (path, method = 'GET', body) => {
    if (method !== 'GET') writes.push({ path, method });
    const site = Object.keys(targets).find((id) =>
      path.startsWith(`/sites/${targets[id].siteId}`),
    );
    if (site && path === `/sites/${targets[site].siteId}`)
      return {
        id: targets[site].siteId,
        ssl_url: targets[site].origin,
        published_deploy: published.has(site)
          ? { id: published.get(site).id }
          : null,
      };
    if (site && /\/files\?/.test(path)) {
      const page = Number(
        new URL(path, 'https://test.invalid').searchParams.get('page'),
      );
      return Object.entries(published.get(site).files)
        .slice((page - 1) * 100, page * 100)
        .map(([path, bytes]) => ({ path, sha: digest(bytes, 'sha1') }));
    }
    if (site && path.endsWith('/deploys') && method === 'POST') {
      assert.equal(body.draft, true);
      const id = `draft-${++counter}`;
      drafts.set(id, { site, hashes: body.files });
      return {
        id,
        required: [...new Set(Object.values(body.files))].filter(
          (sha) => !blobs.has(sha),
        ),
      };
    }
    const upload = path.match(/^\/deploys\/([^/]+)\/files(.*)$/);
    if (upload) {
      blobs.set(digest(body, 'sha1'), body);
      return {};
    }
    const ready = path.match(/^\/deploys\/([^/]+)$/);
    if (ready) {
      const { site } = drafts.get(ready[1]);
      return {
        id: ready[1],
        state: 'ready',
        deploy_ssl_url: `https://${ready[1]}--${new URL(targets[site].origin).hostname}`,
      };
    }
    const restore = path.match(/\/deploys\/([^/]+)\/restore$/);
    if (site && restore) {
      const { hashes } = drafts.get(restore[1]);
      published.set(site, {
        id: restore[1],
        files: Object.fromEntries(
          Object.entries(hashes).map(([path, sha]) => [path, blobs.get(sha)]),
        ),
      });
      return {};
    }
    throw new Error('Unexpected fake API request ' + method + ' ' + path);
  };
  const fetcher = async (value) => {
    const url = new URL(value),
      site = Object.keys(targets).find(
        (id) => targets[id].origin === url.origin,
      );
    const draft = [...drafts].find(
      ([id, item]) =>
        url.hostname ===
        `${id}--${new URL(targets[item.site].origin).hostname}`,
    );
    const files = draft
      ? Object.fromEntries(
          Object.entries(draft[1].hashes).map(([path, sha]) => [
            path,
            blobs.get(sha),
          ]),
        )
      : published.get(site)?.files;
    const bytes = files?.[url.pathname];
    return new Response(bytes ?? 'Not found', {
      status: bytes ? 200 : 404,
      headers: {
        'access-control-allow-origin': targets.ecosystem.origin,
        'cache-control': 'public, max-age=31536000, immutable',
        'content-type': url.pathname.endsWith('.js')
          ? 'text/javascript'
          : 'application/json',
      },
    });
  };
  return { api, fetcher, published, drafts, writes, save, host };
}
function release(id, version) {
  const prefix = `/releases/${version}/`,
    files = {
      [prefix + 'remoteEntry.js']: Buffer.from(
        `/* real-artifact-fixture ${id} ${version} */`,
      ),
      [prefix + 'index.html']: Buffer.from('index'),
    };
  const manifest = {
    schemaVersion: 1,
    release: {
      id,
      version,
      compatibility: { hostApi: 1, mycelium: 1, reactMajor: 19, muiMajor: 9 },
    },
    commit,
    files: Object.fromEntries(
      Object.entries(files).map(([path, body]) => [path, digest(body)]),
    ),
  };
  files[prefix + 'release.json'] = Buffer.from(JSON.stringify(manifest));
  return files;
}
const init = (f) =>
  manageNucleus(
    {
      operation: 'initialize',
      versions: JSON.stringify(
        Object.fromEntries(remoteIds.map((id) => [id, '1.0.0'])),
      ),
      expected: 'none',
    },
    targets,
    f.api,
    f.fetcher,
  );
function seeded() {
  const f = fixture();
  for (const id of remoteIds) f.save(id, release(id, '1.0.0'));
  return f;
}
test('requires six distinct real-format production targets, never substitutes illustrative domains', () => {
  assert.throws(() => targetsFrom('{}'));
  assert.deepEqual(targetsFrom(JSON.stringify(targets)), targets);
  assert.throws(() =>
    targetsFrom(
      JSON.stringify({
        ...targets,
        parasite: {
          ...targets.parasite,
          origin: 'https://products.microverse.example',
        },
      }),
    ),
  );
  assert.throws(() =>
    targetsFrom(JSON.stringify({ ...targets, parasite: targets.symbiont })),
  );
});
test('publishes a verified candidate and rolls back registry only, retaining releases and the Host identity', async () => {
  const f = seeded(),
    first = await init(f);
  f.save('symbiont', {
    ...f.published.get('symbiont').files,
    ...release('symbiont', '1.1.0'),
  });
  const next = await manageNucleus(
    {
      operation: 'promote',
      remote: 'symbiont',
      version: '1.1.0',
      expected: first.snapshot,
    },
    targets,
    f.api,
    f.fetcher,
  );
  assert.equal(next.registry.remotes.symbiont.version, '1.1.0');
  assert.equal(next.hostDeployIdBefore, next.hostDeployIdAfter);
  assert.equal(next.hostDeployIdAfter, 'initial-ecosystem');
  const rolled = await manageNucleus(
    {
      operation: 'rollback',
      snapshot: first.snapshot,
      expected: next.snapshot,
    },
    targets,
    f.api,
    f.fetcher,
  );
  assert.equal(rolled.snapshot, first.snapshot);
  assert.equal(rolled.registry.remotes.symbiont.version, '1.0.0');
  const fallback = JSON.parse(
    f.published.get('nucleus').files['/nucleus/fallback.json'],
  );
  assert.equal(fallback.remotes.symbiont.version, '1.1.0');
  assert(f.published.get('symbiont').files['/releases/1.0.0/remoteEntry.js']);
  assert(f.published.get('symbiont').files['/releases/1.1.0/remoteEntry.js']);
  assert(f.writes.every((item) => !item.path.includes('ecosystem-site')));
  assert.equal(
    digest(f.published.get('ecosystem').files['/deployment.json']),
    digest(f.host['/deployment.json']),
  );
});
test('rejects stale expected state, missing releases, altered bytes and incompatible metadata before registry writes', async () => {
  const f = seeded(),
    first = await init(f),
    count = f.writes.length;
  await assert.rejects(
    manageNucleus(
      {
        operation: 'promote',
        remote: 'symbiont',
        version: '1.1.0',
        expected: '0'.repeat(64),
      },
      targets,
      f.api,
      f.fetcher,
    ),
    /Stale/,
  );
  await assert.rejects(
    manageNucleus(
      {
        operation: 'promote',
        remote: 'symbiont',
        version: '1.1.0',
        expected: first.snapshot,
      },
      targets,
      f.api,
      f.fetcher,
    ),
    /verification failed/,
  );
  f.save('symbiont', {
    ...release('symbiont', '1.1.0'),
    '/releases/1.1.0/remoteEntry.js': Buffer.from('changed'),
  });
  await assert.rejects(
    manageNucleus(
      {
        operation: 'promote',
        remote: 'symbiont',
        version: '1.1.0',
        expected: first.snapshot,
      },
      targets,
      f.api,
      f.fetcher,
    ),
    /integrity/,
  );
  const manifest = JSON.parse(
    f.published.get('symbiont').files['/releases/1.1.0/release.json'],
  );
  manifest.release.compatibility.reactMajor = 18;
  f.save('symbiont', {
    ...release('symbiont', '1.1.0'),
    '/releases/1.1.0/release.json': Buffer.from(JSON.stringify(manifest)),
  });
  await assert.rejects(
    manageNucleus(
      {
        operation: 'promote',
        remote: 'symbiont',
        version: '1.1.0',
        expected: first.snapshot,
      },
      targets,
      f.api,
      f.fetcher,
    ),
  );
  assert.equal(f.writes.length, count);
});
test('rejects an altered archived snapshot and never accepts a self-approved origin', async () => {
  const f = seeded(),
    first = await init(f);
  const bad = structuredClone(first.registry);
  bad.remotes.symbiont.entry =
    'https://untrusted.netlify.app/releases/1.0.0/remoteEntry.js';
  const hash = snapshotHash(bad);
  f.published.get('nucleus').files[`/nucleus/history/${hash}.json`] =
    Buffer.from(JSON.stringify(bad));
  await assert.rejects(
    manageNucleus(
      { operation: 'rollback', snapshot: hash, expected: first.snapshot },
      targets,
      f.api,
      f.fetcher,
    ),
    /untrusted/,
  );
  f.published.get('nucleus').files[`/nucleus/history/${hash}.json`] =
    Buffer.from(JSON.stringify(first.registry));
  await assert.rejects(
    manageNucleus(
      { operation: 'rollback', snapshot: hash, expected: first.snapshot },
      targets,
      f.api,
      f.fetcher,
    ),
    /hash/,
  );
});
test('preserves old asset digests, rejects version overwrite and refuses a concurrent publication', async () => {
  const f = seeded();
  f.save('symbiont', {
    ...f.published.get('symbiont').files,
    ...Object.fromEntries(
      Array.from({ length: 205 }, (_, index) => [
        `/releases/0.0.1/asset-${index}.js`,
        Buffer.from(`asset ${index}`),
      ]),
    ),
  });
  const target = targets.symbiont,
    previous = await siteState(f.api, target);
  assert.equal(Object.keys(previous.files).length, 208);
  assert(previous.files['/releases/0.0.1/asset-204.js']);
  const draft = await draftDeploy(
    f.api,
    target,
    previous,
    release('symbiont', '1.1.0'),
    { immutablePrefix: '/releases/1.1.0/' },
  );
  assert.equal(
    f.drafts.get(draft.id).hashes['/releases/1.0.0/remoteEntry.js'],
    previous.files['/releases/1.0.0/remoteEntry.js'],
  );
  await assert.rejects(
    draftDeploy(f.api, target, previous, release('symbiont', '1.0.0'), {
      immutablePrefix: '/releases/1.0.0/',
    }),
    /never overwrite/,
  );
  f.published.get('symbiont').id = 'concurrent';
  await assert.rejects(
    publishDraft(f.api, target, previous, draft),
    /concurrently/,
  );
});
test('rejects missing required retained blobs, readiness timeout and invalid site identity', async () => {
  const f = seeded(),
    target = targets.symbiont,
    previous = await siteState(f.api, target);
  await assert.rejects(
    draftDeploy(
      async (path, method, body) =>
        method === 'POST'
          ? { id: 'draft', required: ['missing-retained-blob'] }
          : f.api(path, method, body),
      target,
      previous,
      release('symbiont', '1.1.0'),
    ),
    /retained asset/,
  );
  await assert.rejects(
    draftDeploy(
      async () => ({ id: 'draft', required: [], state: 'processing' }),
      target,
      { files: {} },
      {},
      { pause: async () => {} },
    ),
    /timed out/,
  );
  await assert.rejects(
    siteState(async () => ({ id: 'wrong', ssl_url: target.origin }), target),
    /identity/,
  );
});
test('enforces CORS, MIME types and nonredirecting credential-scoped API requests', async () => {
  const f = seeded();
  await assert.rejects(
    verifyRelease(
      targets.symbiont.origin,
      'symbiont',
      '1.0.0',
      async (url) => {
        const response = await f.fetcher(url);
        response.headers.delete('access-control-allow-origin');
        return response;
      },
      targets.ecosystem.origin,
    ),
    /CORS/,
  );
  await assert.rejects(
    verifyRelease(
      targets.symbiont.origin,
      'symbiont',
      '1.0.0',
      async (url) => {
        const response = await f.fetcher(url);
        response.headers.set('content-type', 'text/html');
        return response;
      },
      targets.ecosystem.origin,
    ),
    /MIME/,
  );
  await assert.rejects(
    verifyRelease(
      targets.symbiont.origin,
      'symbiont',
      '1.0.0',
      async (url) => {
        const response = await f.fetcher(url);
        response.headers.set('cache-control', 'no-cache');
        return response;
      },
      targets.ecosystem.origin,
    ),
    /immutable/,
  );
  let requested;
  await client('test-only-token', async (url, options) => {
    requested = { url, options };
    return Response.json({ ok: true });
  })('/sites/test-site');
  assert.equal(requested.options.redirect, 'error');
  assert.equal(
    requested.options.headers.Authorization,
    'Bearer test-only-token',
  );
  assert.throws(() => client(''), /required/);
});
test('prepares all five independent publish directories with correct version paths and Host-only trust anchor', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'microverse-deployment-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const app of applications) {
    const directory = resolve(root, app);
    await mkdir(resolve(directory, 'assets'), { recursive: true });
    await writeFile(
      resolve(directory, 'index.html'),
      '<script src="/releases/1.2.3/assets/main.js"></script>',
    );
    await writeFile(resolve(directory, 'assets/main.js'), 'app-code');
    await writeFile(resolve(directory, 'remoteEntry.js'), 'remote-code');
    await writeFile(resolve(directory, 'mockServiceWorker.js'), 'worker');
    await prepare(app, '1.2.3', commit, targets, directory);
    const files = await filesFrom(directory),
      rules = files['/_redirects'].toString();
    if (app === 'ecosystem') {
      assert(rules.includes('200!'));
      assert.equal(
        JSON.parse(files['/nucleus/config.json']).environment,
        'production',
      );
      assert(files['/_headers'].toString().includes("script-src 'self'"));
    } else {
      assert(files['/releases/1.2.3/remoteEntry.js']);
      assert.equal(
        JSON.parse(files['/releases/1.2.3/release.json']).release.id,
        app,
      );
      assert(files['/_headers'].toString().includes('immutable'));
    }
  }
});
test('deploys a verified release without automatically promoting NUCLEUS', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'microverse-publish-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [path, body] of Object.entries({
    '/index.html': 'standalone',
    '/remoteEntry.js': 'remote',
    '/mockServiceWorker.js': 'worker',
  }))
    await writeFile(root + path, body);
  await prepare('symbiont', '1.2.3', commit, targets, root);
  const f = fixture();
  const receipt = await deployApplication(
    'symbiont',
    targets,
    f.api,
    root,
    f.fetcher,
  );
  assert.equal(receipt.version, '1.2.3');
  assert.equal(f.published.get('symbiont').id, receipt.deployId);
  assert.equal(f.published.has('nucleus'), false);
  assert(f.writes.every((item) => !item.path.includes('nucleus-site')));
});

test('a failed candidate browser gate prevents registry publication', async () => {
  const f = seeded();
  await assert.rejects(
    gatedManageNucleus(
      {
        operation: 'initialize',
        versions: JSON.stringify(
          Object.fromEntries(remoteIds.map((id) => [id, '1.0.0'])),
        ),
        expected: 'none',
      },
      targets,
      f.api,
      f.fetcher,
      async () => {
        throw new Error('Candidate cannot render');
      },
    ),
    /cannot render/,
  );
  assert.equal(f.writes.length, 0);
});
