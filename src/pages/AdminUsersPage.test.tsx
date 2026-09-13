import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch } from '../test-utils';
import { useAuth } from '../context/AuthContext';
import AdminUsersPage from './AdminUsersPage';

const user = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  email: 'anna.nowak@example.com',
  firstName: 'Anna',
  lastName: 'Nowak',
  role: 'USER',
  active: true,
  createdAt: '2026-05-21T10:00:00',
  ...over,
});

const strona = (content: unknown[], over: Partial<Record<string, unknown>> = {}) => ({
  status: 200,
  body: { content, page: 0, size: 20, totalElements: content.length, totalPages: 1, ...over },
});

describe('AdminUsersPage', () => {
  afterEach(() => jest.restoreAllMocks());

  test('pokazuje konta z adresem pod nazwiskiem', async () => {
    mockFetch(strona([user(), user({ id: 2, firstName: 'Marek', lastName: 'Wiśniewski', email: 'marek@example.com' })]));
    renderWithProviders(<AdminUsersPage />);

    expect(await screen.findByText('Nowak Anna')).toBeInTheDocument();
    expect(screen.getByText('anna.nowak@example.com')).toBeInTheDocument();
  });

  test('zmiana filtru stanu odpytuje serwer z parametrem status', async () => {
    const spy = mockFetch(strona([user()]), strona([]));
    renderWithProviders(<AdminUsersPage />);

    await screen.findByText('Nowak Anna');
    await userEvent.selectOptions(screen.getByLabelText('Stan konta'), 'INACTIVE');

    expect(await screen.findByText(/Żadne konto nie pasuje/)).toBeInTheDocument();
    expect(String(spy.mock.calls[1][0])).toContain('status=INACTIVE');
  });

  test('wyłączenie konta podmienia wiersz bez ponownego pobrania listy', async () => {
    const spy = mockFetch(strona([user()]), { status: 200, body: user({ active: false }) });
    renderWithProviders(<AdminUsersPage />);

    await screen.findByText('Nowak Anna');
    await userEvent.click(screen.getByRole('button', { name: 'Wyłącz' }));
    await userEvent.click(screen.getByRole('button', { name: 'Wyłącz konto' }));

    expect(await screen.findByRole('button', { name: 'Włącz z powrotem' })).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('odmowa z serwera zostaje w oknie potwierdzenia i nie zmienia wiersza', async () => {
    const message = 'To ostatnie aktywne konto administratora — po jego wyłączeniu nikt nie odzyska dostępu do panelu';
    mockFetch(strona([user({ role: 'ADMIN' })]), { status: 403, body: { timestamp: '', status: 403, message } });
    renderWithProviders(<AdminUsersPage />);

    await screen.findByText('Nowak Anna');
    await userEvent.click(screen.getByRole('button', { name: 'Wyłącz' }));
    await userEvent.click(screen.getByRole('button', { name: 'Wyłącz konto' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    const lista = screen.getByRole('list', { name: 'Konta użytkowników' });
    expect(within(lista).getByText('Aktywne')).toBeInTheDocument();
  });

  test('ostatnia strona wyłącza przycisk „Następna"', async () => {
    mockFetch(strona([user()], { page: 1, totalElements: 21, totalPages: 2 }));
    renderWithProviders(<AdminUsersPage />);

    await screen.findByText('Nowak Anna');
    expect(screen.getByRole('button', { name: 'Następna' })).toBeDisabled();
  });

  test('własne konto ma akcję wyszarzoną z wyjaśnieniem', async () => {
    mockFetch(
      { status: 200, body: { token: 't', type: 'Bearer', userId: 7, email: 'ja@example.com', role: 'ADMIN' } },
      { status: 200, body: { id: 7, email: 'ja@example.com', firstName: 'Tomasz', lastName: 'Osuch', birthDate: null, role: 'ADMIN' } },
      strona([user({ id: 7, firstName: 'Tomasz', lastName: 'Osuch', email: 'ja@example.com', role: 'ADMIN' })]),
    );

    function Gate() {
      const { login, isAuthenticated } = useAuth();
      return isAuthenticated ? (
        <AdminUsersPage />
      ) : (
        <button onClick={() => login({ email: 'ja@example.com', password: 'haslo123' })}>zaloguj</button>
      );
    }

    renderWithProviders(<Gate />);
    await userEvent.click(screen.getByRole('button', { name: 'zaloguj' }));

    const lista = await screen.findByRole('list', { name: 'Konta użytkowników' });
    const wiersz = within(lista).getByRole('listitem');
    expect(within(wiersz).getByRole('button', { name: 'Wyłącz' })).toBeDisabled();
    expect(within(wiersz).getByRole('note')).toHaveTextContent(/własnego konta/);
  });
});
