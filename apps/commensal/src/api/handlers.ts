import { http, HttpResponse } from 'msw';
import { ApiError, mockResponse } from '@microverse/mock-utils';
import {
  demoProfile,
  profileSchema,
  readProfile,
  saveProfile,
} from '../profile';
const patchSchema = profileSchema.partial();
export const handlers = [
  http.get('*/api/profile', ({ request }) =>
    mockResponse(
      'profile',
      request,
      () => {
        const saved = readProfile();
        if (saved.error) throw new ApiError(saved.error, 500);
        return HttpResponse.json(saved.profile);
      },
      () =>
        HttpResponse.json(
          { message: 'No profile is available.' },
          { status: 404 },
        ),
    ),
  ),
  http.patch('*/api/profile', ({ request }) =>
    mockResponse('profile', request, async () => {
      if (request.headers.get('x-reset-profile') === 'true')
        return HttpResponse.json(saveProfile(demoProfile));
      const patch = patchSchema.parse((await request.json()) as unknown);
      const saved = readProfile();
      if (saved.error) throw new ApiError(saved.error, 500);
      return HttpResponse.json(
        saveProfile(profileSchema.parse({ ...saved.profile, ...patch })),
      );
    }),
  ),
];
