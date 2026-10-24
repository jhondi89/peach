/* 本机AccederContraseña, 由 BoardUI Original版组件组合; 表单值SoloDejaEn提交期间组件interior存en proceso. 
 *
 * 字段es BoardUI `Input`(React Aria TextField), 开关es BoardUI `Checkbox`, 提交Clavees BoardUI `Button`; 
 * NuevoContraseñayConfirmar两框esyprimero启página共用 `./password-pair`, 分区exterior框ySugerencia用Configuraciónpágina共用 `./section`.  */
import { useRef, useState, type FormEvent } from 'react';

import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';

import { ApiError, apiSend, errorMessage } from '../../api';
import type { AccessSettingsProps, AccessState } from '../bundle';
import { Note } from '../components/note';
import { PasswordPair } from './password-pair';
import { ErrorText, Footer, Help, Section, Stack } from './section';
import { busyProps, useAction } from './use-action';

type FieldErrors = Partial<Record<'current_password' | 'password' | 'confirmation', string>>;

const HELP: Partial<Record<AccessState['mode'], string>> = {
  legacy: 'Actual使用Sistema生成Acceso口令. 改设自己Contraseña, 或DesactivarIniciar sesión要求. ',
  locked: 'AccesoConfiguraciónNinguno法读取, Por favorEnEsta máquinaVerificarArchivo de configuración. ',
  password: 'YaConfiguraciónContraseña. NuevoDispositivoInicio de sesión requerido, Iniciar sesión时勾选"保持Iniciar sesión"puede保持 30 día(s). ',
};

export function AccessSettings({ initial, receipt }: AccessSettingsProps) {
  const [state, setState] = useState(initial);
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [disable, setDisable] = useState(false);
  const [fields, setFields] = useState<FieldErrors>({});
  const body = useRef<HTMLDivElement>(null);
  const action = useAction();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const issues: FieldErrors = {};
    if (state.mode === 'password' && !current) issues.current_password = 'Por favorIntroducirActualContraseña de acceso';
    if (!disable) {
      if (password.length < 8 || password.length > 256) issues.password = 'Contraseña de acceso需Como 8–256 字符';
      if (password !== confirmation) issues.confirmation = 'Las contraseñas no coinciden';
    }
    setFields(issues);
    if (Object.keys(issues).length) {
      requestAnimationFrame(() => body.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus());
      return;
    }
    void action.run('save', (signal) => apiSend<AccessState>('/api/configuration/access', {
      revision: state.revision, action: disable ? 'disable' : 'set', confirm_disable: disable,
      current_password: current, password: disable ? '' : password, confirmation: disable ? '' : confirmation,
    }, 'POST', signal), (next) => {
      setState(next); setCurrent(''); setPassword(''); setConfirmation(''); setDisable(false); setFields({});
      receipt(next.mode === 'open' ? 'YaDesactivarContraseña de acceso' : 'Configuración guardada');
    }, (cause) => {
      const payload = cause instanceof ApiError ? cause.body as { errors?: FieldErrors; detail?: { errors?: FieldErrors } } : null;
      const errors = payload?.errors || payload?.detail?.errors;
      if (errors) setFields(errors); else action.setError(errorMessage(cause));
    });
  };

  const help = HELP[state.mode];
  const editable = state.mode !== 'locked';
  return (
    <Section title="Contraseña de acceso" onSubmit={submit}>
      <div ref={body}>
        <Stack>
          {help ? <Help>{help}</Help> : null}
          {state.mode === 'open'
            ? <Note tone="warning" title="NoConfiguraciónContraseña de acceso">能Conectar到 Peach DispositivoAbrirDirección就能verColección, NoInicio de sesión requerido. </Note>
            : null}
          {state.mode === 'password' || state.mode === 'legacy'
            ? <Checkbox isSelected={disable} onChange={setDisable}>DesactivarContraseña de acceso</Checkbox>
            : null}
          {state.mode === 'password'
            ? <Input id="access-current" type="password" label="ActualContraseña de acceso" autoComplete="current-password" maxLength={256}
                value={current} onChange={setCurrent} isRequired validationBehavior="aria"
                isInvalid={Boolean(fields.current_password)} hint={fields.current_password} />
            : null}
          {editable
            ? <PasswordPair label={state.mode === 'password' ? 'NuevoContraseña de acceso' : 'ConfiguraciónContraseña de acceso'}
                password={password} confirmation={confirmation} onPassword={setPassword} onConfirmation={setConfirmation}
                disabled={disable} passwordError={fields.password} confirmationError={fields.confirmation}
                passwordHint={disable ? 'DesactivarContraseña de acceso时Ninguno需Introduce写. ' : '至menos 8 字符. GuardarposteriorOtroDispositivoNecesariopesadoNuevoIniciar sesión. '} />
            : null}
          {disable ? <Note tone="warning" title="Alcance de acceso">Guardarposterior, 能Conectar到 Peach Dispositivo将直continuarAccesoColección. </Note> : null}
          {action.error ? <ErrorText>{action.error}</ErrorText> : null}
        </Stack>
      </div>
      {editable
        ? <Footer><Button type="submit" {...busyProps(action.busy === 'save')}>Guardar configuración</Button></Footer>
        : null}
    </Section>
  );
}
