/* 口味páginaDatos契约, 轮询节律y纯折算. 
 *
 * cuatro端点En `frontend/src` dentro都SoloEnaquí声明uno次(`tests/test_frontend_build.py` 盯着). 
 *
 * Clave带着AnálisisRango: `['taste', window]`. 同uno机Dispositivosiete天 y TodoTiempoes两真相, 合成unoClave
 * 话切Rango就esAnterior直continuar覆盖掉, 切回来还得再问uno遍. RangoCambiar时用
 * `keepPreviousData` Deja住Anterior, No退回骨架—esteuno屏结构No变, SoloCon数En变. 
 * No给 `staleTime`: 服务端ya经按 `taste:{window}` 缓存过uno层, anterior端再压uno层就会出现
 * "刚Importar完, página面还esImportaranterioreseuno". 
 *
 * ActualizarTareaes另uno真相, 节律由posterior推进, 所以单独unoClave(`['taste','refresh']`).  */
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { clipGraphemes } from '@peach/legacy/core';

import { apiGet, apiSend, ApiError } from '../../api';
import type { BarRow } from '../charts/bar-card';
import type { ActivityCounts } from '../charts/heat';
import { queryClient } from '../query';
import { playedFor } from '../stats/stats';

export const TASTE_URL = '/api/taste';
export const TASTE_REFRESH_URL = '/api/taste/refresh';
export const TASTE_IMPORT_URL = '/api/taste/import';
export const TASTE_SOURCE_URL = '/api/taste/source';

/** uno dashboard Clave, 带AnálisisRango.  */
export const tasteKey = (window: string) => ['taste', window] as const;
/** 读取ExplorarRegistroeseuno趟posteriorTarea.  */
export const TASTE_REFRESH_KEY = ['taste', 'refresh'] as const;

/** AnálisisRango. 值就es `/api/taste?window=` 收ese几.  */
export const TASTE_WINDOWS = [
  ['7d', 'Últimos 7 días'], ['30d', 'Últimos 30 días'], ['90d', 'Últimos 90 días'],
  ['365d', 'RecienteunoAño'], ['all', 'Todo el tiempo'],
] as const;

export const DEFAULT_WINDOW = 'all';

/** 排行en launo行. `entity_id` y `has_avatar` 决定画哪uno级Imagen, `peach_items` 决定点No点得动.  */
export interface RankRow {
  name: string;
  score?: number;
  visits?: number;
  web_visits?: number;
  web_bookmarks?: number;
  peach_score?: number;
  peach_items?: number;
  entity_id?: number | null;
  has_image?: boolean;
  image_version?: string;
  avatar_focus?: unknown;
  has_avatar?: boolean;
  avatar_stand_in?: boolean;
  representative_asset_id?: number | null;
  source_domain?: string | null;
}

/** 按维度聚合名次. 名字y `taste_history.build_taste_dashboard` 对齐.  */
export interface TasteRankings {
  browser_tags?: RankRow[];
  browser_creators?: RankRow[];
  browser_performers?: RankRow[];
  browser_categories?: RankRow[];
  domains?: RankRow[];
  peach_tags?: RankRow[];
  peach_creators?: RankRow[];
  peach_performers?: RankRow[];
  peach_studios?: RankRow[];
  peach_series?: RankRow[];
}

export interface TasteSummary {
  history_visits?: number;
  bookmarks?: number;
  history_sources?: number;
  peach_items?: number;
  peach_seconds?: number;
  liked?: number;
  disliked?: number;
  range_start?: string | null;
  range_end?: string | null;
}

export interface TasteCoverage {
  tagged?: number; identified?: number; untagged?: number; unidentified?: number;
}

/** uno设备unoExplorarRegistro. `source_key` es 64 diezseis进制, Quitar时交回去就es它.  */
export interface TasteSource {
  source_key: string; browser: string; profile: string; host: string; visits?: number; bookmarks?: number;
}

export interface TasteAnalysis {
  headline?: string;
  confidence?: { level?: string; label?: string };
  points?: { label: string; text: string }[];
  explore?: { tag: string; title: string; detail: string }[];
  next_steps?: { route: string; title: string; detail: string }[];
}

export interface CreatorFlow { source: string; target: string; value: number }

/** `/api/taste` Respuesta. 字段y `web_stats.q_taste` 对齐.  */
export interface TasteData {
  browsers?: BrowserSource[];
  summary?: TasteSummary;
  coverage?: TasteCoverage;
  rankings?: TasteRankings;
  gaps?: RankRow[];
  sources?: TasteSource[];
  analysis?: TasteAnalysis;
  activity?: ActivityCounts;
  creator_flows?: CreatorFlow[];
  storage?: { exports?: number; bytes?: number };
  window?: string;
  updated_at?: string | null;
}

export interface BrowserSource {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  available: boolean;
  profiles: number;
  source_keys?: string[];
}

export const configureTasteBrowser = (body: { operation: 'add' | 'disable' | 'enable' | 'delete_browser'; name?: string; path?: string; id?: string }, window: string) =>
  apiSend<{ dashboard: TasteData }>(TASTE_SOURCE_URL, { ...body, window });

/** 读取ExplorarRegistroeseuno趟rápido照. `status` uno次都没跑过es `idle`.  */
export interface TasteJob {
  status: string;
  job_id?: string;
  stage?: string;
  message?: string;
  checked?: number;
  total?: number | null;
  error?: string;
  warnings?: string[];
}

export const fetchTaste = (window: string, signal?: AbortSignal) =>
  apiGet<TasteData>(`${TASTE_URL}?window=${window}`, signal);

export const fetchTasteJob = (signal?: AbortSignal) =>
  apiGet<TasteJob>(TASTE_REFRESH_URL, signal);

/** primero屏: 取完数才画. en proceso止时 `AbortError` 抛回挂载方, 它据此放弃esteuno次.  */
export async function prefetchTaste(window: string, signal: AbortSignal): Promise<void> {
  await queryClient.fetchQuery({
    queryKey: tasteKey(window), queryFn: () => fetchTaste(window, signal),
  });
}

/** 起uno趟读取ExplorarRegistro. 回esTarearápido照, 节律仍由 `TASTE_REFRESH_KEY` 说算.  */
export const startTasteRefresh = (window: string) =>
  apiSend<TasteJob>(TASTE_REFRESH_URL, { window, background: true });

/** Quitaruno设备ExplorarRegistro. 服务端连esteunoRangoNuevo dashboard uno起回, 换进缓存即puede.  */
export const removeTasteSource = (sourceKey: string, window: string) =>
  apiSend<{ removed: number; dashboard: TasteData }>(
    TASTE_SOURCE_URL, { operation: 'remove', source_key: sourceKey, window });

/** Importaruno私ConExportar. 
 *
 * ArchivoOriginal样当Por favor求体发, Archivo名走 `X-Peach-Filename`: 走 multipart 就要En服务端máscontinuaruno
 * 解析Dispositivo, 而aquíSoloConunoArchivo, uno名字. 服务端回es"TodoTiempo"eseuno dashboard.  */
export async function importTasteExport(file: File): Promise<{ dashboard: TasteData }> {
  const response = await fetch(TASTE_IMPORT_URL, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Peach-Filename': encodeURIComponent(file.name),
    },
    body: file,
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch { /* FalloRespuestaNouno定es JSON, abajo面按Estado码兜底 */ }
  if (!response.ok) {
    const reason = (payload as { error?: string } | null)?.error;
    throw new ApiError(reason || `ImportarFallido(${response.status})`, response.status, payload);
  }
  return payload as { dashboard: TasteData };
}

/** 读取闲着时diez秒问uno次—esteuno趟puede以从别página面或Anterior次会话dentro起来.  */
export const IDLE_POLL_MS = 10_000;

export const tasteDate = (value: string | null | undefined): string =>
  (value ? new Date(value).toLocaleDateString('zh-CN') : '—');

/** ExplorarRegistroese读数卡脚注: 几Datos源, 加arribaRegistro覆盖FechaRango; 两头都SinFecha时No写Rango.  */
export function historySpan(summary: TasteSummary): string {
  const sources = `${Number(summary.history_sources || 0).toLocaleString()} Fuente de datos`;
  if (!summary.range_start && !summary.range_end) return sources;
  const sameYear = summary.range_start?.slice(0, 4) === summary.range_end?.slice(0, 4);
  const date = (value: string | null | undefined) => value && sameYear
    ? new Date(value).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : tasteDate(value);
  return `${sources} · ${date(summary.range_start)}–${date(summary.range_end)}`;
}

/** 累计Duración. yEstadísticaspágina同uno套口径.  */
export const tasteHours = playedFor;

/** "口味维度"读数: 分数Como正维度才算,  y 雷达, 排行画出来es同uno批.  */
export const tasteDimensions = (rows: RankRow[]): RankRow[] =>
  rows.filter((row) => Number.isFinite(Number(row.score)) && Number(row.score) > 0)
    .sort((a, b) => Number(b.score) - Number(a.score));

/** uno行Enesteuno榜en la强度. Explorar侧按Acceder次数, Peach 侧按分数, 都退化到Entrada数.  */
export const rankStrength = (row: RankRow): number =>
  Number(row.web_visits ?? row.score ?? row.visits ?? row.peach_items ?? 0);

/** uno行名次底abajoese句complementar. 两侧都Con证据时y排显示, SoloConuno侧就读eseuno侧数.  */
export function rankDetail(row: RankRow): string {
  if (row.web_visits == null && !row.web_bookmarks) return Number(row.score || row.visits || 0).toLocaleString();
  const parts: string[] = [];
  const bookmarks = Number(row.web_bookmarks || 0);
  const visits = Number(row.web_visits ?? row.visits ?? 0) - bookmarks;
  if (visits > 0) parts.push(`Explorar ${visits.toLocaleString()}`);
  if (bookmarks) parts.push(`书签 ${bookmarks.toLocaleString()}`);
  if (row.peach_items) parts.push(`Peach ${Number(row.peach_items).toLocaleString()}`);
  return parts.join(' · ');
}

/** uno段largo度, cien分比. 最largoeseuno占满, 空榜No除cero.  */
export function rankShares(rows: RankRow[]): number[] {
  const strengths = rows.map(rankStrength);
  const ceiling = Math.max(1, ...strengths);
  return strengths.map((value) => Math.max(0, Math.min(100, value / ceiling * 100)));
}

/** 按分数从alto到bajoanterior `limit` 维度. 分数Como 0 或非Limitado行先滤掉.  */
export const topScores = (rows: RankRow[], limit: number): BarRow[] =>
  rows.filter((row) => Number.isFinite(Number(row.score)) && Number(row.score) > 0)
    .map((row) => ({ name: row.name, value: Number(row.score) }))
    .sort((a, b) => b.value - a.value).slice(0, limit);

/** menos于tres维度画No成面, tres点以abajoNo画. 最más取anteriorseis, 再másEtiqueta互相压住.  */
export const RADAR_MIN = 3;
export const RADAR_MAX = 6;

/** 雷达Imagen几顶点.  */
export function radarRows(rows: RankRow[]): BarRow[] {
  const values = topScores(rows, RADAR_MAX);
  return values.length < RADAR_MIN ? [] : values;
}

/** 排行最másocho.  */
export const RANK_MAX = 8;

/** 桑基Imagenuno节点. `side` 决定它落Enizquierda边还esderecha边, 也决定它文字往哪边排.  */
export interface FlowNode {
  id: string; name: string; side: 'source' | 'target'; index: number;
  x: number; y: number; height: number; value: number; share: number; color: number;
}
/** uno流. `d` es d3 算出来贝塞尔Ruta.  */
export interface FlowLink {
  key: string; d: string; width: number; color: number;
  source: number; target: number; value: number; label: string;
}
export interface FlowGraph { nodes: FlowNode[]; links: FlowLink[]; total: number; height: number }

/** 节点anchoy画布: izquierdaderecha各Dejauno截给文字, 视口ancho 720, alto度跟着节点数走, 最矮 435.  */
export const FLOW_NODE_WIDTH = 10;
export const FLOW_VIEWBOX = { width: 720, height: 435 } as const;
export const FLOW_LABEL_X = { source: 145, target: 545 } as const;

/** uno侧最más几节点. 再más就DejaabajoPistas最másanterior几, 其余y成uno"其余 N ..."节点.  */
export const FLOW_SIDE_MAX = 12;

/** 相邻两节点之间空隙, 也就es两节点en proceso心最pequeñoEspaciado: 节点名 y 它abajo面ese行数从en proceso心往arriba
 *  约 7, 往abajo约 22, 隔 30 时pequeño节点挤Enuno起, 两行字也No压到Siguiente节点arriba.  */
const FLOW_ROW = 30;

/** 除去空隙之exterior, Deja给节点本身按Pistas数分alto度.  */
const FLOW_NODE_ROOM = 240;

/** uno侧名字超过 `FLOW_SIDE_MAX` 时, Pistasmenosese些名字映射到同uno合y节点arriba.  */
function foldSide(flows: CreatorFlow[], side: 'source' | 'target', rest: (count: number) => string) {
  const totals = new Map<string, number>();
  for (const row of flows) totals.set(row[side], (totals.get(row[side]) ?? 0) + row.value);
  if (totals.size <= FLOW_SIDE_MAX) return (name: string) => name;
  const ranked = [...totals].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  const kept = new Set(ranked.slice(0, FLOW_SIDE_MAX - 1));
  const merged = rest(ranked.length - kept.size);
  return (name: string) => (kept.has(name) ? name : merged);
}

/** 来源Sitio web → 创作者流向Diseño. 值Como 0 或缺uno端流先滤掉, Todo空时返回 `null`.  */
export function flowGraph(rows: CreatorFlow[] = []): FlowGraph | null {
  const valid = rows.filter((row) =>
    row.source && row.target && Number.isFinite(row.value) && row.value > 0);
  if (!valid.length) return null;
  const sourceOf = foldSide(valid, 'source', (count) => `其余 ${count.toLocaleString()} Sitio web`);
  const targetOf = foldSide(valid, 'target', (count) => `其余 ${count.toLocaleString()}  resultado(s)Creador`);
  const folded = new Map<string, CreatorFlow>();
  for (const row of valid) {
    const source = sourceOf(row.source);
    const target = targetOf(row.target);
    const key = JSON.stringify([source, target]);
    const seen = folded.get(key);
    if (seen) seen.value += row.value;
    else folded.set(key, { source, target, value: row.value });
  }
  const flows = [...folded.values()];
  const sources = [...new Set(flows.map((row) => row.source))];
  const targets = [...new Set(flows.map((row) => row.target))];
  const rowsOnSide = Math.max(sources.length, targets.length);
  const bottom = Math.max(404, 16 + (rowsOnSide - 1) * FLOW_ROW + FLOW_NODE_ROOM);
  const graph = sankey<{ id: string; name: string; side: 'source' | 'target' }, object>()
    .nodeId((node) => node.id).nodeWidth(FLOW_NODE_WIDTH).nodePadding(FLOW_ROW)
    .extent([[155, 16], [535, bottom]])({
      nodes: [
        ...sources.map((name) => ({ id: `source:${name}`, name, side: 'source' as const })),
        ...targets.map((name) => ({ id: `target:${name}`, name, side: 'target' as const })),
      ],
      links: flows.map((row) => (
        { source: `source:${row.source}`, target: `target:${row.target}`, value: row.value })),
    });
  const total = flows.reduce((sum, row) => sum + row.value, 0);
  const path = sankeyLinkHorizontal();
  type Node = typeof graph.nodes[number];
  const nodes: FlowNode[] = graph.nodes.map((node) => ({
    id: node.id, name: node.name, side: node.side, index: node.index ?? 0,
    x: node.x0 ?? 0, y: node.y0 ?? 0, height: Math.max(1, (node.y1 ?? 0) - (node.y0 ?? 0)),
    value: node.value ?? 0, share: (node.value ?? 0) / total * 100,
    color: sources.indexOf(node.name) % 6,
  }));
  const links: FlowLink[] = graph.links.map((link, at) => {
    const from = link.source as Node;
    const to = link.target as Node;
    return {
      key: `${from.id}->${to.id}:${at}`, d: path(link) || '',
      width: Math.max(0.5, link.width || 0), color: sources.indexOf(from.name) % 6,
      source: from.index ?? 0, target: to.index ?? 0, value: link.value,
      label: `${from.name} → ${to.name}`,
    };
  });
  return { nodes, links, total, height: bottom + FLOW_VIEWBOX.height - 404 };
}

/** 节点名字太largo时截断. Imagendentrouno格SoloConeste么ancho, Completo名En `aria-label`  y  `<title>` dentro.  */
export const flowLabel = (name: string): string => clipGraphemes(name, 17);
