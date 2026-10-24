/* ConfiguraciónCompletado: escaneares否ya排队, 进入 Peach 入口, 运行InformaciónPredeterminado折叠. 口令No出现Enpágina面arriba. 
 *
 * Independiente包服务端En `redirect` dentro给入口地址, 过 `RESTART_REDIRECT_MS` 自己Omitir去, yConfiguraciónpáginaGuardarposterior
 * etc.Bandeja del sistema换进程Duraciónes同uno数.  */
import { useEffect, useRef } from 'react';

import { ButtonLink } from '@/components/base/buttons/button';

import { RESTART_REDIRECT_MS } from '../../restart-redirect';
import { Disclosure, ExternalLink, Fact, FactList } from '../../settings/section';
import { AuthCard } from '../auth-card';
import type { SetupDone } from './setup-api';

export function SetupDoneView({ done }: { done: SetupDone }) {
  const entry = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    document.title = 'Peach · Configuración completada';
    entry.current?.focus();
  }, []);

  useEffect(() => {
    const target = done.redirect;
    if (!target) return undefined;
    const timer = setTimeout(() => location.assign(target), RESTART_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [done.redirect]);

  return (
    <AuthCard title="ConfiguraciónFinalizar" lede="ProcesandoIniciarColección. ">
      <p className="text-body-regular text-text-primary">
        {done.restored ? 'YaConectarYaConDatosDirectorio. ' : done.scan_requested
          ? 'primero次EscanearYa排队, EnposteriorOrganizarBiblioteca de medios, 期间puede以照常使用 Peach. '
          : 'Más tardeEnConfiguraciónpáginaIniciarEscanearBiblioteca de medios. '}
      </p>
      <ButtonLink ref={entry} href={done.url} className="self-start">
        {done.history_guide ? 'ImportarExplorar dispositivoHistorialRegistro' : 'Entrar a Peach'}
      </ButtonLink>
      <Disclosure summary="Información de ejecución">
        <FactList>
          {done.facts.map((fact) => (
            <Fact key={fact.term} term={fact.term}>
              {fact.value}
              {fact.download_url
                ? <ExternalLink href={fact.download_url}>{fact.download_label ?? fact.download_url}</ExternalLink>
                : null}
            </Fact>
          ))}
        </FactList>
      </Disclosure>
    </AuthCard>
  );
}
