import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Statistics, WeeklyStatistics } from '../types/statistics';
import { getStatistics, getWeeklyStatistics } from '../services/statisticsApi';
import {
  isCurrentMonth,
  monthKey,
  monthLabel,
  monthPeriod,
  periodLabelFromResponse,
  shiftMonth,
  startOfCurrentMonth,
} from '../utils/period';
import { formatDuration, plural } from '../utils/format';
import { darkenHex } from '../utils/color';
import CategoryIcon from '../components/CategoryIcon';
import WeeklyChart from '../components/WeeklyChart';
import styles from '../styles/StatisticsPage.module.scss';

function StatisticsPage() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(startOfCurrentMonth);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekly, setWeekly] = useState<WeeklyStatistics | null>(null);
  const [weeklyError, setWeeklyError] = useState(false);

  const period = useMemo(() => monthPeriod(anchor), [anchor]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    getStatistics(period.from, period.to)
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((e) => {
        if (active) setError(e.message ?? 'Nie udało się pobrać statystyk');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [period]);

  useEffect(() => {
    let active = true;

    setWeeklyError(false);
    setWeekly(null);
    getWeeklyStatistics(period.from, period.to)
      .then((data) => {
        if (active) setWeekly(data);
      })
      .catch(() => {
        if (active) setWeeklyError(true);
      });

    return () => {
      active = false;
    };
  }, [period]);

  const label = stats ? periodLabelFromResponse(stats.from) : monthLabel(anchor);
  const atCurrentMonth = isCurrentMonth(anchor);

  const completion = stats?.planCompletion;
  const hasBase = Boolean(completion && completion.completionBase > 0);
  const minutesInBreakdown = stats?.byCategory.reduce((sum, c) => sum + c.totalMinutes, 0) ?? 0;

  const share = (value: number, countValue: number): number => {
    if (!stats) return 0;
    if (minutesInBreakdown > 0) return (value / minutesInBreakdown) * 100;
    // brak minut w rozbiciu (nikt nie podał czasu trwania albo dane są niespójne)
    if (stats.workoutCount > 0) return (countValue / stats.workoutCount) * 100;
    return 0;
  };

  const nothingHappened =
    stats !== null && stats.workoutCount === 0 && stats.planCompletion.completionBase === 0 && stats.planCompletion.cancelled === 0;

  const averageMinutes = stats && stats.workoutCount > 0 ? Math.round(stats.totalMinutes / stats.workoutCount) : null;

  const workoutsHint = (() => {
    if (!stats) return '';
    if (stats.workoutCount === 0) return 'wpisy w dzienniku';
    if (stats.adHocCount === 0) return 'wszystkie z planu';
    if (stats.plannedCount === 0) return 'wszystkie poza planem';
    return `${stats.plannedCount} z planu · ${stats.adHocCount} poza planem`;
  })();

  const intensity = stats?.intensity;

  const intensityValue = intensity && intensity.average !== null ? intensity.average.toFixed(1).replace('.', ',') : null;

  const intensityHint = (() => {
    if (!intensity) return '';
    if (intensity.totalCount === 0) return 'brak treningów w tym okresie';
    if (intensity.ratedCount === 0) return 'żaden trening nie ma jeszcze oceny';
    return `oceniono ${intensity.ratedCount} z ${intensity.totalCount} ${plural(
      intensity.totalCount,
      'treningu',
      'treningów',
      'treningów',
    )}`;
  })();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Statystyki</h1>
        <div className={styles.period}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setAnchor((a) => shiftMonth(a, -1))}
            aria-label="Poprzedni miesiąc"
          >
            ‹
          </button>
          <span className={styles.periodLabel}>{label}</span>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setAnchor((a) => shiftMonth(a, 1))}
            disabled={atCurrentMonth}
            aria-label="Następny miesiąc"
          >
            ›
          </button>
          <button type="button" className={styles.todayButton} onClick={() => setAnchor(startOfCurrentMonth())} disabled={atCurrentMonth}>
            Bieżący miesiąc
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {loading && !stats && <p className={styles.loading}>Ładowanie…</p>}

      {stats && !error && (
        <>
          <section className={hasBase ? styles.completion : styles.completionEmpty}>
            <div className={styles.completionTop}>
              <div>
                <div className={styles.completionTitle}>Realizacja planu</div>
                <div className={styles.completionBase}>
                  {hasBase
                    ? `${completion!.completionRate}% z ${completion!.completionBase} ${plural(
                        completion!.completionBase,
                        'rozstrzygniętego treningu',
                        'rozstrzygniętych treningów',
                        'rozstrzygniętych treningów',
                      )}`
                    : completion!.cancelled > 0
                      ? `wszystkie plany z tego okresu zostały anulowane`
                      : 'brak rozstrzygniętych treningów w tym okresie'}
                </div>
              </div>
              <div className={hasBase ? styles.rate : styles.rateEmpty}>{hasBase ? `${completion!.completionRate}%` : '—'}</div>
            </div>

            {hasBase && (
              <div className={styles.stack}>
                <span className={styles.stackDone} style={{ width: `${(completion!.completed / completion!.completionBase) * 100}%` }} />
                <span className={styles.stackSkipped} style={{ width: `${(completion!.skipped / completion!.completionBase) * 100}%` }} />
                <span
                  className={styles.stackUnresolved}
                  style={{ width: `${(completion!.unresolved / completion!.completionBase) * 100}%` }}
                />
              </div>
            )}

            <div className={styles.legend}>
              {hasBase && (
                <>
                  <span className={styles.legendItem}>
                    <span className={styles.swatchDone} />
                    ukończone <b>{completion!.completed}</b>
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.swatchSkipped} />
                    pominięte <b>{completion!.skipped}</b>
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.swatchUnresolved} />
                    nierozstrzygnięte <b>{completion!.unresolved}</b>
                  </span>
                </>
              )}
              {completion!.cancelled > 0 && (
                <span className={styles.legendMuted}>
                  <span className={styles.swatchCancelled} />
                  anulowane <b>{completion!.cancelled}</b> — poza wskaźnikiem
                </span>
              )}
            </div>

            {completion!.unresolved > 0 && (
              <div className={styles.unresolved}>
                <span>
                  {completion!.unresolved} {plural(completion!.unresolved, 'trening czeka', 'treningi czekają', 'treningów czeka')} na
                  rozstrzygnięcie — dopóki wiszą, obniżają wskaźnik.
                </span>
                <button
                  type="button"
                  className={styles.unresolvedLink}
                  onClick={() => navigate('/kalendarz', { state: { month: monthKey(stats.from) } })}
                >
                  Otwórz {label} w kalendarzu →
                </button>
              </div>
            )}
          </section>

          {nothingHappened ? (
            <p className={styles.empty}>W tym okresie nie ma jeszcze żadnych treningów ani planów.</p>
          ) : (
            <>
              <div className={styles.tiles}>
                <div className={styles.tile}>
                  <span className={styles.tileLabel}>Treningi</span>
                  <span className={styles.tileValue}>{stats.workoutCount}</span>
                  <span className={styles.tileHint}>{workoutsHint}</span>
                </div>
                <div className={styles.tile}>
                  <span className={styles.tileLabel}>Łączny czas</span>
                  <span className={styles.tileValue}>{formatDuration(stats.totalMinutes)}</span>
                  <span className={styles.tileHint}>{averageMinutes ? `średnio ${formatDuration(averageMinutes)} na trening` : '—'}</span>
                </div>
                <div className={styles.tile}>
                  <span className={styles.tileLabel}>Średnia intensywność</span>
                  {intensityValue !== null ? (
                    <span className={styles.tileValue}>
                      {intensityValue}
                      <span className={styles.tileScale}>/ 10</span>
                    </span>
                  ) : (
                    <span className={`${styles.tileValue} ${styles.tileValueEmpty}`}>—</span>
                  )}
                  <span className={styles.tileHint}>{intensityHint}</span>
                </div>
              </div>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  Aktywność tygodniowa
                  {weekly && (
                    <span className={styles.count}>
                      {weekly.weeks.length} {plural(weekly.weeks.length, 'tydzień', 'tygodnie', 'tygodni')}
                    </span>
                  )}
                </h2>

                {weeklyError ? (
                  <p className={styles.empty}>Nie udało się pobrać wykresu aktywności.</p>
                ) : weekly ? (
                  <WeeklyChart weeks={weekly.weeks} />
                ) : (
                  <p className={styles.loading}>Ładowanie…</p>
                )}
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  Podział na kategorie
                  <span className={styles.count}>
                    {stats.byCategory.length} {plural(stats.byCategory.length, 'kategoria', 'kategorie', 'kategorii')}
                  </span>
                </h2>

                {stats.byCategory.length === 0 ? (
                  <p className={styles.empty}>Brak treningów w tym okresie.</p>
                ) : (
                  stats.byCategory.map((cat) => (
                    <div key={cat.categoryId} className={styles.catRow}>
                      <span className={styles.catName} style={{ color: darkenHex(cat.categoryColor) }}>
                        <CategoryIcon name={cat.categoryIconName} size={13} />
                        {cat.categoryName}
                      </span>
                      <span className={styles.catBar}>
                        <span
                          className={styles.catFill}
                          style={{
                            width: `${share(cat.totalMinutes, cat.workoutCount)}%`,
                            background: cat.categoryColor,
                          }}
                        />
                      </span>
                      <span className={styles.catValue}>{formatDuration(cat.totalMinutes)}</span>
                      <span className={styles.catCount}>
                        {cat.workoutCount} {plural(cat.workoutCount, 'trening', 'treningi', 'treningów')}
                      </span>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default StatisticsPage;
