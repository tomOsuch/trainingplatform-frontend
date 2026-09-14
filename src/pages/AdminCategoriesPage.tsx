import { useCallback, useEffect, useState } from 'react';
import { CalendarItem, CalendarItemState, WorkoutCategory } from '../types/workout';
import { deleteCategory, getCategories, getIconNames } from '../services/categoriesApi';
import { ApiRequestError } from '../services/apiClient';
import CategoryIcon from '../components/CategoryIcon';
import CategoryForm from '../components/CategoryForm';
import CalendarTile from '../components/CalendarTile';
import Modal from '../components/Modal';
import styles from '../styles/AdminCategoriesPage.module.scss';

const previewItem = (category: WorkoutCategory, state: CalendarItemState): CalendarItem => ({
  key: `preview-${category.id}-${state}`,
  kind: 'plan',
  id: category.id,
  iconName: category.iconName,
  date: '',
  time: null,
  durationMin: null,
  label: category.name,
  color: category.color,
  state,
});

function AdminCategoriesPage() {
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [iconNames, setIconNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [editing, setEditing] = useState<WorkoutCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<WorkoutCategory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setListError(null);

    Promise.all([getCategories(), getIconNames()])
      .then(([cats, icons]) => {
        setCategories(cats);
        setIconNames(icons);
      })
      .catch((e) => setListError((e as ApiRequestError).message ?? 'Nie udało się pobrać kategorii'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleSaved = (saved: WorkoutCategory) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved];
    });
    setEditing(null);
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteError(null);
    setRemoving(true);

    try {
      await deleteCategory(deleting.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      setDeleteError((e as ApiRequestError).message ?? 'Nie udało się usunąć kategorii');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) return <p className={styles.muted}>Ładowanie…</p>;

  if (listError) {
    return (
      <div className={styles.errorBox}>
        <span>{listError}</span>
        <button type="button" className={styles.secondary} onClick={load}>
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <>
      {categories.length === 0 ? (
        <div className={styles.empty}>
          <p>Nie ma jeszcze żadnej kategorii.</p>
          <p className={styles.muted}>Bez kategorii użytkownik nie zaplanuje treningu ani nie ustawi celu.</p>
          <button type="button" className={styles.primary} onClick={() => setCreating(true)}>
            Dodaj pierwszą kategorię
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {categories.map((c) => (
            <article key={c.id} className={styles.card} aria-labelledby={`kategoria-${c.id}`}>
              <div className={styles.cardTop}>
                <span className={styles.swatch} style={{ background: c.color }}>
                  <CategoryIcon name={c.iconName} size={20} strokeWidth={2.2} />
                </span>
                <span className={styles.identity}>
                  <h3 id={`kategoria-${c.id}`}>{c.name}</h3>
                  <span className={styles.meta}>
                    {c.color.toLowerCase()} · {c.iconName}
                  </span>
                </span>
              </div>

              <div className={styles.preview} inert>
                <span className={styles.previewLabel}>W kalendarzu</span>
                <CalendarTile item={previewItem(c, 'planned')} onClick={() => {}} />
                <CalendarTile item={previewItem(c, 'done')} onClick={() => {}} />
              </div>

              <div className={styles.cardActions}>
                <button type="button" className={styles.secondary} onClick={() => setEditing(c)}>
                  Edytuj
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => {
                    setDeleting(c);
                    setDeleteError(null);
                  }}
                >
                  Usuń
                </button>
              </div>
            </article>
          ))}

          <button type="button" className={styles.addCard} onClick={() => setCreating(true)}>
            <CategoryIcon name="target" size={22} />
            <span>Dodaj kategorię</span>
          </button>
        </div>
      )}

      {(creating || editing) && (
        <Modal
          title={editing ? `Edycja: ${editing.name}` : 'Nowa kategoria'}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          wide
        >
          <CategoryForm
            category={editing}
            iconNames={iconNames}
            onSaved={handleSaved}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title={`Usunąć kategorię „${deleting.name}"?`} onClose={() => setDeleting(null)}>
          <p className={styles.muted}>
            Kategorii używanej w treningach lub celach nie da się usunąć — w takim wypadku zobaczysz, co trzeba zrobić najpierw.
          </p>
          {deleteError && <p className={styles.formError}>{deleteError}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondary} onClick={() => setDeleting(null)}>
              Anuluj
            </button>
            <button type="button" className={styles.danger} onClick={handleDelete} disabled={removing}>
              {removing ? 'Usuwanie…' : 'Usuń kategorię'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export default AdminCategoriesPage;
