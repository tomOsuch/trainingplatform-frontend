import { useEffect, useMemo, useState } from 'react';
import { Goal, GoalEntry, GoalStatusFilter } from '../types/goal';
import { WorkoutCategory, WorkoutLog } from '../types/workout';
import { changeGoalStatus, getGoals } from '../services/goalsApi';
import { getCategories } from '../services/categoriesApi';
import { getLog } from '../services/workoutLogsApi';
import { sortGoals } from '../utils/goal';
import { plural } from '../utils/format';
import GoalCard from '../components/GoalCard';
import GoalForm from '../components/GoalForm';
import GoalDetailsModal from '../components/GoalDetailsModal';
import WorkoutLogDetail from '../components/WorkoutLogDetail';
import WorkoutLogForm from '../components/WorkoutLogForm';
import styles from '../styles/GoalsPage.module.scss';
import { useAthleteContext } from '../hooks/useAthleteContext';
import { ApiRequestError } from '../services/apiClient';

const TABS: { key: GoalStatusFilter; label: string }[] = [
  { key: 'active', label: 'Aktywne' },
  { key: 'achieved', label: 'Osiągnięte' },
];

const EMPTY_TEXT: Record<GoalStatusFilter, string> = {
  active: 'Nie masz jeszcze żadnych celów. Dodaj pierwszy!',
  achieved: 'Nie masz jeszcze osiągniętych celów.',
};

const ATHLETE_EMPTY_TEXT: Record<GoalStatusFilter, string> = {
  active: 'Ta osoba nie ma jeszcze żadnych aktywnych celów.',
  achieved: 'Ta osoba nie ma jeszcze osiągniętych celów.',
};

function GoalsPage() {
  const athlete = useAthleteContext();
  const [status, setStatus] = useState<GoalStatusFilter>('active');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // w danym momencie otwarte jest najwyżej jedno okno — nie układamy okna na oknie
  const [formOpen, setFormOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [detailsGoal, setDetailsGoal] = useState<Goal | null>(null);
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [editLog, setEditLog] = useState<WorkoutLog | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getGoals(status, athlete?.athleteId)
      .then(setGoals)
      .catch((e) => {
        if (athlete && e instanceof ApiRequestError && e.status === 403) return athlete.onForbidden();
        setError(e.message ?? 'Nie udało się pobrać celów');
      })
      .finally(() => setLoading(false));
  }, [status, refreshKey, athlete]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const items = useMemo(() => sortGoals(goals), [goals]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleAchieve = async (goal: Goal) => {
    setBusyId(goal.id);
    setError(null);
    try {
      await changeGoalStatus(goal.id, 'ACHIEVED');
      refresh();
    } catch (e) {
      setError((e as Error).message ?? 'Nie udało się zamknąć celu');
    } finally {
      setBusyId(null);
    }
  };

  // wpis z listy wliczonych treningów: zamykamy okno celu i otwieramy okno wpisu,
  // tym samym komponentem co w dzienniku
  const handleOpenEntry = async (entry: GoalEntry) => {
    setError(null);
    try {
      const log = await getLog(entry.id);
      setDetailsGoal(null);
      setSelectedLog(log);
    } catch (e) {
      setError((e as Error).message ?? 'Nie udało się pobrać wpisu');
    }
  };

  const countLabel = `${items.length} ${plural(items.length, 'cel', 'cele', 'celów')}`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Cele</h1>
        {!athlete && (
          <button className={styles.addButton} onClick={() => setFormOpen(true)}>
            + Dodaj cel
          </button>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.statusToggle}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={status === tab.key ? styles.statusActive : undefined}
              onClick={() => setStatus(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className={styles.count}>{loading ? '…' : countLabel}</span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className={styles.empty}>{athlete ? ATHLETE_EMPTY_TEXT[status] : EMPTY_TEXT[status]}</p>
      )}

      <div className={styles.grid}>
        {items.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onOpen={athlete ? undefined : setDetailsGoal}
            onAchieve={athlete ? undefined : handleAchieve}
            onEdit={athlete ? undefined : setEditGoal}
            busy={busyId === goal.id}
          />
        ))}
      </div>

      {detailsGoal && (
        <GoalDetailsModal
          goal={detailsGoal}
          onClose={() => setDetailsGoal(null)}
          onChanged={refresh}
          onOpenEntry={handleOpenEntry}
          onEdit={(g) => {
            setDetailsGoal(null);
            setEditGoal(g);
          }}
        />
      )}

      {formOpen && <GoalForm categories={categories} onClose={() => setFormOpen(false)} onSaved={refresh} />}

      {editGoal && (
        <GoalForm categories={categories} goal={editGoal} onClose={() => setEditGoal(null)} onSaved={refresh} />
      )}

      {selectedLog && (
        <WorkoutLogDetail
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onChanged={refresh} // zmiana wpisu przelicza postęp celu
          onEdit={(log) => {
            setSelectedLog(null);
            setEditLog(log);
          }}
        />
      )}

      {editLog && (
        <WorkoutLogForm categories={categories} log={editLog} onClose={() => setEditLog(null)} onSaved={refresh} />
      )}
    </div>
  );
}

export default GoalsPage;