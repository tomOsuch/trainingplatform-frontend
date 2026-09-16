import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WorkoutCategory } from '../types/workout';
import { WorkoutTemplate } from '../types/template';
import { deleteTemplate, getTemplates } from '../services/templatesApi';
import { getCategories } from '../services/categoriesApi';
import { ApiRequestError } from '../services/apiClient';
import { hexToRgba, darkenHex } from '../utils/color';
import { formatDuration, plural } from '../utils/format';
import CategoryIcon from '../components/CategoryIcon';
import TemplateForm from '../components/TemplateForm';
import Modal from '../components/Modal';
import styles from '../styles/TemplatesPage.module.scss';

function TemplatesPage() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null);
  const [deleting, setDeleting] = useState<WorkoutTemplate | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setListError(null);

    Promise.all([getTemplates(), getCategories()])
      .then(([tpl, cats]) => {
        setTemplates(tpl);
        setCategories(cats);
      })
      .catch((e) => setListError((e as ApiRequestError).message ?? 'Nie udało się pobrać szablonów'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleSaved = (saved: WorkoutTemplate) => {
    const known = templates.some((t) => t.id === saved.id);
    if (known) setTemplates((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    else load();

    setCreating(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteError(null);
    setRemoving(true);

    try {
      await deleteTemplate(deleting.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      setDeleteError((e as ApiRequestError).message ?? 'Nie udało się usunąć szablonu');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <Link to="/kalendarz" className={styles.back}>
            ← Kalendarz
          </Link>
          <h1>Szablony treningów</h1>
        </div>
        {templates.length > 0 && (
          <button type="button" className={styles.primary} onClick={() => setCreating(true)}>
            + Nowy szablon
          </button>
        )}
      </div>

      {listError && (
        <div className={styles.errorBox}>
          <span>{listError}</span>
          <button type="button" className={styles.secondary} onClick={load}>
            Spróbuj ponownie
          </button>
        </div>
      )}

      {loading && <p className={styles.muted}>Ładowanie…</p>}

      {!loading && !listError && (
        <section className={styles.card}>
          {templates.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyArt}>
                <CategoryIcon name="dumbbell" size={24} />
              </span>
              <p className={styles.emptyTitle}>Nie masz jeszcze żadnego szablonu</p>
              <p className={styles.muted}>
                Szablon zapamiętuje kategorię, czas trwania i opis powtarzalnego treningu. Przy planowaniu wybierasz go z listy i formularz
                wypełnia się sam — zostaje do podania data.
              </p>
              <button type="button" className={styles.primary} onClick={() => setCreating(true)}>
                Utwórz pierwszy szablon
              </button>
            </div>
          ) : (
            <ul className={styles.list} aria-label="Szablony treningów">
              {templates.map((t) => (
                <li key={t.id} className={styles.row}>
                  <span className={styles.pill} style={{ background: hexToRgba(t.categoryColor, 0.14), color: darkenHex(t.categoryColor) }}>
                    <CategoryIcon name={t.categoryIconName} size={13} strokeWidth={2.2} />
                    {t.categoryName}
                  </span>

                  <span className={styles.main}>
                    <span className={styles.name}>{t.name}</span>
                    <span className={t.description ? styles.desc : styles.descEmpty}>{t.description ?? 'bez opisu'}</span>
                  </span>

                  <span className={styles.duration}>{t.durationMin ? formatDuration(t.durationMin) : '—'}</span>

                  <span className={styles.actions}>
                    <button type="button" className={styles.secondary} onClick={() => setEditing(t)}>
                      Edytuj
                    </button>
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={() => {
                        setDeleting(t);
                        setDeleteError(null);
                      }}
                    >
                      Usuń
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!loading && templates.length > 0 && (
        <p className={styles.count}>
          {templates.length} {plural(templates.length, 'szablon', 'szablony', 'szablonów')}
        </p>
      )}

      {(creating || editing) && (
        <TemplateForm
          categories={categories}
          template={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <Modal title={`Usunąć szablon „${deleting.name}"?`} onClose={() => setDeleting(null)}>
          <p className={styles.muted}>
            Plany utworzone na jego podstawie zostaną nietknięte — szablon jest kopiowany przy wstawianiu, a nie powiązany z planem.
          </p>
          {deleteError && <p className={styles.formError}>{deleteError}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondary} onClick={() => setDeleting(null)}>
              Anuluj
            </button>
            <button type="button" className={styles.danger} onClick={handleDelete} disabled={removing}>
              {removing ? 'Usuwanie…' : 'Usuń szablon'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default TemplatesPage;
