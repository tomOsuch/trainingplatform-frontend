import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { renderWithProviders, mockFetch } from '../test-utils';
import ResetPasswordPage from './ResetPasswordPage';

const resetInfo = {
  email: 'jan@example.com',
  expiresAt: '2026-08-27T15:22:11.482',
};

function LoginStub() {
  const location = useLocation();
  const message = (location.state as { message?: string } | null)?.message;
  return (
    <div>
      <h1>Logowanie</h1>
      {message && <p>{message}</p>}
    </div>
  );
}

function renderReset(route = '/reset-password?token=reset-abc') {
  return renderWithProviders(
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/login" element={<LoginStub />} />
      <Route path="/forgot-password" element={<h1>Nie pamiętam hasła</h1>} />
    </Routes>,
    { route },
  );
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Ustaw nowe hasło' }));

async function fillPasswords(pass = 'noweHaslo123', confirm = pass) {
  await userEvent.type(screen.getByLabelText(/^Nowe hasło/), pass);
  await userEvent.type(screen.getByLabelText(/^Potwierdź nowe hasło/), confirm);
}

describe('ResetPasswordPage', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('dostęp do formularza', () => {
    test('bez tokenu nie pokazuje formularza', async () => {
      const fetchSpy = mockFetch();
      renderReset('/reset-password');

      expect(await screen.findByText('Ten adres wymaga linku z wiadomości e-mail.')).toBeInTheDocument();
      expect(screen.queryByLabelText(/^Nowe hasło/)).not.toBeInTheDocument();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('przy wygasłym linku pokazuje komunikat z backendu', async () => {
      mockFetch({ status: 400, body: { message: 'Link wygasł' } });
      renderReset();

      expect(await screen.findByText('Link wygasł')).toBeInTheDocument();
      expect(screen.queryByLabelText(/^Nowe hasło/)).not.toBeInTheDocument();
    });

    test('przy ważnym linku pokazuje formularz z adresem i terminem', async () => {
      mockFetch({ status: 200, body: resetInfo });
      renderReset();

      expect(await screen.findByLabelText(/^Nowe hasło/)).toBeInTheDocument();
      expect(screen.getByText('jan@example.com')).toBeInTheDocument();
      expect(screen.getByText(/27\.08\.2026, 15:22/)).toBeInTheDocument();
    });
  });

  describe('ustawianie hasła', () => {
    test('odrzuca hasło krótsze niż 8 znaków', async () => {
      const fetchSpy = mockFetch({ status: 200, body: resetInfo });
      renderReset();

      await screen.findByLabelText(/^Nowe hasło/);
      await fillPasswords('krotkie');
      await submit();

      expect(screen.getByText('Hasło musi mieć co najmniej 8 znaków')).toBeInTheDocument();
      expect(fetchSpy).toHaveBeenCalledTimes(1); // tylko sprawdzenie tokenu
    });

    test('wymaga zgodnych haseł', async () => {
      const fetchSpy = mockFetch({ status: 200, body: resetInfo });
      renderReset();

      await screen.findByLabelText(/^Nowe hasło/);
      await fillPasswords('noweHaslo123', 'inneHaslo123');
      await submit();

      expect(screen.getByText('Hasła muszą być identyczne')).toBeInTheDocument();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    test('wysyła token i hasło na właściwy endpoint', async () => {
      const fetchSpy = mockFetch({ status: 200, body: resetInfo }, { status: 204 });
      renderReset();

      await screen.findByLabelText(/^Nowe hasło/);
      await fillPasswords();
      await submit();

      await screen.findByRole('heading', { name: 'Logowanie' });

      const [url, options] = fetchSpy.mock.calls[1];
      expect(url).toContain('/auth/password-reset/confirm');
      expect(JSON.parse(options!.body as string)).toEqual({
        token: 'reset-abc',
        password: 'noweHaslo123',
      });
    });

    test('po zmianie hasła przekierowuje na logowanie z komunikatem', async () => {
      mockFetch({ status: 200, body: resetInfo }, { status: 204 });
      renderReset();

      await screen.findByLabelText(/^Nowe hasło/);
      await fillPasswords();
      await submit();

      expect(await screen.findByRole('heading', { name: 'Logowanie' })).toBeInTheDocument();
      expect(screen.getByText('Hasło zostało zmienione. Zaloguj się nowym hasłem.')).toBeInTheDocument();
    });

    test('mapuje błąd hasła zwrócony przez backend', async () => {
      mockFetch(
        { status: 200, body: resetInfo },
        {
          status: 400,
          body: { message: 'Błąd walidacji', errors: { password: 'Hasło jest zbyt proste' } },
        },
      );
      renderReset();

      await screen.findByLabelText(/^Nowe hasło/);
      await fillPasswords();
      await submit();

      expect(await screen.findByText('Hasło jest zbyt proste')).toBeInTheDocument();
    });

    test('pokazuje komunikat, gdy token wygasł między otwarciem a wysłaniem', async () => {
      mockFetch({ status: 200, body: resetInfo }, { status: 400, body: { message: 'Link wygasł' } });
      renderReset();

      await screen.findByLabelText(/^Nowe hasło/);
      await fillPasswords();
      await submit();

      expect(await screen.findByText('Link wygasł')).toBeInTheDocument();
    });
  });
});
