/* 界面偏bienEnesteExplorar dispositivoen laeseuno真相(`peach.settings.v1`). 
 *
 * 值es壳En启动时归uno化bienese对象本身(`application/preferences.js`  `appSettings`): 壳dentroseisdiez来处读写都
 * 直continuar改它字段, 改完调 `save()` 落盘. 落盘同时换unoVersión号, 通知订阅者—Configuración面板
 * (`react/settings-panel/`)用 `useSyncExternalStore` 读Versión号, 壳En哪dentro改uno项, 开着面板当场跟arriba, 
 * 两边读es同uno对象, No各存uno. 
 *
 * rápido照esVersión号而Noes对象: 壳写法esOriginal地改字段, 对象引用从头到尾No变, 拿它当rápido照 React 永远
 * 以Como没变. 本模由 Application y React página面直continuar引用, 启动时Sincronizarpuede用; 面板Solo拿壳递过去实例, 自己No建No.dos.  */
export interface SettingsStore<T extends object> {
  /** 活Configuración对象, 读到就es此刻值.  */
  readonly value: T;
  /** 每次 `save()` 或 `notify()` 加uno.  */
  version(): number;
  subscribe(listener: () => void): () => void;
  /** 写进 localStorage, 再通知订阅者.  */
  save(): void;
  /** 值NoEneste对象dentro, pero面板要跟着pesado画时(altoContraste, SFW este两样各Con自己Clave)Solo通知No落盘.  */
  notify(): void;
}

export function createSettingsStore<T extends object>(key: string, value: T): SettingsStore<T> {
  const listeners = new Set<() => void>();
  let version = 0;
  const notify = () => {
    version += 1;
    listeners.forEach((listener) => listener());
  };
  return {
    value,
    version: () => version,
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener) };
    },
    save() {
      localStorage.setItem(key, JSON.stringify(value));
      notify();
    },
    notify,
  };
}
