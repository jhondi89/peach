/* posteriorTarea: 点unoabajo起uno趟, 服务端Enposterior跑, página面按Estado轮询, 跟到终态报uno次回执. 
 *
 * 两时序Enaquí定死, página面No各写uno: 
 * - **primero屏读到antiguo终态No冒充NuevoResultado**. Tarea关掉página面照样En跑, Estadodentro常年躺着Anterior趟回执; 
 *   SoloCon本次启动过, 或者本次见过它En跑, 终态才交给 `onFinish`, 落进 `outcome`. 
 * - **启动Éxito时先启动Por favor求回 `running` rápido照换进缓存, 再pesado读**. Solopesado读话, pesado读回来
 *   之anterior缓存en laAnterior趟终态会被当成esteuno趟回执; esteuno趟Enpesado读anterior就跑完时, Resultado也会被它顶掉.  */
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, type QueryKey } from '@tanstack/react-query';

import { queryClient } from './query';

export interface JobState { status?: string }

/** En跑时两秒uno次,  y 活动página同uno节律.  */
export const JOB_RUNNING_POLL_MS = 2000;

export interface BackgroundJobOptions<Job extends JobState, Args, Data> {
  queryKey: QueryKey;
  queryFn: (context: { signal: AbortSignal }) => Promise<Data>;
  start: (args: Args) => Promise<Job>;
  /** 缓存dentro存esCompleto卡, TareaSolo占uno格时: TareaEn哪uno格, Nuevorápido照怎么换进去.  */
  jobOf?: (data: Data) => Job | undefined;
  withJob?: (data: Data | undefined, job: Job) => Data | undefined;
  /** 闲着时más久问uno次. Tareapuede能从别página面或Anterior次会话dentro起来página面才需要; PredeterminadoNo问.  */
  idlePollMs?: number;
  onStarted?: (started: Job) => void;
  onError?: (cause: unknown) => void;
  /** 本次跟完eseuno趟到终态, Solo调uno次.  */
  onFinish?: (job: Job) => void;
}

const itself = <Job, Data>(data: Data) => data as unknown as Job;
const replaced = <Job, Data>(_data: Data | undefined, job: Job) => job as unknown as Data;

export function useBackgroundJob<Job extends JobState, Args = void, Data = Job>(
  options: BackgroundJobOptions<Job, Args, Data>,
) {
  const { queryKey, jobOf = itself<Job, Data>, withJob = replaced<Job, Data>, idlePollMs } = options;
  /** 本次esNoesEn跟uno趟: 启动过, 或者本次见过它En跑.  */
  const [tracking, setTracking] = useState(false);
  /** 本次跟完eseuno趟. primero屏读到antiguo终态No算, 它No会走到aquí.  */
  const [outcome, setOutcome] = useState<Job | null>(null);
  /* 回调由página面每次渲染Nuevo, 放进 ref 读最Nuevouno: 进 effect 依赖话, 每画uno遍都要pesado跑.  */
  const hooks = useRef(options);
  useEffect(() => { hooks.current = options });

  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => hooks.current.queryFn({ signal }),
    refetchInterval: (current) => {
      const data = current.state.data;
      return data !== undefined && jobOf(data)?.status === 'running' ? JOB_RUNNING_POLL_MS : (idlePollMs ?? false);
    },
  });
  const start = useMutation({
    mutationFn: (args: Args) => hooks.current.start(args),
    onSuccess: (started) => {
      setTracking(true);
      setOutcome(null);
      hooks.current.onStarted?.(started);
      queryClient.setQueryData<Data>(queryKey, (data) => withJob(data, started));
      /* `exact`: 别Clavepuede能以同uno段开头, 按anterior缀Inválido会它们uno起推倒pesado来.  */
      void queryClient.invalidateQueries({ queryKey, exact: true });
    },
    onError: (cause) => hooks.current.onError?.(cause),
  });

  const job = query.data === undefined ? undefined : jobOf(query.data);
  const running = job?.status === 'running';
  useEffect(() => {
    if (!job) return;
    if (job.status === 'running') {
      if (!tracking) setTracking(true);
      return;
    }
    if (!tracking) return;
    setTracking(false);
    setOutcome(job);
    hooks.current.onFinish?.(job);
  }, [job, tracking]);

  /** 收起本次Resultado, 比如用户关掉Resultado卡, 或者Resultadoya经登记完.  */
  const dismiss = () => setOutcome(null);

  return { query, job, running, outcome, start, dismiss };
}
