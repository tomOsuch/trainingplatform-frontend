import { FormEvent, useState } from 'react';
import { WorkoutCategory } from '../types/workout';
import { WorkoutTemplate, WorkoutTemplateRequest } from '../types/template';
import { createTemplate, updateTemplate } from '../services/templatesApi';
import { ApiRequestError } from '../services/apiClient';
import { formatDuration, parseDuration } from '../utils/format';
import CategoryIcon from './CategoryIcon';
import Modal from './Modal';
import styles from '../styles/TemplateForm.module.scss';

interface TemplateFormProps {
  categories: WorkoutCategory[];
  template?: WorkoutTemplate;
  onClose: () => void;
  onSaved: (saved: WorkoutTemplate) => void;
}

function TemplateForm({ categories, template, onClose, onSaved }: TemplateFormProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [categoryId, setCategoryId] = useState(String(template?.categoryId ?? ''));
  const [duration, setDuration] = useState(template?.durationMin ? formatDuration(template.durationMin) : '');
  const [description, setDescription] = useState(template?.description ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = categories.find((c) => String(c.id) === categoryId);
  const parsed = duration.trim() ? parseDuration(duration) : null;

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const trimmed = name.trim();

    if (!trimmed) e.name = 'Podaj nazwę szablonu';
    else if (trimmed.length > 200) e.name = 'Nazwa może mieć najwyżej 200 znaków';

    if (!categoryId) e.categoryId = 'Wybierz kategorię';

    if (duration.trim() && parsed === null) e.durationMin = 'Podaj czas jak „45min" albo „1h 30min"';
    else if (parsed !== null && parsed <= 0) e.durationMin = 'Czas musi być większy od 0';

    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormError(null);

    const local = validate();
    setErrors(local);
    if (Object.keys(local).length > 0) return;

    const body: WorkoutTemplateRequest = {
      name: name.trim(),
      categoryId: Number(categoryId),
      ...(description.trim() && { description: description.trim() }),
      ...(parsed !== null && { durationMin: parsed }),
    };

    setSaving(true);
    try {
      const saved = template ? await updateTemplate(template.id, body) : await createTemplate(body);
      onSaved(saved);
    } catch (e) {
      const err = e as ApiRequestError;
      if (err.errors) setErrors(err.errors);
      else setFormError(err.message ?? 'Nie udało się zapisać szablonu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={template ? `Edycja: ${template.name}` : 'Nowy szablon'} onClose={onClose} wide>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span>Nazwa</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={220} />
          {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          <span className={styles.fieldHint}>Stanie się tytułem treningu po wstawieniu do planu.</span>
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>Kategoria</span>
            <span className={styles.selectWrap}>
              {selected && (
                <span className={styles.selectIcon} style={{ color: selected.color }}>
                  <CategoryIcon name={selected.iconName} size={15} strokeWidth={2.2} />
                </span>
              )}
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">— wybierz —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </span>
            {errors.categoryId && <span className={styles.fieldError}>{errors.categoryId}</span>}
          </label>

          <label className={styles.field}>
            <span>Czas trwania</span>
            <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="np. 1h 30min" />
            {errors.durationMin && <span className={styles.fieldError}>{errors.durationMin}</span>}
            <span className={styles.fieldHint}>
              {parsed !== null && parsed > 0 ? `Zapiszemy jako ${formatDuration(parsed)}.` : 'Nieobowiązkowy.'}
            </span>
          </label>
        </div>

        <label className={styles.field}>
          <span>Opis</span>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          <span className={styles.fieldHint}>Trafi do notatek planu.</span>
        </label>

        {formError && <p className={styles.formError}>{formError}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Anuluj
          </button>
          <button type="submit" className={styles.primary} disabled={saving}>
            {saving ? 'Zapisywanie…' : 'Zapisz szablon'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default TemplateForm;
