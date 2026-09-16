import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch, sampleCategories } from '../test-utils';
import TrainingPlanForm from './TrainingPlanForm';
import { TrainingPlan } from '../types/workout';

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const pastPlan: TrainingPlan = {
  id: 7,
  title: 'Salsa',
  categoryId: 1,
  categoryName: 'Taniec',
  categoryColor: '#9B59B6',
  categoryIconName: 'music',
  plannedDate: iso(-30),
  plannedTime: '19:30',
  durationMin: 60,
  notes: 'stare notatki',
  status: 'COMPLETED',
};

const sampleTemplate = {
  id: 3,
  name: 'Trening nóg',
  description: 'Przysiady, wykroki, martwy ciąg',
  categoryId: 1,
  categoryName: 'Taniec',
  categoryColor: '#9B59B6',
  categoryIconName: 'music',
  durationMin: 60,
};

const noop = () => {};

describe('TrainingPlanForm', () => {
  afterEach(() => jest.restoreAllMocks());

  test("pusty formularz pokazuje błędy wymaganych pól", async () => {
    const fetchSpy = mockFetch();
    renderWithProviders(
      <TrainingPlanForm categories={sampleCategories} onClose={noop} onSaved={noop} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(screen.getByText("Podaj tytuł treningu")).toBeInTheDocument();
    expect(screen.getByText("Wybierz kategorię")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("blokuje utworzenie planu z przeszłą datą", async () => {
    const fetchSpy = mockFetch();
    renderWithProviders(
      <TrainingPlanForm
        categories={sampleCategories}
        initialDate={iso(-1)}
        onClose={noop}
        onSaved={noop}
      />
    );

    await userEvent.type(screen.getByLabelText(/^Tytuł/), "Bieganie");
    await userEvent.selectOptions(screen.getByLabelText(/^Kategoria/), "1");
    await userEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(screen.getByText("Data nie może być przeszła")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("odrzuca czas trwania równy zero", async () => {
    const fetchSpy = mockFetch();
    renderWithProviders(
      <TrainingPlanForm
        categories={sampleCategories}
        initialDate={iso(1)}
        onClose={noop}
        onSaved={noop}
      />
    );

    await userEvent.type(screen.getByLabelText(/^Tytuł/), "Bieganie");
    await userEvent.selectOptions(screen.getByLabelText(/^Kategoria/), "1");
    await userEvent.type(screen.getByLabelText(/^Czas trwania/), "0");
    await userEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(screen.getByText("Czas musi być większy od 0")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("w trybie edycji preuzupełnia pola danymi planu", () => {
    renderWithProviders(
      <TrainingPlanForm
        categories={sampleCategories}
        plan={pastPlan}
        onClose={noop}
        onSaved={noop}
      />
    );

    expect(screen.getByLabelText(/^Tytuł/)).toHaveValue("Salsa");
    expect(screen.getByLabelText(/^Data/)).toHaveValue(pastPlan.plannedDate);
    expect(screen.getByLabelText(/^Czas trwania/)).toHaveValue('1h');
    expect(screen.getByRole("button", { name: "Usuń trening" })).toBeInTheDocument();
  });

  // REGRESJA: walidacja daty blokowała edycję historycznych treningów
  // (naprawione w fix/edit-past-training-plan)
  test("pozwala edytować plan z przeszłą datą, gdy data się nie zmienia", async () => {
    const fetchSpy = mockFetch({ status: 200, body: pastPlan });
    const onSaved = jest.fn();

    renderWithProviders(
      <TrainingPlanForm
        categories={sampleCategories}
        plan={pastPlan}
        onClose={noop}
        onSaved={onSaved}
      />
    );

    await userEvent.clear(screen.getByLabelText(/^Notatki/));
    await userEvent.type(screen.getByLabelText(/^Notatki/), "nowe notatki");
    await userEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(screen.queryByText("Data nie może być przeszła")).not.toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain("/training-plans/7");
    expect(options!.method).toBe("PUT");
  });

  test('wybór szablonu wypełnia pola i zostawia datę pustą', async () => {
    renderWithProviders(
      <TrainingPlanForm categories={sampleCategories} templates={[sampleTemplate]} onClose={noop} onSaved={noop} />,
    );

    await userEvent.selectOptions(screen.getByLabelText(/^Zacznij od szablonu/), '3');

    expect(screen.getByLabelText(/^Tytuł/)).toHaveValue('Trening nóg');
    expect(screen.getByLabelText(/^Czas trwania/)).toHaveValue('1h');
    expect(screen.getByLabelText(/^Notatki/)).toHaveValue('Przysiady, wykroki, martwy ciąg');
    expect(screen.getByLabelText(/^Data/)).toHaveValue('');
    expect(screen.getByText(/Wypełniono z szablonu/)).toBeInTheDocument();
  });

  test('wyczyszczenie szablonu opróżnia wypełnione pola', async () => {
    renderWithProviders(
      <TrainingPlanForm categories={sampleCategories} templates={[sampleTemplate]} onClose={noop} onSaved={noop} />,
    );

    await userEvent.selectOptions(screen.getByLabelText(/^Zacznij od szablonu/), '3');
    await userEvent.click(screen.getByRole('button', { name: 'Wyczyść i zacznij od zera' }));

    expect(screen.getByLabelText(/^Tytuł/)).toHaveValue('');
    expect(screen.getByLabelText(/^Notatki/)).toHaveValue('');
    expect(screen.getByLabelText(/^Zacznij od szablonu/)).toBeInTheDocument();
  });

  test('w trybie edycji nie ma wyboru szablonu', () => {
    renderWithProviders(
      <TrainingPlanForm
        categories={sampleCategories}
        templates={[sampleTemplate]}
        plan={pastPlan}
        onClose={noop}
        onSaved={noop}
      />,
    );

    expect(screen.queryByLabelText(/^Zacznij od szablonu/)).not.toBeInTheDocument();
  });

});
