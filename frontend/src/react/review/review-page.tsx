/* 人工复核Página: 带出处候选摆到人面anterior, etc.uno次明确批准或否决. 
 *
 * ADR-0018 确定项Enescaneary资料ProcesarTareaTerminar时ya经落Biblioteca; esteunopáginaSolo读取剩abajo判断题, 
 * Abrirpágina面No会再触发uno次写操作. 
 *
 * 地址栏y组件Estado分界(ADR-0031"迁移桥continuar"): 
 * - `category` En地址栏arriba. nueveCategoríaes固定uno组身, "Enver哪unoCola"链continuar得过来, 
 *   Actualizar也要还Original—判到unomedio按Actualizar却被扔回Metadatos字段, etc.于pesadoNuevo找Ubicación. 
 * - Agrupar, Filtrar, página码es组件Estado. 复核Colaes消耗性: 判uno它就menosuno, No. 3 página指es
 *   哪dosdiez行随每uno次判定而变, 写进地址栏Compartir出去Solo会指向另uno批东西. 换Categoría, 换Agrupar, 
 *   换Filtrar都回No. 1 página, 也正Descripciónpágina码依附于此刻esteuno屏ver法, Noesesteunopágina身.  */
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { RiCheckboxCircleLine } from '@remixicon/react';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';

import { Button } from '@/components/base/buttons/button';
import type { ReviewProps } from '../bundle';
import { errorMessage } from '../../api';
import { DOTS, paginationRange } from '../../pagination';
import { EmptyState } from '../components/empty-state';
import { Note } from '../components/note';
import { Page } from '../components/page';
import { useHorizontalScroller } from '../components/use-horizontal-scroller';
import { BulkToolbar } from './bulk-toolbar';
import { GenreTagList } from './candidate-form';
import { ReviewCard } from './review-card';
import type { DecisionStatus, ReviewCategory, ReviewData, ReviewGrouping, ReviewRow, RowChoice } from './review';
import {
  canApprove, currentReviewRow, DEFAULT_CATEGORY, decisionPayload, decisionReceipt, defaultChoice,
  dropReviewRows, fetchReview, filterReviewRows, groupReviewRows, isReviewCategory, mirrorText,
  REVIEW_CATEGORIES, REVIEW_KEY, REVIEW_LABELS, reviewGroupingOptions,
  reviewWindow, selectReviewRange, submitDecision,
} from './review';

// yConfiguraciónpágina共用 BoardUI gray PillTab 样; 保Deja tabpanel y复核Cola计数. 
const TAB_CLASS = 'flex cursor-pointer items-center justify-between gap-2';

/** página码. Anteriorpágina/SiguientepáginaEn两端, página码居en proceso, página数más时两侧折成"...".  */
function Pagination(
  { page, pages, onPage }: { page: number; pages: number; onPage(page: number): void },
) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="复核Paginación" className="flex w-full flex-wrap items-center justify-between gap-2">
      <Button variant="secondary" size="small" disabled={page <= 1}
        onClick={() => onPage(page - 1)}>Página anterior</Button>
      <ul className="flex flex-wrap items-center gap-1">
        {paginationRange(page, pages).map((item, at) => (
          <li key={item === DOTS ? `dots-${at}` : item}>
            {item === DOTS
              ? <span aria-hidden className="px-1 text-body-2-regular text-text-tertiary">{DOTS}</span>
              : <Button variant={item === page ? 'secondary' : 'ghost'} size="small"
                  aria-label={`No. ${item} página`} aria-current={item === page ? 'page' : undefined}
                  onClick={() => onPage(Number(item))}>{item}</Button>}
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="small" disabled={page >= pages}
        onClick={() => onPage(page + 1)}>Página siguiente</Button>
    </nav>
  );
}

export function ReviewPage(props: ReviewProps) {
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width:900px)').matches);
  const categoryScroll = useHorizontalScroller<HTMLDivElement>(undefined, narrow);
  useEffect(() => {
    const query = matchMedia('(max-width:900px)');
    const update = () => setNarrow(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const {
    route, openItem, openEntity, revealSource, toast,
    readOnly, readOnlyMessage, writerUrl,
  } = props;
  const [category, setCategory] = useState<ReviewCategory>(
    isReviewCategory(props.category) ? props.category : DEFAULT_CATEGORY);
  const [groupBy, setGroupBy] = useState<ReviewGrouping>('candidates');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  /* 勾选, 选en proceso来源值, 勾en laObras样本, FalloOriginal因, 身都es `item_key`: 翻página, 换Agrupar
     之posterior手dentro还es同uno批东西. 它们No进地址栏—eseesesteuno刻手en launo批, Noesesteunopágina身.  */
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set<string>());
  const [choices, setChoices] = useState<ReadonlyMap<string, RowChoice>>(new Map());
  const [errors, setErrors] = useState<ReadonlyMap<string, string>>(new Map());
  const [feedback, setFeedback] = useState('');
  /* 区间más选锚点: Shift 从Anterior次点过eseuno格算起, y馆藏página同uno套语义.  */
  const anchor = useRef<string | null>(null);
  const [revealing, setRevealing] = useState(0);
  const [revealNote, setRevealNote] = useState('');
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false }, []);

  const review = useQuery({ queryKey: REVIEW_KEY, queryFn: ({ signal }) => fetchReview(signal) });

  const data: ReviewData = review.data || { sections: {}, counts: {} };
  const queue = data.sections[category] || [];
  const metadata = category === 'metadata_fields';
  const locked = readOnly;

  const groupOptions = reviewGroupingOptions(queue, metadata);
  const activeGroupBy: ReviewGrouping =
    groupOptions.some(([key]) => key === groupBy) ? groupBy : 'candidates';
  const groups = groupReviewRows(queue, activeGroupBy);
  const activeFilter = groups.some((group) => group.key === filter) ? filter : '';
  const win = reviewWindow(filterReviewRows(queue, activeGroupBy, activeFilter), page);
  const pageKeys = win.rows.map((row) => row.item_key);
  const onPage = new Set(pageKeys);
  /* esteunopáginaAnterior都Sin组No画Agrupar: 子底abajo空着, 读起来像Cargar坏.  */
  const pageGroups = groups
    .map((group) => ({ ...group, rows: group.rows.filter((row) => onPage.has(row.item_key)) }))
    .filter((group) => group.rows.length);

  const choiceOf = (row: ReviewRow): RowChoice => choices.get(row.item_key) || defaultChoice(row);
  const selectedRows = queue.filter((row) => selected.has(row.item_key));

  const forget = (keys: string[]) => {
    const gone = new Set(keys);
    setSelected((now) => new Set([...now].filter((key) => !gone.has(key))));
    setChoices((now) => new Map([...now].filter(([key]) => !gone.has(key))));
    setErrors((now) => new Map([...now].filter(([key]) => !gone.has(key))));
  };
  const fail = (key: string, message: string) =>
    setErrors((now) => new Map(now).set(key, message));

  /* 换Categoría就es换unoCola: AnteriorColaen la勾选, 选en proceso来源 y FalloOriginal因都No再Con对应行, 
     Deja着Solo会让工具报uno算No出来数.  */
  const goCategory = (next: ReviewCategory) => {
    setCategory(next);
    setGroupBy('candidates');
    setFilter('');
    setPage(1);
    setSelected(new Set());
    setChoices(new Map());
    setErrors(new Map());
    setFeedback('');
    anchor.current = null;
    route({ category: next === DEFAULT_CATEGORY ? '' : next });
  };

  const decide = useMutation({
    mutationFn: ({ row, status }: { row: ReviewRow; status: DecisionStatus }) =>
      submitDecision(decisionPayload(category, currentReviewRow(category, row), status, choiceOf(row))),
    onSuccess: (result, { row, status }) => {
      if (!result.ok) { fail(row.item_key, result.error || '服务端Rechazareste次判定'); return }
      // 判过直continuar移出本批ySincronizar计数, Siguiente立刻顶arriba来; DejaEnColadentro就像没生效. 
      dropReviewRows(category, [row.item_key]);
      forget([row.item_key]);
      toast(decisionReceipt(status));
    },
    onError: (cause, { row }) => fail(row.item_key, errorMessage(cause)),
  });

  /* 批量逐提交: FalloDejaEn屏幕arriba供Reintentar, Éxito立刻从Coladentro摘掉. Completo批uno次性交arriba去话, 
     en proceso间任何uno被服务端拒绝, 用户都No知道anterior面几到底写没写.  */
  const bulk = useMutation({
    mutationFn: async (status: 'approved' | 'rejected') => {
      const rows = selectedRows;
      const done: string[] = [];
      const failures: [string, string][] = [];
      for (const [at, row] of rows.entries()) {
        if (!alive.current) break;
        setFeedback(`Procesando ${at} / ${rows.length}`);
        try {
          const result = await submitDecision(decisionPayload(category, currentReviewRow(category, row), status, choiceOf(row)));
          if (!result.ok) throw new Error(result.error || '服务端No采用该项');
          done.push(row.item_key);
        } catch (cause) {
          failures.push([row.item_key, errorMessage(cause)]);
        }
      }
      return { status, done, failures };
    },
    onSuccess: ({ status, done, failures }) => {
      dropReviewRows(category, done);
      forget(done);
      failures.forEach(([key, message]) => fail(key, message));
      setFeedback('');
      toast(`Ya${status === 'approved' ? 'Aceptar' : 'Rechazar'} ${done.length} 项`
        + (failures.length ? `, ${failures.length} 项NoFinalizar` : ''));
    },
    onError: (cause) => { setFeedback(errorMessage(cause)) },
  });

  const runBulk = (status: 'approved' | 'rejected') => {
    if (bulk.isPending || !selectedRows.length) return;
    if (status === 'approved' && metadata
      && selectedRows.some((row) => !choiceOf(row).candidateKey)) {
      setFeedback('Por favor先Como所选DetallesSeleccionar要采用Fuente. ');
      return;
    }
    setFeedback('');
    bulk.mutate(status);
  };

  /* UnificadoSeleccionar来源Solo动所选ese几行选en proceso项, No替人按abajo"通过": 改es要写什么, 判断仍归人.  */
  const unifySource = (source: string) => {
    setChoices((now) => {
      const next = new Map(now);
      for (const row of selectedRows) {
        const candidate = row.candidates?.find((item) => item.source === source);
        if (candidate) next.set(row.item_key, { ...choiceOf(row), candidateKey: candidate.candidate_key });
      }
      return next;
    });
    setFeedback(`YaSeleccionar ${source}, 点击Aceptar所选采用. `);
  };

  const reveal = async (id: number) => {
    if (revealing) return;
    setRevealing(id);
    setRevealNote('');
    const note = await revealSource(id);
    if (!alive.current) return;
    setRevealing(0);
    setRevealNote(note);
  };

  const mirror = mirrorText(data.mirror, readOnlyMessage);
  const genreTags = data.genre_tags || [];
  const handlers = {
    openItem, openEntity, onReveal: reveal, revealing, revealNote, toast,
  };

  return (
    <Page>
      <div className="flex flex-col gap-5 pb-10">
      {locked ? (
        <Note tone="warning" title="Solo navegación local"
          extra={writerUrl
            ? <p className="text-body-2-regular">
                <a href={writerUrl} className="text-text-primary underline underline-offset-2">
                  anterior往写入端复核
                </a>
              </p>
            : undefined}>
          {mirror}
        </Note>
      ) : null}
      <GenreTagList tags={genreTags} />

      {/* CategoríaDirectorio于正文izquierda侧; estrecho屏使用正文arriba方导航.  */}
      <Tabs orientation={narrow ? 'horizontal' : 'vertical'} selectedKey={category} onSelectionChange={(key) => {
        const next = String(key);
        if (isReviewCategory(next)) goCategory(next);
      }} className="flex flex-col gap-5 review-split:flex-row review-split:items-start review-split:gap-6">
        <div data-section-nav className="w-full min-w-0 review-split:sticky review-split:top-topbar review-split:w-review-tabs review-split:shrink-0">
          <h2 id="reviewcategories">Clasificación de revisión</h2>
          <TabList ref={categoryScroll} aria-labelledby="reviewcategories" data-section-items
            className="flex review-split:flex-col review-split:items-stretch">
            {REVIEW_CATEGORIES.map((key) => {
              const count = Number(data.counts[key] || 0);
              return (
                <Tab key={key} id={key} className={TAB_CLASS}>
                  {REVIEW_LABELS[key]}
                  {/* 计数走Independiente徽标, Como 0 时Completo去掉, NoDejauno"0"占.  */}
                  {count
                    ? <span className="tabular-nums text-caption-1-medium text-text-secondary">
                        {count.toLocaleString()}
                      </span>
                    : null}
                </Tab>
              );
            })}
          </TabList>
        </div>

        <TabPanel id={category} className="flex min-w-0 flex-1 flex-col gap-5">
          {queue.length && !locked ? (
            <BulkToolbar groupOptions={groupOptions} groupBy={activeGroupBy}
              onGroupBy={(next) => { setGroupBy(next); setFilter(''); setPage(1) }}
              groups={groups} filter={activeFilter}
              onFilter={(next) => { setFilter(next); setPage(1) }}
              pageKeys={pageKeys} selected={selected} onSelected={setSelected}
              selectedRows={selectedRows} metadata={metadata}
              approvable={selectedRows.every((row) => canApprove(category, row))}
              busy={bulk.isPending} feedback={feedback}
              onUnifySource={unifySource} onRun={runBulk} />
          ) : null}

          {win.rows.length ? pageGroups.map((group) => (
            <section key={group.key} className="flex flex-col gap-3">
              {pageGroups.length > 1 || activeGroupBy !== 'candidates' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-body-medium text-text-primary">
                    {`${group.title} · ${group.rows.length}`}
                  </h3>
                  {locked ? null : (
                    <Button variant="ghost" size="small" onClick={() => {
                      const keys = group.rows.map((row) => row.item_key);
                      const all = keys.every((key) => selected.has(key));
                      const next = new Set(selected);
                      for (const key of keys) { if (all) next.delete(key); else next.add(key) }
                      setSelected(next);
                    }}>
                      {group.rows.every((row) => selected.has(row.item_key)) ? 'Limpiar本Grupo' : 'Seleccionar todo本Grupo'}
                    </Button>
                  )}
                </div>
              ) : null}
              <div className="review-grid gap-5">
                {group.rows.map((row) => (
                  <ReviewCard key={row.item_key} category={category} row={row}
                    choice={choiceOf(row)}
                    onChoice={(next) => setChoices((now) => new Map(now).set(row.item_key, next))}
                    selected={selected.has(row.item_key)}
                    onSelect={(range, checked) => setSelected((now) => {
                      const next = new Set(now);
                      anchor.current = selectReviewRange(
                        next, pageKeys, anchor.current, row.item_key, range, checked);
                      return next;
                    })}
                    locked={locked}
                    busy={decide.isPending && decide.variables?.row.item_key === row.item_key}
                    problem={errors.get(row.item_key) || ''}
                    genreTags={genreTags}
                    onDecide={(status) => {
                      if (decide.isPending || bulk.isPending) return;
                      setErrors((now) => new Map([...now].filter(([key]) => key !== row.item_key)));
                      decide.mutate({ row, status });
                    }}
                    handlers={handlers} />
                ))}
              </div>
            </section>
          )) : review.isError && !review.data ? (
            /* 读No到Cola y Colaes空Noesuno回事: 说清楚es读取Fallo, 给unoReintentarClave.  */
            <Note tone="error" title="复核Cola读取Fallido" action={
              <Button variant="secondary" size="small" disabled={review.isFetching} onClick={() => void review.refetch()}>Reintentar</Button>
            }>
              {errorMessage(review.error)}
            </Note>
          ) : (
            <EmptyState icon={RiCheckboxCircleLine} title="此CategoríaSinPendiente复核Proyecto">
              puedeCambiarCategoríaver其他待Confirmar资料. 
            </EmptyState>
          )}

          <Pagination page={win.page} pages={win.pages} onPage={setPage} />
        </TabPanel>
      </Tabs>
      </div>
    </Page>
  );
}
