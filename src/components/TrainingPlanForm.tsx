import { FormEvent, useState } from 'react';
import { TrainingPlan, TrainingPlanRequest, WorkoutCategory } from '../types/workout';
import { createPlan, updatePlan, deletePlan } from '../services/trainingPlansApi';
import { ApiRequestError } from '../services/apiClient';
import { toISODate } from '../utils/calendar';
import Modal from './Modal';
import styles from '../styles/TrainingPlanForm.module.scss';

interface TrainingPlanFormProps {
  categories: WorkoutCategory[];
  initialDate?: string; // z paska "+ Dodaj" na dniu
  plan?: TrainingPlan; // obecność = tryb edycji
  onClose: () => void;
  onSaved: () => void; // CalendarPage odświeży plany
}

function TrainingPlanForm({ categories, initialDate, plan, onClose, onSaved }: TrainingPlanFormProps) {
  const editMode = Boolean(plan);

  const [title, setTitle] = useState(plan?.title ?? '');
  const [categoryId, setCategoryId] = useState(String(plan?.categoryId ?? ''));
  const [plannedDate, setPlannedDate] = useState(plan?.plannedDate ?? initialDate ?? '');
  const [plannedTime, setPlannedTime] = useState(plan?.plannedTime?.slice(0, 5) ?? '');
  const [durationMin, setDurationMin] = useState(plan?.durationMin ? String(plan.durationMin) : '');
  const [notes, setNotes] = useState(plan?.notes ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedColor = categories.find((c) => String(c.id) === categoryId)?.color;

  const validate = (): Record<string, string> => {
  const e: Record<string, string> = {};
  if (!title.trim()) e.title = "Podaj tytuł treningu";
  if (!categoryId) e.categoryId = "Wybierz kategorię";

  if (!plannedDate) {
    e.plannedDate = "Wybierz datę";
  } else if (plannedDate < toISODate(new Date()) && plannedDate !== plan?.plannedDate) {
    // przeszła data blokuje tylko nowe plany i faktyczną zmianę daty;
    // edycja innych pól w historycznym planie musi być możliwa
    e.plannedDate = "Data nie może być przeszła";
  }

  if (durationMin && Number(durationMin) <= 0) e.durationMin = "Czas musi być większy od 0";
  return e;
};

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    const v = validate();
    if (Object.keys(v).length > 0) return setErrors(v);

    const payload: TrainingPlanRequest = {
      title: title.trim(),
      categoryId: Number(categoryId),
      plannedDate,
      ...(plannedTime && { plannedTime }),
      ...(durationMin && { durationMin: Number(durationMin) }),
      ...(notes.trim() && { notes: notes.trim() }),
    };

    setSubmitting(true);
    try {
      if (editMode) await updatePlan(plan!.id, payload);
      else await createPlan(payload);
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError && err.errors) setErrors(err.errors);
      else if (err instanceof ApiRequestError) setFormError(err.message);
      else setFormError('Coś poszło nie tak. Spróbuj ponownie.');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deletePlan(plan!.id);
      onSaved();
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : 'Nie udało się usunąć');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={editMode ? 'Edytuj trening' : 'Nowy trening'} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span>Tytuł *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          {errors.title && <span className={styles.fieldError}>{errors.title}</span>}
        </label>

        <label className={styles.field}>
          <span>Kategoria *</span>
          <div className={styles.categoryRow}>
            {selectedColor && <span className={styles.dot} style={{ background: selectedColor }} />}
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— wybierz —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {errors.categoryId && <span className={styles.fieldError}>{errors.categoryId}</span>}
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>Data *</span>
            <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
            {errors.plannedDate && <span className={styles.fieldError}>{errors.plannedDate}</span>}
          </label>
          <label className={styles.field}>
            <span>Godzina</span>
            <input type="time" value={plannedTime} onChange={(e) => setPlannedTime(e.target.value)} />
            {errors.plannedTime && <span className={styles.fieldError}>{errors.plannedTime}</span>}
          </label>
        </div>

        <label className={styles.field}>
          <span>Czas trwania (min)</span>
          <input type="number" min="1" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
          {errors.durationMin && <span className={styles.fieldError}>{errors.durationMin}</span>}
        </label>

        <label className={styles.field}>
          <span>Notatki</span>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        {formError && <p className={styles.formError}>{formError}</p>}

        <div className={styles.buttons}>
          <button type="submit" className={styles.save} disabled={submitting}>
            {submitting ? 'Zapisywanie...' : 'Zapisz'}
          </button>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Anuluj
          </button>
        </div>

        {editMode && !confirmDelete && (
          <button type="button" className={styles.delete} onClick={() => setConfirmDelete(true)}>
            Usuń trening
          </button>
        )}
        {editMode && confirmDelete && (
          <div className={styles.confirmBox}>
            <span>Na pewno usunąć?</span>
            <button type="button" className={styles.delete} onClick={handleDelete} disabled={submitting}>
              Tak, usuń
            </button>
            <button type="button" className={styles.cancel} onClick={() => setConfirmDelete(false)}>
              Nie
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}

export default TrainingPlanForm;
