import {
  useQuery,
  useMutation,
  QueryClientProvider,
} from '@tanstack/react-query';
import { queryClient } from './api/query';
import { getProfile, patchProfile, resetProfile } from './api/client';
import { LoadingIndicator } from '@microverse/shared-ui';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { PageHeader, SurfaceCard } from '@microverse/shared-ui';
import type { CommensalRoutesProps } from '@microverse/shared-types';
import { initials, profileSchema } from './profile';
import type { Profile } from './profile';

function ProfileForm({
  mode = 'standalone',
  initial,
}: CommensalRoutesProps & { initial: Profile }) {
  const [saved, setSaved] = useState<{
    profile: Profile;
    error: string | null;
  }>({ profile: initial, error: null });
  const mutation = useMutation({ mutationFn: patchProfile });
  const [draft, setDraft] = useState<Profile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const current = draft ?? saved.profile;
  const editing = draft !== null;
  function edit() {
    setDraft(structuredClone(saved.profile));
    setErrors({});
    setNotice('');
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = profileSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join('.'),
            issue.message,
          ]),
        ),
      );
      return;
    }
    try {
      const profile = await mutation.mutateAsync(parsed.data);
      queryClient.setQueryData(['profile'], profile);
      setSaved({ profile, error: null });
      setDraft(null);
      setErrors({});
      setNotice('Profile saved in this browser tab.');
    } catch {
      setSaved((previous) => ({
        ...previous,
        error:
          'Profile could not be saved. Your changes are still in the form; try again.',
      }));
    }
  }
  const field = (label: string, key: 'name' | 'email') => (
    <TextField
      label={label}
      type={key === 'email' ? 'email' : 'text'}
      value={current[key]}
      disabled={!editing || mutation.isPending}
      error={Boolean(errors[key])}
      helperText={errors[key]}
      onChange={(event) => setDraft({ ...current, [key]: event.target.value })}
      fullWidth
    />
  );
  return (
    <Box component="section" aria-label="COMMENSAL profile">
      <PageHeader
        eyebrow="COMMENSAL / YOUR PLACE IN THE HABITAT"
        title="Make yourself at home."
        description="The details that make this little corner of the ecosystem yours."
        action={
          <Chip
            label={
              mode === 'embedded'
                ? 'Independent profile organism'
                : 'Standalone profile'
            }
            variant="outlined"
          />
        }
      />
      <Alert severity="info" sx={{ mt: 3 }}>
        Local demo profile. Changes stay in this browser tab; this does not
        create an account.
      </Alert>
      {saved.error && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            <Button
              color="inherit"
              onClick={async () => {
                try {
                  const profile = await resetProfile();
                  queryClient.setQueryData(['profile'], profile);
                  setSaved({ profile, error: null });
                  setDraft(null);
                  setNotice('Demo profile restored.');
                } catch {
                  setNotice('Browser storage is still unavailable.');
                }
              }}
            >
              Reset demo profile
            </Button>
          }
        >
          {saved.error}
        </Alert>
      )}
      <Typography
        role="status"
        aria-live="polite"
        sx={{ mt: 2, color: 'primary.main', minHeight: 24 }}
      >
        {notice}
      </Typography>
      <Box
        component="form"
        noValidate
        onSubmit={submit}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0,1fr)',
            md: 'minmax(220px, .65fr) minmax(0, 1.6fr)',
          },
          gap: 3,
          mt: 2,
          alignItems: 'start',
        }}
      >
        <SurfaceCard
          sx={{
            textAlign: 'center',
            background:
              'radial-gradient(ellipse at 50% 0%, #f1c57915, transparent 75%), #121d18',
          }}
        >
          <Avatar
            role="img"
            aria-label={`${saved.profile.name} avatar`}
            sx={{
              width: 88,
              height: 88,
              mx: 'auto',
              mb: 2.5,
              bgcolor: '#f1c57925',
              color: 'warning.main',
              fontSize: '1.8rem',
              border: '1px solid #f1c57966',
            }}
          >
            {initials(saved.profile.name)}
          </Avatar>
          <Typography variant="overline" color="warning.main">
            ROOTED IN THE ECOSYSTEM
          </Typography>
          <Typography variant="h2" sx={{ mt: 1, overflowWrap: 'anywhere' }}>
            {saved.profile.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, overflowWrap: 'anywhere' }}
          >
            {saved.profile.email}
          </Typography>
          <Chip label={saved.profile.preferences.habitat} sx={{ mt: 2 }} />
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <PlaceOutlinedIcon sx={{ color: 'warning.main' }} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {saved.profile.address.city}, {saved.profile.address.country}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Your profile, independently cared for.
            </Typography>
          </Box>
        </SurfaceCard>
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <SurfaceCard>
            <Stack
              direction="row"
              sx={{
                justifyContent: 'space-between',
                gap: 2,
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography variant="h2">Personal details</Typography>
              {!editing && (
                <Button
                  type="button"
                  startIcon={<EditOutlinedIcon />}
                  onClick={edit}
                >
                  Edit profile
                </Button>
              )}
            </Stack>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                {field('Name', 'name')}
                {field('Email', 'email')}
              </Box>
              <Typography variant="h3" component="h3">
                Address
              </Typography>
              {(
                Object.keys(current.address) as (keyof Profile['address'])[]
              ).map((key) => (
                <TextField
                  key={key}
                  label={
                    {
                      line1: 'Street address',
                      city: 'City',
                      region: 'State or region',
                      postalCode: 'Postal code',
                      country: 'Country',
                    }[key]
                  }
                  value={current.address[key]}
                  disabled={!editing || mutation.isPending}
                  error={Boolean(errors[`address.${key}`])}
                  helperText={errors[`address.${key}`]}
                  onChange={(event) =>
                    setDraft({
                      ...current,
                      address: {
                        ...current.address,
                        [key]: event.target.value,
                      },
                    })
                  }
                  fullWidth
                />
              ))}
            </Stack>
          </SurfaceCard>
          <SurfaceCard>
            <Typography variant="h2" sx={{ mb: 3 }}>
              Your preferences
            </Typography>
            <Stack spacing={2.5}>
              <TextField
                select
                label="Favorite habitat"
                value={current.preferences.habitat}
                disabled={!editing || mutation.isPending}
                onChange={(event) =>
                  setDraft({
                    ...current,
                    preferences: {
                      ...current.preferences,
                      habitat: event.target
                        .value as Profile['preferences']['habitat'],
                    },
                  })
                }
              >
                {[
                  'Workspace',
                  'Grow kits',
                  'Everyday carry',
                  'Field tools',
                ].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Preferred language"
                value={current.preferences.language}
                disabled={!editing || mutation.isPending}
                helperText="Saved preference only; interface translations are not implemented."
                onChange={(event) =>
                  setDraft({
                    ...current,
                    preferences: {
                      ...current.preferences,
                      language: event.target
                        .value as Profile['preferences']['language'],
                    },
                  })
                }
              >
                {['English', 'Hindi'].map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </SurfaceCard>
          <SurfaceCard>
            <Typography variant="h2" sx={{ mb: 1 }}>
              Keep in the loop
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose what interests you. These are saved demo preferences; no
              notifications are sent.
            </Typography>
            <Stack>
              {(
                Object.keys(
                  current.notifications,
                ) as (keyof Profile['notifications'])[]
              ).map((key) => (
                <FormControlLabel
                  key={key}
                  label={
                    {
                      orderUpdates: 'Order updates',
                      offers: 'Offers and coupons',
                      productNews: 'Product discoveries',
                    }[key]
                  }
                  control={
                    <Switch
                      slotProps={{ input: { role: 'switch' } }}
                      checked={current.notifications[key]}
                      disabled={!editing || mutation.isPending}
                      onChange={(_, checked) =>
                        setDraft({
                          ...current,
                          notifications: {
                            ...current.notifications,
                            [key]: checked,
                          },
                        })
                      }
                    />
                  }
                />
              ))}
            </Stack>
          </SurfaceCard>
          {editing && (
            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving profile…' : 'Save profile'}
              </Button>
              <Button
                type="button"
                disabled={mutation.isPending}
                variant="outlined"
                onClick={() => {
                  setDraft(null);
                  setErrors({});
                  setSaved({
                    profile:
                      queryClient.getQueryData<Profile>(['profile']) ?? initial,
                    error: null,
                  });
                  setNotice('Changes discarded.');
                }}
              >
                Cancel
              </Button>
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function CommensalRoutes(props: CommensalRoutesProps) {
  const query = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const reset = useMutation({
    mutationFn: resetProfile,
    onSuccess: (profile) => queryClient.setQueryData(['profile'], profile),
  });
  if (query.isPending) return <LoadingIndicator label="Loading profile…" />;
  if (query.isError)
    return (
      <Alert
        severity="error"
        action={
          <Stack direction="row">
            <Button onClick={() => void query.refetch()}>Retry profile</Button>
            <Button disabled={reset.isPending} onClick={() => reset.mutate()}>
              Reset demo profile
            </Button>
          </Stack>
        }
      >
        {reset.error?.message ?? query.error.message}
      </Alert>
    );
  return <ProfileForm {...props} initial={query.data} />;
}
export default function DataRoutes(
  props: Parameters<typeof CommensalRoutes>[0],
) {
  return (
    <QueryClientProvider client={queryClient}>
      <CommensalRoutes {...props} />
    </QueryClientProvider>
  );
}
