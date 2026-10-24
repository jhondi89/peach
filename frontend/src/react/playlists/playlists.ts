/* ReproducirListapáginaDatos契约ytres写操作. 
 *
 * 读 `/api/playlists`(`src/peach/web_playlists.py`  `q_playlists`, 按Reciente改动排), 写uno律
 * POST `/api/playlist`. 写端点回es带 `items` CompletoLista, NoesListapáginaeseuno行形状, 
 * 改名还会动 `updated_at`, 换掉Ordenar, 所以写完uno律让ListaClavepesado取, No拿回话拼缓存. 
 *
 * primeropágina存完uno Mix 再进来要ver得到它: primero屏 `prefetch` 每次都向服务端pesado取, No读缓存dentro
 * Anterior次eseuno.  */
import { apiGet, apiSend } from '../../api';
import { queryClient } from '../query';

export const PLAYLISTS_URL = '/api/playlists';
export const PLAYLIST_URL = '/api/playlist';
export const PLAYLISTS_KEY = ['playlists'] as const;

/** Lista卡署名: Listadentro出镜最másese几(服务端最más给tres).  */
export interface PlaylistFace {
  kind: string;
  id: number;
  name: string;
  has_image: boolean;
  image_version?: string;
  avatar_focus?: unknown;
}

/** `/api/playlists` uno行.  */
export interface PlaylistRow {
  id: number;
  name: string;
  /** `mix` es从 Mix 存abajo来, 其余es手动建.  */
  source_kind: string;
  source_seed_asset_id: number | null;
  current_asset_id: number | null;
  created_at: string;
  updated_at: string;
  item_count: number;
  /** 静止Portada: 续播点eseuno, Sin续播点时esNo.uno. 空Listaes null.  */
  preview_asset_id: number | null;
  /** Pasar el ratón时翻过Portada, 续播点eseEn最anterior, 最máscinco.  */
  preview_ids: number[];
  faces: PlaylistFace[];
}

export interface PlaylistsData { items: PlaylistRow[] }

/** `/api/playlist?id=` y写端点回话en laeseunoCompletoLista. esteunopáginaSolo用得到abajo面几项.  */
export interface PlaylistDetail {
  id: number;
  name: string;
  source_kind: string;
  source_seed_asset_id: number | null;
  current_asset_id: number | null;
  items: { id: number }[];
}

export const fetchPlaylists = (signal?: AbortSignal) => apiGet<PlaylistsData>(PLAYLISTS_URL, signal);

/** primero屏. `staleTime: 0` 写明: 缓存dentroConAnterior次Lista也照样pesado取.  */
export async function prefetchPlaylists(signal: AbortSignal): Promise<void> {
  await queryClient.fetchQuery({ queryKey: PLAYLISTS_KEY, queryFn: () => fetchPlaylists(signal), staleTime: 0 });
}

/** 写完之posteriorpesado读Lista.  */
export const refreshPlaylists = () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY, exact: true });

/** 点卡片从哪unocontinuar着播: 续播点, Sin就esNo.uno. 空ListaSin去处.  */
export const resumeAssetId = (row: PlaylistRow) => row.current_asset_id || row.preview_asset_id || null;

export const posterUrl = (id: number) => `/poster?id=${id}&c=4`;

type Written = { ok: true; playlist: PlaylistDetail };

export const createPlaylist = (name: string) =>
  apiSend<Written>(PLAYLIST_URL, { action: 'create', name, asset_ids: [] });

export const renamePlaylist = (id: number, name: string) =>
  apiSend<Written>(PLAYLIST_URL, { action: 'rename', id, name });

export const deletePlaylist = (id: number) =>
  apiSend<{ ok: true; deleted: number }>(PLAYLIST_URL, { action: 'delete', id });

/** 删之anterior先contenido取回来: `delete` 连 playlist_item uno起清, 删完就Sin地方能问出esteLista
 *  装着哪些视频. 取No到就es null, eseuno次EliminarNo给Deshacer.  */
export const keepPlaylist = (id: number): Promise<PlaylistDetail | null> =>
  apiGet<PlaylistDetail>(`${PLAYLIST_URL}?id=${id}`).catch(() => null);

/** DeshacerEliminar: pesado建unoNuevoRegistro, 装同uno批视频, 同uno来源. Mix SemillaNoEnListadentro就No带, 
 *  服务端要求Semilla必须EnListaen proceso.  */
export function recreatePlaylist(kept: PlaylistDetail) {
  const ids = (kept.items || []).map((entry) => entry.id);
  const seed = kept.source_seed_asset_id;
  return apiSend<Written>(PLAYLIST_URL, {
    action: 'create', name: kept.name, asset_ids: ids, source_kind: kept.source_kind,
    source_seed_asset_id: seed !== null && ids.includes(seed) ? seed : null,
  });
}
