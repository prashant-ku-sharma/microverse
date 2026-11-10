import { useEffect } from 'react';
import { StandaloneShell } from '@microverse/shared-ui';
import Routes from './routes';
export default function App() {
  const name = import.meta.env.VITE_APP_LABEL?.trim() || 'MUTANT';
  useEffect(() => {
    document.title = `${name} | MICROVERSE`;
  }, [name]);
  return (
    <StandaloneShell
      name={name}
      description="COUPONS & POSSIBILITIES"
      accent="coral"
    >
      <Routes />
    </StandaloneShell>
  );
}
