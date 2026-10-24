/* primeropáginaFiltrar栏y侧栏读ese两聚合: `/api/facets`(侧栏各组yEtiqueta) y  `/api/tops`(Actriz, Sello两排). 
 * 存En todo站eseuno `QueryClient` dentro(`@peach/query`), 壳启动时直continuar取, Noetc. React 包. 
 *
 * 两Clave, Parámetro串都由壳按当anterior语境算bien递进来, Consulta函数No读壳变量: 
 * - `['facets', 口径串, 代次]`: 口径es JAV, 资料página或DetallesRango, Estadopáginayeseuno组Filtrar. 
 * - `['tops', Parámetro串, 口径串, 代次]`: Parámetro串esPor favor求方传eseuno(数, Semilla, JAV, Estadopágina), 回退到TodoBiblioteca口径
 *   之posteriorClave也No变. Clavedentro另带口径串: 两esuno对, 口径uno变两uno起pesado取, 侧栏Actualizar计数时arriba面ese两排也照样取uno次. 
 * - `['tops', Parámetro串, 代次]`: 续página(Parámetro串带 `page`). 回包Solo由Parámetro串决定, 两排同时要同unopáginaSolo发uno次. 
 *
 * 同uno口径 30 秒interior直continuar复用, 同时要同unoSolo发uno次Por favor求. 写操作, 换uno批, 回到primeropágina由壳调 `dropBars()`: 
 * 代次加uno, Siguiente次uno定真发Por favor求; 路arribaeseuno趟照样交给En cursoetc.它调用方.  */
import { api } from '@peach/legacy/core';

import { queryClient } from './query';

/** 两聚合复用más久: 换página回来Nopesado取, medio分钟posterior再进página就按NuevoDatosBiblioteca取.  */
export const BARS_STALE_MS = 30_000;

let revision = 0;

export const facetsKey = (scope: string, generation = revision) => ['facets', scope, generation] as const;
export const topsKey = (params: string, scope: string, generation = revision) =>
  ['tops', params, scope, generation] as const;
export const topsPageKey = (params: string, generation = revision) => ['tops', params, generation] as const;

export interface TopsData { performers: unknown[]; studios: unknown[]; [field: string]: unknown }
export type FacetsData = Record<string, unknown>;

/* Estadopágina顶部两排收estrecho到本página口径, ComoesNo列出"EnesteunopáginaunoObras都Sin"人 y Sello. pero集合estrecho到聚合
   ResultadoComo空时("yaEtiqueta"常年SoloCon几), 收estrecho就Completo排unoy收走: 同unoFiltrararriba换uno格, página面顶arriba凭空menos两层, 
   读起来es跳去另unopágina面而Noes换Filtrar. 空就退回TodoBiblioteca口径. esteuno排点开es实体página, 本来就要离开当anterior
   Estado, 它回答从来Noes"esteunopáginadentroCon谁", 而es"continuarabajo来去ver谁". 续página(壳 `moreTops`)也走aquí.  */
export async function loadTops(params: string | URLSearchParams): Promise<TopsData> {
  const query = String(params);
  const scoped = await api(`/api/tops?${query}`) as TopsData;
  const wide = new URLSearchParams(query);
  if (scoped.performers.length || scoped.studios.length || !wide.has('state')) return scoped;
  wide.delete('state');
  return await api(`/api/tops?${wide}`) as TopsData;
}

/** 两uno起取, 各自命en proceso各自缓存; 壳etc.两都到再uno次画完.  */
export function fetchBars(scope: string, topsParams: string): Promise<[FacetsData, TopsData]> {
  return Promise.all([
    queryClient.fetchQuery({
      queryKey: facetsKey(scope),
      queryFn: () => api(`/api/facets${scope ? `?${scope}` : ''}`) as Promise<FacetsData>,
      staleTime: BARS_STALE_MS,
    }),
    queryClient.fetchQuery({
      queryKey: topsKey(topsParams, scope),
      queryFn: () => loadTops(topsParams),
      staleTime: BARS_STALE_MS,
    }),
  ]);
}

/** 顶部uno排Siguientepágina. 两排各记各página号, 翻到同unopágina时Parámetro串相同, 共用uno次Por favor求.  */
export function fetchTopsPage(params: string): Promise<TopsData> {
  return queryClient.fetchQuery({
    queryKey: topsPageKey(params),
    queryFn: () => loadTops(params),
    staleTime: BARS_STALE_MS,
  });
}

/** 让两族ya取ese些Todo作废: 代次加uno, Siguiente次 `fetchBars` 换Clavepesado取. 
 *
 *  NoCompleto族Quitar: Quitar会静predeterminaCancelar路arribaeseuno趟, En cursoetc.它调用方拿到esuno `CancelledError`. 
 *  也No用 `invalidateQueries`: Sin观察者Consulta作废以posterior, 路arribaeseuno趟会被Siguiente次 `fetchQuery` continuar着用, 
 *  手动Actualizar就Sin真发Por favor求. antiguo代次dentroya经落定顺手Quitar, 路arribaese几回来以posterior没人再读, 到 `gcTime` 回收.  */
export function dropBars(): void {
  revision += 1;
  const settled = (query: { state: { fetchStatus: string } }) => query.state.fetchStatus === 'idle';
  queryClient.removeQueries({ queryKey: ['facets'], predicate: settled });
  queryClient.removeQueries({ queryKey: ['tops'], predicate: settled });
}
