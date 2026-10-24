/* "应用y维护"en proceso开机自启, 桌面rápido捷MétodoyVersiónActualizar.  */
import { useState, type FormEvent } from 'react';

import { SettingsRow } from '@/components/application/settings/settings-rows';
import { Button } from '@/components/base/buttons/button';
import { Switch } from '@/components/base/switch/switch';

import { apiSend } from '../../api';
import type { ConfigurationGroupProps, StartupState } from '../bundle';
import { groupRoot } from './configuration-panel';
import { AutomaticUpdates } from './maintenance-settings';
import { ReleaseUpdates } from './release-updates';
import { RemoteReportingSettings } from './remote-reporting-settings';
import { LibrarySharingSettings } from './library-sharing-settings';
import { ErrorText, Footer, Help, Rows, Section, Stack } from './section';
import { busyProps, useAction } from './use-action';

export function GeneralSettings({ data, receipt, panel }: ConfigurationGroupProps) {
  return (
    <div {...groupRoot(panel)}>
      {data.remote_reporting || data.library_sharing ? <Section title="DatosSubir">
        {data.remote_reporting ? <RemoteReportingSettings initial={data.remote_reporting} receipt={receipt} /> : null}
        {data.library_sharing ? <div className="border-t border-separator-border">
          <LibrarySharingSettings initial={data.library_sharing} receipt={receipt} />
        </div> : null}
      </Section> : null}
      {data.startup ? <StartupSettings startup={data.startup} receipt={receipt} /> : null}
      {data.automatic_updates ? <AutomaticUpdates initial={data.automatic_updates} receipt={receipt} /> : null}
      {data.updates ? <ReleaseUpdates initial={data.updates} initialJob={data.update_job} /> : null}
    </div>
  );
}

export function StartupSettings({ startup, receipt }: { startup: StartupState; receipt(message: string): void }) {
  const [enabled, setEnabled] = useState(startup.enabled);
  const [silent, setSilent] = useState(startup.silent);
  const [desktop, setDesktop] = useState(startup.desktop);
  const action = useAction();
  // 桌面rápido捷MétodoSoloCon Windows Con, 桌面arribaya经摆着另unoInstalarImagen标时也No给动; 两情况posterior端
  // 都En desktop_message dentro说Original因, 所以按它ConSincontenido判禁用, NoEnanterior端判Plataforma. 
  const desktopReady = startup.available && !startup.desktop_message;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!startup.available) return;
    void action.run('save', (signal) => apiSend('/api/configuration/startup', { enabled, silent, desktop }, 'POST', signal),
      () => receipt('Configuración guardada'));
  };

  return (
    <Section title="Inicio automático" onSubmit={submit}>
      <Rows>
        <SettingsRow label="Iniciar Peach al arrancar">
          <Switch aria-label="Iniciar Peach al arrancar" isSelected={enabled} isDisabled={!startup.available} onChange={setEnabled} />
        </SettingsRow>
        <SettingsRow label="Solo iniciar en la bandeja del sistema, no abrir página web">
          <Switch aria-label="Solo iniciar en la bandeja del sistema, no abrir página web" isSelected={silent} isDisabled={!startup.available || !enabled} onChange={setSilent} />
        </SettingsRow>
        <SettingsRow label="Crear acceso directo en el escritorio" description={startup.desktop_message || undefined}>
          <Switch aria-label="Crear acceso directo en el escritorio" isSelected={desktop} isDisabled={!desktopReady} onChange={setDesktop} />
        </SettingsRow>
      </Rows>
      {startup.message || action.error ? (
        <Stack divided>
          {startup.message ? <Help>{startup.message}</Help> : null}
          {action.error ? <ErrorText>{action.error}</ErrorText> : null}
        </Stack>
      ) : null}
      <Footer>
        <Button type="submit" disabled={!startup.available} {...busyProps(action.busy === 'save')}>Guardar configuración</Button>
      </Footer>
    </Section>
  );
}
