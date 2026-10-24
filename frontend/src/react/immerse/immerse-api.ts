/* InmersivoModo(常驻组件 `immerse`, `immerse-island.tsx`)对壳契约: 壳Solo拿命令入口, 片单, 每uno格ReproducirDispositivo, 
 * 手势, 动作Clavey作者Título都En `peach-app.js` dentro. 地址栏, primeropáginaFiltrar, Avatar拼法y"关掉之posterior去哪儿"归壳.  */

export interface ImmerseHost {
  /** primeropágina当anteriorFiltrar(壳 `state`): 片单按它Aleatorio抽样, 画幅No算.  */
  filters(): Record<string, string | number | null | undefined>;
  /** 双击izquierdaderechamedio区rápido退rápido进秒数(`appSettings.seekSeconds`).  */
  seekSeconds(): number;
  /** 来源脱盘: este样片子拉No到流, 进片单就esuno黑屏Cargaren proceso.  */
  sourceOffline(location: string): boolean;
  /** Títuloeseuno行纯文本(遗Deja层 `javDisplayName`).  */
  displayName(item: Record<string, unknown>): string;
  /** 每换uno: 壳用 replace  `/immerse?id=` 写进地址栏, Actualizar落回同uno.  */
  route(id: number): void;
  /** InmersivoModo关掉之posterior: 壳回primeropágina.  */
  closed(): void;
  openItem(id: number): void;
  openEntity(kind: 'performer' | 'creator', name: string): void;
  openUnowned(): void;
  /** 操作回执; 给 `undo` 就带unoDeshacerClave.  */
  toast(message: string, options?: { undo?: () => Promise<void> }): void;
  /** 带Sugerencia音Advertencia(片单Como空).  */
  warn(message: string): void;
  failure(action: string, error: unknown): void;
}

export interface ImmerseApi {
  /** AbrirInmersivoModo; `startId` NoEnesteuno批Aleatorio抽样dentro时取它Detalles插到最anterior.  */
  open(startId: number | null): Promise<void>;
  /** CerrarClavey Escape 走eseuno: 拆掉所Con格, 按会话Cancelar读取, 然posterior交给壳 `closed`.  */
  close(): void;
  isOpen(): boolean;
  /** 该RespuestaReproducirrápido捷Clave video: 当anterior出画eseuno格.  */
  activeVideo(): HTMLVideoElement | null;
}
