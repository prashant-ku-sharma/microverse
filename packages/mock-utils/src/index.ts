import { delay, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';
import type { SetupWorker } from 'msw/browser';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
let latency = 240;
/** Deterministic test override; no domain state lives in this package. */
export function setMockLatency(milliseconds: number) {
  latency = milliseconds;
}
export async function mockResponse(
  domain: string,
  request: Request,
  resolve: () => Response | Promise<Response>,
  empty?: () => Response,
): Promise<Response> {
  const scenario =
    request.headers.get('x-mock-scenario') ??
    (typeof location === 'undefined'
      ? null
      : new URL(location.href).searchParams.get(`mock-${domain}`));
  await delay(scenario === 'slow' ? 1200 : latency);
  if (
    scenario === 'error' ||
    (scenario === 'write-error' && request.method !== 'GET')
  )
    return HttpResponse.json(
      { message: `${domain} mock API is temporarily unavailable.` },
      { status: 503 },
    );
  if (scenario === 'empty' && request.method === 'GET' && empty) return empty();
  try {
    return await resolve();
  } catch (error) {
    if (error instanceof ApiError)
      return HttpResponse.json(
        { message: error.message },
        { status: error.status },
      );
    if (
      error instanceof SyntaxError ||
      (error instanceof Error && error.name === 'ZodError')
    )
      return HttpResponse.json(
        { message: 'Invalid request data.' },
        { status: 400 },
      );
    return HttpResponse.json(
      { message: 'Mock persistence failed. Previous saved data was kept.' },
      { status: 500 },
    );
  }
}
interface Transport {
  worker: SetupWorker;
  ready: Promise<unknown>;
  domains: Set<string>;
}
// Federation bundles can contain multiple copies of this utility. Only transport is shared.
const transportKey = Symbol.for('microverse:msw:transport:v1');
type TransportGlobal = typeof globalThis & {
  [transportKey]?: Promise<Transport>;
};
export async function ensureMockApi(
  domain: string,
  handlers: RequestHandler[],
) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator))
    return;
  const root = globalThis as TransportGlobal;
  root[transportKey] ??= import('msw/browser').then(({ setupWorker }) => {
    const worker = setupWorker();
    const ready = worker.start({
      serviceWorker: { url: '/mockServiceWorker.js' },
      onUnhandledFrame: 'bypass',
      quiet: true,
    });
    return { worker, ready, domains: new Set<string>() };
  });
  const transport = await root[transportKey];
  if (!transport.domains.has(domain)) {
    transport.worker.use(...handlers);
    transport.domains.add(domain);
  }
  try {
    await transport.ready;
  } catch (error) {
    delete root[transportKey];
    throw error;
  }
}
export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(new URL(path, location.origin), init);
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }
  return body as T;
}
export const jsonBody = (value: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(value),
});
