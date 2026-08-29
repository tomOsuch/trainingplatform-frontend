import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteAccount } from '../services/profileApi';
import { ApiRequestError } from '../services/apiClient';
import Modal from './Modal';
import styles from '../styles/DeleteAccountDialog.module.scss';

interface DeleteAccountDialogProps {
  email: string;
  onClose: () => void;
}

function DeleteAccountDialog({ email, onClose }: DeleteAccountDialogProps) {
  const { clearSession } = useAuth();
  const navigate = useNavigate();

  const [typedEmail, setTypedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // porównanie bez białych znaków i bez wielkości liter — przy kopiuj-wklej i tak się zgodzi
  const emailMatches = typedEmail.trim().toLowerCase() === email.toLowerCase();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setPasswordError(null);

    if (!emailMatches || !password) return;

    setSubmitting(true);
    try {
      await deleteAccount({ password });

      // Token pozostaje ważny kryptograficznie, ale konto już nie istnieje.
      // Kolejność ma znaczenie: najpierw czyścimy sesję, dopiero potem przekierowanie —
      // odwrotnie LoginPage odbiłby nas z powrotem jako zalogowanych.
      clearSession();
      navigate('/login', {
        replace: true,
        state: { message: 'Konto zostało usunięte.' },
      });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 400) {
        setPasswordError(err.errors?.password ?? 'Nieprawidłowe hasło');
      } else if (err instanceof ApiRequestError && err.status === 403) {
        setFormError(err.message);
      } else if (err instanceof ApiRequestError) {
        setFormError(err.message);
      } else {
        setFormError('Nie udało się usunąć konta. Spróbuj ponownie.');
      }
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Usunięcie konta" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.warning}>
          <p>Razem z kontem bezpowrotnie znikną:</p>
          <ul>
            <li>wszystkie zaplanowane treningi</li>
            <li>wszystkie wpisy w dzienniku</li>
            <li>niewykorzystane zaproszenia, które wystawiłeś</li>
          </ul>
          <p className={styles.irreversible}>Tej operacji nie można cofnąć.</p>
        </div>

        {/* adres najpierw — inaczej menedżer haseł wypełni hasło i zostanie jedno puste pole */}
        <label className={styles.field}>
          <span>
            Przepisz adres konta: <strong>{email}</strong>
          </span>
          <input value={typedEmail} onChange={(e) => setTypedEmail(e.target.value)} autoComplete="off" placeholder={email} />
        </label>

        <label className={styles.field}>
          <span>Hasło</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {passwordError && <span className={styles.fieldError}>{passwordError}</span>}
        </label>

        {formError && (
          <div className={styles.formError}>
            <p>{formError}</p>
            <p className={styles.hint}>
              Jeśli jesteś ostatnim administratorem, najpierw zaproś kogoś z rolą administratora — inaczej system zostałby bez opieki.
            </p>
          </div>
        )}

        <div className={styles.buttons}>
          <button type="submit" className={styles.danger} disabled={!emailMatches || !password || submitting}>
            {submitting ? 'Usuwanie...' : 'Usuń konto na zawsze'}
          </button>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Anuluj
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default DeleteAccountDialog;
