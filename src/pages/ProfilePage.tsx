import { FormEvent, useEffect, useState } from 'react';
import { UserProfile } from '../types/profile';
import { getProfile, updateProfile, changePassword } from '../services/profileApi';
import { ApiRequestError } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { toISODate } from '../utils/calendar';
import styles from '../styles/ProfilePage.module.scss';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import { useNavigate } from 'react-router-dom';

function ProfilePage() {
  const { refreshProfile, clearSession } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [dataErrors, setDataErrors] = useState<Record<string, string>>({});
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [savingData, setSavingData] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passErrors, setPassErrors] = useState<Record<string, string>>({});
  const [passError, setPassError] = useState<string | null>(null);
  const [savingPass, setSavingPass] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setFirstName(p.firstName);
        setLastName(p.lastName);
        setBirthDate(p.birthDate ?? '');
      })
      .catch((e) => setLoadError(e.message ?? 'Nie udało się pobrać profilu'));
  }, []);

  const handleDataSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setDataMessage(null);
    setDataError(null);

    const errs: Record<string, string> = {};
    if (firstName.trim().length < 2) errs.firstName = 'Imię musi mieć co najmniej 2 znaki';
    if (lastName.trim().length < 2) errs.lastName = 'Nazwisko musi mieć co najmniej 2 znaki';
    if (birthDate && birthDate > toISODate(new Date())) {
      errs.birthDate = 'Data urodzenia nie może być przyszła';
    }
    if (Object.keys(errs).length > 0) return setDataErrors(errs);

    setDataErrors({});
    setSavingData(true);
    try {
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(birthDate && { birthDate }),
      });
      setProfile(updated);
      await refreshProfile(); // odświeża imię w Navbarze
      setDataMessage('Dane zostały zapisane');
    } catch (err) {
      if (err instanceof ApiRequestError && err.errors) setDataErrors(err.errors);
      else if (err instanceof ApiRequestError) setDataError(err.message);
      else setDataError('Nie udało się zapisać zmian');
    } finally {
      setSavingData(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPassError(null);

    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Podaj obecne hasło';
    if (newPassword.length < 8) errs.newPassword = 'Hasło musi mieć co najmniej 8 znaków';
    if (confirmPassword !== newPassword) errs.confirmPassword = 'Hasła muszą być identyczne';
    if (Object.keys(errs).length > 0) return setPassErrors(errs);

    setPassErrors({});
    setSavingPass(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });

      clearSession();
      navigate('/login', {
        replace: true,
        state: { message: 'Hasło zostało zmienione. Zaloguj się nowym hasłem.' },
      });
    } catch (err) {
      if (err instanceof ApiRequestError && err.errors) setPassErrors(err.errors);
      else if (err instanceof ApiRequestError && err.status === 400) {
        setPassError('Obecne hasło jest nieprawidłowe');
      } else setPassError('Nie udało się zmienić hasła');
    } finally {
      setSavingPass(false);
    }
  };

  if (loadError) return <p className={styles.error}>{loadError}</p>;
  if (!profile) return <p className={styles.loading}>Ładowanie profilu…</p>;

  return (
    <div className={styles.page}>
      <h1>Mój profil</h1>

      <section className={styles.card}>
        <h2>Dane osobowe</h2>
        <form onSubmit={handleDataSubmit} noValidate>
          <label className={styles.field}>
            <span>Email</span>
            <input value={profile.email} disabled />
            <span className={styles.hint}>Adres służy do logowania i nie można go zmienić</span>
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>Imię</span>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              {dataErrors.firstName && <span className={styles.fieldError}>{dataErrors.firstName}</span>}
            </label>

            <label className={styles.field}>
              <span>Nazwisko</span>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              {dataErrors.lastName && <span className={styles.fieldError}>{dataErrors.lastName}</span>}
            </label>
          </div>

          <label className={styles.field}>
            <span>Data urodzenia</span>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            {dataErrors.birthDate && <span className={styles.fieldError}>{dataErrors.birthDate}</span>}
          </label>

          {dataError && <p className={styles.formError}>{dataError}</p>}
          {dataMessage && <p className={styles.success}>{dataMessage}</p>}

          <button type="submit" className={styles.primary} disabled={savingData}>
            {savingData ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Zmiana hasła</h2>
        <form onSubmit={handlePasswordSubmit} noValidate>
          <label className={styles.field}>
            <span>Obecne hasło</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            {passErrors.currentPassword && <span className={styles.fieldError}>{passErrors.currentPassword}</span>}
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>Nowe hasło</span>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
              {passErrors.newPassword && <span className={styles.fieldError}>{passErrors.newPassword}</span>}
            </label>

            <label className={styles.field}>
              <span>Potwierdź nowe hasło</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {passErrors.confirmPassword && <span className={styles.fieldError}>{passErrors.confirmPassword}</span>}
            </label>
          </div>

          {passError && <p className={styles.formError}>{passError}</p>}

          <button type="submit" className={styles.primary} disabled={savingPass}>
            {savingPass ? 'Zapisywanie...' : 'Zmień hasło'}
          </button>
        </form>
      </section>
      <section className={[styles.card, styles.dangerCard].join(' ')}>
        <h2>Strefa niebezpieczna</h2>
        <p className={styles.dangerText}>
          Usunięcie konta jest nieodwracalne — znikną wszystkie treningi i wpisy w dzienniku. Nie ma możliwości przywrócenia danych.
        </p>
        <button className={styles.dangerButton} onClick={() => setDeleteOpen(true)}>
          Usuń konto
        </button>
      </section>

      {deleteOpen && <DeleteAccountDialog email={profile.email} onClose={() => setDeleteOpen(false)} />}
    </div>
  );
}

export default ProfilePage;
