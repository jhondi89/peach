/* Tareaen proceso心Datos契约y折算: `/api/tasks` uno次Por favor求供Completopáginatres段使用. 
 *
 * 分tres次取会出现"En跑ese段esNuevo, Completadoese段esantiguo"este自相矛盾uno屏, 所以SoloConuno
 * queryKey. primero屏由 `prefetchTasks` 写进 Query 缓存, 组件挂arriba去读就es它.  */
import { apiGet } from '../../api';
import { queryClient } from '../query';

export const TASKS_URL = '/api/tasks';
/** Completopágina共用esteunoClave: tres段es同uno次Respuestatres字段.  */
export const TASKS_KEY = ['tasks'] as const;

export interface TaskRunPayload {
  id: number;
  task_key: string;
  task_label: string;
  trigger: string;
  status: string;
  host: string;
  started_at: string | null;
  finished_at: string | null;
  elapsed_seconds: number | null;
  progress_current: number | null;
  progress_total: number | null;
  progress_label: string;
  result_summary: Record<string, unknown>;
  error: string;
  /** 派出esteuno轮父Tarea; Noesposterior继时Como null(ADR-0040).  */
  parent_run_id: number | null;
  root_run_id: number | null;
  /** esteposterior继要做ese件事Todo名. Noesposterior继时es空串, 界面据此判断它挂No挂到父卡片abajo.  */
  followup_key: string;
  followup_depth: number;
}

export interface ActivityData {
  available: boolean;
  result_versions?: Record<string, string>;
  message?: string;
  running: TaskRunPayload[];
  skipped: TaskRunPayload[];
  finished: TaskRunPayload[];
  /** "RecienteCompletado"esteunopáginaposterior面还Con更早.  */
  finished_has_more?: boolean;
}

/** 往anterior翻unoPágina: SoloCon"RecienteCompletado", En跑y被挡abajo由轮询eseuno负责.  */
export interface FinishedPage {
  finished: TaskRunPayload[];
  finished_has_more: boolean;
}

/** 以 `oldest` Como游标取它之anteriorunopágina. 游标es它Terminar时刻加 id, y服务端OrdenarClaveuno致.  */
export const fetchEarlier = (oldest: TaskRunPayload, signal?: AbortSignal) => {
  const query = new URLSearchParams({
    before_finished_at: oldest.finished_at || '', before_id: String(oldest.id) });
  return apiGet<FinishedPage>(`${TASKS_URL}?${query}`, signal);
};

/** 几批终态行y成uno列: 同uno轮SoloDejauno, 按Terminar时刻从Nuevo到antiguo, 同uno时刻按 id 从grande到pequeño, 
 *   y 服务端翻páginaOrdenarClave同uno, 拼continuar处才No会乱序. 终态LlegarposteriorNo再变, Repetir哪uno都uno样.  */
export function mergeFinished(...batches: TaskRunPayload[][]): TaskRunPayload[] {
  const byId = new Map<number, TaskRunPayload>();
  for (const batch of batches) for (const row of batch) if (!byId.has(row.id)) byId.set(row.id, row);
  return [...byId.values()].sort((a, b) => {
    const left = a.finished_at || '', right = b.finished_at || '';
    if (left !== right) return left < right ? 1 : -1;
    return b.id - a.id;
  });
}

/** Con东西En跑就两秒uno次( y Progreso写Biblioteca节流同uno数), Todoes终态时diez秒uno次.  */
export const RUNNING_POLL_MS = 2000;
export const SETTLED_POLL_MS = 10000;
export const pollInterval = (data: ActivityData | undefined): number =>
  data?.running?.length ? RUNNING_POLL_MS : SETTLED_POLL_MS;

export const fetchTasks = (signal?: AbortSignal) => apiGet<ActivityData>(TASKS_URL, signal);

/** primero屏: 取完数才画. en proceso止时 `fetchQuery`  `AbortError` 抛回给挂载方, 它据此放弃esteuno次.  */
export async function prefetchTasks(signal: AbortSignal): Promise<void> {
  await queryClient.fetchQuery({ queryKey: TASKS_KEY, queryFn: () => fetchTasks(signal) });
}

export const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Manual', scheduled: 'Programado', startup: 'Iniciar', cli: 'Línea de comandos',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '排队En proceso', running: 'En progreso', succeeded: 'Completado',
  failed: 'Fallido', cancelled: 'YaCancelar', interrupted: 'Interrumpido',
};

/** Estadoen proceso文名. 表en laEstado集es封闭, 认No出来Solopuede能es表先改, ese就Original样显示.  */
export const statusLabel = (status: string): string => STATUS_LABELS[status] || status;

/* 摘要en laClave来自各域自己Estado字典, es英文标识; 能认出来翻成en proceso文, 认No出Original样
   显示—瞎猜unoen proceso文名比Deja着英文Clave更难查.  */
const SUMMARY_LABELS: Record<string, string> = {
  checked: 'Verificado', total: 'Total', scanned: 'YaEscanear', identified: 'YaReconocer',
  candidates: 'DetallesResultado', covers: 'Portada', changed: 'Ya改动', operation: 'Acción',
  ok: 'Obtener', miss: 'No disponible', kept: 'Conservar', planned: 'Planificado', done: 'YaProcesar', added: 'Nuevo',
  written: 'Ya写入', removed: 'YaQuitar', exit_code: 'Salir码', issue_count: 'Problema',
  followups: 'Enviar sucesor', followups_duplicate: 'YaEn排队', followups_truncated: '超arriba限No派',
  followups_depth_exceeded: '超profundo度No派', outcome: 'Resultado', name: '档案Nombre',
  matched: 'Galería命En proceso', size: 'Tamaño', source: 'Fuente', cover_network: 'Portada连NoarribaImágenesHost',
};

/** uno批Tarea按 `parent_run_id` 归到各自父Tareaabajo. Sin父ese些DejaEnexterior面.  */
export function groupFollowups(rows: TaskRunPayload[]): Map<number, TaskRunPayload[]> {
  const grouped = new Map<number, TaskRunPayload[]>();
  for (const row of rows) {
    if (!row.followup_key || row.parent_run_id == null) continue;
    const siblings = grouped.get(row.parent_run_id);
    if (siblings) siblings.push(row);
    else grouped.set(row.parent_run_id, [row]);
  }
  return grouped;
}

/** 连着几轮收成uno卡: `runs[0]` es最Nuevoeseuno轮.  */
export interface RunFold { run: TaskRunPayload; runs: TaskRunPayload[] }

/** "RecienteCompletado"按Tiempo顺序折叠: uno段连续例行轮次dentro, 同unoTareay成uno卡, 摆En它
 *  最Nuevoeseuno轮Ubicaciónarriba. 任何uno轮Noes例行(手动, Fallo, ConAgregar或派posterior继)都会截断esteuno段
 *  —折叠Solo收"按时跑, 什么也没发生"ese些, Con事eseuno轮必须单独ver得见.  */
export function foldRoutine(rows: TaskRunPayload[],
                            routine: (run: TaskRunPayload) => boolean): RunFold[] {
  const folds: RunFold[] = [];
  let open = new Map<string, RunFold>();
  for (const run of rows) {
    if (!routine(run)) {
      open = new Map();
      folds.push({ run, runs: [run] });
      continue;
    }
    const fold = open.get(run.task_key);
    if (fold) fold.runs.push(run);
    else {
      const started = { run, runs: [run] };
      open.set(run.task_key, started);
      folds.push(started);
    }
  }
  return folds;
}

/** 按时跑完, 什么也没发生uno轮: 定时触发, Éxito, SinAgregar也没派posterior继.  */
export const isRoutine = (run: TaskRunPayload) => run.trigger === 'scheduled'
  && run.status === 'succeeded' && !run.error
  && !(Number(run.result_summary?.added) > 0) && !(Number(run.result_summary?.followups) > 0);

export const isActive = (run: TaskRunPayload) => run.status === 'pending' || run.status === 'running';

/** posterior继eseuno行Descripción: 它En做哪uno件(Etiqueta去掉yTarea名Repetiranterior缀), 做到No.几项或Resultado如何. 
 *  Títuloya经esTarea名, aquí再写uno遍"取Nuevas obras资料: "读起来就es同uno句话说两次.  */
export function followupDetail(row: TaskRunPayload): string {
  const prefix = `${row.task_label}: `;
  const label = row.progress_label || '';
  const item = label.startsWith(prefix) ? label.slice(prefix.length) : label === row.task_label ? '' : label;
  const total = row.progress_total || 0;
  const tail = errorHeadline(row.error) || summaryText(row.result_summary)
    || (isActive(row) && total > 0 ? `${progressText(row.progress_current, total)} 项` : '');
  return [item, tail].filter(Boolean).join(' · ');
}

/** 秒数说成"几分几秒". 跑几pequeño时批Procesar也要uno眼读得出量级: 满 48 pequeño时按天说.  */
export function elapsedText(seconds: number | null | undefined): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return '';
  const whole = Math.floor(seconds);
  if (whole < 60) return `${whole} segundo(s)`;
  const minutes = Math.floor(whole / 60);
  if (minutes < 60) return `${minutes} 分 ${whole % 60} segundo(s)`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} hora(s) ${minutes % 60} 分`;
  return `${Math.floor(hours / 24).toLocaleString()} día(s) ${hours % 24} hora(s)`;
}

/** Progreso读数"ya做 / Total数": 服务端偶尔报出超过Total数ya做数, 按Total数封顶.  */
export function progressText(current: number | null | undefined, total: number | null | undefined): string {
  const all = Math.max(0, Number(total) || 0);
  const done = Math.min(all, Math.max(0, Number(current) || 0));
  return `${done.toLocaleString()} / ${all.toLocaleString()}`;
}

/** uno段报错EnListadentroSolo露eseuno行. Python traceback No.uno行永远es"Traceback (most recent call
 *  last):", DescripciónNo什么, 取最posterioruno行ExcepciónTipoy消息; 别取No.uno行No vacío.  */
export function errorHeadline(text: string | null | undefined): string {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return '';
  return /^Traceback \(most recent call last\)/.test(lines[0]!) ? lines[lines.length - 1]! : lines[0]!;
}

/** Tiempo戳说成本地"月-日 时:分". DatosBibliotecadentro存es UTC, 界面Anterior律按本机时区读.  */
export function momentText(stamp: string | null | undefined): string {
  if (!stamp) return '';
  const moment = new Date(stamp);
  if (Number.isNaN(moment.getTime())) return '';
  return moment.toLocaleString(undefined,
    { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* No进摘要Clave: "谁挡"ya经写EnErroreseuno句dentro; 其余es域Estado字典en la簿记—Estado, 
   起止Tiempo戳, Por favor求号 y Tarea号, 卡片Título, 徽章 y Tiempoeseuno行ya经说过, Original样摆出来Soloesuno串
   英文Clave y 纪元秒.  */
const SUMMARY_HIDDEN = new Set([
  'blocked_by', 'status', 'run_id', 'request_id', 'started_at', 'completed_at', 'finished_at',
]);

/** 摘要压成uno行. Solo取标量: 明细DejaEn各域自己página面 y Registrodentro.  */
export function summaryText(summary: Record<string, unknown>): string {
  return Object.entries(summary || {})
    .filter(([key, value]) => !SUMMARY_HIDDEN.has(key)
      && (typeof value === 'number' || typeof value === 'string')
      && String(value) !== '')
    .map(([key, value]) => `${SUMMARY_LABELS[key] || key} ${typeof value === 'number' ? value.toLocaleString() : value}`)
    .join(' · ');
}
