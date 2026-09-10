import { FormEvent, useEffect, useState } from 'react';
import { NotificationSettings } from '../types/notifications';
import { getNotificationSettings, updateNotificationSettings } from '../services/notificationsApi';
import { ApiRequestError } from '../services/apiClient';
import { plural } from '../utils/format';
import styles from '../styles/NotificationsSettings.module.scss';

const MIN_HOURS = 1;
const MAX_HOURS = 168;

function describeLead(hours: number): string {
  if (!Number.isInteger(hours) || hours < MIN_HOURS || hours > MAX_HOURS) return '';
  if (hours === 24) return 'dzień przed treningiem';
  if (hours === 168) return 'tydzień przed treningiem';

  if (hours < 24) return `${hours} ${plural(hours, 'godzina', 'godziny', 'godzin')} przed treningiem`;

  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  const daysText = `${days} ${plural(days, 'dzień', 'dni', 'dni')}`;

  return rest === 0
    ? `${daysText} przed treningiem`
    : `${daysText} i ${rest} ${plural(rest, 'godzina', 'godziny', 'godzin')} przed treningiem`;
}

interface NotificationsSettingsProps {
  email: string;
}

function NotificationsSettings({ email }: NotificationsSettingsProps) {
  const [enabled, setEnabled] = useState(false); // domyślnie wyłączone — to zgoda na kontakt, nie ustawienie wyglądu
  const [hours, setHours] = useState('24');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationSettings()
      .then((settings) => {
        setEnabled(settings.remindersEnabled);
        setHours(String(settings.reminderHoursBefore));
      })
      .catch((e) => setFormError(e.message ?? 'Nie udało się pobrać ustawień powiadomień'));
  }, []);

  const parsedHours = Number(hours.trim());
  const hoursValid = /^\d+$/.test(hours.trim()) && parsedHours >= MIN_HOURS && parsedHours <= MAX_HOURS;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setFormError(null);

    if (!hoursValid) {
      return setErrors({
        reminderHoursBefore: `Podaj liczbę godzin od ${MIN_HOURS} do ${MAX_HOURS}`,
      });
    }

    setErrors({});
    setSaving(true);
    try {
      // zawsze oba pola — wyłączenie zachowuje wybrane wyprzedzenie po stronie backendu
      await updateNotificationSettings({
        remindersEnabled: enabled,
        reminderHoursBefore: parsedHours,
      });
      setMessage('Zapisano ustawienia powiadomień');
    } catch (err) {
      if (err instanceof ApiRequestError && err.errors) setErrors(err.errors);
      else if (err instanceof ApiRequestError) setFormError(err.message);
      else setFormError('Coś poszło nie tak. Spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={enabled ? styles.toggleRowOn : styles.toggleRow}>
        {/* prawdziwy checkbox schowany wizualnie — obsługa klawiaturą i czytnikami zostaje */}
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            setMessage(null);
          }}
        />
        <span className={enabled ? styles.switchOn : styles.switch} aria-hidden="true">
          <span className={styles.knob} />
        </span>
        <span className={styles.toggleText}>
          <b>Przypomnienia o zaplanowanych treningach</b>
          {enabled ? (
            <span>
              Maile trafią na <b className={styles.inline}>{email}</b> — adresu nie można zmienić.
            </span>
          ) : (
            <span>Wyłączone — nie wysyłamy żadnych maili.</span>
          )}
        </span>
      </label>

      <label className={styles.field}>
        <span>Wyprzedzenie (w godzinach)</span>
        <input
          type="number"
          min={MIN_HOURS}
          max={MAX_HOURS}
          step={1}
          inputMode="numeric"
          className={styles.hoursInput}
          value={hours}
          onChange={(e) => {
            setHours(e.target.value);
            setMessage(null);
          }}
          disabled={!enabled} // pole zostaje nieaktywne, ale NIE zerujemy wartości —
        />
        {/* backend zapamiętuje wyprzedzenie także przy wyłączonych przypomnieniach */}
        {enabled && hoursValid && <span className={styles.preview}>{describeLead(parsedHours)}</span>}
        <span className={styles.hint}>
          Podaj wartość w godzinach — od {MIN_HOURS} do {MAX_HOURS} (tydzień). Przykład: 24 to dzień przed treningiem.
        </span>
        {errors.reminderHoursBefore && <span className={styles.fieldError}>{errors.reminderHoursBefore}</span>}
      </label>

      <p className={styles.note}>Trening zaplanowany bez godziny liczony jest tak, jakby zaczynał się o 12:00.</p>

      {formError && <p className={styles.formError}>{formError}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <button type="submit" className={styles.primary} disabled={saving}>
        {saving ? 'Zapisywanie...' : 'Zapisz powiadomienia'}
      </button>
    </form>
  );
}

export default NotificationsSettings;
