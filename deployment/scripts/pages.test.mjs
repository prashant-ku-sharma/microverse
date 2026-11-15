import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pagesConfiguration } from './build-pages.mjs';
import { policySchema, validateRegistry } from './platform.mjs';

test('Pages registry resolves four real versioned remotes beneath the project path', () => {
  const { base, policy, registry } = pagesConfiguration(
    'https://owner.github.io/microverse/',
    '1.42.1',
  );
  assert.equal(base, '/microverse/');
  assert.equal(
    registry.remotes.symbiont.entry,
    'https://owner.github.io/microverse/remotes/symbiont/releases/1.42.1/remoteEntry.js',
  );
  for (const entry of [
    'https://evil.example/microverse/remotes/symbiont/releases/1.42.1/remoteEntry.js',
    'https://owner.github.io/other/releases/1.42.1/remoteEntry.js',
    registry.remotes.parasite.entry,
  ]) {
    const bad = structuredClone(registry);
    bad.remotes.symbiont.entry = entry;
    assert.throws(() => validateRegistry(bad, policy));
  }
  assert.throws(() =>
    policySchema.parse({
      ...policy,
      remoteBasePaths: {
        ...policy.remoteBasePaths,
        symbiont: '/microverse/../',
      },
    }),
  );
});
test('Pages settings reject unsafe paths, URLs and mutable version labels', () => {
  for (const site of [
    'http://owner.github.io/demo/',
    'https://owner.github.io/demo',
    'https://owner.github.io/demo/?x=1',
    'https://user:pass@owner.github.io/demo/',
  ])
    assert.throws(() => pagesConfiguration(site, '1.0.0'));
  assert.throws(() =>
    pagesConfiguration('https://owner.github.io/demo/', 'latest'),
  );
});
