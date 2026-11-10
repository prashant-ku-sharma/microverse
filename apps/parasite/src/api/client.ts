import { ensureMockApi, requestJson } from '@microverse/mock-utils';
import type { Product } from '@microverse/shared-types';
import { handlers } from './handlers';
export async function getProducts() {
  await ensureMockApi('products', handlers);
  return requestJson<Product[]>('/api/products');
}
export async function getProduct(id: string) {
  await ensureMockApi('products', handlers);
  return requestJson<Product>(`/api/products/${encodeURIComponent(id)}`);
}
