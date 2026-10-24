/* 实体资料página(路由树画进 `#index`, 见 `router/managed-routes.tsx`  `ENTITY_ROUTES`): Datos形状, 
 * ConsultaClaveyprimero屏取数. 
 *
 * 资料卡, Filtrar浮层, Nuevas obraseseuno行y正文es同unopáginacuatro, 读es同unopáginainteriorEstado(esteunopáginaFiltrar, 当anterior
 * 视Imagen, 照片Muro翻到哪儿), 所以es同uno组件; cuatro各自宿主由壳En `#index` dentro排bien, página面画进资料卡
 * eseuno格, 再用 portal 画进另exteriortres. 取数TodoEnaquí: `/api/entity`, Nuevas obras, Obrasy照片由página面按ConsultaClave取, 
 * 地址栏esFiltrary视Imagen唯uno真相源, 归壳写—página面改FiltrarSolo调 `actions.route`, 壳写bien地址再经
 * `updateManagedRoute` Nuevo `filters`/`media` 推回来, página面按NuevoClavepesado取. 
 *
 * primero屏仍由壳铺骨架(profundo链冷启动时 React 包还没到, 骨架Solo能由壳画), `prefetch` cuatro样取齐再画, 
 * 骨架yCompletopáginauno次换掉; páginainterior换Filtrar时Obras区骨架归正文eseuno格自己(`useSkeletonReveal`).  */
import { api } from '@peach/legacy/core';

import type { CatalogGridProps, MediaPage } from '../catalog-grid/types';
import type { EntityBodyActions, EntityBodyHelpers, EntityCodeSet, EntityLocalPhoto, PhotoLayout, PhotoSize } from '../entity-body/entity-body';
import type { EntityComboItem, EntitySortKey, EntityView, SegmentOption } from '../entity-filter/entity-filter';
import type { FollowFeedActions, FollowFeedHelpers } from '../follow-feed/follow-feed';
import type { EntityHeroData, HeroCostar } from '../entity-hero/entity-hero';
import { feedNewKey, feedNewOptions, type FeedRowHtml } from '../feed-new/feed-new';
import type { IndexPerson, PeopleLayout } from '../index/index-data';
import { queryClient } from '../query';

/** 地址栏arribaesteunopáginaFiltrar, Clave同壳 `ENTITY_FILTER_KEYS`.  */
export const ENTITY_FILTER_KEYS = ['loc', 'creator', 'tag', 'state', 'dur_min', 'dur_max', 'orient', 'sort', 'dir'] as const;
export type EntityFilters = Readonly<Record<string, string>>;

/** 地址栏en la媒体视Imagen: `media=photos`, `media=online` yDirectorioImagen集 `set=<id>`. 名册No进地址栏, 见 `rosterView`.  */
export interface EntityMedia { media: 'videos' | 'photos' | 'online'; set: number }
export const EMPTY_MEDIA: EntityMedia = { media: 'videos', set: 0 };

/** `/api/entity` dentroesteunopágina读到字段: 资料卡ese, exterior加Etiqueta计数y名册. 名字对Noarriba时回 `{error}`.  */
export interface EntityPageData extends EntityHeroData {
  error?: string;
  redirect?: { kind: string; name: string; id?: number };
  tags?: { k: string; n: number }[];
  related_performers?: (HeroCostar & IndexPerson)[];
  labels?: IndexPerson[];
  has_image?: boolean;
  image_version?: string;
  has_avatar?: boolean;
  avatar_stand_in?: boolean;
  has_logo?: boolean;
  representative_asset_id?: number | null;
  avatar_focus?: unknown;
  mark_link_id?: number | null;
}

/** `/api/photos`, `/api/photo-set` unopágina. `sets` dentro `kind` Como `code` es名abajoObrasOficial样.  */
export interface PhotoPage {
  error?: string;
  id?: number | string;
  title?: string;
  total?: number;
  sample_total?: number;
  sets?: (EntityCodeSet & { kind?: string })[];
  items?: EntityLocalPhoto[];
  has_more?: boolean;
  seed?: string;
}

/** 写操作y站interiorSaltar adentro仍归壳ese几样: 地址, Confirmar弹层表单, Todo站回执yFiltrar唯uno落点.  */
export interface EntityPageActions {
  /** 换视Imagen, 换观verEstado: 壳写bien地址再Nuevo `filters`/`media` 推回来.  */
  route(filters: EntityFilters, media: EntityMedia): void;
  /** Etiqueta, 交集en launoy"TodoBorrar": 走壳dentroFiltrar唯uno落点(`commitContextFilter`).  */
  toggleTag(tag: string): void;
  clearFilter(key: string): void;
  clearAll(): void;
  /** OrdenarClave: 点no选en proceso项换列, 点选en proceso项翻方向, 判据同primeropáginaeseuno排.  */
  setSort(key: string): void;
  /** Obras视Imagen换uno批: SemillaesTodo站eseuno粒(`state.seed`), 壳换bien, 写bien地址再推回来; 回esNuevoSemilla, 
   *  página面据此先eseunopágina取到手, Claveen la转圈etc.就esesteuno趟.  */
  reshuffleVideos(): string;
  setJavLayout(layout: string): void;
  setPhotoLayout(layout: string): void;
  /** 站interiorSaltar a, 走遗Deja路由同uno入口.  */
  openEntity(kind: string, name: string, replace?: boolean): void;
  /** esteunopáginaesNoes JAV 语境(按No.unopáginaObras `is_jav` 推): 壳Ordenar项, 侧栏取数y卡片版都读它.  */
  javContext(on: boolean): void;
  /** 换视Imagen或换uno批contenido: 壳pesado算吸顶, 顶栏TamañoImagenClave按esNoes照片Muro(`wall`: 照片视Imagen, 或En线
   *  视Imagen摆着Imagen片)换成对应eseuno组.  */
  painted(view: EntityView, wall: boolean): void;
  /** 名字对Noarriba任何uno(`/api/entity` 回 `{error}`): 壳Completo换成空态.  */
  missing(): void;
  /** 换过Avatar: 壳丢掉自己缓存着ese几排Avatar(顶部tres), abajo次画时按NuevoVersión号pesado取.  */
  avatarChanged(): void;
  /** 去关注página, Soloveresteuno名abajo来源Actualizar(名册En线档eseuno格点开同uno入口).  */
  openFollowAuthor(key: string): void;
}

/** 仍由遗Deja层拼 HTML ycontinuar线.  */
export interface EntityPageHelpers {
  /** grandeeseImagen(`entityFaceImg`): 取No到就es空串, primero字母垫底.  */
  portraitImg(kind: string, entity: EntityPageData): string;
  /** 横滚行continuararriba拖动y滚轮(`wireDrag`).  */
  wireDrag(row: Element | null): void;
  /** Solocontinuar滚轮y两端渐隐(`wireHorizontalScroller`).  */
  wireScroller(row: Element | null): void;
  /** Nuevas obraseseuno行: 拖动, 滚轮, 按Configuracióncontinuar自动滚动.  */
  wireFeedRow(row: Element | null): void;
  /** Nuevas obraseseuno行Completo段 HTML: 连NoarribaImagen片Anfitrión时 Note yuno排卡(`feedNewCardHtml`).  */
  feedRowHtml: FeedRowHtml;
  /** 操作回执(`actionReceipt`), 给 `undo` 就带unoDeshacerClave.  */
  receipt(message: string, options?: { undo?: () => Promise<void> }): void;
  /** Fallo回执(`actionFailure`).  */
  failure(label: string, error: unknown): void;
  /** "添加别名"弹层: 表单y回执En壳dentro, 写回交给 `write`(página面 mutation, Éxitoposteriorpesado取资料yObras).  */
  aliasForm(mine: string[], write: (payload: { alias: string; remove?: boolean }) => Promise<{ added?: boolean; alias?: string }>): Promise<void>;
  /** Imagen集ese两源ArchivoClave; `done` En对账改动esteuno组之posteriorpesado取它.  */
  sourceToolsHtml(setId: number): string;
  wireSourceTools(root: Element, done: () => void): void;
  /** 交集en laese几, 清单同primeropáginaese(`comboItems`).  */
  comboItems(filters: EntityFilters): EntityComboItem[];
  /** OrdenarClave: JAV 语境abajomásunoLanzamientoTiempo.  */
  sortKeys(sort: string, dir: string, jav: boolean): EntitySortKey[];
}

/** 卡片CuadrículaOriginal样要ese几样, 壳dentro同uno: 版, SeleccionarEstadoy展示Configuración由 `updateManagedRoute` 推最Nuevo值.  */
type SharedGridProps = Pick<CatalogGridProps,
  'layout' | 'selectMode' | 'selected' | 'seekSeconds' | 'wireDrag' | 'skeletonHtml'
  | 'groupCollapse' | 'canLoadMore'>;

/** 壳En `#index` dentro排biencuatro宿主(página面画进资料卡eseuno格). Filtrar浮层y正文各带uno层
 *  `.peach-react`, Nuevas obraseseuno行es遗Deja层卡片, 宿主NoEn React 子树样Rangodentro.  */
export interface EntityPageHosts { filter: Element; feed: HTMLElement; body: Element }

export interface EntityPageProps extends SharedGridProps {
  kind: string;
  resolvedEntity?: EntityPageData;
  /** 路由通过实体 ID 取得Normalizar名.  */
  name: string;
  filters: EntityFilters;
  media: EntityMedia;
  /** Todo站 JAV 开关(`state.jav==='1'`): 资料página继承它.  */
  jav: boolean;
  /** Todo站eseuno粒AleatorioSemilla(`state.seed`), OrdenarComo `seed` 时随ObrasPor favor求带arriba.  */
  seed: string;
  /** 批量操作posterior要求pesado读Obras代次: 加uno就换Clavepesado取.  */
  revision: number;
  /** 合集开关改要求pesado取Nuevas obras代次.  */
  feedRevision: number;
  photoSize: PhotoSize;
  photoLayout: PhotoLayout;
  /** 关注Imagen片Muro"仅显示Imagen片"(`followImagesOnly`), En线视Imageny关注página共用esteunoConfiguración.  */
  followImagesOnly: boolean;
  /** JAV 卡片版现值ypuedeOpciones.  */
  javLayout: string;
  javLayouts: readonly SegmentOption[];
  photoLayouts: readonly SegmentOption[];
  /** cuatro观verEstado, 清单同primeropáginaeseuno排(`VIEW_PILLS`).  */
  states: readonly { k: string; label: string }[];
  /** 名册uno格版, 读es索引página同unoConfiguración值.  */
  peopleLayout: PeopleLayout;
  hosts: EntityPageHosts;
  /** 卡片en la助手y动作就esDirectorioeseuno; 照片Muromásuno定源Archivo.  */
  card: { helpers: EntityBodyHelpers; actions: Omit<EntityBodyActions, 'loadMorePhotos'> };
  /** En线视Imagenen la关注卡: 骨架, 拖动yProgreso同关注páginaeseuno; 动作es资料página语境uno, 换Filtrar, 侧栏, 
   *  más选yImagen片偏bien都Nocontinuar(esteunopáginaNo画关注página侧栏, más选认es本地Obras).  */
  follow: { helpers: FollowFeedHelpers; actions: FollowFeedActions };
  helpers: EntityPageHelpers;
  actions: EntityPageActions;
}

export const entityKey = (kind: string, name: string) => ['entity', kind, name] as const;
export const entityItemsKey = (kind: string, name: string, query: string, revision: number) =>
  ['entity-items', kind, name, query, revision] as const;
export const entityPhotosKey = (kind: string, name: string, set: number, seed: string) =>
  ['entity-photos', kind, name, set, seed] as const;

const tagList = (value: string | undefined) => String(value || '').split(',').filter(Boolean);
export const tagPressed = (value: string | undefined, tag: string) => tagList(value).includes(tag);
export { tagList };

/** ObrasPor favor求Parámetro, No.unopáginay续página同uno套口径(`offset` 之exterior). 资料página继承 JAV 开关: Actrizpágina y Sellopágina
 *  同样es按Código JAVExplorar语境.  */
export function itemsParams(kind: string, name: string, filters: EntityFilters, opts: { jav: boolean; seed: string },
  offset = 0): URLSearchParams {
  const p = new URLSearchParams();
  p.set(kind, name);
  if (kind === 'tag') {
    p.set('tag', [...new Set([name, ...tagList(filters.tag)])].join(','));
    p.set('tag_match', 'all');
  }
  p.set('limit', '48');
  p.set('offset', String(offset));
  p.set('sort', filters.sort || 'new');
  if (filters.dir) p.set('dir', filters.dir);
  if (filters.sort === 'seed') p.set('seed', opts.seed);
  if (offset) p.set('count', '0');
  for (const key of ENTITY_FILTER_KEYS) {
    if (filters[key] && key !== kind && key !== 'sort') p.set(key, filters[key]!);
  }
  if (opts.jav) p.set('jav', '1');
  return p;
}

export async function fetchItems(kind: string, name: string, filters: EntityFilters, opts: { jav: boolean; seed: string },
  offset: number, signal?: AbortSignal, options?: { limit: number; sort?: string; dir?: string }): Promise<MediaPage> {
  const params = itemsParams(kind, name, filters, opts, offset);
  if (options) {
    params.set('limit', String(options.limit));
    params.delete('count');
    if (options.sort) params.set('sort', options.sort);
    if (options.dir) params.set('dir', options.dir);
  }
  return await api(`/api/items?${params}`, signal ? { signal } : {}) as MediaPage;
}

/** 同unopáginadentro换回ver过eseunoFiltrarNo再Por favor求: 每次进página先esteuno名abajo缓存清掉(`prefetch`), páginainterior
 *  unoFiltrarSolo取uno次; 批量操作posterior换代次pesado取.  */
export const itemsOptions = (props: Pick<EntityPageProps, 'kind' | 'name' | 'filters' | 'jav' | 'seed' | 'revision'>) => {
  const opts = { jav: props.jav, seed: props.seed };
  const query = itemsParams(props.kind, props.name, props.filters, opts).toString();
  return {
    queryKey: entityItemsKey(props.kind, props.name, query, props.revision),
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchItems(props.kind, props.name, props.filters, opts, 0, signal),
    staleTime: Infinity,
  };
};

export const entityOptions = (kind: string, name: string) => ({
  queryKey: entityKey(kind, name),
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    api(`/api/entity?kind=${encodeURIComponent(kind)}&name=${encodeURIComponent(name)}`, { signal }) as Promise<EntityPageData>,
  staleTime: Infinity,
});

/** 照片unopágina地址. Completo组照片No.unopágina沿用壳en la口径(No带 limit, 换uno批才带Semilla); Imagen集y续páginaPor página 120.  */
function photoUrl(kind: string, name: string, set: number, seed: string, offset: number, pageSeed: string) {
  const who = `kind=${encodeURIComponent(kind)}&name=${encodeURIComponent(name)}`;
  if (offset) {
    const tail = `&limit=120&offset=${offset}${pageSeed ? `&seed=${encodeURIComponent(pageSeed)}` : ''}`;
    return set ? `/api/photo-set?id=${set}${tail}` : `/api/photos?${who}${tail}`;
  }
  const shuffled = seed ? `&seed=${encodeURIComponent(seed)}` : '';
  if (set) return `/api/photo-set?id=${set}&limit=120${shuffled}`;
  return seed ? `/api/photos?${who}&limit=120${shuffled}` : `/api/photos?${who}`;
}

type PhotoParam = { offset: number; seed: string } | null;

/** 照片Muro: uno屏esuno组Sin限Consulta, 翻páginaSolo数本地Imagen片(样uno次铺完). 换uno批换uno粒Semilla, 就es换unoClave. 
 *  取No到(`{error}`)时esteunopágina当作Sin照片, No让Completopágina停En骨架arriba.  */
export const photosOptions = (kind: string, name: string, set: number, seed: string) => ({
  queryKey: entityPhotosKey(kind, name, set, seed),
  queryFn: async ({ pageParam }: { pageParam: PhotoParam }): Promise<PhotoPage> => {
    const page = await (api(photoUrl(kind, name, set, seed, pageParam?.offset || 0, pageParam?.seed || '')) as Promise<PhotoPage>)
      .catch((error: unknown) => {
        if (pageParam) throw error;
        return { error: String(error) } as PhotoPage;
      });
    if (pageParam && page.error) throw new Error(page.error);
    return page;
  },
  initialPageParam: null as PhotoParam,
  getNextPageParam: (last: PhotoPage, pages: PhotoPage[]): PhotoParam | undefined => (last.has_more && !last.error
    ? { offset: pages.reduce((sum, page) => sum + (page.items || []).length, 0), seed: pages[0]?.seed || '' }
    : undefined),
  staleTime: Infinity,
});

export const codeSetsOf = (page: PhotoPage | null | undefined): EntityCodeSet[] =>
  page && !page.error ? (page.sets || []).filter((set) => set.kind === 'code') : [];

/** 每次进esteunopágina都esNuevouno趟: 先清掉esteuno名abajo缓存, 再资料(连同Nuevas obras), ObrasNo.unopáginay照片
 *  y行取齐, profundo链落EnunoImagen集arriba时连eseuno组uno起取. cuatro样齐路由树(`openManagedRoute`)uno次换掉骨架.  */
export async function prefetchEntityPage(props: EntityPageProps): Promise<void> {
  const { kind, name } = props;
  for (const head of ['entity', 'entity-items', 'entity-photos'] as const) {
    queryClient.removeQueries({ queryKey: [head, kind, name] });
  }
  if (props.resolvedEntity?.id) queryClient.setQueryData(entityKey(kind, name), props.resolvedEntity);
  await Promise.all([
    queryClient.fetchQuery(entityOptions(kind, name)).then((entity) => {
      if (!entity || entity.error || !entity.id) return null;
      queryClient.removeQueries({ queryKey: feedNewKey(Number(entity.id)) });
      return queryClient.fetchQuery(feedNewOptions(Number(entity.id), props.helpers.feedRowHtml, true));
    }),
    queryClient.fetchQuery(itemsOptions(props)),
    queryClient.fetchInfiniteQuery(photosOptions(kind, name, 0, '')),
    props.media.media === 'photos' && props.media.set
      ? queryClient.fetchInfiniteQuery(photosOptions(kind, name, props.media.set, '')) : null,
  ]);
}
