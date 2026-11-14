import { writeFile } from 'node:fs/promises';
import {
  client,
  targetsFrom,
  productionPolicy,
  validateRegistry,
  remoteIds,
  siteState,
  jsonAt,
  digest,
  verifyRelease,
  draftDeploy,
  publishDraft,
  verifyFiles,
} from './platform.mjs';
const compatibility = { hostApi: 1, mycelium: 1, reactMajor: 19, muiMajor: 9 };
export const snapshotHash = (registry) => digest(JSON.stringify(registry));
export async function manageNucleus(
  { operation, remote, version, snapshot, expected, versions },
  targets,
  api,
  fetcher = fetch,
  smoke,
) {
  if (
    !['initialize', 'promote', 'rollback'].includes(operation) ||
    !/^(none|[a-f0-9]{64})$/.test(expected ?? '')
  )
    throw new Error(
      'Supply an operation and expected current snapshot hash (or none for initialization)',
    );
  if (typeof smoke !== 'function')
    throw new Error('A browser acceptance gate is required');
  const policy = productionPolicy(targets),
    hostBefore = await siteState(api, targets.ecosystem);
  if (!hostBefore.deployId)
    throw new Error('Deploy the configured Host before initializing NUCLEUS');
  const hostPolicy = await jsonAt(
    targets.ecosystem.origin + '/nucleus/config.json',
    fetcher,
  );
  if (JSON.stringify(hostPolicy) !== JSON.stringify(policy))
    throw new Error(
      'Host trust policy does not match configured targets; review the Host policy deployment first',
    );
  const previous = await siteState(api, targets.nucleus);
  const current = previous.deployId
    ? validateRegistry(
        await jsonAt(targets.nucleus.origin + '/nucleus/remotes.json', fetcher),
        policy,
      )
    : null;
  if ((current ? snapshotHash(current) : 'none') !== expected)
    throw new Error(
      'Stale expected snapshot; review the active registry and retry',
    );
  let candidate;
  if (operation === 'initialize') {
    if (current) throw new Error('Already initialized');
    const selected = JSON.parse(versions ?? '{}');
    candidate = {
      schemaVersion: 1,
      features: { cartEvents: true, offerEvents: true },
      remotes: Object.fromEntries(
        remoteIds.map((id) => [
          id,
          {
            name: id[0].toUpperCase() + id.slice(1),
            version: selected[id],
            entry: `${targets[id].origin}/releases/${selected[id]}/remoteEntry.js`,
            enabled: true,
            compatibility,
          },
        ]),
      ),
    };
  } else {
    if (!current) throw new Error('Initialize NUCLEUS first');
    if (operation === 'rollback') {
      if (!/^[a-f0-9]{64}$/.test(snapshot ?? ''))
        throw new Error('Supply the archived snapshot SHA-256');
      candidate = await jsonAt(
        `${targets.nucleus.origin}/nucleus/history/${snapshot}.json`,
        fetcher,
      );
      if (snapshotHash(candidate) !== snapshot)
        throw new Error('Archived snapshot content does not match its hash');
    } else {
      if (!remoteIds.includes(remote)) throw new Error('Unknown remote');
      candidate = structuredClone(current);
      candidate.remotes[remote] = {
        ...candidate.remotes[remote],
        version,
        entry: `${targets[remote].origin}/releases/${version}/remoteEntry.js`,
      };
    }
  }
  candidate = validateRegistry(candidate, policy);
  for (const id of remoteIds) {
    const item = candidate.remotes[id];
    // Registry inputs cannot redirect validation to a merely allowlisted sibling application.
    if (
      new URL(item.entry).origin !== targets[id].origin ||
      item.entry !==
        `${targets[id].origin}/releases/${item.version}/remoteEntry.js`
    )
      throw new Error(
        'Remote entry must match its owning target and exact release',
      );
    await verifyRelease(
      targets[id].origin,
      id,
      item.version,
      fetcher,
      targets.ecosystem.origin,
    );
  }
  const candidateSmoke = await smoke(
    targets.ecosystem.origin,
    candidate,
    'candidate',
  );
  const hash = snapshotHash(candidate);
  if (hash === expected) throw new Error('Snapshot is already active');
  const fallback = current ?? candidate;
  const additions = {
    '/nucleus/remotes.json': Buffer.from(JSON.stringify(candidate)),
    '/nucleus/fallback.json': Buffer.from(JSON.stringify(fallback)),
    [`/nucleus/history/${hash}.json`]: Buffer.from(JSON.stringify(candidate)),
    ...(current
      ? {
          [`/nucleus/history/${snapshotHash(current)}.json`]: Buffer.from(
            JSON.stringify(current),
          ),
        }
      : {}),
    '/_headers': Buffer.from(
      '/*\n  X-Content-Type-Options: nosniff\n/nucleus/remotes.json\n  Cache-Control: no-store\n  Netlify-CDN-Cache-Control: no-store\n/nucleus/fallback.json\n  Cache-Control: no-store\n  Netlify-CDN-Cache-Control: no-store\n/nucleus/history/*\n  Cache-Control: public, max-age=31536000, immutable\n',
    ),
  };
  const draft = await draftDeploy(api, targets.nucleus, previous, additions);
  await verifyFiles(draft.origin, additions, fetcher);
  // Re-read current bytes as well as deploy identity just before publishing to prevent stale promotion.
  if (
    current &&
    snapshotHash(
      await jsonAt(targets.nucleus.origin + '/nucleus/remotes.json', fetcher),
    ) !== expected
  )
    throw new Error('Registry changed during verification');
  await publishDraft(api, targets.nucleus, previous, draft);
  if (
    snapshotHash(
      await jsonAt(targets.nucleus.origin + '/nucleus/remotes.json', fetcher),
    ) !== hash
  )
    throw new Error('Active registry verification failed');
  const publishedSmoke = await smoke(
    targets.ecosystem.origin,
    candidate,
    'published',
  );
  const hostAfter = await siteState(api, targets.ecosystem);
  if (hostAfter.deployId !== hostBefore.deployId)
    throw new Error(
      'Host changed concurrently; no-Host-deploy acceptance evidence is inconclusive',
    );
  return {
    operation,
    candidateSmoke,
    publishedSmoke,
    snapshot: hash,
    previousSnapshot: current ? snapshotHash(current) : null,
    nucleusDeployId: draft.id,
    hostDeployIdBefore: hostBefore.deployId,
    hostDeployIdAfter: hostAfter.deployId,
    registry: candidate,
  };
}
if (process.argv[1]?.endsWith('/manage-nucleus.mjs')) {
  const { smokeRegistry } = await import('./smoke-registry.mjs');
  const result = await manageNucleus(
    {
      operation: process.env.OPERATION,
      remote: process.env.REMOTE,
      version: process.env.RELEASE_VERSION,
      snapshot: process.env.SNAPSHOT,
      expected: process.env.EXPECTED_SNAPSHOT,
      versions: process.env.INITIAL_VERSIONS,
    },
    targetsFrom(process.env.DEPLOY_TARGETS_JSON),
    client(process.env.NETLIFY_AUTH_TOKEN),
    fetch,
    smokeRegistry,
  );
  await writeFile('nucleus-receipt.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  if (process.env.GITHUB_STEP_SUMMARY)
    await writeFile(
      process.env.GITHUB_STEP_SUMMARY,
      `Verified ${result.operation}: ${result.snapshot}\n\nPrevious snapshot: ${result.previousSnapshot ?? 'none'}\n\nHost deploy stayed ${result.hostDeployIdAfter}. Candidate and published-registry browser gates passed.\n`,
      { flag: 'a' },
    );
}
