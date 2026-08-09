import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiRequestError } from "../services/apiClient";
import * as authApi from "../services/authApi";
import AuthBanner from "../components/AuthBanner";
import styles from "../styles/AuthForm.module.scss";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (values.firstName.trim().length < 2) {
    errors.firstName = "Imię musi mieć co najmniej 2 znaki";
  }
  if (values.lastName.trim().length < 2) {
    errors.lastName = "Nazwisko musi mieć co najmniej 2 znaki";
  }
  if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Podaj poprawny adres email";
  }
  if (values.password.length < 8) {
    errors.password = "Hasło musi mieć co najmniej 8 znaków";
  }
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Hasła muszą być identyczne";
  }

  return errors;
}

function RegisterPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/kalendarz" replace />;
  }

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // czyścimy błąd pola, gdy użytkownik zaczyna je poprawiać
    setErrors((prev) => {
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      // confirmPassword celowo NIE leci do API — to walidacja czysto frontowa
      await authApi.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      });

      // 201 -> auto-login i prosto do kalendarza
      await login({ email: values.email.trim(), password: values.password });
      navigate("/kalendarz", { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setErrors({ email: "Ten email jest już zajęty" });
      } else if (err instanceof ApiRequestError && err.errors) {
        // 400 z backendu: { errors: { polePola: "komunikat" } }
        setErrors(err.errors);
      } else {
        setFormError("Coś poszło nie tak. Spróbuj ponownie.");
      }
      setSubmitting(false);
    }
  };

  const renderField = (
    field: keyof FormValues,
    label: string,
    type: string,
    autoComplete: string
  ) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type={type}
        value={values[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        autoComplete={autoComplete}
      />
      {errors[field] && <span className={styles.fieldError}>{errors[field]}</span>}
    </label>
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AuthBanner />
        <form className={styles.cardBody} onSubmit={handleSubmit} noValidate>
          <h1>Rejestracja</h1>

          {renderField("firstName", "Imię", "text", "given-name")}
          {renderField("lastName", "Nazwisko", "text", "family-name")}
          {renderField("email", "Email", "email", "email")}
          {renderField("password", "Hasło", "password", "new-password")}
          {renderField("confirmPassword", "Potwierdź hasło", "password", "new-password")}

          {formError && <p className={styles.formError}>{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Tworzenie konta..." : "Zarejestruj się"}
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