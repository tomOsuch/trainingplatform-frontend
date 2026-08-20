import { FormEvent, useState } from 'react';
import { WorkoutCategory, WorkoutLog, WorkoutLogRequest } from '../types/workout';
import { createLog, updateLog, deleteLog } from '../services/workoutLogsApi';
import { ApiRequestError } from '../services/apiClient';
import { toISODate } from '../utils/calendar';
import Modal from './Modal';
import styles from '../styles/WorkoutLogForm.module.scss';

interface WorkoutLogFormProps {
  categories: WorkoutCategory[];
  log?: WorkoutLog;
  initial?: Partial<WorkoutLogRequest>;
  planTitle?: string;
  onClose: () => void;
  onSaved: () => void;
}

function WorkoutLogForm({ categories, log, initial, planTitle, onClose, onSaved }: WorkoutLogFormProps) {
  const editMode = Boolean(log);
  const today = toISODate(new Date());

  const [title, setTitle] = useState(log?.title ?? initial?.title ?? '');
  const [performedDate, setPerformedDate] = useState(log?.performedDate ?? initial?.performedDate ?? today);
  const [performedTime, setPerformedTime] = useState(log?.performedTime?.slice(0, 5) ?? initial?.performedTime?.slice(0, 5) ?? '');
  const [categoryId, setCategoryId] = useState(String(log?.categoryId ?? initial?.categoryId ?? ''));
  const [durationMin, setDurationMin] = useState(String(log?.durationMin ?? initial?.durationMin ?? ''));
  const [intensity, setIntensity] = useState(log?.intensity ?? 5);
  const [notes, setNotes] = useState(log?.notes ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // planId niesiemy przez cały czas życia formularza — pochodzi z wpisu albo z planu
  const planId = log?.planId ?? initial?.planId ?? undefined;
  const selectedColor = categories.find((c) => String(c.id) === categoryId)?.color;

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!categoryId) e.categoryId = 'Wybierz kategorię';

    if (!performedDate) {
      e.performedDate = 'Wybierz datę';
    } else if (performedDate > today && performedDate !== log?.performedDate) {
      // przyszła data blokuje tylko nowe wpisy i faktyczną zmianę daty
      e.performedDate = 'Data nie może być przyszła';
    }

    if (durationMin && Number(durationMin) <= 0) e.durationMin = 'Czas musi być większy od 0';
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    const v = validate();
    if (Object.keys(v).length > 0) return setErrors(v);

    const payload: WorkoutLogRequest = {
      categoryId: Number(categoryId),
      ...(title.trim() && { title: title.trim() }),
      performedDate,
      intensity,
      ...(planId && { planId }),
      ...(durationMin && { durationMin: Number(durationMin) }),
      ...(notes.trim() && { notes: notes.trim() }),
      ...(performedTime && { performedTime }),
    };

    setSubmitting(true);
    try {
      if (editMode) await updateLog(log!.id, payload);
      else await createLog(payload);
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
      await deleteLog(log!.id);
      onSaved();
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : 'Nie udało się usunąć');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={editMode ? 'Edytuj wpis' : 'Nowy wpis'} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {planTitle && <div className={styles.planBadge}>Powiązany z planem: {planTitle}</div>}

        <label className={styles.field}>
          <span>Tytuł</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="np. Salsa — zajęcia grupowe" />
          {errors.title && <span className={styles.fieldError}>{errors.title}</span>}
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>Data *</span>
            <input type="date" value={performedDate} onChange={(e) => setPerformedDate(e.target.value)} />
            {errors.performedDate && <span className={styles.fieldError}>{errors.performedDate}</span>}
          </label>

          <label className={styles.field}>
            <span>Godzina</span>
            <input type="time" value={performedTime} onChange={(e) => setPerformedTime(e.target.value)} />
            {errors.performedTime && <span className={styles.fieldError}>{errors.performedTime}</span>}
          </label>
        </div>

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

        <label className={styles.field}>
          <span>Czas trwania (min)</span>
          <input type="number" min="1" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
          {errors.durationMin && <span className={styles.fieldError}>{errors.durationMin}</span>}
        </label>

        <div className={styles.field}>
          <div className={styles.intensityHeader}>
            <span>Intensywność</span>
            <span className={styles.intensityValue}>{intensity}</span>
          </div>
          <input
            className={styles.slider}
            type="range"
            min={1}
            max={10}
            step={1}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
          />
          <div className={styles.scaleLabels}>
            <span>1 — lekki</span>
            <span>10 — maksymalny</span>
          </div>
        </div>

        <label className={styles.field}>
          <span>Notatki</span>
          <textarea rows={3} placeholder="Jak poszło?" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
            Usuń wpis
          </button>
        )}
        {editMode && confirmDelete && (
          <div className={styles.confirmBox}>
            <span>Usunąć bezpowrotnie?</span>
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

export default WorkoutLogForm;
