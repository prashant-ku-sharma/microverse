export class RemoteDisabledError extends Error {
  constructor() {
    super('This capability is disabled in the runtime configuration.');
    this.name = 'RemoteDisabledError';
  }
}
