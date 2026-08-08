import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiRequestError } from "../services/apiClient";
import AuthBanner from "../components/AuthBanner";
import styles from "../styles/AuthForm.module.scss";

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/kalendarz" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Podaj email i hasło");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate("/kalendarz", { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setFormError("Nieprawidłowy email lub hasło");
      } else if (err instanceof ApiRequestError && err.status === 403) {
        setFormError("Konto jest nieaktywne");
      } else {
        setFormError("Coś poszło nie tak. Spróbuj ponownie.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AuthBanner />
        <form className={styles.cardBody} onSubmit={handleSubmit} noValidate>
          <h1>Logowanie</h1>

          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label className={styles.field}>
            <span>Hasło</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {formError && <p className={styles.formError}>{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Logowanie..." : "Zaloguj się"}
          </button>

          <p className={styles.switchLink}>
            Nie masz konta? <Link to="/register">Zarejestruj się</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;