import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Role } from '../types/auth';
import { Invitation, InvitationStatus } from '../types/invitation';
import { createInvitation, getInvitations, revokeInvitation } from '../services/invitationsApi';
import { ApiRequestError } from '../services/apiClient';
import { formatDateTimePl } from '../utils/calendar';
import styles from '../styles/AdminPage.module.scss';
import { useRetryAfter } from '../hooks/useRetryAfter';
import { formatWaitTime } from '../utils/format';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_LABELS: Record<InvitationStatus, string> = {
  PENDING: 'Oczekuje',
  ACCEPTED: 'Wykorzystane',
  EXPIRED: 'Wygasłe',
  REVOKED: 'Unieważnione',
};

const STATUS_CLASS: Record<InvitationStatus, string> = {
  PENDING: styles.statusPending,
  ACCEPTED: styles.statusAccepted,
  EXPIRED: styles.statusExpired,
  REVOKED: styles.statusRevoked,
};

function AdminPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('USER');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [confirmRevokeId, setConfirmRevokeId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const { blocked, secondsLeft, blockFor } = useRetryAfter();

  const load = useCallback(() => {
    setLoading(true);
    setListError(null);
    getInvitations()
      .then(setInvitations)
      .catch((e) => setListError(e.message ?? 'Nie udało się pobrać zaproszeń'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormMessage(null);
    if (blocked) return;

    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError('Podaj poprawny adres email');
      return;
    }

    setEmailError(null);
    setSending(true);
    try {
      const created = await createInvitation({ email: email.trim(), role });
      setEmail('');
      setRole('USER');
      setFormMessage(`Zaproszenie wysłane na ${created.email}`);
      load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.errors?.email) setEmailError(err.errors.email);
      else if (err instanceof ApiRequestError && err.status === 429) {
        setFormError(err.message);
        if (err.retryAfter) blockFor(err.retryAfter);
      } else if (err instanceof ApiRequestError) setFormError(err.message);
      else setFormError('Nie udało się wystawić zaproszenia');
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (id: number) => {
    setRowError(null);
    try {
      await revokeInvitation(id);
      setConfirmRevokeId(null);
      load();
    } catch (err) {
      setRowError(err instanceof ApiRequestError ? err.message : 'Nie udało się unieważnić zaproszenia');
    }
  };

  return (
    <div className={styles.page}>
      <h1>Administracja</h1>

      <section className={styles.card}>
        <h2>Wystaw zaproszenie</h2>

        <form className={styles.inviteForm} onSubmit={handleInvite} noValidate>
          <label className={styles.field}>
            <span>Adres email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nowy@example.com" />
            {emailError && <span className={styles.fieldError}>{emailError}</span>}
          </label>

          <label className={styles.field}>
            <span>Rola</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="USER">Użytkownik</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </label>

          <button type="submit" className={styles.primary} disabled={sending || blocked}>
            {sending ? 'Wysyłanie...' : 'Wyślij zaproszenie'}
          </button>
        </form>

                {formError && (
          <p className={styles.formError}>
            {formError}
            {blocked && ` Spróbuj ponownie za ${formatWaitTime(secondsLeft)}.`}
          </p>
        )}
        {formMessage && <p className={styles.success}>{formMessage}</p>}

        <p className={styles.hint}>
          Ponowne zaproszenie na ten sam adres unieważnia poprzednie — tak działa „wyślij ponownie". Link trafia wyłącznie do wiadomości
          e-mail.
        </p>
      </section>

      <section className={styles.card}>
        <h2>Zaproszenia</h2>

        {listError && <p className={styles.formError}>{listError}</p>}
        {rowError && <p className={styles.formError}>{rowError}</p>}

        {loading && <p className={styles.muted}>Ładowanie…</p>}

        {!loading && invitations.length === 0 && !listError && <p className={styles.muted}>Nie wystawiono jeszcze żadnych zaproszeń.</p>}

        {invitations.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Adres</th>
                <th>Rola</th>
                <th>Status</th>
                <th>Wystawił</th>
                <th>Ważne do</th>
                <th aria-label="Akcje" />
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    {inv.email}
                    {inv.status === 'PENDING' && inv.sentAt === null && (
                      <span className={styles.warning} title="Wysyłka maila nie powiodła się">
                        {' '}
                        · mail nie dotarł
                      </span>
                    )}
                  </td>
                  <td>{inv.role === 'ADMIN' ? 'Administrator' : 'Użytkownik'}</td>
                  <td>
                    <span className={[styles.badge, STATUS_CLASS[inv.status]].join(' ')}>{STATUS_LABELS[inv.status]}</span>
                  </td>
                  <td className={styles.muted}>{inv.invitedByEmail ?? 'konto usunięte'}</td>
                  <td className={styles.muted}>{formatDateTimePl(inv.expiresAt)}</td>
                  <td className={styles.actionCell}>
                    {inv.status === 'PENDING' &&
                      (confirmRevokeId === inv.id ? (
                        <>
                          <button className={styles.danger} onClick={() => handleRevoke(inv.id)}>
                            Tak, unieważnij
                          </button>
                          <button className={styles.secondary} onClick={() => setConfirmRevokeId(null)}>
                            Nie
                          </button>
                        </>
                      ) : (
                        <button className={styles.secondary} onClick={() => setConfirmRevokeId(inv.id)}>
                          Unieważnij
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default AdminPage;
