/* 来源 y 凭证Página: 每Recolectar来源怎么连, 拿什么身连, exterior加uno趟按Código JAV补alto清Portada. 
 *
 * esteesNo.uno带写操作 React 档, 两件事Enaquí定型: 
 * - **写操作es `useMutation`**, No进 Query 缓存节律. GuardarÉxitoposterior用 `setQueryData` 服务端
 *   回eseuno换进Lista, 而NoesCompletopáginapesado取uno遍: 用户puede能En cursoIntroduce另uno卡, pesado取会它uno起pesado画. 
 *   FalloSoloEn卡interiorDejauno句Original因, 缓存en laAnteriorDatosNo动. 
 * - **posteriorTarea走 `useBackgroundJob`**: 跑起来两秒uno次, 停就No问, primero屏读到antiguo终态No冒充
 *   NuevoResultado. 轮询跟着组件走, 遗Deja壳换página时卸根, 它自己就停.  */
import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { RiArrowRightLine } from '@remixicon/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Radio } from 'react-aria-components';

import { SettingsRow } from '@/components/application/settings/settings-rows';
import { Button } from '@/components/base/buttons/button';
import { LinkButton } from '@/components/base/buttons/link-button';
import { Input } from '@/components/base/input/input';
import { Select, SelectItem } from '@/components/base/select/select';

import { apiSend, errorMessage } from '../../api';
import { useBackgroundJob } from '../background-job';
import type { ScrapingProps } from '../bundle';
import { LoadingDots } from '../components/loading-dots';
import { Note } from '../components/note';
import { Page } from '../components/page';
import { SiteMark } from '../components/site-mark';
import { SEGMENT, SEGMENTED_TRACK, SegmentedRadioGroup as RadioGroup } from '../components/segmented';
import { queryClient } from '../query';
import {
  Disclosure, ErrorText, ExternalLink, Fact, FactList, FieldLabel, Footer, Help, Rows, Section, Stack,
} from '../settings/section';
import { busyProps } from '../settings/use-action';
import { CustomSources } from './custom-sources';
import {
  AMANE_BRIDGE_CHECK_URL, AMANE_BRIDGE_KEY, AMANE_BRIDGE_REBUILD_URL,
  checkText, COOKIE_TEXT_LIMIT, COVER_JOB_KEY, fetchAmaneBridge, fetchCoverJob,
  fetchSources, SCRAPING_CHECK_URL, SCRAPING_COVER_URL, SCRAPING_KEY, SCRAPING_SETTINGS_URL,
  type AmaneBridge, type Check, type CoverJob, type ScrapingData, type Source,
} from './scraping';

const NETWORKS = [['peach', 'Proxy de Peach'], ['direct', '直continuarConectar']] as const;

/** ConectarMétodoOpciones. DatosBibliotecadentro存着este两以exterior值(antiguo版写abajo, 手改)时它Original样列成uno项, 
 *  abajo拉框照实显示现Enes什么, No落到空占arriba.  */
export function networkOptions(current: string): (readonly [string, string])[] {
  return NETWORKS.some(([key]) => key === current) || !current ? [...NETWORKS] : [...NETWORKS, [current, current]];
}

/** Iniciar sesiónpáginaexterior链Solo写Anfitrión名: Completo地址Enestrecho屏arriba会分区Título挤成uno字uno行, Ruta也DescripciónNoes哪站.  */
export function linkHost(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}
const COOKIE_METHODS = [['paste', 'Pegar Cookie'], ['file', 'ImportarArchivo']] as const;

function GitHubMark() {
  return <SiteMark source="github" />;
}

/** uno来源uno卡: 怎么连, 拿什么身连, 底abajotres动作.  */
function SourceCard({ source, toast }: { source: Source } & ScrapingProps) {
  const [network, setNetwork] = useState(source.network);
  const [cookie, setCookie] = useState('');
  const [cookieText, setCookieText] = useState('');
  const [method, setMethod] = useState<string>(COOKIE_METHODS[0][0]);
  const [fileName, setFileName] = useState('');
  const [fileProblem, setFileProblem] = useState('');
  const file = useRef<HTMLInputElement>(null);

  /* 秘密SoloEn提交eseuno刻存En于página面arriba: Guardar回来之posteriorIntroducir框清空, página面arribaNo再Deja着刚交arriba去
     eseuno. ArchivoSeleccionarDispositivo自己也要清, 否则同名Archivo再选uno次No会触发 change.  */
  function forgetSecrets() {
    setCookie('');
    setCookieText('');
    setFileName('');
    setFileProblem('');
    if (file.current) file.current.value = '';
  }

  const save = useMutation({
    mutationFn: (revoke: boolean) => apiSend<{ saved: Source }>(SCRAPING_SETTINGS_URL, {
      source: source.source, network, cookie, cookies_text: cookieText, revoke,
    }),
    onSuccess: (result, revoke) => {
      // 服务端回就esesteunoNuevo样子, 换进Lista即puede, NoComouno次GuardarCompletopáginapesado取uno遍. 
      queryClient.setQueryData<ScrapingData>(SCRAPING_KEY, (current) => current && {
        ...current,
        sources: current.sources.map(
          (row) => (row.source === result.saved.source ? result.saved : row)),
      });
      forgetSecrets();
      toast(revoke ? 'Cookie revocada' : 'FuenteConfiguraciónGuardado');
    },
  });
  const check = useMutation({
    mutationFn: () => apiSend<{ results: Check[] }>(SCRAPING_CHECK_URL, { source: source.source }),
  });
  // uno卡arribatres动作互斥: 它们改es同unoCredenciales, 谁先Llegar都会让另uno次Resultado说No清楚. 
  const busy = save.isPending || check.isPending;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    check.reset();
    save.mutate(false);
  };
  const revoke = () => {
    if (busy) return;
    check.reset();
    save.mutate(true);
  };
  const connect = () => {
    if (busy) return;
    save.reset();
    check.mutate();
  };

  async function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selected = input.files?.[0];
    setCookieText('');
    setFileProblem('');
    if (!selected) {
      setFileName('');
      return;
    }
    if (selected.size > COOKIE_TEXT_LIMIT) {
      // 超限másmedio根本Noes Cookie Archivo. EnExplorar dispositivodentro就拦住, No拿它去占uno次Por favor求. 
      input.value = '';
      setFileName('');
      setFileProblem('El texto de cookie supera 256 KiB');
      return;
    }
    try {
      const text = await selected.text();
      setCookieText(text);
      setFileName(selected.name);
    } catch {
      setFileProblem('Archivo de cookie no leído, por favor selecciónalo nuevamente');
    }
  }

  const problem = fileProblem
    || (save.error ? errorMessage(save.error) : '')
    || (check.error ? errorMessage(check.error) : '');
  const results = check.data?.results ?? [];
  // esteuno空着时连同它ese道分隔线uno起No画: 直连, 又No收 Cookie 来源SoloConuno行ConectarMétodo. 
  const detailed = network === 'peach' || source.accepts_cookie || source.browser || !!problem || results.length > 0;

  return (
    <Section title={source.label} onSubmit={submit} aside={
      <span className="flex min-w-0 items-center gap-1">
        <SiteMark source={source.source} />
        {source.login ? <ExternalLink href={source.login}>{linkHost(source.login)}</ExternalLink> : null}
      </span>
    }>
      <Rows>
        <SettingsRow label="Método de conexión">
          {/* 定ancho: DatosBibliotecaen lalargo取值按contenido撑ancho会izquierda边"ConectarMétodo"挤成竖排, 定anchoposterior取值En框dentro截断.  */}
          <Select aria-label="Método de conexión" className="w-44 min-w-0" selectedKey={network}
            onSelectionChange={(key) => { if (key !== null) setNetwork(String(key)) }}>
            {networkOptions(network).map(([key, name]) => <SelectItem key={key} id={key}>{name}</SelectItem>)}
          </Select>
        </SettingsRow>
      </Rows>
      {source.cooldown_until && source.cooldown_until > Date.now() / 1000 ? (
        <Note tone="warning">来源En curso冷却, 截止 {new Date(source.cooldown_until * 1000).toLocaleString('zh-CN')}</Note>
      ) : null}
      {detailed ? <Stack divided>
        {network === 'peach'
          ? <span className="self-start">
              <LinkButton href="/settings/library#peachProxy" size="small" trailingIcon={RiArrowRightLine}>
                Configuración Peach Proxy
              </LinkButton>
            </span>
          : null}
        {/* 由本机Explorar dispositivo过Verificar来源No收 Cookie: Explorar dispositivo自己带着会话. Deja着"Deshacer Cookie"让人清掉antiguo.  */}
        {source.browser
          ? <p className="text-body-2-regular text-text-secondary">
              人机Verificar由本机Explorar dispositivo自动Completado; 需要点击时窗口会弹出. este机DispositivoarribaNo需要 Cookie. 
            </p>
          : null}
        {source.accepts_cookie && !source.browser ? <>
          <p className="text-body-2-regular text-text-secondary">
            {source.cookie_saved
              ? 'Cookie guardada. La validez se comprueba al recuperar datos.'
              : 'Inicio de sesión requerido时, 任选unoMétodo提供 Cookie. '}
          </p>
          {/* 两Método互斥, 交arriba去Solo能es其en procesouno: Cambiar时另unoIntroducir清掉, 
              No让verNo见eseuno跟着提交.  */}
          <RadioGroup aria-label="Método de proporcionar Cookie (elegir uno)" value={method}
            onChange={(next) => { setMethod(next); forgetSecrets() }}
            className={SEGMENTED_TRACK}>
            {COOKIE_METHODS.map(([value, label]) => (
              <Radio key={value} value={value} className={SEGMENT}>
                {label}
              </Radio>
            ))}
          </RadioGroup>
          {method === 'paste'
            ? <Input type="password" label="Cookie" autoComplete="off" value={cookie} onChange={setCookie} />
            : <div className="flex flex-col gap-2">
                <FieldLabel>Archivo Cookie de Netscape (.txt)</FieldLabel>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="secondary" onClick={() => file.current?.click()}>SeleccionarArchivo</Button>
                  <span className="min-w-0 text-body-2-regular break-all text-text-secondary">
                    {fileName || 'NoSeleccionarArchivo'}
                  </span>
                </div>
                {/* Original生ArchivoSeleccionarDispositivolargo相Nopuede控, 按钮归 BoardUI, Introducir框SoloDeja着continuarArchivo.  */}
                <input ref={file} type="file" accept=".txt" tabIndex={-1} aria-hidden
                  className="hidden" onChange={(event) => { void pickFile(event) }} />
              </div>}
        </> : null}
        {problem ? <ErrorText>{problem}</ErrorText> : null}
        {results.map((result) => (
          <Note key={result.label} tone={result.ok ? 'success' : 'error'}>
            {checkText(result, source.label)}
          </Note>
        ))}
      </Stack> : null}
      {/* 主体动作En最derecha. 次级动作先出现, `Guardar` eseste卡唯uno写入, 放Enuno行último尾; 
          表单dentroSoloCon它uno `type=submit`, 所以挪UbicaciónNo影响回车提交.  */}
      <Footer>
        {source.accepts_cookie && source.cookie_saved
          ? <Button variant="secondary" onClick={revoke} {...busyProps(busy)}>Deshacer Cookie</Button>
          : null}
        <Button variant="secondary" onClick={connect} {...busyProps(busy)}>Verificar conexión</Button>
        <Button type="submit" {...busyProps(busy)}>Guardar</Button>
      </Footer>
    </Section>
  );
}

/** 按Código JAV补unoalto清Portada. esteuno趟Enposterior跑, página面arribaDejaEstado.  */
function CoverCard({ toast }: ScrapingProps) {
  const [code, setCode] = useState('');
  const { running, outcome, start } = useBackgroundJob<CoverJob>({
    queryKey: COVER_JOB_KEY,
    queryFn: ({ signal }) => fetchCoverJob(signal),
    start: () => apiSend<CoverJob>(SCRAPING_COVER_URL, { code }),
    onFinish: (state) => {
      if (state.status === 'complete') toast(state.result || 'Finalizar recolección de portada');
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (running || start.isPending || !code.trim()) return;
    start.mutate();
  };

  const problem = start.error ? errorMessage(start.error)
    : outcome?.status === 'failed' ? (outcome.error || 'RecolectarNo disponible') : '';
  return (
    <Section title="HDPortada" onSubmit={submit}>
      <Stack>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1">
            <Input aria-label="ColecciónCódigo JAV" isRequired isDisabled={running} value={code} onChange={setCode}
              placeholder="IntroducirColecciónCódigo JAV, 如 ABW-232" />
          </div>
          <Button type="submit" disabled={!code.trim()} {...busyProps(running || start.isPending)}>
            抓取Portada
          </Button>
        </div>
        {/* esteuno趟要挨问几家站点, 还puede能走Proxy, Sinpuede数Total量, 也No能编unocien分比出来. 
            关掉página面它照样En跑, 回来能continuararriba, 所以Estado得DejaEnpágina面arriba, 而NoesSolo让按钮转unoabajo.  */}
        {running ? <LoadingDots label="ProcesandoObtener portada" /> : null}
        {problem ? <Note tone="error">{problem}</Note> : null}
        {outcome?.status === 'complete'
          ? <Note tone="success">{outcome.result || 'Finalizar recolección de portada'}</Note>
          : null}
      </Stack>
    </Section>
  );
}

/** amane 桥: 钉En哪 revision, venv 建没建, arriba游最Nuevo到哪. Actualizar aes人读 diff 之posterior改清单, 
 *  este卡Solo做两件事: 问unoabajoarriba游最Nuevo版,  y 按钉住Versiónpesado建 venv.  */
function AmaneBridgeCard({ toast }: ScrapingProps) {
  const { query: bridge, running, outcome, start: rebuild } = useBackgroundJob<CoverJob, void, AmaneBridge>({
    queryKey: AMANE_BRIDGE_KEY,
    queryFn: ({ signal }) => fetchAmaneBridge(signal),
    start: () => apiSend<CoverJob>(AMANE_BRIDGE_REBUILD_URL, {}),
    // esteClave缓存esCompleto卡, esteuno趟rápido照Solo换进 `job` eseuno格. 
    jobOf: (card) => card.job,
    withJob: (card, started) => card && { ...card, job: started },
    onFinish: (state) => {
      if (state.status === 'complete') toast(state.result || 'Puente amane reconstruido');
    },
  });
  const check = useMutation({
    mutationFn: () => apiSend<{ latest: string }>(AMANE_BRIDGE_CHECK_URL, {}),
  });

  const data = bridge.data;

  if (!data) {
    return bridge.error
      ? <Section title="amane"><Stack><Note tone="error">{errorMessage(bridge.error)}</Note></Stack></Section>
      : null;
  }
  const busy = running || rebuild.isPending || check.isPending;
  const problem = rebuild.error ? errorMessage(rebuild.error)
    : check.error ? errorMessage(check.error)
    : outcome?.status === 'failed' ? (outcome.error || 'pesado建NoFinalizar') : '';
  return (
    <Section title="amane" aside={<ExternalLink href={data.repository} leadingIcon={GitHubMark}>{data.repository}</ExternalLink>}>
      <FactList>
        <Fact term="InstaladoVersión">{data.installed_version || 'No instalado'}</Fact>
        <Fact term="Última versión upstream">{check.data?.latest ?? 'Sin verificar'}</Fact>
        <Fact term="Entorno de ejecución">{data.installed ? 'Instalado' : 'No instalado'}</Fact>
        <Fact term="interior置Sitio">{data.sites.length.toLocaleString()} </Fact>
      </FactList>
      <Stack divided>
        {data.sites.length
          ? <Disclosure summary="verinterior置Sitio">
              <p className="text-body-2-regular text-text-secondary">{data.sites.map((site) => site.label).join(', ')}</p>
            </Disclosure>
          : null}
        <Help>
          yaInstalarVersión: {data.installed_version || 'No instalado'}. amane({data.license})提供este些interior置站点解析能力. 
          pesadoNuevoInstalar会使用 Peach interior置 {data.version} Versión, No随arriba游自动Actualizar a. 
        </Help>
        {running ? <LoadingDots label="Procesandopesado建Entorno de ejecución" /> : null}
        {problem ? <Note tone="error">{problem}</Note> : null}
        {outcome?.status === 'complete' ? <Note tone="success">{outcome.result || 'Puente amane reconstruido'}</Note> : null}
      </Stack>
      <Footer>
        <Button variant="secondary" onClick={() => { if (!busy) check.mutate() }} {...busyProps(check.isPending)}>
          Verificararriba游Versión
        </Button>
        <Button onClick={() => { if (!busy) rebuild.mutate() }} {...busyProps(running || rebuild.isPending)}>
          {data.installed ? 'Reinstalar' : 'Instalar'}
        </Button>
      </Footer>
    </Section>
  );
}

export function ScrapingPage({ toast }: ScrapingProps) {
  const sources = useQuery({ queryKey: SCRAPING_KEY, queryFn: ({ signal }) => fetchSources(signal) });
  const data = sources.data;
  if (!data) {
    return (
      <Page>
        <Note tone="error" title="RecolectarFuente读取Fallido">
          {sources.error ? errorMessage(sources.error) : '读取RecolectarFuenteFallido'}
        </Note>
      </Page>
    );
  }
  return (
    <Page>
      <p className="text-body-2-regular text-text-secondary">Las imágenes HD pueden requerir proxy. Verifica la conexión primero.</p>
      <CoverCard toast={toast} />
      <CustomSources receipt={toast} />
      {(data.sources || []).map(
        (source) => <SourceCard key={source.source} source={source} toast={toast} />)}
      <AmaneBridgeCard toast={toast} />
    </Page>
  );
}
