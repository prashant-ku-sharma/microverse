import type { CartItem } from '../cart';

// SYMBIONT-owned test data; no imports from PARASITE or business event delivery.
const assetOrigin = import.meta.url;
export const sampleCart: readonly CartItem[] = [
  {
    id: 'lumen-light',
    name: 'Lumen task light',
    category: 'WORKSPACE',
    description: 'Warm light. A little more focus.',
    image: new URL('/images/lumen-light.svg', assetOrigin).href,
    unitPricePaise: 329900,
    quantity: 1,
    stock: 4,
  },
  {
    id: 'arc-mug',
    name: 'Arc ceramic mug',
    category: 'EVERYDAY',
    description: 'A slower start, in sage green.',
    image: new URL('/images/arc-mug.svg', assetOrigin).href,
    unitPricePaise: 79900,
    quantity: 2,
    stock: 6,
  },
  {
    id: 'seed-notebook',
    name: 'Seed pocket notebook',
    category: 'STATIONERY',
    description: 'Room for ideas to take root.',
    image: new URL('/images/seed-notebook.svg', assetOrigin).href,
    unitPricePaise: 44900,
    quantity: 1,
    stock: 8,
  },
];
