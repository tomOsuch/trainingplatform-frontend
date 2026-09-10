import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch } from '../test-utils';
import NotificationsSettings from './NotificationsSettings';

const disabled = { remindersEnabled: false, reminderHoursBefore: 72 };
const enabled = { remindersEnabled: true, reminderHoursBefore: 24 };

const render = () => renderWithProviders(<NotificationsSettings email="test@test.pl" />);
const save = () => userEvent.click(screen.getByRole('button', { name: 'Zapisz powiadomienia' }));
const hoursField = () => screen.getByLabelText(/^Wyprzedzenie/);

describe('NotificationsSettings', () => {
  afterEach(() => jest.restoreAllMocks());

  test('wczytuje ustawienia i pokazuje adres przy włączonych przypomnieniach', async () => {
    const spy = mockFetch({ status: 200, body: enabled });
    render();

    expect(await screen.findByText('test@test.pl')).toBeInTheDocument();
    expect(hoursField()).toHaveValue(24);
    expect(String(spy.mock.calls[0][0])).toContain('/profile/notifications');
  });

  test('wyłączone przypomnienia blokują pole, ale zachowują wartość', async () => {
    mockFetch({ status: 200, body: disabled });
    render();

    // czekamy na wartość z serwera, nie na tekst, który jest też w stanie początkowym
    const field = await screen.findByDisplayValue('72');
    expect(field).toBeDisabled();
    expect(screen.getByText('Wyłączone — nie wysyłamy żadnych maili.')).toBeInTheDocument();
  });

  test('podgląd tłumaczy godziny na czytelny opis', async () => {
    mockFetch({ status: 200, body: enabled });
    render();

    expect(await screen.findByText('dzień przed treningiem')).toBeInTheDocument();

    await userEvent.clear(hoursField());
    await userEvent.type(hoursField(), '48');
    expect(screen.getByText('2 dni przed treningiem')).toBeInTheDocument();

    await userEvent.clear(hoursField());
    await userEvent.type(hoursField(), '36');
    expect(screen.getByText('1 dzień i 12 godzin przed treningiem')).toBeInTheDocument();
  });

  test('zapis wysyła oba pola, także po wyłączeniu przypomnień', async () => {
    const spy = mockFetch({ status: 200, body: enabled }, { status: 200, body: { remindersEnabled: false, reminderHoursBefore: 24 } });
    render();

    await screen.findByText('test@test.pl');
    await userEvent.click(screen.getByRole('checkbox', { name: /Przypomnienia/ }));
    await save();

    const [url, options] = spy.mock.calls[1];
    expect(String(url)).toContain('/profile/notifications');
    expect(options?.method).toBe('PUT');
    expect(JSON.parse(String(options?.body))).toEqual({
      remindersEnabled: false,
      reminderHoursBefore: 24, // wyprzedzenie jedzie mimo wyłączenia
    });
    expect(await screen.findByText('Zapisano ustawienia powiadomień')).toBeInTheDocument();
  });

  test('wartość spoza zakresu nie idzie do backendu', async () => {
    const spy = mockFetch({ status: 200, body: enabled });
    render();

    await screen.findByText('test@test.pl');
    await userEvent.clear(hoursField());
    await userEvent.type(hoursField(), '200');
    await save();

    expect(await screen.findByText('Podaj liczbę godzin od 1 do 168')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(1); // tylko pobranie ustawień
  });

  test('błąd walidacji z backendu trafia pod pole', async () => {
    mockFetch(
      { status: 200, body: enabled },
      {
        status: 400,
        body: {
          message: 'Błąd walidacji',
          errors: { reminderHoursBefore: 'Wyprzedzenie może wynosić maksymalnie 168 godzin' },
        },
      },
    );
    render();

    await screen.findByText('test@test.pl');
    await save();

    expect(await screen.findByText('Wyprzedzenie może wynosić maksymalnie 168 godzin')).toBeInTheDocument();
  });

  test('informuje o treningach bez ustawionej godziny', async () => {
    mockFetch({ status: 200, body: enabled });
    render();

    expect(await screen.findByText('Trening zaplanowany bez godziny liczony jest tak, jakby zaczynał się o 12:00.')).toBeInTheDocument();
  });
});
