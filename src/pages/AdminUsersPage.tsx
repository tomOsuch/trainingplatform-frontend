import { useCallback, useEffect, useState } from 'react';
import { AccountStatus, AdminUser, AdminUsersSort, PageResponse } from '../types/admin';
import { getUsers, setUserStatus } from '../services/adminApi';
import { ApiRequestError } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatDatePl } from '../utils/calendar';
import { plural } from '../utils/format';
import Modal from '../components/Modal';
import styles from '../styles/AdminUsersPage.module.scss';

const PAGE_SIZE = 20;

function AdminUsersPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AccountStatus | ''>('');
  const [sort, setSort] = useState<AdminUsersSort>('LAST_NAME');
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebouncedValue(search);

  const [data, setData] = useState<PageResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState<AdminUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setListError(null);

    getUsers({ search: debouncedSearch, status: status || undefined, sort, page, size: PAGE_SIZE })
      .then(setData)
      .catch((e) => setListError((e as ApiRequestError).message ?? 'Nie udało się pobrać listy kont'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, sort, page]);

  useEffect(load, [load]);

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };
  const changeStatus = (value: AccountStatus | '') => {
    setStatus(value);
    setPage(0);
  };
  const changeSort = (value: AdminUsersSort) => {
    setSort(value);
    setPage(0);
  };

  const replaceRow = (updated: AdminUser) =>
    setData((prev) => (prev ? { ...prev, content: prev.content.map((u) => (u.id === updated.id ? updated : u)) } : prev));

  const activate = async (u: AdminUser) => {
    setActionError(null);
    try {
      replaceRow(await setUserStatus(u.id, 'ACTIVE'));
    } catch (e) {
      setActionError((e as ApiRequestError).message ?? 'Nie udało się włączyć konta');
    }
  };

  const deactivate = async () => {
    if (!confirming) return;
    setActionError(null);
    setSaving(true);

    try {
      replaceRow(await setUserStatus(confirming.id, 'INACTIVE'));
      setConfirming(null);
    } catch (e) {
      setActionError((e as ApiRequestError).message ?? 'Nie udało się wyłączyć konta');
    } finally {
      setSaving(false);
    }
  };

  const users = data?.content ?? [];
  const isLastPage = data ? data.page + 1 >= data.totalPages : true;
  const total = data?.totalElements ?? 0;

  return (
    <>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.grow}>
            <span>Szukaj</span>
            <input type="search" value={search} onChange={(e) => changeSearch(e.target.value)} placeholder="Nazwisko lub adres e-mail" />
          </label>

          <label>
            <span>Stan konta</span>
            <select value={status} onChange={(e) => changeStatus(e.target.value as AccountStatus | '')}>
              <option value="">Wszystkie</option>
              <option value="ACTIVE">Aktywne</option>
              <option value="INACTIVE">Wyłączone</option>
            </select>
          </label>

          <label>
            <span>Kolejność</span>
            <select value={sort} onChange={(e) => changeSort(e.target.value as AdminUsersSort)}>
              <option value="LAST_NAME">Alfabetycznie</option>
              <option value="NEWEST">Od najnowszych</option>
            </select>
          </label>
        </div>

        {listError && (
          <div className={styles.errorBox}>
            <span>{listError}</span>
            <button type="button" className={styles.secondary} onClick={load}>
              Spróbuj ponownie
            </button>
          </div>
        )}

        {actionError && !confirming && <p className={styles.formError}>{actionError}</p>}

        {loading && <p className={styles.muted}>Ładowanie…</p>}

        {!loading && !listError && users.length === 0 && (
          <div className={styles.empty}>
            {debouncedSearch || status ? (
              <>
                <p>Żadne konto nie pasuje do wybranych kryteriów.</p>
                <p className={styles.muted}>Szukamy w nazwisku i adresie e-mail.</p>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    changeSearch('');
                    changeStatus('');
                  }}
                >
                  Wyczyść filtry
                </button>
              </>
            ) : (
              <p>Nie ma jeszcze żadnych kont poza Twoim.</p>
            )}
          </div>
        )}

        {!loading && users.length > 0 && (
          <ul className={styles.list} aria-label="Konta użytkowników">
            {users.map((u) => {
              const own = user?.userId === u.id;

              return (
                <li key={u.id} className={u.active ? styles.row : styles.rowInactive}>
                  <div className={styles.identity}>
                    <span className={styles.name}>
                      {u.lastName} {u.firstName}
                    </span>
                    <span className={styles.email}>{u.email}</span>
                  </div>

                  <div className={styles.meta}>
                    {u.role === 'ADMIN' && <span className={styles.badgeAdmin}>Administrator</span>}
                    <span className={u.active ? styles.badgeActive : styles.badgeInactive}>{u.active ? 'Aktywne' : 'Wyłączone'}</span>
                    <span className={styles.date}>od {formatDatePl(u.createdAt.slice(0, 10))}</span>
                  </div>

                  <div className={styles.action}>
                    {own ? (
                      <>
                        <button type="button" className={styles.secondary} disabled>
                          Wyłącz
                        </button>
                        <span className={styles.tip} role="note">
                          Nie możesz wyłączyć własnego konta — straciłbyś dostęp do panelu.
                        </span>
                      </>
                    ) : u.active ? (
                      <button
                        type="button"
                        className={styles.danger}
                        onClick={() => {
                          setConfirming(u);
                          setActionError(null);
                        }}
                      >
                        Wyłącz
                      </button>
                    ) : (
                      <button type="button" className={styles.secondary} onClick={() => activate(u)}>
                        Włącz z powrotem
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !listError && total > 0 && (
          <div className={styles.pager}>
            <span className={styles.muted}>
              {total} {plural(total, 'konto', 'konta', 'kont')}
              {data && data.totalPages > 1 && ` · strona ${data.page + 1} z ${data.totalPages}`}
            </span>
            {data && data.totalPages > 1 && (
              <div className={styles.pagerButtons}>
                <button type="button" className={styles.secondary} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Poprzednia
                </button>
                <button type="button" className={styles.secondary} disabled={isLastPage} onClick={() => setPage((p) => p + 1)}>
                  Następna
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {confirming && (
        <Modal title={`Wyłączyć konto ${confirming.firstName} ${confirming.lastName}?`} onClose={() => setConfirming(null)}>
          <ul className={styles.consequences}>
            <li>
              Straci dostęp <strong>natychmiast</strong> — przy następnym kliknięciu, nie nazajutrz.
            </li>
            <li>Dane zostają nietknięte: treningi, plany i cele czekają.</li>
            <li>Przypomnienia przestają przychodzić.</li>
            <li>Konto można włączyć z powrotem w każdej chwili.</li>
          </ul>

          {actionError && <p className={styles.formError}>{actionError}</p>}

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondary} onClick={() => setConfirming(null)}>
              Anuluj
            </button>
            <button type="button" className={styles.danger} onClick={deactivate} disabled={saving}>
              {saving ? 'Wyłączanie…' : 'Wyłącz konto'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export default AdminUsersPage;
