/* 来源Credenciales, 资源Buscary订阅Recolectar共用uno Peach Configuración分区.  */
import { useQuery } from '@tanstack/react-query';
import { ButtonLink } from '@/components/base/buttons/button';
import type { ConfigurationGroupProps } from '../bundle';
import { Credentials } from '../follow-manage/credentials';
import { fetchCredentials, FOLLOW_CREDENTIALS_KEY } from '../follow-manage/follow-manage';
import { Note } from '../components/note';
import { LoadingDots } from '../components/loading-dots';
import { errorMessage } from '../../api';
import { groupRoot } from './configuration-panel';
import { EntryLinksForm } from './entry-links-settings';
import { IndexerSettings } from './indexer-settings';
import { FollowPreferenceRows } from './service-preferences';

export function SourceSettings({ data, receipt, panel }: ConfigurationGroupProps) {
  const credentials = useQuery({ queryKey: FOLLOW_CREDENTIALS_KEY,
    queryFn: ({ signal }) => fetchCredentials(signal), enabled: panel?.active !== false, refetchOnMount: 'always' });
  return <div {...groupRoot(panel)}>
    <div><ButtonLink href="/sources" variant="secondary">RecolectarFuenteyIniciar sesiónEstado</ButtonLink></div>
    {credentials.data
      ? <Credentials data={credentials.data} readOnly={Boolean(data.ledger_read_only)} toast={receipt} embedded />
      : credentials.error
        ? <Note tone="error" title="Credenciales de fuenteNo disponible">{errorMessage(credentials.error)}</Note>
        : panel?.active !== false ? <LoadingDots label="CargandoCredenciales de fuente" /> : null}
    {data.entry_links ? <EntryLinksForm initial={data.entry_links} receipt={receipt} /> : null}
    <IndexerSettings receipt={receipt} />
    <FollowPreferenceRows receipt={receipt} />
  </div>;
}
