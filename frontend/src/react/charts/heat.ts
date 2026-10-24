/* 热力ImagenDatos形状y折算. EstadísticaspáginaReproducirTiempoy口味páginaExplorarTiempoes同uno形状, 
 * 服务端分别由 `web_stats.q_stats`  `play_activity` y口味Análisis `activity` 给出.  */

/** 按天y按"星期 × 钟点"计数. `weekday` 0 es周uno, `timezone` 形如 `UTC+08:00`.  */
export interface ActivityCounts {
  timezone?: string;
  days?: { date: string; count: number }[];
  hours?: { weekday: number; hour: number; count: number }[];
}

/** 热力Imagenen launo格. `share` esesteuno格相对最忙eseuno格浓度, 0 到 1.  */
export interface HeatCell { key: string; label: string; count: number; share: number }

export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Con计数格子至menosDejauno成浓度: uno次 y uno次都Sin必须ver得出差别.  */
const shareOf = (count: number, max: number) => (count ? Math.max(0.12, count / max) : 0);

/** 星期 × pequeño时 168 格. 越界或负数Registro当作Sin.  */
export function hourGrid(activity: ActivityCounts | undefined): { cells: HeatCell[]; total: number } {
  const counts = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const item of activity?.hours || []) {
    const { weekday, hour, count } = item;
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) continue;
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) continue;
    if (!Number.isFinite(count) || count < 0) continue;
    counts[weekday]![hour] = (counts[weekday]![hour] || 0) + count;
  }
  const flat = counts.flat();
  const max = Math.max(1, ...flat);
  const cells = counts.flatMap((row, day) => row.map((count, hour) => ({
    key: `${day}-${hour}`, label: `${WEEKDAYS[day]} ${hour}:00`, count, share: shareOf(count, max),
  })));
  return { cells, total: flat.reduce((sum, count) => sum + count, 0) };
}

/** Reciente 91 天日历. último尾ese天由Datos说算, 往anterior数 90 天, en proceso间SinRegistroese些补 0.  */
export function dayCalendar(activity: ActivityCounts | undefined):
{ cells: HeatCell[]; total: number; start: string; end: string } {
  const days = (activity?.days || [])
    .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date)
      && Number.isFinite(row.count) && row.count >= 0)
    .slice().sort((a, b) => a.date.localeCompare(b.date));
  const empty = { cells: [], total: 0, start: '', end: '' };
  if (!days.length) return empty;
  const end = new Date(`${days.at(-1)!.date}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 90);
  const daily = new Map(days.map((row) => [row.date, row.count]));
  const max = Math.max(1, ...days.map((row) => row.count));
  const cells = Array.from({ length: 91 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    const count = daily.get(key) || 0;
    return { key, label: key, count, share: shareOf(count, max) };
  });
  return {
    cells,
    total: cells.reduce((sum, cell) => sum + cell.count, 0),
    start: start.toISOString().slice(0, 10),
    end: days.at(-1)!.date,
  };
}
