import { WorkoutLog } from "../types/workout";
import { hexToRgba, darkenHex } from "../utils/color";
import { formatDatePl, weekdayPl } from "../utils/calendar";
import styles from "../styles/WorkoutLogPage.module.scss";

interface WorkoutLogRowProps {
  log: WorkoutLog;
  onClick: (log: WorkoutLog) => void;
}

function WorkoutLogRow({ log, onClick }: WorkoutLogRowProps) {
  return (
    <button type="button" className={styles.row} onClick={() => onClick(log)}>
      <div className={styles.dateCol}>
        <span className={styles.date}>{formatDatePl(log.performedDate)}</span>
        <span className={styles.weekday}>{weekdayPl(log.performedDate)}</span>
      </div>

      <span
        className={styles.pill}
        style={{
          background: hexToRgba(log.categoryColor, 0.14),
          color: darkenHex(log.categoryColor),
        }}
      >
        <span className={styles.dot} style={{ background: log.categoryColor }} />
        {log.categoryName}
      </span>

      <div className={styles.mainCol}>
        <span className={styles.duration}>
          {log.durationMin ? `${log.durationMin} min` : "—"}
          {log.planId && <span className={styles.fromPlan}> · z planu</span>}
        </span>
        <span className={styles.notes}>{log.notes || "—"}</span>
      </div>

      <div className={styles.intensityCol}>
        <span className={styles.intensityLabel}>intensywność</span>
        {log.intensity ? (
          <span className={styles.intensityValue}>
            <span className={styles.bar}>
              <span
                className={styles.barFill}
                style={{ width: `${log.intensity * 10}%` }}
              />
            </span>
            {log.intensity}
          </span>
        ) : (
          <span className={styles.intensityEmpty}>—</span>
        )}
      </div>
    </button>
  );
}

export default WorkoutLogRow;