/* 侧栏(常驻组件 `sidebar`, `sidebar-island.tsx`)对壳契约. 
 *
 * 它画esizquierda侧抽屉 `#drawer` dentro滚动eseuno层: Título行空槽, 导航eseuno列, 导航arribaese滑动玻璃, 
 * 以及导航abajo面按语境出现FiltrarAgrupar(Directorioy资料página来源, Duración, 产地, 画幅, 创作者, Etiqueta, 
 * 关注página来源, DuraciónycontenidoEtiqueta). 抽屉本身, 它开合, 底栏(明暗, 配色, ConfiguracióntresClave), marcay开合Clave归壳: 
 * 它们es壳dentro几浮层锚点, 壳En `attached` 时marcay开合Clave挪进Título行空槽. 
 *
 * Filtrar, 路由y取数仍归壳. 成员, 按abajo态y数字由壳算bien推进来, 点abajo去动作回到壳
 * `commitContextFilter`, `navTo` y关注páginaFiltrar. 导航顺序读es同uno `appSettings`
 * (`host.store`): Configuración面板或esteuno列自己拖动改顺序, 侧栏按 store 通知当场pesado排.  */
import type { SettingsStore } from '../../settings-store';

/** 来源eseuno行开头pequeño记号: 本地yEn线es雪碧Imagen字形, 网盘esOficial站标, 其余按计费画uno点.  */
export type SidebarDot =
  | { kind: 'glyph'; name: string }
  | { kind: 'image'; src: string }
  | { kind: 'cost'; cost: 'free' | 'metered' };

/** unoFiltrarClave. `label` ya由壳按 `LOC`, `tagLabel` 或聚合en la显示名换bien.  */
export interface SidebarChip {
  value: string;
  label: string;
  n: number | null;
  dot?: SidebarDot;
  /** 来源脱盘: DejaEn名单dentropero点No, `title` 说Original因.  */
  offline?: string;
}

/** Directorioy资料páginaeseuno聚合, 按组排bien.  */
export interface SidebarFacets {
  locations: SidebarChip[];
  regions: SidebarChip[];
  orientations: SidebarChip[];
  /** 资料páginaes某创作者自己时ya经去掉este人.  */
  creators: SidebarChip[];
  tags: SidebarChip[];
  tech: SidebarChip[];
  followTags: SidebarChip[];
  /** BibliotecadentroConDuración读数时才出现Duracióneseuno组.  */
  duration: boolean;
}

export type SidebarContent =
  /** `key` 换就esunoNuevo聚合: AgruparPredeterminado展开pesadoNuevo按按abajo态定, 计数徽标按Anterior次值决定弹No弹.  */
  | { kind: 'catalog'; key: string; facets: SidebarFacets }
  /** 关注páginay关注Detalles: contenidoEtiqueta计数由壳按puede见Entrada或esteuno自己Etiqueta算bien. 来源yDuraciónSoloEn关注páginaCon: 
   *  来源按TodoBiblioteca列(选en procesouno之posterior别还En), `duration` 说BibliotecadentroConSinDuración读数; 按abajo态yDuración两端读
   *  `filters` en la `provider`, `dur_min`, `dur_max`. DetallesSolo给Etiqueta.  */
  | { kind: 'follow'; tags: SidebarChip[]; selected: string[]; providers?: SidebarChip[]; duration?: boolean };

export interface SidebarProps {
  /** null 时Solo画导航(ObrasDetalles, Gestionar区y索引página, 或换páginaposterior聚合还没回来).  */
  content: SidebarContent | null;
  /** 当anterior语境Filtrar(primeropágina `state` 或资料página, Detalleseseuno): 按abajo态yDuración两端照它画.  */
  filters: Record<string, string | number | null | undefined>;
  /** 就地Actualizar数字: 成员No动, 计数照esteuno改, 名单dentroSin记 0; "展开Todo"照它摊开.  */
  latest: SidebarFacets | null;
}

export interface SidebarHost {
  /** 侧栏画进去eseuno层(`#drawerScroll`), 也es常驻组件宿主. 覆盖滚动由壳挂En它arriba面, 轨道住En `#drawer` dentro.  */
  scroll: HTMLElement;
  /** 界面偏bieneseuno store(`appSettings`); 侧栏Solo读写其en proceso `sidebarOrder`.  */
  store: SettingsStore<{ sidebarOrder: string[] }>;
  /** 侧栏能放Todo入口, `[Clave, 名称, 字形]`; primeropáginaeseuno项Clavees空串.  */
  navCatalog: readonly (readonly [string, string, string])[];
  /** esteuno项此刻亮No亮(壳 `navOn`, 读地址yDirectorioFiltrar).  */
  navOn(key: string): boolean;
  navTo(key: string): void;
  /** unoDirectorioFiltrarClave: `multi` 组按逗号Lista增减, 其余组单选, 再点uno次Cancelar.  */
  toggleChip(key: string, value: string, multi: boolean): void;
  /** Duración两端松手(分钟): 0 y 180 表示esteuno端No限.  */
  setDuration(min: number, max: number): void;
  /** Directoriopáginaen la关注Etiqueta: 去关注página"yaGuardar"eseuno, Solo按esteunoEtiqueta筛.  */
  openFollowTag(tag: string): void;
  /** 关注páginay关注DetallescontenidoEtiqueta: 换成Solo按esteunoEtiqueta筛.  */
  selectFollowTag(tag: string): void;
  /** 关注página来源: 单选, 再点uno次Cancelar.  */
  selectFollowProvider(provider: string): void;
  /** 关注páginaDuración两端松手(分钟), 口径同 `setDuration`.  */
  setFollowDuration(min: number, max: number): void;
  /** 路由树画出primero帧之posterior, 句柄交出之anterior, En同unoTareadentro调uno次: 壳marcay开合Clave挪进Título行.  */
  attached(): void;
}

export interface SidebarApi {
  /** Completo props; 壳手arribaDejauno, 每次Solo改其en proceso几项再Completo推进来. 返回时ya经画bien.  */
  render(props: SidebarProps): void;
  /** 导航按abajo态要pesado读(路由变, DirectorioFiltrar改 JAV 或竖屏): 玻璃从antiguo项滑到Nuevo项. 返回时ya经画bien.  */
  navChanged(): void;
}
