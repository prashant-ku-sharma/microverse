/** Identical share rules for both builds, including imports made through workspace packages. */
const singleton = (version: string) => ({
  singleton: true,
  version,
  requiredVersion: `^${version}`,
  allowNodeModulesSuffixMatch: true,
});

export const federationShared = {
  react: singleton('19.3.1'),
  'react/jsx-runtime': singleton('19.3.1'),
  'react/jsx-dev-runtime': singleton('19.3.1'),
  'react-dom': singleton('19.3.1'),
  'react-dom/client': singleton('19.3.1'),
  'react-router': singleton('8.5.1'),
  '@mui/material': singleton('9.5.0'),
  '@mui/material/styles': singleton('9.5.0'),
  '@emotion/react': singleton('11.14.0'),
  '@emotion/styled': singleton('11.14.1'),
};
