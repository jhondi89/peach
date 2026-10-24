/* primeropáginaeseuno行Nuevas obras(`feed-new` página面interior组件, 路由树画进 `#feedNew`). SoloEnDirectorioRutaarriba画: 离开Directoriopágina由壳收起, 人还EnDirectoriopáginadentro换
 * Filtrar时esteuno行Nopesado挂, Nopesado取—它No随Filtrar变. 取回来卡 portal 回宿主 `#feedNew` 本身.  */
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { queryClient } from '../query';
import { feedNewKey, feedNewOptions, postFeedAction, type FeedNewProps } from './feed-new';
import { FeedNewRow } from './feed-new-row';

export function FeedNewPage({ host, revision, helpers, actions }: FeedNewProps) {
  const feed = useQuery(feedNewOptions(null, helpers.feedRowHtml));
  const seen = useRef(revision);
  useEffect(() => {
    if (seen.current === revision) return;
    seen.current = revision;
    void queryClient.invalidateQueries({ queryKey: feedNewKey(null) });
  }, [revision]);
  return createPortal(<FeedNewRow feedNew={feed.data ?? null} host={host} wire={helpers.wireFeedRow}
    act={postFeedAction} settled={actions.settled} />, host);
}
