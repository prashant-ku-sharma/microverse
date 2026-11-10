import { ensureMockApi, requestJson, jsonBody } from '@microverse/mock-utils';
import type { Profile } from '../profile';
import { handlers } from './handlers';
export async function getProfile() {
  await ensureMockApi('profile', handlers);
  return requestJson<Profile>('/api/profile');
}
export async function patchProfile(profile: Partial<Profile>) {
  await ensureMockApi('profile', handlers);
  return requestJson<Profile>('/api/profile', {
    method: 'PATCH',
    ...jsonBody(profile),
  });
}

export async function resetProfile() {
  await ensureMockApi('profile', handlers);
  return requestJson<Profile>('/api/profile', {
    method: 'PATCH',
    headers: { 'x-reset-profile': 'true', 'Content-Type': 'application/json' },
    body: '{}',
  });
}
