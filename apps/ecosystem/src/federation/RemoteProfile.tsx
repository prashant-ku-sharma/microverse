import { RemoteView } from '../immune/RemoteView';
import { lazy, Suspense, useState } from 'react';
import { LoadingIndicator } from '@microverse/shared-ui';
import { RemoteBoundary } from './RemoteBoundary';
import { loadCommensal } from './loadAdditionalRemotes';

export function RemoteProfile() {
  // Stable for this mount; a new navigation can attempt a fresh lazy load.
  const [Routes] = useState(() => lazy(loadCommensal));
  return (
    <RemoteBoundary
      remoteId="commensal"
      organism="COMMENSAL"
      title="Your profile is resting."
      application="profile"
    >
      <Suspense
        fallback={<LoadingIndicator label="Connecting to COMMENSAL…" />}
      >
        <RemoteView id="commensal">
          <Routes mode="embedded" />
        </RemoteView>
      </Suspense>
    </RemoteBoundary>
  );
}
