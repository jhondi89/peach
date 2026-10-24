/* Cloudflare Tunnel: 临时链continuar显示服务实际返回Aleatorio入口, 命名隧道显示Configuraciónbien公开Anfitrión名. 
 *
 * 临时链continuarSinEstable域名 y Independiente身层, 服务端会En `open` Modoabajo拒绝启动. 命名隧道másuno
 * 隧道Token: 它Solo往服务端去, 回来SoloCon"存过Sin", aquí任何时候都No显示Token本身. 
 * ModoSeleccionarSoloEn源码Desarrollo环境出现, Independiente包收到 `named_available` es false.  */
import { useEffect, useState, type FormEvent } from 'react';
import { Radio } from 'react-aria-components';

import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';

import { ApiError, apiSend, errorMessage } from '../../api';
import type { ConfigurationData, TunnelState } from '../bundle';
import { Note } from '../components/note';
import { queryClient } from '../query';
import { SEGMENT, SEGMENTED_TRACK, SegmentedRadioGroup as RadioGroup } from '../components/segmented';
import { CONFIGURATION_KEY, fetchConfiguration } from './configuration';
import { ExternalLink, ErrorText, Footer, Help, Section, Stack } from './section';
import { busyProps, useAction } from './use-action';

/** Conectar握手En服务端进行, página面按固定间隔pesado问, 直到拿到入口或FalloOriginal因.  */
const POLL_INTERVAL = 2000;

const MODES: [TunnelState['mode'], string][] = [['quick', 'Enlace temporal'], ['named', 'Túnel con nombre']];

const HELP: Record<TunnelState['mode'], string> = {
  quick: 'Solo para vista previa temporal. La dirección cambia al reiniciar. Configura la contraseña antes de iniciar.',
  named: '使用你En Cloudflare Vincular固定Nombre de dominio. Iniciaranterior要先ConfiguraciónContraseña de acceso. ',
};

type FieldErrors = Partial<Record<'hostname' | 'mode', string>>;

export function TunnelSettings({ revision: initialRevision, initial, receipt }: {
  revision: string;
  initial: TunnelState;
  receipt(message: string): void;
}) {
  const [state, setState] = useState(initial);
  const [revision, setRevision] = useState(initialRevision);
  const [mode, setMode] = useState<TunnelState['mode']>(initial.mode);
  const [hostname, setHostname] = useState(initial.hostname);
  const [token, setToken] = useState('');
  const [fields, setFields] = useState<FieldErrors>({});
  const action = useAction();
  const active = state.state === 'starting' || state.state === 'running';
  const named = state.named_available && mode === 'named';

  useEffect(() => {
    if (state.state !== 'starting') return undefined;
    const controller = new AbortController();
    const timer = window.setInterval(() => {
      void fetchConfiguration(controller.signal)
        .then((next: ConfigurationData) => {
          if (controller.signal.aborted || !next.tunnel) return;
          // 取回来esCompletoConfiguración, 换进CompletopáginaeseunoClave: 屏幕arribaSoloConuno真相. 
          queryClient.setQueryData(CONFIGURATION_KEY, next);
          setState(next.tunnel);
          setRevision(next.revision);
        })
        .catch(() => undefined);
    }, POLL_INTERVAL);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [state.state]);

  /** 开关 y Guardar走同uno端点: 形态y开关Estadouno次提交, 服务端据此构造启动计划.  */
  const send = (key: 'save' | 'toggle', enabled: boolean, done: (next: TunnelState) => void) => {
    setFields({});
    void action.run(key, (signal) => apiSend<TunnelState & { revision: string }>(
      '/api/configuration/tunnel',
      { revision, enabled, mode, hostname, token }, 'POST', signal,
    ), (next) => {
      setState(next);
      setRevision(next.revision);
      setMode(next.mode);
      setHostname(next.hostname);
      // Token交arriba去之posterior草稿就清掉: página面arribaNoDejauno明文, 回来也SoloCon"存过Sin". 
      setToken('');
      done(next);
    }, (cause) => {
      const payload = cause instanceof ApiError
        ? cause.body as { errors?: FieldErrors; detail?: { errors?: FieldErrors } } : null;
      const errors = payload?.errors || payload?.detail?.errors;
      if (errors) setFields(errors); else action.setError(errorMessage(cause));
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send('save', active, () => receipt('Configuración guardada'));
  };

  const toggle = () => send('toggle', !active, (next) => receipt(
    next.enabled ? '公网入口YaIniciar' : '公网入口YaDetener',
  ));

  return (
    <Section title="Entrada pública de Cloudflare" onSubmit={submit}>
      <Stack>
        {state.named_available
          ? <RadioGroup aria-label="Forma del acceso público (elegir uno)" value={mode} isDisabled={active}
              onChange={(next) => setMode(next as TunnelState['mode'])} className={SEGMENTED_TRACK}>
              {MODES.map(([value, label]) => (
                <Radio key={value} value={value} className={SEGMENT}>{label}</Radio>
              ))}
            </RadioGroup>
          : null}
        <Help>{HELP[named ? 'named' : 'quick']}</Help>
        {named ? <>
          <Input id="tunnel-hostname" label="PúblicoNombre de host" autoComplete="off" maxLength={253}
            value={hostname} onChange={setHostname} isDisabled={active} validationBehavior="aria"
            isInvalid={Boolean(fields.hostname)}
            hint={fields.hostname || 'Hostname en Cloudflare Zero Trust que apunta a esta computadora.'} />
          <Input id="tunnel-token" type="password" label="隧道Token" autoComplete="off" maxLength={2048}
            value={token} onChange={setToken} isDisabled={active} validationBehavior="aria"
            hint={state.token_set
              ? 'Guardado. Dejar vacío para no cambiar.. '
              : 'En Cloudflare Zero Trust 隧道DetallespáginaCopiar. '} />
        </> : null}
        {!state.available
          ? <Note tone="warning" title="No encontrado cloudflared">InstalarOficial cloudflared, 或用ConfiguraciónArchivo tunnel.binary y PEACH_CLOUDFLARED 指定Ruta. </Note>
          : null}
        {state.state === 'running' && state.url
          ? <Note tone="info" title="公网Dirección"><ExternalLink href={state.url}>{state.url}</ExternalLink></Note>
          : null}
        {state.state === 'starting' ? <Note tone="info" title="Conectando">Procesandoetc.Pendiente cloudflared 连arriba Cloudflare 边缘. </Note> : null}
        {state.error ? <ErrorText>{state.error}</ErrorText> : null}
        {action.error ? <ErrorText>{action.error}</ErrorText> : null}
      </Stack>
      <Footer status={state.enabled ? 'Se recupera automáticamente al reiniciar Peach.' : undefined}>
        <Button variant={state.named_available ? 'secondary' : 'primary'} onClick={toggle} {...busyProps(action.busy === 'toggle')}>
          {active ? 'Detener公网入口' : 'Iniciar acceso público'}
        </Button>
        {state.named_available
          ? <Button type="submit" {...busyProps(action.busy === 'save')}>Guardar configuración</Button>
          : null}
      </Footer>
    </Section>
  );
}
