/* 关注管理页：加来源、检查更新、移除来源与管理 JAV 订阅源。
 *
 * 来源凭据由 Peach 配置管理，想要清单位于 JAV 分区。
 *
 * 地址栏与个人偏好各管各的（ADR-0031「迁移桥接」）：
 * - `tab`、`page`、`sort`、`dir` 在地址栏上。判据是「外面链接得过来吗」——把一条关注列表
 *   的地址发给自己在另一台机器上打开，看到的要是同一批、同一顺序的那一页；排序决定了
 *   哪些来源落在第二页，所以它和页码是同一件事的两半，不能一个在地址栏一个不在。
 * - `pageSize`、`layout` 是这台浏览器的个人偏好，跟着 `appSettings` 走，由壳读写；它们
 *   换一个值不会改变「这一页是哪一批」的含义，挂到地址栏上只会让分享出去的链接把自己的
 *   习惯也一并带给对方。
 * 两边都只有一份真相：React 拿着实时状态，写回哪儿由 props 上的那两个回调说了算。
 *
 * 版式判据来自 docs/reference-sources.json 的 vercel-report-design：要避开卡片套卡片、用
 * 边框补救层级、成排通栏空条、细小灰字加随意字号。所以分组靠标题和一条发丝分隔线，行与
 * 行之间也只用分隔线，不各自套框；字号只取 BoardUI 排好的那几档 token。 */
import { useQuery } from '@tanstack/react-query';

import type { FollowManageProps } from '../bundle';
import { cardClass } from '../components/card';
import { Note } from '../components/note';
import { Page } from '../components/page';
import { STAT_STRIP } from '../components/stat-card';
import { Button } from '@/components/base/buttons/button';
import { FeedSources } from './feed-sources';
import { FEEDS_KEY, fetchFeeds } from './follow-manage';

/** 一格读数：一个名字、一个大数、一句它的量词。 */
function Reading({ term, figure, unit }: { term: string; figure: number; unit: string }) {
  return (
    <div className={cardClass({ padding: 'none', className: 'flex flex-col gap-3 px-6 py-5 max-sm:gap-2 max-sm:p-4' })}>
      <span className="text-body-medium text-text-secondary">{term}</span>
      <b data-follow-reading="" className="flex min-w-0 flex-wrap items-baseline gap-x-1 tabular-nums text-text-primary text-title-1-medium">
        <span className="min-w-0 wrap-anywhere">{figure.toLocaleString()}</span>
        <small className="whitespace-nowrap text-body-2-regular text-text-secondary">{` ${unit}`}</small>
      </b>
    </div>
  );
}

/** Suscripciones JAV: estrenos de las actrices que sigues. El seguimiento de creadores de FANBOX,
 *  Patreon y similares no forma parte de esta versión. */
export function FollowManagePage(props: FollowManageProps) {
  const { toast, openServiceConfiguration, readOnly, readOnlyMessage, writerUrl } = props;
  const feeds = useQuery({ queryKey: FEEDS_KEY, queryFn: ({ signal }) => fetchFeeds(signal) });
  /* Por personas: una actriz suele tener dos páginas de fuente; lo que se sigue es a ella. */
  const subscribed = new Set((feeds.data?.sources || []).map(
    (source) => source.entity_id ?? `source-${source.id}`)).size;

  return (
    <Page>
      {readOnly ? (
        <Note tone="warning" title="Este equipo solo puede ver"
          extra={writerUrl
            ? <p className="text-body-2-regular">
                <a href={writerUrl} className="text-text-primary underline underline-offset-2">
                  Ve al equipo con permiso de escritura para gestionar las suscripciones
                </a>
              </p>
            : undefined}>
          {readOnlyMessage}
        </Note>
      ) : null}

      <div className={STAT_STRIP} aria-label="Resumen de suscripciones">
        <Reading term="Suscripciones JAV" figure={subscribed} unit="personas" />
        <Reading term="Estrenos sin ver" figure={feeds.data?.unread || 0} unit="elementos" />
      </div>

      <FeedSources readOnly={readOnly} toast={toast} />
      <div><Button variant="secondary" onClick={openServiceConfiguration}>Ajustes de fuentes y suscripciones</Button></div>
    </Page>
  );
}
