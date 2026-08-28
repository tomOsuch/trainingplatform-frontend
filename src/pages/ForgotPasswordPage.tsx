import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiRequestError } from '../services/apiClient';
import * as authApi from '../services/authApi';
import AuthBanner from '../components/AuthBanner';
import styles from '../styles/AuthForm.module.scss';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!EMAIL_REGEX.test(email.trim())) {
      setFieldError('Podaj poprawny adres email');
      return;
    }

    setFieldError(null);
    setSubmitting(true);
    try {
      await authApi.requestPasswordReset({ email: email.trim() });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiRequestError && err.errors?.email) {
        setFieldError(err.errors.email);
      } else {
        setFormError('Nie udało się wysłać linku. Spróbuj ponownie.');
      }
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <AuthBanner />
          <div className={styles.cardBody}>
            <h1>Sprawdź skrzynkę</h1>
            <p className={styles.blockedMessage}>
              Jeśli konto o tym adresie istnieje, wysłaliśmy na nie link do zresetowania hasła. Zajrzyj też do folderu ze spamem — link jest
              ważny przez godzinę.
            </p>
            <p className={styles.switchLink}>
              <Link to="/login">Wróć do logowania</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AuthBanner />
        <form className={styles.cardBody} onSubmit={handleSubmit} noValidate>
          <h1>Nie pamiętam hasła</h1>

          <p className={styles.blockedMessage}>Podaj adres, na który założono konto. Wyślemy link do ustawienia nowego hasła.</p>

          <label className={styles.field}>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            {fieldError && <span className={styles.fieldError}>{fieldError}</span>}
          </label>

          {formError && <p className={styles.formError}>{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Wysyłanie...' : 'Wyślij link'}
          </button>

          <p className={styles.switchLink}>
            Pamiętasz hasło? <Link to="/login">Zaloguj się</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
