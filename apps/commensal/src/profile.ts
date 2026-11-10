import { z } from 'zod';
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
export const profileSchema = z.strictObject({
  name: text(2, 80),
  email: z.email().max(160),
  address: z.strictObject({
    line1: text(3, 160),
    city: text(2, 80),
    region: text(2, 80),
    postalCode: text(3, 12).regex(/^[a-z0-9 -]+$/i),
    country: text(2, 80),
  }),
  preferences: z.strictObject({
    habitat: z.enum([
      'Workspace',
      'Grow kits',
      'Everyday carry',
      'Field tools',
    ]),
    language: z.enum(['English', 'Hindi']),
  }),
  notifications: z.strictObject({
    orderUpdates: z.boolean(),
    offers: z.boolean(),
    productNews: z.boolean(),
  }),
});
export type Profile = z.infer<typeof profileSchema>;
export const PROFILE_KEY = 'microverse:commensal:v1:profile';
export const demoProfile: Profile = {
  name: 'Avery Rao',
  email: 'avery.rao@example.com',
  address: {
    line1: '24 Fern Lane',
    city: 'Bengaluru',
    region: 'Karnataka',
    postalCode: '560001',
    country: 'India',
  },
  preferences: { habitat: 'Workspace', language: 'English' },
  notifications: { orderUpdates: true, offers: false, productNews: true },
};
const recordSchema = z.strictObject({
  schemaVersion: z.literal(1),
  profile: profileSchema,
});
export function readProfile(): { profile: Profile; error: string | null } {
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    return {
      profile: raw
        ? recordSchema.parse(JSON.parse(raw) as unknown).profile
        : structuredClone(demoProfile),
      error: null,
    };
  } catch {
    return {
      profile: structuredClone(demoProfile),
      error:
        'Saved profile could not be read. Your saved data has not been overwritten.',
    };
  }
}
export function saveProfile(value: Profile): Profile {
  const profile = profileSchema.parse(value);
  sessionStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({ schemaVersion: 1, profile }),
  );
  return profile;
}
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
