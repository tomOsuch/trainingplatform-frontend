import { CalendarItem } from '../types/workout';
import { timeToMinutes } from './calendar';

export const DEFAULT_DURATION = 60;

const MIN_SLOT = 20;

export interface PositionedItem {
  item: CalendarItem;
  startMin: number;
  endMin: number;
  column: number;
  columns: number;
}

export function layoutDay(items: CalendarItem[]): PositionedItem[] {
  const placed: PositionedItem[] = items
    .map((item) => {
      const startMin = timeToMinutes(item.time) ?? 0;
      const duration = Math.max(item.durationMin ?? DEFAULT_DURATION, MIN_SLOT);
      return { item, startMin, endMin: startMin + duration, column: 0, columns: 1 };
    })
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  let cluster: PositionedItem[] = [];
  let clusterEnd = -1;
  const columnEnds: number[] = [];

  const closeCluster = () => {
    const width = columnEnds.length;
    cluster.forEach((p) => {
      p.columns = width;
    });
    cluster = [];
    columnEnds.length = 0;
    clusterEnd = -1;
  };

  for (const p of placed) {
    if (p.startMin >= clusterEnd) closeCluster();

    let column = columnEnds.findIndex((end) => end <= p.startMin);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(p.endMin);
    } else {
      columnEnds[column] = p.endMin;
    }

    p.column = column;
    cluster.push(p);
    clusterEnd = Math.max(clusterEnd, p.endMin);
  }

  closeCluster();
  return placed;
}
