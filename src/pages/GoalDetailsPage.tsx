import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GoalDetails, GoalEntry } from '../types/goal';
import { WorkoutCategory, WorkoutLog } from '../types/workout';
import { changeGoalStatus, getGoal } from '../services/goalsApi';
import { getLog } from '../services/workoutLogsApi';
import { getCategories } from '../services/categoriesApi';
import { ApiRequestError } from '../services/apiClient';
import { achievedLabel, deadlineLabel, formatProgress, isAchieved, periodLabel, progressPercent, progressWidth } from '../utils/goal';
import { hexToRgba, darkenHex } from '../utils/color';
import { formatDatePl, weekdayPl } from '../utils/calendar';
import { plural } from '../utils/format';
import GoalForm from '../components/GoalForm';
import WorkoutLogDetail from '../components/WorkoutLogDetail';
import WorkoutLogForm from '../components/WorkoutLogForm';
import styles from '../styles/GoalDetailsPage.module.scss';

const ACCENT = '#2563eb';
const NEUTRAL = '#9CA3AF';

function GoalDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goalId = Number(id);

  const [goal, setGoal] = useState<GoalDetails | null>(null);
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [editLog, setEditLog] = useState<WorkoutLog | null>(null);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getGoal(goalId)
      .then(setGoal)
      .catch((e) => {
        // 403 z backendu przy cudzym celu — komunikat nie zdradza, czy cel istnieje
        const notFound = e instanceof ApiRequestError && (e.status === 403 || e.status === 404);
        setError(notFound ? 'Nie znaleziono celu.' : (e.message ?? 'Nie udało się pobrać celu'));
      })
      .finally(() => setLoading(false));
  }, [goalId, refreshKey]);

  // kategorie do edycji celu i do edycji wpisu otwartego z listy
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const changeStatus = async (status: 'ACHIEVED' | 'ACTIVE') => {
    setBusy(true);
    setError(null);
    try {
      await changeGoalStatus(goalId, status);
      refresh(); // zmienia się i postęp (migawka), i zestaw dostępnych akcji
    } catch (e) {
      setError((e as Error).message ?? 'Nie udało się zmienić statusu celu');
    } finally {
      setBusy(false);
    }
  };

  const openEntry = async (entry: GoalEntry) => {
    setError(null);
    try {
      // lista z /goals/{id} jest skrócona — pełny wpis dociągamy pod modal dziennika
      setSelectedLog(await getLog(entry.id));
    } catch (e) {
      setError((e as Error).message ?? 'Nie udało się pobrać wpisu');
    }
  };

  if (loading) return <div className={styles.page}>Ładowanie…</div>;

  if (!goal) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error ?? 'Nie znaleziono celu.'}</p>
        <button type="button" className={styles.back} onClick={() => navigate('/cele')}>
          ← Wróć do celów
        </button>
      </div>
    );
  }

  const achieved = isAchieved(goal);
  const color = goal.categoryColor ?? ACCENT;
  const width = progressWidth(goal);
  const awaitingClose = !achieved && goal.targetReached;
  const deadline = achieved ? null : deadlineLabel(goal);

  const pillStyle = goal.categoryColor
    ? { background: hexToRgba(goal.categoryColor, 0.14), color: darkenHex(goal.categoryColor) }
    : { background: '#f3f4f6', color: '#4b5563' };

  const entries = goal.entries ?? [];
  const entriesLabel = `${entries.length} ${plural(entries.length, 'trening', 'treningi', 'treningów')}`;

  return (
    <div className={styles.page}>
      <button type="button" className={styles.back} onClick={() => navigate('/cele')}>
        ← Cele
      </button>

      <div className={styles.head}>
        <span className={styles.pill} style={pillStyle}>
          <span className={styles.dot} style={{ background: goal.categoryColor ?? NEUTRAL }} />
          {goal.categoryName ?? 'Wszystkie kategorie'}
        </span>
        {achieved && <span className={styles.badgeDone}>Osiągnięty</span>}
      </div>

      <h1 className={styles.title}>{goal.title}</h1>
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
        {!achieved && (
          <>
            <button
              type="button"
              className={awaitingClose ? styles.primary : styles.secondary}
              onClick={() => changeStatus('ACHIEVED')}
              disabled={busy}
            >
              Oznacz jako osiągnięty
            </button>
            <button type="button" className={styles.secondary} onClick={() => setEditOpen(true)}>
              Edytuj
            </button>
          </>
        )}
        {achieved && (
          <button type="button" className={styles.secondary} onClick={() => changeStatus('ACTIVE')} disabled={busy}>
            Przywróć cel
          </button>
        )}
      </div>

      <h2 className={styles.sectionTitle}>
        Wliczone treningi <span className={styles.count}>{entriesLabel}</span>
      </h2>

      {entries.length === 0 ? (
        <p className={styles.empty}>Żaden trening nie wliczył się jeszcze do tego celu.</p>
      ) : (
        <div className={styles.list}>
          {entries.map((entry) => (
            <button key={entry.id} type="button" className={styles.entry} onClick={() => openEntry(entry)}>
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
              <span className={styles.entryDuration}>{entry.durationMin ? `${entry.durationMin} min` : '—'}</span>
            </button>
          ))}
        </div>
      )}

      {editOpen && <GoalForm categories={categories} goal={goal} onClose={() => setEditOpen(false)} onSaved={refresh} />}

      {selectedLog && (
        <WorkoutLogDetail
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onChanged={refresh} // usunięcie lub zmiana wpisu przelicza postęp celu
          onEdit={(log) => {
            setSelectedLog(null);
            setEditLog(log);
          }}
        />
      )}

      {editLog && <WorkoutLogForm categories={categories} log={editLog} onClose={() => setEditLog(null)} onSaved={refresh} />}
    </div>
  );
}

export default GoalDetailsPage;