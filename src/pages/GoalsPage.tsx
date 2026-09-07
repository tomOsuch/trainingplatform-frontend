import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Goal, GoalStatusFilter } from '../types/goal';
import { WorkoutCategory } from '../types/workout';
import { changeGoalStatus, getGoals } from '../services/goalsApi';
import { getCategories } from '../services/categoriesApi';
import { sortGoals } from '../utils/goal';
import { plural } from '../utils/format';
import GoalCard from '../components/GoalCard';
import GoalForm from '../components/GoalForm';
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
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    getGoals(status)
      .then(setGoals)
      .catch((e) => setError(e.message ?? 'Nie udało się pobrać celów'))
      .finally(() => setLoading(false));
  }, [status, refreshKey]);

  // kategorie pobieramy raz — słownik nie zmienia się w trakcie pracy z listą
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // backend nie deklaruje kolejności — porządek ustalamy u siebie
  const items = useMemo(() => sortGoals(goals), [goals]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleAchieve = async (goal: Goal) => {
    setBusyId(goal.id);
    setError(null);
    try {
      await changeGoalStatus(goal.id, 'ACHIEVED');
      // cel znika z listy aktywnych i dostaje migawkę postępu — pełne odświeżenie
      // zamiast sklejania stanu lokalnie
      refresh();
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
        <button className={styles.addButton} onClick={() => setFormOpen(true)}>
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
          <GoalCard
            key={goal.id}
            goal={goal}
            onOpen={(g) => navigate(`/cele/${g.id}`)}
            onAchieve={handleAchieve}
            onEdit={setEditGoal}
            busy={busyId === goal.id}
          />
        ))}
      </div>

      {formOpen && <GoalForm categories={categories} onClose={() => setFormOpen(false)} onSaved={refresh} />}

      {editGoal && <GoalForm categories={categories} goal={editGoal} onClose={() => setEditGoal(null)} onSaved={refresh} />}
    </div>
  );
}

export default GoalsPage;
