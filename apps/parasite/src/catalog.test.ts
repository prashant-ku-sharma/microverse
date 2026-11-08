import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  allCategories,
  availability,
  formatPrice,
  readFilters,
  selectProducts,
} from './catalog';
import type { CatalogFilters } from './catalog';
import { products } from './data/products';

const defaults: CatalogFilters = {
  query: '',
  category: allCategories,
  sort: 'featured',
  inStockOnly: false,
};

describe('product discovery rules', () => {
  it('combines case-insensitive trimmed search, category, and availability', () => {
    const result = selectProducts(products, {
      ...defaults,
      query: '  KIT  ',
      category: 'Grow kits',
      inStockOnly: true,
    });
    expect(result.map((product) => product.id)).toEqual([
      'canopy-grow-kit',
      'spore-mushroom-kit',
    ]);
    expect(
      selectProducts(products, { ...defaults, query: 'linen' }).map(
        (product) => product.id,
      ),
    ).toEqual(['root-journal']);
  });

  it('sorts prices in both directions without mutating the inventory', () => {
    const originalIds = products.map((product) => product.id);
    const ascending = selectProducts(products, {
      ...defaults,
      sort: 'price-asc',
    });
    const descending = selectProducts(products, {
      ...defaults,
      sort: 'price-desc',
    });
    expect(ascending[0]?.id).toBe('seed-pocket-tin');
    expect(descending[0]?.id).toBe('fern-desk-lamp');
    expect(ascending.map((product) => product.price)).toEqual(
      [...ascending.map((product) => product.price)].sort((a, b) => a - b),
    );
    expect(products.map((product) => product.id)).toEqual(originalIds);
  });

  it('supports rating and alphabetical sorts and deterministic price ties', () => {
    expect(
      selectProducts(products, { ...defaults, sort: 'rating' })[0]?.id,
    ).toBe('field-bottle');
    expect(selectProducts(products, { ...defaults, sort: 'name' })[0]?.id).toBe(
      'canopy-grow-kit',
    );
    const tied = products.map((product) => ({ ...product, price: 100 }));
    expect(
      selectProducts(tied, { ...defaults, sort: 'price-asc' }).map(
        (product) => product.name,
      ),
    ).toEqual(
      tied
        .map((product) => product.name)
        .sort((a, b) => a.localeCompare(b, 'en-IN')),
    );
  });

  it('falls back safely for unknown category and sort URL values', () => {
    expect(
      readFilters(
        new URLSearchParams(
          'category=missing&sort=missing&stock=anything&q=fern',
        ),
        [allCategories, 'Workspace'],
      ),
    ).toEqual({ ...defaults, query: 'fern' });
    expect(
      readFilters(
        new URLSearchParams('category=Workspace&sort=rating&stock=available'),
        [allCategories, 'Workspace'],
      ),
    ).toEqual({
      ...defaults,
      category: 'Workspace',
      sort: 'rating',
      inStockOnly: true,
    });
  });

  it.each([
    [0, 'Out of stock'],
    [-1, 'Out of stock'],
    [1, 'Only 1 left'],
    [3, 'Only 3 left'],
    [4, 'In stock'],
  ])('labels stock %s as %s', (stock, label) => {
    expect(availability(Number(stock)).label).toBe(label);
  });

  it('formats prices in INR and keeps local mock data and images valid', () => {
    expect(formatPrice(1490)).toBe('₹1,490');
    expect(new Set(products.map((product) => product.id)).size).toBe(
      products.length,
    );
    for (const product of products) {
      expect(product.price).toBeGreaterThan(0);
      expect(product.rating).toBeGreaterThanOrEqual(0);
      expect(product.rating).toBeLessThanOrEqual(5);
      expect(Number.isInteger(product.stock)).toBe(true);
      expect(product.stock).toBeGreaterThanOrEqual(0);
      expect(product.features.length).toBeGreaterThan(0);
      expect(
        existsSync(resolve(process.cwd(), 'public', product.image.slice(1))),
      ).toBe(true);
    }
  });
});
