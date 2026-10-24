/* JAV 用户脚本的默认下载渠道与专用令牌。 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RiCheckboxBlankCircleFill } from '@remixicon/react';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { Select, SelectItem } from '@/components/base/select/select';
import { apiGet, apiSend, errorMessage } from '../../api';
import { LoadingDots } from '../components/loading-dots';
import { SourceLabel } from '../components/source-label';
import { ErrorText, ExternalLink, FieldLabel, Footer, Help, Section, Stack } from './section';
import { busyProps, useAction } from './use-action';

const URL = '/api/configuration/jav-browser';
interface State {
  enabled: boolean; provider: string; available: boolean; token?: string;
  providers: { key: string; label: string; configured: boolean; target: string }[];
}

export function JavBrowserSettings({ receipt, refreshKey }: { receipt(message: string): void; refreshKey: string }) {
  const query = useQuery({ queryKey: ['jav-browser-settings', refreshKey],
    queryFn: ({ signal }) => apiGet<State>(URL, signal), refetchOnMount: 'always' });
  if (query.error) return <ErrorText>{errorMessage(query.error)}</ErrorText>;
  if (query.isFetching) return <LoadingDots label="Cargando ajustes de añadir desde el navegador" />;
  return query.data ? <BrowserForm initial={query.data} receipt={receipt} /> : null;
}

function BrowserForm({ initial, receipt }: { initial: State; receipt(message: string): void }) {
  const [state, setState] = useState(initial);
  const [provider, setProvider] = useState(initial.provider);
  const [token, setToken] = useState('');
  const action = useAction();
  const save = (kind: 'enable' | 'rotate' | 'disable') => {
    void action.run(kind, signal => apiSend<State>(URL, { action: kind, provider }, 'POST', signal), result => {
      const { token: issued = '', ...settings } = result;
      setState(settings);
      setToken(issued);
      receipt(kind === 'disable' ? 'Añadir desde el navegador desactivado' : 'Token exclusivo generado');
    });
  };
  const ready = state.providers.some(item => item.key === provider && item.configured && item.target);
  return <Section title="Añadir JAV desde el navegador">
    <Stack>
      <div><ExternalLink href="https://sleazyfork.org/zh-CN/scripts/600821">Instalar el userscript de Peach</ExternalLink></div>
      <div className="flex flex-col gap-1"><FieldLabel>Canal de descarga para lo añadido desde el navegador</FieldLabel>
      <Select aria-label="Canal de descarga para lo añadido desde el navegador" selectedKey={provider}
        onSelectionChange={key => setProvider(String(key))} isDisabled={Boolean(action.busy)}>
        {state.providers.map(item => <SelectItem key={item.key} id={item.key} textValue={item.label}>
          <SourceLabel source={item.key} label={item.label} />
        </SelectItem>)}
      </Select></div>
      {!ready ? <Help>Primero guarda la cuenta y la carpeta de destino de la nube elegida.</Help> : null}
      <Input label="Dirección de Peach" value={window.location.origin} isReadOnly autoComplete="off" />
      {token ? <>
        <Input label="Token exclusivo para añadir desde el navegador" type="password" value={token} isReadOnly autoComplete="new-password" />
        <div><Button variant="secondary" type="button" onClick={() => {
          void action.run('copy', async () => navigator.clipboard.writeText(token), () => receipt('Token exclusivo copiado'));
        }} {...busyProps(action.busy === 'copy')}>Copiar token exclusivo</Button></div>
      </> : null}
      {action.error ? <ErrorText>{action.error}</ErrorText> : null}
    </Stack>
    <Footer status={<span role="status" className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="inline-flex size-3 items-center justify-center">
        <RiCheckboxBlankCircleFill className={state.enabled ? 'size-2 text-notification-success-foreground' : 'size-2 text-text-tertiary'} />
      </span>{state.enabled ? 'Activada' : 'Desactivado'}
    </span>}>
      {state.enabled ? <Button variant="secondary" type="button" disabled={Boolean(action.busy)}
        onClick={() => save('disable')}>Desactivar añadir desde el navegador</Button> : null}
      <Button type="button" disabled={!state.available || !ready || Boolean(action.busy)}
        onClick={() => save(state.enabled ? 'rotate' : 'enable')}
        {...busyProps(action.busy === 'enable' || action.busy === 'rotate')}>
        {state.enabled ? 'Actualizar canal y token' : 'Activar y generar token'}
      </Button>
    </Footer>
  </Section>;
}
