/* 「应用与维护」中的运行信息、安装教程与卸载。 */
import { useState, type FormEvent } from 'react';
import { confirmModal } from '@peach/legacy/ui';

import { SettingsCard, SettingsRow } from '@/components/application/settings/settings-rows';
import { Button } from '@/components/base/buttons/button';
import { Select, SelectItem } from '@/components/base/select/select';
import { Switch } from '@/components/base/switch/switch';

import { apiSend } from '../../api';
import type {
  AutomaticUpdateState, ConfigurationFact, ConfigurationGroupProps, ConfigurationProps, UninstallState,
} from '../bundle';
import { PathLine } from '../components/path-line';
import { groupRoot } from './configuration-panel';
import { Disclosure, ErrorText, ExternalLink, Fact, FactList, Footer, Help, Rows, Section, Stack } from './section';
import { busyProps, useAction } from './use-action';

const INTERVALS = [['6', 'Cada 6 horas'], ['24', 'Cada día'], ['168', 'Cada semana']] as const;

export function MaintenanceSettings(
  { data, receipt, reopenTutorial, panel }: ConfigurationGroupProps & Pick<ConfigurationProps, 'reopenTutorial'>,
) {
  return (
    <div {...groupRoot(panel)}>
      <Facts facts={data.facts} />
      <TutorialSettings receipt={receipt} reopenTutorial={reopenTutorial} />
      {data.uninstall ? <UninstallSettings uninstall={data.uninstall} receipt={receipt} /> : null}
    </div>
  );
}

/** 安装教程的重开入口。教程卡本身还画在遗留层，这里只按一下让它回来。 */
export function TutorialSettings({ receipt, reopenTutorial }: ConfigurationProps) {
  const action = useAction();
  const reopen = () => void action.run('reopen', () => reopenTutorial(),
    () => receipt('Guía de instalación abierta de nuevo'));
  return (
    <section aria-label="Guía de instalación" className="w-full"><SettingsCard>
      <Rows><SettingsRow label="Guía de instalación">
        <Button variant="secondary" onClick={reopen} {...busyProps(action.busy === 'reopen')}>Volver a abrir la guía</Button>
      </SettingsRow></Rows>
      {action.error ? <Stack><ErrorText>{action.error}</ErrorText></Stack> : null}
    </SettingsCard></section>
  );
}

export function AutomaticUpdates({ initial, receipt }: { initial: AutomaticUpdateState; receipt(message: string): void }) {
  const [mode, setMode] = useState(initial.mode);
  const [hours, setHours] = useState(initial.interval_hours);
  const action = useAction(initial.error);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!initial.available) return;
    void action.run('save', (signal) => apiSend<AutomaticUpdateState>('/api/configuration/automatic-updates',
      { mode, interval_hours: hours }, 'POST', signal), () => receipt('Configuración guardada'));
  };

  const help = !initial.available
    ? 'Las actualizaciones automáticas necesitan el servicio gestionado por el icono de la barra.'
    : initial.download_available
      ? 'Cuando termine la descarga, confirma aquí el reinicio para instalar.'
      : undefined;
  return (
    <Section title="Actualizaciones automáticas" onSubmit={submit}>
      <Rows>
        <SettingsRow label="Buscar versiones nuevas automáticamente">
          <Switch aria-label="Buscar versiones nuevas automáticamente" isSelected={mode !== 'off'} isDisabled={!initial.available}
            onChange={(on) => setMode(on ? 'check' : 'off')} />
        </SettingsRow>
        <SettingsRow label="Descargar actualizaciones automáticamente">
          <Switch aria-label="Descargar actualizaciones automáticamente" isSelected={mode === 'download'}
            isDisabled={!initial.available || !initial.download_available || mode === 'off'}
            onChange={(on) => setMode(on ? 'download' : 'check')} />
        </SettingsRow>
        <SettingsRow label="Frecuencia de búsqueda" description={help}>
          <Select aria-label="Frecuencia de búsqueda" selectedKey={String(hours)} isDisabled={!initial.available}
            onSelectionChange={(key) => { if (key !== null) setHours(Number(key)); }}>
            {INTERVALS.map(([key, name]) => <SelectItem key={key} id={key}>{name}</SelectItem>)}
          </Select>
        </SettingsRow>
      </Rows>
      {action.error ? <Stack divided><ErrorText>{action.error}</ErrorText></Stack> : null}
      <Footer>
        <Button type="submit" disabled={!initial.available} {...busyProps(action.busy === 'save')}>Guardar configuración</Button>
      </Footer>
    </Section>
  );
}

function Facts({ facts }: { facts: ConfigurationFact[] }) {
  return (
    <Section title="Información de ejecución">
      <FactList>
        {facts.map((fact) => (
          <Fact key={fact.term} term={fact.term}>
            {fact.value}
            {fact.download_url ? <ExternalLink href={fact.download_url}>{fact.download_label}</ExternalLink> : null}
          </Fact>
        ))}
      </FactList>
    </Section>
  );
}

export function UninstallSettings(
  { uninstall, receipt }: { uninstall: UninstallState; receipt(message: string): void },
) {
  const [removeData, setRemoveData] = useState(false);
  const [accepted, setAccepted] = useState('');
  const remove = () => void confirmModal({
    title: 'Desinstalar Peach',
    danger: true,
    body: removeData
      ? 'Peach se cerrará y se quitarán el programa, el inicio automático, el icono del escritorio, los ajustes, la base de datos local, el historial, las credenciales y la caché. Tus archivos multimedia se conservan.'
      : 'Peach se cerrará y se quitarán el programa, el inicio automático y el icono del escritorio. Los ajustes, la base de datos local, el historial y la caché se conservan.',
    confirmLabel: 'Desinstalar Peach',
    onConfirm: async () => {
      const result = await apiSend<{ message: string }>('/api/configuration/uninstall', { delete_data: removeData, confirmation: 'Desinstalar Peach' });
      setAccepted(result.message);
    },
  });
  // 底栏左边一句说这颗按钮此刻意味着什么：拦住卸载的理由（源码安装、更新还在跑）和按下去
  // 之后的回执都在答「这颗现在能不能按」，摆在正文末尾就得先读完整段说明才找得到。
  const status = accepted || uninstall.message;
  const paths = [...new Set([uninstall.data_root, ...uninstall.directories])];
  return (
    <Section id="uninstallPeach" title="Desinstalar Peach">
      {uninstall.available ? <Stack><Help>La desinstalación quita el programa Peach; tus archivos multimedia se conservan.</Help></Stack> : null}
      <Rows>
        <SettingsRow label="Desinstalación completa" description="Borrar también ajustes, base de datos local, historial, credenciales y caché">
          <Switch aria-label="Desinstalación completa" isSelected={removeData} isDisabled={!uninstall.full_available || Boolean(accepted)} onChange={setRemoveData} />
        </SettingsRow>
      </Rows>
      <Stack divided>
        <Disclosure summary="Carpeta de datos">
          {paths.map((path) => (
            <PathLine key={path} path={path} className="text-body-2-regular text-text-secondary" onRevealed={receipt} />
          ))}
        </Disclosure>
      </Stack>
      <Footer status={status ? <p role={accepted ? 'status' : undefined}>{status}</p> : null}>
        <Button variant="danger" disabled={!uninstall.available || Boolean(accepted)} onClick={remove}>Desinstalar Peach</Button>
      </Footer>
    </Section>
  );
}
