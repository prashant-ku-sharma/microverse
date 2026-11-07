import type { OrganismAccent } from '@microverse/shared-ui';

/** Host navigation metadata only; no business data or remote imports. */
export const organisms: readonly {
  name: string;
  title: string;
  route: string;
  role: string;
  description: string;
  accent: OrganismAccent;
}[] = [
  {
    name: 'PARASITE',
    title: 'Products',
    route: '/products',
    role: 'Product discovery',
    description:
      'Discover a world of products. An independent organism for exploration and discovery.',
    accent: 'blue',
  },
  {
    name: 'SYMBIONT',
    title: 'Cart',
    route: '/cart',
    role: 'Cart and checkout',
    description:
      'Bring your discoveries together. A dedicated home for the cart and checkout journey.',
    accent: 'violet',
  },
  {
    name: 'COMMENSAL',
    title: 'Profile',
    route: '/profile',
    role: 'User profile',
    description:
      'Your place in the ecosystem. A self-contained space for identity and preferences.',
    accent: 'amber',
  },
  {
    name: 'MUTANT',
    title: 'Offers',
    route: '/offers',
    role: 'Coupons and promotions',
    description:
      'Find a little unexpected value. An evolving habitat for offers and promotions.',
    accent: 'coral',
  },
];
