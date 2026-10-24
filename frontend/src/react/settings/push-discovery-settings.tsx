/* "Push发现": NuevoArchivoLlegar就进DatosBiblioteca, No必etc.Siguiente轮Todo量escanear. 
 *
 * 两通道各uno开关. 本地ese订阅本机ArchivocarpetaArchivo系统事件; 网盘eseetc. CloudDrive2 往
 * Peach 推uno通知, 所以给出uno段能Completo贴进它"Configuracióncontenido" TOML, exterior加uno"云端Ruta
 * anterior缀 → 媒体根"对应表. 定期Todo量escanearNo受esteunopágina影响, 它仍es漏发时兜底. 
 *
 * 地址, ClaveNo单独列成读数: 它们SoloEnese段ConfiguracióndentroCon用, 抄两处Solo会抄漏uno处. Completo段由服务端
 * 拼(`peach.push_discovery.clouddrive_config`). 
 *
 * anterior缀怎么算合法, 根esNoesya声明过, 同样由服务端判; esteunopáginaSoloese句Original因显示出来. 
 *
 * CompletoSoloConuno行: 读数写En它所属ese开关Descripcióndentro, Configuración通过共用代码展示yCopiar, 
 * anterior缀表排En最posterior. 读数yConfiguración跟着各自开关收起: 网盘通道关着时ese段Configuración指向uno件No会
 * 发生事; 本机监视EnTotal开关关着时读作"Sin运行", 分No出es没开还es坏.  */
import { useState, type FormEvent } from 'react';
import { RiDeleteBinLine } from '@remixicon/react';

import { SettingsRow } from '@/components/application/settings/settings-rows';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { Select, SelectItem } from '@/components/base/select/select';
import { Switch } from '@/components/base/switch/switch';

import { apiSend, errorMessage } from '../../api';
import type { PushDiscoveryPrefix, PushDiscoveryState } from '../bundle';
import { CodeBlock } from '../components/code-block';
import { Disclosure, ErrorText, FieldLabel, Footer, Help, Rows, Section, Stack } from './section';
import { busyProps, useAction } from './use-action';

const SAVE_URL = '/api/configuration/push-discovery';
const SECRET_URL = '/api/configuration/push-discovery/secret';

export function PushDiscoveryForm({ initial, receipt }: {
  initial: PushDiscoveryState;
  receipt(message: string): void;
}) {
  const [state, setState] = useState(initial);
  const [rows, setRows] = useState<PushDiscoveryPrefix[]>(initial.prefixes);
  const [failure, setFailure] = useState('');
  const action = useAction();
  const roots = state.media_roots;
  /* 读数说es服务端此刻En跑什么, 所以按yaGuardar开关收放: 拨unoabajo开关它们就跟着出现话, 
     写还esAnterior次Estado, "本机Archivocarpeta监视 · Sin运行"会被读成"Abrir也没用". 
     要Introduce东西(anterior缀表)反过来跟着拨到哪儿走, 否则得先Guardaruno次才能Introduce.  */
  const [live, setLive] = useState(initial);

  const settle = (next: PushDiscoveryState, message: string) => {
    setState(next);
    setLive(next);
    setRows(next.prefixes);
    setFailure('');
    receipt(message);
  };

  const edit = (index: number, patch: Partial<PushDiscoveryPrefix>) =>
    setRows((list) => list.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = {
      enabled: state.enabled, watch_local: state.watch_local, cloud: state.cloud, prefixes: rows,
    };
    void action.run('save', (signal) => apiSend<PushDiscoveryState>(SAVE_URL, body, 'POST', signal),
      (next) => settle(next, 'Configuración guardada'), (cause) => setFailure(errorMessage(cause)));
  };

  const rotate = () => {
    void action.run('secret', (signal) => apiSend<PushDiscoveryState>(SECRET_URL, {}, 'POST', signal),
      (next) => settle(next, 'Ya更换共享Clave'), (cause) => setFailure(errorMessage(cause)));
  };

  const ingested = `Catalogado ${live.queue.ingested} Archivo`
    + (live.queue.pending ? `, Coladentro还Con ${live.queue.pending} Resultado` : '');
  const watching = live.local_running
    ? `Procesando监视 ${live.local_roots.join(', ')}` : live.local_message || 'No está ejecutándose';

  return (
    <Section title="PushDescubrir" onSubmit={submit}>
      <Rows>
        <SettingsRow label="Nuevo archivo se agrega automáticamente a la biblioteca" description={live.enabled ? ingested : undefined}>
          <Switch aria-label="Nuevo archivo se agrega automáticamente a la biblioteca" isSelected={state.enabled} isDisabled={!state.available}
            onChange={(enabled) => setState({ ...state, enabled })} />
        </SettingsRow>
        <SettingsRow label="Monitorear esta máquinaCarpeta" description={live.enabled && live.watch_local ? watching : undefined}>
          <Switch aria-label="Monitorear esta máquinaCarpeta" isSelected={state.watch_local}
            isDisabled={!state.available || !state.enabled}
            onChange={(watchLocal) => setState({ ...state, watch_local: watchLocal })} />
        </SettingsRow>
        <SettingsRow label="Recibir notificaciones de CloudDrive2">
          <Switch aria-label="Recibir notificaciones de CloudDrive2" isSelected={state.cloud}
            isDisabled={!state.available || !state.enabled}
            onChange={(cloud) => setState({ ...state, cloud })} />
        </SettingsRow>
        {live.enabled && live.cloud ? (
          <SettingsRow label="Configuración de Webhook" description={live.config_toml
            ? '贴进 CloudDrive2"Configuración → Webhooks", Necesario会员; 更换Claveposterior要pesado贴. '
            : live.origin
              ? 'Aún no hay共享Clave, Guardar configuraciónposterior生成. '
              : '要先Con CloudDrive2 能Acceso HTTPS Dirección才能生成. '}>
          </SettingsRow>
        ) : null}
      </Rows>
      {live.enabled && live.cloud && live.config_toml ? (
        <Stack divided>
          <div className="flex flex-col gap-3">
            {/* 收起来es因Como抄它人No用读它: tresdiez行dentroSoloCon地址 y Clave两处跟este机DispositivoCon关, 
                两处都ya经Introducebien. 展开esDeja给要核对推到哪儿eseuno次.  */}
            <Disclosure summary="Ver configuración">
              <CodeBlock code={live.config_toml} language="toml" label="Configuración de CloudDrive2" bounded={false} copyLabel="CopiarConfiguración"
                onCopy={() => receipt('Copiado Configuración de CloudDrive2')} />
              <Help>Windows 桌面版Pegarposterior显示"Sin效"时, este段存成 .toml Archivo, 放进
                %LOCALAPPDATA%\CloudDrive.WinUI\webhooks\ Directorio. </Help>
            </Disclosure>
          </div>
        </Stack>
      ) : null}
      {state.enabled && state.cloud ? (
        <Stack divided>
          <div className="flex flex-col gap-3">
            <FieldLabel>Prefijo de ruta en la nube</FieldLabel>
            <div role="group" aria-label="Prefijo de ruta en la nube" className="flex flex-col gap-3">
              {rows.map((row, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Input className="min-w-0 flex-1" aria-label={`Prefijo de ruta en la nube ${index + 1}`}
                    placeholder="/115" autoComplete="off" maxLength={200} value={row.prefix}
                    onChange={(prefix) => edit(index, { prefix })} />
                  <Select aria-label={`anterior缀 ${index + 1} 对应Medios根`} selectedKey={row.root}
                    onSelectionChange={(key) => { if (key !== null) edit(index, { root: String(key) }); }}>
                    {roots.map((root) => <SelectItem key={root} id={root}>{root}</SelectItem>)}
                  </Select>
                  <Button variant="danger" iconOnly leadingIcon={RiDeleteBinLine} aria-label="QuitaresteunoResultado"
                    onClick={() => setRows((list) => list.filter((_row, i) => i !== index))} />
                </div>
              ))}
            </div>
            <div>
              <Button variant="secondary" size="small"
                onClick={() => setRows((list) => [...list, { prefix: '', root: roots[0] ?? '' }])}>
                添加anterior缀
              </Button>
            </div>
          </div>
        </Stack>
      ) : null}
      {/* GuardarFalloOriginal因归esteuno, No跟着anterior缀表uno起收起: 域名或anterior缀写坏时ese表puede能正bien
          没En屏arriba, 而Fallo正es刚按abajoese"GuardarConfiguración".  */}
      {failure || action.error
        ? <Stack divided><ErrorText>{failure || action.error}</ErrorText></Stack> : null}
      <Footer>
        {live.enabled && live.cloud && live.config_toml ? (
          <Button variant="secondary" onClick={rotate} disabled={!state.available}
            {...busyProps(action.busy === 'secret')}>更换Clave</Button>
        ) : null}
        <Button type="submit" disabled={!state.available} {...busyProps(action.busy === 'save')}>
          GuardarConfiguración
        </Button>
      </Footer>
    </Section>
  );
}
