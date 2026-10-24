import type { InfiniteData } from '@tanstack/react-query';
import { apiGet } from '../../api';
import {
  FOLLOW_PAGE, collectionItems, entityFollowView, followPageUrl, groupMediaKinds, itemForMedia,
  type FollowGroup, type FollowMedia, type FollowPage,
} from '../follow-feed/follow-feed';
import type { FollowDetailData } from './follow-detail';

export const followRelatedKey = (id: number, media: FollowMedia, limit: number) =>
  ['follow-feed', 'related', id, media, limit] as const;

/** Recomendado认Completo组身, Excluir当anterior组, yavery忽略; 按共同EtiquetaOrdenar, etc.分沿用取数顺序.  */
export function followRelatedGroups(pages: readonly FollowPage[], current: FollowDetailData, media: FollowMedia, limit: number): FollowGroup[] {
  const excluded = new Set((current.group ? collectionItems(current.group) : [current.item]).map(item => item.id));
  const seen = new Set<number>();
  const tags = new Set(current.item.tags || []);
  const author = current.sources.find(source => source.id === current.item.source_id)?.author_key;
  const sources = new Map(pages.flatMap(page => page.sources || []).map(source => [source.id, source]));
  return pages.flatMap(page => page.groups || []).filter(group => {
    const members = collectionItems(group);
    if (members.some(item => excluded.has(item.id) || seen.has(item.id))) return false;
    if (!groupMediaKinds(group).has(media === 'images' ? 'image' : 'video')) return false;
    if (itemForMedia(group, media).status !== 'new') return false;
    members.forEach(item => seen.add(item.id));
    return true;
  }).map((group, order) => {
    const item = itemForMedia(group, media);
    const source = item.source_id === undefined ? undefined : sources.get(item.source_id);
    const sameAuthor = !!author && source?.author_key === author;
    const common = (item.tags || []).filter(tag => tags.has(tag)).length;
    return { group, order, sameAuthor, common };
  }).sort((a, b) => Number(b.sameAuthor) - Number(a.sameAuthor) || b.common - a.common || a.order - b.order)
    .slice(0, limit).map(row => row.group);
}

/** 复用关注分página y 缓存结构. 最más读trespágina; 同作者No足时CompletarBibliotecanovercontenido, 换仍puede直continuar命en procesoLista缓存.  */
export async function fetchFollowRelated(current: FollowDetailData, media: FollowMedia, limit: number,
  signal: AbortSignal): Promise<InfiniteData<FollowPage>> {
  const author = current.sources.find(source => source.id === current.item.source_id)?.author_key || '';
  const view = { ...entityFollowView(author), status: 'new' as const, media, sort: 'rand' as const, seed: current.item.id };
  const pages: FollowPage[] = [];
  const read = async (author: string, offset: number) => {
    const page = await apiGet<FollowPage>(followPageUrl({ ...view, author }, offset), signal);
    pages.push(page);
    return page;
  };
  const first = await read(author, 0);
  if (followRelatedGroups(pages, current, media, limit).length < limit && first.has_more) await read(author, (first.offset || 0) + FOLLOW_PAGE);
  if (author && followRelatedGroups(pages, current, media, limit).length < limit) await read('', 0);
  return { pages, pageParams: pages.map(page => page.offset || 0) };
}
