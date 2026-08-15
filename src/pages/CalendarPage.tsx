import { useEffect, useMemo, useState } from 'react';
import { TrainingPlan } from '../types/workout';
import PlanTile from '../components/PlanTile';
import { getPlans } from '../services/trainingPlansApi';
import { buildMonthGrid, MONTH_NAMES, WEEKDAY_NAMES } from '../utils/calendar';
import styles from '../styles/CalendarPage.module.scss';
import { WorkoutCategory } from '../types/workout';
import { getCategories } from '../services/categoriesApi';
import { toISODate } from '../utils/calendar';
import TrainingPlanForm from '../components/TrainingPlanForm';
import PlanDetailView from '../components/PlanDetailView';

function CalendarPage() {
  // "kotwica" = zawsze 1. dzień oglądanego miesiąca
  const [anchor, setAnchor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [formDate, setFormDate] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [editPlan, setEditPlan] = useState<TrainingPlan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const grid = useMemo(() => buildMonthGrid(anchor), [anchor]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setError(null);
    getPlans(grid[0].iso, grid[41].iso)
      .then(setPlans)
      .catch((e) => setError(e.message ?? 'Nie udało się pobrać planów'));
  }, [grid, refreshKey]);

  const plansByDay = useMemo(() => {
    const map = new Map<string, TrainingPlan[]>();

    // 1. najpierw wypełniamy mapę...
    for (const p of plans) {
      const list = map.get(p.plannedDate) ?? [];
      list.push(p);
      map.set(p.plannedDate, list);
    }

    // 2. ...potem sortujemy plany w ramach każdego dnia
    map.forEach((list) => list.sort((a, b) => (a.plannedTime ?? '99').localeCompare(b.plannedTime ?? '99')));

    return map;
  }, [plans]);

  const goToMonth = (offset: number) => setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + offset, 1));

  const goToToday = () => {
    const now = new Date();
    setAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const handleAddForDay = (iso: string) => setFormDate(iso);

  const handleSelectPlan = (plan: TrainingPlan) => setSelectedPlan(plan);

  return (
    <div className={styles.calendar}>
      <div className={styles.toolbar}>
        <div className={styles.nav}>
          <button onClick={() => goToMonth(-1)} aria-label="Poprzedni miesiąc">
            ‹
          </button>
          <span className={styles.monthLabel}>
            {MONTH_NAMES[anchor.getMonth()]} {anchor.getFullYear()}
          </span>
          <button onClick={() => goToMonth(1)} aria-label="Następny miesiąc">
            ›
          </button>
          <button className={styles.todayButton} onClick={goToToday}>
            Dziś
          </button>
        </div>

        <div className={styles.actions}>
          <div className={styles.viewToggle}>
            <button className={styles.viewActive}>Miesiąc</button>
            <button disabled title="Wkrótce (task 6/6)">
              Tydzień
            </button>
          </div>
          <button className={styles.addButton} onClick={() => setFormDate(toISODate(new Date()))}>
            + Dodaj trening
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.weekdays}>
        {WEEKDAY_NAMES.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {grid.map((day) => (
          <div
            key={day.iso}
            className={[styles.cell, !day.inCurrentMonth ? styles.outside : '', day.isToday ? styles.today : ''].join(' ')}
          >
            <div className={styles.cellHeader}>
              {day.isToday ? (
                <span className={styles.todayNumber}>{day.date.getDate()}</span>
              ) : (
                <span className={styles.dayNumber}>{day.date.getDate()}</span>
              )}
            </div>

            {(plansByDay.get(day.iso) ?? []).map((p) => (
              <PlanTile key={p.id} plan={p} onClick={handleSelectPlan} />
            ))}

            {/* pasek dodawania — widoczny na hover, na dole komórki */}
            <button className={styles.addRow} onClick={() => handleAddForDay(day.iso)} aria-label={`Dodaj trening ${day.iso}`}>
              + Dodaj
            </button>
          </div>
        ))}
      </div>
      {formDate && (
        <TrainingPlanForm
          categories={categories}
          initialDate={formDate}
          onClose={() => setFormDate(null)}
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

export default CalendarPage;
