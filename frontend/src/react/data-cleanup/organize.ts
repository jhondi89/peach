/* Organizar(ADR-0039)Datos契约: 媒体PredeterminadoDejaEnOriginalDirectorio, esteunoes唯uno会动Archivo名 y Directorio入口. 
 * 两模板, uno次Vista previa, uno次执行, exterior加Anterior批Original样退回去. 
 *
 * `/api/organize` uno次回Completo卡片要东西: Tarearápido照摊En顶层, 旁边espuede选来源, 存着模板, 
 * 预设y占符Descripción. 所以posteriorTareaeseuno格要 `jobOf`/`withJob`: Nuevorápido照Solo换Tareaese几字段, 
 * 来源y模板Original样Deja着. 执行yRevertires真实 ledger 写入, 调用方必须先过Confirmar弹层.  */
import { apiGet, apiSend } from '../../api';
import { queryClient } from '../query';
/* 模板跟着DatosBiblioteca走(`SYNCED_SETTING_KEYS` en la `organizeTemplates`), 写esConfiguración面板同uno端点.  */
import { SETTINGS_URL } from '../settings-panel/settings-data';

export const ORGANIZE_URL = '/api/organize';
export const ORGANIZE_PREVIEW_URL = '/api/organize/preview';
export const ORGANIZE_APPLY_URL = '/api/organize/apply';
export const ORGANIZE_ROLLBACK_URL = '/api/organize/rollback';

export const ORGANIZE_KEY = ['organize'] as const;

export interface OrganizeTemplate { file: string; dir: string }

export interface OrganizeJob {
  status: 'idle' | 'running' | 'complete' | 'failed';
  job_id?: string;
  stage?: string;
  message?: string;
  checked?: number;
  total?: number;
  /** 执行eseuno趟落读数. Revertireseuno趟Sin `moved`, Con `restored`.  */
  moved?: number;
  restored?: number;
  failed?: number;
  error?: string;
}

export interface OrganizeData extends OrganizeJob {
  locations: { location: string; roots: string[] }[];
  templates: Record<string, OrganizeTemplate>;
  presets: ({ label: string } & OrganizeTemplate)[];
  placeholders: { key: string; label: string }[];
  last_batch: string;
}

export interface OrganizePlanRow { current_path: string; target_path: string; action: string }

export interface OrganizePlan {
  counts: { change?: number; unchanged?: number; [key: string]: number | undefined };
  reasons: Record<string, number>;
  rows: OrganizePlanRow[];
  truncated: boolean;
  plan_csv?: string;
}

/** esteuno次要Organizar什么: 来源y两模板.  */
export interface OrganizeRequest { location: string; file_template: string; dir_template: string }

/** 执行还esRevertir. 两都起同unoposteriorTarea, Resultado落En同uno格dentro.  */
export type OrganizeCommand = { kind: 'apply'; request: OrganizeRequest } | { kind: 'rollback' };

export const fetchOrganize = (signal?: AbortSignal) => apiGet<OrganizeData>(ORGANIZE_URL, signal);

export async function prefetchOrganize(signal: AbortSignal): Promise<void> {
  await queryClient.fetchQuery({ queryKey: ORGANIZE_KEY, queryFn: () => fetchOrganize(signal) });
}

export const previewOrganize = (request: OrganizeRequest) =>
  apiSend<OrganizePlan>(ORGANIZE_PREVIEW_URL, request);

export const startOrganize = (command: OrganizeCommand) => command.kind === 'apply'
  ? apiSend<OrganizeJob>(ORGANIZE_APPLY_URL, { ...command.request, confirm: true })
  : apiSend<OrganizeJob>(ORGANIZE_ROLLBACK_URL, { confirm: true });

/** Confirmar执行eseuno刻存abajo模板: abajo次进esteunopáginaver到es自己Última vez执行用ese两行, 而Noes又uno次
 *  空框. Vista previaNo存, 试过又放弃模板No会顶掉Anterior次. 存No进去No该挡住ya经起跑Organizar, 所以FalloNo报.  */
export async function rememberTemplates(templates: Record<string, OrganizeTemplate>): Promise<void> {
  queryClient.setQueryData<OrganizeData>(ORGANIZE_KEY, (data) => (data ? { ...data, templates } : data));
  try {
    await apiSend(SETTINGS_URL, { organizeTemplates: templates });
  } catch {
    /* Solo读端: 模板SoloDejaEnesteuno次缓存dentro.  */
  }
}

/** Tarearápido照换进Completo卡片: Solo换Tareaese几格, 来源, 模板, Anterior批Original样Deja着.  */
export const withOrganizeJob = (data: OrganizeData | undefined, job: OrganizeJob) =>
  (data ? { ...data, ...job } : data);

/** 模板No合法时Error出En两框en launo: 除说Original因, 还要指出es哪uno格.  */
export const DIRECTORY_TEMPLATE_ERROR = /Directorio模板|分隔符|盘符|`\.`/;

/** Ruta最posterioruno段. Vista previaSolo列Archivo名, 完CompletoRuta放EnPasar el ratónSugerenciadentro.  */
export function baseName(path: string): string {
  const text = String(path || '');
  return text.slice(Math.max(text.lastIndexOf('\\'), text.lastIndexOf('/')) + 1);
}

const count = (value: number | undefined) => Number(value || 0).toLocaleString();

/** Vista previaResultadoeseuno句. Solo列会变行: Bibliotecadentro几10 mil行dentro改No到ese部分esFondo, NoesResultado.  */
export function planSummary(plan: OrganizePlan): string {
  const skipped = Object.entries(plan.reasons || {}).sort((a, b) => b[1] - a[1])
    .map(([reason, value]) => `${reason} ${count(value)}`).join(' · ');
  if (!Number(plan.counts?.change || 0)) return `Sin要改Archivo. ${skipped ? `Omitir: ${skipped}. ` : ''}`;
  return `${count(plan.counts.change)} Archivo会改名或Mover, ${count(plan.counts.unchanged)} Ya经就Sí目标Nombre`
    + `${skipped ? `; Omitir ${skipped}` : ''}. `;
}

/** 跑完eseuno趟怎么说. Revertireseuno趟Con `restored`.  */
export function organizeOutcome(job: OrganizeJob): { text: string; failed: number; rollback: boolean } {
  const rollback = job.restored !== undefined;
  const failed = Number(job.failed || 0);
  const done = Number(rollback ? job.restored : job.moved || 0);
  const text = rollback
    ? `Ya退回 ${count(done)} Archivo${failed ? `, ${count(failed)} 行No能退回` : ''}. `
    : `YaOrganizar ${count(done)} Archivo${failed ? `, ${count(failed)} 行No能Procesar` : ''}. `;
  return { text, failed, rollback };
}
