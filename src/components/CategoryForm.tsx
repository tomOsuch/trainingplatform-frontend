import { FormEvent, useState } from 'react';
import { WorkoutCategory, WorkoutCategoryRequest } from '../types/workout';
import { createCategory, updateCategory } from '../services/categoriesApi';
import { ApiRequestError } from '../services/apiClient';
import CategoryIcon, { isKnownIcon } from './CategoryIcon';
import styles from '../styles/CategoryForm.module.scss';

const HEX = /^#[0-9a-fA-F]{6}$/;

interface CategoryFormProps {
  category: WorkoutCategory | null;
  iconNames: string[];
  onSaved: (saved: WorkoutCategory) => void;
  onCancel: () => void;
}

function CategoryForm({ category, iconNames, onSaved, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? '#2563EB');
  const [iconName, setIconName] = useState(category?.iconName ?? iconNames[0] ?? 'dumbbell');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    const trimmed = name.trim();

    if (!trimmed) next.name = 'Podaj nazwę kategorii';
    else if (trimmed.length > 100) next.name = 'Nazwa może mieć najwyżej 100 znaków';

    if (!HEX.test(color)) next.color = 'Kolor musi być zapisem szesnastkowym, na przykład #2563EB';
    if (!iconName) next.iconName = 'Wybierz ikonę';

    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const local = validate();
    setErrors(local);
    if (Object.keys(local).length > 0) return;

    const body: WorkoutCategoryRequest = { name: name.trim(), color: color.toUpperCase(), iconName };

    setSaving(true);
    try {
      const saved = category ? await updateCategory(category.id, body) : await createCategory(body);
      onSaved(saved);
    } catch (e) {
      const err = e as ApiRequestError;

      if (err.errors) setErrors(err.errors);
      else setFormError(err.message ?? 'Nie udało się zapisać kategorii');
    } finally {
      setSaving(false);
    }
  };

  const preview = { id: 0, name: name.trim() || 'Nazwa kategorii', color: HEX.test(color) ? color : '#2563EB', iconName };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.field}>
        <span>Nazwa</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
      </label>

      <label className={styles.field}>
        <span>Kolor</span>
        <span className={styles.colorRow}>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value.toUpperCase())} />
          <span className={styles.colorValue}>{color.toUpperCase()}</span>
        </span>
        {errors.color && <span className={styles.fieldError}>{errors.color}</span>}
      </label>

      <div className={styles.field}>
        <span>Ikona</span>
        <div className={styles.iconGrid} role="radiogroup" aria-label="Ikona kategorii">
          {iconNames.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={n === iconName}
              aria-label={n}
              title={isKnownIcon(n) ? n : `${n} — brak w zainstalowanej wersji biblioteki`}
              className={n === iconName ? styles.iconCellOn : styles.iconCell}
              onClick={() => setIconName(n)}
            >
              <CategoryIcon name={n} size={20} />
            </button>
          ))}
        </div>
        {errors.iconName && <span className={styles.fieldError}>{errors.iconName}</span>}
      </div>

      <div className={styles.preview}>
        <span className={styles.previewLabel}>Podgląd</span>
        <span className={styles.previewChip} style={{ background: preview.color }}>
          <CategoryIcon name={preview.iconName} size={18} />
          {preview.name}
        </span>
      </div>

      {formError && <p className={styles.formError}>{formError}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onCancel}>
          Anuluj
        </button>
        <button type="submit" className={styles.primary} disabled={saving}>
          {saving ? 'Zapisywanie…' : 'Zapisz'}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;
