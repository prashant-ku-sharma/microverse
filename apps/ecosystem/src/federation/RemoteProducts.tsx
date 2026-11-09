import { lazy, Suspense, useState } from 'react';
import { LoadingIndicator } from '@microverse/shared-ui';
import { RemoteBoundary } from './RemoteBoundary';
import { loadParasite } from './loadParasite';

export function RemoteProducts() {
  // Stable for this mount; a new navigation can attempt a fresh lazy load.
  const [Routes] = useState(() => lazy(loadParasite));
  return (
    <RemoteBoundary
      organism="PARASITE"
      title="Products are resting."
      application="product"
    >
      <Suspense fallback={<LoadingIndicator label="Connecting to PARASITE…" />}>
        <Routes mode="embedded" />
      </Suspense>
    </RemoteBoundary>
  );
}
