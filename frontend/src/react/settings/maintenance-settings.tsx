/* "应用y维护"en proceso运行Información, InstalarTutorialyDesinstalar.  */
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

const INTERVALS = [['6', 'Cada 6 horas'], ['24', 'Diario'], ['168', 'Semanal']] as const;

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

/** InstalarTutorialpesado开入口. Tutorial卡本身还画En遗Deja层, aquíSolo按unoabajo让它回来.  */
export function TutorialSettings({ receipt, reopenTutorial }: ConfigurationProps) {
  const action = useAction();
  const reopen = () => void action.run('reopen', () => reopenTutorial(),
    () => receipt('YapesadoNuevoAbrirTutorial de instalación'));
  return (
    <section aria-label="Tutorial de instalación" className="w-full"><SettingsCard>
      <Rows><SettingsRow label="Tutorial de instalación">
        <Button variant="secondary" onClick={reopen} {...busyProps(action.busy === 'reopen')}>Reabrir tutorial</Button>
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
    ? 'AutomáticoActualizarNecesario由Bandeja del sistemaGestionar服务. '
    : initial.download_available
      ? 'Confirma el reinicio e instalación aquí cuando la descarga esté completa.'
      : undefined;
  return (
    <Section title="AutomáticoActualizar" onSubmit={submit}>
      <Rows>
        <SettingsRow label="Verificar automáticamente nueva versión">
          <Switch aria-label="Verificar automáticamente nueva versión" isSelected={mode !== 'off'} isDisabled={!initial.available}
            onChange={(on) => setMode(on ? 'check' : 'off')} />
        </SettingsRow>
        <SettingsRow label="AutomáticoDescargasActualizar">
          <Switch aria-label="AutomáticoDescargasActualizar" isSelected={mode === 'download'}
            isDisabled={!initial.available || !initial.download_available || mode === 'off'}
            onChange={(on) => setMode(on ? 'download' : 'check')} />
        </SettingsRow>
        <SettingsRow label="Frecuencia de verificación" description={help}>
          <Select aria-label="Frecuencia de verificación" selectedKey={String(hours)} isDisabled={!initial.available}
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
    title: 'Desmontar Peach',
    danger: true,
    body: removeData
      ? '将Salir Peach, Quitar程序, Inicio automático, EscritorioImagen标, Configuración, LocalBase de datos, VerRegistro, Credenciales y Caché. OriginalMediosArchivoConservar. '
      : '将Salir Peach yQuitar程序, Inicio automático y EscritorioImagen标. Configuración, LocalBase de datos, VerRegistroyCachéConservar. ',
    confirmLabel: 'Desmontar Peach',
    onConfirm: async () => {
      const result = await apiSend<{ message: string }>('/api/configuration/uninstall', { delete_data: removeData, confirmation: 'Desmontar Peach' });
      setAccepted(result.message);
    },
  });
  // 底栏izquierda边uno句说este按钮此刻意味着什么: 拦住Desinstalar理由(源码Instalar, Actualizar还En跑) y 按abajo去
  // 之posterior回执都En答"este现En能No能按", 摆En正文último尾就得先读完Completo段Descripción才找得到. 
  const status = accepted || uninstall.message;
  const paths = [...new Set([uninstall.data_root, ...uninstall.directories])];
  return (
    <Section id="uninstallPeach" title="Desmontar Peach">
      {uninstall.available ? <Stack><Help>DesmontarQuitar Peach 程序本身, OriginalMediosArchivoConservar. </Help></Stack> : null}
      <Rows>
        <SettingsRow label="Desmontar todo completamente" description="同时EliminarConfiguración, LocalBase de datos, VerRegistro, Credenciales y Caché">
          <Switch aria-label="Desmontar todo completamente" isSelected={removeData} isDisabled={!uninstall.full_available || Boolean(accepted)} onChange={setRemoveData} />
        </SettingsRow>
      </Rows>
      <Stack divided>
        <Disclosure summary="DatosDirectorio">
          {paths.map((path) => (
            <PathLine key={path} path={path} className="text-body-2-regular text-text-secondary" onRevealed={receipt} />
          ))}
        </Disclosure>
      </Stack>
      <Footer status={status ? <p role={accepted ? 'status' : undefined}>{status}</p> : null}>
        <Button variant="danger" disabled={!uninstall.available || Boolean(accepted)} onClick={remove}>Desmontar Peach</Button>
      </Footer>
    </Section>
  );
}
