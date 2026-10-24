/* "exterior部入口": 人物资料páginaarriba通向 みんなのAV, JavDB y MISSAV ese几直达入口. 
 *
 * aquíSoloCon JavDB y MISSAV 两地址框, este两站主域名连Noarriba时Enaquí换成能Abrir镜像; 
 * みんなのAV Solo此uno家, Sinpuede换东西, 它No出现Enesteunopáginaarriba. 框Predeterminadoes空, 占符写着
 * 当anteriorEn用ese域名—Predeterminado值No需要使用者先抄uno遍, 清空就回到它. 
 *
 * 入口出No出现No由aquí决定: 地址由服务端拼(`peach.entry_links`), 站点 id 缺席eseuno
 * 就NoEn资料páginaarriba, 所以aquíSin开关. 校验也SoloEn服务端, anterior端Copiaruno判定Solo会漂.  */
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';

import { apiSend } from '../../api';
import { ENTRY_LINKS_HELP, ENTRY_LINKS_HINT } from '../../configuration-copy';
import type { EntryLinkSite, EntryLinksState } from '../bundle';
import { ErrorText, Footer, Help, Section, Stack } from './section';
import { busyProps, useAction } from './use-action';
import { SiteLabel } from '../components/source-label';

export function EntryLinksForm({ initial, receipt }: {
  initial: EntryLinksState;
  receipt(message: string): void;
}) {
  const [sites, setSites] = useState<EntryLinkSite[]>(initial.sites);
  const action = useAction();

  const change = (key: string, host: string) =>
    setSites((rows) => rows.map((row) => (row.key === key ? { ...row, host } : row)));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = { sites: Object.fromEntries(sites.map((site) => [site.key, { host: site.host }])) };
    void action.run('save', (signal) =>
      apiSend<EntryLinksState>('/api/configuration/entry-links', body, 'POST', signal),
      (next) => {
        setSites(next.sites);
        receipt('Configuración guardada');
      });
  };

  return (
    <Section title="Sitio de información de obras点" onSubmit={submit}>
      <Stack>
        <Help>{ENTRY_LINKS_HELP}</Help>
        {sites.map((site) => (
          <Input key={site.key} id={`entry-link-${site.key}`} label={<SiteLabel site={site.key} label={`${site.label} Dirección`} />}
            autoComplete="off" maxLength={100} value={site.host}
            placeholder={site.default_host}
            onChange={(host) => change(site.key, host)}
            validationBehavior="aria" hint={ENTRY_LINKS_HINT} />
        ))}
        {action.error ? <ErrorText>{action.error}</ErrorText> : null}
      </Stack>
      <Footer>
        <Button type="submit" {...busyProps(action.busy === 'save')}>Guardar configuración</Button>
      </Footer>
    </Section>
  );
}
