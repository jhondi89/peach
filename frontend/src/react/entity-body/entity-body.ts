/* 实体资料página正文(ADR-0031 No. 10e 步): Filtrar浮层abajo面eseunoCompletoDatos形状. 
 *
 * esteunoEntres视Imagen之间Cambiar: 名册(Agencia旗abajo艺人, 片商旗abajoSello), ObrasCuadrícula y 照片Muro. 
 * entity-page Gestionar取数ypáginainterior视Imagen, 应用域控制Dispositivo通过唯unoHistorial入口写地址y推进Filtrar props. 
 * 正文按 props 绘制, 换视Imagen, Filtrar y Ordenar时Nopesado挂; 动作经página面Interfaz回到对应控制Dispositivo. 
 *
 * ObrasCuadrícula就es馆藏卡片Cuadrícula(`catalog-grid`) entity Modo, aquí直continuar渲染ese组件, 卡片
 * 助手, 动作, 版ySeleccionarEstadoOriginal样递进去; 名册摆es索引páginaeseuno格(`PeopleGrid`).  */
import type { CatalogGridProps, MediaCardActions, MediaCardHelpers, MediaPage } from '../catalog-grid/types';
import type { IndexPerson, PeopleLayout, PersonAvatar } from '../index/index-data';

/** esteunopágina此刻摆es哪uno类东西, yFiltrar浮层eseuno组视ImagenClave同uno套词.  */
export type EntityBodyView = 'people' | 'videos' | 'photos';

/** 名册: 随资料uno起abajo来eseuno批. `kind` 按索引página词表给: Agenciapáginaes `performers`, 
 *  片商páginaes `studios`; 版读es索引página同unoConfiguración值.  */
export interface EntityRoster {
  kind: 'performers' | 'studios';
  people: IndexPerson[];
  layout: PeopleLayout;
}

/** 卡片ese几段遗Deja层 HTML, exterior加名册uno格取Imagen(遗Deja层 `personRingHtml` ese回落链).  */
export interface EntityBodyHelpers extends MediaCardHelpers {
  personAvatar(item: IndexPerson, entityKind: string, big: boolean): PersonAvatar;
}

/** 名Siguiente部ObrasOficial样(`/api/photos`  `sets` dentro `kind` Como `code` ese几). 样地址DejaEn
 *  服务端, Muro y 灯箱Solo递Código JAVy序号.  */
export interface EntityCodeSet {
  code: string;
  name?: string;
  n: number;
  release_date?: string;
  site_label?: string;
}

/** 本地Imagen片uno(`/api/photos`, `/api/photo-set`  `items`). CompletoOriginal样递给灯箱Detalles.  */
export interface EntityLocalPhoto { id: number; name?: string; [field: string]: unknown }

/** 样uno格. grandeImageny缩略Imagen地址按Código JAVy序号由服务端查(`sampleQuery`).  */
export interface EntitySamplePhoto {
  sample: true;
  code: string;
  position: number;
  total: number;
  name: string;
  source: string;
}

export type EntityWallPhoto = EntityLocalPhoto | EntitySamplePhoto;

/** 照片视Imagenesteuno屏. `codeSets` SoloEnCompleto组照片dentroCon(DirectorioImagen集dentroes空), 各段排En本地Imagen片anterior面; 
 *  `items` es本地Imagen片dentroya经取回ese些, 翻página往posteriorcontinuar; `total` es本地Imagen片Total数, 段头读它. 
 *  `revision` esesteuno屏代次: 换uno批, 进出Imagen集时加uno, Muro从头画, 续páginaSolo追加No换代.  */
export interface EntityPhotos {
  revision: number;
  codeSets: EntityCodeSet[];
  items: EntityLocalPhoto[];
  total: number;
  hasMore: boolean;
}

export type PhotoSize = 'small' | 'big';
export type PhotoLayout = 'fixed' | 'masonry';

/** 卡片en la动作, exterior加照片Muroese两样. 名册uno格点开走es其en proceso `openEntity`.  */
export interface EntityBodyActions extends MediaCardActions {
  /** 灯箱dentro本地Imagen片eseuno"En资源GestionarDispositivoen proceso显示". Éxito由壳发回执, Fallo回uno句Original因.  */
  revealSource(id: number): Promise<string>;
  /** 本地Imagen片Siguientepágina. 壳取回posterior推uno更largo `photos` 进来; 取No到就抛错, Claveabajo出Reintentar.  */
  loadMorePhotos(): Promise<void>;
}

/** 从卡片CuadrículaOriginal样递进去ese几样: 版, SeleccionarEstado, 缓存y骨架都es壳dentro同uno.  */
type SharedGridProps = Pick<CatalogGridProps,
  'layout' | 'selectMode' | 'selected' | 'seekSeconds' | 'wireDrag' | 'skeletonHtml'
  | 'groupCollapse' | 'canLoadMore' | 'listScope'>;

export interface EntityBodyProps extends SharedGridProps {
  kind: string;
  name: string;
  view: EntityBodyView;
  /** SoloConAgenciay片商páginaCon; 别página面, 或esteuno批es空时候es `null`.  */
  roster: EntityRoster | null;
  /** Obras视ImagenNo.unopágina. `null` es壳En curso取(换Filtrar, Ordenar或观verEstado): esteuno格铺骨架etc.它, 
   *  No跟头arribaFiltrar对Noen laantiguo卡片DejaEn屏幕arriba.  */
  items: MediaPage | null;
  /** ObrasLista代次. 壳每发起uno次NuevoObrasPor favor求就加uno, Cuadrícula按它换Clave, 骨架y续página都从头Empezar.  */
  revision: number;
  /** 续página. FiltraryOrdenar由壳En闭包dentro带着,  y No.unopágina同uno套口径.  */
  fetchPage: NonNullable<CatalogGridProps['fetchPage']>;
  /** 照片视Imagenesteuno屏; 还没进过照片视Imagen时es `null`.  */
  photos: EntityPhotos | null;
  /** 照片MuroTamaño档y版. 开关画EnFiltrar浮层y顶栏dentro, aquíSolo读, 标EnMuro `data-size`/`data-layout` arriba.  */
  photoSize: PhotoSize;
  photoLayout: PhotoLayout;
  helpers: EntityBodyHelpers;
  actions: EntityBodyActions;
}
