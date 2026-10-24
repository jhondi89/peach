/* 来源凭据、资源搜索与订阅采集共用一个 Peach 配置分区。 */
import { ButtonLink } from '@/components/base/buttons/button';
import type { ConfigurationGroupProps } from '../bundle';
import { groupRoot } from './configuration-panel';
import { EntryLinksForm } from './entry-links-settings';
import { IndexerSettings } from './indexer-settings';

export function SourceSettings({ data, receipt, panel }: ConfigurationGroupProps) {
  return <div {...groupRoot(panel)}>
    <div><ButtonLink href="/sources" variant="secondary">Fuentes de datos y estado de sesión</ButtonLink></div>
    {data.entry_links ? <EntryLinksForm initial={data.entry_links} receipt={receipt} /> : null}
    <IndexerSettings receipt={receipt} />
  </div>;
}
