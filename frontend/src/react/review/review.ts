/* 人工复核páginaDatos契约, Agrupar分página纯函数y写操作. tres端点En `frontend/src` dentro都SoloEnaquí
 * 声明uno次(`tests/test_frontend_build.py` 盯着). 
 *
 * `['review']` esCompleto复核Cola. Interfazuno次给出TodoCategoría(实测 4.6 MB, 1300 行, 本机读
 *   0.1 秒), nueveCategoría合EnunoRespuestadentro, 所以也Solo用uno `queryKey`: CategoríaCambiares翻esteuno
 *   No同段落, Noes另uno真相. 判定写回来时Soloese几行从缓存dentro摘掉(`dropReviewRows`), 
 *   NoComouno次判定CompletoColapesado取uno遍. 
 *
 * Agrupar, Filtrar, 分página都es纯函数: 工具en la计数说esCompletoCola, 卡片Solo画当anterioresteunopágina, 两边
 * 用同uno套判据算, 各写uno迟早对Noarriba.  */
import { apiGet, apiSend } from '../../api';
import { clampPage, pageCount } from '../../pagination';
import { selectRange } from '../../selection';
import { queryClient } from '../query';
import { localTime } from '../time';

export const REVIEW_URL = '/api/review';
export const REVIEW_DECISION_URL = '/api/review/decision';
export const REVIEW_GENRE_URL = '/api/review/genre';

/** Completo复核Cola.  */
export const REVIEW_KEY = ['review'] as const;

/** 复核Categoríay它们En界面en la名字. 次序就espágina签次序.  */
export const REVIEW_LABELS = {
  metadata_fields: 'Campos de metadatos',
  creator_tags: 'Etiquetas de creador',
  studio_logos: 'Logo de sello',
  performer_avatars: 'Avatar de actriz',
  western_identity: 'Reasignación de identidad occidental',
  code_creators: 'Directorio de códigos JAV en duda',
  fc2_markings: 'Marcas de comentarios FC2',
  fc2_similarity: 'Similitudes entre códigos FC2',
  video_endcards: 'Evidencia de créditos/fuente',
} as const;

export type ReviewCategory = keyof typeof REVIEW_LABELS;

export const REVIEW_CATEGORIES = Object.keys(REVIEW_LABELS) as ReviewCategory[];

export const DEFAULT_CATEGORY: ReviewCategory = 'metadata_fields';

export const isReviewCategory = (value: unknown): value is ReviewCategory =>
  typeof value === 'string' && Object.hasOwn(REVIEW_LABELS, value);

/** 主体es实体而Noes单ObrasCategoría, 值就es实体 kind. este表y `web_review.py` 
 *  `ENTITY_REVIEW_KINDS` 必须逐字uno致: este边判成 creator, 取Imagen按 performer, 
 *  就es标志说ConImagen而Por favor求照样 404.  */
export const ENTITY_REVIEW_KINDS: Partial<Record<ReviewCategory, string>> = {
  creator_tags: 'creator', western_identity: 'creator',
};

/** unopágina 20 . Interfazuno次给CompletoCola, 卡es几cien候选表单uno次画进 DOM.  */
export const REVIEW_PAGE_SIZE = 20;

export interface CatalogEvidence { display_value?: string; warnings?: string[] }

/** uno来源给出候选值. 选en proceso它就es `display_value` 写进DatosBiblioteca.  */
export interface ReviewCandidate {
  candidate_key: string;
  source?: string;
  official?: boolean;
  content_id?: string;
  provider_id?: string;
  display_value?: string;
  warnings?: string[];
  /** 同uno来源顺带交回来其它字段, Solo作判断依据.  */
  catalog_evidence?: Record<string, CatalogEvidence>;
  /** 静态词表还没收录 genre.  */
  unmapped_genres?: string[];
}

/** 卡片arribaese几Imagen背posteriorObras.  */
export interface ReviewAsset {
  id: number;
  name?: string;
  code?: string;
  preview_url?: string;
  has_preview?: boolean;
}

/** Colaen launo行. 字段以 `src/peach/web_review.py`  `_review_rows` Como准, 各Categoría共用esteuno
 *  形状, 用Noen la项缺席.  */
export interface ReviewRow {
  item_key: string;
  decision?: string;
  status?: string;
  candidates?: ReviewCandidate[];
  field?: string;
  field_label?: string;
  query?: string;
  code?: string;
  creator?: string;
  studio?: string;
  current_name?: string;
  name?: string;
  board?: string;
  source?: string;
  /** DatosBibliotecaNormalizar名当Título时, 来源自己写法DejaEnaquí.  */
  source_name?: string;
  /** 竖线分隔候选Etiqueta.  */
  tags?: string;
  reason?: string;
  evidence?: string;
  note?: string;
  decision_note?: string;
  japanese_name?: string;
  path?: string;
  suggested_query?: string;
  preview_url?: string;
  preview_assets?: ReviewAsset[];
  comparison_assets?: ReviewAsset[];
  asset_id?: number;
  asset_name?: string;
  asset_preview_url?: string;
  asset_path?: string;
  asset_mutation_revision?: number | null;
  entity_id?: number;
  has_image?: boolean;
  image_version?: string;
  avatar_focus?: unknown;
  avatar_url?: string;
  video_count?: number;
  videos?: number | string;
  assets?: number;
  babepedia_name?: string;
  profile_url?: string;
}

/** Solo读端读到es写入端Cola镜像, página面要说清esteunoes实时还es缓存.  */
export interface ReviewMirror {
  state?: string;
  origin?: string | null;
  fetched_at?: string | null;
  error?: string | null;
  read_only?: boolean;
}

export interface ReviewData {
  sections: Partial<Record<ReviewCategory, ReviewRow[]>>;
  counts: Partial<Record<ReviewCategory, number>>;
  /** 收录 genre 时候选词表: 静态表ya经投影到ese批contenidoEtiqueta.  */
  genre_tags?: string[];
  mirror?: ReviewMirror | null;
}

/* ── Agrupar, Filtrar, 分página ── */

export type ReviewGrouping = 'candidates' | 'source' | 'field';

export interface ReviewGroup { key: string; title: string; rows: ReviewRow[] }

/** esteuno批Cola能按什么Agrupar. 按来源, 按字段两档要Coladentro真Coneseuno项才出现.  */
export function reviewGroupingOptions(rows: ReviewRow[], metadata: boolean): [ReviewGrouping, string][] {
  const options: [ReviewGrouping, string][] = [
    ['candidates', metadata ? '按FuenteCantidad' : 'TodoPendiente复核'],
  ];
  if (rows.some((row) => row.source || row.candidates?.some((candidate) => candidate.source))) {
    options.push(['source', '按Fuente']);
  }
  if (rows.some((row) => row.field)) options.push(['field', 'Por campo']);
  return options;
}

/** 按来源组合Agrupar, 每Obras字段Solo出现uno次.  */
export function groupReviewRows(rows: ReviewRow[], by: ReviewGrouping): ReviewGroup[] {
  const groups = new Map<string, ReviewGroup>();
  for (const row of rows) {
    let key: string;
    let title: string;
    if (by === 'field') {
      key = row.field || '__unspecified_field';
      title = row.field_label || row.field || 'No标注字段';
    } else if (by === 'source') {
      const sources = [...new Set((row.candidates?.map((candidate) => candidate.source || '')
        || [row.source || '']).filter(Boolean))].sort();
      key = JSON.stringify(sources);
      title = sources.join(' / ') || 'No标注Fuente';
    } else {
      key = row.candidates ? (row.candidates.length === 1 ? 'single' : 'multiple') : 'pending';
      title = key === 'single' ? '单unoFuente' : key === 'multiple' ? '需SeleccionarFuente' : 'Pendiente复核';
    }
    if (!groups.has(key)) groups.set(key, { key, title, rows: [] });
    groups.get(key)!.rows.push(row);
  }
  return [...groups.values()];
}

/** 先按Agrupar筛, 再切página. 顺序反过来话, Filtrar说就成"esteuno屏dentroque cumpleese几".  */
export function filterReviewRows(
  rows: ReviewRow[], by: ReviewGrouping, filter: string,
): ReviewRow[] {
  if (!filter) return rows;
  return groupReviewRows(rows, by).find((group) => group.key === filter)?.rows || rows;
}

export interface ReviewWindow { page: number; pages: number; rows: ReviewRow[] }

/** 当anterioresteunopáginaes哪dosdiez行. página码越界时收回到最posteriorunopágina, No画空Lista.  */
export function reviewWindow(rows: ReviewRow[], page: number): ReviewWindow {
  const pages = pageCount(rows.length, REVIEW_PAGE_SIZE);
  const current = clampPage(page, pages);
  return {
    page: current,
    pages,
    rows: rows.slice((current - 1) * REVIEW_PAGE_SIZE, current * REVIEW_PAGE_SIZE),
  };
}

/** 所Opciones目都Con, 且各自Solo出现uno次来源. Unificado选来源Solo能Eneste些dentro选: 同uno来源Enuno行dentro
 *  给两值时, "Unificado选 javdb"就Sin唯uno答案.  */
export function commonReviewSources(rows: ReviewRow[]): string[] {
  if (!rows.length) return [];
  return [...new Set(rows.flatMap((row) => row.candidates?.map((candidate) => candidate.source || '') || []))]
    .filter((source) => source && rows.every(
      (row) => row.candidates?.filter((candidate) => candidate.source === source).length === 1));
}

/** Shift 按当anterior显示顺序扩展Seleccionar, y馆藏página同uno套语义. 返回Nuevo锚点.  */
export function selectReviewRange(
  selected: Set<string>, keys: string[], anchor: string | null,
  key: string, range: boolean, checked: boolean,
): string {
  return selectRange(selected, keys, anchor, key, range, checked);
}

/* ── uno行能做什么 ── */

/** esteuno行能No能通过. Metadatos字段要Con候选; 创作者EtiquetaSolo判 `candidate` Estadoese些.  */
export function canApprove(category: ReviewCategory, row: ReviewRow): boolean {
  if (category === 'metadata_fields') return (row.candidates?.length || 0) > 0;
  if (category === 'creator_tags') return String(row.status || '').trim() === 'candidate';
  return true;
}

/** esteuno行Título读作"问es什么". 字段名es问题本身, Obras标识Soloes它问对象.  */
export function rowSubject(category: ReviewCategory, row: ReviewRow): string {
  if (category === 'metadata_fields') return String(row.query || row.code || '');
  return String(row.creator || row.studio || row.current_name || row.name || row.item_key);
}

export const rowFieldName = (category: ReviewCategory, row: ReviewRow): string =>
  (category === 'metadata_fields' ? String(row.field_label || row.field || '').trim() : '');

export function rowTitle(category: ReviewCategory, row: ReviewRow): string {
  const subject = rowSubject(category, row);
  const field = rowFieldName(category, row);
  return field ? `${subject} · ${field}` : subject;
}

export const rowEvidence = (row: ReviewRow): string =>
  row.reason || row.evidence || row.note || row.decision_note || '';

export const rowTags = (row: ReviewRow): string[] =>
  String(row.tags || '').split('|').filter(Boolean);

/** esteuno行etc.着被收录 genre. 同uno词En几来源dentro各出现uno次时Solo问uno遍.  */
export const pendingGenres = (row: ReviewRow): string[] =>
  [...new Set((row.candidates || []).flatMap((candidate) => candidate.unmapped_genres || []))];

/** uno行此刻Seleccionar: 选哪来源值, 勾哪几Obras.  */
export interface RowChoice { candidateKey: string; assets: number[] }

/** 还没动过行按Predeterminado值算: SoloConuno候选时它就es选en procesoese, Obras样本PredeterminadoTodo勾.  */
export function defaultChoice(row: ReviewRow): RowChoice {
  const candidates = row.candidates || [];
  return {
    candidateKey: candidates.length === 1 ? candidates[0]!.candidate_key : '',
    assets: (row.preview_assets || []).map((asset) => asset.id),
  };
}

export type DecisionStatus = 'approved' | 'rejected' | 'skipped';

/** 交给 `/api/review/decision` eseuno. 
 *
 *  乐观y发SoloEnesteuno行钉死uno资产时带arriba: 按Código JAV命en procesomás组Sin单uno revision puede报, 
 *  Grave报unoSolo会En同Código JAV分卷arriba换来uno串假冲突.  */
export function decisionPayload(
  category: ReviewCategory, row: ReviewRow, status: DecisionStatus, choice: RowChoice,
): Record<string, unknown> {
  const pinned = !!row.asset_path && row.asset_mutation_revision != null;
  return {
    category,
    item_key: row.item_key,
    status,
    candidate_key: choice.candidateKey,
    creator: row.creator,
    tags: row.tags,
    studio: row.studio,
    entity_id: row.entity_id,
    avatar_url: row.avatar_url,
    selected_ids: choice.assets,
    ...(pinned ? { expected_revision: row.asset_mutation_revision } : {}),
  };
}

export const decisionReceipt = (status: DecisionStatus): string =>
  (status === 'approved' ? 'YaAceptarDetalles' : status === 'rejected' ? 'YaRechazarDetalles' : 'YaOmitirDetalles');

/* ── 取数y写操作 ── */

export const fetchReview = (signal?: AbortSignal) => apiGet<ReviewData>(REVIEW_URL, signal);

export interface DecisionResult {
  ok: boolean;
  error?: string;
  asset_revisions?: Record<string, { before: number; after: number }>;
}

export async function submitDecision(payload: Record<string, unknown>): Promise<DecisionResult> {
  const result = await apiSend<DecisionResult>(REVIEW_DECISION_URL, payload);
  if (result.ok && result.asset_revisions) {
    const revisions = result.asset_revisions;
    queryClient.setQueryData<ReviewData>(REVIEW_KEY, (data) => data && ({
      ...data,
      sections: {
        ...data.sections,
        metadata_fields: data.sections.metadata_fields?.map((row) => {
          const change = revisions[String(row.asset_id)];
          return row.asset_path && change && row.asset_mutation_revision === change.before
            ? { ...row, asset_mutation_revision: change.after } : row;
        }),
      },
    }));
  }
  return result;
}

/** 批量Cola保Deja行身; y发Credenciales来自共享缓存en la最Nuevo回执.  */
export function currentReviewRow(category: ReviewCategory, row: ReviewRow): ReviewRow {
  return queryClient.getQueryData<ReviewData>(REVIEW_KEY)?.sections[category]
    ?.find((item) => item.item_key === row.item_key) || row;
}

/** 收录uno genre(给en proceso文名)或它判成非contenido(`tag` Deja空).  */
export const recordGenre = (genre: string, tag: string) =>
  apiSend<DecisionResult>(REVIEW_GENRE_URL, { genre, tag });

/** primero屏Solo读复核Cola. que cumple ADR-0018 候选yaEnescaneary资料ProcesarTerminar时落Biblioteca.  */
export async function prefetchReview(signal: AbortSignal): Promise<void> {
  await queryClient.fetchQuery({ queryKey: REVIEW_KEY, queryFn: () => fetchReview(signal) });
}

/** 判过行从缓存dentro摘掉ySincronizar计数. DejaEnColaen la话, ver起来就像esteuno次判定没生效. 
 *
 *  Falloese几No动: 它们还要DejaEn屏幕arriba供Reintentar.  */
export function dropReviewRows(category: ReviewCategory, keys: string[]): void {
  const gone = new Set(keys);
  if (!gone.size) return;
  queryClient.setQueryData<ReviewData>(REVIEW_KEY, (data) => {
    if (!data) return data;
    const rows = data.sections[category] || [];
    const kept = rows.filter((row) => !gone.has(String(row.item_key)));
    if (kept.length === rows.length) return data;
    return {
      ...data,
      sections: { ...data.sections, [category]: kept },
      counts: { ...data.counts, [category]: Math.max(0, (data.counts[category] ?? rows.length) - (rows.length - kept.length)) },
    };
  });
}

/** 收录uno genre 改es词表, Noes某uno候选: 服务端按Nuevo词表pesadoNuevo折uno遍CompletoCola
 *  (`_fold_genre_decisions`), 所以aquípesado取Cola而NoesEnanterior端自己折. 同uno判据写两遍
 *  迟早对Noarriba, 而对Noen la表现es"página面arribaEtiquetamásuno, 批准写abajo去还esantiguo".  */
export const reloadReview = (): Promise<void> =>
  queryClient.invalidateQueries({ queryKey: REVIEW_KEY, exact: true });

/** Solo读端ese句话: 实时镜像, 缓存rápido照, 还es连镜像都没取到.  */
export function mirrorText(
  mirror: ReviewMirror | null | undefined, readOnlyMessage: string,
): string {
  if (mirror?.state === 'live') return 'ProcesandoMostrar写入端实时复核Cola';
  if (mirror?.state === 'cached') return `写入端暂时Nopuede达, Mostrar ${localTime(mirror.fetched_at)} Caché`;
  return mirror?.error || readOnlyMessage;
}
