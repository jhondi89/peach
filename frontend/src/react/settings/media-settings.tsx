/* "媒体Bibliotecay入Biblioteca"Agrupar: 媒体Directorioy自动入Biblioteca, 每Archivocarpeta标着挂载Estado. 
 *
 * 服务端VerificarGestionarPermisosposterior用 `editable` 控制表单; SinPermisos时SoloDescripciónOriginal因. 
 * GuardarÉxitoposterior显示持久Sugerencia y Acceder地址, Esperando服务就绪posteriorSaltar a. 
 *
 * 校验Original因由服务端按字段给(400  `errors`), página面写回Original, NoEnanterior端CopiarunoRutayPuerto判定.  */
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Button } from '@/components/base/buttons/button';
import { LinkButton } from '@/components/base/buttons/link-button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';
import { ConnectionStatus } from '../components/connection-status';

import { ApiError, apiSend, errorMessage } from '../../api';
import { CONFIGURATION_URL, PICK_FOLDER_URL } from '../../configuration-endpoints';
import type { ConfigurationData, ConfigurationGroupProps } from '../bundle';
import { Note } from '../components/note';
import { queryClient } from '../query';
import { RESTART_REDIRECT_MS } from '../restart-redirect';
import { CloudDriveGuide } from './clouddrive-guide';
import { CONFIGURATION_KEY, fetchConfiguration } from './configuration';
import { groupRoot } from './configuration-panel';
import { FolderRow, isCloudSource, MEDIA_SOURCES, MediaReadPolicy, MediaReadPolicyHelp, SourceSelect, sourceMark, useFolderRows } from './folder-rows';
import { sourceDefaultCost, type SourceCost } from '../../core/media-sources';
import { LibraryIconPicker } from './library-icon-picker';
import { PushDiscoveryForm } from './push-discovery-settings';
import {
  ErrorText, ExternalLink, Fact, FactList, FieldLabel, Footer, Help, Section, SourceMark, Stack,
} from './section';
import { busyProps, useAction } from './use-action';

const sourceName = (location: string) => MEDIA_SOURCES.find(([kind]) => kind === location)?.[1] ?? location;
const pickFolder = async (initial: string) =>
  (await apiSend<{ path: string | null }>(PICK_FOLDER_URL, { initial })).path;

interface MediaRow { path: string; location: string; root: string; library: string; library_icon: string; cost: SourceCost | '' }
interface FieldErrors { media_dirs?: string[]; port?: string }
interface SaveResult { saved: boolean; url: string; revision: string }

const blankRow = (path = ''): MediaRow => ({ path, location: 'local', root: '', library: '', library_icon: '', cost: 'free' });

function initialRows(data: ConfigurationData): MediaRow[] {
  const known = data.media_sources?.filter((row) => MEDIA_SOURCES.some(([kind]) => kind === row.location));
  if (known?.length) {
    return known.map((row) => ({
      path: row.path, location: row.location, root: row.root, library: row.library || '', library_icon: row.library_icon || '',
      cost: row.cost ?? sourceDefaultCost(row.location),
    }));
  }
  return (data.media_dirs.length ? data.media_dirs : ['']).map((path) => blankRow(path));
}

const fieldErrorsOf = (cause: unknown): FieldErrors | null => {
  if (!(cause instanceof ApiError) || cause.status !== 400) return null;
  return (cause.body as { errors?: FieldErrors } | null)?.errors ?? null;
};

/* 能Editar时挂载Estado标En每Archivocarpeta行arriba; Solo读时Sinese表, 单列uno.  */
export function MediaSettings({ data, receipt, panel }: ConfigurationGroupProps) {
  return (
    <div {...groupRoot(panel)}>
      {data.editable ? <MediaForm data={data} receipt={receipt} /> : <Note tone="neutral" title="Solo lectura">{data.notice}</Note>}
      {data.editable ? null : <MountStatus data={data} />}
      {data.push_discovery
        ? <PushDiscoveryForm initial={data.push_discovery} receipt={receipt} />
        : null}
    </div>
  );
}

function MediaForm({ data, receipt }: ConfigurationGroupProps) {
  const { rows, edit, add, remove, errors: rowErrors, setErrors: setRowErrors, picking, pick, inputRef } = useFolderRows({
    initial: () => initialRows(data), blank: () => blankRow(), pickFolder, describe: errorMessage,
  });
  const [scanNow, setScanNow] = useState(false);
  const [requireReadPolicy, setRequireReadPolicy] = useState(false);
  const [failure, setFailure] = useState('');
  const [saved, setSaved] = useState<SaveResult | null>(null);
  const revision = useRef(data.revision);
  const action = useAction();

  useEffect(() => {
    if (!saved) return undefined;
    const timer = setTimeout(() => location.assign(saved.url), RESTART_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [saved]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missing = rows.findIndex((row) => !row.cost);
    if (missing >= 0) {
      setRequireReadPolicy(true);
      const form = event.currentTarget;
      requestAnimationFrame(() => form.querySelector<HTMLButtonElement>(`[data-media-read-policy="${missing}"] button`)?.focus());
      return;
    }
    setFailure('');
    void action.run('save', (signal) => apiSend<SaveResult>(CONFIGURATION_URL, {
      revision: revision.current,
      media_dirs: rows.map((row) => row.path),
      ...(data.media_sources ? { media_sources: rows } : {}),
      port: String(data.port),
      scan_now: scanNow,
    }, 'POST', signal), (result) => {
      revision.current = result.revision;
      setRowErrors([]);
      receipt('Configuración guardada');
      setSaved(result);
    }, (cause) => {
      const fields = fieldErrorsOf(cause);
      setRowErrors(fields?.media_dirs ?? []);
      if (!fields || fields.port) setFailure(fields?.port || errorMessage(cause));
    });
  };

  if (saved) {
    return (
      <Section title="Directorio de medios">
        <Stack>
          <Note tone="success" title="Configuración guardada">
            Peach En cursopesadoNuevo启动. 稍posterior自动Saltar a, 或点击<LinkButton href={saved.url} size="small">Ir a la colección</LinkButton>. 
          </Note>
        </Stack>
      </Section>
    );
  }

  // 挂载EstadoesyaGuardareseConfiguración读数, Solo标EnRuta没改过行arriba. 
  const mountOf = (path: string) => (path ? data.media_sources?.find((source) => source.path === path) : undefined);
  const cloud = rows.some((row) => isCloudSource(row.location));
  const missing = cloud ? (data.mount_dependencies ?? []).filter((dependency) => !dependency.available) : [];
  return (
    <Section title="Directorio de medios" onSubmit={submit}>
      <Stack>
        <div className="flex flex-col gap-3">
          <FieldLabel>Directorio de medios</FieldLabel>
          <div role="group" aria-label="Directorio de medios" className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <FolderRow key={index} label={`Directorio de medios ${index + 1}`} path={row.path}
                onPath={(path) => edit(index, { path })} error={rowErrors[index]} inputRef={inputRef(index)}
                picking={picking === index} onPick={() => void pick(index)}
                onRemove={rows.length > 1 ? () => remove(index) : undefined}
                status={mountOf(row.path) ? <MountBadge online={mountOf(row.path)?.online} /> : null}>
                <SourceSelect index={index} value={row.location}
                  onChange={(location) => edit(index, { location, cost: location === 'local' ? 'free' : '' })} />
                <MediaReadPolicy index={index} cost={row.cost} onChange={(cost) => edit(index, { cost })}
                  error={requireReadPolicy && !row.cost ? 'Por favor selecciona la estrategia de lectura de medios' : undefined} />
                <Input className="min-w-40 flex-1" aria-label={`Nombre de la biblioteca ${index + 1}`} maxLength={80}
                  placeholder="Nombre de la biblioteca"
                  value={row.library} onChange={(library) => edit(index, { library })} />
                <LibraryIconPicker label={`Biblioteca de mediosImagen标 ${index + 1}`} value={row.library_icon} kind={row.location}
                  onChange={(library_icon) => edit(index, { library_icon })} />
              </FolderRow>
            ))}
          </div>
          <Button variant="secondary" className="self-start" onClick={add}>AñadirCarpeta</Button>
        </div>
        {cloud ? <><MediaReadPolicyHelp /><CloudDriveGuide /></> : null}
        {missing.map((dependency) => (
          <Help key={dependency.name}>
            no检测到 {dependency.name}. <ExternalLink href={dependency.download_url}>Descargar {dependency.name}</ExternalLink>
          </Help>
        ))}
        <Checkbox isSelected={scanNow} onChange={setScanNow}>GuardarposteriorEscanearyCompletar detalles</Checkbox>
        {failure ? <Note tone="error" title="Sin guardar">{failure}</Note> : null}
      </Stack>
      <Footer status="Guardarposterior Peach 会pesadoNuevoIniciar. ">
        <Button type="submit" {...busyProps(action.busy === 'save')}>Guardar configuración</Button>
      </Footer>
    </Section>
  );
}

function MountBadge({ online }: { online: boolean | undefined }) {
  return <ConnectionStatus online={online} />;
}

/* pesado取回来esCompletoConfiguración, 换进CompletopáginaeseunoClave: 屏幕arribaSoloConuno真相, página面arriba别处读到
   也esesteuno次Resultado. 另存uno话, 挂载点EnaquíesNuevo, En"este电脑"ese表单dentro还esantiguo.  */
function MountStatus({ data }: { data: ConfigurationData }) {
  const sources = data.media_sources;
  const action = useAction();
  if (!sources) return null;
  const refresh = () => void action.run('refresh', (signal) => fetchConfiguration(signal),
    (result) => queryClient.setQueryData(CONFIGURATION_KEY, result));
  return (
    <Section title="MontarEstado">
      <FactList>
        {sources.map((row, index) => (
          <Fact key={index} term={<><SourceMark mark={sourceMark(row.location)} />{sourceName(row.location)}</>}>
            {row.path || 'NoConfiguraciónMontar点'}<MountBadge online={row.online} />
          </Fact>
        ))}
      </FactList>
      {action.error ? <Stack divided><ErrorText>{action.error}</ErrorText></Stack> : null}
      <Footer>
        <Button variant="secondary" onClick={refresh} {...busyProps(action.busy === 'refresh')}>ActualizarMontarEstado</Button>
      </Footer>
    </Section>
  );
}
