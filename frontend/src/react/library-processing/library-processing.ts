/* escanearyRecolectarDatos契约, 轮询节律y纯折算. 
 *
 * DatosGestionarpágina卡片, 常驻Tarea面y缺Vista previaSugerencia读同uno `queryKey`, 使用同unoTarearápido照. 
 * 轮询也由 Query 合成uno, Progreso, FalloyCompletadoEstado由服务端Unificado提供. 
 * 端点En `frontend/src` dentroSoloEnaquí声明uno次(`tests/test_frontend_build.py` 盯着).  */
import { apiGet } from '../../api';
import { elapsedText, progressText } from '../activity/tasks';
import { queryClient } from '../query';

export const LIBRARY_PROCESSING_URL = '/api/library-processing';

/** 卡片y常驻Tarea面共用esteunoClave.  */
export const LIBRARY_PROCESSING_KEY = ['library-processing'] as const;

/** Procesar过程en proceso记abajouno问题. `asset_id` Como空时说es媒体来源本身.  */
export interface LibraryProcessingIssue {
  asset_id: number | null;
  title?: string;
  path?: string;
  message: string;
  /** `paused` es来源限流没轮到esteuno项, etc.来源放开再跑就Con; `error` es它自己出事.  */
  severity?: 'info' | 'error' | 'paused';
}

/** uno趟escanearyRecolectarrápido照. 字段以 `q_library_processing`(`src/peach/web_library_processing.py`)Como准.  */
export interface LibraryProcessingData {
  metadata_only?: boolean;
  /** `idle` | `running` | `pausing` | `paused` | `complete` | `failed`.  */
  status: string;
  speed_mode?: ProcessingSpeed;
  eta_seconds_min?: number | null;
  eta_seconds_max?: number | null;
  eta_kind?: 'historical' | 'measured' | 'estimating';
  eta_scope?: string;
  eta_initial?: boolean;
  job_id?: string;
  stage?: string;
  requested_stage?: string;
  steps?: { id: string; label: string; status: 'pending' | 'current' | 'complete' }[];
  checked?: number;
  total?: number;
  scanned?: number;
  scanned_bytes?: number;
  identified?: number;
  candidates?: number;
  auto_applied?: number;
  covers?: number;
  previews?: number;
  /* 落Biblioteca之posterior补齐Actriz资料eseuno步cuatro读数: 别名, Avatar, 交回人工冲突, 没取到Avatar.  */
  performer_aliases?: number;
  performer_avatars?: number;
  performer_profile_conflicts?: number;
  performer_profile_failed?: number;
  error?: string;
  issue_count?: number;
  /** `issue_count` dentro卡En来源限流en laese些, etc.来源放开再跑uno次就Con.  */
  paused_count?: number;
  issue_preview?: LibraryProcessingIssue[];
  issues_log?: string;
  issues_truncated?: boolean;
  retryable_asset_ids?: number[];
  notes?: Record<string, number>;
  current_asset_id?: number | null;
  current_asset_name?: string;
  current_action?: string;
  current_started_at?: number;
  last_progress_at?: number;
  stalled?: boolean;
  waited_seconds?: number;
  completed_at?: number;
}

/** uno次写操作Por favor求体: 指定Procesar阶段y影片, 或者按Tarea号ReintentarFallo项.  */
export type ProcessingSpeed = 'low' | 'standard' | 'high';
export interface LibraryProcessingCommand {
  stage?: 'scan' | 'collect' | 'previews' | 'metadata';
  asset_ids?: number[];
  job_id?: string;
  retry?: number[];
  speed_mode?: ProcessingSpeed;
}
export type ProcessingControlCommand =
  | { action: 'pause' | 'resume'; job_id: string }
  | { action: 'set_speed'; speed_mode: ProcessingSpeed; job_id?: string };

/** Pausaren procesoTarea仍占用同unoProcesarRango, puedeContinuary持续读取Estado.  */
export const processingActive = (state?: LibraryProcessingData) =>
  !!state && ['running', 'pausing', 'paused'].includes(state.status);

/** Tiempo向分钟取Completo; 区间两端始终使用同uno单.  */
export function remainingTime(state: LibraryProcessingData): string {
  if (!processingActive(state)) return '';
  if (state.status === 'paused') return 'Pausado, ContinuarposteriorActualizar预估';
  if (state.status === 'pausing') return 'Pausando, Actual步骤TerminarposteriorPausar';
  if (state.stalled) return 'etc.PendienteActualArchivoRespuesta, DisponibleHoraPendienteActualizar';
  const low = state.eta_seconds_min, high = state.eta_seconds_max;
  if (low == null || high == null || !Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high < low)
    return 'Procesando估算DisponibleHora...';
  if (high < 60) return '预计DisponibleNo到 1 minuto(s)';
  const unit = high >= 86400 ? 86400 : high >= 3600 ? 3600 : 60;
  const label = unit === 86400 ? 'día(s)' : unit === 3600 ? 'hora(s)' : 'minuto(s)';
  const precision = unit === 60 ? 1 : 10;
  const start = Math.max(1 / precision, Math.floor(low / unit * precision) / precision);
  const end = Math.max(start, Math.ceil(high / unit * precision) / precision);
  const span = start === end ? `${end}` : `${start}–${end}`;
  const rough = state.eta_initial || state.eta_kind !== 'measured' ? '(estimado)' : '';
  return `预计DisponibleAprox. ${span} ${label}${rough}${state.eta_scope ? ` · ${state.eta_scope}` : ''}`;
}

export const fetchLibraryProcessing = (signal?: AbortSignal) =>
  apiGet<LibraryProcessingData>(LIBRARY_PROCESSING_URL, signal);

/** primero屏. en proceso止时 `fetchQuery`  `AbortError` 抛回挂载方, 它据此放弃esteuno次.  */
export async function prefetchLibraryProcessing(signal: AbortSignal): Promise<void> {
  await queryClient.fetchQuery({
    queryKey: LIBRARY_PROCESSING_KEY,
    queryFn: () => fetchLibraryProcessing(signal),
  });
}

/** En跑时候两秒问uno次,  y 别posteriorTarea同uno节律.  */
export const RUNNING_POLL_MS = 2000;
/** 闲着时也continuar着问: Tarea由posterior自己起, 两读者都要认出"现En跑起来".  */
export const IDLE_POLL_MS = 10_000;

/** 读Fallo时página面arribaDejaese句话. AnteriorDatosNo撤, Siguiente轮轮询自己会continuararriba.  */
export const DISCONNECTED_TEXT = 'ConectarEn proceso断, ProcesandopesadoNuevo读取ProcesarProgreso';

export function pollInterval(
  data: LibraryProcessingData | undefined, watching: boolean,
): number | false {
  if (processingActive(data)) return RUNNING_POLL_MS;
  return watching ? IDLE_POLL_MS : false;
}

const ACTION_LABELS: Record<string, string> = {
  scanning_files: 'EscanearArchivo',
  reading_local: 'Verificar配套Archivo',
  reading_local_cover: '读取配套Imágenes',
  querying_metadata: 'Consultaexterior título(s)Detalles',
  fetching_cover: 'Recolectar缺失Portada',
  generating_preview: 'Generar vista previa de video',
  writing_candidates: 'GuardarPendienteConfirmarDetalles',
};

/* 来源说"Sin"按Tipo报uno数, No进问题清单: 馆藏dentrogrande量Independiente资源 y 创作者Obras
   任何Directorio站都收No到, 它们Noes待办. Clavey `library_processing.MISS_MESSAGES` 同源.  */
const NOTE_LABELS: Record<string, string> = {
  querying_metadata: 'SinDetalles',
  fetching_cover: 'SinPortada',
};

export function notesLine(notes: Record<string, number>): string {
  const parts = Object.entries(notes)
    .filter(([key, count]) => NOTE_LABELS[key] && count > 0)
    .map(([key, count]) => `${NOTE_LABELS[key]} ${count.toLocaleString()}  título(s)`);
  return parts.length ? `exterior título(s)Fuente${parts.join(', ')}, 7 día(s)interiorNo再问. ` : '';
}

/** 此刻En做什么: 哪Archivo, 哪uno步, etc.más久.  */
export function currentLine(state: LibraryProcessingData): string {
  if (state.status === 'paused') return 'Pausado';
  if (state.status === 'pausing') return 'Pausando';
  const action = ACTION_LABELS[state.current_action || ''] || state.stage || 'Procesando';
  const waited = state.waited_seconds ? ` · Yaetc.Pendiente ${elapsedText(state.waited_seconds)}` : '';
  return state.current_asset_name
    ? `Actual:${state.current_asset_name} · ${action}${waited}`
    : action + waited;
}

/** ya知Total量显示实际Completado数; escanearDirectorio期间显示持续发现Archivo数.  */
export function processingLine(state: LibraryProcessingData): string {
  const count = state.total ? `${progressText(state.checked, state.total)} 项`
    : state.current_action === 'scanning_files' || state.stage === 'EscanearArchivo'
      ? `YaDescubrir ${(state.scanned || 0).toLocaleString()} Archivo` : '';
  return currentLine(state) + (count ? ` · ${count}` : '');
}

/** 折叠起来问题清单: uno句结论 + 逐明细 + 完CompletoRegistro地址. Sin问题时es `null`.  */
export interface IssueDetails {
  label: string;
  items: { key: string; label: string; href: string; note: string; hint: string }[];
  /** 完CompletoRegistro本机Ruta, Original样uno串: anterior缀文字 y Abrir它eseClave归página面, esedentro才知道摆En哪.  */
  log: string;
}

export function issueDetails(state: LibraryProcessingData): IssueDetails | null {
  const issues = state.issue_preview || [];
  if (!issues.length) return null;
  return {
    label: state.issues_truncated
      ? `Problema清单: 共 ${state.issue_count || 0} 项, Expandirveranterior ${issues.length} 项`
      : `Problema清单: 共 ${state.issue_count || 0} 项`,
    items: issues.map((issue, at) => ({
      key: `${issue.asset_id ?? 'source'}-${at}`,
      label: issue.title || (issue.asset_id ? `Videos ${issue.asset_id}` : 'Fuente de medios'),
      href: issue.asset_id ? `/assets/${issue.asset_id}` : '',
      note: issue.message,
      hint: issue.path || '',
    })),
    log: state.issues_log || '',
  };
}

/* Completado用通知报uno次. 常驻Tarea面 y DatosGestionarpágina卡片veres同unoTarea, 谁先ver到Terminar谁报, 
   另uno处按Tarea号认出来就No再报. primero次引导添加Archivocarpetaposterioreseuno趟常En跳到Directoriopágina之anterior就跑完
   (unoArchivouno秒), Tarea面从没见过"运行en proceso", 所以刚TerminarTareaNo.uno次读到时也报.  */
const ANNOUNCED_KEY = 'peach.library-processing.announced';
const FRESH_COMPLETION_SECONDS = 120;

export function freshProcessingResult(state: LibraryProcessingData): boolean {
  const age = state.completed_at == null ? Infinity : Date.now() / 1000 - state.completed_at;
  return !!state.job_id && age >= 0 && age < FRESH_COMPLETION_SECONDS;
}

export function announceCompletion(
  state: LibraryProcessingData, toast: (message: string) => void, witnessed: boolean,
): void {
  if (state.status !== 'complete') return;
  if (!witnessed && !freshProcessingResult(state)) return;
  try {
    if (state.job_id && localStorage.getItem(ANNOUNCED_KEY) === state.job_id) return;
    if (state.job_id) localStorage.setItem(ANNOUNCED_KEY, state.job_id);
  } catch { /* 存储Nopuede用时照常Sugerencia, 最másRepetiruno次 */ }
  if (state.requested_stage === 'previews') {
    toast(`Vista previa de videoYa生成: ${state.previews || 0}  título(s)`);
    return;
  }
  toast(`EscanearyDetallesRecolectarCompletado: Reconocer ${state.identified || 0} Código JAV, `
    + `Organizar ${state.candidates || 0} GrupoDetallesResultado, AutomáticoGuardar ${state.auto_applied || 0} Resultado`
    + (state.previews ? `, 生成 ${state.previews}  título(s)Vista previa de video` : ''));
}
