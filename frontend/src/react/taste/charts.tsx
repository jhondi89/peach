/* 口味páginatresImagen: 口味维度雷达y排行, 创作者Pistas流向Imagen. Explorar活跃两热力Imageny
 * Estadísticaspágina共用 `../charts/heat-card.tsx`. 
 *
 * 雷达y排行由 EvilCharts 画, Pasar el ratón浮层es `../charts/chart-tip.tsx`, 差异登记En
 * `../evilcharts/ORIGIN.md`. 雷达medio径es平方根刻度, 浮层仍读Original次数. 流向Imagen保Deja `d3-sankey` 自绘(ADR-0076): 几何Todo写成属性, 流粗细
 * es `stroke-width`, ColorSolo取 BoardUI  `chart-*` 档; 指向uno流或uno节点时读数换成它, 
 * 换es React Estado, 指针离开或焦点移走就回到Total数. 差异登记En `../boardui/ORIGIN.md`.  */
import { useState } from 'react';
import { Text } from 'recharts';

import { EvilBarChart } from '@/registry/charts/recharts-bar-chart';
import { EvilRadarChart } from '@/registry/charts/recharts-radar-chart';

import { BAR_DOMAIN, BAR_LABEL_ROOM, barLabel } from '../charts/bar-card';
import {
  CategoryTick, categoryAxisWidth, CHART_CARD, CHART_COLORS, ChartHead, fitLabel, tone,
} from '../charts/chart-card';
import { ChartTip } from '../charts/chart-tip';
import {
  flowGraph, flowLabel, FLOW_LABEL_X, FLOW_NODE_WIDTH, FLOW_VIEWBOX, radarRows, RANK_MAX, topScores,
  type CreatorFlow, type RankRow,
} from './taste';

/** 雷达顶点exterior侧维度名. izquierdaderecha两侧名字往exterior排, 能用ancho度es顶点到Imagen框边; arribaabajo两居en proceso排, 
 *  能用es顶点到较近ese边两倍. 放Noabajo就截断, Todo名En `<title>`, 浮层y读屏名称dentro.  */
function RadarTick(
  props: { x?: number; cx?: number; textAnchor?: string; payload?: { value?: unknown } } & Record<string, unknown>,
) {
  const { x = 0, cx, textAnchor, payload, ...rest } = props;
  const name = String(payload?.value ?? '');
  const width = typeof cx === 'number' ? cx * 2 : 0;
  const room = !width ? 56
    : textAnchor === 'start' ? width - x
    : textAnchor === 'end' ? x
    : 2 * Math.min(x, width - x);
  return (
    <g>
      <title>{name}</title>
      <Text {...(rest as object)} x={x} textAnchor={textAnchor as 'start' | 'middle' | 'end' | undefined}
        fill="currentColor" fontSize={12}>{fitLabel(name, room - 4)}</Text>
    </g>
  );
}

/** seis档Imagen表色循环. 类名写成Completo串, Tailwind 扫得到.  */
const FLOW_STROKE = [
  'stroke-chart-1', 'stroke-chart-2', 'stroke-chart-3',
  'stroke-chart-4', 'stroke-chart-5', 'stroke-chart-6',
];
const FLOW_FILL = [
  'fill-chart-1', 'fill-chart-2', 'fill-chart-3',
  'fill-chart-4', 'fill-chart-5', 'fill-chart-6',
];

/** 口味维度两ImagenSerie: uno维度abajo命en procesoEtiqueta次数. Color跟着口味página读数卡 `chart-4`.  */
const DIMENSION_CONFIG = { value: { label: 'Etiqueta命En proceso', colors: tone(CHART_COLORS[3]) } };

/** 排行最bajoalto度按数给, unouno格 32: estrecho屏dentro排行独占uno行, 或维度No足tres画No出雷达时, 
 *  它就eseste么alto. 旁边Con雷达时Completo跟着雷达eseuno栏拉到etc.alto, más出来alto度拉开yEspaciado. 
 *  类名写成Completo串, Tailwind 扫得到.  */
const RANK_HEIGHT = ['min-h-24', 'min-h-24', 'min-h-24', 'min-h-32', 'min-h-40', 'min-h-48', 'min-h-52', 'min-h-60', 'min-h-64'];

/** uno柱粗细arriba限, yuno格 32 dentroPredeterminadoDeja出粗细相同: Imagen拉alto时No跟着变粗.  */
const RANK_BAR_SIZE = 26;

/** 雷达Imagen画es `radius` 列, 名字yColor跟口味维度另exterior两Imagenuno致.  */
const RADAR_CONFIG = { radius: DIMENSION_CONFIG.value };

/** 雷达Imagenmedio径刻度, 也esesteImagen唯unouno处换算: `√(次数 / 最grande次数)`, 最grande维度落Enexterior圈(1). 
 * 头uno维度常es其余diez倍以arriba, 线性medio径会面压成uno根尖刺, 读No出次要维度形状; 开方posterior
 * 它们才撑得开. Original次数DejaEn `value` 列, 浮层读它, 数值本身由旁边排行给.  */
const radarRadius = (value: number, top: number) => Math.sqrt(value / top);

/** 主要口味维度雷达Imagen, 画es EvilCharts  `EvilRadarChart`. tres维度以abajo画No成面, ese时CompletoNo出现.  */
export function TasteRadar({ rows, label }: { rows: RankRow[]; label: string }) {
  const points = radarRows(rows);
  if (!points.length) return null;
  const top = points[0]!.value;
  const data = points.map((row) => ({ ...row, radius: radarRadius(row.value, top) }));
  return (
    <div role="img" aria-label={`${label}: ${data.map((row) => row.name).join(', ')}`}>
      {/* medio径压到seis成: 维度名排En顶点exterior侧, sieteocho字名字Enestrecho栏dentro要放得abajo, No被Imagen框切掉.  */}
      <EvilRadarChart data={data} config={RADAR_CONFIG} chartProps={{ outerRadius: '58%' }}
        className="aspect-auto h-70 text-text-secondary">
        <EvilRadarChart.PolarGrid />
        <EvilRadarChart.PolarAngleAxis dataKey="name" tick={<RadarTick />} />
        {/* medio径轴定死En 0 到 1: exterior圈就es最grande维度, No让 Recharts 往arriba取CompletoDeja出空圈. Cuadrícula圈跟着
            este根轴刻度走, Recharts PredeterminadoSolo取Completo数刻度, 要放开pequeño数才Concuatroetc.分圈.  */}
        <EvilRadarChart.PolarRadiusAxis domain={[0, 1]} allowDecimals tick={false} />
        <EvilRadarChart.Radar dataKey="radius" />
        <ChartTip valueKey="value" />
      </EvilRadarChart>
    </div>
  );
}

/** 口味维度排行: uno维度uno横向柱, 画es EvilCharts  `EvilBarChart`, 数标En柱尾. 
 *  CompletoEn纵向 flex dentro撑满父级给alto度, Imagen表容Dispositivo本身es `flex-1`. 维度名eseuno栏Conancho度arriba限, 
 *  名字再largo也Solo截断, No柱子挤没.  */
export function RankedBars({ rows, label }: { rows: RankRow[]; label: string }) {
  const data = topScores(rows, RANK_MAX);
  if (!data.length) return null;
  return (
    <section aria-label={label} className={`flex grow flex-col ${RANK_HEIGHT[data.length]}`}>
      <EvilBarChart data={data} config={DIMENSION_CONFIG} layout="horizontal" barRadius={4}
        chartProps={{ maxBarSize: RANK_BAR_SIZE, margin: { top: 5, right: BAR_LABEL_ROOM, bottom: 5, left: 5 } }}
        className="aspect-auto text-text-secondary">
        <EvilBarChart.YAxis dataKey="name" interval={0} tick={<CategoryTick along="y" />}
          width={categoryAxisWidth(data.map((row) => row.name))} />
        <EvilBarChart.XAxis hide domain={BAR_DOMAIN} />
        <EvilBarChart.Bar dataKey="value" enableHoverHighlight
          barProps={{ dataKey: 'value', label: barLabel('right') }} />
        <ChartTip />
      </EvilBarChart>
    </section>
  );
}

/** 创作者Pistas来源流向. 指uno流或uno节点, 读数换成它.  */
export function CreatorSankey({ flows }: { flows: CreatorFlow[] | undefined }) {
  const [shown, setShown] = useState<{ value: number; label: string; node: number | null } | null>(null);
  const graph = flowGraph(flows);
  if (!graph) return null;
  const node = shown?.node ?? null;
  /** este流此刻要No要淡abajo去. 指es节点时Dejaabajo它两端流, 指es流时SoloDeja它自己.  */
  const linkLit = (link: typeof graph.links[number], key: string) =>
    (!shown ? true
      : node !== null ? link.source === node || link.target === node
      : shown.label === key);
  return (
    <section className={CHART_CARD}>
      <ChartHead title="Fuentes de pistas de creador" figure={(shown ? shown.value : graph.total).toLocaleString()}
        note={shown ? shown.label : 'ResultadoPistas'} />
      {/* 两侧各Dejauno截给节点名, 画布estrecho于 640 时字缩到读No清: Teléfonoarriba换成按Pistas数排uno列流向.  */}
      <ol aria-label="Sitio web de fuente y pistas de creador" className="flex flex-col sm:hidden">
        {[...graph.links].sort((a, b) => b.value - a.value).map((link) => (
          <li key={link.key}
            className="flex items-baseline justify-between gap-3 border-b border-separator-border py-2 text-body-2-regular text-text-primary last:border-b-0">
            <span className="min-w-0 wrap-anywhere">{link.label}</span>
            <b className="shrink-0 tabular-nums">{link.value.toLocaleString()}</b>
          </li>
        ))}
      </ol>
      <div className="min-w-0 max-sm:hidden">
        <svg viewBox={`0 0 ${FLOW_VIEWBOX.width} ${graph.height}`} fill="none"
          role="img" aria-label="Sitio web de fuente y pistas de creador"
          className="block h-auto w-full" onPointerLeave={() => setShown(null)}>
          <g>
            {graph.links.map((link) => (
              <path key={link.key} d={link.d} strokeWidth={link.width} tabIndex={0} role="img"
                aria-label={`${link.label}: ${link.value} ResultadoPistas`}
                fillOpacity={0} strokeOpacity={linkLit(link, link.label) ? 0.55 : 0.08}
                className={`outline-none transition-opacity ${FLOW_STROKE[link.color]}`}
                onPointerEnter={() => setShown({ value: link.value, label: link.label, node: null })}
                onFocus={() => setShown({ value: link.value, label: link.label, node: null })}
                onBlur={() => setShown(null)} />
            ))}
          </g>
          <g>
            {graph.nodes.map((item) => (
              <g key={item.id} tabIndex={0} role="img"
                aria-label={`${item.name}: ${item.value} ResultadoPistas`}
                className="outline-none focus-visible:opacity-100"
                onPointerEnter={() => setShown(
                  { value: item.value, label: item.name, node: item.index })}
                onFocus={() => setShown({ value: item.value, label: item.name, node: item.index })}
                onBlur={() => setShown(null)}>
                <rect x={item.x} y={item.y} width={FLOW_NODE_WIDTH} height={item.height} rx={5}
                  className={item.side === 'source' ? FLOW_FILL[item.color] : 'fill-text-secondary'} />
                <text x={FLOW_LABEL_X[item.side]} y={item.y + item.height / 2}
                  textAnchor={item.side === 'source' ? 'end' : 'start'} dominantBaseline="middle"
                  className="fill-text-secondary text-caption-1-regular">
                  {flowLabel(item.name)}
                  <tspan x={FLOW_LABEL_X[item.side]} dy={15}>
                    {item.side === 'source'
                      ? item.value.toLocaleString()
                      : `${item.share.toFixed(1)}%`}
                  </tspan>
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
      <footer className="flex justify-between gap-3 text-caption-1-regular text-text-secondary max-sm:hidden">
        <span>Sitio web de fuente</span><span>Creador · Pistas占比</span>
      </footer>
    </section>
  );
}
