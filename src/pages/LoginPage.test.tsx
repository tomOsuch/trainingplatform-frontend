import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, mockFetch, sampleLoginResponse } from '../test-utils';
import LoginPage from './LoginPage';

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/kalendarz" element={<h1>Kalendarz</h1>} />
    </Routes>,
    { route: '/login' },
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

describe('LoginPage', () => {
  afterEach(() => jest.restoreAllMocks());

  test('renderuje formularz logowania', () => {
    renderLogin();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument();
  });

  test('pusty formularz nie wysyła żądania i pokazuje komunikat', async () => {
    const fetchSpy = mockFetch();
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(screen.getByText('Podaj email i hasło')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('przy 401 pokazuje ogólny komunikat bez wskazania pola', async () => {
    mockFetch({ status: 401, body: { message: 'Bad credentials' } });
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'jan@example.com');
    await userEvent.type(screen.getByLabelText('Hasło'), 'zle-haslo');
    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    // findBy* czeka na pojawienie się elementu — komunikat przychodzi po odpowiedzi z API
    expect(await screen.findByText('Nieprawidłowy email lub hasło')).toBeInTheDocument();

    // kluczowe: komunikat nie może zdradzać, które pole jest błędne
    expect(screen.queryByText(/hasło jest/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/email nie istnieje/i)).not.toBeInTheDocument();
  });

  test('przy 403 informuje o nieaktywnym koncie', async () => {
    mockFetch({ status: 403, body: { message: 'Konto nieaktywne' } });
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'jan@example.com');
    await userEvent.type(screen.getByLabelText('Hasło'), 'haslo123');
    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(await screen.findByText('Konto jest nieaktywne')).toBeInTheDocument();
  });

  test('po poprawnym logowaniu przekierowuje na kalendarz', async () => {
    // dwie odpowiedzi po kolei: najpierw login, potem dociągnięcie profilu
    mockFetch({ status: 200, body: sampleLoginResponse }, { status: 200, body: sampleProfile });
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'jan@example.com');
    await userEvent.type(screen.getByLabelText('Hasło'), 'haslo123');
    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(await screen.findByRole('heading', { name: 'Kalendarz' })).toBeInTheDocument();
  });

  test('wysyła email i hasło do właściwego endpointu', async () => {
    const fetchSpy = mockFetch({ status: 200, body: sampleLoginResponse }, { status: 200, body: sampleProfile });
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), '  jan@example.com  ');
    await userEvent.type(screen.getByLabelText('Hasło'), 'haslo123');
    await userEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await screen.findByRole('heading', { name: 'Kalendarz' });

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/auth/login');
    // email jest przycinany z białych znaków przed wysłaniem
    expect(JSON.parse(options!.body as string)).toEqual({
      email: 'jan@example.com',
      password: 'haslo123',
    });
  });
});
