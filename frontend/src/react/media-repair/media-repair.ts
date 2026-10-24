/* 媒体修复Datos层: Tarearápido照ypuede选媒体Biblioteca, 两都进共用 Query 缓存. 
 *
 * uno轮要跑几diez分钟到几pequeño时, 跑到哪uno步由服务自己记, página面关掉再回来照样continuar得arriba. 
 * primero屏两uno起取, 卡片挂arriba去直continuar读缓存.  */
import { apiGet } from '../../api';
import { queryClient } from '../query';

export const MEDIA_REPAIR_URL = '/api/media-repair';
export const MEDIA_REPAIR_KEY = ['media-repair'] as const;
export const REPAIR_LIBRARIES_KEY = ['media-repair', 'libraries'] as const;

export interface MediaRepairState {
  status: string;
  library: string;
  stage: string;
  checked: number;
  total: number;
  found: number;
  repaired: number;
  failed: number;
  missing_tool: number;
  skipped: number;
  message: string;
  error?: string;
}

export interface RepairLibrary {
  id: string;
  name: string;
  /** 媒体BibliotecaImagen标: 来源名(`115`, `pikpak`, `local`)或雪碧Imagen字形名, y侧栏媒体BibliotecaCambiarDispositivo同uno.  */
  icon: string;
  metered: boolean;
}

export const IDLE_REPAIR: MediaRepairState = {
  status: 'idle', library: '', stage: '', checked: 0, total: 0, found: 0,
  repaired: 0, failed: 0, missing_tool: 0, skipped: 0, message: '',
};

export const fetchMediaRepair = (signal?: AbortSignal) => apiGet<MediaRepairState>(MEDIA_REPAIR_URL, signal);

export const fetchRepairLibraries = async (signal?: AbortSignal) =>
  (await apiGet<{ libraries?: RepairLibrary[] }>('/api/libraries', signal)).libraries || [];

export async function prefetchMediaRepair(signal: AbortSignal): Promise<void> {
  await Promise.all([
    queryClient.fetchQuery({ queryKey: MEDIA_REPAIR_KEY, queryFn: () => fetchMediaRepair(signal) }),
    queryClient.fetchQuery({ queryKey: REPAIR_LIBRARIES_KEY, queryFn: () => fetchRepairLibraries(signal) }),
  ]);
}

const count = (value: number) => Number(value).toLocaleString();

/** uno句话说清此刻En干什么: escanear报Progreso, 修复报Progreso加当anterioreste部片.  */
export function statusLine(state: MediaRepairState): string {
  if (state.status === 'running') {
    // 服务端偶尔报出超过Total数ya查数, 按Total数封顶. 
    const where = state.total ? `${count(Math.min(state.checked || 0, state.total))} / ${count(state.total)}` : '准备En proceso';
    return state.stage === 'Reparar' && state.message
      ? `Reparar ${where} · ${state.message}`
      : `${state.stage || 'Escanear'} ${where}`;
  }
  if (state.status === 'complete' && (state.repaired || state.failed)) {
    return state.failed
      ? `修bien ${count(state.repaired)}  título(s), ${count(state.failed)}  título(s)修No`
      : `修bien ${count(state.repaired)}  título(s)`;
  }
  return '';
}

export const missingToolText = (state: MediaRepairState) =>
  `${count(state.missing_tool)}  título(s)缺Indexar片子要装arriba untrunc 才修得, Descargas入口EnConfiguraciónpágina"Información de ejecución"dentro. `;
