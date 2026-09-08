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
        {}
        <AuthProvider restoreOnMount={false}>{children}</AuthProvider>
      </MemoryRouter>
    ),
    ...options,
  });
}

type MockResponse = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

export function mockFetch(...responses: MockResponse[]) {
  const spy = jest.spyOn(global, 'fetch');

  responses.forEach(({ status = 200, body, headers = {} }) => {

    const lookup = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));

    spy.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      headers: { get: (name: string) => lookup[name.toLowerCase()] ?? null },
      text: async () => (body === undefined ? '' : JSON.stringify(body)),
      json: async () => body,
    } as unknown as Response);
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