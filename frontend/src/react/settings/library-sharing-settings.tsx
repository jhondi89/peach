import { useMemo, useState } from 'react';

import { SettingsRow } from '@/components/application/settings/settings-rows';
import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Switch } from '@/components/base/switch/switch';

import { apiGet, apiSend } from '../../api';
import { CodeBlock } from '../components/code-block';
import { Disclosure, ErrorText, Footer, Help, Rows, Stack } from './section';
import { busyProps, useAction } from './use-action';

export interface LibrarySharingState {
  enabled: boolean; available: boolean; schema: number; fields: string[]; notice: string;
  last_attempt?: { period?: string; status?: string; reason?: string };
}
interface Preview { data: { library: unknown[]; preferences: unknown; coverage: { uncoded_items: number } }; bytes: number; token: string; schema: number }

export function LibrarySharingSettings({ initial, receipt }: {
  initial: LibrarySharingState; receipt(message: string): void;
}) {
  const [value, setValue] = useState(initial);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const previewText = useMemo(() => preview ? JSON.stringify(preview.data, null, 2) : '', [preview]);
  const action = useAction();
  const save = (enabled: boolean) => void action.run('save', (signal) =>
    apiSend<LibrarySharingState>('/api/configuration/library-sharing', {
      enabled, schema: value.schema, consent: accepted, preview_token: preview?.token,
    }, 'POST', signal), (saved) => {
    setValue(saved); setPreview(null); setAccepted(false); setReviewing(false); receipt('Opciones de envío de colección y gustos guardadas');
  });
  const downloadPreview = () => {
    const url = URL.createObjectURL(new Blob([previewText], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'peach-library-taste-preview.json';
    document.body.append(anchor);
    try { anchor.click() } finally {
      anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };
  return <>
    <Rows><SettingsRow label="Enviar detalles de colección y gustos" description={value.notice}>
      <Switch aria-label="Enviar detalles de colección y gustos" isSelected={value.enabled}
        onChange={(enabled) => enabled ? setReviewing(true) : save(false)}
        {...busyProps(action.busy === 'save')} />
    </SettingsRow></Rows>
    {!value.available ? <Stack divided><Help>El servicio de envío no está configurado.</Help></Stack> : null}
    {value.enabled && value.last_attempt?.status === 'failed'
      ? <Stack divided><ErrorText>Falló el envío de colección y gustos; se reintentará solo.</ErrorText></Stack> : null}
    {preview ? <Stack divided>
      <Help>La vista previa actual incluye {preview.data.library.length} obras con código y un resumen de {preview.data.coverage.uncoded_items} elementos sin código, unos {(preview.bytes / 1024).toFixed(1)} KiB. No incluye datos personales como cuenta, dispositivo, rutas de archivo ni historial del navegador.</Help>
      <Disclosure summary="Vista previa de los datos a enviar" defaultOpen>
        <CodeBlock code={previewText} language="json" label="Vista previa del envío de colección y gustos" maxCharacters={24000} />
      </Disclosure>
      {previewText.length > 24000 ? <Help>Se muestran los primeros 24 000 caracteres; descárgala para ver todo.</Help> : null}
      <Button variant="secondary" onClick={downloadPreview}>Descargar vista previa completa</Button>
      {!value.enabled ? <Checkbox isSelected={accepted} onChange={setAccepted}>Revisé la vista previa y acepto enviar los detalles de colección y gustos</Checkbox> : null}
    </Stack> : null}
    {action.error ? <Stack divided><ErrorText>{action.error}</ErrorText></Stack> : null}
    <Footer>
      <Button variant="secondary" onClick={() => { setReviewing(true); void action.run('preview',
        (signal) => apiGet<Preview>('/api/configuration/library-sharing/preview', signal),
        (data) => { setPreview(data); setAccepted(false) }) }}
        {...busyProps(action.busy === 'preview')}>Ver lo que se enviará</Button>
      {!value.enabled && preview ? <Button disabled={!accepted} onClick={() => save(true)}
        {...busyProps(action.busy === 'save')}>Aceptar y activar el envío</Button> : null}
      {reviewing && !value.enabled ? <Button variant="secondary" onClick={() => {
        setReviewing(false); setPreview(null); setAccepted(false);
      }}>Cancelar</Button> : null}
    </Footer>
  </>;
}
