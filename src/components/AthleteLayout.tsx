import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { Athlete } from '../types/cooperation';
import { getAthletes } from '../services/coachApi';
import styles from '../styles/AthleteLayout.module.scss';

const TABS = [{ to: 'statystyki', label: 'Statystyki' }];

function athleteName(a: Athlete): string {
  const full = `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim();
  return full || a.email;
}

function AthleteLayout() {
  const { athleteId: param } = useParams();
  const navigate = useNavigate();
  const athleteId = Number(param);

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);

  const leave = useCallback(
    (lostAccess?: string) => navigate('/wspolpraca', { replace: true, state: lostAccess ? { lostAccess } : undefined }),
    [navigate],
  );

  const onForbidden = useCallback(() => leave('Nie masz już dostępu do danych tej osoby.'), [leave]);

  useEffect(() => {
    if (!Number.isInteger(athleteId) || athleteId <= 0) {
      leave();
      return;
    }

    let active = true;
    setLoading(true);

    getAthletes()
      .then((list) => {
        if (!active) return;
        const found = list.find((a) => a.id === athleteId);

        if (found) setAthlete(found);
        else leave('Nie masz już dostępu do danych tej osoby.');
      })
      .catch(() => {
        if (active) leave('Nie udało się otworzyć danych podopiecznego.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [athleteId, leave]);

  if (loading) return <p className={styles.loading}>Ładowanie…</p>;
  if (!athlete) return null; // trwa przekierowanie

  return (
    <div className={styles.mode}>
      <div className={styles.bar}>
        <span className={styles.who}>
          Oglądasz dane podopiecznego · <b>{athleteName(athlete)}</b>
        </span>
        <button type="button" className={styles.out} onClick={() => leave()}>
          ← Wróć do swoich danych
        </button>
      </div>

      <div className={styles.body}>
        <nav className={styles.tabs} aria-label="Dane podopiecznego">
          {TABS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
              {label}
            </NavLink>
          ))}
        </nav>

        <Outlet context={{ athleteId, onForbidden } satisfies AthleteContextValue} />
      </div>
    </div>
  );
}

type AthleteContextValue = { athleteId: number; onForbidden: () => void };

export default AthleteLayout;
