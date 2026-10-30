import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../types/profile';
import { setCoachMode } from '../services/profileApi';
import { getCooperationInvitations, getCooperations } from '../services/cooperationApi';
import { ApiRequestError } from '../services/apiClient';
import { plural } from '../utils/format';
import Modal from './Modal';
import toggle from '../styles/NotificationsSettings.module.scss';
import styles from '../styles/CoachModeSettings.module.scss';

interface CoachModeSettingsProps {
  enabled: boolean;
  onChanged: (profile: UserProfile) => void;
}

interface CoachSummary {
  athletes: number;
  pending: number;
}

function CoachModeSettings({ enabled, onChanged }: CoachModeSettingsProps) {
  const [summary, setSummary] = useState<CoachSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSummary(null);
      setSummaryLoading(false);
      return;
    }

    let active = true;
    setSummaryLoading(true);

    Promise.all([getCooperations(), getCooperationInvitations()])
      .then(([coops, invs]) => {
        if (!active) return;
        setSummary({
          athletes: coops.filter((c) => c.role === 'COACH').length,
          pending: invs.filter((i) => i.role === 'COACH' && i.status === 'PENDING').length,
        });
      })
      .catch(() => {
        if (active) setSummary(null);
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, reloadKey]);

  const locked = enabled && summary !== null && summary.athletes > 0;

  const save = async (next: boolean) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const profile = await setCoachMode(next);
      setConfirming(false);
      onChanged(profile);
      setMessage(next ? 'Tryb trenera włączony.' : 'Tryb trenera wyłączony.');
    } catch (err) {
      setConfirming(false);
      if (err instanceof ApiRequestError && err.status === 409) {
        setError(err.message);
        setReloadKey((k) => k + 1);
      } else {
        setError(err instanceof ApiRequestError ? err.message : 'Nie udało się zmienić trybu trenera');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (next: boolean) => {
    setError(null);
    setMessage(null);
    if (next || summary?.pending === 0) save(next);
    else setConfirming(true);
  };

  const pending = summary?.pending;

  return (
    <div className={styles.wrap}>
      <label className={[enabled ? toggle.toggleRowOn : toggle.toggleRow, locked ? styles.locked : ''].filter(Boolean).join(' ')}>
        <input
          type="checkbox"
          className={toggle.checkbox}
          checked={enabled}
          disabled={saving || summaryLoading || locked}
          aria-describedby={locked ? 'coach-mode-lock' : undefined}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        <span className={enabled ? toggle.switchOn : toggle.switch} aria-hidden="true">
          <span className={toggle.knob} />
        </span>
        <span className={toggle.toggleText}>
          <b>Prowadzę innych</b>
          <span>
            {enabled ? 'Zapraszasz podopiecznych na ekranie Współpraca.' : 'Wyłączony. Nie zapraszasz podopiecznych.'} Trener nadal może
            zaprosić Ciebie.
          </span>
        </span>
      </label>

      {locked && summary && (
        <p id="coach-mode-lock" className={styles.lock}>
          Prowadzisz {summary.athletes} {plural(summary.athletes, 'osobę', 'osoby', 'osób')}. Zanim wyłączysz tryb trenera, zakończ
          współpracę na ekranie <Link to="/wspolpraca">Współpraca</Link>.
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      {confirming && (
        <Modal title="Wyłączyć tryb trenera?" onClose={() => setConfirming(false)}>
          <ul className={styles.consequences}>
            <li>
              <b>
                {pending !== undefined
                  ? `${pending} ${plural(
                      pending,
                      'oczekujące zaproszenie zostanie wycofane',
                      'oczekujące zaproszenia zostaną wycofane',
                      'oczekujących zaproszeń zostanie wycofanych',
                    )}.`
                  : 'Oczekujące zaproszenia, jeśli są, zostaną wycofane.'}
              </b>{' '}
              Adresaci nie dostaną powiadomienia — zaproszenie po prostu zniknie z ich listy.
            </li>
            <li>Sekcja „Prowadzę" zniknie z ekranu współpracy.</li>
            <li>To, czy ktoś może prowadzić Ciebie, się nie zmienia.</li>
          </ul>

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setConfirming(false)}>
              Anuluj
            </button>
            <button type="button" className={styles.danger} disabled={saving} onClick={() => save(false)}>
              Wyłącz i wycofaj zaproszenia
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default CoachModeSettings;
