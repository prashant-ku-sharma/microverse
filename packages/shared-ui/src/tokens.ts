/** One spacing unit is 8px; use MUI sx spacing values rather than raw pixels. */
export const layoutTokens = {
  sidebarWidth: 248,
  contentMaxWidth: 1440,
} as const;

export const organismColors = {
  emerald: '#73e5b0',
  blue: '#89baff',
  violet: '#b9a2ff',
  amber: '#f1c579',
  coral: '#ffab9c',
} as const;
export type OrganismAccent = keyof typeof organismColors;
