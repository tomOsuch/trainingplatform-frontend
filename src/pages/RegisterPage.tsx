import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiRequestError } from '../services/apiClient';
import * as authApi from '../services/authApi';
import { formatDateTimePl } from '../utils/calendar';
import AuthBanner from '../components/AuthBanner';
import styles from '../styles/AuthForm.module.scss';

interface FormValues {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: FormValues = {
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
};

type InvitationState =
  | { status: 'missing' }
  | { status: 'checking' }
  | { status: 'invalid'; message: string }
  | { status: 'valid'; email: string; expiresAt: string };

function validate(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (values.firstName.trim().length < 2) {
    errors.firstName = 'Imię musi mieć co najmniej 2 znaki';
  }
  if (values.lastName.trim().length < 2) {
    errors.lastName = 'Nazwisko musi mieć co najmniej 2 znaki';
  }
  if (values.password.length < 8) {
    errors.password = 'Hasło musi mieć co najmniej 8 znaków';
  }
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Hasła muszą być identyczne';
  }

  return errors;
}

function RegisterPage() {
  const { login, isAuthenticated, restoring } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationState>({
    status: token ? 'checking' : 'missing',
  });

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    authApi
      .getInvitation(token)
      .then((inv) => setInvitation({ status: 'valid', email: inv.email, expiresAt: inv.expiresAt }))
      .catch((err) =>
        setInvitation({
          status: 'invalid',
          message: err instanceof ApiRequestError ? err.message : 'Nie udało się sprawdzić zaproszenia. Spróbuj ponownie.',
        }),
      );
  }, [token]);

  if (restoring) return null; // trwa odtwarzanie sesji — nie migamy formularzem

  if (isAuthenticated) {
    return <Navigate to="/kalendarz" replace />;
  }

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (invitation.status !== 'valid' || !token) return;

    setFormError(null);
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await authApi.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: invitation.email,
        password: values.password,
        token,
      });

      await login({ email: invitation.email, password: values.password });
      navigate('/kalendarz', { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError && err.errors) {
        const { token: tokenError, ...fieldErrors } = err.errors;
        setErrors(fieldErrors);
        if (tokenError) setFormError(tokenError);
      } else if (err instanceof ApiRequestError) {
        setFormError(err.message);
      } else {
        setFormError('Coś poszło nie tak. Spróbuj ponownie.');
      }
      setSubmitting(false);
    }
  };

  const renderField = (field: keyof FormValues, label: string, type: string, autoComplete: string) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input type={type} value={values[field]} onChange={(e) => handleChange(field, e.target.value)} autoComplete={autoComplete} />
      {errors[field] && <span className={styles.fieldError}>{errors[field]}</span>}
    </label>
  );

  if (invitation.status === 'missing' || invitation.status === 'invalid') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <AuthBanner />
          <div className={styles.cardBody}>
            <h1>Rejestracja</h1>
            <p className={styles.blockedMessage}>
              {invitation.status === 'missing'
                ? 'Konto można założyć wyłącznie z zaproszenia. Poproś administratora o link rejestracyjny.'
                : invitation.message}
            </p>
            <p className={styles.switchLink}>
              Masz już konto? <Link to="/login">Zaloguj się</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (invitation.status === 'checking') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <AuthBanner />
          <div className={styles.cardBody}>
            <p className={styles.checking}>Sprawdzanie zaproszenia…</p>
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
          <h1>Rejestracja</h1>

          <div className={styles.infoBox}>
            Zaproszenie dla <strong>{invitation.email}</strong>
            <br />
            ważne do {formatDateTimePl(invitation.expiresAt)}
          </div>

          {renderField('firstName', 'Imię', 'text', 'given-name')}
          {renderField('lastName', 'Nazwisko', 'text', 'family-name')}

          <label className={styles.field}>
            <span>Email</span>
            <input type="email" value={invitation.email} disabled />
            <span className={styles.hint}>Adres pochodzi z zaproszenia i nie można go zmienić</span>
          </label>

          {renderField('password', 'Hasło', 'password', 'new-password')}
          {renderField('confirmPassword', 'Potwierdź hasło', 'password', 'new-password')}

          {formError && <p className={styles.formError}>{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Tworzenie konta...' : 'Zarejestruj się'}
          </button>

          <p className={styles.switchLink}>
            Masz już konto? <Link to="/login">Zaloguj się</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
