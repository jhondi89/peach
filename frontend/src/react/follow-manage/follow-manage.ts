/* 关注GestionarpáginaDatos契约, 轮询节律y纯折算. nueve端点En `frontend/src` dentro都SoloEnaquí声明
 * uno次(`tests/test_frontend_build.py` 盯着). 
 *
 * esteunopáginaContres各自节律真相, 所以ContresClave: 
 * - `['follow-manage']` es来源清单, 创作者别名y"猜你喜欢", 由用户写操作推进. 写完
 *   Solo改动eseuno换进缓存(`setQueryData`), NoComouno次开关Completopáginapesado取uno遍. 
 * - `['follow-manage','credentials']` esCredencialesEstado. 它按站点报"Introduce没Introduce",  y 来源清单改动
 *   互No影响, 合成unoClave就会让每次开关来源都顺带pesado问uno遍每站CredencialesArchivo. 
 * - `['follow-manage','check']` y `['follow-manage','resolve']` es两趟posteriorTarearápido照, 
 *   节律由posterior推进: 跑起来两秒uno次, 停就No问. 
 * - `['follow-manage','feeds']` es订阅源(ADR-0042). 它 y 关注来源es两表, 开关yQuitar之posterior
 *   Solopesado取esteuno. 
 *
 * Agrupar, Ordenar, 分página都es纯函数: 两视Imagen(创作者卡片y表格)必须给出同uno套顺序, 比较Dispositivo
 * 写En两处话, 同unoDatosEn两视Imagenen la先posterior就会Nouno样.  */
import { apiGet, apiSend } from '../../api';
import {
  DEFAULT_SORT, isSortKey, SORT_DEFAULT_DIR, SORT_OPTIONS, type SortDir, type SortKey,
} from '../../follow-sort';
import { clampPage, pageCount } from '../../pagination';
import { queryClient } from '../query';
import { localTime } from '../time';

export const FOLLOW_URL = '/api/follow';
export const FOLLOW_CREDENTIALS_URL = '/api/follow/credentials';
export const FOLLOW_CHECK_URL = '/api/follow/check';
export const FOLLOW_SOURCE_URL = '/api/follow/source';
export const FOLLOW_RESOLVE_URL = '/api/follow/resolve';
export const FOLLOW_SUGGEST_URL = '/api/follow/suggest';
export const FOLLOW_ALIAS_URL = '/api/follow/author-alias';
export const FOLLOW_CREDENTIAL_URL = '/api/follow/credential';
export const FOLLOW_STATUS_URL = '/api/follow/status';
export const FEEDS_URL = '/api/feeds';
export const FEED_SOURCE_URL = '/api/feeds/source';
export const FEEDS_CHECK_URL = '/api/feeds/check';
export const FEEDS_LOOKUP_URL = '/api/feeds/lookup';

/** 来源清单, 创作者别名yRecomendado共用esteunoClave.  */
export const FOLLOW_MANAGE_KEY = ['follow-manage'] as const;
/** 各站CredencialesEstado.  */
export const FOLLOW_CREDENTIALS_KEY = ['follow-manage', 'credentials'] as const;
/** VerificarActualizareseuno趟posteriorTarea.  */
export const FOLLOW_CHECK_KEY = ['follow-manage', 'check'] as const;
/** Encontrar关注来源eseuno趟posteriorTarea.  */
export const FOLLOW_RESOLVE_KEY = ['follow-manage', 'resolve'] as const;
/** 订阅源清单yno读数.  */
export const FEEDS_KEY = ['follow-manage', 'feeds'] as const;
/** 敲字建议按词各存uno: 同uno词回头再敲No必再打uno趟站点公开Completar.  */
export const followSuggestKey = (term: string) => ['follow-manage', 'suggest', term] as const;

/** uno关注来源. 字段以 `_source_payload`(`src/peach/web_follow.py`)Como准.  */
export interface FollowSource {
  id: number;
  provider: string;
  provider_label: string;
  ref: string;
  label: string;
  url: string;
  enabled: boolean;
  author_name?: string;
  author_key?: string;
  official_avatar_url?: string;
  avatar_url?: string;
  entity_id?: number | null;
  entity_name?: string;
  created_at?: string;
  last_checked_at?: string | null;
  last_status?: string;
  last_error?: string;
  history_exhausted?: boolean;
}

/** uno组yaGuardar创作者别名.  */
export interface AliasGroup {
  canonical_key: string;
  canonical_name: string;
  aliases: { key: string; name: string; source?: string }[];
}

/** uno待合y别名, 带判定依据. 合y永远由人点, 服务端No自动Actualizar a.  */
export interface AliasSuggestion { canonical: string; alias: string; evidence: string }

/** "猜你喜欢"uno创作者, 来自用户自己Explorar过En线Registro.  */
export interface FollowGuess { name: string; visits: number; origin?: string }

export interface FollowCounts { new?: number; seen?: number; saved?: number; ignored?: number }

/** `/api/follow` Respuestadentroesteunopágina要ese几项.  */
export interface FollowData {
  sources: FollowSource[];
  author_aliases?: AliasGroup[];
  alias_suggestions?: AliasSuggestion[];
  suggestions?: FollowGuess[];
  counts?: FollowCounts;
}

/** uno站点CredencialesEstado. Solo报存En性y去哪儿配, No回Credenciales值.  */
export interface CredentialRow {
  provider: string;
  provider_label: string;
  followable: boolean;
  requirement: 'required' | 'optional' | 'none' | 'blocked';
  needs: string[];
  fields: string[];
  missing: string[];
  shared_fields?: string[];
  present?: boolean;
  world_readable?: boolean | null;
  why?: string;
  where?: string;
  howto?: string;
  path?: string;
}

export interface CredentialData { root: string; providers: CredentialRow[] }

/** VerificarActualizareseuno趟unoResultado. 完CompletoEstadísticasDejaEnpáginainterior, 简corto回执走 Toast.  */
export interface CheckResult {
  ok?: boolean;
  provider?: string;
  provider_label?: string;
  author?: string;
  label?: string;
  ref?: string;
  error?: string;
  evidence_error?: string;
  added?: number;
  updated?: number;
  skipped?: number;
  skipped_compilations?: number;
  history_skipped?: number;
  probed?: number;
  exhausted?: boolean;
}

/** VerificarActualizarTarearápido照. uno次都没跑过es `idle`.  */
export interface CheckJob {
  status: string;
  job_id?: string;
  checked?: number;
  total?: number;
  older?: boolean;
  message?: string;
  error?: string;
  results?: CheckResult[];
  current?: { label?: string; provider?: string; attempt?: number; max_attempts?: number; retry_in?: number };
}

/** unoEncontrarResultadoen launo候选. `known` esya经关注过, 列出来peroNo许再勾.  */
export interface ResolveCandidate {
  provider: string;
  provider_label: string;
  url: string;
  label: string;
  author?: string;
  aliases?: string[];
  evidence?: string;
  known?: boolean;
}

export interface ResolveRow {
  kind?: string;
  line: string;
  error?: string;
  candidates?: ResolveCandidate[];
  external_searches?: { label: string; query: string; url: string; evidence: string }[];
  failures?: Record<string, string>;
}

export interface ResolveJob {
  status: string;
  job_id?: string;
  checked?: number;
  total?: number;
  message?: string;
  error?: string;
  results?: ResolveRow[];
}

/** 添加框建议. Agrupar, 顺序y组名都由服务端给, página面照抄.  */
export interface SuggestGroup {
  kind: string;
  label: string;
  items: { value: string; matched?: string; n?: number }[];
}
export interface SuggestData { q: string; groups: SuggestGroup[] }

/* ── 视ImagenyOrdenar取值 ── */

/** 两视Imagen共用同uno来源集合, 创作者顺序y勾选; 表格视Imagenuno行uno来源.  */
export const LAYOUTS = [['default', 'Vista predeterminada'], ['table', '表格Vista']] as const;
export type Layout = (typeof LAYOUTS)[number][0];

export const PAGE_SIZES = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

/* Ordenar维度yPredeterminado方向 y primero屏骨架共用uno, 见 `frontend/src/follow-sort.ts`.  */
export { DEFAULT_SORT, isSortKey, SORT_DEFAULT_DIR, SORT_OPTIONS, type SortDir, type SortKey };

const SORT_LABELS: Record<SortKey, string> = Object.fromEntries(SORT_OPTIONS) as Record<SortKey, string>;

/** 表格cinco列各自对应工具栏en la哪uno档Ordenar. 列头点就es同unoEstado.  */
export const COLUMN_SORT = {
  author: 'name', source: 'source', provider: 'provider', status: 'status', checked: 'checked',
} as const satisfies Record<string, SortKey>;

export const isLayout = (value: unknown): value is Layout =>
  LAYOUTS.some(([key]) => key === value);

export const pageSizeOf = (value: unknown): number =>
  (PAGE_SIZES as readonly number[]).includes(Number(value)) ? Number(value) : DEFAULT_PAGE_SIZE;

/** 方向词按维度各说各: Tiempo说远近, Cantidad说másmenos, "正序"对unoTiempo戳No成立. 
 *  No.uno项es从升序点abajo去会得到eseuno头, No.dos项es它反面.  */
const SORT_DIR_WORDS: Record<SortKey, readonly [string, string]> = {
  checked: ['De más cercano a más lejano', 'De más lejano a más cercano'], added: ['De más cercano a más lejano', 'De más lejano a más cercano'],
  name: ['Descendente', 'Ascendente'], sources: ['De más a menos', 'De menos a más'],
  source: ['Descendente', 'Ascendente'], provider: ['Descendente', 'Ascendente'], status: ['Descendente', 'Ascendente'],
};

/** 方向按钮Sin障碍名称: 说es点abajo去会得到什么, 所以取反方向词. 照抄当anterior方向, 
 *  读屏ese边会以Como点abajo去还eseste顺序.  */
export const sortLabel = (sort: SortKey, dir: SortDir): string =>
  `按${SORT_LABELS[sort]}${SORT_DIR_WORDS[sort][dir === 'asc' ? 0 : 1]}Ordenar`;

/* ── Agrupar, Ordenar, 分página ── */

/** EstadoOrdenar: Fallo最anterior, 其次Pausar, noVerificar, 正常最posterior—正序就es"先ver要Procesar".  */
export function statusRank(source: FollowSource): number {
  const state = source.last_status;
  if (state === 'error' || state === 'unauthorized') return 0;
  if (!source.enabled) return 1;
  return state === 'ok' ? 3 : 2;
}

/** esteuno此刻es什么Estado. cuatro写法对应cuatro徽章.  */
export function statusText(source: FollowSource): string {
  if (source.history_exhausted) return 'SinMás';
  if (!source.enabled) return 'Pausado';
  if (source.last_status === 'ok') return 'Normal';
  return source.last_status === 'error' || source.last_status === 'unauthorized' ? 'Error de verificación' : 'No verificado';
}

export const isBroken = (source: FollowSource): boolean =>
  source.last_status === 'error' || source.last_status === 'unauthorized';

/** 订阅源拉取频率: unopequeño时以interior按分钟, 两天以interior按pequeño时, 再largo按天.  */
export function feedIntervalText(minutes: number): string {
  const value = Number(minutes) || 0;
  if (value >= 2880) return `每 ${Math.round(value / 1440).toLocaleString()} día(s)`;
  if (value >= 60) return `每 ${Math.round(value / 60)} hora(s)`;
  return `每 ${value} minuto(s)`;
}

/** uno段报错EnListadentroSolo露eseuno行. Python traceback No.uno行永远es"Traceback (most recent call
 *  last):", DescripciónNo什么, 取最posterioruno行ExcepciónTipoy消息; 别取No.uno行No vacío.  */
export function errorHeadline(text: string): string {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return '';
  return /^Traceback \(most recent call last\)/.test(lines[0]!) ? lines[lines.length - 1]! : lines[0]!;
}

const byLabel = (a: FollowSource, b: FollowSource) =>
  String(a.label || '').localeCompare(String(b.label || ''), 'zh-CN', { numeric: true });

/** 按单来源比tres维度.  */
const SOURCE_SORTS: Partial<Record<SortKey, (a: FollowSource, b: FollowSource) => number>> = {
  source: byLabel,
  provider: (a, b) => String(a.provider_label || '').localeCompare(
    String(b.provider_label || ''), 'zh-CN') || byLabel(a, b),
  status: (a, b) => statusRank(a) - statusRank(b) || byLabel(a, b),
};

const timeOf = (value: string | null | undefined): number => Date.parse(value || '') || 0;

/** 同名几写法dentro取grande写最másese: `LazyProcrastinator` 比 `lazyprocrastinator`
 *  更像创作者自己写名字.  */
const clean = (value: string | undefined): string => String(value || '')
  .replace(/\s*[·|]\s*[A-Za-z0-9_-]+\s*$/, '')
  .replace(/\s+collections?\s*$/i, '').trim();

/** 署名yAvatarSolo读来源en laeste几列: 关注Gestionarpáginay关注página(`follow-feed/follow-marks.ts`)来源都给得出.  */
export interface AuthorSource {
  author_key?: string | undefined;
  author_name?: string | undefined;
  label?: string | undefined;
  ref?: string | undefined;
  entity_name?: string | undefined;
  official_avatar_url?: string | undefined;
  avatar_url?: string | undefined;
}

/** AgruparTítulo用创作者本人名字, Noes某uno来源Etiqueta. 哪uno段es人名由服务端uno处判定
 *  (`author_name`), aquíSoloEn同uno人几写法之间挑uno.  */
export function authorName(group: readonly AuthorSource[], aliases: readonly AliasGroup[] = []): string {
  if (!group.length) return '';
  const authored = (source: AuthorSource) => String(source.author_name || '').trim() || clean(source.label);
  const entity = group.find((source) => source.entity_name);
  if (entity) return entity.entity_name!;
  const aliasGroup = aliases.find((item) => `name:${item.canonical_key}` === group[0]?.author_key);
  if (aliasGroup) return clean(aliasGroup.canonical_name);
  /* Oficial主página来源NoSolo优先提供Avatar, 也优先提供创作者写法; 否则 F95 线程Título
     `Lazy Procrastinator Collection` 会因Comogrande写字母更más而抢成AgruparTítulo.  */
  const official = group.find((source) => source.official_avatar_url);
  if (official && authored(official)) return authored(official);
  const names = group.map(authored).filter(Boolean);
  if (!names.length) return group[0]!.label || group[0]!.ref || '';
  const caps = (text: string) => (text.match(/[A-Z]/g) || []).length;
  return names.reduce((best, name) => (caps(name) > caps(best) ? name : best), names[0]!);
}

/** 圆标en la字: 先找拉丁字母或数字, Sin就取No.uno字.  */
export function authorInitial(name: string): string {
  const ascii = name.trim().match(/[A-Za-z0-9]/);
  return (ascii ? ascii[0] : Array.from(name.trim())[0] || '?').toUpperCase();
}

/** 同uno创作者Oficial来源优先提供Avatar, 归档来源Solo回退. 都取No到时用primero字母.  */
export function authorAvatar(group: readonly AuthorSource[]): { src: string; fallback: string } {
  const official = group.find((source) => source.official_avatar_url);
  const mirror = group.find((source) => source.avatar_url);
  const src = official?.official_avatar_url || mirror?.avatar_url || '';
  const fallback = official && mirror && mirror.avatar_url !== src ? mirror.avatar_url || '' : '';
  return { src, fallback };
}

/** este创作者身. 同uno人EnNo同站点arribaesmás来源, uno人, 归组用posterior端给
 *  `author_key`—esees实体 id 或归uno化posterior名字, NoEnanterior端dos次猜.  */
export const groupKey = (group: FollowSource[]): string =>
  String(group[0]?.author_key || group[0]?.id || '');

/** 按创作者归组, 组interior顺序esOriginal顺序. Ordenar另算, 归组本身NoverOrdenar.  */
export function groupByAuthor(sources: FollowSource[]): FollowSource[][] {
  const order: string[] = [];
  const byKey = new Map<string, FollowSource[]>();
  for (const source of sources) {
    const key = source.author_key || `source:${source.id}`;
    if (!byKey.has(key)) { byKey.set(key, []); order.push(key) }
    byKey.get(key)!.push(source);
  }
  return order.map((key) => byKey.get(key)!);
}

/** 排bien序创作者组. 
 *
 * `flip` SoloEn方向偏离esteuno列Predeterminado值时取反: 写成"asc 就取反"话, 创作者名称Predeterminado本来
 * 就es正序, uno进página面就被翻成倒序. 同值回退始终按名字正序, No跟着翻—否则"来源Cantidad"
 * dentroCantidad相同ese几人每换uno次方向就Completo段倒序uno遍, ver着像ListaEn乱跳.  */
export function authorGroups(
  sources: FollowSource[], sort: SortKey, dir: SortDir, aliases: AliasGroup[] = [],
): FollowSource[][] {
  const groups = groupByAuthor(sources);
  const flip = dir === SORT_DEFAULT_DIR[sort] ? 1 : -1;
  const name = (group: FollowSource[]) => authorName(group, aliases);
  const byName = (a: FollowSource[], b: FollowSource[]) =>
    name(a).localeCompare(name(b), 'zh-CN', { numeric: true });
  const bySource = SOURCE_SORTS[sort];
  if (bySource) {
    // 先排每创作者名abajo来源, 创作者之间再按各自排En最anteriorese比. 
    for (const group of groups) group.sort((a, b) => flip * bySource(a, b));
    return groups.sort((a, b) => flip * bySource(a[0]!, b[0]!) || byName(a, b));
  }
  const checked = (group: FollowSource[]) => Math.max(...group.map((s) => timeOf(s.last_checked_at)));
  const added = (group: FollowSource[]) => Math.max(...group.map((s) => timeOf(s.created_at)));
  return groups.sort((a, b) => {
    if (sort === 'name') return flip * byName(a, b);
    if (sort === 'sources') return flip * (b.length - a.length) || byName(a, b);
    if (sort === 'added') return flip * (added(b) - added(a)) || byName(a, b);
    return flip * (checked(b) - checked(a)) || byName(a, b);
  });
}

/** 表格视Imagen行: uno行uno来源, 创作者列每行都写. 
 *
 * 行顺序来自同uno组创作者组, 按来源比esetres档再Completo表拉平pesado排—ese时表格No再按
 * 创作者聚Enuno起, 而este正es点esetres列列头要效果. Ordenar作用En todoResultadoarriba, 分páginaSolo切最posterioruno步.  */
export interface TableRow { source: FollowSource; group: FollowSource[]; author: string }

export function tableRows(
  groups: FollowSource[][], sort: SortKey, dir: SortDir, aliases: AliasGroup[] = [],
): TableRow[] {
  const rows = groups.flatMap((group) => {
    const author = authorName(group, aliases);
    return group.map((source) => ({ source, group, author }));
  });
  const bySource = SOURCE_SORTS[sort];
  if (bySource) {
    const flip = dir === SORT_DEFAULT_DIR[sort] ? 1 : -1;
    rows.sort((a, b) => flip * bySource(a.source, b.source));
  }
  return rows;
}

/** unopágina边界. Total量, página数y当anteriorpágina都按同uno计算, página脚ese句读数 y 切片No会各说各.  */
export interface PageWindow { page: number; pages: number; total: number; start: number; end: number }

export function pageWindow(total: number, size: number, page: number): PageWindow {
  const pages = pageCount(total, size);
  const current = clampPage(page, pages);
  const start = (current - 1) * size;
  return { page: current, pages, total, start, end: Math.min(start + size, total) };
}

/* ── 跨páginay跨视ImagenSeleccionar ── */

/** 勾选身es来源 ID, Noes行号: 换página, 换视Imagen, 换Ordenar之posterior选en proceso仍es同uno批来源. 
 *  ya经NoEn清单en la ID 顺手丢掉—删掉来源No该还占着计数.  */
export function keepSelected(selected: ReadonlySet<number>, sources: FollowSource[]): Set<number> {
  const available = new Set(sources.map((source) => source.id));
  return new Set([...selected].filter((id) => available.has(id)));
}

/** uno组来源En当anteriorSeleccionaren la样子: Seleccionar todo, medio选还es都没选. 表头y创作者行Seleccionar todoClave读它.  */
export function selectionState(selected: ReadonlySet<number>, ids: number[]):
{ all: boolean; some: boolean } {
  const count = ids.filter((id) => selected.has(id)).length;
  return { all: ids.length > 0 && count === ids.length, some: count > 0 && count < ids.length };
}

export function toggleGroup(selected: ReadonlySet<number>, ids: number[], on: boolean): Set<number> {
  const next = new Set(selected);
  for (const id of ids) { if (on) next.add(id); else next.delete(id) }
  return next;
}

/* ── 取数y写操作 ── */

/** GestionarpáginaSolo要来源清单, 别名y计数; `summary=1` 让服务端OmitirObrasAgrupary筛Opciones.  */
export const fetchFollow = (signal?: AbortSignal) =>
  apiGet<FollowData>(`${FOLLOW_URL}?summary=1`, signal);

export const fetchCredentials = (signal?: AbortSignal) =>
  apiGet<CredentialData>(FOLLOW_CREDENTIALS_URL, signal);

export const fetchCheckJob = (signal?: AbortSignal) =>
  apiGet<CheckJob>(FOLLOW_CHECK_URL, signal);

export const fetchResolveJob = (signal?: AbortSignal) =>
  apiGet<ResolveJob>(FOLLOW_RESOLVE_URL, signal);

export const fetchSuggestions = (query: string, signal?: AbortSignal) =>
  apiGet<SuggestData>(`${FOLLOW_SUGGEST_URL}?q=${encodeURIComponent(query)}`, signal);

/** 起uno趟Verificar. `sources` 给就Solo查este几, 都No给就esTodo.  */
export const startCheck = (sources?: number[]) =>
  apiSend<CheckJob>(FOLLOW_CHECK_URL, { ...(sources?.length ? { sources } : {}), background: true });

/** 起uno趟Encontrar. Resultado先摆出来由人勾选, esteuno步No写任何东西.  */
export const startResolve = (lines: string[]) =>
  apiSend<ResolveJob>(FOLLOW_RESOLVE_URL, { lines, background: true });

export const setSourceEnabled = (id: number, enabled: boolean) =>
  apiSend<{ source: number; enabled: boolean }>(FOLLOW_SOURCE_URL, { action: 'enabled', id, enabled });

export const removeSource = (id: number) =>
  apiSend<{ ok: boolean }>(FOLLOW_SOURCE_URL, { action: 'remove', id });

export const addSource = (candidate: ResolveCandidate) =>
  apiSend<{ source: number }>(FOLLOW_SOURCE_URL, {
    action: 'add', url: candidate.url, label: candidate.label,
    author: candidate.author || '', aliases: candidate.aliases || [], defer_check: true,
  });

export const addAlias = (canonical: string, alias: string) =>
  apiSend<{ ok: boolean }>(FOLLOW_ALIAS_URL, { action: 'add', canonical, alias });

export const removeAlias = (alias: string) =>
  apiSend<{ ok: boolean }>(FOLLOW_ALIAS_URL, { action: 'remove', alias });

/** Guardar或Borraruno站点Credenciales. `values` Como空就esBorrar.  */
export const saveCredential = (provider: string, values: Record<string, string>) =>
  apiSend<{ note?: string }>(FOLLOW_CREDENTIAL_URL, { provider, values });

export const markItem = (item: number, to: string) =>
  apiSend<{ ok: boolean }>(FOLLOW_STATUS_URL, { item, to });

/** 待ProcesarnoverEntrada. 批量Etiqueta要先知道Con哪些, 取uno趟再逐写.  */
export const fetchPending = () =>
  apiGet<{ groups?: { primary: { id: number; status: string }; variants: { id: number; status: string }[];
    duplicates: { id: number; status: string }[] }[] }>(`${FOLLOW_URL}?status=new&limit=1000`);

/** uno订阅源. 字段以 `feeds.sources`(`src/peach/feeds.py`)Como准.  */
export interface FeedSource {
  id: number;
  kind: string;
  kind_label: string;
  /** 挂着人物时es她EnDatosBibliotecaen la统称, 否则es存abajo名字.  */
  name: string;
  /** Última vez拉取时esteunopáginaEn站arriba挂名字. 同uno人antiguo艺名página靠它 y 本名página分开.  */
  page_name?: string;
  url: string;
  entity_id: number | null;
  entity_name: string | null;
  /** esteConSin资料Imagen: Con就En名字anterior画 `/entity-image` 圆框, Sin退primero字母.  */
  has_image?: boolean;
  image_version?: string;
  /** 资料Imagen人脸取景,  y  `has_image` 出自同uno身引用.  */
  avatar_focus?: unknown;
  enabled: boolean;
  interval_minutes: number;
  last_fetched_at: string | null;
  last_error: string | null;
  last_new_count: number;
  seen: number;
}

export interface FeedsData {
  sources: FeedSource[];
  unread: number;
}

/** 认No出Respuesta当读Fallo: Sin sources eseNoes订阅源Datos, 画出来Solo会EnNo.uno次取largo度时炸掉.  */
export async function fetchFeeds(signal?: AbortSignal): Promise<FeedsData> {
  const payload = await apiGet<FeedsData>(FEEDS_URL, signal);
  if (!Array.isArray(payload?.sources)) throw new Error('Sin读到Suscribirse源');
  return payload;
}

export const setFeedEnabled = (id: number, enabled: boolean, signal?: AbortSignal) =>
  apiSend(FEED_SOURCE_URL, { action: 'enabled', id, enabled }, 'POST', signal);

export const removeFeed = (id: number, signal?: AbortSignal) =>
  apiSend(FEED_SOURCE_URL, { action: 'remove', id }, 'POST', signal);

/** 拉取走es y 定时同uno路: No点名就es"Todo启用源", 点名几就Solo拉ese几, 停用也拉.  */
export const checkFeeds = (signal?: AbortSignal, ids?: number[]) =>
  apiSend(FEEDS_CHECK_URL, ids?.length ? { sources: ids } : { all: true }, 'POST', signal);

/** JavDB 搜出来uno演员卡. 字段以 `web_feeds.q_feed_lookup` Como准.  */
export interface FeedCandidate {
  /** 站interior id, 登记时送回去就es它.  */
  id: string;
  /** este人En站en laTodo写法.  */
  names: string[];
  /** RegistroTipo: 無碼ese带 `無碼`, Con碼esees空串.  */
  record: string;
  url: string;
  /** este id ya经EnDatosBibliotecadentro谁名abajo.  */
  held_by: { id: number; name: string } | null;
  /** 卡en la写法对得arribaDatosBibliotecadentro哪几正名或别名.  */
  matched: { id: number; name: string }[];
}

export interface FeedLookup {
  q: string;
  url: string;
  candidates: FeedCandidate[];
  /** 名字对得arriba, 又SoloConuno人ese几, 先替用户勾arriba; 同名No止uno时es空.  */
  suggested: string[];
  /** DatosBibliotecadentro按este名字认得出ese; 认No出es null, 登记时会Nuevo.  */
  known: { id: number; name: string } | null;
}

export const lookupFeedActor = (name: string, signal?: AbortSignal) =>
  apiGet<FeedLookup>(`${FEEDS_LOOKUP_URL}?q=${encodeURIComponent(name)}`, signal);

export interface FeedFollowed {
  entity_id: number;
  entity_name: string;
  /** esteesesteuno次Nuevo到DatosBibliotecaen la.  */
  created: boolean;
  sources: number[];
}

/** 勾选演员卡登记到este名abajoy订arriba她演员página. 地址仍由服务端拼, página面Solo送 id.  */
export const followFeedByName = (name: string, ids: string[], signal?: AbortSignal) =>
  apiSend<FeedFollowed>(FEED_SOURCE_URL, { action: 'follow-name', name, ids }, 'POST', signal);

/** primero屏: 来源清单yCredencialesEstado取回来才画; 地址栏直continuar指着"订阅源"时连它uno起取. 
 *
 * 两趟posteriorTareaNoEnprimero屏dentro: 它们rápido照常年躺着Anterior趟回执, etc.它们Solo会让primero屏másetc.uno
 * 往返, 而它们自己Clave挂arriba去就会读. en proceso止时 `fetchQuery`  `AbortError` 抛回挂载方.  */
export async function prefetchFollowManage(signal: AbortSignal, tab = ''): Promise<void> {
  await Promise.all([
    queryClient.fetchQuery({ queryKey: FOLLOW_MANAGE_KEY, queryFn: () => fetchFollow(signal) }),
    queryClient.fetchQuery({ queryKey: FOLLOW_CREDENTIALS_KEY, queryFn: () => fetchCredentials(signal) }),
    tab === 'feeds' ? queryClient.fetchQuery({ queryKey: FEEDS_KEY, queryFn: () => fetchFeeds(signal) }) : null,
  ]);
}

/** 改动eseuno换进缓存. Completopáginapesado取会用户En cursoIntroduce表单uno起pesado画, 也会让En curso读esteuno屏
 *  人ver见ListaCompleto跳unoabajo; 服务端回就esesteunoNuevo样子, 换进去即puede.  */
export function patchSource(id: number, patch: Partial<FollowSource>): void {
  queryClient.setQueryData<FollowData>(FOLLOW_MANAGE_KEY, (data) => (data ? {
    ...data,
    sources: data.sources.map((row) => (row.id === id ? { ...row, ...patch } : row)),
  } : data));
}

/** 删掉ese几直continuar从缓存dentro去掉.  */
export function dropSources(ids: number[]): void {
  const gone = new Set(ids);
  queryClient.setQueryData<FollowData>(FOLLOW_MANAGE_KEY, (data) => (data ? {
    ...data, sources: data.sources.filter((row) => !gone.has(row.id)),
  } : data));
}

/** 添加来源, 合y别名este类会改变Completo清单结构写操作: 换uno进去算No出NuevoAgrupary别名, 
 *  Solo能让esteunoClavepesado取. 
 *
 * `exact` No能省: 另exteriortresClave都以 `follow-manage` 开头, 按anterior缀Inválido会Credenciales y 两趟Tarea
 * rápido照uno起推倒pesado来—En curso跑eseuno趟会Enpágina面arriba闪回"SinTarea"再跳回Progreso.  */
export const reloadFollowManage = (): Promise<void> =>
  queryClient.invalidateQueries({ queryKey: FOLLOW_MANAGE_KEY, exact: true });

/** 敲字建议防抖. esteuno路要打uno次站点公开Completar, 250ms 让连着敲人停手之posterior才打uno枪.  */
export const SUGGEST_DEBOUNCE_MS = 250;

/** Verificar回执Solo显示contenido变化yFallo数, 完CompletoEstadísticas由VerificarResultado呈现.  */
export function checkReceipt(job: Pick<CheckJob, 'results'>): string {
  const rows = job.results || [];
  const added = rows.reduce((total, row) => total + (row.added || 0), 0);
  const updated = rows.reduce((total, row) => total + (row.updated || 0), 0);
  const failed = rows.filter((row) => !row.ok).length;
  const bits: string[] = [];
  if (added) bits.push(`Nuevo ${added} Resultado`);
  if (updated) bits.push(`Actualizar ${updated} Resultado`);
  if (!bits.length && failed < rows.length) bits.push('No hay actualizaciones disponibles');
  if (failed) bits.push(`${failed} Fallido`);
  if (!bits.length) bits.push('No hay actualizaciones disponibles');
  return `Verificado ${rows.length}  fuente(s): ${bits.join(' · ')}`;
}

/** uno次Verificar完CompletoEstadísticas.  */
export function checkSummary(job: CheckJob): string {
  const rows = job.results || [];
  const sum = (pick: (row: CheckResult) => number | undefined) =>
    rows.reduce((total, row) => total + (pick(row) || 0), 0);
  const added = sum((row) => row.added);
  const updated = sum((row) => row.updated);
  const compilations = sum((row) => row.skipped_compilations);
  const skipped = sum((row) => row.skipped) - compilations;
  const history = sum((row) => row.history_skipped);
  const probed = sum((row) => row.probed);
  const quiet = rows.filter((row) => row.ok && !row.added && !row.updated).length;
  const failed = rows.filter((row) => !row.ok).length;
  const bits: string[] = [];
  if (added) bits.push(`Nuevo ${added} Resultado`);
  if (updated) bits.push(`Actualizar ${updated} Resultado`);
  if (skipped) bits.push(`Omitir ${skipped} ResultadoNingunoRecurso`);
  if (compilations) bits.push(`Excluir ${compilations} 超grandeColección`);
  if (history) bits.push(`Omitir ${history} Resultado超出Rango de primera recopilaciónHistorialcontenido`);
  if (probed) bits.push(`回查 ${probed} Resultado`);
  if (quiet) bits.push(`${quiet}  fuente(s)No hay actualizaciones disponibles`);
  if (!bits.length) bits.push('Sin任何Actualizar');
  /* 来源Sin更máscontenidoy本次SinActualizar分别计数.  */
  const exhausted = rows.filter((row) => row.exhausted).length;
  if (exhausted) bits.push(`${exhausted} No hay más contenido`);
  if (failed) bits.push(`${failed} Fallido`);
  return `Verificar ${rows.length}  fuente(s): ${bits.join(' · ')}`;
}

/** páginainterior持久行Solo装要Procesar东西: Falloy取证缺档. TodoÉxito时Sinesteuno行.  */
export const checkFailures = (job: CheckJob | null): CheckResult[] =>
  (job?.results || []).filter((row) => !row.ok);

export const checkEvidenceGap = (job: CheckJob | null): string =>
  (job?.results || []).find((row) => row.evidence_error)?.evidence_error || '';

export { localTime };

export const checkedText = (source: FollowSource): string =>
  (source.last_checked_at ? localTime(source.last_checked_at) : 'No verificado');

/** Con站点Imagen标来源. Imagen标由服务端按 `follow_assets.SOURCE_ICON_URLS` 取回y存En本机, 
 *  página面Solo认este名单: 没登记来源直continuarNo出 `<img>`.  */
export const SOURCE_ICON_PROVIDERS = new Set([
  'fanbox', 'patreon', 'subscribestar', 'kemono', 'coomer', 'pawchive',
  'rule34video', 'rule34xxx', 'rule34paheal', 'gofile', 'f95zone', 'simpcity',
]);

export const sourceIconUrl = (provider: string): string =>
  (SOURCE_ICON_PROVIDERS.has(provider) ? `/source-icon?provider=${encodeURIComponent(provider)}` : '');

/** cuatroCredencialesEstadocuatro说法: 待办(缺Credenciales) y Completado(yaConfiguración)No能同色, ese正es要uno眼分开两件事.  */
export const CREDENTIAL_STATE: Record<string, string> = {
  required: 'Necesario', optional: 'Opcional', none: 'No se necesita', blocked: 'No se puede conectar',
};

export const credentialDone = (row: CredentialRow): boolean =>
  !!row.present && !row.missing.length;
