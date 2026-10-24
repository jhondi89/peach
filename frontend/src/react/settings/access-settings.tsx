/* 本机访问密码，由 BoardUI 原版组件组合；表单值只留在提交期间的组件内存中。
 *
 * 字段是 BoardUI `Input`（React Aria TextField），开关是 BoardUI `Checkbox`，提交键是 BoardUI `Button`；
 * 新密码与确认两框是与首启页共用的 `./password-pair`，分区外框与提示用配置页共用的 `./section`。 */
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
  legacy: 'Ahora se usa una clave de acceso generada por el sistema. Pon tu propia contraseña o desactiva el inicio de sesión.',
  locked: 'No se pueden leer los ajustes de acceso; revisa el archivo de configuración en este equipo.',
  password: 'Hay una contraseña. Los dispositivos nuevos deben iniciar sesión; si marcas “Mantener la sesión iniciada” dura 30 días.',
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
    if (state.mode === 'password' && !current) issues.current_password = 'Escribe la contraseña de acceso actual';
    if (!disable) {
      if (password.length < 8 || password.length > 256) issues.password = 'La contraseña de acceso debe tener entre 8 y 256 caracteres';
      if (password !== confirmation) issues.confirmation = 'Las dos contraseñas no coinciden';
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
      receipt(next.mode === 'open' ? 'Contraseña de acceso desactivada' : 'Configuración guardada');
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
            ? <Note tone="warning" title="No hay contraseña de acceso">Cualquier dispositivo que pueda conectarse a Peach ve la colección con solo abrir la dirección, sin iniciar sesión.</Note>
            : null}
          {state.mode === 'password' || state.mode === 'legacy'
            ? <Checkbox isSelected={disable} onChange={setDisable}>Desactivar contraseña de acceso</Checkbox>
            : null}
          {state.mode === 'password'
            ? <Input id="access-current" type="password" label="Contraseña de acceso actual" autoComplete="current-password" maxLength={256}
                value={current} onChange={setCurrent} isRequired validationBehavior="aria"
                isInvalid={Boolean(fields.current_password)} hint={fields.current_password} />
            : null}
          {editable
            ? <PasswordPair label={state.mode === 'password' ? 'Nueva contraseña de acceso' : 'Poner contraseña de acceso'}
                password={password} confirmation={confirmation} onPassword={setPassword} onConfirmation={setConfirmation}
                disabled={disable} passwordError={fields.password} confirmationError={fields.confirmation}
                passwordHint={disable ? 'No hace falta si desactivas la contraseña.' : 'Al menos 8 caracteres. Al guardar, los demás dispositivos tendrán que volver a iniciar sesión.'} />
            : null}
          {disable ? <Note tone="warning" title="Alcance del acceso">Al guardar, los dispositivos que puedan conectarse a Peach entrarán directamente a la colección.</Note> : null}
          {action.error ? <ErrorText>{action.error}</ErrorText> : null}
        </Stack>
      </div>
      {editable
        ? <Footer><Button type="submit" {...busyProps(action.busy === 'save')}>Guardar configuración</Button></Footer>
        : null}
    </Section>
  );
}
