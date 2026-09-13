import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch } from '../test-utils';
import AdminCategoriesPage from './AdminCategoriesPage';

const taniec = { id: 1, name: 'Taniec', color: '#DB2777', iconName: 'music' };
const bieganie = { id: 2, name: 'Bieganie', color: '#16A34A', iconName: 'footprints' };

// kolejność odpowiedzi musi odpowiadać kolejności w Promise.all: najpierw kategorie, potem ikony
const listy = (icons = ['dumbbell', 'music', 'footprints']) => [
  { status: 200, body: [taniec, bieganie] },
  { status: 200, body: icons },
];

describe('AdminCategoriesPage', () => {
  afterEach(() => jest.restoreAllMocks());

  test('pokazuje kategorie jako karty', async () => {
    mockFetch(...listy());
    renderWithProviders(<AdminCategoriesPage />);

    expect(await screen.findByRole('heading', { name: 'Taniec' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bieganie' })).toBeInTheDocument();
  });

  test('siatka ikon powstaje z odpowiedzi serwera, nie z listy we froncie', async () => {
    mockFetch(...listy(['dumbbell', 'music']));
    renderWithProviders(<AdminCategoriesPage />);

    await userEvent.click(await screen.findByRole('button', { name: /Dodaj kategorię/ }));

    const grid = screen.getByRole('radiogroup', { name: 'Ikona kategorii' });
    expect(within(grid).getAllByRole('radio')).toHaveLength(2);
  });

  test('zapisana kategoria pojawia się na liście bez ponownego pobrania', async () => {
    mockFetch(...listy(), { status: 200, body: { id: 3, name: 'Rower', color: '#EA580C', iconName: 'dumbbell' } });
    renderWithProviders(<AdminCategoriesPage />);

    await userEvent.click(await screen.findByRole('button', { name: /Dodaj kategorię/ }));
    await userEvent.type(screen.getByLabelText(/^Nazwa/), 'Rower');
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(await screen.findByRole('heading', { name: 'Rower' })).toBeInTheDocument();
  });

  test('odmowa usunięcia pokazuje komunikat z serwera i zostawia kategorię', async () => {
    const message = 'Kategoria jest używana w 34 treningach. Przepnij je do innej kategorii.';
    mockFetch(...listy(), { status: 409, body: { timestamp: '', status: 409, message } });
    renderWithProviders(<AdminCategoriesPage />);

    const karta = await screen.findByRole('article', { name: 'Taniec' });
    await userEvent.click(within(karta).getByRole('button', { name: 'Usuń' }));
    await userEvent.click(screen.getByRole('button', { name: 'Usuń kategorię' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Taniec' })).toBeInTheDocument();
  });
});
