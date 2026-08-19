import { useEffect, useRef } from "react";
import { CalendarItem } from "../types/workout";
import { CalendarDay, timeToMinutes } from "../utils/calendar";
import { hexToRgba, darkenHex, lightenHex } from "../utils/color";
import styles from "../styles/WeekView.module.scss";

const HOUR_HEIGHT = 44;
const DEFAULT_DURATION = 60;
const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const GRAY = "#94A3B8";

interface WeekViewProps {
  days: CalendarDay[];
  itemsByDay: Map<string, CalendarItem[]>;
  onSelectItem: (item: CalendarItem) => void;
  onAddForDay: (iso: string) => void;
}

function WeekView({ days, itemsByDay, onSelectItem, onAddForDay }: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const times = days
      .flatMap((d) => itemsByDay.get(d.iso) ?? [])
      .map((i) => timeToMinutes(i.time))
      .filter((m): m is number => m !== null);

    const target = times.length ? Math.min(...times) : 7 * 60;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (target / 60) * HOUR_HEIGHT - HOUR_HEIGHT);
    }
  }, [days, itemsByDay]);

  const timed = (iso: string) => (itemsByDay.get(iso) ?? []).filter((i) => i.time);
  const allDay = (iso: string) => (itemsByDay.get(iso) ?? []).filter((i) => !i.time);

  const renderBlock = (item: CalendarItem, positioned: boolean) => {
    const cancelled = item.state === "cancelled";
    const color = cancelled ? GRAY : item.color;
    const filled = item.state === "done";
    const dashed = item.state === "skipped" || cancelled;

    const icon = item.state === "done" ? " ✓" : item.state === "skipped" ? " ✗" : "";
    const start = timeToMinutes(item.time) ?? 0;
    const duration = item.durationMin ?? DEFAULT_DURATION;

    return (
      <button
        key={item.key}
        className={[
          positioned ? styles.block : styles.allDayChip,
          dashed ? styles.dashed : "",
          item.state === "skipped" ? styles.muted : "",
        ].join(" ")}
        style={{
          background: filled ? hexToRgba(color, 0.16) : "#fff",
          borderColor: filled ? color : lightenHex(color, dashed ? 0.6 : 0.45),
          color: darkenHex(color),
          ...(positioned && {
            top: (start / 60) * HOUR_HEIGHT,
            height: Math.max((duration / 60) * HOUR_HEIGHT - 2, 18),
          }),
        }}
        onClick={() => onSelectItem(item)}
        title={item.label}
      >
        <span className={cancelled ? styles.cancelled : undefined}>
          {item.time ? `${item.time.slice(0, 5)} ` : ""}
          {item.label}
          {icon}
        </span>
      </button>
    );
  };

  return (
    <div className={styles.week}>
      <div className={styles.header}>
        <div className={styles.gutterCorner} />
        {days.map((d) => (
          <div key={d.iso} className={d.isToday ? styles.headerDayToday : styles.headerDay}>
            {WEEKDAYS[(d.date.getDay() + 6) % 7]} {d.date.getDate()}
          </div>
        ))}
      </div>

      <div className={styles.allDayRow}>
        <div className={styles.gutterLabel}>cały dzień</div>
        {days.map((d) => (
          <div key={d.iso} className={styles.allDayCell}>
            {allDay(d.iso).map((i) => renderBlock(i, false))}
          </div>
        ))}
      </div>

      <div className={styles.scroll} ref={scrollRef}>
        <div className={styles.body} style={{ height: 24 * HOUR_HEIGHT }}>
          <div className={styles.gutter}>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className={styles.hourLabel} style={{ height: HOUR_HEIGHT }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {days.map((d) => (
            <div
              key={d.iso}
              className={d.isToday ? styles.dayColumnToday : styles.dayColumn}
              onDoubleClick={() => onAddForDay(d.iso)}
              title="Kliknij dwukrotnie, aby dodać trening"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className={styles.hourLine} style={{ height: HOUR_HEIGHT }} />
              ))}
              {timed(d.iso).map((i) => renderBlock(i, true))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WeekView;