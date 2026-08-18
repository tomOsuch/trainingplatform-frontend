import { useEffect, useMemo, useState } from 'react';
import { WorkoutCategory, WorkoutLog, WorkoutLogFilters } from '../types/workout';
import { getLogs } from '../services/workoutLogsApi';
import { getCategories } from '../services/categoriesApi';
import WorkoutLogRow from '../components/WorkoutLogRow';
import styles from '../styles/WorkoutLogPage.module.scss';
import WorkoutLogForm from '../components/WorkoutLogForm';
import WorkoutLogDetail from '../components/WorkoutLogDetail';

function WorkoutLogPage() {
  const [categoryId, setCategoryId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [editLog, setEditLog] = useState<WorkoutLog | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const filtersActive = Boolean(categoryId || from || to);

  // obiekt filtrów przeliczany tylko przy zmianie pól — stabilna zależność efektu
  const filters = useMemo<WorkoutLogFilters>(
    () => ({
      ...(categoryId && { categoryId: Number(categoryId) }),
      ...(from && { from }),
      ...(to && { to }),
    }),
    [categoryId, from, to],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    getLogs(filters)
      .then((data) =>
        // gwarantujemy sortowanie malejące niezależnie od kolejności z API
        setLogs([...data].sort((a, b) => b.performedDate.localeCompare(a.performedDate))),
      )
      .catch((e) => setError(e.message ?? 'Nie udało się pobrać wpisów'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const clearFilters = () => {
    setCategoryId('');
    setFrom('');
    setTo('');
  };

  const handleSelectLog = (log: WorkoutLog) => setSelectedLog(log);

  const selectedColor = categories.find((c) => String(c.id) === categoryId)?.color;

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

        <button className={styles.clearButton} onClick={clearFilters} disabled={!filtersActive}>
          Wyczyść filtry
        </button>

        <span className={styles.count}>{loading ? '…' : `${logs.length} ${logs.length === 1 ? 'wpis' : 'wpisy'}`}</span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!loading && logs.length === 0 && !error && (
        <p className={styles.empty}>
          {filtersActive ? 'Brak wyników dla wybranych filtrów.' : 'Nie masz jeszcze żadnych wpisów. Dodaj pierwszy trening!'}
        </p>
      )}

      {formOpen && (
        <WorkoutLogForm categories={categories} onClose={() => setFormOpen(false)} onSaved={() => setRefreshKey((k) => k + 1)} />
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

      <div className={styles.list}>
        {logs.map((log) => (
          <WorkoutLogRow key={log.id} log={log} onClick={handleSelectLog} />
        ))}
      </div>
    </div>
  );
}

export default WorkoutLogPage;
