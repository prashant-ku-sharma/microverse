export type FailureKind = 'failed' | 'timed-out' | 'incompatible';
export type FailurePhase =
  'configuration' | 'release' | 'load' | 'render' | 'service';
export class RemoteFailure extends Error {
  constructor(
    public readonly kind: FailureKind,
    public readonly phase: FailurePhase,
    message: string,
  ) {
    super(message);
    this.name = 'RemoteFailure';
  }
}
export function describeFailure(
  error: unknown,
  phase: FailurePhase,
): RemoteFailure {
  return error instanceof RemoteFailure
    ? error
    : new RemoteFailure(
        'failed',
        phase,
        phase === 'render'
          ? 'The remote view could not render.'
          : phase === 'configuration'
            ? 'Trusted runtime configuration is unavailable.'
            : phase === 'service'
              ? 'The remote background service could not start.'
              : 'The remote module could not be loaded.',
      );
}
