import { CalendarItem } from "../types/workout";
import { hexToRgba, darkenHex, lightenHex } from "../utils/color";
import styles from "../styles/CalendarTile.module.scss";

interface CalendarTileProps {
  item: CalendarItem;
  onClick: (item: CalendarItem) => void;
}

const GRAY = "#94A3B8";

function CalendarTile({ item, onClick }: CalendarTileProps) {
  const cancelled = item.state === "cancelled";
  const color = cancelled ? GRAY : item.color;

  // wypełnienie = fakt, kontur = zamiar
  const filled = item.state === "done";
  const dashed = item.state === "skipped" || cancelled;

  const icon = item.state === "done" ? "✓" : item.state === "skipped" ? "✗" : null;
  const time = item.time ? item.time.slice(0, 5) : null;

  return (
    <button
      type="button"
      className={[
        styles.tile,
        filled ? styles.filled : styles.outlined,
        dashed ? styles.dashed : "",
        item.state === "skipped" ? styles.muted : "",
      ].join(" ")}
      style={{
        background: filled ? hexToRgba(color, 0.16) : "#fff",
        borderColor: filled ? "transparent" : lightenHex(color, dashed ? 0.6 : 0.45),
        color: darkenHex(color),
      }}
      onClick={() => onClick(item)}
      title={item.label}
    >
      <span
        className={styles.dot}
        style={
          filled
            ? { background: color }
            : { background: "transparent", boxShadow: `inset 0 0 0 2px ${color}` }
        }
      />
      <span className={cancelled ? styles.cancelledText : styles.text}>
        {item.label}
        {time ? ` ${time}` : ""}
      </span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </button>
  );
}

export default CalendarTile;