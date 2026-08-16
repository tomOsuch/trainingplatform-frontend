import { useEffect, useRef } from 'react';
import { TrainingPlan } from '../types/workout';
import { CalendarDay, timeToMinutes } from '../utils/calendar';
import { hexToRgba, darkenHex } from '../utils/color';
import styles from '../styles/WeekView.module.scss';

const HOUR_HEIGHT = 44; // px na godzinę
const DEFAULT_DURATION = 60; // gdy plan nie ma durationMin
const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

interface WeekViewProps {
  days: CalendarDay[];
  plansByDay: Map<string, TrainingPlan[]>;
  onSelectPlan: (plan: TrainingPlan) => void;
  onAddForDay: (iso: string) => void;
}

function WeekView({ days, plansByDay, onSelectPlan, onAddForDay }: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // auto-scroll: do pierwszego treningu tygodnia, w ostatecznosci na 7:00
  useEffect(() => {
    const times = days
      .flatMap((d) => plansByDay.get(d.iso) ?? [])
      .map((p) => timeToMinutes(p.plannedTime))
      .filter((m): m is number => m !== null);

    const target = times.length ? Math.min(...times) : 7 * 60;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (target / 60) * HOUR_HEIGHT - HOUR_HEIGHT);
    }
  }, [days, plansByDay]);

  const timed = (iso: string) => (plansByDay.get(iso) ?? []).filter((p) => p.plannedTime);
  const allDay = (iso: string) => (plansByDay.get(iso) ?? []).filter((p) => !p.plannedTime);

  const renderBlock = (plan: TrainingPlan, positioned: boolean) => {
    const cancelled = plan.status === 'CANCELLED';
    const color = cancelled ? '#94A3B8' : plan.categoryColor;
    const icon = plan.status === 'COMPLETED' ? ' ✓' : plan.status === 'SKIPPED' ? ' ✗' : '';
    const start = timeToMinutes(plan.plannedTime) ?? 0;
    const duration = plan.durationMin ?? DEFAULT_DURATION;

    return (
      <button
        key={plan.id}
        className={positioned ? styles.block : styles.allDayChip}
        style={{
          background: hexToRgba(color, 0.16),
          borderColor: color,
          color: darkenHex(color),
          ...(positioned && {
            top: (start / 60) * HOUR_HEIGHT,
            height: Math.max((duration / 60) * HOUR_HEIGHT - 2, 18),
          }),
        }}
        onClick={() => onSelectPlan(plan)}
        title={plan.title}
      >
        <span className={cancelled ? styles.cancelled : undefined}>
          {plan.plannedTime ? `${plan.plannedTime.slice(0, 5)} ` : ''}
          {plan.title}
          {icon}
        </span>
      </button>
    );
  };

  return (
    <div className={styles.week}>
      <div className={styles.header}>
        <div className={styles.gutterCorner} />
        {days.map((d) => (
          <div key={d.iso} className={d.isToday ? styles.headerDayToday : styles.headerDay}>
            {WEEKDAYS[(d.date.getDay() + 6) % 7]} {d.date.getDate()}
          </div>
        ))}
      </div>

      <div className={styles.allDayRow}>
        <div className={styles.gutterLabel}>cały dzień</div>
        {days.map((d) => (
          <div key={d.iso} className={styles.allDayCell}>
            {allDay(d.iso).map((p) => renderBlock(p, false))}
          </div>
        ))}
      </div>

      <div className={styles.scroll} ref={scrollRef}>
        <div className={styles.body} style={{ height: 24 * HOUR_HEIGHT }}>
          <div className={styles.gutter}>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className={styles.hourLabel} style={{ height: HOUR_HEIGHT }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((d) => (
            <div
              key={d.iso}
              className={d.isToday ? styles.dayColumnToday : styles.dayColumn}
              onDoubleClick={() => onAddForDay(d.iso)}
              title="Kliknij dwukrotnie, aby dodać trening"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className={styles.hourLine} style={{ height: HOUR_HEIGHT }} />
              ))}
              {timed(d.iso).map((p) => renderBlock(p, true))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WeekView;
