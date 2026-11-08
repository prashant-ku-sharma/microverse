/** Stage 4 development address; no registry lookup or runtime config service. */
export function parasiteRemote(entry?: string) {
  return {
    name: 'parasite',
    type: 'module' as const,
    entry: entry?.trim() || 'http://127.0.0.1:5001/remoteEntry.js',
  };
}
