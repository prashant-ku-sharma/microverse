import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  applications,
  client,
  targetsFrom,
  siteState,
  filesFrom,
  draftDeploy,
  publishDraft,
  verifyFiles,
  verifyRelease,
  digest,
  publicFile,
} from './platform.mjs';
export async function deployApplication(
  app,
  targets,
  api,
  directory = resolve(`apps/${app}/dist`),
  fetcher = fetch,
) {
  if (!applications.includes(app)) throw new Error('Unknown application');
  const target = targets[app],
    previous = await siteState(api, target),
    files = await filesFrom(directory);
  const identity = JSON.parse(files['/deployment.json'].toString());
  if (identity.app !== app)
    throw new Error('Deployment artifact belongs to another application');
  if (
    previous.files['/mockServiceWorker.js'] &&
    previous.files['/mockServiceWorker.js'] !==
      digest(files['/mockServiceWorker.js'], 'sha1')
  )
    throw new Error(
      'Worker protocol changed; a migration is required before retaining older releases',
    );
  const draft = await draftDeploy(api, target, previous, files, {
    immutablePrefix:
      app === 'ecosystem' ? undefined : `/releases/${identity.version}/`,
  });
  await verifyFiles(draft.origin, files, fetcher);
  if (app !== 'ecosystem')
    await verifyRelease(
      draft.origin,
      app,
      identity.version,
      fetcher,
      targets.ecosystem.origin,
    );
  await publishDraft(api, target, previous, draft);
  // Verify the stable production URL too; a ready draft is not proof of production publication.
  if (app !== 'ecosystem')
    await verifyRelease(
      target.origin,
      app,
      identity.version,
      fetcher,
      targets.ecosystem.origin,
    );
  else if (
    digest(await publicFile(target.origin + '/deployment.json', fetcher)) !==
    digest(files['/deployment.json'])
  )
    throw new Error('Host publication verification failed');
  return {
    app,
    version: identity.version,
    origin: target.origin,
    deployId: draft.id,
    previousDeployId: previous.deployId,
    entry:
      app === 'ecosystem'
        ? undefined
        : `${target.origin}/releases/${identity.version}/remoteEntry.js`,
    commit: identity.commit,
  };
}
if (process.argv[1]?.endsWith('/deploy-application.mjs')) {
  const result = await deployApplication(
    process.env.APP,
    targetsFrom(process.env.DEPLOY_TARGETS_JSON),
    client(process.env.NETLIFY_AUTH_TOKEN),
  );
  await writeFile('deployment-receipt.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  // Remote deployment intentionally does not promote NUCLEUS. Reviewed promotion is a separate workflow.
  if (process.env.GITHUB_STEP_SUMMARY)
    await writeFile(
      process.env.GITHUB_STEP_SUMMARY,
      `Verified deployment: ${result.app} ${result.version}\n\n${result.origin}\n\nDeploy ID: ${result.deployId}\n\nRemote registry promotion is separate.\n`,
      { flag: 'a' },
    );
}
