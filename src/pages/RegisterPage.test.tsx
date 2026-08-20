import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, mockFetch, sampleLoginResponse } from '../test-utils';
import RegisterPage from './RegisterPage';

function renderRegister() {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/kalendarz" element={<h1>Kalendarz</h1>} />
    </Routes>,
    { route: '/register' },
  );
}

const sampleProfile = {
  userId: 1,
  firstName: 'Jan',
  lastName: 'Kowalski',
  email: 'jan@example.com',
  birthDate: null,
  role: 'USER' as const,
};

async function fillForm(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    Imię: 'Jan',
    Nazwisko: 'Kowalski',
    Email: 'jan@example.com',
    Hasło: 'haslo12345',
    'Potwierdź hasło': 'haslo12345',
    ...overrides,
  };

  for (const [label, value] of Object.entries(values)) {
    if (value) await userEvent.type(screen.getByLabelText(label), value);
  }
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

describe('RegisterPage', () => {
  afterEach(() => jest.restoreAllMocks());

  test('renderuje wszystkie pola formularza', () => {
    renderRegister();

    ['Imię', 'Nazwisko', 'Email', 'Hasło', 'Potwierdź hasło'].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  test('pusty formularz pokazuje błędy pod polami i nie wysyła żądania', async () => {
    const fetchSpy = mockFetch();
    renderRegister();

    await submit();

    expect(screen.getByText('Imię musi mieć co najmniej 2 znaki')).toBeInTheDocument();
    expect(screen.getByText('Nazwisko musi mieć co najmniej 2 znaki')).toBeInTheDocument();
    expect(screen.getByText('Podaj poprawny adres email')).toBeInTheDocument();
    expect(screen.getByText('Hasło musi mieć co najmniej 8 znaków')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('odrzuca niepoprawny format emaila', async () => {
    const fetchSpy = mockFetch();
    renderRegister();

    await fillForm({ Email: 'jan.kowalski' });
    await submit();

    expect(screen.getByText('Podaj poprawny adres email')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('odrzuca hasło krótsze niż 8 znaków', async () => {
    const fetchSpy = mockFetch();
    renderRegister();

    await fillForm({ Hasło: 'krotkie', 'Potwierdź hasło': 'krotkie' });
    await submit();

    expect(screen.getByText('Hasło musi mieć co najmniej 8 znaków')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('wymaga zgodnych haseł', async () => {
    const fetchSpy = mockFetch();
    renderRegister();

    await fillForm({ 'Potwierdź hasło': 'inne-haslo123' });
    await submit();

    expect(screen.getByText('Hasła muszą być identyczne')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('przy 409 pokazuje komunikat pod polem email', async () => {
    mockFetch({ status: 409, body: { message: 'Email zajęty' } });
    renderRegister();

    await fillForm();
    await submit();

    expect(await screen.findByText('Ten email jest już zajęty')).toBeInTheDocument();
  });

  test('mapuje błędy walidacji z backendu na właściwe pola', async () => {
    mockFetch({
      status: 400,
      body: {
        message: 'Błąd walidacji',
        errors: { password: 'Hasło jest zbyt proste' },
      },
    });
    renderRegister();

    await fillForm();
    await submit();

    expect(await screen.findByText('Hasło jest zbyt proste')).toBeInTheDocument();
  });

  test('błąd pola znika, gdy użytkownik zaczyna je poprawiać', async () => {
    mockFetch();
    renderRegister();

    await submit();
    expect(screen.getByText('Podaj poprawny adres email')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^Email/), "j");

    expect(screen.queryByText('Podaj poprawny adres email')).not.toBeInTheDocument();
  });

  test('po sukcesie loguje automatycznie i przekierowuje na kalendarz', async () => {
    mockFetch({ status: 201 }, { status: 200, body: sampleLoginResponse }, { status: 200, body: sampleProfile });
    renderRegister();

    await fillForm();
    await submit();

    expect(await screen.findByRole('heading', { name: 'Kalendarz' })).toBeInTheDocument();
  });

  test('nie wysyła potwierdzenia hasła do API', async () => {
    const fetchSpy = mockFetch({ status: 201 }, { status: 200, body: sampleLoginResponse }, { status: 200, body: sampleProfile });
    renderRegister();

    await fillForm();
    await submit();
    await screen.findByRole('heading', { name: 'Kalendarz' });

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/auth/register');

    const payload = JSON.parse(options!.body as string);
    expect(payload).toEqual({
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@example.com',
      password: 'haslo12345',
    });
    expect(payload).not.toHaveProperty('confirmPassword');
  });
});
