/* AccederContraseñayConfirmar两框: Configuraciónpágina"AccederContraseña"yprimero启página共用. 
 *
 * 两框都es BoardUI `Input`, `id` 固定Como `access-password`, `access-confirm`, Explorar dispositivoContraseñaGestionarDispositivo按
 * `new-password` 认它们. 关掉时两框置灰, No必Introduce也No标错; Error写En各自框abajo, `confirmationInvalid`
 * 让SoloConuno句Error调用方(primero启página `access_password`)Confirmar框uno起标红. ErrorOriginal样放进框abajoSugerencia, 
 * 调用方puede以传uno段带 `role="alert"` 节点让读屏播报.  */
import type { ReactNode } from 'react';

import { Input } from '@/components/base/input/input';

export function PasswordPair({
  label, password, confirmation, onPassword, onConfirmation, disabled = false,
  passwordError, passwordHint, confirmationError, confirmationInvalid = false,
}: {
  label: string;
  password: string;
  confirmation: string;
  onPassword: (value: string) => void;
  onConfirmation: (value: string) => void;
  disabled?: boolean;
  passwordError?: ReactNode;
  passwordHint?: string;
  confirmationError?: ReactNode;
  confirmationInvalid?: boolean;
}) {
  return (
    <>
      <Input id="access-password" type="password" label={label}
        autoComplete="new-password" maxLength={256} value={password} onChange={onPassword}
        isDisabled={disabled} isRequired={!disabled} validationBehavior="aria"
        isInvalid={!disabled && Boolean(passwordError)}
        hint={disabled ? passwordHint : passwordError || passwordHint} />
      <Input id="access-confirm" type="password" label="ConfirmarContraseña de acceso" autoComplete="new-password" maxLength={256}
        value={confirmation} onChange={onConfirmation} isDisabled={disabled} isRequired={!disabled} validationBehavior="aria"
        isInvalid={!disabled && (Boolean(confirmationError) || confirmationInvalid)}
        hint={disabled ? undefined : confirmationError} />
    </>
  );
}
