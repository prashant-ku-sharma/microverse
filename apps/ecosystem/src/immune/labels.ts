import type { RuntimeStatus } from './store';
export const runtimeLabels: Record<RuntimeStatus, string> = {
  'not-loaded': 'Not loaded',
  loading: 'Loading',
  available: 'Available',
  failed: 'Failed',
  'timed-out': 'Timed out',
  incompatible: 'Incompatible',
  disabled: 'Disabled',
};
