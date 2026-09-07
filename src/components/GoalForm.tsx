import { FormEvent, useState } from 'react';
import { Goal, GoalMetric, GoalRequest } from '../types/goal';
import { WorkoutCategory } from '../types/workout';
import { createGoal, updateGoal, deleteGoal } from '../services/goalsApi';
import { ApiRequestError } from '../services/apiClient';
import { toISODate } from '../utils/calendar';
import Modal from './Modal';
import styles from '../styles/GoalForm.module.scss';

const METRICS: { key: GoalMetric; label: string; unit: string }[] = [
  { key: 'SESSIONS', label: 'Liczba sesji', unit: 'sesji' },
  { key: 'MINUTES', label: 'Liczba minut', unit: 'minut' },
];

interface GoalFormProps {
  categories: WorkoutCategory[];
  goal?: Goal;
  onClose: () => void;
  onSaved: () => void;
}

function GoalForm({ categories, goal, onClose, onSaved }: GoalFormProps) {
  const editMode = Boolean(goal);

  const [title, setTitle] = useState(goal?.title ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [categoryId, setCategoryId] = useState(goal?.categoryId ? String(goal.categoryId) : '');
  const [metric, setMetric] = useState<GoalMetric>(goal?.metric ?? 'SESSIONS');
  const [targetValue, setTargetValue] = useState(goal ? String(goal.targetValue) : '');
  const [startDate, setStartDate] = useState(goal?.startDate ?? toISODate(new Date()));
  const [endDate, setEndDate] = useState(goal?.endDate ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const unit = METRICS.find((m) => m.key === metric)!.unit;
  const selectedColor = categories.find((c) => String(c.id) === categoryId)?.color;

  const deadlinePassed = Boolean(endDate) && endDate < toISODate(new Date());

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};

    if (!title.trim()) e.title = 'Podaj tytuł celu';
    if (!startDate) e.startDate = 'Wybierz datę początkową';

    const value = Number(targetValue);
    if (!targetValue || !Number.isInteger(value) || value <= 0) {
      e.targetValue = 'Wartość docelowa musi być większa od 0';
    }

    if (endDate && startDate && endDate < startDate) {
      e.endDate = 'Termin nie może być wcześniejszy niż data początkowa';
    }

    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormError(null);

    const v = validate();
    if (Object.keys(v).length > 0) return setErrors(v);

    const payload: GoalRequest = {
      title: title.trim(),
      metric,
      targetValue: Number(targetValue),
      startDate,
      ...(description.trim() && { description: description.trim() }),
      ...(categoryId && { categoryId: Number(categoryId) }),
      ...(endDate && { endDate }),
    };

    setSubmitting(true);
    try {
      if (editMode) await updateGoal(goal!.id, payload);
      else await createGoal(payload);
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
      await deleteGoal(goal!.id);
      onSaved();
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : 'Nie udało się usunąć celu');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={editMode ? 'Edytuj cel' : 'Nowy cel'} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span>Tytuł *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          {errors.title && <span className={styles.fieldError}>{errors.title}</span>}
        </label>

        <label className={styles.field}>
          <span>Kategoria</span>
          <div className={styles.categoryRow}>
            {selectedColor && <span className={styles.dot} style={{ background: selectedColor }} />}
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {/* cel bez kategorii liczy treningi ze wszystkich kategorii */}
              <option value="">— wszystkie kategorie —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {errors.categoryId && <span className={styles.fieldError}>{errors.categoryId}</span>}
        </label>

        {/* jedna miara na cel — przełącznik, nie dwa pola do wypełnienia */}
        <div className={styles.field}>
          <span>Miara *</span>
          <div className={styles.metricToggle} role="group" aria-label="Miara celu">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                className={metric === m.key ? styles.metricActive : undefined}
                onClick={() => setMetric(m.key)}
                aria-pressed={metric === m.key}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <label className={styles.field}>
          <span>Wartość docelowa *</span>
          <div className={styles.valueRow}>
            <input type="number" min="1" step="1" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
            <span className={styles.unit}>{unit}</span>
          </div>
          {errors.targetValue && <span className={styles.fieldError}>{errors.targetValue}</span>}
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>Od *</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            {errors.startDate && <span className={styles.fieldError}>{errors.startDate}</span>}
          </label>
          <label className={styles.field}>
            <span>Termin</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            {errors.endDate && <span className={styles.fieldError}>{errors.endDate}</span>}
          </label>
        </div>

        {!endDate && <p className={styles.hint}>Bez terminu cel pozostaje otwarty.</p>}
        {deadlinePassed && !errors.endDate && <p className={styles.warning}>Wybrany termin już minął.</p>}

        <label className={styles.field}>
          <span>Opis</span>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
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
            Usuń cel
          </button>
        )}
        {editMode && confirmDelete && (
          <div className={styles.confirmBox}>
            <span>Na pewno usunąć? Treningi z dziennika zostają.</span>
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

export default GoalForm;