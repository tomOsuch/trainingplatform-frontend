import { FormEvent, useState } from 'react';
import { createCooperationInvitation } from '../services/cooperationApi';
import { ApiRequestError } from '../services/apiClient';
import { useRetryAfter } from '../hooks/useRetryAfter';
import { formatWaitTime } from '../utils/format';
import Modal from './Modal';
import styles from '../styles/CooperationInviteForm.module.scss';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CooperationInviteFormProps {
  ownEmail: string;
  onClose: () => void;
  onSent: () => void;
}

function CooperationInviteForm({ ownEmail, onClose, onSent }: CooperationInviteFormProps) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { blocked, secondsLeft, blockFor } = useRetryAfter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (blocked) return;

    const value = email.trim();

    if (!EMAIL_REGEX.test(value)) {
      setEmailError('Podaj poprawny adres e-mail');
      return;
    }

    if (value.toLowerCase() === ownEmail.toLowerCase()) {
      setEmailError('Nie możesz zaprosić samego siebie do współpracy');
      return;
    }

    setEmailError(null);
    setSending(true);
    try {
      await createCooperationInvitation(value);
      onSent();
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError && err.errors?.email) setEmailError(err.errors.email);
      else if (err instanceof ApiRequestError && err.status === 429) {
        setFormError(err.message);
        if (err.retryAfter) blockFor(err.retryAfter);
      } else if (err instanceof ApiRequestError) setFormError(err.message);
      else setFormError('Nie udało się wysłać zaproszenia');
      setSending(false);
    }
  };

  return (
    <Modal title="Zaproś podopiecznego" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span>Adres e-mail *</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anna.nowak@example.com" />
          {emailError && <span className={styles.fieldError}>{emailError}</span>}
        </label>

        <p className={styles.hint}>
          Osoba musi mieć konto w aplikacji. Dostęp do jej danych dostaniesz dopiero, gdy przyjmie zaproszenie — zaproszenie jest ważne
          14 dni.
        </p>

        {formError && (
          <p className={styles.formError}>
            {formError}
            {blocked && ` Spróbuj ponownie za ${formatWaitTime(secondsLeft)}.`}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Anuluj
          </button>
          <button type="submit" className={styles.primary} disabled={sending || blocked}>
            {sending ? 'Wysyłanie…' : 'Wyślij zaproszenie'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default CooperationInviteForm;