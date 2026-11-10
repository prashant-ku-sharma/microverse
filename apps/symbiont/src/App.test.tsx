import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import App from './App';
import { server } from './api/test-setup';
import { cartService } from './cart-service';
import Routes from './routes';
vi.mock('./data/sample-cart', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./data/sample-cart')>();
  return {
    sampleCart: actual.sampleCart.map((item) => ({
      ...item,
      image: new URL(new URL(item.image).pathname, 'http://127.0.0.1:5002')
        .href,
    })),
  };
});
beforeEach(() => {
  sessionStorage.clear();
  cartService.reset();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});
async function sample() {
  const view = render(<App />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Load sample cart' }),
  );
  await screen.findByTestId('total');
  return view;
}
describe('SYMBIONT API-backed cart UI', () => {
  it('loads its cart and standalone shell', async () => {
    await sample();
    expect(screen.getByRole('banner')).toHaveTextContent('SYMBIONT');
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByTestId('total')).toHaveTextContent('₹5,445.00');
  });
  it('PATCHes quantities and keeps stock guards', async () => {
    const user = userEvent.setup();
    await sample();
    await user.click(
      screen.getByRole('button', {
        name: 'Increase Lumen task light quantity',
      }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('total')).toHaveTextContent('₹8,744.00'),
    );
    expect(
      screen.getByLabelText('Lumen task light quantity'),
    ).toHaveTextContent('2');
  });
  it('DELETEs items, clears and restores the collection', async () => {
    const user = userEvent.setup();
    await sample();
    for (const name of [
      'Arc ceramic mug',
      'Lumen task light',
      'Seed pocket notebook',
    ]) {
      await user.click(screen.getByRole('button', { name: `Remove ${name}` }));
      await waitFor(() =>
        expect(screen.queryByRole('article', { name })).not.toBeInTheDocument(),
      );
    }
    expect(
      screen.getByRole('heading', { name: 'Room for something good.' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Load sample cart' }));
    await screen.findByTestId('total');
    await user.click(screen.getByRole('button', { name: 'Clear cart' }));
    await screen.findByRole('heading', { name: 'Room for something good.' });
  });
  it('keeps persisted quantities after an API failure and allows retry', async () => {
    await sample();
    server.use(
      http.patch('*/api/cart/items/:id', () =>
        HttpResponse.json({ message: 'Quantity unavailable' }, { status: 503 }),
      ),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Increase Lumen task light quantity',
      }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Quantity unavailable',
    );
    expect(
      screen.getByLabelText('Lumen task light quantity'),
    ).toHaveTextContent('1');
    expect(cartService.getSnapshot().cart.items[0]?.quantity).toBe(1);
    server.resetHandlers();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    );
  });
  it('locks editing and confirms an immutable checkout receipt', async () => {
    await sample();
    fireEvent.click(screen.getByRole('button', { name: 'Simulate checkout' }));
    await screen.findByRole('button', { name: 'Simulating checkout…' });
    expect(screen.getByRole('button', { name: 'Clear cart' })).toBeDisabled();
    const heading = await screen.findByRole(
      'heading',
      { name: 'Demo order confirmed' },
      { timeout: 2000 },
    );
    expect(heading).toHaveFocus();
    expect(screen.getByText('₹5,445.00')).toBeVisible();
    expect(
      within(screen.getByRole('list')).getAllByRole('listitem'),
    ).toHaveLength(3);
  });
  it('shows delayed loading and contains read failure inside the Host', async () => {
    server.use(
      http.get('*/api/cart', async () => {
        await delay(40);
        return HttpResponse.json(
          { message: 'Cart unavailable' },
          { status: 503 },
        );
      }),
    );
    document.title = 'Cart | MICROVERSE';
    render(
      <main>
        <Routes mode="embedded" />
      </main>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading cart');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cart unavailable',
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(document.title).toBe('Cart | MICROVERSE');
  });
  it('cancels a checkout lifetime when its final UI owner unmounts', async () => {
    const view = await sample();
    fireEvent.click(screen.getByRole('button', { name: 'Simulate checkout' }));
    await screen.findByRole('button', { name: 'Simulating checkout…' });
    view.unmount();
    expect(cartService.getSnapshot().cart.phase).toBe('cart');
  });
});
