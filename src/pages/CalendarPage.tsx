import { useEffect, useMemo, useState } from 'react';
import { CalendarItem, TrainingPlan, WorkoutCategory, WorkoutLog, WorkoutLogRequest } from '../types/workout';
import CalendarTile from '../components/CalendarTile';
import WeekView from '../components/WeekView';
import TrainingPlanForm from '../components/TrainingPlanForm';
import PlanDetailView from '../components/PlanDetailView';
import WorkoutLogForm from '../components/WorkoutLogForm';
import WorkoutLogDetail from '../components/WorkoutLogDetail';
import { getPlans } from '../services/trainingPlansApi';
import { getLogs } from '../services/workoutLogsApi';
import { getCategories } from '../services/categoriesApi';
import { buildItemsByDay } from '../utils/calendarItems';
import { buildMonthGrid, buildWeekGrid, startOfWeek, toISODate, MONTH_NAMES, WEEKDAY_NAMES } from '../utils/calendar';
import styles from '../styles/CalendarPage.module.scss';

function CalendarPage() {
  const [view, setView] = useState<'month' | 'week'>('month');

  // "kotwica": 1. dzień miesiąca (widok miesięczny) lub poniedziałek (tygodniowy)
  const [anchor, setAnchor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formDate, setFormDate] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [editPlan, setEditPlan] = useState<TrainingPlan | null>(null);
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [editLog, setEditLog] = useState<WorkoutLog | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // szkic wpisu do dziennika tworzony z ukończonego planu
  const [journalDraft, setJournalDraft] = useState<{
    initial: Partial<WorkoutLogRequest>;
    planTitle: string;
  } | null>(null);

  // 42 dni dla miesiąca, 7 dla tygodnia
  const grid = useMemo(() => (view === 'month' ? buildMonthGrid(anchor) : buildWeekGrid(anchor)), [anchor, view]);

  // plany i wpisy pobieramy równolegle dla całego widocznego zakresu
  useEffect(() => {
    const from = grid[0].iso;
    const to = grid[grid.length - 1].iso;

    setError(null);
    Promise.all([getPlans(from, to), getLogs({ from, to })])
      .then(([p, l]) => {
        setPlans(p);
        setLogs(l);
      })
      .catch((e) => setError(e.message ?? 'Nie udało się pobrać danych'));
  }, [grid, refreshKey]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // wspólna mapa dni: plany + samodzielne wpisy (te z planId są pomijane)
  const itemsByDay = useMemo(() => buildItemsByDay(plans, logs), [plans, logs]);

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

  // kliknięcie kafelka: odnajdujemy oryginalny obiekt po rodzaju i id
  const handleSelectItem = (item: CalendarItem) => {
    if (item.kind === 'plan') {
      const plan = plans.find((p) => p.id === item.id);
      if (plan) setSelectedPlan(plan);
    } else {
      const log = logs.find((l) => l.id === item.id);
      if (log) setSelectedLog(log);
    }
  };

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

                {(itemsByDay.get(day.iso) ?? []).map((item) => (
                  <CalendarTile key={item.key} item={item} onClick={handleSelectItem} />
                ))}

                <button className={styles.addRow} onClick={() => handleAddForDay(day.iso)} aria-label={`Dodaj trening ${day.iso}`}>
                  + Dodaj
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <WeekView days={grid} itemsByDay={itemsByDay} onSelectItem={handleSelectItem} onAddForDay={handleAddForDay} />
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
                title: p.title,
                performedDate: p.plannedDate,
                categoryId: p.categoryId,
                planId: p.id,
                ...(p.durationMin && { durationMin: p.durationMin }),
                ...(p.plannedTime && { performedTime: p.plannedTime.slice(0, 5) }),
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
    </div>
  );
}

export default CalendarPage;
