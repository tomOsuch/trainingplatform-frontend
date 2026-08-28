import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch } from '../test-utils';
import AdminPage from './AdminPage';
import { Invitation } from '../types/invitation';

const pending: Invitation = {
  id: 1,
  email: 'oczekuje@example.com',
  role: 'USER',
  status: 'PENDING',
  invitedByEmail: 'admin@training.local',
  expiresAt: '2026-09-03T14:22:11.482',
  sentAt: '2026-08-27T14:22:11.630',
  createdAt: '2026-08-27T14:22:11.501',
};

const notSent: Invitation = {
  ...pending,
  id: 2,
  email: 'bez-maila@example.com',
  sentAt: null, // mail nie doszedł, choć token jest ważny
};

const accepted: Invitation = {
  ...pending,
  id: 3,
  email: 'wykorzystane@example.com',
  status: 'ACCEPTED',
};

const invite = () => userEvent.click(screen.getByRole('button', { name: 'Wyślij zaproszenie' }));

// wiersz tabeli zawierający dany adres
const rowFor = (email: string): HTMLElement => {
  const row = screen.getAllByRole('row').find((r) => r.textContent?.includes(email));

  if (!row) throw new Error(`Nie znaleziono wiersza dla adresu ${email}`);
  return row;
};

describe('AdminPage', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('lista zaproszeń', () => {
    test('pokazuje zaproszenia pobrane z API', async () => {
      mockFetch({ status: 200, body: [pending, accepted] });
      renderWithProviders(<AdminPage />);

      expect(await screen.findByText('oczekuje@example.com')).toBeInTheDocument();
      expect(screen.getByText('wykorzystane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Oczekuje')).toBeInTheDocument();
      expect(screen.getByText('Wykorzystane')).toBeInTheDocument();
    });

    test('informuje, gdy nie ma żadnych zaproszeń', async () => {
      mockFetch({ status: 200, body: [] });
      renderWithProviders(<AdminPage />);

      expect(await screen.findByText('Nie wystawiono jeszcze żadnych zaproszeń.')).toBeInTheDocument();
    });

    // sentAt: null przy PENDING = zaproszenie istnieje, ale mail nie dotarł
    test('oznacza zaproszenia, których mail nie dotarł', async () => {
      mockFetch({ status: 200, body: [notSent] });
      renderWithProviders(<AdminPage />);

      await screen.findByText(/bez-maila@example\.com/);

      const row = rowFor('bez-maila@example.com');
      expect(within(row).getByText(/mail nie dotarł/)).toBeInTheDocument();
    });

    test('przycisk unieważnienia jest tylko przy oczekujących', async () => {
      mockFetch({ status: 200, body: [pending, accepted] });
      renderWithProviders(<AdminPage />);

      await screen.findByText('oczekuje@example.com');

      expect(within(rowFor('oczekuje@example.com')).getByRole('button', { name: 'Unieważnij' })).toBeInTheDocument();
      expect(within(rowFor('wykorzystane@example.com')).queryByRole('button', { name: 'Unieważnij' })).not.toBeInTheDocument();
    });
  });

  describe('wystawianie zaproszenia', () => {
    test('odrzuca niepoprawny adres bez wysyłania żądania', async () => {
      const fetchSpy = mockFetch({ status: 200, body: [] });
      renderWithProviders(<AdminPage />);

      await screen.findByText('Nie wystawiono jeszcze żadnych zaproszeń.');
      await userEvent.type(screen.getByLabelText(/^Adres email/), 'to-nie-jest-email');
      await invite();

      expect(screen.getByText('Podaj poprawny adres email')).toBeInTheDocument();
      expect(fetchSpy).toHaveBeenCalledTimes(1); // tylko pobranie listy
    });

    test('wysyła adres i rolę, po czym odświeża listę', async () => {
      const fetchSpy = mockFetch(
        { status: 200, body: [] }, // GET przy montowaniu
        { status: 201, body: { ...pending, email: 'nowy@example.com' } }, // POST
        { status: 200, body: [{ ...pending, email: 'nowy@example.com' }] }, // GET po zapisie
      );
      renderWithProviders(<AdminPage />);

      await screen.findByText('Nie wystawiono jeszcze żadnych zaproszeń.');
      await userEvent.type(screen.getByLabelText(/^Adres email/), 'nowy@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/^Rola/), 'ADMIN');
      await invite();

      expect(await screen.findByText('Zaproszenie wysłane na nowy@example.com')).toBeInTheDocument();

      const [url, options] = fetchSpy.mock.calls[1];
      expect(url).toContain('/invitations');
      expect(options!.method).toBe('POST');
      expect(JSON.parse(options!.body as string)).toEqual({
        email: 'nowy@example.com',
        role: 'ADMIN',
      });
    });

    test('pokazuje błąd zwrócony przez backend', async () => {
      mockFetch({ status: 200, body: [] }, { status: 409, body: { message: 'Użytkownik o tym adresie już istnieje' } });
      renderWithProviders(<AdminPage />);

      await screen.findByText('Nie wystawiono jeszcze żadnych zaproszeń.');
      await userEvent.type(screen.getByLabelText(/^Adres email/), 'istnieje@example.com');
      await invite();

      expect(await screen.findByText('Użytkownik o tym adresie już istnieje')).toBeInTheDocument();
    });
  });

  describe('unieważnianie', () => {
    test('wymaga potwierdzenia przed wysłaniem żądania', async () => {
      const fetchSpy = mockFetch({ status: 200, body: [pending] });
      renderWithProviders(<AdminPage />);

      await screen.findByText('oczekuje@example.com');
      await userEvent.click(screen.getByRole('button', { name: 'Unieważnij' }));

      expect(screen.getByRole('button', { name: 'Tak, unieważnij' })).toBeInTheDocument();
      expect(fetchSpy).toHaveBeenCalledTimes(1); // wciąż tylko GET
    });

    test('po potwierdzeniu wysyła DELETE i odświeża listę', async () => {
      const fetchSpy = mockFetch(
        { status: 200, body: [pending] },
        { status: 204 },
        { status: 200, body: [{ ...pending, status: 'REVOKED' }] },
      );
      renderWithProviders(<AdminPage />);

      await screen.findByText('oczekuje@example.com');
      await userEvent.click(screen.getByRole('button', { name: 'Unieważnij' }));
      await userEvent.click(screen.getByRole('button', { name: 'Tak, unieważnij' }));

      expect(await screen.findByText('Unieważnione')).toBeInTheDocument();

      const [url, options] = fetchSpy.mock.calls[1];
      expect(url).toContain('/invitations/1');
      expect(options!.method).toBe('DELETE');
    });

    test('pokazuje komunikat, gdy zaproszenie zostało już wykorzystane', async () => {
      mockFetch({ status: 200, body: [pending] }, { status: 409, body: { message: 'Zaproszenie zostało już wykorzystane' } });
      renderWithProviders(<AdminPage />);

      await screen.findByText('oczekuje@example.com');
      await userEvent.click(screen.getByRole('button', { name: 'Unieważnij' }));
      await userEvent.click(screen.getByRole('button', { name: 'Tak, unieważnij' }));

      expect(await screen.findByText('Zaproszenie zostało już wykorzystane')).toBeInTheDocument();
    });
  });
});
