/* "云Descargar": 磁力交给 115 或 PikPak 离线Descargar, Archivo落Enya挂载网盘Directorio, 由Push发现入Biblioteca. 
 *
 * 两卡. No.unoes地址, Token, 目标DirectorioyEsperandoarriba限: 115 走 CloudDrive2  gRPC, TokenEn
 * CloudDrive2"Configuración → API Token"dentro生成. Verificar去问 CloudDrive2 ConSin离线Permisos, 目标Directorio能No能
 * 离线, 115 还剩几配额, Solo读, No提交: 地址 y Token都yaGuardar时卡片unoAbrir就按yaGuardarConfiguración查uno遍, 
 * "GuardarConfiguración"Respuestadentro也带着uno, "Verificar"Clave按此刻Introduce值pesado查. 115 目标DirectorioDeja空Guardar时, 服务端按
 * Push发现推unoDirectorio, ya经存En就直continuar存arriba. 地址, 还没存目标Directorioy PikPak 根Deja空时, Verificar
 * 探测到, 按Push发现推出值Introduce回表单, 点"GuardarConfiguración"才落盘; 推出DirectorioNo存En时给uno
 * "NuevoesteDirectorio", SoloCon点才En CloudDrive2 dentro建. No.doses PikPak 账号, 提供账号ContraseñayExplorar dispositivoIniciar sesión. 
 *
 * TokenyContraseñaSolo往本机CredencialesArchivo写, 读InterfazSolo回"存没存过", 所以Token框Guardarposterior清空, Sugerencia改成
 * "yaGuardar, Deja空No改". PikPak 要人机Verificar时服务端回unoVerificarpágina地址, aquí给出链continuar让用户EnExplorar dispositivo
 * dentroCompletado, Peach No替他过Verificar.  */
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/base/buttons/button';
import { Chip } from '@/components/base/badges/chip';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';
import { Select, SelectItem } from '@/components/base/select/select';

import { apiGet, apiSend, errorMessage } from '../../api';
import type {
  ConfigurationPanel, DownloadCheckReport, DownloadConfig, DownloadSaveResult, DownloadSettingsState, PikPakLoginResult,
} from '../bundle';
import { LoadingDots } from '../components/loading-dots';
import { Note } from '../components/note';
import { SourceLabel, PROVIDER_ICONS } from '../components/source-label';
import { groupRoot } from './configuration-panel';
import {
  ErrorText, ExternalLink, Fact, FactList, FieldLabel, Footer, Help, Section, Stack,
} from './section';
import { busyProps, useAction } from './use-action';
import { JavBrowserSettings } from './jav-browser-settings';

export const DOWNLOADS_URL = '/api/configuration/downloads';
const CHECK_URL = '/api/configuration/downloads/check';
const FOLDER_URL = '/api/configuration/downloads/folder';
const LOGIN_URL = '/api/configuration/downloads/pikpak/login';
const LOGOUT_URL = '/api/configuration/downloads/pikpak/logout';
const BROWSER_URL = '/api/configuration/downloads/pikpak/browser-login';
const POLL_MS = 2000;

/** "Descargar渠道"Agrupar: CloudDrive2 y PikPak 账号.  */
export function DownloadGroup({ initial, receipt, panel }: {
  initial: DownloadSettingsState;
  receipt(message: string): void;
  panel?: ConfigurationPanel;
}) {
  return (
    <div {...groupRoot(panel)}>
      <DownloadSettings initial={initial} receipt={receipt} />
    </div>
  );
}

export function DownloadSettings({ initial, receipt }: {
  initial: DownloadSettingsState;
  receipt(message: string): void;
}) {
  const [state, setState] = useState(initial);
  // 账号框放Enarriba面esteuno层: 云Descargar卡要知道用户ConSinEn用 PikPak, 没En用就No报 PikPak 根Sugerencia. 
  const [username, setUsername] = useState('');
  const pikpakAccount = state.pikpak.logged_in || Boolean(username.trim());
  return (
    <>
      <DownloadForm state={state} settle={setState} receipt={receipt} pikpakAccount={pikpakAccount} />
      <PikPakAccount state={state} settle={setState} receipt={receipt} username={username} setUsername={setUsername} />
      <JavBrowserSettings receipt={receipt} refreshKey={JSON.stringify([
        state.config, state.token_set, state.pikpak.logged_in,
      ])} />
    </>
  );
}

interface CardProps {
  state: DownloadSettingsState;
  settle(next: DownloadSettingsState): void;
  receipt(message: string): void;
}

function DownloadForm({ state, settle, receipt, pikpakAccount }: CardProps & { pikpakAccount: boolean }) {
  const [config, setConfig] = useState<DownloadConfig>(state.config);
  const [token, setToken] = useState('');
  const [hours, setHours] = useState(String(state.config.wait_hours));
  const [report, setReport] = useState<DownloadCheckReport | null>(null);
  const [detected, setDetected] = useState('');
  const [suggested, setSuggested] = useState<Suggestions>(NO_SUGGESTIONS);
  const [failure, setFailure] = useState('');
  const [saveBlocked, setSaveBlocked] = useState(false);
  const action = useAction();
  const target = (key: '115' | 'pikpak') => config.targets[key] ?? '';
  const setTarget = (key: '115' | 'pikpak', value: string) =>
    setConfig({ ...config, targets: { ...config.targets, [key]: value } });
  // Verificar标ComoNo存En, 用户也没改过eseDirectorio, 存abajo来提交时Solo会报"SinesteArchivocarpeta". 
  const missing = Boolean(suggested.target && !suggested.target.exists && target('115') === suggested.target.path);

  // unoVerificarInforme落到表单arriba: Deja空地址, 115 目标Directorioy PikPak 根Introduce建议值, 用户Introduce过No覆盖. 
  // `saved` es服务端Guardar时ya经存en la 115 目标Directorio, 它No再Introduce回, 也No再说"GuardarConfiguraciónposterior生效". 
  const show = (next: DownloadCheckReport, blank: Blanks, saved = '') => {
    const folder = blank.target ? next.suggested_target : null;
    const stored = Boolean(folder && saved && folder.path === saved);
    const root = blank.root ? next.suggested_pikpak_root : '';
    setConfig((current) => ({
      ...current,
      clouddrive_address: blank.address && next.address ? next.address : current.clouddrive_address,
      targets: folder && !stored ? { ...current.targets, '115': folder.path } : current.targets,
      pikpak_root: root || current.pikpak_root,
    }));
    setReport(next);
    setDetected(blank.address ? next.address : '');
    setSuggested({ target: folder, root, saved: stored });
    setSaveBlocked(false);
    setFailure('');
  };

  // 地址 y Token都yaGuardar时, 卡片unoAbrir就按yaGuardarConfiguración查uno遍; TokenSoloEn服务端取, No经página面. 
  useEffect(() => {
    if (!state.available || !state.config.clouddrive_address || !state.token_set) return;
    const blank = { address: false, target: !state.config.targets['115'], root: !state.config.pikpak_root };
    void action.run('auto', (signal) => apiGet<DownloadCheckReport>(CHECK_URL, signal),
      (next) => show(next, blank), (cause) => setFailure(errorMessage(cause)));
    // SoloEn挂载时查esteuno次, 之posterior由"GuardarConfiguración"y"Verificar"continuar手. 
  }, []);

  // GuardarRespuestadentro带着按yaGuardarConfiguración做VerificarInforme, 直continuar渲染; 115 目标DirectorioDeja空时服务端ya按Push发现Introducearriba. 
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (missing) {
      setSaveBlocked(true);
      return;
    }
    const blankTarget = !target('115').trim();
    const body = { ...config, wait_hours: hours, token, pikpak_account: pikpakAccount };
    void action.run('save', (signal) => apiSend<DownloadSaveResult>(DOWNLOADS_URL, body, 'POST', signal),
      (next) => {
        const { report: checked, ...settings } = next;
        settle(settings);
        setConfig(settings.config);
        setHours(String(settings.config.wait_hours));
        setToken('');
        if (checked) {
          show(checked, { address: !settings.config.clouddrive_address, target: blankTarget,
            root: !settings.config.pikpak_root }, settings.config.targets['115'] ?? '');
        } else {
          setReport(null);
          setDetected('');
          setSuggested(NO_SUGGESTIONS);
          setSaveBlocked(false);
          setFailure('');
        }
        receipt('Configuración guardada');
      }, (cause) => setFailure(errorMessage(cause)));
  };

  // "Verificar"按此刻Introduce值pesado查: 地址Deja空时服务端探测本机Puerto, DirectorioDeja空时按Push发现推建议值. 
  const check = () => {
    const blank = { address: !config.clouddrive_address.trim(), target: !target('115').trim(),
      root: !config.pikpak_root };
    const body = { clouddrive_address: config.clouddrive_address, token, target: target('115'),
      pikpak_root: config.pikpak_root, pikpak_account: pikpakAccount };
    void action.run('check', (signal) => apiSend<DownloadCheckReport>(CHECK_URL, body, 'POST', signal),
      (next) => show(next, blank), (cause) => setFailure(errorMessage(cause)));
  };

  // SoloEn用户点"NuevoesteDirectorio"时调 CloudDrive2 建Directorio, 建bienposterior服务端按esteDirectorio再Verificaruno遍. 
  const create = (path: string) => {
    const body = { clouddrive_address: config.clouddrive_address, token, path, pikpak_root: config.pikpak_root,
      pikpak_account: pikpakAccount };
    void action.run('folder', (signal) => apiSend<DownloadCheckReport>(FOLDER_URL, body, 'POST', signal),
      (next) => {
        setReport(next);
        setSuggested((current) => ({ ...current, target: { path, exists: true } }));
        setSaveBlocked(false);
        setFailure('');
        receipt('YaNuevoDirectorio');
      }, (cause) => setFailure(errorMessage(cause)));
  };

  return (
    <Section title="Descarga en la nube" onSubmit={submit}>
      <Stack>
        <Input label="Dirección de CloudDrive2" placeholder="Deja vacíoAutomáticoBuscar" autoComplete="off" maxLength={200}
          value={config.clouddrive_address} isDisabled={!state.available}
          onChange={(value) => setConfig({ ...config, clouddrive_address: value })} />
        <Input label="Token API de CloudDrive2" type="password" autoComplete="off" maxLength={400}
          placeholder={state.token_set ? 'Guardado. Dejar vacío para no cambiar.' : 'En CloudDrive2"Configuración → API Token"En proceso生成'}
          hint="NecesarioSin conexiónTareaPermiso. "
          value={token} isDisabled={!state.available} onChange={setToken} />
        <Input label={<SourceLabel source="115" label="Directorio destino de 115" />} placeholder="Deja vacío时按PushDescubrirAutomáticoIntroduce写" autoComplete="off" maxLength={300}
          validationBehavior="aria" isInvalid={missing}
          hint={missing ? (saveBlocked ? '先NuevoesteDirectorio, 或Introduce写YaConDirectorio. ' : 'esteEl directorio no existe. ') : '应 resultado(s)于Automático入BibliotecaPrefijo de ruta en la nubeinterior. '}
          value={target('115')} isDisabled={!state.available} onChange={(value) => setTarget('115', value)} />
        <Input label={<SourceLabel source="pikpak" label="Directorio destino de PikPak" />} placeholder="以 / 开头Almacenamiento en la nubeRuta" autoComplete="off" maxLength={300}
          hint="Directorio要Ya经存En. "
          value={target('pikpak')} isDisabled={!state.available} onChange={(value) => setTarget('pikpak', value)} />
        <div className="flex flex-col gap-1">
          <FieldLabel><SourceLabel source="pikpak" label="Directorio de medios correspondiente al directorio raíz de PikPak" /></FieldLabel>
          {state.pikpak_roots.length ? (
            <Select aria-label="Directorio de medios correspondiente al directorio raíz de PikPak" selectedKey={config.pikpak_root || null}
              isDisabled={!state.available} placeholder="Verificar时按PushDescubrir选"
              onSelectionChange={(key) => setConfig({ ...config, pikpak_root: key === null ? '' : String(key) })}>
              {state.pikpak_roots.map((root) => <SelectItem key={root} id={root}>{root}</SelectItem>)}
            </Select>
          ) : (
            <Help>先En"Biblioteca y catalogación"Añadir PikPak MontarCarpeta. </Help>
          )}
        </div>
        <Input label="etc.Pendientearriba限(hora(s))" type="number" inputMode="numeric" autoComplete="off"
          hint={`Tiempo de espera标Como停滞; puedeIntroduce 1–${state.max_wait_hours} hora(s). `}
          value={hours} isDisabled={!state.available} onChange={setHours} />
      </Stack>
      {action.busy === 'auto' ? <Stack divided><LoadingDots label="ProcesandoVerificar CloudDrive2" /></Stack> : null}
      {report ? (
        <CheckReport report={report} detected={detected} suggested={suggested}
          create={state.available ? create : undefined} creating={action.busy === 'folder'} />
      ) : null}
      {failure || action.error ? <Stack divided><ErrorText>{failure || action.error}</ErrorText></Stack> : null}
      <Footer status={state.available ? undefined : 'Descarga en la nube solo disponible donde se permita escritura en BD.'}>
        <Button variant="secondary" onClick={check} disabled={!state.available} {...busyProps(action.busy === 'check')}>Verificar conexión</Button>
        <Button type="submit" disabled={!state.available} {...busyProps(action.busy === 'save')}>Guardar configuración</Button>
      </Footer>
    </Section>
  );
}

/** esteuno次Verificar推出建议值. 目标DirectorioNo存En时也Introduce回去, 表单它标成Sin效; `saved` Como真时目标Directorio
 *  ya经由GuardarConfiguración存arriba.  */
interface Suggestions {
  target: DownloadCheckReport['suggested_target'];
  root: string;
  saved: boolean;
}

const NO_SUGGESTIONS: Suggestions = { target: null, root: '', saved: false };

/** 哪些字段Deja空, Deja空才Introduce建议值.  */
interface Blanks {
  address: boolean;
  target: boolean;
  root: boolean;
}

function CheckReport({ report, detected, suggested, create, creating }: {
  report: DownloadCheckReport;
  detected: string;
  suggested: Suggestions;
  create?: (path: string) => void;
  creating: boolean;
}) {
  const folder = suggested.target;
  return (
    <Stack divided>
      <FactList>
        {detected ? <Fact term="Dirección de CloudDrive2">{`探测到 ${detected}, Guardar configuraciónposterior生效`}</Fact> : null}
        {folder?.exists ? (
          <Fact term={<SourceLabel source="115" label="Directorio destino de 115" />}>
            {suggested.saved ? `Ya按PushDescubrirIntroduce入 ${folder.path}` : `按PushDescubrirIntroduce入 ${folder.path}, Guardar configuraciónposterior生效`}
          </Fact>
        ) : null}
        {folder && !folder.exists ? (
          <Fact term={<SourceLabel source="115" label="Directorio destino de 115" />}>
            {`${folder.path} No存En`}
            {create ? <Button variant="secondary" size="small" onClick={() => create(folder.path)} {...busyProps(creating)}>NuevoesteDirectorio</Button> : null}
          </Fact>
        ) : null}
        {suggested.root ? <Fact term={<SourceLabel source="pikpak" label="Directorio raíz de PikPak" />}>{`按PushDescubrirIntroduce入 ${suggested.root}, Guardar configuraciónposterior生效`}</Fact> : null}
        {report.permissions.length ? (
          <Fact term="Sin conexiónPermiso">
            <Chip variant="caption" color={report.missing.length ? 'yellow' : 'lime'}>
              {report.missing.length ? `缺menos: ${report.missing.join(', ')}` : 'Completo'}
            </Chip>
          </Fact>
        ) : null}
        {report.folder ? (
          <Fact term="Directorio destino">{report.folder.can_offline ? `${report.folder.path} puede以Descarga sin conexión` : `${report.folder.path} No支持Descarga sin conexión`}</Fact>
        ) : null}
        {report.quota ? (
          <Fact term={<SourceLabel source="115" label="Cuota sin conexión de 115" />}>{`Este mes还剩 ${report.quota.left} Resultado, 共 ${report.quota.total} Resultado`}</Fact>
        ) : null}
      </FactList>
      {report.problems.map((problem) => <ErrorText key={problem}>{problem}</ErrorText>)}
    </Stack>
  );
}

/** PikPak 账号卡. 主Rutaes"用Explorar dispositivoIniciar sesión"(ADR-0093): 服务端拉起uno Peach 专用Explorar dispositivo窗口, 
 *  用户Endentro面Iniciar sesión, Peach 取走网página端会话posterior关窗, 之posteriorSolo由 Peach 续期. aquí拉起posterior每两秒读uno次Estado, 
 *  直到登bien, Cancelar, Tiempo de espera或Fallo. 账号Contraseña表单直continuar显示, Iniciar sesiónMétodoEn底栏Seleccionar.  */
function PikPakAccount({ state, settle, receipt, username, setUsername }: CardProps & {
  username: string;
  setUsername(value: string): void;
}) {
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [failure, setFailure] = useState('');
  // Solo报esteunopáginadentro拉起ese次Iniciar sesión怎么收场; 服务端Deja着Anterior次ResultadoNo当成Nuevo消息. 
  const [outcome, setOutcome] = useState('');
  const action = useAction();
  const account = state.pikpak;
  const browser = state.pikpak_browser;
  const waiting = browser.state === 'waiting';

  useEffect(() => {
    if (!waiting) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await apiGet<DownloadSettingsState>(BROWSER_URL, controller.signal);
        if (controller.signal.aborted) return;
        settle(next);
        if (next.pikpak_browser.state === 'done') receipt('YaIniciar sesión PikPak');
        else if (next.pikpak_browser.state !== 'waiting') setOutcome(next.pikpak_browser.message);
        if (next.pikpak_browser.state !== 'waiting') return;
      } catch (cause) {
        if (controller.signal.aborted) return;
        setFailure(errorMessage(cause));
      }
      timer = setTimeout(poll, POLL_MS);
    };
    timer = setTimeout(poll, POLL_MS);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [waiting]);

  const openBrowser = () => {
    setOutcome('');
    void action.run('browser', (signal) => apiSend<DownloadSettingsState>(BROWSER_URL, {}, 'POST', signal),
      (next) => { settle(next); setFailure(''); }, (cause) => setFailure(errorMessage(cause)));
  };

  const cancelBrowser = () => {
    void action.run('cancel', (signal) => apiSend<DownloadSettingsState>(`${BROWSER_URL}/cancel`, {}, 'POST', signal),
      (next) => { settle(next); setFailure(''); setOutcome(next.pikpak_browser.message); },
      (cause) => setFailure(errorMessage(cause)));
  };

  const login = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (account.logged_in) return;
    const body = { username, password, remember };
    void action.run('login', (signal) => apiSend<PikPakLoginResult>(LOGIN_URL, body, 'POST', signal),
      (result) => {
        settle(result.settings);
        setFailure('');
        if (!result.ok) {
          setCaptcha(result.captcha_url ?? '');
          return;
        }
        setCaptcha('');
        setPassword('');
        receipt('YaIniciar sesión PikPak');
      }, (cause) => setFailure(errorMessage(cause)));
  };

  const logout = () => {
    void action.run('logout', (signal) => apiSend<DownloadSettingsState>(LOGOUT_URL, {}, 'POST', signal),
      (next) => { settle(next); setFailure(''); receipt('YaCerrar sesión PikPak'); },
      (cause) => setFailure(errorMessage(cause)));
  };

  const passwordForm = (
    <>
      <Input label="Cuenta" placeholder="Correo electrónico或Teléfono号" autoComplete="username" maxLength={200}
        value={username} isDisabled={!state.available} onChange={setUsername} />
      <Input label="Contraseña" type="password" autoComplete="current-password" maxLength={200}
        value={password} isDisabled={!state.available} onChange={setPassword} />
      <Checkbox isSelected={remember} isDisabled={!state.available} onChange={setRemember}>
        GuardarContraseña, Iniciar sesión过期时自动pesadoNuevoIniciar sesión
      </Checkbox>
      {captcha ? (
        <Note tone="warning" title="NecesarioVerificación CAPTCHA"
          extra={<div className="pt-2"><ExternalLink href={captcha}>Abrir PikPak Verificarpágina</ExternalLink></div>}>
          EnExplorar dispositivodentroCompletadoVerificarposterior, 回到aquí再点uno次"Iniciar sesión". 
        </Note>
      ) : null}
    </>
  );
  const passwordLogin = (
    <Button type="submit" disabled={!state.available || waiting} {...busyProps(action.busy === 'login')}>Iniciar sesión</Button>
  );
  const outcomeFailed = browser.state === 'timeout' || browser.state === 'failed';

  return (
    <Section title="Cuenta de PikPak" icon={<PROVIDER_ICONS.pikpak />} onSubmit={login}>
      {account.logged_in ? (
        <FactList>
          <Fact term="Cuenta">{account.username || 'YaIniciar sesión'}</Fact>
          {account.method === 'browser' ? (
            <Fact term="Iniciar sesiónMétodo">Explorar dispositivoIniciar sesión, 由 Peach 续期</Fact>
          ) : (
            <Fact term="Contraseña">{account.remember ? 'Guardado, Iniciar sesión过期时AutomáticopesadoNuevoIniciar sesión' : 'NoGuardar, Iniciar sesión过期posteriorNecesario回到aquípesadoNuevoIniciar sesión'}</Fact>
          )}
        </FactList>
      ) : (
        <Stack>
          {outcome ? (outcomeFailed ? <ErrorText>{outcome}</ErrorText> : <Help role="status">{outcome}</Help>) : null}
          {passwordForm}
        </Stack>
      )}
      {failure || action.error ? <Stack divided><ErrorText>{failure || action.error}</ErrorText></Stack> : null}
      <Footer status={!account.logged_in && waiting
        ? <LoadingDots label={browser.message || 'etc.你EnExplorar dispositivo窗口dentroIniciar sesión PikPak'} /> : null}>
        {account.logged_in ? (
          <Button variant="secondary" onClick={logout} disabled={!state.available} {...busyProps(action.busy === 'logout')}>Cerrar sesión</Button>
        ) : <>{passwordLogin}{!browser.available ? null : waiting ? (
          <Button variant="secondary" type="button" onClick={cancelBrowser} {...busyProps(action.busy === 'cancel')}>Cancelar</Button>
        ) : (
          <Button type="button" onClick={openBrowser} disabled={!state.available}
            {...busyProps(action.busy === 'browser')}>用Explorar dispositivoIniciar sesión</Button>
        )}</>}
      </Footer>
    </Section>
  );
}
