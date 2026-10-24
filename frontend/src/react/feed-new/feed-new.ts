/* no入BibliotecaNuevas obraseseuno行(ADR-0042): primeropáginaeseuno行y资料páginaeseuno行共用取数, ConsultaClavey写操作. 
 *
 * 两行读同uno端点(`/api/feeds/discoveries`), 资料páginamás带uno `entity`; ConsultaClave同族
 * (`['feed-new', 实体 id | 'home']`), uno处改合集开关, 按 `['feed-new']` uno次就能两行都作废. 
 * 卡片 HTML 仍由壳拼(`feedRowHtml`): Portada取景, 版次字样yeseConectarMétodo Note 都es遗Deja层
 * eseuno, 取ImagenFallo时兜底链也直continuar改节点.  */
import { api } from '@peach/legacy/core';

import { queryClient } from '../query';

/** `/api/feeds/discoveries` 回话: EntradayRecienteuno轮取Portada断EnConectaren la部数.  */
export interface FeedDiscoveries { items?: { id: number; has_cover?: boolean; cover_fetching?: boolean }[]; cover_network?: number }

/** Nuevas obraseseuno行取回来样子: Entrada(Solo用来判ConSin)y壳拼bienCompleto段 HTML.  */
export interface FeedNew {
  items: { id: number }[];
  html: string;
  fetching?: boolean;
}

/** 壳拼Completo段 HTML: 连NoarribaImagen片Anfitrión时 Note yuno排卡(`feedNewCardHtml`).  */
export type FeedRowHtml = (data: FeedDiscoveries | null) => string;

/** 资料páginaeseuno行用实体 id, primeropáginaeseuno行No分人.  */
export const feedNewKey = (entityId: number | null) => ['feed-new', entityId ?? 'home'] as const;

const FEED_SKELETON_CARDS = 8;
const FEED_COVER_WAIT = 1500;

/** uno段 HTML dentro头 `count` Imagen先取进缓存, 最másetc. `ms` 毫秒. 插进página面时它们ya经 `complete`, 
 *  遗Deja层Esperando微光No再给它们挂arriba.  */
export function preloadImages(html: string, count: number, ms: number): Promise<unknown> {
  const probe = document.createElement('template');
  probe.innerHTML = html;
  const loads = [...probe.content.querySelectorAll('img[src]')].slice(0, count).map((source) => {
    const img = new Image();
    img.referrerPolicy = source.getAttribute('referrerpolicy') || '';
    img.src = source.getAttribute('src') || '';
    return img.decode().catch(() => {});
  });
  return Promise.race([Promise.all(loads), new Promise((resolve) => { setTimeout(resolve, ms) })]);
}

/** 拉取由定时Dispositivo做, página面Solo读ya经发现ese些: 进esteunopágina顺手发uno轮Por favor求, etc.于每次Actualizar都变成对别人
 *  服务Dispositivouno次拉取. 骨架还占着时(primero屏)先头几Portada取到手再Completo行换掉: 否则骨架退场, 真卡进来, 
 *  Portada格dentro又esuno轮微光, 同uno行etc.两遍. lentoese几Noetc.满, 到点照换.  */
export async function fetchFeedNew(entityId: number | null, rowHtml: FeedRowHtml, preload: boolean): Promise<FeedNew> {
  const query = new URLSearchParams({ limit: '12' });
  if (entityId) query.set('entity', String(entityId));
  const data = await (api(`/api/feeds/discoveries?${query}`).catch(() => null) as Promise<FeedDiscoveries | null>);
  const ok = data && !(data as { error?: string }).error ? data : null;
  const items = ok?.items || [];
  const html = rowHtml(ok);
  if (preload && items.length) await preloadImages(html, FEED_SKELETON_CARDS, FEED_COVER_WAIT);
  return { items, html, fetching: items.some(item => item.cover_fetching && !item.has_cover) };
}

export const feedNewOptions = (entityId: number | null, rowHtml: FeedRowHtml, preload = false) => ({
  queryKey: feedNewKey(entityId),
  queryFn: () => fetchFeedNew(entityId, rowHtml, preload),
  staleTime: Infinity,
  refetchInterval: (query: { state: { data?: FeedNew } }) => query.state.data?.fetching ? 2000 : false,
});

/** 卡arribaesetresClave(想要, No想ver, 标Comoyaver过). 都esEtiqueta, 写Fallo卡片照样换样子: esteuno行abajo次取数时
 *  会按服务端现状pesado排.  */
export const postFeedAction = (feedId: number, action: string): Promise<void> =>
  (api('/api/feeds/discovery', { method: 'POST', body: JSON.stringify({ action, ids: [feedId] }) }) as Promise<unknown>)
    .then(() => undefined, () => undefined);

/** primeropáginaeseuno行(`feed-new` island). 宿主es `index.html` dentroese常驻 `#feedNew`: 岛根挂En它
 *  dentro面 `.peach-react` arriba, 卡片 portal 回宿主本身, 落En Preflight Rangoexterior.  */
export interface FeedNewProps {
  host: HTMLElement;
  /** 合集开关改就换uno代次, esteuno行照Nuevo筛法pesado取.  */
  revision: number;
  helpers: {
    feedRowHtml: FeedRowHtml;
    /** 拖动, 滚轮, 按Configuracióncontinuar自动滚动.  */
    wireFeedRow(row: Element | null): void;
  };
  actions: {
    /** esteuno行ConSin卡: 取回来, 或最posterioruno被收起时报uno次, 壳按它决定abajo次进primeropágina铺No铺骨架.  */
    settled(hasItems: boolean): void;
  };
}

/** 每次进Directoriopágina都esNuevouno趟(y资料página同uno口径): 先清掉Anterior次缓存, 骨架还占着就连头几
 *  Portadauno起etc..  */
export async function prefetchFeedNew(props: FeedNewProps): Promise<void> {
  queryClient.removeQueries({ queryKey: feedNewKey(null) });
  await queryClient.fetchQuery(feedNewOptions(null, props.helpers.feedRowHtml,
    props.host.getAttribute('aria-busy') === 'true'));
}
