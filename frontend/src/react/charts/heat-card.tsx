/* 热力Imagen: EstadísticaspáginaReproducirTiempoy口味páginaExplorarTiempo共用. 
 *
 * Recharts Sin热力Imagen, EvilCharts  Recharts 分支也Sin, 所以格子仍es自绘 SVG: uno格uno
 * `rect`, 浓度es `fill-opacity`, 几何Todo写成属性. exterior观对齐同página EvilCharts Imagen: ColorSolo取
 * `chart-*`, 指到uno格时其余格子淡abajo去, 浮层y柱状, 径向Imagen共用 `./chart-tip.tsx` eseuno面; 
 * página头读数也跟着换, Clave盘聚焦uno格时读es它. 取舍见 ADR-0076.  */
import { useState } from 'react';
import type { ReactNode } from 'react';

import { CHART_CARD, ChartEmpty, ChartHead } from './chart-card';
import { TIP_SURFACE, TIP_SWATCH, TipRow } from './chart-tip';
import { dayCalendar, hourGrid, WEEKDAYS, type ActivityCounts, type HeatCell } from './heat';

const SIZE = 14;
const STEP = 17;

/** 格子y浮层色点Color. 类名写成Completo串, Tailwind 扫得到.  */
const TONES = {
  4: { fill: 'fill-chart-4', dot: 'bg-chart-4' },
  5: { fill: 'fill-chart-5', dot: 'bg-chart-5' },
} as const;
export type HeatTone = keyof typeof TONES;

/** 浮层靠哪uno边对齐指到eseuno格: 两侧各Dejauno成ancho, 靠边格子浮层往dentro放, No被卡片切掉.  */
const ANCHOR = {
  start: 'translate-x-0',
  center: '-translate-x-1/2',
  end: '-translate-x-full',
} as const;

function HeatTooltip(
  { cell, series, tone, left, top, anchor }:
  { cell: HeatCell; series: string; tone: HeatTone; left: number; top: number; anchor: keyof typeof ANCHOR },
) {
  return (
    <div aria-hidden
      // oxlint-disable-next-line shadcn/no-inline-styles -- 浮层跟着指到eseuno格走, Ubicaciónes运行期算出cien分比
      style={{ left: `${left}%`, top: `${top}%` }}
      className={`pointer-events-none absolute z-10 -mt-2 -translate-y-full ${TIP_SURFACE} ${ANCHOR[anchor]}`}>
      <div className="font-medium text-foreground">{cell.label}</div>
      <TipRow name={series} value={cell.count} swatch={<i className={`${TIP_SWATCH} ${TONES[tone].dot}`} />} />
    </div>
  );
}

/** 读数tres处文字: página头grande数旁单, 浮层eseuno行名字, 读屏时每uno格计数posterior面量词.  */
export interface HeatWords { unit: string; series: string; cellUnit: string }

/** uno热力Imagen: uno格uno计数, 指到哪uno格读数就换成哪uno格.  */
export function HeatCard(
  { title, words, cells, total, columns, rows, axis, footer, tone }:
  {
    title: string; words: HeatWords; cells: HeatCell[]; total: number;
    columns: number; rows: number; axis?: ReactNode; footer: ReactNode; tone: HeatTone;
  },
) {
  const [shown, setShown] = useState(-1);
  const left = axis ? 30 : 0;
  const top = axis ? 18 : 0;
  const width = left + columns * STEP;
  const height = top + rows * STEP;
  const at = (index: number) => ({
    x: left + (index % columns) * STEP, y: top + Math.floor(index / columns) * STEP,
  });
  const cell = cells[shown];
  const pin = cell ? at(shown) : null;
  const share = pin ? (pin.x + SIZE / 2) / width : 0;
  const anchor = share < 0.1 ? 'start' : share > 0.9 ? 'end' : 'center';
  const edge = pin ? { start: pin.x, center: pin.x + SIZE / 2, end: pin.x + SIZE }[anchor] : 0;
  return (
    <section className={CHART_CARD}>
      <ChartHead title={title} figure={(cell ? cell.count : total).toLocaleString()}
        note={cell ? cell.label : words.unit} />
      {/* 带坐标轴星期 × pequeño时Con 24 列, 压到 320 以abajo格子 y 字都读No清, 宁puedeEn卡dentro横滚; 
          每日eseSoloCon 13 列, 跟着卡片缩, Reciente几天No会藏到derecha边verNo见地方.  */}
      <div className="relative">
        <div className="min-w-0 overflow-x-auto">
          <svg role="img" aria-label={title} onPointerLeave={() => setShown(-1)}
            viewBox={`0 0 ${width} ${height}`} className={axis ? 'block h-auto min-w-80 w-full' : 'block h-auto w-full'}>
            {axis}
            {cells.map((item, index) => {
              const { x, y } = at(index);
              return (
                <rect key={item.key} tabIndex={0} role="img" aria-label={`${item.label}, ${item.count} ${words.cellUnit}`}
                  x={x} y={y} width={SIZE} height={SIZE} rx={3} fillOpacity={item.share || 1}
                  opacity={shown >= 0 && shown !== index ? 0.4 : 1}
                  className={item.share
                    ? `outline-none transition-opacity duration-200 focus-visible:stroke-border-focus-ring ${TONES[tone].fill}`
                    : 'fill-chart-track outline-none transition-opacity duration-200 focus-visible:stroke-border-focus-ring'}
                  onPointerEnter={() => setShown(index)}
                  onFocus={() => setShown(index)} onBlur={() => setShown(-1)} />
              );
            })}
          </svg>
        </div>
        {cell && pin ? (
          <HeatTooltip cell={cell} series={words.series} tone={tone} anchor={anchor}
            left={edge / width * 100} top={pin.y / height * 100} />
        ) : null}
      </div>
      <footer className="flex flex-wrap justify-between gap-3 text-caption-1-regular text-text-secondary">
        {footer}
      </footer>
    </section>
  );
}

/** 星期 × pequeño时坐标: izquierda边uno列星期, 顶arriba每隔两pequeño时uno钟点.  */
const HOUR_AXIS = (
  <>
    {WEEKDAYS.map((name, day) => (
      <text key={name} x={0} y={18 + day * STEP + 7} dominantBaseline="middle"
        className="fill-text-secondary text-caption-1-regular">{name}</text>
    ))}
    {Array.from({ length: 24 }, (_, hour) => (hour % 2 ? null : (
      <text key={hour} x={30 + hour * STEP} y={8} dominantBaseline="middle"
        className="fill-text-secondary text-caption-1-regular">{hour}</text>
    )))}
  </>
);

/** uno活跃计数两热力Imagen: 星期 × pequeño时,  y Reciente 91 天. 
 *
 * Sinpuede用Registro时DejaunoSoloCon `empty` ese句话卡.  */
export function ActivityHeat(
  { activity, title, dailyTitle, words, tone, empty }:
  {
    activity: ActivityCounts | undefined; title: string; dailyTitle: string;
    words: HeatWords; tone: HeatTone; empty: string;
  },
) {
  const hours = hourGrid(activity);
  const days = dayCalendar(activity);
  if (!days.cells.length) return <ChartEmpty title={title}>{empty}</ChartEmpty>;
  /* 两卡按各自contenidoalto度排: 星期 × pequeño时Con 24 列, 格子比每日esepequeñounomedio, 同行拉成etc.alto
     会En它abajo面空出medio卡.  */
  return (
    <div className="inline-grid w-full items-start gap-5 lg:grid-cols-2">
      <HeatCard title={title} words={words} tone={tone}
        cells={hours.cells} total={hours.total} columns={24} rows={7} axis={HOUR_AXIS}
        footer={<><span>Día × Hora</span><span>{activity?.timezone || 'UTC+08:00'}</span></>} />
      <HeatCard title={dailyTitle} words={words} tone={tone}
        cells={days.cells} total={days.total} columns={13} rows={7}
        footer={<><span>{days.start}</span><span>{days.end}</span></>} />
    </div>
  );
}
