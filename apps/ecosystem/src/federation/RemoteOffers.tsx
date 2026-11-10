import { lazy, Suspense, useState } from 'react';
import { LoadingIndicator } from '@microverse/shared-ui';
import { RemoteBoundary } from './RemoteBoundary';
import { loadMutant } from './loadAdditionalRemotes';

export function RemoteOffers() {
  // Stable for this mount; a new navigation can attempt a fresh lazy load.
  const [Routes] = useState(() => lazy(loadMutant));
  return (
    <RemoteBoundary
      organism="MUTANT"
      title="Offers are resting."
      application="offers"
    >
      <Suspense fallback={<LoadingIndicator label="Connecting to MUTANT…" />}>
        <Routes mode="embedded" />
      </Suspense>
    </RemoteBoundary>
  );
}
