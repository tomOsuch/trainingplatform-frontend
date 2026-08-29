import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { renderWithProviders, mockFetch } from '../test-utils';
import DeleteAccountDialog from './DeleteAccountDialog';

const EMAIL = 'jan@example.com';

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

function renderDialog() {
  return renderWithProviders(
    <Routes>
      <Route path="/profil" element={<DeleteAccountDialog email={EMAIL} onClose={() => {}} />} />
      <Route path="/login" element={<LoginStub />} />
    </Routes>,
    { route: '/profil' },
  );
}

const emailField = () => screen.getByLabelText(/^Przepisz adres konta/);
const passwordField = () => screen.getByLabelText(/^Hasło/);
const deleteButton = () => screen.getByRole('button', { name: 'Usuń konto na zawsze' });

describe('DeleteAccountDialog', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('bariery przed przypadkowym usunięciem', () => {
    test('przycisk jest nieaktywny, dopóki oba pola nie są wypełnione', async () => {
      renderDialog();

      expect(deleteButton()).toBeDisabled();

      await userEvent.type(emailField(), EMAIL);
      expect(deleteButton()).toBeDisabled(); // brakuje hasła

      await userEvent.type(passwordField(), 'haslo12345');
      expect(deleteButton()).toBeEnabled();
    });

    test('przycisk pozostaje nieaktywny przy błędnie przepisanym adresie', async () => {
      renderDialog();

      await userEvent.type(emailField(), 'inny@example.com');
      await userEvent.type(passwordField(), 'haslo12345');

      expect(deleteButton()).toBeDisabled();
    });

    test('porównanie adresu ignoruje wielkość liter i spacje', async () => {
      renderDialog();

      await userEvent.type(emailField(), '  JAN@Example.COM  ');
      await userEvent.type(passwordField(), 'haslo12345');

      expect(deleteButton()).toBeEnabled();
    });

    test('wymienia konkretnie, co zostanie usunięte', () => {
      renderDialog();

      expect(screen.getByText(/zaplanowane treningi/)).toBeInTheDocument();
      expect(screen.getByText(/wpisy w dzienniku/)).toBeInTheDocument();
      expect(screen.getByText('Tej operacji nie można cofnąć.')).toBeInTheDocument();
    });
  });

  describe('usuwanie', () => {
    test('wysyła wyłącznie hasło — przepisany adres zostaje w przeglądarce', async () => {
      const fetchSpy = mockFetch({ status: 204 });
      renderDialog();

      await userEvent.type(emailField(), EMAIL);
      await userEvent.type(passwordField(), 'haslo12345');
      await userEvent.click(deleteButton());

      await screen.findByRole('heading', { name: 'Logowanie' });

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toContain('/profile');
      expect(options!.method).toBe('DELETE');
      expect(JSON.parse(options!.body as string)).toEqual({ password: 'haslo12345' });
    });

    test('po sukcesie czyści sesję i przekierowuje na logowanie z komunikatem', async () => {
      mockFetch({ status: 204 });
      renderDialog();

      await userEvent.type(emailField(), EMAIL);
      await userEvent.type(passwordField(), 'haslo12345');
      await userEvent.click(deleteButton());

      expect(await screen.findByRole('heading', { name: 'Logowanie' })).toBeInTheDocument();
      expect(screen.getByText('Konto zostało usunięte.')).toBeInTheDocument();
    });
  });

  describe('obsługa błędów', () => {
    test('przy złym haśle pokazuje komunikat i NIE wylogowuje', async () => {
      mockFetch({ status: 400, body: { message: 'Nieprawidłowe hasło' } });
      renderDialog();

      await userEvent.type(emailField(), EMAIL);
      await userEvent.type(passwordField(), 'zle-haslo');
      await userEvent.click(deleteButton());

      expect(await screen.findByText('Nieprawidłowe hasło')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: 'Usuń konto na zawsze' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Logowanie' })).not.toBeInTheDocument();
    });

    test('mapuje błąd walidacji hasła z backendu', async () => {
      mockFetch({
        status: 400,
        body: { message: 'Błąd walidacji', errors: { password: 'Hasło jest wymagane' } },
      });
      renderDialog();

      await userEvent.type(emailField(), EMAIL);
      await userEvent.type(passwordField(), 'x');
      await userEvent.click(deleteButton());

      expect(await screen.findByText('Hasło jest wymagane')).toBeInTheDocument();
    });

    test('przy ostatnim administratorze pokazuje komunikat z podpowiedzią', async () => {
      mockFetch({
        status: 403,
        body: { message: 'Nie można usunąć ostatniego administratora' },
      });
      renderDialog();

      await userEvent.type(emailField(), EMAIL);
      await userEvent.type(passwordField(), 'haslo12345');
      await userEvent.click(deleteButton());

      expect(await screen.findByText('Nie można usunąć ostatniego administratora')).toBeInTheDocument();
      expect(screen.getByText(/najpierw zaproś kogoś z rolą administratora/)).toBeInTheDocument();
    });
  });
});
