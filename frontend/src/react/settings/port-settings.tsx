/* 本机PuertoyyaGuardar媒体Configuración使用同uno修订号.  */
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { LinkButton } from '@/components/base/buttons/link-button';
import { ApiError, apiSend, errorMessage } from '../../api';
import { CONFIGURATION_URL } from '../../configuration-endpoints';
import type { ConfigurationGroupProps } from '../bundle';
import { Note } from '../components/note';
import { RESTART_REDIRECT_MS } from '../restart-redirect';
import { Footer, Section, Stack } from './section';
import { busyProps, useAction } from './use-action';

export function PortSettings({ data, receipt }: ConfigurationGroupProps) {
  const [port, setPort] = useState(String(data.port));
  const [fieldError, setFieldError] = useState('');
  const [saved, setSaved] = useState<{ url: string } | null>(null);
  const action = useAction();
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => location.assign(saved.url), RESTART_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [saved]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError('');
    void action.run('save', (signal) => apiSend<{ url: string }>(CONFIGURATION_URL, {
      revision: data.revision, media_dirs: data.media_dirs,
      ...(data.media_sources ? { media_sources: data.media_sources } : {}),
      port, scan_now: false,
    }, 'POST', signal), (result) => { setSaved(result); receipt('Configuración guardada'); }, (cause) => {
      const fields = cause instanceof ApiError && cause.status === 400
        ? (cause.body as { errors?: { port?: string } } | null)?.errors : null;
      if (fields?.port) setFieldError(fields.port);
      else action.setError(errorMessage(cause));
    });
  };
  if (saved) return <Section title="Esta máquinaAccesoPuerto"><Stack>
    <Note tone="success" title="Configuración guardada">Peach En cursopesadoNuevo启动. 
      <LinkButton href={saved.url} size="small">Ir a la colección</LinkButton>
    </Note>
  </Stack></Section>;
  return <Section title="Esta máquinaAccesoPuerto" onSubmit={submit}><Stack>
    <Input id="configPort" label="Puerto" inputMode="numeric" value={port} onChange={setPort}
      validationBehavior="aria" isInvalid={Boolean(fieldError)} hint={fieldError || undefined} />
    {action.error ? <Note tone="error" title="Sin guardar">{action.error}</Note> : null}
  </Stack><Footer status="Guardarposterior Peach 会Reiniciar, ySaltar a到NuevoDirección. ">
    <Button type="submit" {...busyProps(action.busy === 'save')}>Guardar configuración</Button>
  </Footer></Section>;
}
