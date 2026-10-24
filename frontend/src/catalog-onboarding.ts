import { emptyStateHtml } from '@peach/legacy/ui';

type Request = (url: string) => Promise<any>;
const FILTERS = ['loc', 'creator', 'performer', 'studio', 'series', 'agency', 'tag', 'tag_match', 'len', 'dur_min', 'dur_max', 'orient', 'region', 'state', 'jav', 'thumb'];

/** 推荐与当前列表共用筛选，并以实际搜索命中作为展示条件。 */
export async function catalogSuggestions(state: Record<string, string>, request: Request): Promise<string[]> {
  const params = new URLSearchParams();
  for (const key of FILTERS) if (state[key]) params.set(key, state[key]);
  const [facets, sample] = await Promise.all([
    request('/api/facets?' + params), request('/api/items?' + params + '&limit=5'),
  ]);
  const candidates: string[] = [...new Set<string>([
    ...(facets.creators || []), ...(facets.tagperformers || []), ...(facets.tags || []),
  ].map(row => String(row.k || '')).concat((sample.items || []).map((row: { code?: string; name?: string }) => row.code || row.name || '')))]
    .filter(value => value.length > 1).slice(0, 10);
  const hits = await Promise.all(candidates.map(async value => {
    const query = new URLSearchParams(params); query.set('q', value); query.set('limit', '1');
    const result = await request('/api/items?' + query);
    return result.total > 0 ? value : '';
  }));
  return hits.filter(Boolean);
}

/** 空馆藏、筛选无结果与资料尚未建立分别给出可执行入口。 */
export function catalogEmptyHtml({ kind = 'catalog', filtered = false, jav = false, configurable = false, online = false } = {}): string {
  const add = configurable ? '<button class="geist-button primary" data-empty-settings>Añadir contenido</button>' : '';
  const follow = '<a class="geist-button' + (!configurable || online ? ' primary' : '') + '" href="/subscriptions?tab=add">Seguir</a>';
  if (filtered || jav) return emptyStateHtml('search', jav ? 'Todavía no hay obras JAV que coincidan' : 'No hay contenido que coincida',
    jav ? 'Los videos escaneados que aún no tienen datos de lanzamiento están en Todo el contenido.' : 'Quita los filtros o la búsqueda para ver todo el contenido.',
    { actions: '<a class="geist-button primary" href="/?loc=&thumb=0">Ver todo el contenido</a>' });
  if (kind !== 'catalog') {
    const labels: Record<string, string> = { tags: 'Etiquetas', performers: 'Artistas', creators: 'Vendedores', studios: 'Estudio', agencies: 'Agencias', series: 'Series' };
    // 在线那一档数的是来源上的东西，名字也跟着来源的说法：艺人页在线摆的是关注来源里的创作者。
    const onlineLabels: Record<string, string> = { tags: 'Etiquetas', performers: 'Creador' };
    const label = (online ? onlineLabels[kind] : '') || labels[kind] || 'datos';
    return emptyStateHtml(kind === 'tags' ? 'tags' : 'user-round', 'Aún no hay' + label,
      online ? 'Cuando añadas fuentes a seguir y se obtenga contenido, aquí aparecerán los datos de la fuente:' + label + '。' : 'Cuando añadas contenido y se completen sus datos, aquí aparecerá la información.',
      { actions: online ? follow : add + follow });
  }
  return emptyStateHtml('play', 'Aún no hay videos', 'Añade una carpeta de medios o una fuente a seguir para empezar tu colección.', { actions: add + follow });
}
