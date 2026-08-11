import { useEffect, useMemo, useState } from "react";
import { TrainingPlan } from "../types/workout";
import { getPlans } from "../services/trainingPlansApi";
import { buildMonthGrid, MONTH_NAMES, WEEKDAY_NAMES } from "../utils/calendar";
import styles from "../styles/CalendarPage.module.scss";

function CalendarPage() {
  // "kotwica" = zawsze 1. dzień oglądanego miesiąca
  const [anchor, setAnchor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const grid = useMemo(() => buildMonthGrid(anchor), [anchor]);

  // pobieramy plany dla CAŁEJ widocznej siatki (42 dni),
  // żeby dni z sąsiednich miesięcy też miały swoje treningi
  useEffect(() => {
    setError(null);
    getPlans(grid[0].iso, grid[41].iso)
      .then(setPlans)
      .catch((e) => setError(e.message ?? "Nie udało się pobrać planów"));
  }, [grid]);

  // mapa: "YYYY-MM-DD" -> lista planów tego dnia
  const plansByDay = useMemo(() => {
    const map = new Map<string, TrainingPlan[]>();
    for (const p of plans) {
      const list = map.get(p.plannedDate) ?? [];
      list.push(p);
      map.set(p.plannedDate, list);
    }
    return map;
  }, [plans]);

  const goToMonth = (offset: number) =>
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + offset, 1));

  const goToToday = () => {
    const now = new Date();
    setAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.toolbar}>
        <div className={styles.nav}>
          <button onClick={() => goToMonth(-1)} aria-label="Poprzedni miesiąc">‹</button>
          <span className={styles.monthLabel}>
            {MONTH_NAMES[anchor.getMonth()]} {anchor.getFullYear()}
          </span>
          <button onClick={() => goToMonth(1)} aria-label="Następny miesiąc">›</button>
          <button className={styles.todayButton} onClick={goToToday}>Dziś</button>
        </div>

        <div className={styles.actions}>
          <div className={styles.viewToggle}>
            <button className={styles.viewActive}>Miesiąc</button>
            <button disabled title="Wkrótce (task 6/6)">Tydzień</button>
          </div>
          <button className={styles.addButton} disabled title="Wkrótce (task 4/6)">
            + Dodaj trening
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.weekdays}>
        {WEEKDAY_NAMES.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className={styles.grid}>
        {grid.map((day) => (
          <div
            key={day.iso}
            className={[
              styles.cell,
              !day.inCurrentMonth ? styles.outside : "",
              day.isToday ? styles.today : "",
            ].join(" ")}
          >
            {day.isToday
              ? <span className={styles.todayNumber}>{day.date.getDate()}</span>
              : <span className={styles.dayNumber}>{day.date.getDate()}</span>}

            {/* tymczasowa, surowa lista — w tasku 3/6 zamieni się w kafelki */}
            {(plansByDay.get(day.iso) ?? []).map((p) => (
              <div key={p.id} className={styles.planStub}>{p.title}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CalendarPage;