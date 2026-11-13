import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { immune } from './store';
import type { RemoteId } from '../nucleus/schema';
/** Placed inside Suspense: an effect commits only after the remote view renders successfully. */
export function RemoteView({
  id,
  children,
}: {
  id: RemoteId;
  children: ReactNode;
}) {
  useEffect(() => {
    immune.viewReady(id);
  }, [id]);
  return children;
}
