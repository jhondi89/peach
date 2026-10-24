import { useState } from 'react';

import { SettingsRow } from '@/components/application/settings/settings-rows';
import { Switch } from '@/components/base/switch/switch';

import { apiSend } from '../../api';
import { ErrorText, Help, Rows, Stack } from './section';
import { busyProps, useAction } from './use-action';

export interface RemoteReportingState {
  usage: boolean; errors: boolean; available: boolean;
  fields: { usage: string; errors: string }; notice: string;
}

export function ReportingChoices({ value, onChange, busy = false }: {
  value: RemoteReportingState; onChange(value: RemoteReportingState): void; busy?: boolean;
}) {
  return <>
    <Rows>
      <SettingsRow label="Enviar estadísticas de versión y diagnóstico de errores (recomendado)" description="Envía versión, información del sistema, tipo de fallo, ubicación en el código y número de veces.">
        <Switch aria-label="Enviar estadísticas de versión y diagnóstico de errores (recomendado)" isSelected={value.usage && value.errors}
          onChange={(enabled) => onChange({ ...value, usage: enabled, errors: enabled })} {...busyProps(busy)} />
      </SettingsRow>
    </Rows>
    {!value.available ? <Stack divided><Help>El servicio de envío no está configurado.</Help></Stack> : null}
  </>;
}

export function RemoteReportingSettings({ initial, receipt }: {
  initial: RemoteReportingState; receipt(message: string): void;
}) {
  const [value, setValue] = useState(initial);
  const action = useAction();
  return <>
    <ReportingChoices value={value} busy={action.busy === 'save'} onChange={(next) => {
      void action.run('save', (signal) => apiSend<RemoteReportingState>('/api/configuration/remote-reporting',
      { usage: next.usage, errors: next.errors }, 'POST', signal), (saved) => {
      setValue(saved); receipt('Opciones de diagnóstico guardadas');
    });
    }} />
    {action.error ? <Stack divided><ErrorText>{action.error}</ErrorText></Stack> : null}
  </>;
}
