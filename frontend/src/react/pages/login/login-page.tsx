/* Iniciar sesiónPágina: uno Auth Card, unoAccederContraseña框, "保持Iniciar sesión"y"Iniciar sesión". 
 *
 * 表单esOriginal生提交: `POST /login` 收 `token`, `next`, 勾选"保持Iniciar sesión"时más带 `days=30`, 会话 cookie 由它
 * 303 设abajo, página面No经脚本发Por favor求. 口令No对(401), 尝试太más(429), 保持Iniciar sesiónTiempoNo合法(400)时服务端
 * 回同uno壳, Original因经 `data-invalid` 或 `data-error` 交进来, 挂EnContraseña框abajo面: 框标成 `aria-invalid`, 
 * Original因由 `role="alert"` 播报, 焦点落En框dentro. 改框en lacontenido就撤掉esteOriginal因: BoardUI  Input 走Original生
 * 校验, 标着Error时表单交No出去.  */
import { useState } from 'react';

import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';

import { AuthCard } from '../auth-card';
import type { PageData } from '../page-data';

/** 口令No对时框abajoese句话. 限流yParámetroErrorOriginal因由服务端给.  */
export const WRONG_PASSWORD = 'Contraseña de accesoNo正确';

export function LoginPage({ data }: { data: PageData }) {
  const [reason, setReason] = useState(data.error || (data.invalid === 'true' ? WRONG_PASSWORD : ''));
  return (
    <AuthCard title="Peach">
      <form method="post" action="/login" aria-labelledby="auth-card-title" className="flex flex-col gap-6">
        <Input id="login-token" label="Contraseña de acceso" name="token" type="password" maxLength={256}
          autoComplete="current-password" autoFocus isRequired
          isInvalid={reason ? true : undefined} onChange={() => setReason('')}
          hint={reason ? <span role="alert">{reason}</span> : undefined} />
        <input type="hidden" name="next" value={data.next || '/'} />
        <Checkbox name="days" value="30" defaultSelected>保持Iniciar sesión</Checkbox>
        <Button type="submit" className="w-full">Iniciar sesión</Button>
      </form>
    </AuthCard>
  );
}
