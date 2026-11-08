import type { ReactNode } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import type { ButtonProps, CardProps } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { organismColors } from './tokens';
import type { OrganismAccent } from './tokens';

export function ActionButton({
  intent = 'primary',
  ...props
}: Omit<ButtonProps, 'variant'> & { intent?: 'primary' | 'secondary' }) {
  return (
    <Button
      variant={intent === 'primary' ? 'contained' : 'outlined'}
      {...props}
    />
  );
}

export function SurfaceCard({ children, sx, ...props }: CardProps) {
  return (
    <Card
      {...props}
      sx={[{ p: { xs: 2.5, sm: 3 } }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {children}
    </Card>
  );
}

export function StatusIndicator({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'error';
}) {
  const color = {
    neutral: '#a5b8ac',
    success: organismColors.emerald,
    warning: organismColors.amber,
    error: organismColors.coral,
  }[tone];
  return (
    <Stack
      component="span"
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', color, fontSize: '0.72rem', fontWeight: 600 }}
    >
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: color,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </Stack>
  );
}

export function LoadingIndicator({
  label = 'Loading organism…',
}: {
  label?: string;
}) {
  return (
    <Stack role="status" spacing={2} sx={{ alignItems: 'center', py: 5 }}>
      <CircularProgress size={26} aria-hidden="true" />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={3}
      sx={{
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="overline" color="primary">
          {eyebrow}
        </Typography>
        <Typography variant="h1" sx={{ mt: 1, mb: 2 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 620 }}>
          {description}
        </Typography>
      </Box>
      {action}
    </Stack>
  );
}

/** Decorative code-native mark, not an organism health measurement. */
export function OrganismMark({
  accent = 'emerald',
  size = 48,
}: {
  accent?: OrganismAccent;
  size?: number;
}) {
  const color = organismColors[accent];
  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        display: 'inline-flex',
        width: size,
        height: size,
        color,
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 64 64" fill="none" width="100%" height="100%">
        <path
          d="M34 4C49 5 61 19 57 34S43 62 27 59 4 43 6 28 19 3 34 4Z"
          fill={alpha(color, 0.08)}
          stroke="currentColor"
        />
        <path
          d="M21 18C31 10 48 19 47 32S33 49 23 43 11 27 21 18Z"
          stroke="currentColor"
          strokeOpacity=".55"
        />
        <circle
          cx="32"
          cy="31"
          r="7"
          fill={alpha(color, 0.3)}
          stroke="currentColor"
        />
        <circle cx="48" cy="17" r="3" fill="currentColor" />
        <circle cx="15" cy="43" r="2" fill="currentColor" />
      </svg>
    </Box>
  );
}

export function OrganismCard({
  name,
  title,
  description,
  accent,
  index,
  action,
  statusLabel = 'Placeholder',
}: {
  name: string;
  title: string;
  description: string;
  accent: OrganismAccent;
  index: string;
  action: ReactNode;
  statusLabel?: string;
}) {
  const color = organismColors[accent];
  return (
    <SurfaceCard
      component="article"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 24,
          right: 24,
          height: '1px',
          background: `linear-gradient(90deg, ${color}, transparent)`,
        },
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}
      >
        <OrganismMark accent={accent} />
        <Typography variant="overline" color="text.secondary">
          ORGANISM / {index}
        </Typography>
      </Stack>
      <Typography variant="overline" sx={{ color }}>
        {name}
      </Typography>
      <Typography variant="h3" component="h3" sx={{ mt: 0.5, mb: 1 }}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, flexGrow: 1 }}
      >
        {description}
      </Typography>
      <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <StatusIndicator label={statusLabel} />
          {action}
        </Stack>
      </Box>
    </SurfaceCard>
  );
}
