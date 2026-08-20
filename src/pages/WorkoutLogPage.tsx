import { useEffect, useMemo, useState } from 'react';
import { JournalItem, TrainingPlan, WorkoutCategory, WorkoutLog, WorkoutLogFilters, WorkoutLogRequest } from '../types/workout';
import { getLogs } from '../services/workoutLogsApi';
import { getPlans } from '../services/trainingPlansApi';
import { getCategories } from '../services/categoriesApi';
import { buildJournalItems } from '../utils/journalItems';
import WorkoutLogRow from '../components/WorkoutLogRow';
import WorkoutLogForm from '../components/WorkoutLogForm';
import WorkoutLogDetail from '../components/WorkoutLogDetail';
import PlanDetailView from '../components/PlanDetailView';
import TrainingPlanForm from '../components/TrainingPlanForm';
import styles from '../styles/WorkoutLogPage.module.scss';

type StatusFilter = 'all' | 'done' | 'skipped' | 'cancelled';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'Wszystkie',
  done: 'Wykonane',
  skipped: 'Pominięte',
  cancelled: 'Anulowane',
};

function WorkoutLogPage() {
  const [categoryId, setCategoryId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [editLog, setEditLog] = useState<WorkoutLog | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [editPlan, setEditPlan] = useState<TrainingPlan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // szkic wpisu tworzony z ukończonego planu ("Uzupełnij szczegóły")
  const [draft, setDraft] = useState<{
    initial: Partial<WorkoutLogRequest>;
    planTitle: string;
  } | null>(null);

  const filtersActive = Boolean(categoryId || from || to || status !== 'all');

  const filters = useMemo<WorkoutLogFilters>(
    () => ({
      ...(categoryId && { categoryId: Number(categoryId) }),
      ...(from && { from }),
      ...(to && { to }),
    }),
    [categoryId, from, to],
  );

  // wpisy i plany pobieramy równolegle; filtry dat idą do API,
  // kategorię dla planów dofiltrowujemy po stronie frontu
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getLogs(filters), getPlans(from || undefined, to || undefined)])
      .then(([l, p]) => {
        setLogs(l);
        setPlans(categoryId ? p.filter((x) => x.categoryId === Number(categoryId)) : p);
      })
      .catch((e) => setError(e.message ?? 'Nie udało się pobrać danych'))
      .finally(() => setLoading(false));
  }, [filters, from, to, categoryId, refreshKey]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const items = useMemo(() => {
    const all = buildJournalItems(logs, plans);
    return status === 'all' ? all : all.filter((i) => i.state === status);
  }, [logs, plans, status]);

  const clearFilters = () => {
    setCategoryId('');
    setFrom('');
    setTo('');
    setStatus('all');
  };

  // klik w wiersz: wpis -> szczegóły wpisu, plan -> szczegóły planu
  const handleSelectItem = (item: JournalItem) => {
    if (item.kind === 'log') {
      const log = logs.find((l) => l.id === item.id);
      if (log) setSelectedLog(log);
    } else {
      const plan = plans.find((p) => p.id === item.id);
      if (plan) setSelectedPlan(plan);
    }
  };

  const openDraftFromPlan = (plan: TrainingPlan) =>
    setDraft({
      initial: {
        performedDate: plan.plannedDate,
        categoryId: plan.categoryId,
        planId: plan.id,
        ...(plan.durationMin && { durationMin: plan.durationMin }),
        ...(plan.plannedTime && { performedTime: plan.plannedTime.slice(0, 5) }),
      },
      planTitle: plan.title,
    });

  const handleFillDetails = (item: JournalItem) => {
    const plan = plans.find((p) => p.id === item.id);
    if (plan) openDraftFromPlan(plan);
  };

  const selectedColor = categories.find((c) => String(c.id) === categoryId)?.color;
  const countLabel = `${items.length} ${items.length === 1 ? 'pozycja' : 'pozycji'}`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Dziennik treningów</h1>
        <button className={styles.addButton} onClick={() => setFormOpen(true)}>
          + Dodaj wpis
        </button>
      </div>

      <div className={styles.filters}>
        <label className={styles.filterField}>
          <span>Kategoria</span>
          <div className={styles.selectWrap}>
            {selectedColor && <span className={styles.dot} style={{ background: selectedColor }} />}
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Wszystkie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className={styles.filterField}>
          <span>Od</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>

        <label className={styles.filterField}>
          <span>Do</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>

        <div className={styles.filterField}>
          <span>Status</span>
          <div className={styles.statusToggle}>
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
              <button key={s} className={status === s ? styles.statusActive : undefined} onClick={() => setStatus(s)}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <button className={styles.clearButton} onClick={clearFilters} disabled={!filtersActive}>
          Wyczyść filtry
        </button>

        <span className={styles.count}>{loading ? '…' : countLabel}</span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!loading && items.length === 0 && !error && (
        <p className={styles.empty}>
          {filtersActive ? 'Brak wyników dla wybranych filtrów.' : 'Nie masz jeszcze żadnych treningów w historii. Dodaj pierwszy wpis!'}
        </p>
      )}

      <div className={styles.list}>
        {items.map((item) => (
          <WorkoutLogRow key={item.key} item={item} onClick={handleSelectItem} onFillDetails={handleFillDetails} />
        ))}
      </div>

      {formOpen && (
        <WorkoutLogForm categories={categories} onClose={() => setFormOpen(false)} onSaved={() => setRefreshKey((k) => k + 1)} />
      )}

      {draft && (
        <WorkoutLogForm
          categories={categories}
          initial={draft.initial}
          planTitle={draft.planTitle}
          onClose={() => setDraft(null)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {selectedLog && (
        <WorkoutLogDetail
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onChanged={() => setRefreshKey((k) => k + 1)}
          onEdit={(l) => {
            setSelectedLog(null);
            setEditLog(l);
          }}
        />
      )}

      {editLog && (
        <WorkoutLogForm
          categories={categories}
          log={editLog}
          onClose={() => setEditLog(null)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {selectedPlan && (
        <PlanDetailView
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onChanged={() => setRefreshKey((k) => k + 1)}
          onEdit={(p) => {
            setSelectedPlan(null);
            setEditPlan(p);
          }}
          onAddJournalEntry={(p) => {
            setSelectedPlan(null);
            openDraftFromPlan(p);
          }}
        />
      )}

      {editPlan && (
        <TrainingPlanForm
          categories={categories}
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

export default WorkoutLogPage;
