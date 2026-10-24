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

const FIELDS = [['code', 'Código JAV'], ['title', 'Título'], ['studio', 'Sello'], ['series', 'Serie'],
  ['release_date', 'Fecha de lanzamiento'], ['performers', 'Actores (array de texto)'], ['tags', 'Etiqueta(文本数Grupo)']] as const;
const TYPES = [['censored', 'Con censura'], ['amateur', 'Amateur'], ['uncensored', 'Sin censura'], ['fc2', 'FC2'],
  ['kmib', 'Korea MIB'], ['other', 'Otro'], ['unsure', 'Pendiente核Código JAV'], ['unknown', 'Desconocido']] as const;
const blank = (): Source => ({ name: '', endpoint: '', enabled: false, fields: { code: 'id', title: 'title' }, content_types: ['censored'] });

export function CustomSources({ receipt }: { receipt(message: string): void }) {
  const [editing, setEditing] = useState<Source | null>(null);
  const query = useQuery({ queryKey: KEY, queryFn: ({ signal }) => fetchCustomSources(signal) });
  const action = useAction();
  const changed = (result: { items: Source[] }) => queryClient.setQueryData(KEY, result);
  const hasContent = Boolean(query.isPending || query.error || query.data?.items.length || action.error);
  const add = <Button variant="secondary" onClick={() => setEditing(blank())}>AñadirFuente</Button>;
  return <Section title="PersonalizadoMetadatosFuente">
    {hasContent ? <Stack>
      {query.isPending ? <div aria-busy="true" data-skeleton="" aria-label="读取PersonalizadoFuente" /> : null}
      {query.error ? <ErrorText>{errorMessage(query.error)}</ErrorText> : null}
      {query.data?.items.map((source) => <div key={source.id} className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1">{source.name} · {source.enabled ? 'Activado' : 'YaDesactivar'}</span>
        <Button variant="secondary" onClick={() => setEditing(source)}>Editar</Button>
        <Button variant="secondary" {...busyProps(action.busy === source.id)} onClick={() => void action.run(source.id!,
          (signal) => apiSend<{ items: Source[] }>(URL, { ...source, enabled: !source.enabled }, 'POST', signal),
          (result) => { changed(result); receipt(source.enabled ? 'YaDesactivarFuente' : 'YaActivar fuente') })}>
          {source.enabled ? 'Desactivar' : 'Activar'}</Button>
        <Button variant="danger" onClick={() => confirmModal({ title: 'EliminarPersonalizadoFuente',
          body: `Eliminar"${esc(source.name)}"posterior, Recolectar将No再Consultaeste fuente(s). `, confirmLabel: 'EliminarFuente',
          onConfirm: async () => { changed(await apiSend<{ items: Source[] }>(URL, { action: 'delete', id: source.id }));
            setEditing(null); receipt('YaEliminarFuente') } })}>Eliminar</Button>
      </div>)}
      {action.error ? <ErrorText>{action.error}</ErrorText> : null}
    </Stack> : null}
    {!editing ? hasContent ? <Footer>{add}</Footer> : <Stack><div className="flex justify-end">{add}</div></Stack> : null}
    {editing ? <SourceForm key={editing.id || 'new'} initial={editing} cancel={() => setEditing(null)}
      saved={(result) => { changed(result); setEditing(null); receipt('GuardadoFuente') }} /> : null}
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
  return <form aria-label="MetadatosFuenteConfiguración" aria-busy={action.busy === 'preview'} onSubmit={(event) => {
    event.preventDefault();
    void action.run('save', (signal) => apiSend<{ items: Source[] }>(URL, source, 'POST', signal), saved);
  }}>
    <Stack>
      <Input label="Nombre de fuente" value={source.name} maxLength={80} onChange={(name) => change({ name })} />
      <Input label="Dirección de interfaz JSON" value={source.endpoint} maxLength={2048}
        placeholder="https://example.com/api/movies/{code}" onChange={(endpoint) => change({ endpoint })} />
      <div className="flex flex-col gap-2">
        <FieldLabel>FuenteMétodo de conexión</FieldLabel>
        <SelectField id="custom-source-network" label="FuenteMétodo de conexión" epoch={0} value={source.network || 'direct'}
          options={[["direct", "Conexión directa"], ["peach_proxy", "Proxy de Peach"]]} onPick={(network) => change({ network })} />
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>Formato de código JAV de la interfaz</FieldLabel>
        <SelectField id="custom-source-code-format" label="Formato de código JAV de la interfaz" epoch={0} value={source.code_format || 'original'}
          options={[["original", "Sin cambios"], ["lowercase", "Minúsculas"], ["compact", "Eliminar guiones"], ["underscore", "Convertir guión a guión bajo"]]}
          onPick={(code_format) => change({ code_format })} />
      </div>
      <Help>Introduce写Público JSON Interfaz y Respuesta字段Ruta, 例如 data.title. Código JAV字段用于核对Obra身. </Help>
      {FIELDS.map(([field, label]) => <Input key={field} label={`${label}字段Ruta`} value={source.fields[field] || ''}
        onChange={(path) => { const fields = { ...source.fields }; if (path) fields[field] = path; else delete fields[field]; change({ fields }) }} />)}
      <div className="flex flex-wrap gap-3" role="group" aria-label="适用contenidoTipo">
        {TYPES.map(([type, label]) => <Checkbox key={type} isSelected={source.content_types.includes(type)}
          onChange={(checked) => change({ content_types: checked ? [...source.content_types, type] : source.content_types.filter((kind) => kind !== type) })}>{label}</Checkbox>)}
      </div>
      <Checkbox isSelected={source.enabled} onChange={(enabled) => change({ enabled })}>Activar fuente</Checkbox>
      <Input label="试查Código JAV(回车Consulta)" value={code} onChange={(value) => {
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
      {action.busy === 'preview' ? <Help role="status"><span dangerouslySetInnerHTML={{ __html: spinnerHtml('Procesando试查Fuente') }} />Procesando试查Fuente...</Help> : null}
      {preview ? <CodeBlock code={preview} language="json" label="MetadatosInterfazVolver" /> : null}
      {action.error ? <ErrorText>{action.error}</ErrorText> : null}
    </Stack>
    <Footer><Button variant="secondary" type="button" onClick={cancel}>Cancelar</Button>
      <Button type="submit" {...busyProps(action.busy === 'save')}>GuardarFuente</Button></Footer>
  </form>;
}
