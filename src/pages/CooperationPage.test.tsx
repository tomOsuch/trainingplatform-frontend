import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch } from '../test-utils';
import CooperationPage from './CooperationPage';
import { Cooperation, CooperationInvitation } from '../types/cooperation';
import { User } from '../types/auth';

const trener: Cooperation = {
  id: 1,
  role: 'ATHLETE',
  partnerId: 11,
  partnerFirstName: 'Marta',
  partnerLastName: 'Zielińska',
  partnerEmail: 'marta@example.com',
  since: '2026-09-01T10:00:00.000000',
};

const podopieczna: Cooperation = {
  id: 2,
  role: 'COACH',
  partnerId: 12,
  partnerFirstName: 'Anna',
  partnerLastName: 'Nowak',
  partnerEmail: 'anna@example.com',
  since: '2026-09-05T10:00:00.000000',
};

const otrzymane: CooperationInvitation = {
  id: 3,
  role: 'ATHLETE',
  partnerId: 13,
  partnerFirstName: 'Jan',
  partnerLastName: 'Kowalski',
  partnerEmail: 'jan@example.com',
  status: 'PENDING',
  createdAt: '2026-09-20T10:00:00.000000',
  expiresAt: '2036-10-04T10:00:00.000000',
};

const wyslane: CooperationInvitation = {
  id: 4,
  role: 'COACH',
  partnerId: 14,
  partnerFirstName: 'Piotr',
  partnerLastName: 'Wiśniewski',
  partnerEmail: 'piotr@example.com',
  status: 'PENDING',
  createdAt: '2026-09-20T10:00:00.000000',
  expiresAt: '2036-10-04T10:00:00.000000',
};

const dane = (coops: Cooperation[], invs: CooperationInvitation[]) => [
  { status: 200, body: coops },
  { status: 200, body: invs },
];

const coachUser: User = {
  userId: 99,
  email: 'ja@example.com',
  role: 'USER',
  firstName: 'Tomasz',
  lastName: 'Testowy',
  coach: true,
};

describe('CooperationPage', () => {
  afterEach(() => jest.restoreAllMocks());

  test('rozdziela dane po stronie relacji, nie po partnerze', async () => {
    mockFetch(...dane([trener, podopieczna], [wyslane]));
    renderWithProviders(<CooperationPage />, { user: coachUser });

    const podopieczni = await screen.findByRole('list', { name: 'Moi podopieczni' });
    expect(within(podopieczni).getByText('Anna Nowak')).toBeInTheDocument();
    expect(within(podopieczni).getByText('Piotr Wiśniewski')).toBeInTheDocument();

    const trenerzy = screen.getByRole('list', { name: 'Moi trenerzy' });
    expect(within(trenerzy).getByText('Marta Zielińska')).toBeInTheDocument();
    expect(within(trenerzy).queryByText('Anna Nowak')).not.toBeInTheDocument();
  });

  test('zaproszenie do przyjęcia żyje w pasku decyzji, nie w sekcji trenerów', async () => {
    mockFetch(...dane([trener], [otrzymane]));
    renderWithProviders(<CooperationPage />, { user: coachUser });

    const pasek = await screen.findByRole('region', { name: 'Czeka na Twoją decyzję' });
    expect(within(pasek).getByText('Jan Kowalski chce Cię prowadzić')).toBeInTheDocument();

    const trenerzy = screen.getByRole('list', { name: 'Moi trenerzy' });
    expect(within(trenerzy).queryByText(/Jan Kowalski/)).not.toBeInTheDocument();
  });

  test('przyjęcie zaproszenia przeładowuje obie listy', async () => {
    const spy = mockFetch(
      ...dane([], [otrzymane]),
      { status: 200, body: { ...otrzymane, status: 'ACTIVE' } },
      ...dane([{ ...trener, partnerFirstName: 'Jan', partnerLastName: 'Kowalski' }], []),
    );
    renderWithProviders(<CooperationPage />, { user: coachUser });

    await userEvent.click(await screen.findByRole('button', { name: 'Przyjmij' }));

    expect(await screen.findByRole('list', { name: 'Moi trenerzy' })).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(5);
    expect(String(spy.mock.calls[2][0])).toContain('/cooperation-invitations/3');
  });

  test('zakończenie współpracy mówi, że plany zostają', async () => {
    mockFetch(...dane([trener], []));
    renderWithProviders(<CooperationPage />, { user: coachUser });

    await userEvent.click(await screen.findByRole('button', { name: 'Zakończ współpracę' }));

    const okno = screen.getByRole('dialog', { name: 'Zakończyć współpracę?' });
    expect(within(okno).getByText('Marta Zielińska')).toBeInTheDocument();
    expect(within(okno).getByText(/zostają w Twoim kalendarzu/)).toBeInTheDocument();
    expect(within(okno).getByText(/pozostają nietknięte/)).toBeInTheDocument();
  });

  test('pusta sekcja trenerów tłumaczy, że trenera się nie zaprasza', async () => {
    mockFetch(...dane([], []));
    renderWithProviders(<CooperationPage />, { user: coachUser });

    expect(await screen.findByText(/Trenera nie zapraszasz/)).toBeInTheDocument();
    expect(screen.getByText(/Nie prowadzisz jeszcze nikogo/)).toBeInTheDocument();
  });

  test('wycofanie zaproszenia pyta o potwierdzenie w wierszu', async () => {
    mockFetch(...dane([], [wyslane]));
    renderWithProviders(<CooperationPage />, { user: coachUser });

    await userEvent.click(await screen.findByRole('button', { name: 'Wycofaj' }));

    expect(screen.getByRole('button', { name: 'Tak, wycofaj' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('bez trybu trenera nie ma sekcji „Prowadzę", ale zaproszenie od trenera i „Prowadzi mnie" zostają', async () => {
  mockFetch(...dane([trener], [otrzymane]));
  renderWithProviders(<CooperationPage />, { user: { ...coachUser, coach: false } });

  await screen.findByRole('region', { name: 'Czeka na Twoją decyzję' });
  expect(screen.getByRole('list', { name: 'Moi trenerzy' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /Prowadzę/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Zaproś podopiecznego' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'profilu' })).toHaveAttribute('href', '/profil');
});

test('dopóki flaga nie jest znana, nie ma ani sekcji „Prowadzę", ani wskazówki', async () => {
  mockFetch(...dane([], []));
  renderWithProviders(<CooperationPage />, { user: { ...coachUser, coach: undefined } });

  await screen.findByText(/Trenera nie zapraszasz/);
  expect(screen.queryByText(/Nie prowadzisz jeszcze nikogo/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Chcesz prowadzić innych/)).not.toBeInTheDocument();
});
});
