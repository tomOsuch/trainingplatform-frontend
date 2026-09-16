import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch, sampleCategories } from '../test-utils';
import TemplatesPage from './TemplatesPage';

const tpl = (over = {}) => ({
  id: 1,
  name: 'Trening nóg',
  description: 'Przysiady, wykroki, martwy ciąg',
  categoryId: 1,
  categoryName: 'Taniec',
  categoryColor: '#9B59B6',
  categoryIconName: 'music',
  durationMin: 60,
  ...over,
});

const listy = (templates: unknown[]) => [
  { status: 200, body: templates },
  { status: 200, body: sampleCategories },
];

describe('TemplatesPage', () => {
  afterEach(() => jest.restoreAllMocks());

  test('pokazuje szablony z kategorią i czasem', async () => {
    mockFetch(...listy([tpl(), tpl({ id: 2, name: 'Rundka po lesie', durationMin: 45 })]));
    renderWithProviders(<TemplatesPage />);

    expect(await screen.findByText('Trening nóg')).toBeInTheDocument();
    expect(screen.getByText('Rundka po lesie')).toBeInTheDocument();
    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  test('pusta lista tłumaczy, po co są szablony', async () => {
    mockFetch(...listy([]));
    renderWithProviders(<TemplatesPage />);

    expect(await screen.findByText(/Nie masz jeszcze żadnego szablonu/)).toBeInTheDocument();
    expect(screen.getByText(/wzorzec, do którego wracasz/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Utwórz pierwszy szablon' })).toBeInTheDocument();
  });

  test('szablon bez czasu pokazuje kreskę, nie zero', async () => {
    mockFetch(...listy([tpl({ durationMin: null, description: null })]));
    renderWithProviders(<TemplatesPage />);

    const lista = await screen.findByRole('list', { name: 'Szablony treningów' });
    expect(within(lista).getByText('—')).toBeInTheDocument();
    expect(within(lista).getByText('bez opisu')).toBeInTheDocument();
  });

  test('zapisany szablon powoduje ponowne pobranie listy', async () => {
    const spy = mockFetch(
      ...listy([tpl()]),
      { status: 200, body: tpl({ id: 9, name: 'Bieganie' }) },
      // po zapisie odswiezamy wylacznie liste szablonow — kategorie pobieraja sie raz, przy wejsciu
      { status: 200, body: [tpl({ id: 9, name: 'Bieganie' }), tpl()] },
    );
    renderWithProviders(<TemplatesPage />);

    await screen.findByText('Trening nóg');
    await userEvent.click(screen.getByRole('button', { name: '+ Nowy szablon' }));
    await userEvent.type(screen.getByLabelText(/^Nazwa/), 'Bieganie');
    await userEvent.selectOptions(screen.getByLabelText(/^Kategoria/), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz szablon' }));

    expect(await screen.findByText('Bieganie')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(4);
  });

  test('usunięcie zdejmuje wiersz z listy', async () => {
    mockFetch(...listy([tpl()]), { status: 200, body: undefined });
    renderWithProviders(<TemplatesPage />);

    await screen.findByText('Trening nóg');
    await userEvent.click(screen.getByRole('button', { name: 'Usuń' }));
    await userEvent.click(screen.getByRole('button', { name: 'Usuń szablon' }));

    expect(await screen.findByText(/Nie masz jeszcze żadnego szablonu/)).toBeInTheDocument();
  });

  test('edycja podmienia wiersz bez ponownego pobrania listy', async () => {
    const spy = mockFetch(...listy([tpl()]), { status: 200, body: tpl({ name: 'Trening nóg B' }) });
    renderWithProviders(<TemplatesPage />);

    await screen.findByText('Trening nóg');
    await userEvent.click(screen.getByRole('button', { name: 'Edytuj' }));

    const nazwa = screen.getByLabelText(/^Nazwa/);
    await userEvent.clear(nazwa);
    await userEvent.type(nazwa, 'Trening nóg B');
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz szablon' }));

    expect(await screen.findByText('Trening nóg B')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(3);
  });

  test('błąd pola z serwera ląduje przy tym polu', async () => {
    mockFetch(...listy([tpl()]), {
      status: 400,
      body: {
        timestamp: '',
        status: 400,
        message: 'Błąd walidacji',
        errors: { name: 'Nazwa może mieć maksymalnie 200 znaków' },
      },
    });
    renderWithProviders(<TemplatesPage />);

    await screen.findByText('Trening nóg');
    await userEvent.click(screen.getByRole('button', { name: 'Edytuj' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz szablon' }));

    expect(await screen.findByText('Nazwa może mieć maksymalnie 200 znaków')).toBeInTheDocument();
  });
});
