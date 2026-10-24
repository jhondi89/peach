import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';
import { confirmModal, spinnerHtml } from '@peach/legacy/ui';
import { esc } from '@peach/legacy/core';
import { apiSend, errorMessage } from '../../api';
import { queryClient } from '../query';
import { CodeBlock } from '../components/code-block';
import { ErrorText, FieldLabel, Footer, Help, Section, Stack } from '../settings/section';
import { busyProps, useAction } from '../settings/use-action';
import { SelectField } from '../settings-panel/legacy-controls';
import { CUSTOM_SOURCES_URL as URL, CUSTOM_SOURCES_KEY as KEY, fetchCustomSources,
  type CustomSource as Source } from './custom-source-data';

const FIELDS = [['code', 'Código'], ['title', 'Título'], ['studio', 'Estudio'], ['series', 'Series'],
  ['release_date', 'Fecha de lanzamiento'], ['performers', 'Actores (lista de texto)'], ['tags', 'Etiquetas (lista de texto)']] as const;
const TYPES = [['censored', 'Con censura'], ['amateur', 'Amateur'], ['uncensored', 'Sin censura'], ['fc2', 'FC2'],
  ['kmib', 'MIB coreano'], ['other', 'Otros'], ['unsure', 'Código por verificar'], ['unknown', 'Desconocido']] as const;
const blank = (): Source => ({ name: '', endpoint: '', enabled: false, fields: { code: 'id', title: 'title' }, content_types: ['censored'] });

export function CustomSources({ receipt }: { receipt(message: string): void }) {
  const [editing, setEditing] = useState<Source | null>(null);
  const query = useQuery({ queryKey: KEY, queryFn: ({ signal }) => fetchCustomSources(signal) });
  const action = useAction();
  const changed = (result: { items: Source[] }) => queryClient.setQueryData(KEY, result);
  const hasContent = Boolean(query.isPending || query.error || query.data?.items.length || action.error);
  const add = <Button variant="secondary" onClick={() => setEditing(blank())}>Añadir fuente</Button>;
  return <Section title="Fuentes de metadatos personalizadas">
    {hasContent ? <Stack>
      {query.isPending ? <div aria-busy="true" data-skeleton="" aria-label="Cargando fuentes personalizadas" /> : null}
      {query.error ? <ErrorText>{errorMessage(query.error)}</ErrorText> : null}
      {query.data?.items.map((source) => <div key={source.id} className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1">{source.name} · {source.enabled ? 'Activada' : 'Desactivada'}</span>
        <Button variant="secondary" onClick={() => setEditing(source)}>Editar</Button>
        <Button variant="secondary" {...busyProps(action.busy === source.id)} onClick={() => void action.run(source.id!,
          (signal) => apiSend<{ items: Source[] }>(URL, { ...source, enabled: !source.enabled }, 'POST', signal),
          (result) => { changed(result); receipt(source.enabled ? 'Fuente desactivada' : 'Fuente activada') })}>
          {source.enabled ? 'Desactivar' : 'Activar'}</Button>
        <Button variant="danger" onClick={() => confirmModal({ title: 'Borrar fuente personalizada',
          body: `Al borrar “${esc(source.name)}”, la obtención de datos ya no consultará esta fuente.`, confirmLabel: 'Borrar fuente',
          onConfirm: async () => { changed(await apiSend<{ items: Source[] }>(URL, { action: 'delete', id: source.id }));
            setEditing(null); receipt('Fuente borrada') } })}>Borrar</Button>
      </div>)}
      {action.error ? <ErrorText>{action.error}</ErrorText> : null}
    </Stack> : null}
    {!editing ? hasContent ? <Footer>{add}</Footer> : <Stack><div className="flex justify-end">{add}</div></Stack> : null}
    {editing ? <SourceForm key={editing.id || 'new'} initial={editing} cancel={() => setEditing(null)}
      saved={(result) => { changed(result); setEditing(null); receipt('Fuente guardada') }} /> : null}
  </Section>;
}

function SourceForm({ initial, cancel, saved }: {
  initial: Source; cancel(): void; saved(result: { items: Source[] }): void;
}) {
  const [source, setSource] = useState(initial);
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<string>('');
  const revision = useRef(0);
  const action = useAction();
  const change = (patch: Partial<Source>) => { revision.current++; setSource((current) => ({ ...current, ...patch })); setPreview('') };
  return <form aria-label="Configuración de la fuente de metadatos" aria-busy={action.busy === 'preview'} onSubmit={(event) => {
    event.preventDefault();
    void action.run('save', (signal) => apiSend<{ items: Source[] }>(URL, source, 'POST', signal), saved);
  }}>
    <Stack>
      <Input label="Nombre de la fuente" value={source.name} maxLength={80} onChange={(name) => change({ name })} />
      <Input label="Dirección de la API JSON" value={source.endpoint} maxLength={2048}
        placeholder="https://example.com/api/movies/{code}" onChange={(endpoint) => change({ endpoint })} />
      <div className="flex flex-col gap-2">
        <FieldLabel>Conexión de la fuente</FieldLabel>
        <SelectField id="custom-source-network" label="Conexión de la fuente" epoch={0} value={source.network || 'direct'}
          options={[["direct", "Directa"], ["peach_proxy", "Proxy de Peach"]]} onPick={(network) => change({ network })} />
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>Formato del código para la API</FieldLabel>
        <SelectField id="custom-source-code-format" label="Formato del código para la API" epoch={0} value={source.code_format || 'original'}
          options={[["original", "Tal cual"], ["lowercase", "Minúsculas"], ["compact", "Sin guiones"], ["underscore", "Guion a guion bajo"]]}
          onPick={(code_format) => change({ code_format })} />
      </div>
      <Help>Escribe una API JSON pública y la ruta de cada campo de la respuesta, por ejemplo data.title. El campo de código sirve para comprobar que es la misma obra.</Help>
      {FIELDS.map(([field, label]) => <Input key={field} label={`Ruta del campo ${label}`} value={source.fields[field] || ''}
        onChange={(path) => { const fields = { ...source.fields }; if (path) fields[field] = path; else delete fields[field]; change({ fields }) }} />)}
      <div className="flex flex-wrap gap-3" role="group" aria-label="Tipos de contenido compatibles">
        {TYPES.map(([type, label]) => <Checkbox key={type} isSelected={source.content_types.includes(type)}
          onChange={(checked) => change({ content_types: checked ? [...source.content_types, type] : source.content_types.filter((kind) => kind !== type) })}>{label}</Checkbox>)}
      </div>
      <Checkbox isSelected={source.enabled} onChange={(enabled) => change({ enabled })}>Fuentes activas</Checkbox>
      <Input label="Código de prueba (Enter para consultar)" value={code} onChange={(value) => {
        revision.current++; setCode(value); setPreview('');
      }} onKeyDown={(event) => {
        if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
        event.preventDefault();
        const current = revision.current;
        void action.run('preview', (signal) => apiSend<{ record: unknown }>(URL,
          { ...source, code, action: 'preview' }, 'POST', signal), (result) => {
            if (current === revision.current) setPreview(JSON.stringify(result.record, null, 2));
          }, (cause) => { if (current === revision.current) action.setError(errorMessage(cause)) });
      }} />
      {action.busy === 'preview' ? <Help role="status"><span dangerouslySetInnerHTML={{ __html: spinnerHtml('Probando la fuente') }} />Probando la fuente…</Help> : null}
      {preview ? <CodeBlock code={preview} language="json" label="Respuesta de la API de metadatos" /> : null}
      {action.error ? <ErrorText>{action.error}</ErrorText> : null}
    </Stack>
    <Footer><Button variant="secondary" type="button" onClick={cancel}>Cancelar</Button>
      <Button type="submit" {...busyProps(action.busy === 'save')}>Guardar fuente</Button></Footer>
  </form>;
}
