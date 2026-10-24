export interface CatalogRender {
  revision: number;
  settled: Promise<void>;
  mount: boolean;
  signal: AbortSignal | null;
  isCurrent(): boolean;
  finish(mounted: boolean): void;
}

interface Painting { revision: number; abort: AbortController }

/** SoloGestionarCuadrícula代次, primero屏CancelaryLlegarEsperando; Por favor求, 缓存ypágina面归现Con Query  y 路由.  */
export class CatalogController {
  private currentRevision = 0;
  private currentPage = '';
  private painting: Painting | null = null;
  private waiters = new Map<number, () => void>();

  get revision(): number { return this.currentRevision; }
  get page(): string { return this.currentPage; }
  get pending(): boolean { return this.painting !== null; }

  taken(mounted: boolean): boolean { return mounted || this.pending; }

  /** 同unopáginayaLlegar时SoloActualizar props; primero屏aúnnoCompletado时CancelarAnterior轮再Abrir.  */
  begin(page: string, mounted: boolean): CatalogRender {
    const changedPage = !!this.currentPage && this.currentPage !== page;
    if (changedPage) this.clear();
    // 每轮SoloConunoCon效Esperando: 被替代调用返回, 其Llegar回调仍按代次隔离. 
    this.releaseWaiters();
    this.currentPage = page;
    const revision = ++this.currentRevision;
    const settled = new Promise<void>(resolve => this.waiters.set(revision, resolve));
    const mount = changedPage || !mounted || this.pending;
    let painting: Painting | null = null;
    if (mount) {
      this.painting?.abort.abort();
      painting = { revision, abort: new AbortController() };
      this.painting = painting;
    }
    const current = () => this.currentPage === page && this.currentRevision === revision
      && (!painting || !painting.abort.signal.aborted);
    return {
      revision, settled, mount, signal: painting?.abort.signal ?? null, isCurrent: current,
      finish: (landed: boolean) => {
        if (painting && this.painting === painting) {
          this.painting = null;
          if (!landed) this.releaseWaiters();
        }
      },
    };
  }

  /** página面Solo交回自己代次; antiguopágina面No能放行posterior续FiltrarEsperando.  */
  settle(revision: number): void {
    if (revision > this.currentRevision) return;
    for (const [requested, resolve] of this.waiters) {
      if (requested <= revision) { this.waiters.delete(requested); resolve(); }
    }
  }

  /** 离开Cuadrícula时Cancelar预取, 释放TodoEsperando; 代次单调递增.  */
  clear(): void {
    this.painting?.abort.abort();
    this.painting = null;
    this.currentPage = '';
    this.releaseWaiters();
  }

  private releaseWaiters(): void {
    const waiters = [...this.waiters.values()];
    this.waiters.clear();
    waiters.forEach(resolve => resolve());
  }
}
