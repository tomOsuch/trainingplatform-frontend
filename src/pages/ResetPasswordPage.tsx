import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiRequestError } from '../services/apiClient';
import * as authApi from '../services/authApi';
import { formatDateTimePl } from '../utils/calendar';
import AuthBanner from '../components/AuthBanner';
import styles from '../styles/AuthForm.module.scss';

type TokenState =
  | { status: 'missing' }
  | { status: 'checking' }
  | { status: 'invalid'; message: string }
  | { status: 'valid'; email: string; expiresAt: string };

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [tokenState, setTokenState] = useState<TokenState>({
    status: token ? 'checking' : 'missing',
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    authApi
      .getPasswordReset(token)
      .then((info) => setTokenState({ status: 'valid', email: info.email, expiresAt: info.expiresAt }))
      .catch((err) =>
        setTokenState({
          status: 'invalid',
          message: err instanceof ApiRequestError ? err.message : 'Nie udało się sprawdzić linku. Spróbuj ponownie.',
        }),
      );
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (tokenState.status !== 'valid' || !token) return;

    setFormError(null);
    const errs: Record<string, string> = {};
    if (password.length < 8) errs.password = 'Hasło musi mieć co najmniej 8 znaków';
    if (confirmPassword !== password) errs.confirmPassword = 'Hasła muszą być identyczne';
    if (Object.keys(errs).length > 0) return setErrors(errs);

    setErrors({});
    setSubmitting(true);
    try {
      await authApi.confirmPasswordReset({ token, password });

      navigate('/login', {
        replace: true,
        state: { message: 'Hasło zostało zmienione. Zaloguj się nowym hasłem.' },
      });
    } catch (err) {
      if (err instanceof ApiRequestError && err.errors) setErrors(err.errors);
      else if (err instanceof ApiRequestError) setFormError(err.message);
      else setFormError('Nie udało się zmienić hasła. Spróbuj ponownie.');
      setSubmitting(false);
    }
  };

  if (tokenState.status === 'missing' || tokenState.status === 'invalid') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <AuthBanner />
          <div className={styles.cardBody}>
            <h1>Nowe hasło</h1>
            <p className={styles.blockedMessage}>
              {tokenState.status === 'missing' ? 'Ten adres wymaga linku z wiadomości e-mail.' : tokenState.message}
            </p>
            <p className={styles.switchLink}>
              <Link to="/forgot-password">Poproś o nowy link</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (tokenState.status === 'checking') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <AuthBanner />
          <div className={styles.cardBody}>
            <p className={styles.checking}>Sprawdzanie linku…</p>
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
          <h1>Nowe hasło</h1>

          <div className={styles.infoBox}>
            Ustawiasz nowe hasło dla <strong>{tokenState.email}</strong>
            <br />
            link ważny do {formatDateTimePl(tokenState.expiresAt)}
          </div>

          <label className={styles.field}>
            <span>Nowe hasło</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
          </label>

          <label className={styles.field}>
            <span>Potwierdź nowe hasło</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword}</span>}
          </label>

          {formError && <p className={styles.formError}>{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Zapisywanie...' : 'Ustaw nowe hasło'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
