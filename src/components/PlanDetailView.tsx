import { useState } from 'react';
import { PlanStatus, TrainingPlan } from '../types/workout';
import { changeStatus, deletePlan } from '../services/trainingPlansApi';
import { ApiRequestError } from '../services/apiClient';
import { hexToRgba, darkenHex } from '../utils/color';
import Modal from './Modal';
import styles from '../styles/PlanDetailView.module.scss';

const STATUS_LABELS: Record<PlanStatus, string> = {
  PLANNED: 'Zaplanowany',
  COMPLETED: 'Ukończony',
  SKIPPED: 'Pominięty',
  CANCELLED: 'Anulowany',
};

interface PlanDetailViewProps {
  plan: TrainingPlan;
  onClose: () => void;
  onEdit: (plan: TrainingPlan) => void; // otwiera formularz w trybie edycji
  onChanged: () => void; // odświeża kalendarz
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(y, m - 1, d));
}

function PlanDetailView({ plan: initial, onClose, onEdit, onChanged }: PlanDetailViewProps) {
  const [plan, setPlan] = useState(initial);
  const [journalDialog, setJournalDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleStatusChange = async (status: PlanStatus) => {
    setBusy(true);
    setError(null);
    try {
      await changeStatus(plan.id, status);
      setPlan((p) => ({ ...p, status })); // aktualizacja lokalna — modal od razu spójny
      onChanged();                        // kalendarz w tle też się odświeży
      setJournalDialog(status === "COMPLETED");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Nie udało się zmienić statusu");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deletePlan(plan.id);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Nie udało się usunąć");
      setBusy(false);
    }
  };

  const time = plan.plannedTime ? plan.plannedTime.slice(0, 5) : null;

  return (
    <Modal title={plan.title} onClose={onClose}>
      <div className={styles.detail}>
        <span
          className={styles.categoryPill}
          style={{ background: hexToRgba(plan.categoryColor, 0.14), color: darkenHex(plan.categoryColor) }}
        >
          <span className={styles.dot} style={{ background: plan.categoryColor }} />
          {plan.categoryName}
        </span>

        <div className={styles.info}>
          <p>Data: {formatDate(plan.plannedDate)}{time ? `, ${time}` : ""}</p>
          {plan.durationMin && <p>Czas trwania: {plan.durationMin} min</p>}
          {plan.notes && <p className={styles.notes}>{plan.notes}</p>}
        </div>

        <label className={styles.statusField}>
          <span>Status</span>
          <select
            value={plan.status}
            disabled={busy}
            onChange={(e) => handleStatusChange(e.target.value as PlanStatus)}
          >
            {(Object.keys(STATUS_LABELS) as PlanStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>

        {journalDialog && (
          <div className={styles.journalBox}>
            <p><strong>Trening ukończony!</strong> Dodać wpis do dziennika?</p>
            <div className={styles.journalButtons}>
              <button
                className={styles.journalYes}
                onClick={() => {
                  // TODO moduł Dziennik: otworzy preuzupełniony formularz wpisu
                  console.log("TODO Dziennik: nowy wpis dla planu", plan.id);
                  setJournalDialog(false);
                }}
              >
                Tak, dodaj wpis
              </button>
              <button className={styles.journalNo} onClick={() => setJournalDialog(false)}>
                Nie teraz
              </button>
            </div>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.buttons}>
          <button className={styles.edit} onClick={() => onEdit(plan)}>Edytuj</button>
          {!confirmDelete ? (
            <button className={styles.delete} onClick={() => setConfirmDelete(true)}>Usuń</button>
          ) : (
            <>
              <button className={styles.delete} onClick={handleDelete} disabled={busy}>Tak, usuń</button>
              <button className={styles.edit} onClick={() => setConfirmDelete(false)}>Nie</button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default PlanDetailView;