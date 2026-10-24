/* 链continuarGestionarDatos契约. 
 *
 * exterior链es别人服务Dispositivoen la东西, 会En我们No知情时候烂掉—实测 719 dentro 152 打No开, 
 * 而它们En资料páginaarriba y bien链continuarlargo得uno模uno样, SoloCon点abajo去才知道. 所以Verificar要能随时pesado跑. 
 *
 * tres真相tresClave, 节律各No相同: 
 * - `['links']` esBibliotecadentro链continuar现状, 纯读Biblioteca, 随página面uno起Cargar, No轮询. 
 * - `['links','check']` esese趟联网VerificarEstado, `running` 时两秒问uno次. 
 * - `['links','prune']` esEliminarese趟Estado, 同样按 `running` 开关. 
 * 合成unoClave话, 每两秒uno轮轮询都会arriba面eseSolo读Estadísticaspesado画uno遍.  */
import { apiGet, apiSend } from '../../api';

export const LINKS_URL = '/api/links';
export const LINK_CHECK_URL = '/api/links/check';
export const LINK_PRUNE_URL = '/api/links/prune';

export const LINKS_KEY = ['links'] as const;
export const LINK_CHECK_KEY = ['links', 'check'] as const;
export const LINK_PRUNE_KEY = ['links', 'prune'] as const;

/** 链continuarTipoy界面en la名字. 
 *
 *  `官网 · Agencia` en la间隔点会 y "按Tipo"ese行分隔点撞Enuno起, 读出来es
 *  "社媒 373 · 官网 · Agencia 224"—分No清哪数字属于哪uno类, 所以用斜杠.  */
export const LINK_KINDS: Record<string, string> = {
  official: 'Sitio oficial/Agencia', social: 'Cuenta social',
  catalog: 'Sitio de información de obras', source_reference: 'Detalles出处',
};

export interface LinkStats {
  total: number;
  entities: number;
  by_kind: Record<string, number>;
  top_hosts: [string, number][];
}

/** uno被判出来链continuar. `note` es站点回ese句Resultado.  */
export interface LinkRow {
  id: number;
  entity: string;
  link_kind: string;
  label: string;
  url: string;
  note: string;
}

export interface LinkCheckState {
  status: 'idle' | 'running' | 'complete' | 'failed';
  check_id: string;
  checked: number;
  total: number;
  gone: LinkRow[];
  unclear: LinkRow[];
  /** `retry` esSolopesado验点名ese几.  */
  scope: string;
  error?: string;
}

export interface LinkPruneState {
  status: 'idle' | 'running' | 'complete' | 'failed';
  job_id?: string;
  checked?: number;
  total?: number;
  message?: string;
  removed?: number;
  /** ya隐退Actriz链continuarNo删, Deja作Nopuede点Registro.  */
  marked?: number;
  recovered?: number;
  error?: string;
}

/** este几写端点拒绝时回es 200 加 `ok:false`(清单过期, SinpuedeReintentar行), NoesError码.  */
async function accepted<T>(request: Promise<T & { ok?: boolean; error?: string }>): Promise<T> {
  const result = await request;
  if (result.ok === false) throw new Error(result.error || 'Operación no completada, Por favorReintentar');
  return result;
}

export const fetchLinkStats = (signal?: AbortSignal) => apiGet<LinkStats>(LINKS_URL, signal);

/** VerificarEstadoes POST 读: este端点同时负责启动, `status_only` 才esSolo问No启动.  */
export const fetchLinkCheck = (signal?: AbortSignal) =>
  apiSend<LinkCheckState>(LINK_CHECK_URL, { status_only: true }, 'POST', signal);

/** 起uno趟Verificar. 给 `retry` 就Solopesado验点名ese几, 别结论Original样Deja着: pesado跑Completo批要bien几分钟.  */
export const startLinkCheck = ({ retry, checkId }: { retry?: readonly number[]; checkId?: string }) =>
  accepted(apiSend<LinkCheckState>(LINK_CHECK_URL, retry
    ? { retry, check_id: checkId }
    : { restart: true }));

export const fetchLinkPrune = (signal?: AbortSignal) => apiGet<LinkPruneState>(LINK_PRUNE_URL, signal);

/** Eliminar判定ComoInválido链continuar. 服务端删anterior逐pesado验uno次, 所以esteuno趟走posteriorTarea; NopuedeDeshacer, 
 *  调用方必须先过Confirmar弹层.  */
export const startLinkPrune = ({ checkId, ids }: { checkId: string; ids?: number[] }) =>
  accepted(apiSend<LinkPruneState>(LINK_PRUNE_URL, { confirm: true, check_id: checkId, background: true, ...(ids ? { ids } : {}) }));

const count = (value: number | undefined) => Number(value || 0).toLocaleString();

/** 删完eseuno句.  */
export const pruneText = (state: LinkPruneState) =>
  `YaEliminar ${count(state.removed)} Resultado; ${state.marked ? `Ya隐退Actriz ${count(state.marked)} ResultadoDeja作Nopuede点Registro; ` : ''}`
  + `Conservar ${count(state.recovered)} ResultadoNoConfirmarInválido链continuar. `;

/** Verificar推进到哪儿. Total量还没算出来时Solo说En做什么.  */
export function checkLine(state: LinkCheckState): string {
  const retrying = state.scope === 'retry';
  if (!state.total) return retrying ? 'Procesandopesado验链continuar' : 'ProcesandoVerificar链continuar';
  return `${retrying ? 'Yapesado验' : 'Verificado'} ${count(state.checked)} / ${count(state.total)} Resultado链continuar`;
}
