import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

export function renderWithProviders(ui: ReactElement, { route = '/', ...options }: RenderWithProvidersOptions = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    ),
    ...options,
  });
}

type MockResponse = { status?: number; body?: unknown };

export function mockFetch(...responses: MockResponse[]) {
  const spy = jest.spyOn(global, 'fetch');

  responses.forEach(({ status = 200, body }) => {
    spy.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      text: async () => (body === undefined ? '' : JSON.stringify(body)),
      json: async () => body,
    } as Response);
  });

  return spy;
}

export const sampleCategories = [
  { id: 1, name: 'Taniec', color: '#9B59B6', iconName: 'dance' },
  { id: 2, name: 'Gimnastyka', color: '#E74C3C', iconName: 'gymnastics' },
];

export const sampleLoginResponse = {
  token: 'test-token-123',
  type: 'Bearer' as const,
  userId: 1,
  email: 'jan@example.com',
  role: 'USER' as const,
};
