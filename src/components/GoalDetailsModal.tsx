import { useEffect, useState } from 'react';
import { Goal, GoalEntry } from '../types/goal';
import { changeGoalStatus, getGoalEntries } from '../services/goalsApi';
import { hexToRgba, darkenHex } from '../utils/color';
import { formatDatePl, weekdayPl } from '../utils/calendar';
import { plural } from '../utils/format';
import { achievedLabel, deadlineLabel, formatProgress, isAchieved, periodLabel, progressPercent, progressWidth } from '../utils/goal';
import { formatDuration } from '../utils/format';
import Modal from './Modal';
import styles from '../styles/GoalDetailsModal.module.scss';

const ACCENT = '#2563eb';
const NEUTRAL = '#9CA3AF';

interface GoalDetailsModalProps {
  goal: Goal; // dane z listy — okno otwiera się od razu wypełnione
  onClose: () => void;
  onEdit: (goal: Goal) => void;
  onOpenEntry: (entry: GoalEntry) => void;
  onChanged: () => void;
}

function GoalDetailsModal({ goal, onClose, onEdit, onOpenEntry, onChanged }: GoalDetailsModalProps) {
  const [entries, setEntries] = useState<GoalEntry[] | null>(null); // null = jeszcze się ładuje
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getGoalEntries(goal.id)
      .then((data) => {
        if (active) setEntries(data);
      })
      .catch((e) => {
        if (active) {
          setEntries([]);
          setError(e.message ?? 'Nie udało się pobrać wliczonych treningów');
        }
      });
    return () => {
      active = false;
    };
  }, [goal.id]);

  const achieved = isAchieved(goal);
  const color = goal.categoryColor ?? ACCENT;
  const width = progressWidth(goal);
  const awaitingClose = !achieved && goal.targetReached;
  const deadline = achieved ? null : deadlineLabel(goal);

  const pillStyle = goal.categoryColor
    ? { background: hexToRgba(goal.categoryColor, 0.14), color: darkenHex(goal.categoryColor) }
    : { background: '#f3f4f6', color: '#4b5563' };

  const changeStatus = async (status: 'ACHIEVED' | 'ACTIVE') => {
    setBusy(true);
    setError(null);
    try {
      await changeGoalStatus(goal.id, status);

      onChanged();
      onClose();
    } catch (e) {
      setError((e as Error).message ?? 'Nie udało się zmienić statusu celu');
      setBusy(false);
    }
  };

  return (
    <Modal title={goal.title} onClose={onClose} wide>
      <div className={styles.body}>
        <div className={styles.head}>
          <span className={styles.pill} style={pillStyle}>
            <span className={styles.dot} style={{ background: goal.categoryColor ?? NEUTRAL }} />
            {goal.categoryName ?? 'Wszystkie kategorie'}
          </span>
          {achieved && <span className={styles.badgeDone}>Osiągnięty</span>}
        </div>

        {goal.description && <p className={styles.description}>{goal.description}</p>}

        <div
          className={styles.track}
          style={{ borderColor: color }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={width}
          aria-label={`Postęp celu: ${goal.title}`}
        >
          <div className={styles.fill} style={{ width: `${width}%`, background: color }} />
        </div>

        <div className={styles.progressLine}>
          <span className={styles.values}>{formatProgress(goal)}</span>
          <span className={styles.percent}>{progressPercent(goal)}%</span>
        </div>

        <div className={styles.meta}>
          {achieved ? (
            <span>{achievedLabel(goal)} — postęp zamknięty, nowe treningi go nie zmieniają</span>
          ) : (
            <>
              <span>{periodLabel(goal)}</span>
              <span>·</span>
              {deadline ? (
                <span className={deadline.overdue ? styles.metaWarn : undefined}>{deadline.text}</span>
              ) : (
                <span className={styles.metaOpen}>bez terminu</span>
              )}
            </>
          )}
        </div>

        {awaitingClose && <p className={styles.reachedNote}>Wartość docelowa osiągnięta. Możesz zamknąć ten cel.</p>}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          {!achieved ? (
            <>
              <button
                type="button"
                className={awaitingClose ? styles.primary : styles.secondary}
                onClick={() => changeStatus('ACHIEVED')}
                disabled={busy}
              >
                Oznacz jako osiągnięty
              </button>
              <button type="button" className={styles.secondary} onClick={() => onEdit(goal)} disabled={busy}>
                Edytuj
              </button>
            </>
          ) : (
            <button type="button" className={styles.secondary} onClick={() => changeStatus('ACTIVE')} disabled={busy}>
              Przywróć cel
            </button>
          )}
        </div>

        <h3 className={styles.sectionTitle}>
          Wliczone treningi
          {entries && (
            <span className={styles.count}>
              {entries.length} {plural(entries.length, 'trening', 'treningi', 'treningów')}
            </span>
          )}
        </h3>

        {entries === null && <p className={styles.empty}>Ładowanie…</p>}
        {entries?.length === 0 && <p className={styles.empty}>Żaden trening nie wliczył się jeszcze do tego celu.</p>}

        {entries && entries.length > 0 && (
          <div className={styles.list}>
            {entries.map((entry) => (
              <button key={entry.id} type="button" className={styles.entry} onClick={() => onOpenEntry(entry)}>
                <span className={styles.entryDate}>
                  {formatDatePl(entry.performedDate)}
                  <span className={styles.weekday}>{weekdayPl(entry.performedDate)}</span>
                </span>
                <span
                  className={styles.entryPill}
                  style={{ background: hexToRgba(entry.categoryColor, 0.14), color: darkenHex(entry.categoryColor) }}
                >
                  {entry.categoryName}
                </span>
                <span className={styles.entryTitle}>{entry.title ?? entry.categoryName}</span>
                <span className={styles.entryDuration}>{entry.durationMin ? formatDuration(entry.durationMin) : '—'}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default GoalDetailsModal;
