/* Detalles类HistorialEntradaFondo(ADR-0031"覆盖路由"): ObrasDetalles, cuatroColay关注Detalles压Enunopáginaarriba面, 
 * 它们HistorialEntradaEn `usr` dentro记abajo压En哪unopáginaarriba(`backgroundLocation`), Entrada自己说得清Fondo. 
 *
 * 写: 壳En决定AbrirDetalleseseuno刻调 `holdOverlayBackground` 记abajoFondo, push Detalles地址时用 `overlayState` 带arriba; 
 * Cola地址要etc.取完数才 push, Fondo仍es决定eseuno刻, Noes push eseuno刻地址. Detalles之间换沿用Anterior
 * Fondo, No嵌套; Solo存RutayConsulta串, No存 DOM, 对象或Entrada `key`(Actualizarposterior对Noarriba任何活Entrada). 
 *
 * 读: posterior退anterior进落到DetallesEntradaarriba时, 路由树覆盖元素(`react/router/pages/overlay.tsx`)调 `adoptOverlayState`
 * continuararribaesteuno记Fondo, 壳AbrirDetalleseseuno处再用 `takeOverlayReturn` 取来处, 关掉回到eseunopágina. 冷启动(Actualizar, 
 * NuevoEtiquetapágina, profundo链)No读: Entrada跨Actualizar仍带着 `usr`, abajo面esepágina却从没画过, página面组照SinFondo补画(`/assets/:id` 补画
 * DirectorioCuadrícula), 关掉回各自缺省来处.  */
import { matchPath } from 'react-router';
import { isPreferencePath } from './settings-route';

/** 覆盖Enpágina面en laese几地址. No进 `isRoutedPath`: página面宿主No画它们.  */
export const OVERLAY_PATHS = [
  '/assets/:id',
  '/posts/:id',
  '/works/:code',
] as const;

export type OverlayPath = typeof OVERLAY_PATHS[number];

export type OverlayKind = 'item' | 'follow' | 'jav';

/** uno覆盖地址要Abrireseuno: ObrasDetalles, 关注Detalles, 或cuatroColaen launo(`key` esSemilla或ReproducirLista).  */
export type OverlayTarget =
  | { kind: 'jav'; code: string }
  | { kind: 'item' | 'follow'; id: number }
  | { kind: 'queue'; queue: 'mix' | 'parts' | 'editions' | 'playlist'; key: number; item: number };

const QUEUES = ['mix', 'parts', 'editions', 'playlist'] as const;

/** 地址匹配哪uno覆盖Ruta; 本地Entrada使用数字, BibliotecaexteriorObras使用Con效Código JAV.  */
export function overlayMatch(pathname: string, search = ''): { path: OverlayPath; target: OverlayTarget } | null {
  const address = new URL(pathname, 'https://peach.invalid');
  pathname = address.pathname;
  search ||= address.search;
  for (const path of OVERLAY_PATHS) {
    const match = matchPath(path, pathname);
    if (!match) continue;
    if (path === '/works/:code') {
      const code = match.params.code || '';
      return /^[A-Za-z0-9_-]{2,64}$/.test(code) ? { path, target: { kind: 'jav', code } } : null;
    }
    const values = Object.values(match.params);
    if (!values.every((value) => /^\d+$/.test(value ?? ''))) return null;
    const first = Number(values[0]);
    if (!Number.isSafeInteger(first) || first <= 0) return null;
    if (path === '/assets/:id') {
      const params = new URLSearchParams(search);
      const contexts = QUEUES.filter(queue => params.has(queue));
      if (contexts.length === 1) {
        const queue = contexts[0]!, value = params.get(queue)!;
        const key = Number(value);
        if (/^[1-9]\d*$/.test(value) && Number.isSafeInteger(key)) {
          return { path, target: { kind: 'queue', queue, key, item: first } };
        }
      }
    }
    return { path, target: { kind: path === '/assets/:id' ? 'item' : 'follow', id: first } };
  }
  return null;
}

/** 地址要Abrireseuno覆盖; Ruta或身ParámetroSin效时es null.  */
export const overlayTarget = (pathname: string, search = ''): OverlayTarget | null => overlayMatch(pathname, search)?.target ?? null;

export interface BackgroundLocation {
  pathname: string;
  search: string;
}

/** DetallesEntrada `usr`: 压En哪unopáginaarriba, 压着es哪unoDetalles.  */
export interface OverlayState {
  backgroundLocation: BackgroundLocation;
  overlay: OverlayKind;
}

export const isOverlayPath = (pathname: string): boolean => (
  isPreferencePath(pathname.split(/[?#]/)[0]!) || OVERLAY_PATHS.some((pattern) => matchPath(pattern, pathname.split(/[?#]/)[0]!) !== null)
);

/** Entradadentro记Fondo: DetallesyColaEntrada `usr` dentroCon `{ backgroundLocation, overlay }`, 别EntradaSin.  */
export function backgroundOf(state: unknown): BackgroundLocation | null {
  const background = (state as { backgroundLocation?: Partial<BackgroundLocation> } | null)?.backgroundLocation;
  if (typeof background?.pathname !== 'string') return null;
  return { pathname: background.pathname, search: typeof background.search === 'string' ? background.search : '' };
}

let held: BackgroundLocation | null = null;
/* posterior退anterior进continuaren laeseuno来处, AbrirDetalles时取uno次就清: Solo给Entrada自己Abrireseunoabajo用, 换, 展开pequeño窗, 
 * 盘回来pesado开este些EnAbrir之posterior才发生动作照antiguo按壳记来处走.  */
let pendingReturn: string | null = null;

/** 决定AbrirDetalleseseuno刻: 当anteriorEnpágina面arriba就记abajoesteunopágina; ya经EnDetalles地址arriba(同Cola换, 关注组interior换, 
 * 从Detalles点开另uno)沿用ya记Fondo, Sin就No记, NoDetalles地址当Fondo.  */
export function holdOverlayBackground(): void {
  const { pathname, search } = window.location;
  if (!isOverlayPath(pathname)) held = { pathname, search };
}

/** 真正离开Detalles时清掉: 关掉Detalles, 删掉当anteriorEntrada, posterior退anterior进y启动.  */
export function clearOverlayBackground(): void {
  held = null;
  pendingReturn = null;
}

/** posterior退anterior进落到unoHistorialEntradaarriba: Entrada记Fondo就continuararriba, 之posterior从esteDetalles换, 展开pequeño窗照样带同unoFondo; 
 * AbrirDetalleseseuno处由 `takeOverlayReturn` 取它作来处. Entrada没记Fondo时什么都No做.  */
export function adoptOverlayState(state: unknown): void {
  const background = backgroundOf(state);
  if (!background) return;
  held = background;
  pendingReturn = background.pathname + background.search;
}

/** AbrirDetalles时取posterior退anterior进continuaren la来处(Ruta加Consulta串), 取uno次就清; Sin就es null, 壳用自己缺省.  */
export function takeOverlayReturn(): string | null {
  const path = pendingReturn;
  pendingReturn = null;
  return path;
}

/** push Detalles地址时带 `usr`; SinFondo就No带,  y página面Entradauno样.  */
export function overlayState(overlay: OverlayKind): OverlayState | undefined {
  return held ? { backgroundLocation: { ...held }, overlay } : undefined;
}
