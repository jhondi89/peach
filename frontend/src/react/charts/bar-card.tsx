/* 分布柱状Imagen: uno类uno根柱子, 画es EvilCharts  `EvilBarChart`. 
 *
 * página头grande数es各类合计. 每根柱子数标En柱端, 数值轴No画: 几类之间差uno两Cantidad级时, 
 * corto柱子从刻度arriba读No出数. 柱子由 Motion 逐根largo出来, 系统开减弱动态效果时直continuar画终态
 * (`../entry.tsx`  `MotionConfig`); Pasar el ratón浮层es `./chart-tip.tsx`.  */
import { EvilBarChart } from '@/registry/charts/recharts-bar-chart';

import { CategoryTick, categoryAxisWidth, CHART_CARD, ChartEmpty, ChartHead, tone } from './chart-card';
import { ChartTip } from './chart-tip';

/** uno根柱子: 显示名字 y 它数. 写成Tipo别名, EvilCharts  `data` 要能当 `Record` 收.  */
export type BarRow = { name: string; value: number };

/** 数值轴Deja两成余量, 最largoese根柱子端en la数No被Imagen框切掉.  */
export const BAR_DOMAIN: [number, (max: number) => number] = [0, (max) => max * 1.2];

/** 横derecha侧给柱端ese数DejaUbicación(像素): 最largoeseuno数落Enesteuno截dentro, No被Imagen框切掉.  */
export const BAR_LABEL_ROOM = 56;

/** 柱端数: diez10 mil以arriba读成"10 mil""100 millones", 柱端eseunopequeño截放得abajo; Todo数EnPasar el ratón浮层dentro.  */
export function shortCount(value: number): string {
  const abs = Math.abs(value);
  const scaled = (unit: number, name: string) => {
    const figure = value / unit;
    return `${figure.toLocaleString(undefined, { maximumFractionDigits: Math.abs(figure) < 100 ? 1 : 0 })}${name}`;
  };
  if (abs >= 1e8) return scaled(1e8, '100 millones');
  if (abs >= 1e5) return scaled(1e4, '10 mil');
  return value.toLocaleString();
}

/** 柱端数. `position` 跟着柱子走向: 竖柱标En顶arriba, 横标Enderecha端.  */
export const barLabel = (position: 'top' | 'right') => ({
  position,
  className: 'fill-text-secondary',
  formatter: (value: unknown) => shortCount(Number(value)),
});

/** 浮层eseuno行名字: `series` esesteuno组数叫法("视频""Obras"), Noes单. 
 *  uno根柱子都Sin数时, 卡片照Deja, ImagenUbicación换成 `empty` ese句话.  */
export function BarCard(
  { title, unit, series, rows, color, empty, layout = 'vertical' }:
  {
    title: string; unit: string; series: string; rows: BarRow[]; color: string; empty: string;
    layout?: 'vertical' | 'horizontal';
  },
) {
  const data = rows
    .filter((row) => Number.isFinite(row.value) && row.value >= 0)
    .map((row) => ({ name: row.name, value: row.value }));
  const total = data.reduce((sum, row) => sum + row.value, 0);
  if (!total) return <ChartEmpty title={title}>{empty}</ChartEmpty>;
  const horizontal = layout === 'horizontal';
  /* Imagen容Dispositivo自带 `flex-1`, 放进卡片esteuno列 flex dentro会按 0 起算,  `h-*` 压成 0 alto, 换成 `flex-none`. 
     Categoría轴 `interval={0}`: 每根柱子都要Con名字, Recharts Predeterminado会挤Enuno起名字隔uno藏掉; 
     名字放Noabajo就由 `CategoryTick` 截断.  */
  return (
    <section className={CHART_CARD} aria-label={title}>
      <ChartHead title={title} figure={total.toLocaleString()} note={unit} />
      <EvilBarChart data={data} config={{ value: { label: series, colors: tone(color) } }}
        layout={layout} barRadius={4}
        chartProps={horizontal ? { margin: { top: 5, right: BAR_LABEL_ROOM, bottom: 5, left: 5 } } : undefined}
        className={horizontal
          ? 'aspect-auto h-64 flex-none text-text-secondary'
          : 'aspect-auto h-56 flex-none text-text-secondary'}>
        <EvilBarChart.Grid />
        {horizontal
          ? <EvilBarChart.YAxis dataKey="name" interval={0} tick={<CategoryTick along="y" />}
              width={categoryAxisWidth(data.map((row) => row.name))} />
          : <EvilBarChart.XAxis dataKey="name" interval={0} tick={<CategoryTick along="x" />} />}
        {horizontal
          ? <EvilBarChart.XAxis hide domain={BAR_DOMAIN} />
          : <EvilBarChart.YAxis hide domain={BAR_DOMAIN} />}
        <EvilBarChart.Bar dataKey="value" enableHoverHighlight
          barProps={{ dataKey: 'value', label: barLabel(horizontal ? 'right' : 'top') }} />
        <ChartTip />
      </EvilBarChart>
    </section>
  );
}
