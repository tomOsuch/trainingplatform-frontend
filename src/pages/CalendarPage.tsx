import { useEffect, useMemo, useState } from 'react';
import { TrainingPlan, WorkoutCategory } from '../types/workout';
import PlanTile from '../components/PlanTile';
import WeekView from '../components/WeekView';
import TrainingPlanForm from '../components/TrainingPlanForm';
import PlanDetailView from '../components/PlanDetailView';
import { getPlans } from '../services/trainingPlansApi';
import { getCategories } from '../services/categoriesApi';
import { buildMonthGrid, buildWeekGrid, startOfWeek, toISODate, MONTH_NAMES, WEEKDAY_NAMES } from '../utils/calendar';
import styles from '../styles/CalendarPage.module.scss';
import WorkoutLogForm from '../components/WorkoutLogForm';
import { WorkoutLogRequest } from '../types/workout';

function CalendarPage() {
  const [view, setView] = useState<'month' | 'week'>('month');

  // "kotwica": 1. dzień miesiąca (widok miesięczny) lub poniedziałek (tygodniowy)
  const [anchor, setAnchor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formDate, setFormDate] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [editPlan, setEditPlan] = useState<TrainingPlan | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // szkic wpisu do dziennika tworzony z ukończonego planu
  const [journalDraft, setJournalDraft] = useState<{
    initial: Partial<WorkoutLogRequest>;
    planTitle: string;
  } | null>(null);

  // 42 dni dla miesiąca, 7 dla tygodnia
  const grid = useMemo(() => (view === 'month' ? buildMonthGrid(anchor) : buildWeekGrid(anchor)), [anchor, view]);

  useEffect(() => {
    setError(null);
    getPlans(grid[0].iso, grid[grid.length - 1].iso)
      .then(setPlans)
      .catch((e) => setError(e.message ?? 'Nie udało się pobrać planów'));
  }, [grid, refreshKey]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const plansByDay = useMemo(() => {
    const map = new Map<string, TrainingPlan[]>();
    for (const p of plans) {
      const list = map.get(p.plannedDate) ?? [];
      list.push(p);
      map.set(p.plannedDate, list);
    }
    map.forEach((list) => list.sort((a, b) => (a.plannedTime ?? '99').localeCompare(b.plannedTime ?? '99')));
    return map;
  }, [plans]);

  // nawigacja: o miesiąc albo o tydzień, zależnie od widoku
  const shift = (dir: number) =>
    setAnchor((a) =>
      view === 'month' ? new Date(a.getFullYear(), a.getMonth() + dir, 1) : new Date(a.getFullYear(), a.getMonth(), a.getDate() + dir * 7),
    );

  const goToToday = () => {
    const now = new Date();
    setAnchor(view === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : startOfWeek(now));
  };

  // przy zmianie widoku normalizujemy kotwicę do właściwego "początku"
  const switchView = (next: 'month' | 'week') => {
    setView(next);
    setAnchor((a) => (next === 'week' ? startOfWeek(a) : new Date(a.getFullYear(), a.getMonth(), 1)));
  };

  const handleAddForDay = (iso: string) => setFormDate(iso);
  const handleSelectPlan = (plan: TrainingPlan) => setSelectedPlan(plan);

  const dm = (d: Date) => `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  const rangeLabel =
    view === 'month'
      ? `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`
      : `${dm(grid[0].date)} – ${dm(grid[6].date)}.${grid[6].date.getFullYear()}`;

  return (
    <div className={styles.calendar}>
      <div className={styles.toolbar}>
        <div className={styles.nav}>
          <button onClick={() => shift(-1)} aria-label="Poprzedni okres">
            ‹
          </button>
          <span className={styles.monthLabel}>{rangeLabel}</span>
          <button onClick={() => shift(1)} aria-label="Następny okres">
            ›
          </button>
          <button className={styles.todayButton} onClick={goToToday}>
            Dziś
          </button>
        </div>

        <div className={styles.actions}>
          <div className={styles.viewToggle}>
            <button className={view === 'month' ? styles.viewActive : undefined} onClick={() => switchView('month')}>
              Miesiąc
            </button>
            <button className={view === 'week' ? styles.viewActive : undefined} onClick={() => switchView('week')}>
              Tydzień
            </button>
          </div>
          <button className={styles.addButton} onClick={() => setFormDate(toISODate(new Date()))}>
            + Dodaj trening
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {view === 'month' ? (
        <>
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

                <button className={styles.addRow} onClick={() => handleAddForDay(day.iso)} aria-label={`Dodaj trening ${day.iso}`}>
                  + Dodaj
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <WeekView days={grid} plansByDay={plansByDay} onSelectPlan={handleSelectPlan} onAddForDay={handleAddForDay} />
      )}

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
          onAddJournalEntry={(p) => {
            setSelectedPlan(null);
            setJournalDraft({
              initial: {
                performedDate: p.plannedDate,
                categoryId: p.categoryId,
                planId: p.id,
                ...(p.durationMin && { durationMin: p.durationMin }),
              },
              planTitle: p.title,
            });
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
      
      {journalDraft && (
        <WorkoutLogForm
          categories={categories}
          initial={journalDraft.initial}
          planTitle={journalDraft.planTitle}
          onClose={() => setJournalDraft(null)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

export default CalendarPage;
