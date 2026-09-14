import { JournalItem } from '../types/workout';
import { hexToRgba, darkenHex, lightenHex } from '../utils/color';
import CategoryIcon from './CategoryIcon';
import { formatDatePl, weekdayPl } from '../utils/calendar';
import { formatDuration } from '../utils/format';
import styles from '../styles/WorkoutLogPage.module.scss';

interface WorkoutLogRowProps {
  item: JournalItem;
  onClick: (item: JournalItem) => void;
  onFillDetails: (item: JournalItem) => void;
}

const GRAY = '#94A3B8';

function WorkoutLogRow({ item, onClick, onFillDetails }: WorkoutLogRowProps) {
  const cancelled = item.state === 'cancelled';
  const color = cancelled ? GRAY : item.categoryColor;
  const done = item.state === 'done';

  const needsDetails = item.kind === 'plan' && item.state === 'done';

  return (
    <div className={[styles.row, !done ? styles.rowMuted : ''].join(' ')}>
      <button type="button" className={styles.rowMain} onClick={() => onClick(item)}>
        <div className={styles.dateCol}>
          <span className={styles.date}>{formatDatePl(item.date)}</span>
          <span className={styles.weekday}>
            {weekdayPl(item.date)}
            {item.time ? `, ${item.time.slice(0, 5)}` : ''}
          </span>
        </div>

        <span
          className={styles.pill}
          style={
            done
              ? { background: hexToRgba(color, 0.14), color: darkenHex(color) }
              : {
                  background: '#fff',
                  border: `1px dashed ${lightenHex(color, 0.6)}`,
                  color: darkenHex(color),
                }
          }
        >
          <CategoryIcon name={item.iconName} size={11} strokeWidth={2.4} />
          {item.categoryName}
          {item.state === 'skipped' && ' ✗'}
        </span>

        <div className={styles.mainCol}>
          <span className={cancelled ? styles.labelCancelled : styles.label}>{item.label}</span>
          <span className={styles.notes}>
            {item.durationMin ? formatDuration(item.durationMin) : '—'}
            {item.fromPlan && <span className={styles.fromPlan}> · z planu</span>}
            {item.state === 'skipped' && <span className={styles.stateNote}> · pominięty</span>}
            {cancelled && <span className={styles.stateNote}> · anulowany</span>}
            {item.notes ? ` · ${item.notes}` : ''}
          </span>
        </div>

        <div className={styles.intensityCol}>
          {item.intensity ? (
            <>
              <span className={styles.intensityLabel}>intensywność</span>
              <span className={styles.intensityValue}>
                <span className={styles.bar}>
                  <span className={styles.barFill} style={{ width: `${item.intensity * 10}%` }} />
                </span>
                {item.intensity}
              </span>
            </>
          ) : (
            <span className={styles.intensityEmpty}>—</span>
          )}
        </div>
      </button>

      {needsDetails && (
        <button type="button" className={styles.fillButton} onClick={() => onFillDetails(item)}>
          Uzupełnij szczegóły
        </button>
      )}
    </div>
  );
}

export default WorkoutLogRow;
