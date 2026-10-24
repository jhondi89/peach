/* 由路由画ese几página, página面en lapágina面interior组件y常驻组件: 登记Clave到primero屏取数y画法对照表, siete; 另Conantiguo直达地址
 * 改写表 `REDIRECT_ROUTES`  y InmersivoModo `IMMERSE_ROUTES`, Solo挂元素. 
 *
 * `MANAGED_ROUTES` esGestionar区ese几página(画进 `#stats`), ClaveesExactoRuta, 每带página面组按匹配挂en la元素; 
 * `BROWSE_ROUTES` es同样画进 `#stats` ReproducirListapáginay关注página; `INDEX_ROUTES` es索引página, `ENTITY_ROUTES` es资料página(都画进 `#index`), 资料página按Modo登记
 * (`/performers/*`), 类y名字跟着Abrir走; `CATALOG_ROUTES` es画进 `#grid` DirectorioCuadrículay垃圾Cola, 按página面
 * 分Clave; `SURFACE_ROUTES` espágina面en lapágina面interior组件, `RESIDENT_ROUTES` esNo跟某unopágina走常驻组件, 都按名字登记, Noes地址, 
 * No进 `<Routes>`. 每次Abrir交进来 `open`(Gestionar区由página面元素算, 其余由壳算)Solo带eseuno次才算得出值(地址en laCategoríaypágina签, Solo读Estado, 引导Etiqueta, uno次性预Introduce, Actualizar代次), `#grid` ese两página
 * ypágina面interior组件es壳eseunoCompleto props; 回执y换到还归壳ese几屏走 `ShellActions`. 
 * Gestionar区几página之间Saltar a走 `go`: 落En `MANAGED_ROUTES` en la交给 React Router  `navigate`, 其余交壳. 另exterior
 * cuatro表página面No走 `go`: 它们Enpáginainterior写地址uno律由壳认领(`routeIndex`, 资料páginay关注página `actions.route`, 
 * Directorio换Filtrar, 垃圾Cola换Categoría), 跨página也交壳, Abrir次数同壳自己Abrir.  */
import type { ReactElement } from 'react';
import { settingsPath, type ConfigurationPath } from '@peach/history';

import { javDisplayName, javTitleHtml } from '@peach/legacy/jav-title';
import { tagLabel } from '@peach/legacy/tags';

import { ActivityPage } from '../activity/activity-page';
import { prefetchTasks } from '../activity/tasks';
import { BatchDockSurface } from '../batch-dock/batch-dock-island';
import type { DataCleanupSection, LibraryProcessingProps } from '../bundle';
import { CatalogFilterPage } from '../catalog-filter/catalog-filter-page';
import { prefetchCatalogGrid } from '../catalog-grid/catalog-grid';
import { CatalogGridPage } from '../catalog-grid/catalog-grid-page';
import { prefetchDataCleanup } from '../data-cleanup/data-cleanup';
import { DataCleanupPage } from '../data-cleanup/data-cleanup-page';
import { prefetchEntityPage, type EntityPageProps } from '../entity-page/entity-page';
import { EntityPage } from '../entity-page/entity-page-view';
import { prefetchDuplicates } from '../duplicates/duplicates';
import { DuplicatesPage } from '../duplicates/duplicates-page';
import { prefetchDiagnostics } from '../diagnostics/diagnostics';
import { DiagnosticsPage } from '../diagnostics/diagnostics-page';
import { prefetchFeedNew } from '../feed-new/feed-new';
import { FeedNewPage } from '../feed-new/feed-new-page';
import { prefetchFollowFeed } from '../follow-feed/follow-feed';
import { FollowFeedPage } from '../follow-feed/follow-feed-page';
import { prefetchFollowManage } from '../follow-manage/follow-manage';
import { FollowManagePage } from '../follow-manage/follow-manage-page';
import { GlowPickerSurface } from '../glow-picker/glow-picker-island';
import { ImmerseSurface } from '../immerse/immerse-island';
import { prefetchIndex } from '../index/index-data';
import { IndexPage } from '../index/index-page';
import { JunkQueuePage } from '../junk-queue/junk-queue-page';
import { JavPage } from '../jav/jav-page';
import { prefetchJav } from '../jav/jav';
import { prefetchLibraryProcessing } from '../library-processing/library-processing';
import { LibraryProcessingCard } from '../library-processing/library-processing-card';
import { LibraryProcessingNotice } from '../library-processing/library-processing-notice';
import { ManageHeaderSurface } from '../manage-header/manage-header-island';
import { prefetchPlaylists } from '../playlists/playlists';
import { PlaylistsPage } from '../playlists/playlists-page';
import { prefetchQualityGoals } from '../quality-goals/quality-goals';
import { QualityGoalsPage } from '../quality-goals/quality-goals-page';
import { prefetchReview } from '../review/review';
import { ReviewPage } from '../review/review-page';
import { prefetchScraping } from '../scraping/scraping';
import { ScrapingPage } from '../scraping/scraping-page';
import { SearchPage } from '../search/search-page';
import { prefetchConfiguration } from '../settings/configuration';
import { ConfigurationPage } from '../settings/configuration-page';
import { SettingsPanelSurface } from '../settings-panel/settings-panel';
import { SidebarSurface } from '../sidebar/sidebar-island';
import { StageSurface } from '../stage/stage';
import { prefetchStats } from '../stats/stats';
import { StatsPage } from '../stats/stats-page';
import { DEFAULT_WINDOW, prefetchTaste } from '../taste/taste';
import { TastePage } from '../taste/taste-page';
import { CatalogMatch } from './pages/catalog';
import { FollowMatch, PlaylistsMatch } from './pages/follow';
import { ImmerseMatch } from './pages/immerse';
import { EntityMatch, IndexMatch } from './pages/index-entity';
import { ManagedMatch, ResourceSyncRedirect } from './pages/managed';
import type {
  BrowseOpenProps, BrowseRoutePath, CatalogOpenProps, CatalogPagePath, EntityRoutePath, IndexOpenProps,
  IndexOpenPropsTable, IndexRoutePath, ManagedOpenProps, ManagedPath, ResidentName, ResidentOpenProps, ShellActions,
  SurfaceName, SurfaceOpenProps,
} from './shell-actions';

interface ManagedRoute<P> {
  prefetch(open: P, signal: AbortSignal): Promise<void>;
  page(open: P, actions: ShellActions, go: (path: string) => void): ReactElement;
  /** página面组dentroeste路由元素: 按地址Abriresteunopágina(`pages/`). Sinese几página仍由壳Abrir.  */
  element?: ReactElement;
}

type ManagedRouteTable = { [Path in ManagedPath]: ManagedRoute<ManagedOpenProps[Path]> };
type BrowseRouteTable = { [Path in BrowseRoutePath]: ManagedRoute<BrowseOpenProps[Path]> };
type IndexRouteTable = { [Path in IndexRoutePath]: ManagedRoute<IndexOpenPropsTable[Path]> };
type EntityRouteTable = { [Path in EntityRoutePath]: ManagedRoute<EntityPageProps> };
type CatalogRouteTable = { [Path in CatalogPagePath]: ManagedRoute<CatalogOpenProps[Path]> };
type SurfaceRouteTable = { [Name in SurfaceName]: ManagedRoute<SurfaceOpenProps[Name]> };
type ResidentRouteTable = { [Name in ResidentName]: ManagedRoute<ResidentOpenProps[Name]> };
/** 路由树画Todopágina面y面: Gestionar区ese几página, ReproducirListapáginay关注página, 索引páginay资料página, DirectorioCuadrícula, 加arribapágina面interior组件y常驻组件名字.  */
export type RoutedPath =
  ManagedPath | BrowseRoutePath | IndexRoutePath | EntityRoutePath | CatalogPagePath | SurfaceName | ResidentName;

/* DatosGestionarpágina读数卡去处dentro, SoloConRepetirArchivoNo按Gestionar区身找: 它报esDatosGestionar身.  */
function openCleanupSection(section: DataCleanupSection, actions: ShellActions, go: (path: string) => void) {
  if (section === 'duplicates') { go('/duplicates'); return }
  const path = actions.managePath(section);
  if (isManagedPath(path)) go(path);
  else actions.openManage(section);
}

/* No.uno帧En宿主放进 `#stats` 同unoTareadentroSincronizar画完(`router.tsx`  `ManagedSurface`): 壳画完esteunopágina
 * 紧continuar着就读它画出来结构(Configuraciónpágina按地址en la `#peachProxy` 滚过去, eseuno刻选en procesopágina签ya经es"网络yAcceder").  */
const configurationRoute = (path: ConfigurationPath): ManagedRoute<ManagedOpenProps['/settings/library']> => ({
  element: <ManagedMatch path={path} />,
  prefetch: async (_open, signal) => {
    await Promise.all([prefetchConfiguration(signal), ...(path === '/settings/diagnostics' ? [prefetchDiagnostics(signal)] : [])]);
  },
  page: (open, actions, go) => <ConfigurationPage receipt={message => actions.receipt(message)}
    reopenTutorial={actions.reopenTutorial} section={path === '/settings/diagnostics' ? 'Diagnóstico del sistema' : open.section ?? ''}
    diagnostics={<DiagnosticsPage navigate={go} openItem={actions.openItem} receipt={message => actions.receipt(message)}
      configure={section => { actions.requestConfigurationSection(section); go(settingsPath(section)) }} />} />,
});

export const MANAGED_ROUTES: ManagedRouteTable = {
  '/jav': {
    element: <ManagedMatch path="/jav" />,
    prefetch: (open, signal) => prefetchJav(open.tab, signal),
    page: (open, actions) => <JavPage {...open} navigate={actions.navigate} receipt={message => actions.receipt(message)} />,
  },
  '/stats': {
    element: <ManagedMatch path="/stats" />,
    prefetch: (_open, signal) => prefetchStats(signal),
    /* 点unocontenidoEtiquetaes"回Directorioy按它Filtrar", Completopágina换成Directorio仍归壳.  */
    page: (open, actions, go) => (
      <StatsPage tagLabel={tagLabel} onTag={actions.openTag} configurable={open.configurable}
        openMediaSettings={() => { actions.requestConfigurationSection('Biblioteca y catalogación'); go('/settings/library') }} />
    ),
  },
  '/taste': {
    element: <ManagedMatch path="/taste" />,
    /* primero屏取es"TodoTiempo"eseuno: AnálisisRangoes组件Estado, 每次进esteunopágina都从它Empezar.  */
    prefetch: (_open, signal) => prefetchTaste(DEFAULT_WINDOW, signal),
    /* Resumenen laSiguiente步动作按Ruta走(`taste_history.py` 给), 路由树dentroSin交壳路由表.  */
    page: (open, actions, go) => (
      <TastePage onSignal={actions.openTasteSignal} navigate={go} toast={(message) => actions.receipt(message)}
        onboarding={open.onboarding} />
    ),
  },
  /* ADR-0018 确定项ya由escaneary资料ProcesarTarea落Biblioteca; 复核páginaSolo读取剩abajo判断题.  */
  '/review': {
    element: <ManagedMatch path="/review" />,
    prefetch: (_open, signal) => prefetchReview(signal),
    page: (open, actions) => (
      <ReviewPage {...open} route={actions.routeReview} openItem={actions.openItem} openEntity={actions.openEntity}
        revealSource={actions.revealSource} toast={(message) => actions.receipt(message)} />
    ),
  },
  /* primero屏etc.顶arribaese排读数dentro自己几, 两posteriorTarea卡yOrganizar卡; 复核, alto清版y链continuar各读各.  */
  '/data-cleanup': {
    element: <ManagedMatch path="/data-cleanup" />,
    prefetch: (_open, signal) => prefetchDataCleanup(signal),
    page: (_open, actions, go) => (
      <DataCleanupPage failure={actions.failure} open={(section) => openCleanupSection(section, actions, go)}
        toast={(message, { warning = false } = {}) => (
          warning ? actions.toast({ text: message }, { sound: 'warning' }) : actions.receipt(message))} />
    ),
  },
  '/duplicates': {
    element: <ManagedMatch path="/duplicates" />,
    prefetch: (_open, signal) => prefetchDuplicates(signal),
    page: (_open, actions) => (
      <DuplicatesPage openItem={actions.openItem} failure={actions.failure}
        toast={(message, { undo } = {}) => actions.receipt(message, undo ? { undo } : {})} />
    ),
  },
  '/quality-goals': {
    element: <ManagedMatch path="/quality-goals" />,
    prefetch: (_open, signal) => prefetchQualityGoals(signal),
    page: (_open, actions) => (
      <QualityGoalsPage openItem={actions.openItem} javTitleHtml={javTitleHtml} javDisplayName={javDisplayName}
        toast={(message) => actions.receipt(message)} srcBadge={actions.srcBadge} />
    ),
  },
  '/sources': {
    element: <ManagedMatch path="/sources" />,
    prefetch: (_open, signal) => prefetchScraping(signal),
    page: (_open, actions) => <ScrapingPage toast={(message) => actions.toast(message)} />,
  },
  '/settings/library': configurationRoute('/settings/library'),
  '/settings/subscriptions': configurationRoute('/settings/subscriptions'),
  '/settings/downloads': configurationRoute('/settings/downloads'),
  '/settings/network': configurationRoute('/settings/network'),
  '/settings/maintenance': configurationRoute('/settings/maintenance'),
  '/settings/diagnostics': configurationRoute('/settings/diagnostics'),
  '/tasks': {
    element: <ManagedMatch path="/tasks" />,
    prefetch: (_open, signal) => prefetchTasks(signal),
    page: () => <ActivityPage />,
  },
  /* primero屏Solo取来源清单yCredencialesEstado, 地址栏指着"订阅源"时连它uno起取. VerificarActualizaryEncontrarese两趟
     posteriorTarearápido照NoEnprimero屏dentro: 它们常年躺着Anterior趟回执, etc.它们Solo会让primero屏másuno往返.  */
  '/subscriptions': {
    element: <ManagedMatch path="/subscriptions" />,
    prefetch: (open, signal) => prefetchFollowManage(signal, open.tab),
    page: (open, actions) => (
      <FollowManagePage {...open} route={actions.routeFollowManage} savePreference={actions.saveFollowPreference}
        toast={(message) => actions.receipt(message)} openFollow={actions.openFollow}
        openServiceConfiguration={() => actions.navigate('/settings/subscriptions')} />
    ),
  },
};

/** Gestionar区ese几página之间Saltar a判据: Solo认 `MANAGED_ROUTES` ExactoRuta. 索引páginaNo算: 它们换 search 要由壳
 *  认领, 跨进来也es壳写地址再自己Abrir.  */
export const isManagedPath = (path: string): path is ManagedPath => Object.hasOwn(MANAGED_ROUTES, path);

/** antiguo直达地址: página面组按匹配挂arriba元素, 元素地址改写到别página面arriba, 自己No画.  */
export const REDIRECT_ROUTES: Readonly<Record<string, { element: ReactElement }>> = {
  '/resource-sync': { element: <ResourceSyncRedirect /> },
};

/** InmersivoModo: página面组按匹配挂arriba元素(`pages/immerse.tsx`), 元素交壳Abrir常驻组件 `immerse`, 自己No画.  */
export const IMMERSE_ROUTES: Readonly<Record<string, { element: ReactElement }>> = {
  '/immerse': { element: <ImmerseMatch /> },
};

/* 两página都由元素按匹配Abrir(`pages/follow.tsx`). ReproducirListaPágina: primero屏每次都向服务端pesado取(primeropágina刚存 Mix 进来就要
   ver得到). 停Enesteunopágina时壳要求pesado读, 元素经 `updateManagedRoute` 推unoNuevo `revision`, página面Solopesado取, Nopesado挂. 点开
   uno进舞, 翻página门槛y回执都归壳. 
   关注Página: primero屏esListaNo.unopáginayCredenciales两趟y行, 挂arriba就es最终样子; 之posterior换Filtrar, 换uno批, SeleccionarModoy照片版都由
   壳经 `updateManagedRoute` 推进来, página面按NuevoClaveSolopesado取Lista, Nopesado挂.  */
export const BROWSE_ROUTES: BrowseRouteTable = {
  '/playlists': {
    element: <PlaylistsMatch />,
    prefetch: (_open, signal) => prefetchPlaylists(signal),
    page: (open, actions) => (
      <PlaylistsPage revision={open.revision} openPlaylist={actions.openPlaylist} openEntity={actions.openEntity}
        canFlip={actions.canFlip} toast={(message, { undo } = {}) => actions.receipt(message, undo ? { undo } : {})} />
    ),
  },
  '/follow': {
    element: <FollowMatch />,
    prefetch: (open, signal) => prefetchFollowFeed(open, signal),
    page: (open) => <FollowFeedPage {...open} />,
  },
};
const isBrowsePath = (path: string): path is BrowseRoutePath => Object.hasOwn(BROWSE_ROUTES, path);

/* 索引Página: 地址栏en lacuatro项由元素从地址读出, 跟着esteuno次Abrir交进来; páginainterior换档经 `routeIndex` 由壳写地址y认领, 
   Nopesado挂(posterior退anterior进到同unopágina另uno search 时领Nuevopágina面Abrir序号, 元素按地址pesado开uno次). primero屏Solo取No.unopágina.  */
const indexRoute: ManagedRoute<IndexOpenProps> = {
  element: <IndexMatch />,
  prefetch: (open, signal) => prefetchIndex(open, signal),
  page: (open, actions) => (
    <IndexPage {...open} route={actions.routeIndex} savePreference={actions.savePeopleLayout}
      exitSelectMode={actions.exitSelectMode} personAvatar={actions.personAvatar} authorAvatar={actions.authorAvatar}
      tagLabel={tagLabel} openEntity={actions.openEntity} showTags={actions.showIndexTags}
      openFollowAuthor={actions.openFollowAuthor} openFollowTag={actions.openFollowTag} />
  ),
};
export const INDEX_ROUTES: IndexRouteTable = {
  '/performers': indexRoute, '/creators': indexRoute, '/studios': indexRoute, '/agencies': indexRoute, '/tags': indexRoute,
};

/* 资料Página: 资料卡, Filtrar浮层, Nuevas obraseseuno行y正文es同unopáginacuatro. 框架由元素排bien(`openManagedRoute` 
   `place`), página面画进资料卡eseuno格, 再经 portal 画进另exteriortres. primero屏资料(连同Nuevas obrasy头几Portada), 
   ObrasNo.unopáginay照片取齐再画; 换Avatar候选NoEnprimero屏dentro, 资料página每进uno次就打uno遍ImagenBiblioteca话, más数时候没人
   点开它. 壳交进来Filtrar, 视Imageny展示Configuración之posterior经 `updateManagedRoute` 推进来, página面按NuevoClavepesado取, Nopesado挂. 卡片y
   遗Deja层拼 HTML(Avatar, Nuevas obraseseuno行, 源ArchivoClave)都es壳eseuno, 跟着Abrir走.  */
const entityRoute: ManagedRoute<EntityPageProps> = {
  element: <EntityMatch />,
  prefetch: (open) => prefetchEntityPage(open),
  page: (open) => <EntityPage {...open} />,
};
export const ENTITY_ROUTES: EntityRouteTable = {
  '/performers/*': entityRoute, '/studios/*': entityRoute, '/creators/*': entityRoute, '/series/*': entityRoute,
  '/agencies/*': entityRoute, '/tags/*': entityRoute,
};

/* 画进 `#grid` 两página. DirectorioCuadrícula: primeropágina, cuatroFiltrar态dentro除垃圾Archivoexteriortres,  y 回收站, 画都esesteunoCuadrícula, 
   Filtrares壳eseuno `state`; 垃圾Cola: 垃圾Archivoeseuno屏, Categoríay视ImagenSolo从地址读. 表按página面分Clave: 壳用 `/` Abrir
   Cuadrícula, 用 `/junk-files` AbrirCola, 槽dentro记Ruta说es画着哪unopágina, Noes地址. 按地址分Clave会Entres处出错: CuadrículaEn
   `/trash` Abrir之posterior去 `/` es就地推, 槽en laRutaNo跟着变; `?state=ads` 落En `/` arriba, 画es垃圾Cola; 冷启动
   落EnDetalles地址arriba时, CuadrículaEn `/assets/:id` 底abajo补画. 
   Cuadrículaprimero屏取No.unopágina再画; ColaNoEnAbriranterioretc., 画arriba就铺自己ese骨架(`junk-queue-page.tsx` 开头). 之posterior换
   Filtrar或Categoría, 换版, SeleccionarModoyActualizar代次都由壳经 `updateManagedRoute` 推进来, página面按NuevoClavepesado取, 自己铺
   骨架, Nopesado挂.  */
export const CATALOG_ROUTES: CatalogRouteTable = {
  '/': {
    element: <CatalogMatch />,
    prefetch: (open, signal) => prefetchCatalogGrid(open, signal),
    page: (open) => <CatalogGridPage {...open} />,
  },
  '/junk-files': {
    element: <CatalogMatch />,
    prefetch: async () => {},
    page: (open) => <JunkQueuePage {...open} />,
  },
};
const isCatalogPage = (path: string): path is CatalogPagePath => Object.hasOwn(CATALOG_ROUTES, path);

/* escanearyRecolectar提供DatosGestionar卡片 y 紧凑Tarea面. 两边读同uno
 * `queryKey`, 所以同时挂着时它们veres同unorápido照, Query 也Solo发uno轮询.  */
const LibraryProcessing = (props: LibraryProcessingProps) => (
  props.mode === 'notice' ? <LibraryProcessingNotice {...props} /> : <LibraryProcessingCard {...props} />
);

/* página面en lapágina面interior组件, 按名字登记: 壳每次Abrir交进来Completo props, 之posterior经 `updateManagedRoute` 推补丁, página面就地
   pesado渲染. primeropáginaFiltraryBuscarabajo拉NoEnAbriranterioretc.Datos(Filtrar读数yAvatar由壳推进来, Buscarabajo拉RegistroyRecomendado聚焦
   时才取); primeropáginaNuevas obras行连头几Portadauno起etc., 再uno次换掉骨架; Tarea面先取unoProgresorápido照.  */
export const SURFACE_ROUTES: SurfaceRouteTable = {
  'catalog-filter': {
    prefetch: async () => {},
    page: (open) => <CatalogFilterPage {...open} />,
  },
  'feed-new': {
    prefetch: (open) => prefetchFeedNew(open),
    page: (open) => <FeedNewPage {...open} />,
  },
  'library-processing': {
    prefetch: (_open, signal) => prefetchLibraryProcessing(signal),
    page: (open) => <LibraryProcessing {...open} />,
  },
  /* Introducir框es壳, abajo拉Solocontinuar它事件, 画abajo拉栏en lacontenido.  */
  search: {
    prefetch: async () => {},
    page: (open) => <SearchPage {...open} />,
  },
};
const isSurfaceName = (key: string): key is SurfaceName => Object.hasOwn(SURFACE_ROUTES, key);

/* 常驻组件, 按名字登记: 壳启动时经 `openResidentSurface` 各开uno次, uno直算当anteriorpágina, Sinprimero屏取数, 宿主就es壳
   ese节点. 从No收, SoloConError边界会卸它组件, 宿主照antiguoDejaEnDocumentacióndentro. AbrirNo带 props: 壳经命令句柄推contenido, 
   组件订阅自己模en la store, 句柄en la绘制Sincronizar做完. Gestionar区página头y侧栏宿主dentro先Con壳启动骨架, Abrir时由
   `place` En画出primero帧同unoTareadentro清掉; Inmersivoy舞宿主NoEn壳página面dentro, No.uno次Abrir时Nuevo, 由 `place` En画出primero帧
   (Inmersivoes藏着exterior框, 舞espequeño窗节点)同unoTareadentro挂到 body último尾; Configuración面板宿主EnNo.uno次Abrir时才Con, 由 `place`
   En同unoTareadentro放进 body último尾.  */
export const RESIDENT_ROUTES: ResidentRouteTable = {
  'batch-dock': {
    prefetch: async () => {},
    page: () => <BatchDockSurface />,
  },
  'glow-picker': {
    prefetch: async () => {},
    page: () => <GlowPickerSurface />,
  },
  'manage-header': {
    prefetch: async () => {},
    page: () => <ManageHeaderSurface />,
  },
  immerse: {
    prefetch: async () => {},
    page: () => <ImmerseSurface />,
  },
  'settings-panel': {
    prefetch: async () => {},
    page: () => <SettingsPanelSurface />,
  },
  sidebar: {
    prefetch: async () => {},
    page: () => <SidebarSurface />,
  },
  stage: {
    prefetch: async () => {},
    page: () => <StageSurface />,
  },
};
const isResidentName = (key: string): key is ResidentName => Object.hasOwn(RESIDENT_ROUTES, key);
/** 画着 `#grid` ese两página时地址puede能落EnRuta: primeropágina, tresFiltrar态, 回收站y垃圾Archivo. Solo进 `<Routes>` 声明, 
 *  No当槽en laClave.  */
export const CATALOG_PATHS = ['/', '/wall', '/unseen', '/watch-later', '/flagged', '/trash', '/junk-files'] as const;

/** `<Routes>` 声明Ruta: anteriorcuatro表Clave, 加arriba `#grid` ese两página画着时地址puede能落EnRuta.  */
export const ROUTED_PATHS: readonly string[] = [
  ...Object.keys(MANAGED_ROUTES), ...Object.keys(BROWSE_ROUTES), ...Object.keys(INDEX_ROUTES),
  ...Object.keys(ENTITY_ROUTES), ...CATALOG_PATHS,
];
/** 路由树画得esteunopágina吗: primero屏取数y画página按槽dentro记登记Clave查, `#grid` ese两páginaSolo认página面Clave, página面interior组件y常驻组件Solo认名字.  */
export const isRoutedPath = (path: string): path is RoutedPath => (
  isManagedPath(path) || isBrowsePath(path) || Object.hasOwn(INDEX_ROUTES, path) || Object.hasOwn(ENTITY_ROUTES, path)
  || isCatalogPage(path) || isSurfaceName(path) || isResidentName(path));

function routeOf(path: RoutedPath): ManagedRoute<object> {
  if (isManagedPath(path)) return MANAGED_ROUTES[path] as ManagedRoute<object>;
  if (isBrowsePath(path)) return BROWSE_ROUTES[path] as ManagedRoute<object>;
  if (isCatalogPage(path)) return CATALOG_ROUTES[path] as ManagedRoute<object>;
  if (isSurfaceName(path)) return SURFACE_ROUTES[path] as ManagedRoute<object>;
  if (isResidentName(path)) return RESIDENT_ROUTES[path] as ManagedRoute<object>;
  if (Object.hasOwn(INDEX_ROUTES, path)) return INDEX_ROUTES[path as IndexRoutePath] as ManagedRoute<object>;
  return ENTITY_ROUTES[path as EntityRoutePath] as ManagedRoute<object>;
}

/** primero屏取数(`openManagedRoute` 经 `connectManagedRoutes` 调它).  */
export function prefetchManagedRoute(path: string, open: object, signal: AbortSignal): Promise<void> {
  if (!isRoutedPath(path)) return Promise.reject(new Error(`路由树dentroSinesteunoPágina: ${path}`));
  return routeOf(path).prefetch(open, signal);
}

/** 画esteunopágina.  */
export function managedPage(path: RoutedPath, open: object, actions: ShellActions, go: (path: string) => void) {
  return routeOf(path).page(open, actions, go);
}
