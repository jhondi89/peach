import { emptyStateHtml } from '@peach/legacy/ui';

type Request = (url: string) => Promise<any>;
const FILTERS = ['loc', 'creator', 'performer', 'studio', 'series', 'agency', 'tag', 'tag_match', 'len', 'dur_min', 'dur_max', 'orient', 'region', 'state', 'jav', 'thumb'];

/** Recomendadoy当anteriorLista共用Filtrar, y以实际Buscar命en proceso作Como展示Condición.  */
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

/** 空馆藏, FiltrarSinResultadoy资料aúnnoConstruir分别给出puede执行入口.  */
export function catalogEmptyHtml({ kind = 'catalog', filtered = false, jav = false, configurable = false, online = false } = {}): string {
  const add = configurable ? '<button class="geist-button primary" data-empty-settings>Añadir contenido</button>' : '';
  const follow = '<a class="geist-button' + (!configurable || online ? ' primary' : '') + '" href="/subscriptions?tab=add">Agregar seguimiento</a>';
  if (filtered || jav) return emptyStateHtml('search', jav ? 'Aún no hayque cumple los criterios de resultado de Obras JAV' : 'Sin contenido que coincida',
    jav ? 'Ya escaneados pero aún sin añadir detalles de lanzamientodetalles de los videosse puede ver en todo el contenido en proceso. ' : 'Limpiar filtros o buscarresultados para ver todo el contenido. ',
    { actions: '<a class="geist-button primary" href="/?loc=&thumb=0">Ver todo el contenido</a>' });
  if (kind !== 'catalog') {
    const labels: Record<string, string> = { tags: 'Etiqueta', performers: 'Actriz', creators: 'Vendedor', studios: 'Sello', agencies: 'Agencia', series: 'Serie' };
    // En线eseuno档数es来源en la东西, 名字也跟着来源说法: 艺人páginaEn线摆es关注来源en la创作者. 
    const onlineLabels: Record<string, string> = { tags: 'Etiqueta', performers: 'Creador' };
    const label = (online ? onlineLabels[kind] : '') || labels[kind] || 'Detalles';
    return emptyStateHtml(kind === 'tags' ? 'tags' : 'user-round', 'Aún no hay' + label,
      online ? 'Agregar seguimiento de fuente y obtener contenido, luego, esto mostrará el contenido de la fuente' + label + '. ' : 'Añade contenido y completa los datos para ver la información aquí.',
      { actions: online ? follow : add + follow });
  }
  return emptyStateHtml('play', 'Sin videos todavía', 'Añadir directorio de medios o seguir fuente, Comenzar a construir tu colección. ', { actions: add + follow });
}
