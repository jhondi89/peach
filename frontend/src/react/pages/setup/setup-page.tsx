/* primero次运行Página: 取题目, 画表单, ÉxitoposteriorEn同unopágina换成Completado态. 
 *
 * 题目InterfazSolo对运行 Peach este电脑开放; 别设备Abrir时它回 403, página面No画表单, Solo说去哪dentroAbrir.  */
import { useEffect, useState } from 'react';

import { Button } from '@/components/base/buttons/button';

import { Note } from '../../components/note';
import { AuthCard } from '../auth-card';
import { describeFailure, fetchQuestions, SetupRequestError, type SetupDone, type SetupQuestions } from './setup-api';
import { SetupDoneView } from './setup-done';
import { SetupForm } from './setup-form';
import { SetupRestore } from './setup-restore';

type View =
  | { kind: 'loading' }
  | { kind: 'denied' }
  | { kind: 'failed'; message: string }
  | { kind: 'form'; setup: SetupQuestions }
  | { kind: 'done'; done: SetupDone };

export function SetupPage() {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchQuestions(controller.signal).then(
      (setup) => setView({ kind: 'form', setup }),
      (cause: unknown) => {
        if (controller.signal.aborted) return;
        setView(cause instanceof SetupRequestError && cause.status === 403
          ? { kind: 'denied' }
          : { kind: 'failed', message: describeFailure(cause) });
      });
    return () => controller.abort();
  }, [attempt]);

  if (view.kind === 'done') return <SetupDoneView done={view.done} />;
  const retry = () => {
    setView({ kind: 'loading' });
    setAttempt((count) => count + 1);
  };
  return (
    <AuthCard title="Bienvenido a Peach" lede="AñadirBiblioteca de medios, IniciarOrganizarColección. " busy={view.kind === 'loading'}>
      {view.kind === 'denied' ? <Note tone="error">Por favorEn运行 Peach este电脑arribaAbrirConfiguración. </Note> : null}
      {view.kind === 'failed'
        ? <Note tone="error" action={<Button variant="secondary" onClick={retry}>Reintentar</Button>}>{view.message}</Note>
        : null}
      {view.kind === 'form' ? <>
        <Button variant="secondary" className="self-start" onClick={() => setRestoring((current) => !current)}>
          {restoring ? 'Volverprimero次Configuración' : '使用YaConDatosDirectorio'}
        </Button>
        {restoring
          ? <SetupRestore onDone={(done) => setView({ kind: 'done', done })} />
          : <SetupForm setup={view.setup} onDone={(done) => setView({ kind: 'done', done })} />}
      </> : null}
    </AuthCard>
  );
}
