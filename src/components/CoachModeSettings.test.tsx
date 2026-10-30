import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch } from '../test-utils';
import CoachModeSettings from './CoachModeSettings';
import { UserProfile } from '../types/profile';
import { Cooperation, CooperationInvitation } from '../types/cooperation';

const profile: UserProfile = {
  id: 1,
  email: 'jan@example.com',
  firstName: 'Jan',
  lastName: 'Kowalski',
  birthDate: null,
  role: 'USER',
  coach: true,
};

const athlete = (id: number): Cooperation => ({
  id,
  role: 'COACH', // zalogowany jest trenerem tej osoby
  partnerId: 100 + id,
  partnerFirstName: 'Anna',
  partnerLastName: 'Nowak',
  partnerEmail: `anna${id}@example.com`,
  since: '2026-09-01T10:00:00',
});

// zalogowany jest podopiecznym — nie blokuje wyłączenia trybu trenera
const myCoach: Cooperation = { ...athlete(9), role: 'ATHLETE' };

const sentInvitation = (id: number): CooperationInvitation => ({
  id,
  role: 'COACH',
  partnerId: 200 + id,
  partnerFirstName: null,
  partnerLastName: null,
  partnerEmail: `ola${id}@example.com`,
  status: 'PENDING',
  createdAt: '2026-10-20T10:00:00',
  expiresAt: '2026-11-03T10:00:00',
});

// zaproszenie OD trenera — wyłączenie trybu go nie wycofuje
const receivedInvitation: CooperationInvitation = { ...sentInvitation(50), role: 'ATHLETE' };

const toggle = () => screen.getByRole('checkbox', { name: /Prowadzę innych/ });

// do czasu policzenia podopiecznych i zaproszeń przełącznik jest nieaktywny
const ready = () => waitFor(() => expect(toggle()).toBeEnabled());

const coachCall = (spy: ReturnType<typeof mockFetch>) => spy.mock.calls.find(([url]) => String(url).includes('/profile/coach'));

function renderSettings(enabled: boolean) {
  const onChanged = jest.fn();
  renderWithProviders(<CoachModeSettings enabled={enabled} onChanged={onChanged} />);
    return { onChanged };
}

describe('CoachModeSettings', () => {
  afterEach(() => jest.restoreAllMocks());

  test('włączenie działa od razu — bez potwierdzenia i bez pytania o współprace', async () => {
    const spy = mockFetch({ status: 200, body: profile });
    const { onChanged } = renderSettings(false);

    await userEvent.click(toggle());

    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(profile));
    expect(coachCall(spy)?.[1]?.method).toBe('PUT');
    expect(coachCall(spy)?.[1]?.body).toBe(JSON.stringify({ enabled: true }));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Tryb trenera włączony.')).toBeInTheDocument();
  });

  test('przy aktywnych podopiecznych przełącznik jest zablokowany z wyjaśnieniem i drogą wyjścia', async () => {
    mockFetch({ status: 200, body: [athlete(1), athlete(2), myCoach] }, { status: 200, body: [] });
    renderSettings(true);

    expect(await screen.findByText(/Prowadzisz 2 osoby\./)).toBeInTheDocument();
    expect(toggle()).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Współpraca' })).toHaveAttribute('href', '/wspolpraca');
  });

  test('bez podopiecznych i wysłanych zaproszeń wyłącza od razu — nie ma czego potwierdzać', async () => {
    const spy = mockFetch(
      { status: 200, body: [myCoach] },
      { status: 200, body: [receivedInvitation] },
      { status: 200, body: { ...profile, coach: false } },
    );
    const { onChanged } = renderSettings(true);
    await ready();

    await userEvent.click(toggle());

    await waitFor(() => expect(onChanged).toHaveBeenCalledWith({ ...profile, coach: false }));
    expect(coachCall(spy)?.[1]?.body).toBe(JSON.stringify({ enabled: false }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('przy oczekujących zaproszeniach pyta o zgodę, podaje ich liczbę, a Anuluj niczego nie wysyła', async () => {
    const spy = mockFetch(
      { status: 200, body: [] },
      { status: 200, body: [sentInvitation(1), sentInvitation(2), sentInvitation(3)] },
      { status: 200, body: { ...profile, coach: false } },
    );
    const { onChanged } = renderSettings(true);
    await ready();

    await userEvent.click(toggle());
    expect(screen.getByRole('dialog', { name: 'Wyłączyć tryb trenera?' })).toHaveTextContent(
      '3 oczekujące zaproszenia zostaną wycofane.',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
    expect(coachCall(spy)).toBeUndefined();
    expect(toggle()).toBeChecked();

    await userEvent.click(toggle());
    await userEvent.click(screen.getByRole('button', { name: 'Wyłącz i wycofaj zaproszenia' }));

    await waitFor(() => expect(onChanged).toHaveBeenCalledWith({ ...profile, coach: false }));
    expect(coachCall(spy)?.[1]?.body).toBe(JSON.stringify({ enabled: false }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('409 pokazuje komunikat serwera i odświeża blokadę — liczby z profilu mogły się zestarzeć', async () => {
    const message = 'Prowadzisz 1 osobę — zakończ współpracę, zanim wyłączysz tryb trenera';
    mockFetch(
      { status: 200, body: [] },
      { status: 200, body: [sentInvitation(1)] },
      { status: 409, body: { message } },
      { status: 200, body: [athlete(1)] }, // zaproszenie zostało przyjęte, zanim użytkownik kliknął
      { status: 200, body: [] },
    );
    const { onChanged } = renderSettings(true);
    await ready();

    await userEvent.click(toggle());
    await userEvent.click(screen.getByRole('button', { name: 'Wyłącz i wycofaj zaproszenia' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(await screen.findByText(/Zanim wyłączysz tryb trenera/)).toBeInTheDocument();
    expect(toggle()).toBeDisabled();
    expect(onChanged).not.toHaveBeenCalled();
  });
});