/* EstadísticaspáginaDatos契约y折算: `/api/stats` uno次Por favor求供Completopágina使用. 
 *
 * 端点En `frontend/src` dentroSoloEnaquí声明uno次(`tests/test_frontend_build.py` 盯着). 
 * esteunopáginaesDatosBiblioteca当anteriorrápido照, SinposteriorTarea也No轮询: CompletopáginaSoloConuno `queryKey`, uno屏en lacuatro
 * 指标, abajo面esetres面板读都es同uno数, 分开取就会出现esteuno格esNuevo, eseuno格esantiguo. 
 *
 * 体积走 `src/core/index.ts`  `fmtSize`, y馆藏, Repetir项, alto清版同uno套口径; ReproducirDuración, cien分比
 * yImagen表分档esesteunopágina自己折算, 写成纯函数放Enaquí, 由 vitest 直continuar验.  */
import { apiGet } from '../../api';
import type { BarRow } from '../charts/bar-card';
import type { ActivityCounts } from '../charts/heat';
import { queryClient } from '../query';

export const STATS_URL = '/api/stats';
/** Completopágina共用esteunoClave.  */
export const STATS_KEY = ['stats'] as const;

/** 按来源分Biblioteca存. `k` es `local`/`115`/`pikpak`/`online` este些来源代号.  */
export interface LocationCount { k: string; n: number; bytes: number; videos: number }

/** 按媒体Biblioteca分Biblioteca存. `name` es用户给esteBiblioteca起名字.  */
export interface LibraryCount { k: string; name: string; icon: string; videos: number; bytes: number }

/** uno计数. 服务端某uno项取No到时回 null, página面读成"no取得".  */
export type Count = number | null;

/** 视频资料归属: 分母es `videos`, 其余几项esya经Coneseuno项数.  */
export interface Attribution {
  videos: number; creator: Count; code: Count; studio: Count; thumb: Count; duration: Count;
}

/** unoEtiqueta来源覆盖másmenosEtiqueta, másmenos视频.  */
export interface TagSource { k: string; n: number; assets: number }

export interface TopTag { k: string; n: number; cat: string }

export interface Consumption {
  played: Count; library_played: Count; online_played: Count; play_seconds: Count;
  o_total: Count; liked: Count; dislike: Count; seen: Count; trash: Count; skimmed: Count;
}

/** 按ArchivoTipo分Entrada数. `k` es `video`/`image`/`archive` este些媒介代号.  */
export interface MediumCount { k: string; n: number; bytes: number }

/** 视频unoDuración或画质分档.  */
export interface BandCount { k: string; n: number }

/** Reproducir过 `k` 次ObrasCon `n` .  */
export interface ReplayCount { k: number; n: number }

/** RecienteunoReproducirRegistro. 馆藏yEn线追更两来源合yposterior按Tiempo排, `kind` 决定点进去去哪.  */
export interface RecentPlay {
  id: number; name: string; creator: string | null; play_seconds: number;
  duration: number | null; max_reached: number | null; o_count: number; kind: string;
}

/** uno存储卷. 离线或取No到Capacidad时 `total` es null, 此时No画使用率.  */
export interface StorageVolume {
  kind: string; label: string; root: string | null; online: boolean;
  free: number | null; used: number | null; total: number | null;
}

export interface StorageSummary {
  volumes: number; online: number; measured: number; free: number; used: number; total: number;
}

/** `/api/stats` Respuesta. 字段y `web_stats.q_stats` 对齐.  */
export interface StatsData {
  by_loc: LocationCount[];
  by_medium: MediumCount[];
  by_library: LibraryCount[];
  by_length: BandCount[];
  by_quality: BandCount[];
  play_activity: ActivityCounts;
  replays: ReplayCount[];
  attribution: Attribution;
  tag_source: TagSource[];
  tag_cov: Count;
  top_tags: TopTag[];
  consumption: Consumption;
  recent: RecentPlay[];
  storage_volumes: StorageVolume[];
  storage_summary: StorageSummary;
}

export const fetchStats = (signal?: AbortSignal) => apiGet<StatsData>(STATS_URL, signal);

/** primero屏: 取完数才画. 
 *
 * No给 `staleTime`. esteunopágina读esDatosBiblioteca此刻样子, 每进uno次都该pesadoNuevo问uno遍; 缓存住话, 
 * 扫完uno批回来ver到还es进página面之anteriorese数.  */
export async function prefetchStats(signal: AbortSignal): Promise<void> {
  await queryClient.fetchQuery({ queryKey: STATS_KEY, queryFn: () => fetchStats(signal) });
}

/** 取得计数: null, NaN ySin穷都No算.  */
export const known = (value: Count | undefined): value is number =>
  value != null && Number.isFinite(value);

/** uno计数读法: mil分; 取No到时读"no取得".  */
export const fmtCount = (value: Count | undefined): string =>
  (known(value) ? value.toLocaleString() : 'No disponible');

/** Completo数cien分比, carpetaEn 0 到 100 之间. 分母es 0 或取No到时读 0, Noes NaN.  */
export const percentOf = (value: Count | undefined, total: Count | undefined): number =>
  (known(value) && known(total) && total > 0
    ? Math.min(100, Math.max(0, Math.round(value / total * 100))) : 0);

/** cien分比读法: Conuno点peroNo到 0.5% 时读"<1%", No读成 0%.  */
export const percentText = (value: Count | undefined, total: Count | undefined): string => {
  const share = percentOf(value, total);
  return !share && known(value) && value > 0 && known(total) && total > 0 ? '<1%' : `${share}%`;
};

/** 累计ReproducirDuración: No到unopequeño时读分钟, No到 48 pequeño时读pequeño时, 再往arriba读天.  */
export const playedFor = (seconds: Count | undefined): string => {
  if (!known(seconds)) return 'No disponible';
  const value = Math.max(0, seconds);
  if (value >= 48 * 3600) {
    return `${(value / 86_400).toLocaleString(undefined, { maximumFractionDigits: 1 })} día(s)`;
  }
  return value >= 3600 ? `${(value / 3600).toFixed(1)} hora(s)` : `${Math.round(value / 60)} minuto(s)`;
};

/** 真实ver过Relación: Reproducir秒数占Duración, 封顶 100%. Duraciónno取得时读 0.  */
export const watchedShare = (row: RecentPlay): number =>
  row.duration ? Math.min(row.play_seconds / row.duration, 1) * 100 : 0;

/** 到达过最远Ubicación, cien分比.  */
export const reachedShare = (row: RecentPlay): number => (row.max_reached || 0) * 100;

/** esteuno读出来es哪uno观ver. 
 *
 * 真实ver过Relación比到达Ubicaciónbajounogrande截, Descripciónen proceso间grande段es拖过去—ese y 从头ver到尾es两回事, 
 * uno行dentroSolo显示unocien分比话读者分No出来.  */
export const watchNote = (row: RecentPlay): string => {
  if (row.kind === 'online') return 'Ver en línea directamente';
  if (watchedShare(row) < reachedShare(row) - 25) return 'Avance rápido';
  return row.o_count ? `Orgasmo ${row.o_count}` : 'NormalVer';
};

/** 点进去去处. En线追更EntradaNoEn馆藏dentro, 走它自己eseDetalles路由.  */
export const playedItemUrl = (row: RecentPlay): string =>
  `${row.kind === 'online' ? '/posts/' : '/assets/'}${row.id}`;

/** 径向Imagenen launo段. `bytes` esesteuno段占体积, Imagen例格子dentro读成它Tamaño.  */
export interface RadialSlice { name: string; value: number; bytes?: number; mark?: string }

/** uno径向Imagen最más画几圈: Imagen表色SoloConseis档, No.siete圈起Color就 y anterior面pesado.  */
export const RADIAL_MAX = 6;

/** 径向Imagen要画几段. 段数超过 `RADIAL_MAX` 时Dejaabajo最másanteriorcinco段, 其余y成uno段"其余 N 项". 
 *  负数y非Limitado值先滤掉.  */
export function radialSlices(rows: RadialSlice[], max = RADIAL_MAX): RadialSlice[] {
  const slices = rows.filter((row) => Number.isFinite(row.value) && row.value >= 0);
  if (slices.length <= max) return slices;
  const ranked = [...slices].sort((a, b) => b.value - a.value);
  const rest = ranked.slice(max - 1);
  return [...ranked.slice(0, max - 1), {
    name: `其余 ${rest.length.toLocaleString()} 项`,
    value: rest.reduce((sum, row) => sum + row.value, 0),
    bytes: rest.reduce((sum, row) => sum + (row.bytes ?? 0), 0),
  }];
}

/** 满圈代表数: 最largoese段Dejauno成余量, ver得出es"最más"而Noes"Todo".  */
export const radialCeiling = (values: number[]): number => Math.max(1, ...values) * 1.1;

/** uno段画máslargo弧: NoComo 0 段至menos画满圈 2%,  y 最largoese段差几Cantidad级时也ver得见. 
 *  0 就es 0, No垫alto.  */
export const radialArc = (value: number, ceiling: number): number =>
  (value > 0 ? Math.max(value, ceiling * 0.02) : 0);

/** 每圈粗细(像素). 段数más时压细, 最interior圈才No会缩进圆心, 也No会 y 相邻ese圈叠Enuno起.  */
export const radialBarSize = (count: number): number =>
  Math.max(4, Math.min(14, Math.round(90 / Math.max(1, count))));

/** ArchivoTipo显示名. y馆藏dentro资源卡片叫法相同.  */
const MEDIUM_LABEL: Record<string, string> = {
  video: 'Videos', image: 'Imágenes', illustration: 'Ilustración', archive: 'Archivo comprimido',
  audio: 'Audio', account: 'Cuenta', other: 'Otros archivos',
};

/** 按ArchivoTipo分Entrada数, másEnanterior.  */
export const mediumRows = (rows: MediumCount[]): BarRow[] =>
  rows.map((row) => ({ name: MEDIUM_LABEL[row.k] ?? row.k, value: row.n }))
    .sort((a, b) => b.value - a.value);

/** Duración分档显示名. 分界同 `media_probe.context_fields`: 300, 900, 2400 秒.  */
const LENGTH_LABEL: Record<string, string> = {
  Velocidad食: '< 5 minutos', corto: '5–15 minutos', en proceso: '15–40 minutos', largo: '> 40 minutos',
};

/** Duracióny画质分档, 顺序由服务端给. Duración换成分钟区间, 画质Original样.  */
export const bandRows = (rows: BandCount[], labels: Record<string, string> = {}): BarRow[] =>
  rows.map((row) => ({ name: labels[row.k] ?? row.k, value: row.n }));

export const lengthRows = (rows: BandCount[]): BarRow[] => bandRows(rows, LENGTH_LABEL);

/** Reproducir次数分档: cinco次以interioruno次uno档, 往posteriory成两档, largo尾No柱子拉成uno排细线. 
 * 名字Solo写次数, 单EnImagenTítulodentro: 320 anchoTeléfonoarribasiete根柱子Categoría名No互相挤掉.  */
const REPLAY_BANDS: readonly [number, number, string][] = [
  [1, 1, '1'], [2, 2, '2'], [3, 3, '3'], [4, 4, '4'], [5, 5, '5'],
  [6, 9, '6–9'], [10, Infinity, '≥10'],
];

export const replayRows = (rows: ReplayCount[]): BarRow[] =>
  REPLAY_BANDS.map(([low, high, name]) => ({
    name,
    value: rows.filter((row) => row.k >= low && row.k <= high).reduce((sum, row) => sum + row.n, 0),
  }));
