/* Pasar el ratónuno叠卡片时它dentro面anterior几逐翻走, Descripción它esuno叠而Noes某uno视频. 
 *
 * 时序y门槛(`frontend/test/react/use-stack-flip.test.tsx`): 指针停 340ms 才Empezar, 面板建bien
 * 420ms posterior翻No.unoabajo, 之posterior每 1100ms 翻uno; 翻出去ese演完(间隔减 120ms)才卸掉离场态, 
 * 否则会当场弹回Original. más选, 遮挡, 减menos动效y滚动en proceso都No启动, este些判据归壳, 经 `canFlip`
 * 递进来; 取Imagenanteriorposterior各再问uno次. 离开即停y还Original静止Portada. 
 *
 * 翻哪些由调用方给: ReproducirLista翻它自己Portada, primeropágina Mix 现拉相关Obras. 能用Imagenmenos于两就
 * No翻: unoImagen翻过去还es它自己.  */
import { useCallback, useEffect, useRef, useState } from 'react';

/** uno停más久再翻走.  */
export const MIX_FLIP_MS = 1100;
/** 面板建bien到No.uno次翻动. 直continuar用 1.1 秒间隔etc.No.uno, 指针停abajo到Con反应要continuar近两秒.  */
export const MIX_FLIP_LEAD_MS = 420;
/** 最más预备几, uno次Pasar el ratónNo拉unoCompleto批Portada.  */
export const MIX_FLIP_FACES = 9;
/** 指针停más久才算"Enveresteuno叠", 扫过去No启动.  */
const MIX_FLIP_ARM_MS = 340;
/** unoImagenetc.más久还没解码bien就No要它.  */
const MIX_FLIP_READY_MS = 5000;

export interface StackFlipOptions {
  /** esteuno叠要翻Imagen地址, 按翻动顺序.  */
  load(): Promise<readonly string[]>;
  /** 此刻能No能翻: más选, 遮挡, 减menos动效, 滚动en proceso都回 false.  */
  canFlip(): boolean;
  /** 预取解码时带来路策略, 要 y arribaese几 `<img>` uno致, 否则解码 y 显示es两次Por favor求. 
   *  关注páginaexterior站ImagenNo带来路.  */
  referrerPolicy?: ReferrerPolicy;
}

export interface StackFlip {
  /** ya经解码bienese几; 空数组就esNoEn翻, 静止Portada照常露着.  */
  faces: readonly string[];
  /** En cursoen laeseuno.  */
  current: number;
  /** 刚翻出去, 还En演离场eseuno.  */
  leaving: number | null;
  onPointerEnter(): void;
  onPointerLeave(): void;
}

interface Run {
  live: boolean;
  generation: number;
  timers: Set<ReturnType<typeof setTimeout>>;
  cycle: ReturnType<typeof setInterval> | null;
  cancels: Set<() => void>;
  /** 指针进来posterioreseuno段 340ms Esperando.  */
  armed: ReturnType<typeof setTimeout> | null;
  count: number;
  at: number;
}

/** etc.unoImagen载入y解码. 取No到, anchoComo 0 或Tiempo de espera都算No能用.  */
function readyImage(url: string, run: Run, referrerPolicy?: ReferrerPolicy): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    if (referrerPolicy) image.referrerPolicy = referrerPolicy;
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      run.cancels.delete(cancel);
      resolve(ok);
    };
    const cancel = () => finish(false);
    const timeout = setTimeout(cancel, MIX_FLIP_READY_MS);
    run.cancels.add(cancel);
    image.onerror = cancel;
    image.onload = () => {
      if (!image.naturalWidth) { finish(false); return }
      if (typeof image.decode === 'function') image.decode().then(() => finish(true), cancel);
      else finish(true);
    };
    image.src = url;
  });
}

export function useStackFlip({ load, canFlip, referrerPolicy }: StackFlipOptions): StackFlip {
  const [faces, setFaces] = useState<readonly string[]>([]);
  const [current, setCurrent] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const run = useRef<Run>({
    live: false, generation: 0, timers: new Set(), cycle: null, cancels: new Set(), armed: null, count: 0, at: 0,
  });
  /* 回调dentro读es最Nuevo `load`/`canFlip`: 卡片pesado画时换闭包, En curso进行eseuno次也跟着换.  */
  const latest = useRef({ load, canFlip });
  latest.current = { load, canFlip };

  const clear = useCallback(() => {
    const state = run.current;
    state.live = false;
    state.generation += 1;
    state.timers.forEach(clearTimeout);
    state.timers.clear();
    state.armed = null;
    if (state.cycle !== null) clearInterval(state.cycle);
    state.cycle = null;
    state.cancels.forEach((cancel) => cancel());
    state.count = 0;
    state.at = 0;
  }, []);

  const later = (ms: number, task: () => void) => {
    const timer = setTimeout(() => { run.current.timers.delete(timer); task() }, ms);
    run.current.timers.add(timer);
    return timer;
  };

  const step = () => {
    const state = run.current;
    if (!state.live || state.count < 2) return;
    const out = state.at;
    state.at = (out + 1) % state.count;
    setLeaving(out);
    setCurrent(state.at);
    later(MIX_FLIP_MS - 120, () => setLeaving((now) => (now === out ? null : now)));
  };

  const start = async () => {
    const state = run.current;
    if (state.live || !latest.current.canFlip()) return;
    state.live = true;
    const generation = ++state.generation;
    const alive = () => state.live && generation === state.generation;
    let pool: readonly string[] = [];
    try {
      pool = (await latest.current.load()).slice(0, MIX_FLIP_FACES);
    } catch {
      return;
    }
    if (!alive() || !latest.current.canFlip() || pool.length < 2) return;
    const ready = await Promise.all(pool.map((url) => readyImage(url, state, referrerPolicy)));
    if (!alive() || !latest.current.canFlip()) return;
    const usable = pool.filter((_url, index) => ready[index]);
    if (usable.length < 2) return;
    state.count = usable.length;
    state.at = 0;
    setFaces(usable);
    setCurrent(0);
    setLeaving(null);
    later(MIX_FLIP_LEAD_MS, () => {
      step();
      state.cycle = setInterval(step, MIX_FLIP_MS);
    });
  };

  const onPointerEnter = () => {
    const state = run.current;
    if (state.armed !== null) { clearTimeout(state.armed); state.timers.delete(state.armed) }
    state.armed = later(MIX_FLIP_ARM_MS, () => { state.armed = null; void start() });
  };
  const onPointerLeave = () => {
    clear();
    setFaces([]);
    setCurrent(0);
    setLeaving(null);
  };

  /* Desinstalar时Solo收计时DispositivoyEn途Imagen, No再改Estado.  */
  useEffect(() => clear, [clear]);

  return { faces, current, leaving, onPointerEnter, onPointerLeave };
}
