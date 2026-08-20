import { useState } from 'react';
import { WorkoutLog } from '../types/workout';
import { deleteLog } from '../services/workoutLogsApi';
import { ApiRequestError } from '../services/apiClient';
import { hexToRgba, darkenHex } from '../utils/color';
import { formatDatePl, weekdayPl } from '../utils/calendar';
import Modal from './Modal';
import styles from '../styles/WorkoutLogDetail.module.scss';

interface WorkoutLogDetailProps {
  log: WorkoutLog;
  onClose: () => void;
  onEdit: (log: WorkoutLog) => void;
  onChanged: () => void;
}

function WorkoutLogDetail({ log, onClose, onEdit, onChanged }: WorkoutLogDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteLog(log.id);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Nie udało się usunąć');
      setBusy(false);
    }
  };

  return (
    <Modal title={`Wpis z ${formatDatePl(log.performedDate)}`} onClose={onClose}>
      <div className={styles.detail}>
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

        <div className={styles.info}>
          <p>
            Data: {weekdayPl(log.performedDate)}, {formatDatePl(log.performedDate)}
            {log.performedTime ? `, ${log.performedTime.slice(0, 5)}` : ''}
          </p>
          {log.durationMin && <p>Czas trwania: {log.durationMin} min</p>}
        </div>

        {log.intensity && (
          <div>
            <p className={styles.label}>Intensywność</p>
            <div className={styles.bars}>
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className={i < log.intensity! ? styles.barOn : styles.barOff} style={{ height: 10 + i * 3 }} />
              ))}
            </div>
            <p className={styles.scale}>{log.intensity} / 10</p>
          </div>
        )}

        {log.notes && <div className={styles.notes}>{log.notes}</div>}

        {log.planId && <p className={styles.fromPlan}>Wpis powiązany z zaplanowanym treningiem</p>}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.buttons}>
          <button className={styles.edit} onClick={() => onEdit(log)}>
            Edytuj
          </button>
          {!confirmDelete ? (
            <button className={styles.delete} onClick={() => setConfirmDelete(true)}>
              Usuń
            </button>
          ) : (
            <>
              <button className={styles.delete} onClick={handleDelete} disabled={busy}>
                Tak, usuń
              </button>
              <button className={styles.edit} onClick={() => setConfirmDelete(false)}>
                Nie
              </button>
            </>
          )}
        </div>

        {confirmDelete && <p className={styles.warning}>Tej operacji nie można cofnąć.</p>}
      </div>
    </Modal>
  );
}

export default WorkoutLogDetail;
