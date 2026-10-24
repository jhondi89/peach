/* 关注来源en la两词表: 来源dentro出现过创作者, yarriba游 booru 给Entrada打Etiqueta. 
 *
 * 两都归关注eseuno侧: 它们数es还没入BibliotecaEn线Actualizar, 点开去也es关注página. 艺人yEtiqueta两
 * 索引páginaSoloes它们摆成名册 y 字母表, 所以Clave建Enaquí, No建En索引模dentro: 哪天关注página也要摆
 * 同uno词表, 读就es同uno `queryKey`. 
 *
 * 分página照 `/api/index` 形状: `limit`/`offset` 翻página, Respuesta带 `has_more`.  */
import { apiGet } from '../../api';

export const FOLLOW_AUTHORS_URL = '/api/follow/authors';
export const FOLLOW_TAGS_URL = '/api/follow/tags';

/** 来源en launo创作者. `key` es关注páginaFiltrar用ese套创作者Clave: 建过档es `entity:<id>`, 
 *  还没建档按名字归组. `held_by` esDatosBibliotecadentro同名ese创作者, etc.用户Eneseunopágina认过才绑定.  */
export interface OnlineAuthor {
  k: string;
  key: string;
  n: number;
  entity_id: number | null;
  held_by: string;
  /** Oficial主páginaen laAvatar; 取No到时es空串.  */
  avatar: string;
  /** 归档站Avatar, 主páginaeseFallo时换它.  */
  avatar_fallback: string;
  providers: string[];
}

export interface OnlineAuthorsPage {
  items: OnlineAuthor[];
  has_more: boolean;
  total?: number;
}

/** arriba游 booru unoEtiqueta. `cat` esarriba游 tag_type(general/artist/character/copyright/metadata).  */
export interface OnlineTag {
  k: string;
  n: number;
  cat: string;
}

export interface OnlineTagsPage {
  items: OnlineTag[];
  has_more: boolean;
  categories?: Record<string, number>;
}

export const onlineAuthorsKey = (q: string) => ['follow', 'authors', q] as const;
export const onlineTagsKey = (q: string, type: string) => ['follow', 'tags', q, type] as const;

export function onlineAuthorsUrl(q: string, limit: number, offset: number): string {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (q) params.set('q', q);
  return `${FOLLOW_AUTHORS_URL}?${params}`;
}

/** `type` Como `all` 时No带esteuno项: 服务端缺省就esTodoTipo.  */
export function onlineTagsUrl(q: string, type: string, limit: number, offset: number): string {
  const params = new URLSearchParams({ types: 'all', limit: String(limit), offset: String(offset) });
  if (type && type !== 'all') params.set('type', type);
  if (q) params.set('q', q);
  return `${FOLLOW_TAGS_URL}?${params}`;
}

export const fetchOnlineAuthors = (q: string, limit: number, offset: number, signal?: AbortSignal) =>
  apiGet<OnlineAuthorsPage>(onlineAuthorsUrl(q, limit, offset), signal);

export const fetchOnlineTags = (q: string, type: string, limit: number, offset: number, signal?: AbortSignal) =>
  apiGet<OnlineTagsPage>(onlineTagsUrl(q, type, limit, offset), signal);
