/* primero次Configuración表单. 题目, Predeterminado值, 显隐y随Plataforma变化文案来自 `GET /api/setup/questions`; 
 * AgruparTítulo, 按钮y"CompletadoConfiguraciónposterior"eseuno组espágina面骨架, 写Enaquí. 
 *
 * 提交走 `POST /api/setup`. 400  `errors` 按题目 key 写回Original: 媒体Directorio按行对齐, Completo表No成立
 * eseuno句放EnDirectorio区arriba方; alto级Configuracióndentro任uno项出错就展开它; AccederContraseña出错时开关保持Abrir. yaIntroduce
 * contenido都DejaEnOriginal地, 焦点落到No.uno标错框.  */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Radio } from 'react-aria-components';
import { RiAddLine } from '@remixicon/react';

import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';
import { Label } from '@/components/base/input/label';
import { Switch } from '@/components/base/switch/switch';

import { SEGMENT, SEGMENTED_TRACK, SegmentedRadioGroup } from '../../components/segmented';
import { busyProps } from '../../settings/busy-props';
import { FolderRow, isCloudSource, MediaReadPolicy, MediaReadPolicyHelp, SourceSelect, useFolderRows } from '../../settings/folder-rows';
import { PasswordPair } from '../../settings/password-pair';
import { ReportingChoices } from '../../settings/remote-reporting-settings';
import { Disclosure, ErrorText, ExternalLink, Help } from '../../settings/section';
import { CardGroup, GroupTitle } from '../auth-card';
import {
  describeFailure, pickFolder, SetupRequestError, submitSetup,
  type SetupDone, type SetupErrors, type SetupFolder, type SetupQuestion, type SetupQuestions, type SetupSubmission,
} from './setup-api';

/** este几项出错时"alto级Configuración"自己展开: 错En折叠en la框, 人verNo见.  */
const ADVANCED_KEYS = ['data_root', 'host', 'port', 'mdns_name'];

/** 媒体Directorioeseuno项Error: y行数对得arriba就按行写回, 否则esCompleto表uno句.  */
function folderErrors(value: SetupErrors[string], count: number): { rows: string[]; table: string } {
  if (Array.isArray(value)) {
    return value.length === count ? { rows: value, table: '' } : { rows: [], table: value.filter(Boolean).join(' ') };
  }
  return { rows: [], table: value ?? '' };
}

function scanLabel(paths: string[]): string {
  if (!paths.length) return 'FinalizarConfiguraciónposteriorEscanearyCompletar detalles';
  if (paths.length === 1) return `FinalizarConfiguraciónposteriorEscanearyCompletar detalles: ${paths[0]}`;
  return `FinalizarConfiguraciónposteriorEscaneareste ${paths.length} CarpetayCompletar detalles`;
}

const text = (value: SetupErrors[string]) => (Array.isArray(value) ? value.filter(Boolean).join(' ') : value ?? '');

export function SetupForm({ setup, onDone }: { setup: SetupQuestions; onDone: (done: SetupDone) => void }) {
  const media = setup.questions.find((question) => question.input === 'folders');
  const others = setup.questions.filter((question) => question.input !== 'folders');
  const sources = setup.media_sources.map(({ value, label }) => [value, label] as const);
  const blank = (path = ''): SetupFolder => ({ path, location: setup.media_source_default, root: '', cost: setup.media_source_default === 'local' ? 'free' : '' });
  const folders = useFolderRows<SetupFolder>({
    initial: () => [blank(media?.default ?? '')], blank: () => blank(), pickFolder, describe: describeFailure,
    focusAfterPick: true,
  });
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(others.map((question) => [question.key, question.default])));
  const [accessOn, setAccessOn] = useState(setup.access_enabled);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [scanNow, setScanNow] = useState(setup.scan_now);
  const [historyGuide, setHistoryGuide] = useState(setup.history_guide);
  const [reporting, setReporting] = useState(setup.remote_reporting);
  const [errors, setErrors] = useState<SetupErrors>({});
  const [tableError, setTableError] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [requireReadPolicy, setRequireReadPolicy] = useState(false);
  // 每次因ComoError要展开就换uno key: 折叠按初始Estado展开, yaIntroduce值都Enesteuno层 state dentro. 
  const [advancedOpenings, setAdvancedOpenings] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  // 写回之posterior焦点交给No.uno标错框. ErrorEn await 之posterior才到, React NoEn点击eseuno刻Sincronizar提交, 
  // 所以etc.esteuno轮落到 DOM arriba再找, No赌Siguiente帧之anterioruno定画完. 
  const [errorRound, setErrorRound] = useState(0);
  useEffect(() => {
    if (errorRound) form.current?.querySelector<HTMLElement>('input[aria-invalid="true"]')?.focus();
  }, [errorRound]);
  // 写回Error放进框abajoSugerencia: `role="alert"` 让读屏En它出现时播报uno次, Sugerencia本身仍由
  // `aria-describedby` 挂En框arriba, 文字Enpágina面arribaSoloConesteuno. `key` 跟着提交轮次换, 同uno句Error
  // 再提交uno次也会pesadoNuevo播报. 
  const announce = (message: string | undefined) =>
    message ? <span key={errorRound} role="alert">{message}</span> : undefined;

  const visible = (question: SetupQuestion) =>
    !question.visible_when || Object.entries(question.visible_when).every(([key, value]) => values[key] === value);
  const setValue = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const missing = folders.rows.findIndex((row) => !row.cost);
    if (missing >= 0) {
      setRequireReadPolicy(true);
      requestAnimationFrame(() => form.current?.querySelector<HTMLButtonElement>(`[data-media-read-policy="${missing}"] button`)?.focus());
      return;
    }
    setBusy(true);
    setFailure('');
    const submission: SetupSubmission = {
      media_dir: folders.rows, access_enabled: accessOn, scan_now: scanNow, history_guide: historyGuide,
      ...(reporting ? { remote_reporting: { usage: reporting.usage, errors: reporting.errors } } : {}),
    };
    // 隐藏题No提交, 服务端按题目Predeterminado值补arriba. 
    for (const question of others) if (visible(question)) submission[question.key] = values[question.key] ?? '';
    if (accessOn) Object.assign(submission, { access_password: password, access_confirm: confirmation });
    try {
      onDone(await submitSetup(submission));
    } catch (cause) {
      if (cause instanceof SetupRequestError && cause.status === 400 && cause.errors) {
        const found = cause.errors;
        const { rows, table } = folderErrors(found.media_dir, folders.rows.length);
        folders.setErrors(rows);
        setTableError(table);
        setErrors(found);
        if (ADVANCED_KEYS.some((key) => found[key])) setAdvancedOpenings((count) => count + 1);
        if (found.access_password) setAccessOn(true);
        setErrorRound((count) => count + 1);
      } else {
        setFailure(describeFailure(cause));
      }
    } finally {
      setBusy(false);
    }
  };

  const field = (question: SetupQuestion) => {
    const error = text(errors[question.key]);
    const help = question.help.join('');
    if (question.input === 'choice') {
      const labelId = `setup-${question.key}-label`;
      return (
        <div key={question.key} className="flex flex-col gap-1.5">
          <Label id={labelId} elementType="span">{question.label}</Label>
          <SegmentedRadioGroup aria-labelledby={labelId} orientation="horizontal" className={SEGMENTED_TRACK}
            value={values[question.key] ?? question.default} onChange={(value) => setValue(question.key, value)}>
            {(question.options ?? []).map((option) => (
              <Radio key={option.value} value={option.value} className={SEGMENT}>{option.label}</Radio>
            ))}
          </SegmentedRadioGroup>
          {help ? <Help>{help}</Help> : null}
          {error ? <ErrorText key={errorRound}>{error}</ErrorText> : null}
        </div>
      );
    }
    const Suffix = () => <span className="shrink-0 pr-1 text-body-regular text-text-secondary">{question.suffix}</span>;
    return (
      <Input key={question.key} id={`f-${question.key}`} label={question.label} isRequired={question.required}
        inputMode={question.input === 'number' ? 'numeric' : undefined} autoComplete="off" spellCheck="false"
        value={values[question.key] ?? ''} onChange={(value) => setValue(question.key, value)}
        leadingAddon={question.prefix
          ? <span className="shrink-0 pl-1 text-body-regular text-text-secondary">{question.prefix}</span>
          : undefined}
        trailingIcon={question.suffix ? Suffix : undefined}
        validationBehavior="aria" isInvalid={Boolean(error)} hint={announce(error) ?? (help || undefined)} />
    );
  };

  const filled = folders.rows.map((row) => row.path.trim()).filter(Boolean);
  const cloud = folders.rows.some((row) => isCloudSource(row.location));
  return (
    <form ref={form} noValidate onSubmit={(event) => void submit(event)} aria-labelledby="auth-card-title"
      className="flex flex-col gap-6">
      {media ? (
        <CardGroup first labelledBy="setup-media-title">
          <GroupTitle id="setup-media-title">
            {media.label}<span aria-hidden className="ml-0.5 text-text-error-primary">*</span>
          </GroupTitle>
          {tableError ? <ErrorText key={errorRound}>{tableError}</ErrorText> : null}
          <div role="group" aria-labelledby="setup-media-title" className="flex flex-col gap-3">
            {folders.rows.map((row, index) => (
              <FolderRow key={index} label={`${media.label} ${index + 1}`} path={row.path}
                onPath={(path) => folders.edit(index, { path })} error={announce(folders.errors[index])}
                inputRef={folders.inputRef(index)} picking={folders.picking === index}
                onPick={() => void folders.pick(index)}
                onRemove={folders.rows.length > 1 ? () => { folders.remove(index); addButton.current?.focus(); } : undefined}>
                <SourceSelect index={index} value={row.location} options={sources}
                  onChange={(location) => folders.edit(index, { location, cost: location === 'local' ? 'free' : '' })} />
                <MediaReadPolicy index={index} cost={row.cost ?? ''}
                  error={requireReadPolicy && !row.cost ? 'Por favor selecciona la estrategia de lectura de medios' : undefined}
                  onChange={(cost) => folders.edit(index, { cost })} />
              </FolderRow>
            ))}
          </div>
          <Button ref={addButton} variant="secondary" leadingIcon={RiAddLine} className="self-start" onClick={folders.add}>
            添加媒体Biblioteca
          </Button>
          {cloud ? (
            <>
              <MediaReadPolicyHelp />
              <Help>{setup.cloud.help}<ExternalLink href={setup.cloud.link.url}>{setup.cloud.link.label}</ExternalLink></Help>
              {setup.cloud.dependencies.map((dependency) => (
                <Help key={dependency.name}>
                  {dependency.message}<ExternalLink href={dependency.download_url}>{dependency.download_label}</ExternalLink>
                </Help>
              ))}
            </>
          ) : null}
          {media.help.map((line) => <Help key={line}>{line}</Help>)}
        </CardGroup>
      ) : null}

      <CardGroup labelledBy="setup-access-title">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <GroupTitle id="setup-access-title">Contraseña de acceso</GroupTitle>
            <p id="setup-access-description" className="text-body-2-regular text-text-secondary">Activarposterior, Acceso Peach Necesario先Iniciar sesión. </p>
          </div>
          <Switch aria-labelledby="setup-access-title" aria-describedby="setup-access-description"
            isSelected={accessOn} onChange={setAccessOn} />
        </div>
        <Help>NoConfiguraciónContraseña时, 能Conectar到 Peach Dispositivopuede直continuar进入. </Help>
        {accessOn
          ? <PasswordPair label="Contraseña de acceso" password={password} confirmation={confirmation}
              onPassword={setPassword} onConfirmation={setConfirmation}
              passwordError={announce(text(errors.access_password))} passwordHint="Por favorIntroducir 8–256 字符. "
              confirmationInvalid={Boolean(errors.access_password)} />
          : null}
      </CardGroup>

      <CardGroup>
        <Disclosure key={advancedOpenings} summary="alto级Configuración" defaultOpen={advancedOpenings > 0}>
          <div className="flex flex-col gap-4">{others.filter(visible).map(field)}</div>
        </Disclosure>
      </CardGroup>

      <CardGroup labelledBy="setup-options-title">
        <GroupTitle id="setup-options-title">FinalizarConfiguraciónposterior</GroupTitle>
        <div className="flex flex-col gap-1.5">
          <Checkbox isSelected={scanNow} onChange={setScanNow}>{scanLabel(filled)}</Checkbox>
          <Help>读取YaCon NFO  y Portada, Recolectar缺失Detalles. que cumpleAutomáticoReglaDetalles会EnProcesamiento completadoposteriorGuardar en base de datos, 其余DetallesDejaPendienteConfirmar. </Help>
        </div>
        <section aria-labelledby="setup-history-title" className="flex flex-col gap-1.5 border-t border-separator-border pt-4">
          <h3 id="setup-history-title" className="flex items-center gap-2 text-body-medium text-text-primary">
            Explorar dispositivoHistorialRegistro<span className="text-body-2-regular text-text-tertiary">Opcional</span>
          </h3>
          <Checkbox isSelected={historyGuide} onChange={setHistoryGuide}>continuarabajo来ImportarExplorar dispositivoHistorialRegistro</Checkbox>
          <Help>用于生成PreferenciasAnálisis. FinalizarConfiguraciónposteriorSeleccionar读取este电脑, 或ImportarOtroDispositivoRegistro; 也puedeMás tarde从"Preferencias"进入. </Help>
        </section>
      </CardGroup>

      {failure ? <ErrorText>{failure}</ErrorText> : null}
      {reporting ? <CardGroup>
        <GroupTitle>VersiónEstadísticasyDiagnóstico de errores</GroupTitle>
        <ReportingChoices value={reporting} onChange={setReporting} />
        <Help>ColecciónyPreferencias明细SubirPredeterminadoDesactivar, puedeEn"App y mantenimiento"verySeleccionar. </Help>
      </CardGroup> : null}
      <Button type="submit" className="self-start" {...busyProps(busy)}>FinalizarConfiguración</Button>
    </form>
  );
}
