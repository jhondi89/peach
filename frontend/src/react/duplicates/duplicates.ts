/* RepetirArchivoDatos契约y折算. 
 *
 * 判据es"同Código JAV + Duración相近 + 分卷Etiquetauno致", Noes同Código JAV即Repetir—合集, 分卷 y 混入广告
 * 都会共用uno code, Solo按Código JAV做"保Deja最grande"会删掉contenido. 服务端ya经按este判完, anterior端Solo挑
 * 每组Deja谁. 批量uno律走 `dispose` 进回收站, puede逆; 永久Eliminar仍Solo能从回收站单独执行. 
 *
 * DatosGestionarpáginaese"RepetirArchivo"卡片读es同uno真相 `total`/`files`/`reclaimable`, 
 * 所以它continuarabajo面este `DUPLICATES_KEY`, No另发uno次 `?limit=1`: 服务端两 limit 都要Completo
 * 表扫uno遍分完组, 省abajoSoloes回程字节, 换来却es两处读数puede能对Noarriba.  */
import { apiGet, apiSend } from '../../api';
import { prefetchMediaSources } from '../media-sources';
import { queryClient } from '../query';

/** 120 组够铺满esteunopágina, 再más由"puede回收"Ordenar挤到posterior面.  */
export const DUPLICATES_URL = '/api/duplicates?limit=120';
/** CompletopáginayDatosGestionarpáginaese卡片共用esteunoClave.  */
export const DUPLICATES_KEY = ['duplicates'] as const;
/** 批量改判. 单次arriba限 200, 超过分批发.  */
export const BATCH_URL = '/api/batch';
export const BATCH_LIMIT = 200;

/** `/api/duplicates` en launoArchivo. 字段y `web_batch.q_duplicates` 对齐.  */
export interface DuplicateFile {
  id: number;
  name: string;
  path: string | null;
  location: string;
  drive: string;
  size: number | null;
  duration: number | null;
  is_largest: boolean;
  is_longest: boolean;
}

export interface DuplicateGroup {
  code: string;
  files: DuplicateFile[];
  count: number;
  /** 每Archivo都Con sha1 且完Todo相同才算确证字节uno致.  */
  identical: boolean;
  /** `same_code_short_copy` es同Código JAVSiguiente明显cortouno截副本.  */
  evidence?: string;
  drives: string[];
  cross_drive: boolean;
  reclaimable: number;
}

export interface DuplicatesData {
  total: number;
  files: number;
  reclaimable: number;
  groups: DuplicateGroup[];
  has_more?: boolean;
}

export const fetchDuplicates = (signal?: AbortSignal) =>
  apiGet<DuplicatesData>(DUPLICATES_URL, signal);

/* 名字之间En哪dentroDesconectar算uno词: 空格, 连字符, abajo划线, 点, 括号yRuta分隔符.  */
const NAME_BREAK = /[\s\-_.()[\][]/\\]/;

/** uno组副本共Con开头, 退到最posterioruno断词处: 同uno部片子几常SoloEnen proceso段No同(分辨率, 
 *  转载站, 序号), Completo名en proceso段截断正bien唯uno差别切掉. 共Con段No足 8 字或SoloConuno时Como空.  */
export function sharedNamePrefix(names: readonly string[]): string {
  if (names.length < 2) return '';
  let end = 0;
  const first = names[0]!;
  while (end < first.length && names.every((name) => name[end] === first[end])) end += 1;
  // 共Con段uno直到某uno名字结尾时, ese名字Completo都es共Con段, 退uno格Deja出能显示部分. 
  if (names.some((name) => name.length <= end)) end = Math.max(0, end - 1);
  let cut = end;
  while (cut > 0 && !NAME_BREAK.test(first[cut - 1]!)) cut -= 1;
  return cut >= 8 ? first.slice(0, cut) : '';
}

/** 组interior显示名字: 去掉组dentro共Con开头, 用"..."顶替; 组头ya经写着Código JAV.  */
export const distinctName = (name: string, prefix: string) =>
  prefix && name.startsWith(prefix) && name.length > prefix.length ? `...${name.slice(prefix.length)}` : name;

/** primero屏: RepetirAgrupary配根Directorio网盘("Deja 115"ese几Clave要它), 取完才画. No给 `staleTime`, 
 *  `/duplicates` es `refresh:'reopen'`, 进来就pesado取.  */
export async function prefetchDuplicates(signal: AbortSignal): Promise<void> {
  await Promise.all([
    queryClient.fetchQuery({ queryKey: DUPLICATES_KEY, queryFn: () => fetchDuplicates(signal) }),
    prefetchMediaSources(signal),
  ]);
}

/** 每组保Deja哪uno口径. `all` esunoNoDeja—Completo组都es广告时才用得arriba. 其余es网盘代号.  */
export type KeepRule = 'largest' | 'longest' | 'all' | (string & {});

/** Confirmar弹层dentro"每组保Deja......"esemedio句.  */
export const KEEP_LABELS: Record<string, string> = {
  largest: 'Más grandeuno', longest: 'El más largouno',
  '115': '115 (dejar máximo si no hay)', pikpak: 'PikPak (dejar máximo si no hay)', all: 'ceroArchivo',
};

/** esteuno批Archivodentro真正出现过网盘来源.  */
export const cloudPreferenceLocations = (
  files: readonly { location: string }[], configured: readonly string[],
) => configured.filter((location) => files.some((file) => file.location === location));

/** "Deja 115"SoloEnesteuno组既Con 115 又Con别处Archivo时出现: Completo组都En同uno网盘, Deja它 y Deja最grande
 *  es同unoResultado, másunoClaveSoloesmásuno要读Opciones.  */
export const mixedCloudPreferences = (
  files: readonly { location: string }[], configured: readonly string[],
) => cloudPreferenceLocations(files, configured)
  .filter((location) => files.some((file) => file.location !== location));

/** 批量arriba给哪几"Todo优先": 至menosConuno组值得este么挑.  */
export const bulkCloudPreferences = (groups: readonly DuplicateGroup[], configured: readonly string[]) =>
  configured.filter((location) => groups.some((group) => mixedCloudPreferences(group.files, [location]).length));

/** 每组SoloDejauno, 其余进回收站; 返回要回收 id. 
 *
 *  指名网盘时先Enese来源dentro挑最grande, esedentroSin就退回Todo组dentro最grandeese: 口径写En弹层arriba
 *  ("115(Sin则Deja最grande)"), 换写法就对Noarriba用户刚刚读到ese句话.  */
export function duplicateVictims(groups: readonly DuplicateGroup[], keep: KeepRule): number[] {
  const ids: number[] = [];
  for (const group of groups) {
    if (keep === 'all') {
      for (const file of group.files) ids.push(file.id);
      continue;
    }
    let keeper: DuplicateFile | undefined;
    if (keep === 'largest' || keep === 'longest') {
      const flag = keep === 'longest' ? 'is_longest' : 'is_largest';
      keeper = group.files.find((file) => file[flag]) ?? group.files[0];
    } else {
      const preferred = group.files.filter((file) => file.location === keep);
      const pool = preferred.length ? preferred : group.files;
      keeper = pool.reduce((best, file) => ((file.size || 0) > (best.size || 0) ? file : best), pool[0]!);
    }
    for (const file of group.files) if (file.id !== keeper?.id) ids.push(file.id);
  }
  return ids;
}

/** esteuno批被回收Archivouno共másmenos字节. Confirmar弹层要点名este数.  */
export function victimBytes(groups: readonly DuplicateGroup[], ids: readonly number[]): number {
  const victims = new Set(ids);
  return groups.reduce((total, group) => total + group.files.reduce(
    (sum, file) => sum + (victims.has(file.id) ? file.size || 0 : 0), 0), 0);
}

/** 批量改判. uno次最más 200 , 分批串行发: y发发出去Soloes让服务端自己排队.  */
export async function batchOperate(ids: readonly number[], operation: 'dispose' | 'restore'): Promise<void> {
  for (let offset = 0; offset < ids.length; offset += BATCH_LIMIT) {
    await apiSend(BATCH_URL, { ids: ids.slice(offset, offset + BATCH_LIMIT), operation,
      ...(operation === 'dispose' ? { disposal_reason: 'duplicate' } : {}) });
  }
}

/** página头Descripción行y汇Totaleseuno句.  */
export const duplicatesLede = (data: DuplicatesData, formatSize: (bytes: number) => string) =>
  `${data.total} Grupo · ${data.files} Archivo · puede回收 ${formatSize(data.reclaimable)}`;
