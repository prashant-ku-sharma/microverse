import { z } from 'zod';
export const remoteIds = [
  'parasite',
  'symbiont',
  'commensal',
  'mutant',
] as const;
export type RemoteId = (typeof remoteIds)[number];
export const compatibilitySchema = z.strictObject({
  hostApi: z.literal(1),
  mycelium: z.literal(1),
  reactMajor: z.literal(19),
  muiMajor: z.literal(9),
});
const version = z
  .string()
  .max(64)
  .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
const remoteSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  version,
  entry: z.url().max(2048),
  enabled: z.boolean(),
  compatibility: compatibilitySchema,
});
export const registrySchema = z.strictObject({
  schemaVersion: z.literal(1),
  features: z.strictObject({
    cartEvents: z.boolean(),
    offerEvents: z.boolean(),
  }),
  remotes: z.strictObject({
    parasite: remoteSchema,
    symbiont: remoteSchema,
    commensal: remoteSchema,
    mutant: remoteSchema,
  }),
});
const registryPath = z
  .string()
  .max(200)
  .regex(/^\/nucleus\/[a-zA-Z0-9_-]+\.json$/);
export const policySchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    environment: z.enum(['development', 'production']),
    registry: registryPath,
    fallback: registryPath,
    trustedOrigins: z
      .array(
        z
          .url()
          .refine(
            (value) => new URL(value).origin === value,
            'Expected an exact origin',
          ),
      )
      .min(1)
      .max(20),
  })
  .refine(
    (policy) => policy.registry !== policy.fallback,
    'Fallback must be a separate snapshot',
  );
export type Registry = z.infer<typeof registrySchema>;
export type Policy = z.infer<typeof policySchema>;
export const releaseSchema = z.strictObject({
  id: z.enum(remoteIds),
  version,
  compatibility: compatibilitySchema,
});
export function validateRegistry(input: unknown, policy: Policy): Registry {
  const registry = registrySchema.parse(input);
  for (const id of remoteIds) {
    const remote = registry.remotes[id];
    const url = new URL(remote.entry);
    if (
      url.username ||
      url.password ||
      url.hash ||
      url.search ||
      !url.pathname.endsWith('.js')
    )
      throw new Error(`NUCLEUS: invalid ${id} entry URL`);
    if (!policy.trustedOrigins.includes(url.origin))
      throw new Error(`NUCLEUS: untrusted ${id} origin`);
    const localHttp =
      policy.environment === 'development' &&
      url.protocol === 'http:' &&
      ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !localHttp)
      throw new Error(`NUCLEUS: insecure ${id} origin`);
    if (
      policy.environment === 'production' &&
      !url.pathname.startsWith(`/releases/${remote.version}/`)
    )
      throw new Error(`NUCLEUS: ${id} needs a versioned release path`);
  }
  return registry;
}
