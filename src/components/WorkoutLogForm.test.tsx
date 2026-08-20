import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch, sampleCategories } from '../test-utils';
import WorkoutLogForm from './WorkoutLogForm';
import { WorkoutLog } from '../types/workout';
import { fireEvent, screen } from "@testing-library/react";

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const oldLog: WorkoutLog = {
  id: 3,
  title: 'Poranny bieg',
  categoryId: 2,
  categoryName: 'Gimnastyka',
  categoryColor: '#E74C3C',
  planId: null,
  performedDate: iso(-45),
  performedTime: '07:00',
  durationMin: 30,
  intensity: 6,
  notes: 'lekko',
};

function setSlider(slider: HTMLElement, value: number) {
  fireEvent.change(slider, { target: { value: String(value) } });
}

const noop = () => {};

describe('WorkoutLogForm', () => {
  afterEach(() => jest.restoreAllMocks());

  test('wymaga wyboru kategorii', async () => {
    const fetchSpy = mockFetch();
    renderWithProviders(<WorkoutLogForm categories={sampleCategories} onClose={noop} onSaved={noop} />);

    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(screen.getByText('Wybierz kategorię')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('blokuje datę z przyszłości', async () => {
    const fetchSpy = mockFetch();
    renderWithProviders(<WorkoutLogForm categories={sampleCategories} onClose={noop} onSaved={noop} />);

    await userEvent.selectOptions(screen.getByLabelText(/^Kategoria/), '1');
    await userEvent.clear(screen.getByLabelText(/^Data/));
    await userEvent.type(screen.getByLabelText(/^Data/), iso(3));
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(screen.getByText('Data nie może być przyszła')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('odrzuca czas trwania równy zero', async () => {
    const fetchSpy = mockFetch();
    renderWithProviders(<WorkoutLogForm categories={sampleCategories} onClose={noop} onSaved={noop} />);

    await userEvent.selectOptions(screen.getByLabelText(/^Kategoria/), '1');
    await userEvent.type(screen.getByLabelText(/^Czas trwania/), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(screen.getByText('Czas musi być większy od 0')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("suwak intensywności startuje na 5 i wysyła wybraną wartość", async () => {
    const fetchSpy = mockFetch({ status: 200, body: oldLog });

    renderWithProviders(
      <WorkoutLogForm categories={sampleCategories} onClose={noop} onSaved={noop} />
    );

    // suwak nie ma etykiety powiązanej z polem, więc szukamy po roli
    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("5");

    setSlider(slider, 8);
    expect(slider).toHaveValue("8");

    await userEvent.selectOptions(screen.getByLabelText(/^Kategoria/), "1");
    await userEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    const [, options] = fetchSpy.mock.calls[0];
    expect(JSON.parse(options!.body as string).intensity).toBe(8);
  });

  test('tytuł i godzina są opcjonalne', async () => {
    const fetchSpy = mockFetch({ status: 200, body: oldLog });
    renderWithProviders(<WorkoutLogForm categories={sampleCategories} onClose={noop} onSaved={noop} />);

    await userEvent.selectOptions(screen.getByLabelText(/^Kategoria/), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    const payload = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(payload).not.toHaveProperty('title');
    expect(payload).not.toHaveProperty('performedTime');
  });

  // REGRESJA lustrzana do planów: walidacja nie może blokować edycji starego wpisu
  test('pozwala edytować stary wpis, gdy data się nie zmienia', async () => {
    const fetchSpy = mockFetch({ status: 200, body: oldLog });
    const onSaved = jest.fn();

    renderWithProviders(<WorkoutLogForm categories={sampleCategories} log={oldLog} onClose={noop} onSaved={onSaved} />);

    await userEvent.clear(screen.getByLabelText(/^Notatki/));
    await userEvent.type(screen.getByLabelText(/^Notatki/), 'poprawione');
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(screen.queryByText('Data nie może być przyszła')).not.toBeInTheDocument();
    expect(onSaved).toHaveBeenCalled();

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/workout-logs/3');
    expect(options!.method).toBe('PUT');
  });
});
