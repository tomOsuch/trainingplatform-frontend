import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch, sampleCategories } from '../test-utils';
import GoalForm from './GoalForm';
import { Goal } from '../types/goal';

const existing: Goal = {
  id: 7,
  title: 'Przetańczyć 20 godzin',
  description: null,
  categoryId: 1,
  categoryName: 'Taniec',
  categoryColor: '#9B59B6',
  metric: 'MINUTES',
  targetValue: 1200,
  currentValue: 720,
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  targetReached: false,
  achievedAt: null,
  achievedValue: null,
};

const noop = () => {};
const save = () => userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

// komunikat błędu renderuje się wewnątrz <label>, więc getByLabelText musi być regexem
const field = (label: string) => screen.getByLabelText(new RegExp(`^${label}`));

describe('GoalForm', () => {
  afterEach(() => jest.restoreAllMocks());

  test('nie wysyła żądania przy pustym tytule i zerowej wartości', async () => {
    const spy = mockFetch();
    renderWithProviders(<GoalForm categories={sampleCategories} onClose={noop} onSaved={noop} />);

    await userEvent.type(field('Wartość docelowa'), '0');
    await save();

    expect(await screen.findByText('Podaj tytuł celu')).toBeInTheDocument();
    expect(screen.getByText('Wartość docelowa musi być większa od 0')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  test('termin wcześniejszy niż data początkowa blokuje zapis', async () => {
    const spy = mockFetch();
    renderWithProviders(<GoalForm categories={sampleCategories} goal={existing} onClose={noop} onSaved={noop} />);

    await userEvent.clear(field('Termin'));
    await userEvent.type(field('Termin'), '2026-08-01');
    await save();

    expect(await screen.findByText('Termin nie może być wcześniejszy niż data początkowa')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  test('miniony termin tylko ostrzega i nie blokuje zapisu', async () => {
    const spy = mockFetch({ status: 200, body: existing });
    renderWithProviders(<GoalForm categories={sampleCategories} goal={existing} onClose={noop} onSaved={noop} />);

    await userEvent.clear(field('Od'));
    await userEvent.type(field('Od'), '2020-01-01');
    await userEvent.clear(field('Termin'));
    await userEvent.type(field('Termin'), '2020-02-01');

    expect(await screen.findByText('Wybrany termin już minął.')).toBeInTheDocument();

    await save();
    expect(spy).toHaveBeenCalled();
  });

  test('przełącznik miary zmienia jednostkę i zachowuje wartość', async () => {
    mockFetch();
    renderWithProviders(<GoalForm categories={sampleCategories} onClose={noop} onSaved={noop} />);

    await userEvent.type(field('Wartość docelowa'), '20');
    expect(screen.getByText('sesji')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Liczba minut' }));

    expect(screen.getByText('20 min')).toBeInTheDocument();
    expect(field('Wartość docelowa')).toHaveValue('20');
  });

  test('tryb dodawania wysyła POST z wybraną miarą', async () => {
    const spy = mockFetch({ status: 201, body: existing });
    renderWithProviders(<GoalForm categories={sampleCategories} onClose={noop} onSaved={noop} />);

    await userEvent.type(field('Tytuł'), '20 treningów');
    await userEvent.type(field('Wartość docelowa'), '20');
    await save();

    const [url, options] = spy.mock.calls[0];
    expect(url).toContain('/goals');
    expect(options?.method).toBe('POST');
    expect(JSON.parse(String(options?.body))).toMatchObject({
      title: '20 treningów',
      metric: 'SESSIONS',
      targetValue: 20,
    });
  });

  test('tryb edycji wysyła PUT pod adres celu', async () => {
    const spy = mockFetch({ status: 200, body: existing });
    renderWithProviders(<GoalForm categories={sampleCategories} goal={existing} onClose={noop} onSaved={noop} />);

    await save();

    const [url, options] = spy.mock.calls[0];
    expect(url).toContain('/goals/7');
    expect(options?.method).toBe('PUT');
  });

  test('błędy walidacji z backendu trafiają pod pola', async () => {
    mockFetch({ status: 400, body: { message: 'Błąd walidacji', errors: { targetValue: 'Wartość docelowa musi być większa od 0' } } });
    renderWithProviders(<GoalForm categories={sampleCategories} goal={existing} onClose={noop} onSaved={noop} />);

    await save();

    expect(await screen.findByText('Wartość docelowa musi być większa od 0')).toBeInTheDocument();
  });

  test('usunięcie wymaga potwierdzenia i informuje o treningach', async () => {
    const spy = mockFetch({ status: 204 });
    renderWithProviders(<GoalForm categories={sampleCategories} goal={existing} onClose={noop} onSaved={noop} />);

    await userEvent.click(screen.getByRole('button', { name: 'Usuń cel' }));
    expect(screen.getByText('Na pewno usunąć? Treningi z dziennika zostają.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tak, usuń' }));

    const [url, options] = spy.mock.calls[0];
    expect(url).toContain('/goals/7');
    expect(options?.method).toBe('DELETE');
  });
});
