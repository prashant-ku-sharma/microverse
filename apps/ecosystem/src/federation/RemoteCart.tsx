import { lazy, Suspense, useState } from 'react';
import { LoadingIndicator } from '@microverse/shared-ui';
import { RemoteBoundary } from './RemoteBoundary';
import { loadSymbiont } from './loadSymbiont';

export function RemoteCart() {
  // Stable for this mount; a new navigation can attempt a fresh lazy load.
  const [Routes] = useState(() => lazy(loadSymbiont));
  return (
    <RemoteBoundary
      organism="SYMBIONT"
      title="Your cart is resting."
      application="cart"
    >
      <Suspense fallback={<LoadingIndicator label="Connecting to SYMBIONT…" />}>
        <Routes mode="embedded" />
      </Suspense>
    </RemoteBoundary>
  );
}
