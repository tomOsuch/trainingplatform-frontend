import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch } from '../test-utils';
import ForgotPasswordPage from './ForgotPasswordPage';

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Wyślij link' }));

describe('ForgotPasswordPage', () => {
  afterEach(() => jest.restoreAllMocks());

  test('renderuje formularz z polem email', () => {
    renderWithProviders(<ForgotPasswordPage />);

    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wyślij link' })).toBeInTheDocument();
  });

  test('odrzuca niepoprawny format adresu bez wysyłania żądania', async () => {
    const fetchSpy = mockFetch();
    renderWithProviders(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText(/^Email/), 'to-nie-jest-email');
    await submit();

    expect(screen.getByText('Podaj poprawny adres email')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('wysyła adres na właściwy endpoint', async () => {
    const fetchSpy = mockFetch({ status: 202 });
    renderWithProviders(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText(/^Email/), '  jan@example.com  ');
    await submit();

    await screen.findByRole('heading', { name: 'Sprawdź skrzynkę' });

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/auth/password-reset');
    expect(JSON.parse(options!.body as string)).toEqual({ email: 'jan@example.com' });
  });

  test('po wysłaniu pokazuje potwierdzenie zamiast formularza', async () => {
    mockFetch({ status: 202 });
    renderWithProviders(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText(/^Email/), 'jan@example.com');
    await submit();

    expect(await screen.findByRole('heading', { name: 'Sprawdź skrzynkę' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Wyślij link' })).not.toBeInTheDocument();
  });

  // BEZPIECZEŃSTWO: backend zwraca 202 także dla nieistniejącego konta, żeby formularz
  // nie służył do sprawdzania, kto ma konto. Interfejs nie może tego zdradzić.
  test('komunikat nie ujawnia, czy konto istnieje', async () => {
    mockFetch({ status: 202 });
    renderWithProviders(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText(/^Email/), 'nieistniejacy@example.com');
    await submit();

    expect(await screen.findByText(/Jeśli konto o tym adresie istnieje/)).toBeInTheDocument();
    expect(screen.queryByText(/nie ma takiego konta/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nie znaleziono/i)).not.toBeInTheDocument();
  });

  test('pokazuje błąd walidacji adresu zwrócony przez backend', async () => {
    mockFetch({
      status: 400,
      body: { message: 'Błąd walidacji', errors: { email: 'Nieprawidłowy adres' } },
    });
    renderWithProviders(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText(/^Email/), 'jan@example.com');
    await submit();

    expect(await screen.findByText('Nieprawidłowy adres')).toBeInTheDocument();
  });
});
