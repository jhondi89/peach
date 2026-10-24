/* 舞岛对壳契约: 壳Solo拿命令入口, 舞, 两座Detalles, ReproducirDispositivoypequeño窗都En `peach-app.js` dentro.  */
import type { PlayerItem, PlayerResume } from '../../player';
import type { FollowDetailActions, FollowDetailProps } from '../follow-detail/follow-detail';
import type { ItemDetailActions, ItemDetailProps } from '../item-detail/item-detail';
import type { StagePlayerHost } from './stage-player';
import type { JavDetailProps } from '../jav-detail/jav-detail';

export type StageHost = StagePlayerHost;

/** AbrirObrasDetalles. 动作dentroSin `mountPlayer`: 媒体框交给舞自己ReproducirDispositivo.  */
export interface StageItemRequest extends Omit<ItemDetailProps, 'actions'> {
  kind: 'item';
  actions: Omit<ItemDetailActions, 'mountPlayer'>;
  /** profundo链带 `?t=` 进来: No.uno次挂arribaesteuno时从esteuno刻continuar着放.  */
  resume?: PlayerResume | null;
}

export interface StageFollowRequest extends Omit<FollowDetailProps, 'actions'> {
  kind: 'follow';
  actions: Omit<FollowDetailActions, 'mountPlayer'>;
  resume?: PlayerResume | null;
}

export interface StageJavRequest extends JavDetailProps { kind: 'jav'; id?: never; resume?: never }
export type StageRequest = StageItemRequest | StageFollowRequest | StageJavRequest;

/** 开着Detallesarriba会变ese几样: Seleccionar态y版推给"Continuar viendo"eseuno排.  */
export type StagePatch = Partial<Pick<ItemDetailProps, 'layout' | 'selectMode' | 'selected' | 'seekSeconds' | 'relatedLimit'>>;

export interface StageApi {
  /** ReproducirMuro媒体宿主. 收起posteriorpuede交给pequeño窗, Detallespuede认领同uno实例.  */
  mountWallPlayer(item: PlayerItem, frame: HTMLElement, signal: AbortSignal): Promise<(continuePlaying?: boolean) => void>;
  /** AbrirunoDetalles: 先画骨架, `showModal()`, 取完数再换成contenido. pequeño窗放着正esesteuno时, contenido
   *  画出来eseuno刻同unoReproducirDispositivo搬回来. 浮窗开着同unoDetalles时Nopesado开, 取完数Original地换contenido.  */
  open(request: StageRequest): Promise<void>;
  update(patch: StagePatch): void;
  /** 退场动画; 拆舞之anterioretc.它演完.  */
  exit(): Promise<void>;
  /** 拆掉舞. `miniplayer` Como假时En curso放视频No进pequeño窗(显Cerrar, 换Detalles, 删掉当anteriorEntrada).  */
  dispose(options?: { miniplayer?: boolean }): void;
  isOpen(): boolean;
  /** 浮窗此刻开着, 能Original地换eseunoDetalles; 没开, En退场或ya要求Cerrar时Como空. 壳据此决定换anterior拆No拆舞.  */
  showing(): StageRequest['kind'] | null;
  /** CerrarClave, Escape y点浮窗exterior面走eseuno: 交给当anteriorDetalles自己 `close`, 退场期间再要uno次NoRepetir.  */
  requestClose(): void;
  /** 该RespuestaReproducirrápido捷Clave video: 舞开着取舞en la, 否则取pequeño窗en la.  */
  activeVideo(): HTMLVideoElement | null;
  toggleTheater(): void;
  /** i Clave: Detallesdentro进pequeño窗, pequeño窗dentro展开回Detalles.  */
  toggleMiniplayer(): void;
  closeMiniplayer(): void;
  miniplayerActive(): boolean;
  miniplayerTakesCard(item: PlayerItem | null | undefined): boolean;
  miniplayerPlay(id: number): void;
  /** Portada predeterminada换: 开着ObrasDetalles海报跟着换.  */
  repaintPoster(): void;
}
