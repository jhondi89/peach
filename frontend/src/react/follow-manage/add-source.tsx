/* 添加关注: uno链continuar, uno名字或uno id 变成ya关注来源. 
 *
 * EncontrarSoloes列出候选, No写任何东西: 发现要联网, Resultado也puede能No止uno, 替用户决定"就es
 * este"es错. 真正登记仍然要En候选dentro点. 
 *
 * Encontrareseuno趟Enposterior跑, página面关掉也还En跑. primero屏读到antiguo终态No冒充NuevoResultado: SoloCon本次点过
 * Encontrar, 或者本次亲眼见过它En跑, Resultado才摆出来(ADR-0031).  */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { RiFilter3Line, RiSearchLine } from '@remixicon/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, Popover } from 'react-aria-components';

import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import {
  MENU_ITEM, MENU_ITEM_INTERACTIVE, MENU_POPOVER_SURFACE,
} from '@/components/base/dropdown/menu-styles';
import { Input } from '@/components/base/input/input';
import { cx } from '@/utils/cx';

import { errorMessage } from '../../api';
import { useBackgroundJob } from '../background-job';
import { cardClass } from '../components/card';
import { LoadingDots } from '../components/loading-dots';
import { Note } from '../components/note';
import { TaskProgress } from '../components/task-progress';
import { busyProps } from '../settings/use-action';
import { ExternalLink, FieldLabel, Help } from '../settings/section';
import {
  addSource, fetchResolveJob, fetchSuggestions, FOLLOW_RESOLVE_KEY, followSuggestKey,
  reloadFollowManage, startCheck, startResolve, SUGGEST_DEBOUNCE_MS,
  type CredentialData, type FollowData, type ResolveCandidate, type ResolveJob, type ResolveRow,
} from './follow-manage';
import { SourceIcon } from './source-view';

const MENU_ROW = cx(MENU_ITEM, MENU_ITEM_INTERACTIVE, 'text-body-2-medium');
const PLACEHOLDER = 'PegarFuente链continuar, 或IntroducirCreador名, id...';
// 索引Descargar提醒SoloEn真按名字查时出现; 常驻成uno句Descripción就es噪音. 
const BY_NAME_HINT = 'BuscarEn proceso...(primero次按Nombre查要DescargasCreadorIndexar, puede能几diezsegundo(s))';
const BY_LINK_HINT = 'ReconocerEn proceso...';
const NO_CANDIDATE = '站interiorSin查到Fuente';

export interface AddSourceProps {
  data: FollowData;
  credentials: CredentialData;
  readOnly: boolean;
  toast(message: string): void;
  /** 去Credencialeseseuno栏配este站. 候选en la"需要ConfiguraciónCredenciales"按abajo去就es换página签.  */
  openCredentials(): void;
}

/** 候选身es它地址: 同uno次Encontrardentro同uno地址Solo会出现uno次.  */
const candidateKey = (row: number, candidate: ResolveCandidate) => `${row}:${candidate.url}`;

interface SuggestOption { value: string; matched: string; n: number; group: string }

/** 敲字建议abajo拉. SoloEnIntroducir框Con焦点时开着, Clave盘arribaabajoClaveEndentro面走. 
 *
 * 每组uno组名, 行dentro先es名字本身, 再esEn哪儿见到(归档站名, 站方Categoría) y Obras数: 
 * 名字才es选en procesoposterior要去查东西, 另exterior两样Solo帮人认出esNoes他. 
 *
 * 站arribaeseuno路要先问Completar再问Categoría, 实测uno秒arribaabajo, este段Tiempo得ver得出En做事: 空着像es敲没反应. 
 * 忙eseuno行Noes候选, arribaabajoClave y 回车este时No该选en procesouno"En cursoEncontrar建议". 
 *
 * 定 y 来源Filtrar同uno react-aria `Popover`: 它alto度压到字段abajo方真正剩abajo空间, 
 * 装Noabajo就En菜单dentro滚. No翻到arriba方: 每敲uno字建议数都En变, 翻来翻去读No成uno表. 
 * 非模态esComo焦点DejaEnIntroducir框; página面uno滚走字段它就收起, 菜单自己滚动No收.  */
function SuggestMenu(
  { field, menu, options, active, busy, onPick, onClose }:
  {
    field: RefObject<HTMLDivElement | null>; menu: RefObject<HTMLElement | null>;
    options: SuggestOption[]; active: number; busy: boolean;
    onPick(value: string): void; onClose(): void;
  },
) {
  // arribaabajoClave走到菜单puede见区exterioreseuno行, 它滚进来; 菜单exteriorpágina面No动. 
  useEffect(() => {
    menu.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [menu, active]);
  return (
    <Popover ref={menu} triggerRef={field} isOpen isNonModal shouldFlip={false}
      onOpenChange={(open) => { if (!open) onClose() }}
      placement="bottom start" offset={4} aria-label="Fuente建议"
      className={cx(MENU_POPOVER_SURFACE, 'flex w-(--trigger-width) flex-col gap-1 overscroll-contain')}>
      {busy && !options.length
        ? <div className="px-2 py-1.5"><LoadingDots label="ProcesandoBuscar建议" /></div>
        : null}
      {options.map((option, at) => (
        <Fragment key={`${option.group}-${option.value}`}>
          {option.group !== options[at - 1]?.group ? (
            <div className="px-2 pt-1 text-caption-1-regular text-text-tertiary">{option.group}</div>
          ) : null}
          <button type="button"
            aria-current={at === active ? 'true' : undefined}
            className={at === active ? cx(MENU_ROW, 'bg-background-secondary-default') : MENU_ROW}
            // 按abajo就 preventDefault: 让abajo拉焦点从Introducir框抢走话, 敲到unomedio词就断Enesedentro. 
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(option.value)}>
            <span className="min-w-0 grow truncate text-left">{option.value}</span>
            {option.matched ? (
              <span className="shrink-0 text-caption-1-regular text-text-tertiary">{option.matched}</span>
            ) : null}
            {option.n ? (
              <span className="shrink-0 text-caption-1-regular tabular-nums text-text-tertiary">
                {option.n.toLocaleString()}
              </span>
            ) : null}
          </button>
        </Fragment>
      ))}
    </Popover>
  );
}

/** 来源Filtrar: 列出Todopuede关注站, PredeterminadoSeleccionar todo. Cancelar勾选站, 其EncontrarResultado行No显示, 也No进
 *  "添加选en proceso".  */
function SourceFilter(
  { credentials, hidden, onHidden, openCredentials }:
  {
    credentials: CredentialData; hidden: ReadonlySet<string>;
    onHidden(next: Set<string>): void; openCredentials(): void;
  },
) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const rows = (credentials.providers || []).filter((row) => row.followable);
  const shown = rows.filter((row) => !hidden.has(row.provider_label)).length;
  const label = shown === rows.length ? 'TodoFuente' : `${shown}/${rows.length}  fuente(s)`;
  const toggle = (provider: string, on: boolean) => {
    const next = new Set(hidden);
    if (on) next.delete(provider); else next.add(provider);
    onHidden(next);
  };
  return (
    <>
      <Button ref={trigger} variant="secondary" leadingIcon={RiFilter3Line}
        aria-haspopup="dialog" aria-expanded={open} aria-label={label}
        onClick={() => setOpen(true)}>{label}</Button>
      <Popover triggerRef={trigger} isOpen={open} onOpenChange={setOpen}
        placement="bottom end" offset={4} className={MENU_POPOVER_SURFACE}>
        <Dialog aria-label="FuenteFiltrar" className="flex w-64 flex-col gap-1 outline-none">
          {rows.length ? (
            <div className="flex items-center gap-2 pb-1">
              <Button variant="ghost" size="small"
                onClick={() => onHidden(new Set())}>Seleccionar todo</Button>
              <Button variant="ghost" size="small"
                onClick={() => onHidden(new Set(rows.map((row) => row.provider_label)))}>Deseleccionar todo</Button>
            </div>
          ) : <Help>暂NingunoDisponibleFuente</Help>}
          {rows.map((row) => {
            const needsCredential = row.requirement === 'required'
              && (!row.present || (row.missing || []).length > 0);
            return (
              <div key={row.provider} className="flex items-center gap-2">
                <Checkbox isSelected={!hidden.has(row.provider_label)}
                  onChange={(on) => toggle(row.provider_label, on)}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <SourceIcon provider={row.provider} />{row.provider_label}
                  </span>
                </Checkbox>
                {needsCredential ? (
                  <Button variant="ghost" size="xs" className="ml-auto"
                    onClick={() => { setOpen(false); openCredentials() }}>Requiere configurar credenciales</Button>
                ) : null}
              </div>
            );
          })}
        </Dialog>
      </Popover>
    </>
  );
}

/** unoEncontrarResultado. 候选逐列, ya经关注列出来peroNo许再勾—否则人以Como没查到.  */
function PickRow(
  { row, at, hidden, unpicked, onPick }:
  {
    row: ResolveRow; at: number; hidden: ReadonlySet<string>; unpicked: ReadonlySet<string>;
    onPick(key: string, on: boolean): void;
  },
) {
  if (row.kind === 'error') {
    return <Note tone="error" title={row.line}>{row.error || 'BuscarFallido'}</Note>;
  }
  const candidates = (row.candidates || []).filter(
    (candidate) => !hidden.has(candidate.provider_label || ''));
  const failures = Object.entries(row.failures || {});
  return (
    <div className={cardClass({ variant: 'outlined', padding: 'none', className: 'flex flex-col gap-2 p-4' })}>
      <b className="text-body-medium text-text-primary">{row.line}</b>
      {candidates.length ? candidates.map((candidate) => {
        const key = candidateKey(at, candidate);
        return (
          <Checkbox key={key} isSelected={!candidate.known && !unpicked.has(key)}
            isDisabled={candidate.known} onChange={(on) => onPick(key, on)}>
            <span className="flex min-w-0 flex-wrap items-center gap-1.5">
              <SourceIcon provider={candidate.provider} />
              <b className="text-body-medium">{candidate.provider_label}</b>
              <span className="min-w-0 break-words">{candidate.label}</span>
              <small className="text-caption-1-regular text-text-secondary">
                {candidate.known ? 'Ya经Seguir' : candidate.evidence}
              </small>
            </span>
          </Checkbox>
        );
      }) : <Help>{NO_CANDIDATE}</Help>}
      {(row.external_searches || []).map((search) => (
        <div key={search.url} className="flex flex-wrap items-center gap-2">
          <small className="text-caption-1-regular text-text-secondary">{search.evidence}</small>
          {/* esteuno会离开 Peach, 所以带exterior链标; 标由共用 `ExternalLink` 给, Todo站uno写法.  */}
          <ExternalLink href={search.url}>{`${search.label}: ${search.query}`}</ExternalLink>
        </div>
      ))}
      {failures.length ? (
        <Help>{failures.map(([name, reason]) => `${name}: ${reason}`).join('; ')}</Help>
      ) : null}
    </div>
  );
}

export function AddSource({ data, credentials, readOnly, toast, openCredentials }: AddSourceProps) {
  const [line, setLine] = useState('');
  const [composing, setComposing] = useState(false);
  /** esteuno趟查es什么. EsperandoSugerencia使用ya提交词, Introducir框puedeContinuarEditary保DejaReintentarcontenido.  */
  const [asked, setAsked] = useState('');
  const [term, setTerm] = useState('');
  const [focused, setFocused] = useState(false);
  /** Eneste段Introducirarriba收起过abajo拉(Escape, página面滚走). 再敲uno字或按arribaabajoClave就pesadoNuevoAbrir.  */
  const [closedAt, setClosedAt] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const field = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set<string>());
  const [unpicked, setUnpicked] = useState<ReadonlySet<string>>(new Set<string>());
  const [problem, setProblem] = useState('');
  const [added, setAdded] = useState(0);

  /* 每unoabajoIntroducir都排uno次建议, peroSolo发uno次Por favor求: 250ms interiorContinuar敲就换掉Anterior次排期. 
     地址No进este路—服务端认得出dentro面 `/`, ese时该做es解析链continuar.  */
  useEffect(() => {
    const text = line.trim();
    if (composing || !text || text.includes('/')) { setTerm(''); return }
    const timer = setTimeout(() => setTerm(text), SUGGEST_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [line, composing]);

  const suggest = useQuery({
    queryKey: followSuggestKey(term),
    queryFn: ({ signal }) => fetchSuggestions(term, signal),
    enabled: term.length > 0 && focused && !composing && closedAt !== line,
  });

  const options = useMemo<SuggestOption[]>(() => (suggest.data?.groups || []).flatMap((group) => (
    group.items.map((item) => ({
      value: item.value, matched: item.matched || '', n: item.n || 0, group: group.label,
    }))
  )), [suggest.data]);

  const { job, running, outcome, start: resolve, dismiss } = useBackgroundJob<ResolveJob, string>({
    queryKey: FOLLOW_RESOLVE_KEY,
    queryFn: ({ signal }) => fetchResolveJob(signal),
    start: (text) => startResolve([text]),
    onStarted: () => setUnpicked(new Set()),
    onError: (cause) => setProblem(errorMessage(cause)),
    onFinish: (state) => {
      if (state.status === 'failed') setProblem(state.error || 'BuscarFallido');
    },
  });

  const search = (text: string) => {
    const query = text.trim();
    if (!query || readOnly || composing || running || resolve.isPending) return;
    setProblem('');
    setActive(-1);
    setAsked(query);
    setLine(query);
    setTerm('');
    setClosedAt(query);
    resolve.mutate(query);
  };

  const suggesting = suggest.isFetching;
  const menuOpen = focused && !composing && closedAt !== line && (options.length > 0 || suggesting);
  // 收起同时放掉选en proceso: verNo见eseuno行No该被回车选去查. 
  const closeMenu = () => { setActive(-1); setClosedAt(line) };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (composing || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    if (event.key === 'Escape' && menuOpen) { closeMenu(); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!options.length) return;
      event.preventDefault();
      if (!menuOpen) { setClosedAt(null); return }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((now) => {
        const next = now + step;
        if (next < 0) return options.length - 1;
        return next >= options.length ? 0 : next;
      });
      return;
    }
    if (event.key !== 'Enter') return;
    event.preventDefault();
    /* 选en procesouno建议再回车, etc.于ese名字Introduce进来再Encontrar. EncontrarSoloes列出候选, No写任何
       东西, 所以选en proceso即Encontrares安Todo.  */
    search(options[active]?.value || line);
  };

  const rows = outcome?.results || [];
  const picked = rows.flatMap((row, at) => (row.candidates || [])
    .filter((candidate) => !candidate.known && !hidden.has(candidate.provider_label || ''))
    .map((candidate) => ({ candidate, key: candidateKey(at, candidate) }))
    .filter((item) => !unpicked.has(item.key)));

  const register = useMutation({
    mutationFn: async (items: { candidate: ResolveCandidate }[]) => {
      const failures: string[] = [];
      const sources: number[] = [];
      setAdded(0);
      for (const item of items) {
        try {
          const done = await addSource(item.candidate);
          sources.push(done.source);
        } catch (cause) {
          // unoFalloNo该其余uno起丢掉, 逐报. 
          failures.push(`${item.candidate.label}: ${errorMessage(cause)}`);
        }
        setAdded((now) => now + 1);
      }
      // Nuevo来源登记时按 `defer_check` OmitirVerificar, 登记完uno次性起uno趟. 
      if (sources.length) {
        try { await startCheck(sources) } catch (cause) { failures.push(errorMessage(cause)) }
      }
      return { failures, sources };
    },
    onSuccess: (result) => {
      void reloadFollowManage();
      if (result.failures.length) { setProblem(result.failures.join('; ')); return }
      setProblem('');
      dismiss();
      toast(`YaAñadir ${result.sources.length} Seguir fuente`);
    },
    onError: (cause) => setProblem(errorMessage(cause)),
  });

  const guesses = data.suggestions || [];
  const byName = !asked.includes('/');

  return (
    /* antiguo `.followmanage .fmain>.fsec`: uno分区就esunoIntroduce充卡, TítuloEn卡dentro.  */
    <div className={cardClass({ padding: 'none', className: 'flex flex-col gap-4 px-6 py-5 max-sm:px-4' })}>
      <h3 className="text-title-2-medium text-text-primary">Agregar seguimiento</h3>

      <div className="flex flex-wrap items-end gap-2">
        {/* 焦点离开es字段 y abajo拉两处才收, Noes离开Introducir框就收: abajo拉en la每uno都es真按钮, 
            焦点落进去eseunoabajo收掉话, 正bien要点东西撤走. abajo拉挂En浮层容Dispositivodentro, NoEn
            字段 DOM abajo面, 所以两处分开认.  */}
        <div ref={field} className="min-w-64 grow" onFocus={() => setFocused(true)}
          onBlur={(event) => {
            const next = event.relatedTarget;
            if (!event.currentTarget.contains(next) && !menu.current?.contains(next)) setFocused(false);
          }}>
          <Input aria-label="Fuente链continuar, Nombre或 id" placeholder={PLACEHOLDER} value={line}
            leadingIcon={RiSearchLine} enterKeyHint="search" isDisabled={readOnly} onChange={setLine}
            onCompositionStart={() => { setComposing(true); setActive(-1) }}
            onCompositionEnd={(event) => { setComposing(false); setLine(event.currentTarget.value) }}
            onKeyDown={onKeyDown} />
          {menuOpen ? (
            <SuggestMenu field={field} menu={menu} options={options} active={active}
              busy={suggesting} onPick={search} onClose={closeMenu} />
          ) : null}
        </div>
        <SourceFilter credentials={credentials} hidden={hidden} onHidden={setHidden}
          openCredentials={openCredentials} />
        <Button variant="primary" disabled={readOnly || !line.trim()}
          {...busyProps(running || resolve.isPending)} onClick={() => search(line)}>Buscar</Button>
      </div>

      <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
        {running || resolve.isPending ? <TaskProgress embedded
          label={job?.message || (job?.total ? `BuscarEn proceso: ${job.checked || 0}/${job.total}` : byName ? BY_NAME_HINT : BY_LINK_HINT)}
          value={job?.checked} total={job?.total} /> : null}
        {problem ? <Note tone="error" title="No se completó esta vez">{problem}</Note> : null}
      </div>

      {rows.length ? (
        <div className="flex flex-col gap-3">
          <FieldLabel>BuscarResultado</FieldLabel>
          {rows.map((row, at) => (
            <PickRow key={`${row.line}-${at}`} row={row} at={at} hidden={hidden} unpicked={unpicked}
              onPick={(key, on) => {
                const next = new Set(unpicked);
                if (on) next.delete(key); else next.add(key);
                setUnpicked(next);
              }} />
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="small" disabled={readOnly || !picked.length}
              {...busyProps(register.isPending)}
              onClick={() => register.mutate(picked)}>{`Añadir选En proceso(${picked.length})`}</Button>
            <Button variant="secondary" size="small"
              onClick={() => dismiss()}>Desactivar</Button>
            {register.isPending ? (
              <span role="status" className="text-body-2-regular text-text-secondary">
                {`AñadirEn proceso... ${added}/${picked.length}`}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {guesses.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-2-regular text-text-secondary">Quizás te guste</span>
          {guesses.map((guess) => (
            <Button key={guess.name} variant="secondary" size="small" disabled={readOnly}
              title={`ExplorarHistorialdentro出现 ${guess.visits} 次${guess.origin ? ` · ${guess.origin}` : ''}`}
              onClick={() => search(guess.name)}>{guess.name}</Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
