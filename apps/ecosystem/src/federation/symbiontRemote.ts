/** Stage 5 development address; no registry lookup or runtime config service. */
export function symbiontRemote(entry?: string) {
  return {
    name: 'symbiont',
    type: 'module' as const,
    entry: entry?.trim() || 'http://127.0.0.1:5002/remoteEntry.js',
  };
}
