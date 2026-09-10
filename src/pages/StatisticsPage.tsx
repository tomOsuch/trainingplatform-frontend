import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Statistics } from '../types/statistics';
import { getStatistics } from '../services/statisticsApi';
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
import styles from '../styles/StatisticsPage.module.scss';

function StatisticsPage() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(startOfCurrentMonth);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(() => monthPeriod(anchor), [anchor]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getStatistics(period.from, period.to)
      .then(setStats)
      .catch((e) => setError(e.message ?? 'Nie udało się pobrać statystyk'))
      .finally(() => setLoading(false));
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
                  <span className={styles.tileHint}>wpisy w dzienniku</span>
                </div>
                <div className={styles.tile}>
                  <span className={styles.tileLabel}>Łączny czas</span>
                  <span className={styles.tileValue}>{formatDuration(stats.totalMinutes)}</span>
                  <span className={styles.tileHint}>{averageMinutes ? `średnio ${formatDuration(averageMinutes)} na trening` : '—'}</span>
                </div>
              </div>

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
                      <span className={styles.catName}>
                        <span className={styles.dot} style={{ background: cat.categoryColor }} />
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
