/* 资源SincronizarDatos契约: 按馆藏Registro逐Encontrar本地磁盘y网盘en laArchivo(ADR-0080, ADR-0087). 
 *
 * uno次Verificar, uno次执行. Verificar逐来源报Archivoyaque no están en discoRegistro, 空Archivocarpetay读NoDirectorio, 另报Huérfano
 * 缓存; Archivoyaque no están en discoRegistro分两档: 带人Registro标Comoya消失, RegistroDeja着, 其余永久Eliminar(含回收站
 * en la). 执行Solo认este次Verificar候选, 逐复核posteriorProcesar两档, 再自底向arriba删空Archivocarpeta, 清Huérfano缓存. 
 *
 * 两趟posteriorTarea两Clave. escaneareseuno端点同时负责启动y读Estado(`status_only`), 执行eseuno
 * GET 读rápido照, POST 起Tarea; 两边都按 `running` 开关轮询, 闲着No问. 
 *
 * esteunoSoloEnCon来源配根Directorio时出现(`hasResourceRoots`), 所以两Estado跟着来源puede达性走: 
 * Con根Directorio才进primero屏预取, Sinesteuno机Dispositivoarriba, 进DatosGestionarpáginaNomás问两次.  */
import { apiGet, apiSend } from '../../api';
import { MEDIA_SOURCES_KEY, SCANNABLE_LOCATIONS, type MediaSourcesData } from '../media-sources';
import { queryClient } from '../query';

export const RESOURCE_SCAN_URL = '/api/resource-sync/scan';
export const RESOURCE_APPLY_URL = '/api/resource-sync/apply';

export const RESOURCE_SCAN_KEY = ['resource-sync', 'scan'] as const;
export const RESOURCE_APPLY_KEY = ['resource-sync', 'apply'] as const;

/** uno来源esteuno趟核对Resultado. 离线来源Omitir, Solo报馆藏dentroConmásmenos项.  */
export interface ResourceSource {
  location: string;
  online: boolean;
  total: number;
  missing: number;
  /** `missing` dentro带人Registro, 执行时标Comoya消失数.  */
  vanish?: number;
  empty: number;
  unreadable: number;
}

export interface ResourceScanState {
  status: 'idle' | 'running' | 'complete' | 'failed';
  scan_id: string;
  sources?: ResourceSource[];
  completed_sources?: number;
  total_sources?: number;
  missing?: number;
  /** `missing` 拆成两档: 永久Eliminar,  y 带人Registro, 标Comoya消失.  */
  purge?: number;
  vanish?: number;
  empty?: number;
  unreadable?: number;
  cache?: { files: number; bytes: number };
  /** esteuno轮ya经照着清过: 读数esLimpiaranterior, Resultado区改画Limpiar回执.  */
  applied?: boolean;
  error?: string;
}

/** 执行时复核发现Archivo其实还Enese几: 没删, 报名字yOriginal因.  */
export interface BlockedRecord { id: number; name: string; reason: string }

export interface ResourceApplyState {
  status: 'idle' | 'running' | 'complete' | 'failed';
  job_id?: string;
  message?: string;
  purged?: number;
  vanished?: number;
  /** 标ya消失, Bibliotecadentro唯uno对得arriba另unoVersión, Registro当场continuar过去ese几.  */
  reattached?: number;
  blocked?: BlockedRecord[];
  dirs_removed?: number;
  dir_errors?: number;
  cache_removed?: number;
  bytes_reclaimed?: number;
  cache_blocked?: string[];
  error?: string;
}

export const fetchResourceScan = (signal?: AbortSignal) =>
  apiSend<ResourceScanState>(RESOURCE_SCAN_URL, { background: true, status_only: true }, 'POST', signal);

export const startResourceScan = () =>
  apiSend<ResourceScanState>(RESOURCE_SCAN_URL, { background: true, restart: true });

export const fetchResourceApply = (signal?: AbortSignal) =>
  apiGet<ResourceApplyState>(RESOURCE_APPLY_URL, signal);

/** Procesareste次Verificar找出InválidoRegistro(永久Eliminar或标Comoya消失)y空Archivocarpeta, yLimpiar闲置缓存. 真实 ledger
 *  写入, 永久Eliminareseuno档NopuedeDeshacer, 调用方必须先过危险档Confirmar弹层.  */
export const startResourceApply = (scanId: string) =>
  apiSend<ResourceApplyState>(RESOURCE_APPLY_URL,
    { confirm: true, clean_cache: true, scan_id: scanId, background: true });

/** esteuno出No出现: Con落盘来源配根Directorio才Con东西puede对.  */
export const hasResourceRoots = (data: MediaSourcesData | undefined) =>
  (data?.sources ?? []).some((source) => SCANNABLE_LOCATIONS.includes(source.location)
    && Array.isArray(source.roots) && source.roots.length > 0);

/** primero屏: 来源puede达性落进缓存之posterior, Con根Directorio才取两TareaEstado, 取完才画. 直达地址
 *  `/resource-sync` 进来要滚到esteuno, Resultado区En滚动之posterior才continuaren la话, 落点就停En它arriba面uno屏.  */
export async function prefetchResourceSync(signal: AbortSignal): Promise<void> {
  if (!hasResourceRoots(queryClient.getQueryData<MediaSourcesData>(MEDIA_SOURCES_KEY))) return;
  await Promise.all([
    queryClient.fetchQuery({ queryKey: RESOURCE_SCAN_KEY, queryFn: () => fetchResourceScan(signal) }),
    queryClient.fetchQuery({ queryKey: RESOURCE_APPLY_KEY, queryFn: () => fetchResourceApply(signal) }),
  ]);
}

/** esteuno趟ConSin要清东西. 都Sin时底栏换成uno句"Sin待LimpiarRegistro, 空Archivocarpeta或缓存".  */
export const hasChanges = (scan: ResourceScanState | undefined) =>
  Boolean(scan?.missing || scan?.empty || scan?.cache?.files);

/** 来源代号Enesteunoen la名字. 认No出来源统称"媒体来源".  */
export { SOURCE_LABELS } from '../../core/media-sources';

const count = (value: number | undefined) => Number(value || 0).toLocaleString();

/** escanear推进到哪儿.  */
export const scanLine = (state: ResourceScanState) => (state.total_sources
  ? `YaEscanear ${state.completed_sources || 0}/${state.total_sources}  fuente(s)`
  : 'EscaneandoFuente');

/** 永久Eliminareseuno档数: `missing` 减去标Comoya消失.  */
export const purgeCount = (scan: ResourceScanState) =>
  scan.purge ?? Number(scan.missing || 0) - Number(scan.vanish || 0);

/** 标Comoya消失eseuno档eseuno句; Sinesteuno档时es空串.  */
const vanishText = (scan: ResourceScanState) => (scan.vanish
  ? `${count(scan.vanish)} Resultado带人Registro标ComoYa消失, RegistroDeja着, puedeEnRegistros huérfanosdentrocontinuar到Nuevo archivo或Eliminar permanentemente. `
  : '');

/** NopuedeDeshacereseuno句: Con标Comoya消失eseuno档时, Solo说Eliminareste几样.  */
const irreversible = (scan: ResourceScanState) => (scan.vanish ? 'este几样NopuedeDeshacer. ' : 'esteuno步NopuedeDeshacer. ');

/** Resultado面板dentroeseuno句Limpiarcontenido.  */
export const applyPlanText = (scan: ResourceScanState) =>
  `Eliminará permanentemente los ${count(purgeCount(scan))}  registro(s) y ${count(scan.empty)} Carpeta vacía, `
  + `yLimpiar ${count(scan.cache?.files)} 闲置Caché. ${irreversible(scan)}${vanishText(scan)}`;

/** Confirmar弹层正文: 比Resultado面板más说回收站en la也算, 来源根Directorio保Deja.  */
export const applyConfirmText = (scan: ResourceScanState) =>
  `Eliminará permanentemente los ${count(purgeCount(scan))}  registro(s)(incluyendo los de la papelera), ${count(scan.empty)} Carpeta vacía, `
  + `yLimpiar ${count(scan.cache?.files)} 闲置Caché. Directorio raízDirectorioConservar. ${irreversible(scan)}${vanishText(scan)}`;

/** uno来源ese读数卡脚注.  */
export const sourceMeta = (source: ResourceSource) => (source.online
  ? [`No encontradoArchivo · 共 ${count(source.total)} 项`,
    source.vanish ? `${count(source.vanish)} 项带人Registro` : '',
    source.empty ? `Carpeta vacía ${count(source.empty)} ` : '',
    source.unreadable ? `${count(source.unreadable)} Directorio读取Fallido, YaOmitir` : ''].filter(Boolean).join(' · ')
  : `ColecciónEn procesoCon ${count(source.total)} 项`);

/** 执行TerminarposteriorDejaEnOriginal地ese几样: Archivo其实还En, Directorioeste会儿读No, 缓存正被占用.  */
export function applyLeftovers(out: ResourceApplyState) {
  const blocked = out.blocked ?? [];
  const dirErrors = Number(out.dir_errors || 0);
  const cacheBlocked = out.cache_blocked ?? [];
  const done = Number(out.purged || 0) + Number(out.vanished || 0) + Number(out.reattached || 0)
    + Number(out.dirs_removed || 0) + Number(out.cache_removed || 0);
  const left = blocked.length + dirErrors + cacheBlocked.length;
  const names = blocked.slice(0, 3).map((item) => `"${item.name}"`).join(', ') + (blocked.length > 3 ? ' etc.' : '');
  const rest = [
    blocked.length ? `${count(blocked.length)}  registro(s)SinEliminar(${names})` : '',
    dirErrors ? `${count(dirErrors)} Carpetas no eliminadas` : '',
    cacheBlocked.length ? `${count(cacheBlocked.length)} CachéSinLimpiar` : '',
  ].filter(Boolean).join(', ');
  return { done, left, rest };
}

/** 执行Resultadoeseuno句. Con没Procesar几样时continuarEnposterior面, 说pesadoNuevoVerificarposteriorpuede再试.  */
export const applyText = (out: ResourceApplyState, formatSize: (bytes: number) => string) => {
  const { rest } = applyLeftovers(out);
  const summary = `Ya eliminado permanentemente ${count(out.purged)} registros inválidos y  ${count(out.dirs_removed)} Carpeta vacía, `
    + `Limpiar ${count(out.cache_removed)} Caché, 释放 ${formatSize(out.bytes_reclaimed || 0)}. `
    + (out.vanished ? `${count(out.vanished)} Resultado带人RegistroYa标ComoYa消失, puedeEnRegistros huérfanosdentroProcesar. ` : '')
    + (out.reattached ? `${count(out.reattached)} ResultadoRegistroYacontinuar到Bibliotecaen la另uno versión(es). ` : '');
  return rest ? `${summary}${rest}, Reverificarposteriorpuede再试. ` : summary;
};
