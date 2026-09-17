import { WeeklyBucket } from '../types/statistics';
import { toISODate } from '../utils/calendar';
import { formatDuration, plural } from '../utils/format';
import styles from '../styles/WeeklyChart.module.scss';

interface WeeklyChartProps {
  weeks: WeeklyBucket[];
  today?: string;
}

type WeekKind = 'done' | 'incomplete' | 'future';

function shortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${Number(day)}.${month}`;
}

function kindOf(week: WeeklyBucket, today: string): WeekKind {
  if (week.weekStart > today) return 'future';
  if (week.partial || week.weekEnd >= today) return 'incomplete';
  return 'done';
}

function weekDescription(week: WeeklyBucket, kind: WeekKind): string {
  const range = `${shortDate(week.weekStart)} – ${shortDate(week.weekEnd)}`;

  if (kind === 'future') return `${range} · tydzień jeszcze się nie zaczął`;

  const parts = [range];
  if (kind === 'incomplete') parts.push(week.partial ? 'tydzień przycięty granicą okresu' : 'tydzień jeszcze trwa');
  parts.push(
    week.workoutCount === 0
      ? 'brak treningów'
      : `${week.workoutCount} ${plural(week.workoutCount, 'trening', 'treningi', 'treningów')} · ${formatDuration(week.totalMinutes)}`,
  );

  return parts.join(' · ');
}

function WeeklyChart({ weeks, today = toISODate(new Date()) }: WeeklyChartProps) {
  const total = weeks.reduce((sum, w) => sum + w.workoutCount, 0);

  if (total === 0) {
    return <p className={styles.empty}>W tym okresie nie ma żadnych treningów — wykres pojawi się po pierwszym wpisie w dzienniku.</p>;
  }

  const max = Math.max(...weeks.map((w) => w.workoutCount));

  const labelEvery = weeks.length > 8 ? 2 : 1;

  return (
    <>
      <ul className={styles.chart} aria-label="Aktywność tygodniowa">
        {weeks.map((week, index) => {
          const kind = kindOf(week, today);
          const description = weekDescription(week, kind);

          return (
            <li key={week.weekStart} className={styles.col} title={description}>
              <span className={styles.srOnly}>{description}</span>

              <span className={week.workoutCount === 0 ? styles.countZero : styles.count} aria-hidden="true">
                {kind === 'future' ? '\u00A0' : week.workoutCount}
              </span>

              <span className={styles.slot} aria-hidden="true">
                {kind === 'future' ? (
                  <span className={styles.barFuture} />
                ) : week.workoutCount === 0 ? (
                  <span className={styles.barZero} />
                ) : (
                  <span
                    className={kind === 'incomplete' ? styles.barIncomplete : styles.bar}
                    style={{ height: `${(week.workoutCount / max) * 100}%` }}
                  />
                )}
              </span>

              <span className={styles.axisLabel} aria-hidden="true">
                {index % labelEvery === 0 ? shortDate(week.weekStart) : '\u00A0'}
              </span>
            </li>
          );
        })}
      </ul>

      <div className={styles.legend} aria-hidden="true">
        <span className={styles.legendItem}>
          <span className={styles.swatch} /> tydzień zakończony
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatchIncomplete} /> tydzień niepełny
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatchNone} /> bez treningów
        </span>
      </div>
    </>
  );
}

export default WeeklyChart;
