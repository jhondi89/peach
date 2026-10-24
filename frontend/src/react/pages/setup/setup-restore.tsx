import { useState, type FormEvent } from 'react';

import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';

import { busyProps } from '../../settings/busy-props';
import { describeFailure, restoreSetup, SetupRequestError, type SetupDone } from './setup-api';

export function SetupRestore({ onDone }: { onDone: (done: SetupDone) => void }) {
  const [path, setPath] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      onDone(await restoreSetup(path));
    } catch (cause) {
      const detail = cause instanceof SetupRequestError ? cause.errors?.data_root : undefined;
      setError(typeof detail === 'string' ? detail : describeFailure(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <Input label="YaConDatosDirectorio" value={path} onChange={setPath} isRequired autoComplete="off" spellCheck="false"
        validationBehavior="aria" isInvalid={Boolean(error)}
        hint={error ? <span role="alert">{error}</span> : 'SeleccionarContiene config.toml  y  database CarpetaDatosDirectorio. '} />
      <Button type="submit" className="self-start" {...busyProps(busy)}>{busy ? 'ConectandoDatosDirectorio...' : '使用此Directorio'}</Button>
    </form>
  );
}
