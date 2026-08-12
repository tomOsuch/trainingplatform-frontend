import { TrainingPlan } from '../types/workout';
import { hexToRgba, darkenHex } from '../utils/color';
import styles from '../styles/PlanTile.module.scss';

interface PlanTileProps {
  plan: TrainingPlan;
  onClick: (plan: TrainingPlan) => void;
}

const CANCELLED_GRAY = '#94A3B8';

function PlanTile({ plan, onClick }: PlanTileProps) {
  const cancelled = plan.status === 'CANCELLED';
  const color = cancelled ? CANCELLED_GRAY : plan.categoryColor;
  const time = plan.plannedTime ? plan.plannedTime.slice(0, 5) : null;
  const icon = plan.status === 'COMPLETED' ? '✓' : plan.status === 'SKIPPED' ? '✗' : null;

  return (
    <button
      type="button"
      className={styles.tile}
      style={{ background: hexToRgba(color, 0.14), color: darkenHex(color) }}
      onClick={() => onClick(plan)}
      title={plan.title}
    >
      <span className={styles.dot} style={{ background: color }} />
      <span className={cancelled ? styles.cancelledText : styles.text}>
        {plan.title}
        {time ? ` ${time}` : ""}
      </span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </button>
  );
}

export default PlanTile;
