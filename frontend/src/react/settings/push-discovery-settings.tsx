/* 「推送发现」：新文件落地就进数据库，不必等下一轮全量扫描。
 *
 * 两条通道各一个开关。本地那条订阅本机文件夹的文件系统事件；网盘那条等 CloudDrive2 往
 * Peach 推一条通知，所以给出一段能整个贴进它「配置内容」的 TOML，外加一张「云端路径
 * 前缀 → 媒体根」的对应表。定期全量扫描不受这一页影响，它仍是漏发时的兜底。
 *
 * 地址、密钥不单独列成读数：它们只在那段配置里有用，抄两处只会抄漏一处。整段由服务端
 * 拼（`peach.push_discovery.clouddrive_config`）。
 *
 * 前缀怎么算合法、根是不是已声明过，同样由服务端判；这一页只把那句原因显示出来。
 *
 * 整块只有一种行：读数写在它所属那个开关的说明里，配置通过共用代码块展示与复制，
 * 前缀表排在最后。读数与配置跟着各自的开关收起：网盘通道关着时那段配置指向一件不会
 * 发生的事；本机监视在总开关关着时读作「没有运行」，分不出是没开还是坏了。 */
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
  /* 读数说的是服务端此刻在跑什么，所以按已保存的开关收放：拨一下开关它们就跟着出现的话，
     写的还是上一次的状态，「本机文件夹监视 · 没有运行」会被读成「打开了也没用」。
     要填的东西（前缀表）反过来跟着拨到哪儿走，否则得先保存一次才能填。 */
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
      (next) => settle(next, 'Clave compartida cambiada'), (cause) => setFailure(errorMessage(cause)));
  };

  const ingested = `${live.queue.ingested} archivos importados`
    + (live.queue.pending ? `, quedan ${live.queue.pending} en la cola` : '');
  const watching = live.local_running
    ? `Vigilando ${live.local_roots.join('、')}` : live.local_message || 'No está en marcha';

  return (
    <Section title="Detección automática" onSubmit={submit}>
      <Rows>
        <SettingsRow label="Importar en cuanto llegue un archivo nuevo" description={live.enabled ? ingested : undefined}>
          <Switch aria-label="Importar en cuanto llegue un archivo nuevo" isSelected={state.enabled} isDisabled={!state.available}
            onChange={(enabled) => setState({ ...state, enabled })} />
        </SettingsRow>
        <SettingsRow label="Vigilar carpetas de este equipo" description={live.enabled && live.watch_local ? watching : undefined}>
          <Switch aria-label="Vigilar carpetas de este equipo" isSelected={state.watch_local}
            isDisabled={!state.available || !state.enabled}
            onChange={(watchLocal) => setState({ ...state, watch_local: watchLocal })} />
        </SettingsRow>
        <SettingsRow label="Recibir avisos de CloudDrive2">
          <Switch aria-label="Recibir avisos de CloudDrive2" isSelected={state.cloud}
            isDisabled={!state.available || !state.enabled}
            onChange={(cloud) => setState({ ...state, cloud })} />
        </SettingsRow>
        {live.enabled && live.cloud ? (
          <SettingsRow label="Configuración del webhook" description={live.config_toml
            ? 'Pégala en CloudDrive2, “Ajustes → Webhooks” (requiere membresía); si cambias la clave, vuelve a pegarla.'
            : live.origin
              ? 'Aún no hay clave compartida; se genera al guardar la configuración.'
              : 'Primero necesitas una dirección HTTPS a la que CloudDrive2 pueda acceder.'}>
          </SettingsRow>
        ) : null}
      </Rows>
      {live.enabled && live.cloud && live.config_toml ? (
        <Stack divided>
          <div className="flex flex-col gap-3">
            {/* 收起来是因为抄它的人不用读它：三十行里只有地址和密钥两处跟这台机器有关，
                两处都已经填好了。展开是留给要核对推到哪儿的那一次。 */}
            <Disclosure summary="Ver configuración">
              <CodeBlock code={live.config_toml} language="toml" label="Configuración de CloudDrive2" bounded={false} copyLabel="Copiar configuración"
                onCopy={() => receipt('Configuración de CloudDrive2 copiada')} />
              <Help>Si en la versión de escritorio de Windows aparece “no válido” al pegarla, guarda esto como archivo .toml en la carpeta %LOCALAPPDATA%\CloudDrive.WinUI\webhooks\.</Help>
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
                  <Select aria-label={`Raíz de medios para el prefijo ${index + 1}`} selectedKey={row.root}
                    onSelectionChange={(key) => { if (key !== null) edit(index, { root: String(key) }); }}>
                    {roots.map((root) => <SelectItem key={root} id={root}>{root}</SelectItem>)}
                  </Select>
                  <Button variant="danger" iconOnly leadingIcon={RiDeleteBinLine} aria-label="Quitar esta entrada"
                    onClick={() => setRows((list) => list.filter((_row, i) => i !== index))} />
                </div>
              ))}
            </div>
            <div>
              <Button variant="secondary" size="small"
                onClick={() => setRows((list) => [...list, { prefix: '', root: roots[0] ?? '' }])}>
                Añadir prefijo
              </Button>
            </div>
          </div>
        </Stack>
      ) : null}
      {/* 保存失败的原因归这一块，不跟着前缀表一起收起：域名或前缀写坏时那张表可能正好
          没在屏上，而失败的正是刚按下的那颗「保存配置」。 */}
      {failure || action.error
        ? <Stack divided><ErrorText>{failure || action.error}</ErrorText></Stack> : null}
      <Footer>
        {live.enabled && live.cloud && live.config_toml ? (
          <Button variant="secondary" onClick={rotate} disabled={!state.available}
            {...busyProps(action.busy === 'secret')}>Cambiar clave</Button>
        ) : null}
        <Button type="submit" disabled={!state.available} {...busyProps(action.busy === 'save')}>
          Guardar configuración
        </Button>
      </Footer>
    </Section>
  );
}
