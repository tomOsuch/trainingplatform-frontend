import { useCallback, useEffect, useState } from 'react';
import { Cooperation, CooperationInvitation, InvitationDecision } from '../types/cooperation';
import {
  answerCooperationInvitation,
  endCooperation,
  getCooperationInvitations,
  getCooperations,
  withdrawCooperationInvitation,
} from '../services/cooperationApi';
import { ApiRequestError } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { formatDatePl } from '../utils/calendar';
import { formatDeadline, plural } from '../utils/format';
import CooperationInviteForm from '../components/CooperationInviteForm';
import CoachAccessDialog from '../components/CoachAccessDialog';
import Modal from '../components/Modal';
import styles from '../styles/CooperationPage.module.scss';

type Partner = { partnerFirstName: string | null; partnerLastName: string | null; partnerEmail: string };

function partnerName(p: Partner): string {
  const full = `${p.partnerFirstName ?? ''} ${p.partnerLastName ?? ''}`.trim();
  return full || p.partnerEmail;
}

function CooperationPage() {
  const { user } = useAuth();

  const [cooperations, setCooperations] = useState<Cooperation[]>([]);
  const [invitations, setInvitations] = useState<CooperationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [inviting, setInviting] = useState(false);
  const [ending, setEnding] = useState<Cooperation | null>(null);
  const [accessInfo, setAccessInfo] = useState<Cooperation | null>(null);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    Promise.all([getCooperations(), getCooperationInvitations()])
      .then(([coops, invs]) => {
        setCooperations(coops);
        setInvitations(invs);
      })
      .catch((e) => setError((e as ApiRequestError).message ?? 'Nie udało się pobrać współprac'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const myAthletes = cooperations.filter((c) => c.role === 'COACH');
  const myCoaches = cooperations.filter((c) => c.role === 'ATHLETE');
  const sent = invitations.filter((i) => i.role === 'COACH');
  const received = invitations.filter((i) => i.role === 'ATHLETE');

  const run = (action: Promise<unknown>, fallback: string) => {
    setBusy(true);
    setActionError(null);
    action
      .then(() => {
        setEnding(null);
        setConfirmWithdrawId(null);
        load();
      })
      .catch((e) => setActionError(e instanceof ApiRequestError ? e.message : fallback))
      .finally(() => setBusy(false));
  };

  const answer = (id: number, decision: InvitationDecision) =>
    run(answerCooperationInvitation(id, decision), 'Nie udało się odpowiedzieć na zaproszenie');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Współpraca</h1>
        <p className={styles.lead}>
          Trener widzi Twój kalendarz, dziennik, cele i statystyki, i może układać Ci plany. Dostęp powstaje dopiero po Twojej zgodzie i
          znika w chwili, gdy ją cofniesz.
        </p>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {actionError && <p className={styles.error}>{actionError}</p>}
      {loading && <p className={styles.loading}>Ładowanie…</p>}

      {!loading && !error && (
        <>
          {received.length > 0 && (
            <section className={styles.decisions} aria-label="Czeka na Twoją decyzję">
              <h2 className={styles.decisionsTitle}>Czeka na Twoją decyzję</h2>

              {received.map((inv) => (
                <div key={inv.id} className={styles.card}>
                  <div className={styles.who}>
                    <div className={styles.name}>{partnerName(inv)} chce Cię prowadzić</div>
                    <div className={styles.meta}>
                      {inv.partnerEmail} · {formatDeadline(inv.expiresAt)}
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button type="button" className={styles.primary} disabled={busy} onClick={() => answer(inv.id, 'ACCEPTED')}>
                      Przyjmij
                    </button>
                    <button type="button" className={styles.secondary} disabled={busy} onClick={() => answer(inv.id, 'REJECTED')}>
                      Odrzuć
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                Prowadzę
                <span className={styles.count}>
                  {myAthletes.length} {plural(myAthletes.length, 'podopieczny', 'podopiecznych', 'podopiecznych')}
                  {sent.length > 0 && ` · ${sent.length} ${plural(sent.length, 'zaproszenie', 'zaproszenia', 'zaproszeń')}`}
                </span>
              </h2>
              <button type="button" className={styles.primary} onClick={() => setInviting(true)}>
                Zaproś podopiecznego
              </button>
            </div>

            {myAthletes.length === 0 && sent.length === 0 ? (
              <p className={styles.empty}>
                Nie prowadzisz jeszcze nikogo. Po przyjęciu zaproszenia zobaczysz kalendarz, dziennik, cele i statystyki tej osoby i
                będziesz mógł układać jej plany. Wpisów w jej dzienniku nie zmienisz — to zapis tego, co faktycznie zrobiła.
              </p>
            ) : (
              <ul className={styles.list} aria-label="Moi podopieczni">
                {myAthletes.map((coop) => (
                  <li key={coop.id} className={styles.card}>
                    <div className={styles.who}>
                      <div className={styles.name}>{partnerName(coop)}</div>
                      <div className={styles.meta}>
                        {coop.partnerEmail} · od {formatDatePl(coop.since.split('T')[0])}
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <button type="button" className={styles.danger} disabled={busy} onClick={() => setEnding(coop)}>
                        Zakończ
                      </button>
                    </div>
                  </li>
                ))}

                {sent.map((inv) => (
                  <li key={`inv-${inv.id}`} className={styles.cardPending}>
                    <div className={styles.who}>
                      <div className={styles.name}>{partnerName(inv)}</div>
                      <div className={styles.meta}>czeka na odpowiedź · {formatDeadline(inv.expiresAt)}</div>
                    </div>
                    <div className={styles.actions}>
                      {/* Potwierdzenie w wierszu, tak jak przy unieważnianiu zaproszeń w panelu administratora */}
                      {confirmWithdrawId === inv.id ? (
                        <>
                          <button
                            type="button"
                            className={styles.danger}
                            disabled={busy}
                            onClick={() => run(withdrawCooperationInvitation(inv.id), 'Nie udało się wycofać zaproszenia')}
                          >
                            Tak, wycofaj
                          </button>
                          <button type="button" className={styles.secondary} onClick={() => setConfirmWithdrawId(null)}>
                            Nie
                          </button>
                        </>
                      ) : (
                        <button type="button" className={styles.secondary} onClick={() => setConfirmWithdrawId(inv.id)}>
                          Wycofaj
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Prowadzi mnie
              <span className={styles.count}>
                {myCoaches.length} {plural(myCoaches.length, 'trener', 'trenerów', 'trenerów')}
              </span>
            </h2>

            {myCoaches.length === 0 ? (
              <p className={styles.empty}>
                {received.length > 0
                  ? 'Nikt Cię jeszcze nie prowadzi — zaproszenie czeka na Twoją decyzję wyżej.'
                  : 'Nikt Cię teraz nie prowadzi. Trenera nie zapraszasz — to on zaprasza Ciebie. Podaj mu adres e-mail, na który masz tu konto, a zaproszenie pojawi się w tym miejscu.'}
              </p>
            ) : (
              <ul className={styles.list} aria-label="Moi trenerzy">
                {myCoaches.map((coop) => (
                  <li key={coop.id} className={styles.card}>
                    <div className={styles.who}>
                      <div className={styles.name}>{partnerName(coop)}</div>
                      <div className={styles.meta}>
                        {coop.partnerEmail} · prowadzi Cię od {formatDatePl(coop.since.split('T')[0])}
                      </div>
                      <button type="button" className={styles.infoLink} onClick={() => setAccessInfo(coop)}>
                        Co widzi {partnerName(coop)}?
                      </button>
                    </div>
                    <div className={styles.actions}>
                      <button type="button" className={styles.danger} disabled={busy} onClick={() => setEnding(coop)}>
                        Zakończ współpracę
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {inviting && <CooperationInviteForm ownEmail={user?.email ?? ''} onClose={() => setInviting(false)} onSent={load} />}

      {accessInfo && <CoachAccessDialog coachName={partnerName(accessInfo)} onClose={() => setAccessInfo(null)} />}

      {ending && (
        <Modal title="Zakończyć współpracę?" onClose={() => setEnding(null)}>
          <p className={styles.endingWho}>{partnerName(ending)}</p>

          <ul className={styles.consequences}>
            {ending.role === 'ATHLETE' ? (
              <>
                <li>Straci dostęp do Twoich danych natychmiast.</li>
                <li>
                  Plany, które Ci ułożył, <b>zostają w Twoim kalendarzu</b> — możesz je dalej edytować i usuwać.
                </li>
                <li>Wpisy w dzienniku, cele i statystyki pozostają nietknięte.</li>
              </>
            ) : (
              <>
                <li>Stracisz dostęp do jej kalendarza, dziennika, celów i statystyk natychmiast.</li>
                <li>
                  Plany, które jej ułożyłeś, <b>zostają w jej kalendarzu</b> wraz z informacją, że są od Ciebie.
                </li>
                <li>Możesz zaprosić ją ponownie — potrzebna będzie nowa zgoda.</li>
              </>
            )}
          </ul>

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setEnding(null)}>
              Anuluj
            </button>
            <button
              type="button"
              className={styles.primary}
              disabled={busy}
              onClick={() => run(endCooperation(ending.id), 'Nie udało się zakończyć współpracy')}
            >
              Zakończ współpracę
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default CooperationPage;
