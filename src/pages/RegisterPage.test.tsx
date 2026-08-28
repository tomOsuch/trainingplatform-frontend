import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, mockFetch, sampleLoginResponse } from '../test-utils';
import RegisterPage from './RegisterPage';

const invitation = {
  email: 'jan@example.com',
  expiresAt: '2026-09-03T14:22:11.482',
};

const sampleProfile = {
  id: 1,
  email: 'jan@example.com',
  firstName: 'Jan',
  lastName: 'Kowalski',
  birthDate: null,
  role: 'USER' as const,
};

// route można nadpisać, żeby przetestować wejście bez tokenu
function renderRegister(route = '/register?token=zaproszenie-abc') {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/kalendarz" element={<h1>Kalendarz</h1>} />
      <Route path="/login" element={<h1>Logowanie</h1>} />
    </Routes>,
    { route },
  );
}

async function fillForm(overrides: Partial<Record<string, string>> = {}) {
  const values: Record<string, string> = {
    Imię: 'Jan',
    Nazwisko: 'Kowalski',
    Hasło: 'haslo12345',
    'Potwierdź hasło': 'haslo12345',
    ...overrides,
  };

  for (const [label, value] of Object.entries(values)) {
    if (value) await userEvent.type(screen.getByLabelText(new RegExp(`^${label}`)), value);
  }
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

describe('RegisterPage', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('dostęp do formularza', () => {
    test('bez tokenu w adresie nie pokazuje formularza', async () => {
      const fetchSpy = mockFetch();
      renderRegister('/register');

      expect(await screen.findByText(/Konto można założyć wyłącznie z zaproszenia/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/^Imię/)).not.toBeInTheDocument();
      // bez tokenu nie ma czego sprawdzać, więc nie odpytujemy API
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('przy nieważnym zaproszeniu pokazuje komunikat z backendu zamiast formularza', async () => {
      mockFetch({ status: 400, body: { message: 'Zaproszenie wygasło' } });
      renderRegister();

      expect(await screen.findByText('Zaproszenie wygasło')).toBeInTheDocument();
      expect(screen.queryByLabelText(/^Imię/)).not.toBeInTheDocument();
    });

    test('przy ważnym zaproszeniu pokazuje formularz z adresem i datą ważności', async () => {
      mockFetch({ status: 200, body: invitation });
      renderRegister();

      expect(await screen.findByLabelText(/^Imię/)).toBeInTheDocument();
      expect(screen.getByText(/Zaproszenie dla/)).toBeInTheDocument();
      expect(screen.getByText('jan@example.com')).toBeInTheDocument();
      expect(screen.getByText(/03\.09\.2026, 14:22/)).toBeInTheDocument();
    });

    test('email pochodzi z zaproszenia i jest zablokowany do edycji', async () => {
      mockFetch({ status: 200, body: invitation });
      renderRegister();

      const email = await screen.findByDisplayValue('jan@example.com');
      expect(email).toBeDisabled();
    });
  });

  describe('walidacja', () => {
    test('pusty formularz pokazuje błędy i nie wysyła żądania', async () => {
      const fetchSpy = mockFetch({ status: 200, body: invitation });
      renderRegister();

      await screen.findByLabelText(/^Imię/);
      await submit();

      expect(screen.getByText('Imię musi mieć co najmniej 2 znaki')).toBeInTheDocument();
      expect(screen.getByText('Nazwisko musi mieć co najmniej 2 znaki')).toBeInTheDocument();
      expect(screen.getByText('Hasło musi mieć co najmniej 8 znaków')).toBeInTheDocument();
      expect(fetchSpy).toHaveBeenCalledTimes(1); // tylko sprawdzenie zaproszenia
    });

    test('wymaga zgodnych haseł', async () => {
      const fetchSpy = mockFetch({ status: 200, body: invitation });
      renderRegister();

      await screen.findByLabelText(/^Imię/);
      await fillForm({ 'Potwierdź hasło': 'inne-haslo123' });
      await submit();

      expect(screen.getByText('Hasła muszą być identyczne')).toBeInTheDocument();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    test('błąd pola znika, gdy użytkownik zaczyna je poprawiać', async () => {
      mockFetch({ status: 200, body: invitation });
      renderRegister();

      await screen.findByLabelText(/^Imię/);
      await submit();
      expect(screen.getByText('Imię musi mieć co najmniej 2 znaki')).toBeInTheDocument();

      await userEvent.type(screen.getByLabelText(/^Imię/), 'Ja');

      expect(screen.queryByText('Imię musi mieć co najmniej 2 znaki')).not.toBeInTheDocument();
    });
  });

  describe('wysyłka', () => {
    test('wysyła token i adres z zaproszenia, bez potwierdzenia hasła', async () => {
      const fetchSpy = mockFetch(
        { status: 200, body: invitation },
        { status: 201, body: sampleProfile },
        { status: 200, body: sampleLoginResponse },
        { status: 200, body: sampleProfile },
      );
      renderRegister();

      await screen.findByLabelText(/^Imię/);
      await fillForm();
      await submit();

      await screen.findByRole('heading', { name: 'Kalendarz' });

      const [url, options] = fetchSpy.mock.calls[1];
      expect(url).toContain('/auth/register');

      const payload = JSON.parse(options!.body as string);
      expect(payload).toEqual({
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
        password: 'haslo12345',
        token: 'zaproszenie-abc',
      });
      expect(payload).not.toHaveProperty('confirmPassword');
    });

    test('po sukcesie loguje automatycznie i przekierowuje na kalendarz', async () => {
      mockFetch(
        { status: 200, body: invitation },
        { status: 201, body: sampleProfile },
        { status: 200, body: sampleLoginResponse },
        { status: 200, body: sampleProfile },
      );
      renderRegister();

      await screen.findByLabelText(/^Imię/);
      await fillForm();
      await submit();

      expect(await screen.findByRole('heading', { name: 'Kalendarz' })).toBeInTheDocument();
    });

    // REGRESJA: błąd tokenu nie ma swojego pola w formularzu i wcześniej znikał bez śladu
    test('pokazuje błąd tokenu zwrócony przy wysyłce formularza', async () => {
      mockFetch(
        { status: 200, body: invitation },
        {
          status: 400,
          body: { message: 'Błąd walidacji', errors: { token: 'Zaproszenie wygasło' } },
        },
      );
      renderRegister();

      await screen.findByLabelText(/^Imię/);
      await fillForm();
      await submit();

      expect(await screen.findByText('Zaproszenie wygasło')).toBeInTheDocument();
    });

    test('mapuje błędy walidacji pól z backendu', async () => {
      mockFetch(
        { status: 200, body: invitation },
        {
          status: 400,
          body: { message: 'Błąd walidacji', errors: { password: 'Hasło jest zbyt proste' } },
        },
      );
      renderRegister();

      await screen.findByLabelText(/^Imię/);
      await fillForm();
      await submit();

      expect(await screen.findByText('Hasło jest zbyt proste')).toBeInTheDocument();
    });
  });
});
