/* interior部常驻组件ypágina面Tipo契约. 
 * application-residents.ts y entry.tsx En主界面同uno源码Imageninterior组合este些Interfaz, NoPublicarIndependiente运行时桥包. 
 * ConfiguraciónDatos以 /api/configuration(src/peach/routes_configuration.py)Como准.  */
import type { QualityGoal } from './quality-goals/quality-goals';
import type { IndexProps } from './index/index-data';
import type { CatalogGridProps } from './catalog-grid/types';
import type { JunkQueueProps } from './junk-queue/junk-queue';
import type { EntityPageProps } from './entity-page/entity-page';
import type { FeedNewProps } from './feed-new/feed-new';
import type { CatalogFilterProps, CatalogView } from './catalog-filter/catalog-filter';
import type { SearchProps } from './search/search';
import type { FollowDetailProps } from './follow-detail/follow-detail';
import type { ItemDetailProps } from './item-detail/item-detail';
import type { StageApi, StageHost } from './stage/stage-api';
import type { SettingsPanelApi, SettingsPanelHost } from './settings-panel/settings-panel-api';
import type { ImmerseApi, ImmerseHost } from './immerse/immerse-api';
import type { SidebarApi, SidebarHost } from './sidebar/sidebar-api';
import type { ManageHeaderApi, ManageHeaderHost } from './manage-header/manage-header-api';
import type { BatchDockApi, BatchDockHost } from './batch-dock/batch-dock-api';
import type { GlowPickerHost } from './glow-picker/glow-picker-api';

export type { IndexProps };
export type { CatalogGridProps };
export type { JunkQueueProps };
export type { EntityPageProps };
export type { FeedNewProps };
export type { CatalogFilterProps, CatalogView };
export type { SearchProps };
export type { FollowDetailProps };
export type { ItemDetailProps };

export interface AccessState { mode: 'open' | 'password' | 'legacy' | 'locked'; revision: string }

export interface TunnelState {
  enabled: boolean;
  state: 'stopped' | 'starting' | 'running' | 'error';
  url: string;
  error: string;
  available: boolean;
  mode: 'quick' | 'named';
  /** 命名隧道绑定公开Anfitrión名, 临时链continuarModoabajoComo空.  */
  hostname: string;
  /** 隧道Token存没存过. Token本身No回传, página面Solo据此显示yaGuardar.  */
  token_set: boolean;
  /** este部署能No能用命名隧道; Independiente包Como false, eseunoCompletoNo渲染.  */
  named_available: boolean;
}

export interface AccessSettingsProps {
  initial: AccessState;
  receipt(message: string): void;
}

export interface StartupState {
  available: boolean; enabled: boolean; silent: boolean; message: string; desktop: boolean; desktop_message: string;
}

export interface UninstallState {
  available: boolean; full_available: boolean; message: string; data_root: string; directories: string[];
}

export interface PeachProxyState { mode: string; proxy_saved: boolean; needs_selection: boolean }

/** uno能换镜像域名exterior部入口站点. `host` Como空串就es没换过, 走 `default_host`.  */
export interface EntryLinkSite {
  key: string;
  label: string;
  host: string;
  default_host: string;
}

export interface EntryLinksState { sites: EntryLinkSite[] }

/** uno"CloudDrive2 en laRutaanterior缀 → 哪媒体根"对应.  */
export interface PushDiscoveryPrefix { prefix: string; root: string }

export interface PushDiscoveryQueue {
  pending: number; submitted: number; ingested: number; missing: number;
  dropped: number; timed_out: number; failed: number;
  last_path?: string; last_ingested_at?: number; last_error?: string;
}

export interface PushDiscoveryState {
  enabled: boolean;
  watch_local: boolean;
  cloud: boolean;
  prefixes: PushDiscoveryPrefix[];
  /** este机DispositivoesDatosBiblioteca写入端才Como真; Solo读端No起任何监听.  */
  available: boolean;
  secret: string;
  secret_set: boolean;
  endpoint: string;
  local_running: boolean;
  local_message: string;
  local_roots: string[];
  queue: PushDiscoveryQueue;
  /** puede选媒体根, anterior缀表en laabajo拉就从aquí取.  */
  media_roots: string[];
  /** CloudDrive2 该往哪地址推. 没开 TLS 或este机DispositivoNo知道自己地址时es空串.  */
  origin: string;
  /** Completo段抄进 CloudDrive2"Configuracióncontenido" TOML; 地址或Clave缺uno样就es空串.  */
  config_toml: string;
}

export interface AutomaticUpdateState {
  mode: string; interval_hours: number; available: boolean; download_available: boolean; error?: string;
}

/** 云Descargar两渠道: 115 经 CloudDrive2, PikPak 直连.  */
export type DownloadProviderKey = '115' | 'pikpak';

export interface DownloadConfig {
  clouddrive_address: string;
  targets: Partial<Record<DownloadProviderKey, string>>;
  /** PikPak 根Directorio对应DatosBibliotecaRutaanterior缀, 空串表示还没选.  */
  pikpak_root: string;
  wait_hours: number;
}

export type PikPakBrowserState = 'idle' | 'waiting' | 'done' | 'cancelled' | 'timeout' | 'failed';

/** Configuraciónpágina云Descargar. CredencialesSolo报存没存过, No回值.  */
export interface DownloadSettingsState {
  available: boolean;
  config: DownloadConfig;
  token_set: boolean;
  /** `method`: `browser` esExplorar dispositivoIniciar sesión取来网página端会话, `password` es账号Contraseña换Token.  */
  pikpak: { logged_in: boolean; username: string; remember: boolean; method: 'browser' | 'password' };
  /** Explorar dispositivoIniciar sesión(ADR-0093): este电脑ConSin Chrome 或 Edge, Iniciar sesión窗口此刻En哪uno步.  */
  pikpak_browser: { available: boolean; state: PikPakBrowserState; message: string };
  pikpak_roots: string[];
  providers: { key: DownloadProviderKey; label: string }[];
  max_wait_hours: number;
}

/** "GuardarConfiguración"Respuesta: Configuración加uno按yaGuardarConfiguración做VerificarInforme, SinToken时Como null.  */
export interface DownloadSaveResult extends DownloadSettingsState {
  report?: DownloadCheckReport | null;
}

/** VerificarResultado: 每uno项各自报, uno项FalloNo挡住其余几项.  */
export interface DownloadCheckReport {
  ok: boolean;
  /** 实际查 CloudDrive2 地址. 表单Deja空时es探测到本机地址, 探测No到时Como空串.  */
  address: string;
  permissions: { name: string; label: string; granted: boolean }[];
  missing: string[];
  root: string;
  folder: { path: string; can_offline: boolean; cloud: string } | null;
  quota: { total: number; used: number; left: number } | null;
  /** 115 目标DirectorioDeja空时按Push发现推Directorio; `exists` Como假时 CloudDrive2 dentro还Sin它.  */
  suggested_target: { path: string; exists: boolean } | null;
  /** noSeleccionar PikPak 对应Directorio时, 按Push发现Configuración建议DatosBibliotecaRutaanterior缀; Sin法确定时Como空串.  */
  suggested_pikpak_root: string;
  problems: string[];
}

export interface PikPakLoginResult {
  ok: boolean;
  /** 要人机Verificar时给Verificarpágina地址, 用户EnExplorar dispositivodentroCompletadoposterior再Iniciar sesiónuno次.  */
  captcha_url?: string;
  message?: string;
  settings: DownloadSettingsState;
}

export interface DownloadTask {
  id: number;
  info_hash: string | null;
  provider: DownloadProviderKey;
  provider_label: string;
  source_uri: string;
  display_name: string;
  target: string;
  code: string | null;
  title: string | null;
  origin: string | null;
  state: string;
  state_label: string;
  failure: string | null;
  failure_label: string | null;
  failure_detail: string | null;
  progress: number | null;
  remote_name: string | null;
  ledger_path: string | null;
  asset_id: number | null;
  submitted_at: string | null;
  updated_at: string;
  finished_at: string | null;
  blocked: boolean;
  cancellable: boolean;
  resubmittable: boolean;
  postprocess_state: string;
  postprocess_label: string;
  postprocess_detail: string | null;
  postprocess_run_id: number | null;
  postprocessed_at: string | null;
  postprocess_active: boolean;
  postprocess_retryable: boolean;
}

export interface DownloadsSnapshot {
  available: boolean;
  providers: { key: DownloadProviderKey; label: string; configured: boolean; target: string }[];
  tasks: DownloadTask[];
}

export interface DownloadSubmitResult {
  ok: boolean;
  outcome: 'submitted' | 'adopted' | 'adopted_remote' | 'refused' | 'failed';
  task: DownloadTask;
}

export interface ReleaseState {
  current_version: string;
  latest_version: string | null;
  channel: string;
  installation: string;
  state: string;
  message: string;
  release_url: string;
  checked_at?: number;
  package_kind?: 'update' | 'full';
  asset_size?: number;
}

export interface UpdateJob {
  state: string; progress: number; message?: string; downloaded?: number; total?: number; version?: string;
}

export interface MediaSource {
  location: string; root: string; path: string; online?: boolean; library?: string; library_icon?: string; cost?: 'free' | 'metered';
}

export interface ConfigurationFact {
  term: string;
  value: string;
  download_url?: string;
  download_label?: string;
}

export interface ConfigurationData {
  remote_reporting?: import('./settings/remote-reporting-settings').RemoteReportingState;
  library_sharing?: import('./settings/library-sharing-settings').LibrarySharingState;
  ledger_read_only?: boolean;
  startup?: StartupState;
  uninstall?: UninstallState;
  peach_proxy?: PeachProxyState;
  entry_links?: EntryLinksState;
  push_discovery?: PushDiscoveryState;
  downloads?: DownloadSettingsState;
  updates?: ReleaseState;
  update_job?: UpdateJob;
  automatic_updates?: AutomaticUpdateState;
  access?: AccessState;
  tunnel?: TunnelState;
  editable: boolean;
  /** No能Editar时给用户verOriginal因, puedeEditar时Como空.  */
  notice: string;
  /** ConfiguraciónArchivo指纹, Guardar时带回去, 服务端据此拒绝盖掉别处改动.  */
  revision: string;
  media_dirs: string[];
  media_sources?: MediaSource[];
  /** 媒体Biblioteca数, 服务端按侧栏媒体BibliotecaCambiarDispositivoeseunoAgrupar数bien(同名Archivocarpeta算uno).  */
  library_count: number;
  windows?: boolean;
  port: number;
  port_editable?: boolean;
  mount_dependencies?: { name: string; available: boolean; download_url: string }[];
  facts: ConfigurationFact[];
}

/** ConfiguraciónpáginaSolo要遗Deja层 Toast: Guardares写操作, 回执归Todo站eseuno.  */
export interface ConfigurationProps {
  /** GuardarÉxitoposterior过去时回执(遗Deja层 Toast).  */
  receipt(message: string): void;
  /** 让InstalarTutorialpesadoNuevo出现: Omitiry折叠归, 撤回DatosBibliotecaEtiqueta.  */
  reopenTutorial(): Promise<void>;
  /** primero帧选en procesoeseuno组páginaFirma(别处点"Gestionar媒体Biblioteca""添加媒体Directorio"etc.进来); 认No出或没给就选No.uno组.  */
  section?: string;
}

/** Configuraciónpágina按página签切Agrupar时, uno组根节点作ComoNo. `index` 格página签面板要带属性; `active` es此刻选en procesoeseuno组.  */
export interface ConfigurationPanel {
  index: number;
  id: string;
  labelledBy: string;
  active: boolean;
}

/** Peach ConfiguraciónAgrupar: 媒体Bibliotecay入Biblioteca, 来源y订阅, Descargar渠道, 网络yAcceder, 应用y维护. 
 *  `panel` SoloEnConfiguraciónpáginadentro给, 单独挂uno组时Sin.  */
export interface ConfigurationGroupProps extends Pick<ConfigurationProps, 'receipt'> {
  data: ConfigurationData;
  panel?: ConfigurationPanel;
}

/** alto清版目标página仍由遗Deja层提供能力. Todoes纯函数或导航, página面No持Con它们Estado.  */
export interface QualityGoalsProps {
  /** 写操作En服务端Llegar之posterior过去时回执.  */
  toast(message: string): void;
  /** AbrirObrasDetalles(遗Deja层Completopágina视Imagen, 含ReproducirDispositivoyCola).  */
  openItem(id: number): void;
  /** Código JAV + 版次徽章 + Título HTML. 非 JAV Entrada退化成转义posteriorArchivo名.  */
  javTitleHtml(item: QualityGoal): string;
  /** 同unoEntrada纯文本形态, 用于Sin障碍名称.  */
  javDisplayName(item: QualityGoal): string;
  /** 来源徽标(含计费Etiqueta) HTML.  */
  srcBadge(location: string, cost: string): string;
}

/** Estadísticaspágina仍由遗Deja层提供能力. 都es纯函数或导航, página面No持Con它们Estado.  */
export interface StatsProps {
  /** EtiquetaClave到界面en la名称(`core/tags.ts`  `tagLabel`).  */
  tagLabel(key: string): string;
  /** 点unocontenidoEtiqueta: 回Directorioy按它Filtrar. Completopágina换成Directorio由遗Deja壳做.  */
  onTag(key: string): void;
  /** AbrirConfiguraciónpágina"媒体"página签. Sin视频或Sin存储来源时空态en laese去处.  */
  openMediaSettings(): void;
  /** este机Dispositivo能No能改Configuración. No能改时空态No给"添加媒体Directorio".  */
  configurable: boolean;
}

/** 口味página仍由遗Deja层提供能力. 都es导航, 查表或回执, página面No持Con它们Estado.  */
export interface TasteProps {
  /** 点uno名次: 回Directorioy按它Filtrar. `kind` es `tag`/`creator`/`performer`.  */
  onSignal(kind: string, name: string): void;
  /** Abrir口味Resumen指向página面.  */
  navigate(route: string): void;
  /** 写操作En服务端Llegar之posterior过去时回执.  */
  toast(message: string): void;
  /** 从引导流程进来(`?onboarding=1`): ExplorarRegistroImportarGuía直continuar展开.  */
  onboarding: boolean;
}

/** 来源 y 凭证páginaSolo要遗Deja层 Toast: GuardaryDeshaceres写操作, 回执归Todo站eseuno.  */
export interface ScrapingProps {
  /** 写操作En服务端Llegar之posterior过去时回执.  */
  toast(message: string): void;
}

/** 关注Gestionarpágina. 
 *
 *  地址栏y人偏bienEnaquí分成两组: `tab`/`page`/`sort`/`dir` exterior面链continuar得过来, 跟着地址
 *  走; `pageSize`/`layout` esesteExplorar dispositivo习惯, 跟着 `appSettings` 走. 两组都由壳持Con存储, 
 *  React 持Con实时Estado, 各SoloConuno.  */
export interface FollowManageProps {
  /** 地址栏此刻带着página签(`list`/`add`/`feeds`).  */
  tab: string;
  page: number;
  sort: string;
  dir: string;
  /** estecuatro项写回地址栏. 空串表示esteuno项此刻就esPredeterminado值, 壳No写进去.  */
  route(params: { tab: string; page: number; sort: string; dir: string }): void;
  /** esteExplorar dispositivo偏bien当anterior值.  */
  pageSize: number;
  layout: string;
  /** 偏bien改: 存储归壳(`appSettings`), página面No自己写uno.  */
  savePreference(patch: { pageSize?: number; layout?: string }): void;
  /** 写操作En服务端Llegar之posterior过去时回执.  */
  toast(message: string): void;
  /** 去"verActualizar"eseunopágina(`/follow`). Completopágina换成哪uno屏仍归遗Deja壳.  */
  openFollow(): void;
  openServiceConfiguration(): void;
  /** DatosBibliotecaSolo读: este机DispositivoSolo能Explorar, 写操作TodoNo给点.  */
  readOnly: boolean;
  readOnlyMessage: string;
  /** 写入端arribaesteunopágina地址. 取No到时门禁dentroNo给去处.  */
  writerUrl: string;
}

/** 人工复核página. 
 *
 *  `category` es唯uno进地址栏eseuno项: diezCategoríaes固定uno组身, "Enver哪unoCola"链continuar
 *  得过来, Actualizar也要还Original. Agrupar, Filtrarypágina码esesteuno刻ver法, Cola又es消耗性(判uno就menos
 *  uno), 写进地址栏Compartir出去Solo会指向另uno批东西.  */
export interface ReviewProps {
  /** 地址栏此刻带着Categoría. No认识值退回Predeterminadoeseuno档.  */
  category: string;
  /** Categoría写回地址栏. 空串表示esteuno项此刻就esPredeterminado值, 壳No写进去.  */
  route(params: { category: string }): void;
  /** AbrirObrasDetalles(遗Deja层Completopágina视Imagen, 含ReproducirDispositivoyCola).  */
  openItem(id: number): void;
  /** Abrir实体资料página. `kind` es `creator`/`performer`.  */
  openEntity(kind: string, name: string): void;
  /** En资源GestionarDispositivodentro显示esteArchivo. Éxito由遗Deja层自己发回执, Fallo回uno句Original因.  */
  revealSource(id: number): Promise<string>;
  /** 写操作En服务端Llegar之posterior过去时回执.  */
  toast(message: string): void;
  /** DatosBibliotecaSolo读: este机DispositivoSolo能Explorar, 判定y收录TodoNo给点, 进página面也No发eseuno次自动落Biblioteca.  */
  readOnly: boolean;
  readOnlyMessage: string;
  /** 写入端arribaesteunopágina地址. 取No到时门禁dentroNo给去处.  */
  writerUrl: string;
}

/** escanearyRecolectar. 同unoDatos两读者, 所以同uno名字挂两形态: DatosGestionarpáginaese卡片, 
 *   y Directoriopágina顶arribaese横幅(`mode: 'notice'`).  */
export interface LibraryProcessingProps {
  /** Tarea跑完时uno次通知. 同uno趟按 `job_id` Solo报uno次, 谁先ver到Terminar谁报.  */
  toast(message: string): void;
  /** esteuno趟从运行走到终态: 让遗Deja层pesado画DatosGestionarpáginaese几计数.  */
  onComplete?(): void;
    /** 紧凑Tarea面持续观察posteriorEstado.  */
  mode?: 'notice';
  /** 卡片闲着时也continuar着问: Tarea由posterior自己起, página面要认出"现En跑起来".  */
  monitor?: boolean;
}

/** 换Avatar: 资料página圆框角arribaese加号, 连同它点开eseuno屏候选. 资料卡(`entity-hero`)En自己
 *  Avatar框arriba直continuar渲染它, No单独挂载.  */
export interface AvatarPickerProps {
  /** 实体Tipo(`performer`/`creator`).  */
  kind: string;
  entityId: number;
  /** página面arriba显示este人名字, 用EnSin障碍名称 y eseuno句Descripcióndentro.  */
  name: string;
  /** 换Éxitoposterior让宿主pesado画Avatar. 遗Deja层传es"pesadoNuevo进esteunopágina".  */
  onPicked(): void;
}

/** RecortarPortada: ObrasDetallespáginaTítulo旁eseClave, 连同它点开eseuno屏取景框.  */
export interface CoverCropProps {
  /** 归unoanteriorCódigo JAV, Original样回递给写端点.  */
  code: string;
  /** PortadaOriginalImagen地址(`/cover?code=`). 框量esesteImagen像素.  */
  coverUrl: string;
  /** 当anterior生效取景框, Sin就es null. 形状同Interfaz `poster_box`.  */
  box: { x0: number; y0: number; x1: number; y1: number; px: number[] } | null;
  /** 存bien之posterior让宿主pesado画Portada, `box` es写端点回Nuevo框(形状同 `box`): ObrasDetallespesado取esteuno, 
   *  背posteriorCuadrículadentro同unoCódigo JAV卡就地换arriba它.  */
  onSaved(box: CoverCropProps['box']): void;
}

/** DatosGestionarpágina顶arribaese排读数卡各通往哪unopágina. `ads` es垃圾Archivo.  */
export type DataCleanupSection = 'review' | 'quality' | 'duplicates' | 'ads' | 'trash';

/** DatosGestionarpágina仍由遗Deja层提供能力: 回执 y 换página.  */
export interface DataCleanupProps {
  /** 操作回执(遗Deja层 `actionReceipt`). `warning` es做完peroConuno部分要Deja意, 走Advertencia音效.  */
  toast(message: string, options?: { warning?: boolean }): void;
  /** Fallo回执(遗Deja层 `actionFailure`): `action` es没做成ese件事.  */
  failure(action: string, error: unknown): void;
  /** 点uno读数卡: 换到eseunopágina.  */
  open(section: DataCleanupSection): void;
}

/** RepetirArchivopágina仍由遗Deja层提供能力.  */
export interface DuplicatesProps {
  /** AbrirObrasDetalles(遗Deja层Completopágina视Imagen).  */
  openItem(id: number): void;
  /** 操作回执; 给 `undo` 就带unoDeshacerClave.  */
  toast(message: string, options?: { undo?: () => Promise<void> }): void;
  failure(action: string, error: unknown): void;
}

/** ReproducirListapágina仍由遗Deja层提供能力.  */
export interface PlaylistsProps {
  /** AbrirunoListaReproducirCola, 从 `resumeAssetId` eseunocontinuar着播.  */
  openPlaylist(id: number, resumeAssetId: number): void;
  /** 点署名行Avatar: 去este人资料página. `kind` es `performer`/`creator`.  */
  openEntity(kind: string, name: string): void;
  /** 此刻能No能Pasar el ratón翻Página: 壳más选, 遮挡, 减menos动效y滚动en proceso都回 false.  */
  canFlip(): boolean;
  /** 操作回执(遗Deja层 `actionReceipt`); 给 `undo` 就带unoDeshacerClave. Deshacer抛错时回执自己
   *  换成"DeshacerFallo", página面No另报uno次.  */
  toast(message: string, options?: { undo?: () => Promise<void> }): void;
  /** Actualizar代次. 壳Enesteunopáginaarriba要求pesado读(顶栏"换uno批", 从别处写完回来)时加uno, página面据此pesado取, Nopesado挂.  */
  revision?: number;
}

/** Todo站 Toast 两字形, 遗Deja层 `icon()` 画bien SVG 片段.  */
export interface ToastIcons { success: string; error: string }

/** uno回执. `html` ya由遗Deja层 `toastBody` 按调用点声明转义或Original样放行.  */
export interface ToastRequest {
  html: string;
  alert: boolean;
  /** 毫秒; 0 y负数按Predeterminado 6 秒, `Infinity` 表示No自己消失.  */
  timeout: number;
  action: { label: string; run(button: HTMLButtonElement): void } | null;
}

export type { StageApi, StageHost, StagePatch, StageRequest } from './stage/stage-api';

/** continuararriba壳给宿主, 拿回舞命令入口(`stage/stage.tsx`). Solo调uno次; esteuno面由 `application-residents.ts` 
 *  `loadStage` continuar着经常驻表 `openResidentSurface` En路由树dentroAbrir.  */
export declare function configureStage(host: StageHost): StageApi;

export type {
  SettingsEffect, SettingsPanelApi, SettingsPanelHost,
} from './settings-panel/settings-panel-api';

/** continuararriba壳给宿主, 拿回Configuración面板命令入口(`settings-panel/settings-panel.tsx`). Solo调uno次; esteuno面由
 *  `application-residents.ts`  `loadSettingsPanel` continuar着经常驻表 `openResidentSurface` En路由树dentroAbrir.  */
export declare function configureSettingsPanel(host: SettingsPanelHost): SettingsPanelApi;

export type { ImmerseApi, ImmerseHost } from './immerse/immerse-api';

/** continuararriba壳给宿主, 拿回InmersivoModo命令入口(`immerse/immerse-island.tsx`). Solo调uno次; esteuno面由
 *  `application-residents.ts`  `loadImmerse` continuar着经常驻表 `openResidentSurface` En路由树dentroAbrir.  */
export declare function configureImmerse(host: ImmerseHost): ImmerseApi;

export type {
  SidebarApi, SidebarChip, SidebarContent, SidebarDot, SidebarFacets, SidebarHost, SidebarProps,
} from './sidebar/sidebar-api';

/** continuararriba壳给宿主, 拿回侧栏命令入口(`sidebar/sidebar-island.tsx`). Solo调uno次; esteuno面由 `application-residents.ts` 
 *  `loadSidebar` continuar着经常驻表 `openResidentSurface` En路由树dentroAbrir.  */
export declare function configureSidebar(host: SidebarHost): SidebarApi;

export type {
  ManageEntry, ManageHeaderApi, ManageHeaderHost, ManageHeaderProps, TrashCount,
} from './manage-header/manage-header-api';

/** continuararriba壳给宿主, 拿回Gestionar区página头命令入口(`manage-header/manage-header-island.tsx`). Solo调uno次; esteuno面由
 *  `application-residents.ts`  `loadManageHeader` continuar着经常驻表 `openResidentSurface` En路由树dentroAbrir.  */
export declare function configureManageHeader(host: ManageHeaderHost): ManageHeaderApi;

export type {
  BatchAction, BatchContext, BatchDockApi, BatchDockHost, BatchDockProps, BatchGroup,
} from './batch-dock/batch-dock-api';

/** continuararriba壳给宿主, 拿回批量命令入口(`batch-dock/batch-dock-island.tsx`). Solo调uno次; esteuno面由
 *  `application-residents.ts`  `loadBatchDock` continuar着经常驻表 `openResidentSurface` En路由树dentroAbrir.  */
export declare function configureBatchDock(host: BatchDockHost): BatchDockApi;

export type { GlowPickerHost } from './glow-picker/glow-picker-api';

/** continuararriba壳给宿主(`glow-picker/glow-picker-island.tsx`). Solo调uno次; 卡contenido由 `application-residents.ts` 
 *  `loadGlowPicker` continuar着经常驻表 `openResidentSurface` En路由树dentro画.  */
export declare function configureGlowPicker(host: GlowPickerHost): void;

export type { ManagedOpenProps, ManagedPath, ShellActions } from './router/shell-actions';

/** 路由树ese几páginaprimero屏取数(`@peach/history`  `openManagedRoute` 经 `connectManagedRoutes` 调它).  */
export declare function prefetchManagedRoute(path: string, open: object, signal: AbortSignal): Promise<void>;

/** En `host` arriba挂Todo站唯uno Toaster; Repetir调用es空操作.  */
export declare function mountToaster(host: Element, icons: ToastIcons): void;
/** 发出uno回执; 同uno `id` 再调uno次就es改写eseuno.  */
export declare function showToast(id: string, request: ToastRequest): void;
