import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  test('renderuje formularz logowania', () => {
    renderWithProviders(<LoginPage />);

    // getByLabelText szuka pola po jego etykiecie — tak jak zrobiłby to człowiek,
    // a nie po klasie CSS czy strukturze HTML
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();

    // getByRole szuka po roli dostępnościowej; "name" to widoczny tekst przycisku
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument();
  });
});
