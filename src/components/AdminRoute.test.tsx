import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, Route, Routes } from 'react-router-dom';
import { renderWithProviders, mockFetch } from '../test-utils';
import { useAuth } from '../context/AuthContext';
import AdminRoute from './AdminRoute';

const loginResponse = (role: 'USER' | 'ADMIN') => ({
  token: 'test-token',
  type: 'Bearer' as const,
  userId: 1,
  email: 'jan@example.com',
  role,
});

const profile = (role: 'USER' | 'ADMIN') => ({
  id: 1,
  email: 'jan@example.com',
  firstName: 'Jan',
  lastName: 'Kowalski',
  birthDate: null,
  role,
});

function LoginButton() {
  const { login } = useAuth();
  return <button onClick={() => login({ email: 'jan@example.com', password: 'haslo123' })}>zaloguj</button>;
}

function renderAdminApp() {
  return renderWithProviders(
    <>
      <LoginButton />
      <Link to="/administracja">otwórz panel</Link>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/administracja" element={<h1>Panel administratora</h1>} />
        </Route>
        <Route path="/kalendarz" element={<h1>Kalendarz</h1>} />
        <Route path="/" element={<h1>Start</h1>} />
      </Routes>
    </>,
    { route: '/' },
  );
}

describe('AdminRoute', () => {
  afterEach(() => jest.restoreAllMocks());

  test('administrator widzi zawartość panelu', async () => {
    mockFetch({ status: 200, body: loginResponse('ADMIN') }, { status: 200, body: profile('ADMIN') });
    renderAdminApp();

    await userEvent.click(screen.getByRole('button', { name: 'zaloguj' }));
    await userEvent.click(screen.getByRole('link', { name: 'otwórz panel' }));

    expect(await screen.findByRole('heading', { name: 'Panel administratora' })).toBeInTheDocument();
  });

  // zwykły użytkownik nie może się dowiedzieć, że panel w ogóle istnieje
  test('zwykły użytkownik jest cicho odsyłany na kalendarz', async () => {
    mockFetch({ status: 200, body: loginResponse('USER') }, { status: 200, body: profile('USER') });
    renderAdminApp();

    await userEvent.click(screen.getByRole('button', { name: 'zaloguj' }));
    await userEvent.click(screen.getByRole('link', { name: 'otwórz panel' }));

    expect(await screen.findByRole('heading', { name: 'Kalendarz' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Panel administratora' })).not.toBeInTheDocument();
    expect(screen.queryByText(/brak uprawnień/i)).not.toBeInTheDocument();
  });
});
