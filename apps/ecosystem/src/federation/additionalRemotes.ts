export function commensalRemote(entry?: string) {
  return {
    name: 'commensal',
    type: 'module' as const,
    entry: entry?.trim() || 'http://127.0.0.1:5003/remoteEntry.js',
  };
}
export function mutantRemote(entry?: string) {
  return {
    name: 'mutant',
    type: 'module' as const,
    entry: entry?.trim() || 'http://127.0.0.1:5004/remoteEntry.js',
  };
}
