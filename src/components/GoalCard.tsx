import { Goal } from '../types/goal';
import { hexToRgba, darkenHex } from '../utils/color';
import { achievedLabel, deadlineLabel, formatProgress, isAchieved, periodLabel, progressPercent, progressWidth } from '../utils/goal';
import styles from '../styles/GoalsPage.module.scss';

const ACCENT = '#2563eb';
const NEUTRAL = '#9CA3AF';

interface GoalCardProps {
  goal: Goal;
  onAchieve: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  busy: boolean;
}

function GoalCard({ goal, onAchieve, onEdit, busy }: GoalCardProps) {
  const achieved = isAchieved(goal);
  const color = goal.categoryColor ?? ACCENT;
  const width = progressWidth(goal);

  const awaitingClose = !achieved && goal.targetReached;
  const deadline = achieved ? null : deadlineLabel(goal);

  const cardClass = [styles.card, achieved ? styles.cardMuted : '', awaitingClose ? styles.cardReached : ''].filter(Boolean).join(' ');

  const pillStyle = goal.categoryColor
    ? { background: hexToRgba(goal.categoryColor, 0.14), color: darkenHex(goal.categoryColor) }
    : { background: '#f3f4f6', color: '#4b5563' };

  return (
    <div className={cardClass}>
      <div className={styles.cardTop}>
        <span className={styles.pill} style={pillStyle}>
          <span className={styles.dot} style={{ background: goal.categoryColor ?? NEUTRAL }} />
          {goal.categoryName ?? 'Wszystkie kategorie'}
        </span>
        {awaitingClose && <span className={styles.badge}>Cel osiągnięty</span>}
        {achieved && <span className={styles.badgeDone}>Osiągnięty</span>}
      </div>

      <h2 className={styles.title}>{goal.title}</h2>

      <div
        className={styles.track}
        style={{ borderColor: color }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={width}
        aria-label={`Postęp celu: ${goal.title}`}
      >
        <div className={styles.fill} style={{ width: `${width}%`, background: color }} />
      </div>

      <div className={styles.progressLine}>
        <span className={styles.values}>{formatProgress(goal)}</span>
        <span className={styles.percent}>{progressPercent(goal)}%</span>
      </div>

      <div className={styles.meta}>
        {achieved ? (
          <span>{achievedLabel(goal)}</span>
        ) : (
          <>
            <span>{periodLabel(goal)}</span>
            <span>·</span>
            {deadline ? (
              <span className={deadline.overdue ? styles.metaWarn : undefined}>{deadline.text}</span>
            ) : (
              <span className={styles.metaOpen}>bez terminu</span>
            )}
          </>
        )}
      </div>

      <div className={styles.cardActions}>
        {!achieved && (
          <button type="button" className={styles.editButton} onClick={() => onEdit(goal)}>
            Edytuj
          </button>
        )}
        {awaitingClose && (
          <button type="button" className={styles.achieveButton} onClick={() => onAchieve(goal)} disabled={busy}>
            {busy ? 'Zamykanie…' : 'Oznacz jako osiągnięty'}
          </button>
        )}
      </div>
    </div>
  );
}

export default GoalCard;
