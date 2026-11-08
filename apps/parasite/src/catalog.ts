import type { Product } from '@microverse/shared-types';

export const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'name', label: 'Name: A–Z' },
] as const;
export type ProductSort = (typeof sortOptions)[number]['value'];
export interface CatalogFilters {
  query: string;
  category: string;
  sort: ProductSort;
  inStockOnly: boolean;
}
export const allCategories = 'All products';

export function readFilters(
  params: URLSearchParams,
  categories: readonly string[],
): CatalogFilters {
  const requestedSort = params.get('sort');
  const sort =
    sortOptions.find((option) => option.value === requestedSort)?.value ??
    'featured';
  const requestedCategory = params.get('category') ?? allCategories;
  return {
    query: params.get('q') ?? '',
    category: categories.includes(requestedCategory)
      ? requestedCategory
      : allCategories,
    sort,
    inStockOnly: params.get('stock') === 'available',
  };
}

/** Derive a view of the catalog without sorting or modifying its source inventory. */
export function selectProducts(
  products: readonly Product[],
  filters: CatalogFilters,
): Product[] {
  const query = filters.query.trim().toLocaleLowerCase('en-IN');
  const result = products.filter(
    (product) =>
      (filters.category === allCategories ||
        product.category === filters.category) &&
      (!filters.inStockOnly || product.stock > 0) &&
      `${product.name} ${product.description} ${product.category}`
        .toLocaleLowerCase('en-IN')
        .includes(query),
  );
  const byName = (a: Product, b: Product) =>
    a.name.localeCompare(b.name, 'en-IN') || a.id.localeCompare(b.id);
  switch (filters.sort) {
    case 'price-asc':
      return result.sort((a, b) => a.price - b.price || byName(a, b));
    case 'price-desc':
      return result.sort((a, b) => b.price - a.price || byName(a, b));
    case 'rating':
      return result.sort((a, b) => b.rating - a.rating || byName(a, b));
    case 'name':
      return result.sort(byName);
    default:
      return result;
  }
}

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}

export function availability(stock: number): {
  label: string;
  tone: 'success' | 'warning' | 'error';
} {
  if (stock <= 0) return { label: 'Out of stock', tone: 'error' };
  if (stock <= 3) return { label: `Only ${stock} left`, tone: 'warning' };
  return { label: 'In stock', tone: 'success' };
}
