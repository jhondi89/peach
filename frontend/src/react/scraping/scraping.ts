/* 来源 y 凭证páginaDatos契约y折算. 几端点En `frontend/src` dentro都SoloEnaquí声明uno次
 * (`tests/test_frontend_build.py` 盯着). 
 *
 * 来源Configuración, PortadaTarea, amane 桥 y 自定义来源各自缓存; posteriorTarea按自己节律读取Estado, 
 * Nopesado取En cursoEditar来源Configuración.  */
import { apiGet } from '../../api';
import { queryClient } from '../query';
import { CUSTOM_SOURCES_KEY, fetchCustomSources } from './custom-source-data';

export const SCRAPING_URL = '/api/scraping';
export const SCRAPING_SETTINGS_URL = '/api/scraping/settings';
export const SCRAPING_CHECK_URL = '/api/scraping/check';
export const SCRAPING_COVER_URL = '/api/scraping/cover';
export const AMANE_BRIDGE_URL = '/api/scraping/amane-bridge';
export const AMANE_BRIDGE_CHECK_URL = '/api/scraping/amane-bridge/check';
export const AMANE_BRIDGE_REBUILD_URL = '/api/scraping/amane-bridge/rebuild';

/** 来源Lista共用esteunoClave.  */
export const SCRAPING_KEY = ['scraping'] as const;
/** 抓Portadaeseuno趟posteriorTareaEstado.  */
export const COVER_JOB_KEY = ['scraping', 'cover'] as const;
/** amane 桥事实ypesado建TareaEstado(`q_scraping_amane_bridge`).  */
export const AMANE_BRIDGE_KEY = ['scraping', 'amane-bridge'] as const;

/** unoRecolectar来源. 字段以 `q_scraping`(`src/peach/web_scraping.py`)Como准.  */
export interface Source {
  source: string;
  label: string;
  login: string;
  accepts_cookie: boolean;
  network: string;
  cookie_saved: boolean;
  /** este机Dispositivoarribaeste来源Por favor求由本机Explorar dispositivo发, Verificar由它自己过(ADR-0065); Como真时No需要 Cookie.  */
  browser: boolean;
  cooldown_until?: number | null;
}

export interface ScrapingData {
  sources: Source[];
}

/** uno次ConectarVerificaruno项Resultado: 来源página面, 以及部分来源另Conalto清Imagen片地址.  */
export interface Check {
  label: string;
  ok: boolean;
  status?: number;
  message?: string;
  width?: number;
  height?: number;
  reason?: string;
  elapsed_s?: number;
  checked_at?: number;
}

/** 抓PortadaposteriorTarearápido照(`scraping_cover_job`). `status` es `idle|running|complete|failed`.  */
export interface CoverJob {
  status: string;
  job_id?: string;
  result?: string;
  error?: string;
  width?: number;
  height?: number;
}

/** amane 桥ese卡(ADR-0043). `revision` es清单dentro钉 amane sha, `version` es锁dentroeseuno
 *  Versión号; `installed` es venv dentroConSin解释Dispositivo; `sites` es经桥开放给来源链站. `job` espesado建
 *  Tarearápido照, `status` 同 `CoverJob`.  */
export interface AmaneBridge {
  repository: string;
  license: string;
  revision: string;
  version: string;
  installed: boolean;
  installed_version: string;
  python: string;
  sites: { source: string; label: string }[];
  job: CoverJob;
}

/** Netscape Cookie Archivoarriba限. 再grandemásmedioNoes Cookie Archivo, 先拦住再说.  */
export const COOKIE_TEXT_LIMIT = 256 * 1024;

export const fetchSources = (signal?: AbortSignal) => apiGet<ScrapingData>(SCRAPING_URL, signal);
export const fetchCoverJob = (signal?: AbortSignal) => apiGet<CoverJob>(SCRAPING_COVER_URL, signal);
export const fetchAmaneBridge = (signal?: AbortSignal) => apiGet<AmaneBridge>(AMANE_BRIDGE_URL, signal);

/** primero屏来源yTarearápido照y发取回, 同uno缓存交给página面各分区. 
 *
 * 抓PortadaEstado也算primero屏—página面unoarriba来就得知道ConSinuno趟En curso跑, 才continuar得arriba它Progreso; amane 桥
 * ese卡同理, pesado建puede能En cursoposterior跑. en proceso止时 `fetchQuery`  `AbortError` 抛回给挂载方, 它据此
 * 放弃esteuno次.  */
export async function prefetchScraping(signal: AbortSignal): Promise<void> {
  await Promise.all([
    queryClient.fetchQuery({ queryKey: SCRAPING_KEY, queryFn: () => fetchSources(signal) }),
    queryClient.fetchQuery({ queryKey: COVER_JOB_KEY, queryFn: () => fetchCoverJob(signal) }),
    queryClient.fetchQuery({ queryKey: AMANE_BRIDGE_KEY, queryFn: () => fetchAmaneBridge(signal) }),
    queryClient.fetchQuery({ queryKey: CUSTOM_SOURCES_KEY, queryFn: () => fetchCustomSources(signal) }),
  ]);
}

/** unoVerificarResultado说成uno句话: 谁, 通No通, ImagenConmásgrande, 服务端complementar什么. 
 *
 * Resultadoen la `label` esesteuno跳查es什么; SoloConuno跳时它就es来源página面本身, 句子dentroNo必再说uno遍.  */
export function checkText(check: Check, sourceLabel: string): string {
  return `${sourceLabel}${check.label === 'Fuentepágina面' ? '' : ' HDImágenes'}`
    + `: ${check.ok ? 'puedeConectar' : 'No puede conectar'}`
    + (check.width ? ` · ${check.width} × ${check.height}` : '')
    + (check.elapsed_s !== undefined ? ` · ${check.elapsed_s.toFixed(2)} segundo(s)` : '')
    + (check.message ? `. ${check.message}` : '');
}
