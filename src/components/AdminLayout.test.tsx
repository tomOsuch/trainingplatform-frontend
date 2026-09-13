import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigate, Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test-utils';
import AdminLayout from './AdminLayout';

function renderAdmin(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/kategorie" replace />} />
        <Route path="kategorie" element={<h2>Treść kategorii</h2>} />
        <Route path="uzytkownicy" element={<h2>Treść użytkowników</h2>} />
        <Route path="zaproszenia" element={<h2>Treść zaproszeń</h2>} />
      </Route>
      <Route path="/administracja" element={<Navigate to="/admin/zaproszenia" replace />} />
    </Routes>,
    { route },
  );
}

describe('AdminLayout', () => {
  test('wejście na /admin ląduje na zakładce kategorii', async () => {
    renderAdmin('/admin');

    expect(await screen.findByRole('heading', { name: 'Treść kategorii' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kategorie' })).toHaveAttribute('aria-current', 'page');
  });

  test('przełączenie zakładki zmienia treść i zaznaczenie', async () => {
    renderAdmin('/admin/kategorie');

    await userEvent.click(screen.getByRole('link', { name: 'Użytkownicy' }));

    expect(await screen.findByRole('heading', { name: 'Treść użytkowników' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Treść kategorii' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Użytkownicy' })).toHaveAttribute('aria-current', 'page');
  });

  test('stary adres /administracja prowadzi na zaproszenia', async () => {
    renderAdmin('/administracja');

    expect(await screen.findByRole('heading', { name: 'Treść zaproszeń' })).toBeInTheDocument();
  });
});