import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse, delay } from 'msw';
import { server } from './test-setup';
import { getProducts, getProduct } from './client';
import Routes from '../routes';
beforeEach(() => sessionStorage.clear());
describe('PARASITE mock API', () => {
  it('serves deterministic list and detail with a real 404', async () => {
    const products = await getProducts();
    expect(products).toHaveLength(12);
    expect(await getProduct(products[0]!.id)).toMatchObject({
      id: products[0]!.id,
      stock: 18,
    });
    await expect(getProduct('missing')).rejects.toMatchObject({ status: 404 });
  });
  it('simulates a failing API and an empty collection', async () => {
    const failed = await fetch('http://localhost:3000/api/products', {
      headers: { 'x-mock-scenario': 'error' },
    });
    expect(failed.status).toBe(503);
    const empty = await fetch('http://localhost:3000/api/products', {
      headers: { 'x-mock-scenario': 'empty' },
    });
    expect(await empty.json()).toEqual([]);
  });
  it('shows loading, error and successful retry', async () => {
    server.use(
      http.get('*/api/products', async () => {
        await delay(40);
        return HttpResponse.json(
          { message: 'Collection unavailable' },
          { status: 503 },
        );
      }),
    );
    render(
      <MemoryRouter>
        <Routes />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Loading collection…')).toBeVisible();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Collection unavailable',
    );
    server.resetHandlers();
    fireEvent.click(screen.getByRole('button', { name: 'Retry products' }));
    expect(await screen.findAllByRole('article')).toHaveLength(12);
  });
  it('renders the API empty state without invented products', async () => {
    server.use(http.get('*/api/products', () => HttpResponse.json([])));
    render(
      <MemoryRouter>
        <Routes />
      </MemoryRouter>,
    );
    expect(await screen.findByText('No products found')).toBeVisible();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
