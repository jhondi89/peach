import type { Discovery } from '../jav/jav';
import type { SuggestCard, SuggestGroup, SuggestItem } from './search';

type Request = (url: string) => Promise<any>;

/** 搜索入口复用馆藏、口味推荐和 JAV 新作的本机读接口。 */
export async function searchRecommendations(request: Request): Promise<SuggestGroup[]> {
  const results = await Promise.allSettled([
    request('/api/items?sort=rand&limit=5'),
    request('/api/jav/discoveries?scope=library&limit=5'),
    request('/api/feeds/discoveries?limit=5'),
  ]);
  const data = results.map(result => result.status === 'fulfilled' ? result.value : null);
  const library: SuggestCard[] = (data[0]?.items || []).slice(0, 5);
  const jav: Discovery[] = (data[1]?.items || []).slice(0, 5);
  const releases: Discovery[] = data[2]?.items || [];
  const work = (card: SuggestCard, href?: string): SuggestItem => ({
    value: String(card.code || card.display_title || card.title || card.name || 'Obra sin título'),
    id: card.id, code: card.code, title: String(card.display_title || card.title || ''),
    who: String(card.performers || card.creator || ''), card, href,
  });
  const people = new Map<string, SuggestItem>();
  for (const card of jav) {
    for (const ref of card.performer_refs || []) {
      if (!ref.id || people.has(ref.name)) continue;
      people.set(ref.name, { value: ref.name, entity_id: ref.id, has_image: ref.has_image,
        href: `/performers/${ref.id}`,
        image_version: ref.image_version, avatar_focus: ref.avatar_focus, rep: ref.has_avatar ? ref.rep : null,
        works: [card], subtitle: 'Ver obras y suscribirse a estrenos',
      });
    }
  }
  return [
    { kind: 'performer', label: 'Artistas y estrenos', items: [...people.values()].slice(0, 3), href: '/subscriptions', action: 'Suscribirse a estrenos' },
    { kind: 'asset', label: 'Obras recomendadas', items: library.map(card => work(card)), href: '/', action: 'Todas las obras' },
    { kind: 'jav', label: 'Recomendaciones JAV', items: jav.map(card => work(card, `/assets/${card.asset_id || card.id}`)), href: '/jav?tab=discover', action: 'Descubrir JAV' },
    { kind: 'release', label: 'Suscribirse a estrenos', items: releases.filter(card => card.code).map(card => work({ ...card, sourceWork: true }, `/works/${encodeURIComponent(card.code)}`)), href: '/subscriptions', action: 'Gestionar suscripciones' },
  ];
}
