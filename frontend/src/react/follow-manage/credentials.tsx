/* 来源 y 凭证: 哪些站要Iniciar sesión, este电脑arribaIntroduce没Introduce, 去哪儿取. 
 *
 * 值No回显. 服务端Solo报存En性, GuardarÉxito之posterioresteuno栏清空, ver得到SoloCon字段名—Credenciales回到
 * Explorar dispositivodentro就etc.于又másuno处会被翻出来副本.  */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { confirmModal } from '@peach/legacy/ui';

import { Button } from '@/components/base/buttons/button';
import { Chip } from '@/components/base/badges/chip';
import { Input } from '@/components/base/input/input';

import { errorMessage } from '../../api';
import { cardClass } from '../components/card';
import { EmptyState } from '../components/empty-state';
import { Note } from '../components/note';
import { PathLine } from '../components/path-line';
import { queryClient } from '../query';
import { busyProps } from '../settings/use-action';
import { Disclosure, ErrorText, ExternalLink, Help, Section, Stack } from '../settings/section';
import {
  CREDENTIAL_STATE, credentialDone, FOLLOW_CREDENTIALS_KEY, saveCredential,
  type CredentialData, type CredentialRow,
} from './follow-manage';
import { SourceIcon } from './source-view';
import { RiKey2Line } from '@remixicon/react';

const CLEAR_BODY = '将Limpiareste fuente(s)EnEsta máquina y 共享副本En procesoIniciar sesiónCredenciales. ';
const WORLD_READABLE = 'ArchivoPermiso过ancho. En运行 Peach  POSIX Hostarriba收紧Como 0600. ';

/** uno字段此刻样子: 共享回Introduce, 本机存过, 还es从来没Introduce过.  */
function fieldHint(row: CredentialRow, name: string): string {
  if ((row.shared_fields || []).includes(name)) return '来自共享, Deja vacío表示No改';
  return row.fields.includes(name) ? 'Guardado, Deja vacío表示No改' : 'NoIntroduce写';
}

function StateChip({ row }: { row: CredentialRow }) {
  const done = credentialDone(row);
  if (done) return <Chip variant="caption" color="lime">YaConfiguración</Chip>;
  const color = row.requirement === 'required' ? 'yellow'
    : row.requirement === 'blocked' ? 'rose' : 'neutral';
  return <Chip variant="caption" color={color}>{CREDENTIAL_STATE[row.requirement] || ''}</Chip>;
}

function CredentialForm({ row, readOnly, toast }:
{ row: CredentialRow; readOnly: boolean; toast(message: string): void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState('');
  const done = credentialDone(row);

  const write = useMutation({
    mutationFn: (next: Record<string, string>) => saveCredential(row.provider, next),
    onSuccess: (result, next) => {
      /* 共享盘NoEn时posterior端Solo撤掉本机eseuno, 必须让用户ver见: 他以Como撤干净, etc.盘回来
         key 又被Sincronizar回来.  */
      if (result.note) { setProblem(result.note); return }
      setProblem('');
      setValues({});
      void queryClient.invalidateQueries({ queryKey: FOLLOW_CREDENTIALS_KEY, exact: true });
      toast(Object.keys(next).length ? 'GuardadoCredenciales de fuente' : 'YaLimpiar credenciales de fuente');
    },
    onError: (cause) => setProblem(errorMessage(cause)),
  });

  const save = () => {
    const filled = Object.fromEntries(
      Object.entries(values).map(([name, value]) => [name, value.trim()]).filter(([, value]) => value));
    if (!Object.keys(filled).length) { setProblem('Sin contenido ingresado'); return }
    write.mutate(filled);
  };

  return (
    <div className="flex flex-col gap-3">
      <Help>
        {row.why}
        {/* "去取"跳到ese站自己página面, 会离开 Peach, 所以带exterior链标.  */}
        {row.where ? <> <ExternalLink href={row.where}>Obtener credenciales</ExternalLink></> : null}
      </Help>
      {row.howto ? <Help>{row.howto}</Help> : null}
      <div className="flex w-full flex-col gap-3">
        {(row.needs || []).map((name) => (
          <Input key={name} type="password" label={name} placeholder={fieldHint(row, name)}
            autoComplete="off" spellCheck="false" isDisabled={readOnly}
            value={values[name] || ''} onChange={(value) => setValues({ ...values, [name]: value })}
            className="w-full min-w-0" />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="small" disabled={readOnly} {...busyProps(write.isPending)}
          onClick={save}>Guardar configuración</Button>
        {done ? (
          <Button variant="danger" size="small" disabled={readOnly} {...busyProps(write.isPending)}
            onClick={() => void confirmModal({
              title: 'Limpiar credenciales de fuente', body: CLEAR_BODY, confirmLabel: 'Limpiar credenciales de fuente', danger: true,
              onConfirm: () => write.mutateAsync({}),
            })}>Limpiar</Button>
        ) : null}
      </div>
      {problem ? <ErrorText>{problem}</ErrorText> : null}
      {(row.shared_fields || []).length
        ? <Help>{`${row.shared_fields!.join(', ')} Sí从共享副本回Introduce, Esta máquinaSin单独存. Limpiar会两边uno起删. `}</Help>
        : null}
      {row.path
        ? <Disclosure summary="CredencialesArchivo"><PathLine path={row.path} className="font-mono text-caption-1-regular text-text-tertiary" onRevealed={toast} /></Disclosure>
        : null}
    </div>
  );
}

function CredentialSection({ row, readOnly, toast }:
{ row: CredentialRow; readOnly: boolean; toast(message: string): void }) {
  const head = (
    <span className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="inline-flex size-3.5 shrink-0 items-center justify-center">
        <SourceIcon provider={row.provider} />
      </span>
      <b className="min-w-0 text-body-medium wrap-anywhere text-text-primary">{row.provider_label}</b>
      <StateChip row={row} />
      {row.missing.length
        ? <Chip variant="caption" color="rose">{`缺 ${row.missing.join(', ')}`}</Chip>
        : null}
    </span>
  );
  if (row.requirement === 'none' || row.requirement === 'blocked') {
    return (
      <div className="flex flex-wrap items-center gap-3 border-b border-separator-border px-6 py-5 last:border-b-0 max-sm:px-4">
        {head}
        {row.requirement === 'blocked' ? <Help>{row.why}</Help> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 border-b border-separator-border px-6 py-5 last:border-b-0 max-sm:px-4">
      {head}
      <Disclosure summary={credentialDone(row) ? 'Modificar credenciales' : 'Rellenar credenciales'}
        defaultOpen={row.requirement === 'required' && !credentialDone(row)}>
        <CredentialForm row={row} readOnly={readOnly} toast={toast} />
      </Disclosure>
      {row.world_readable ? <Note tone="error" title="CredencialesArchivoPermiso过ancho">{WORLD_READABLE}</Note> : null}
    </div>
  );
}

export function Credentials(
  { data, readOnly, toast, embedded = false }:
  { data: CredentialData; readOnly: boolean; toast(message: string): void; embedded?: boolean },
) {
  const rows = data.providers || [];
  const pending = rows.filter((row) => row.requirement === 'required' && !credentialDone(row));
  if (!rows.length) {
    return <EmptyState shell="plain" icon={RiKey2Line} title="SinpuedeConfiguraciónFuente">Yacontinuar入Sitio及其CredencialesEstado会MostrarEnaquí. </EmptyState>;
  }
  const pendingLabel = pending.length ? <span className="text-body-2-regular text-text-error-primary">{`${pending.length} PendienteConfiguración`}</span> : null;
  const groups = <>{[
        { title: 'Credenciales configurables', rows: rows.filter((row) => row.requirement !== 'none' && row.requirement !== 'blocked') },
        { title: 'No se necesitan credenciales', rows: rows.filter((row) => row.requirement === 'none') },
        { title: 'No soportado por ahora', rows: rows.filter((row) => row.requirement === 'blocked') },
      ].filter((group) => group.rows.length).map((group) => (
        <section key={group.title} aria-label={group.title} className="flex flex-col gap-2">
          <h4 className="text-body-medium text-text-secondary">{group.title}</h4>
          <div className={cardClass({ variant: 'outlined', padding: 'none', className: 'flex flex-col overflow-hidden' })}>
            {group.rows.map((row) => (
              <CredentialSection key={row.provider} row={row} readOnly={readOnly} toast={toast} />
            ))}
          </div>
        </section>
      ))}</>;
  return embedded ? <Section title="Credenciales de fuente" aside={pendingLabel || undefined}><Stack>{groups}</Stack></Section> :
    <div className={cardClass({ padding: 'none', className: 'flex flex-col gap-4 px-6 py-5 max-sm:px-4' })}>
      <div className="flex flex-wrap items-center gap-2"><h3 className="mr-auto text-title-2-medium text-text-primary">Credenciales de fuente</h3>{pendingLabel}</div>
      {groups}
    </div>;
}
