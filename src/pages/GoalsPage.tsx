import { useEffect, useMemo, useState } from 'react';
import { Goal, GoalStatusFilter } from '../types/goal';
import { changeGoalStatus, getGoals } from '../services/goalsApi';
import { sortGoals } from '../utils/goal';
import { plural } from '../utils/format';
import GoalCard from '../components/GoalCard';
import styles from '../styles/GoalsPage.module.scss';

const TABS: { key: GoalStatusFilter; label: string }[] = [
  { key: 'active', label: 'Aktywne' },
  { key: 'achieved', label: 'Osiągnięte' },
];

const EMPTY_TEXT: Record<GoalStatusFilter, string> = {
  active: 'Nie masz jeszcze żadnych celów. Dodaj pierwszy!',
  achieved: 'Nie masz jeszcze osiągniętych celów.',
};

function GoalsPage() {
  const [status, setStatus] = useState<GoalStatusFilter>('active');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getGoals(status)
      .then(setGoals)
      .catch((e) => setError(e.message ?? 'Nie udało się pobrać celów'))
      .finally(() => setLoading(false));
  }, [status, refreshKey]);

  // backend nie deklaruje kolejności — porządek ustalamy u siebie
  const items = useMemo(() => sortGoals(goals), [goals]);

  const handleAchieve = async (goal: Goal) => {
    setBusyId(goal.id);
    setError(null);
    try {
      await changeGoalStatus(goal.id, 'ACHIEVED');
      // cel znika z listy aktywnych i dostaje migawkę postępu — pełne odświeżenie
      // zamiast sklejania stanu lokalnie, bo zmienia się i wartość, i przynależność do sekcji
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError((e as Error).message ?? 'Nie udało się zamknąć celu');
    } finally {
      setBusyId(null);
    }
  };

  const countLabel = `${items.length} ${plural(items.length, 'cel', 'cele', 'celów')}`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Cele</h1>
        {/* podłączone w D7 — formularz jeszcze nie istnieje */}
        <button className={styles.addButton} disabled title="Formularz celu dochodzi w D7">
          + Dodaj cel
        </button>
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

      {!loading && !error && items.length === 0 && <p className={styles.empty}>{EMPTY_TEXT[status]}</p>}

      <div className={styles.grid}>
        {items.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onAchieve={handleAchieve} busy={busyId === goal.id} />
        ))}
      </div>
    </div>
  );
}

export default GoalsPage;
