/* ReproducirDispositivo向exterior要几样东西: Configuración, 回执, 来源Estadoy舞元素. 
 *
 * ReproducirDispositivoes命令模, No持Coneste些Estado: Configuración归遗Deja壳 `appSettings`(存En localStorage 
 * `peach.settings.v1` dentro), 回执归Todo站eseuno Toast, 舞氛围光y剧场Modo类挂En `#stage` arriba. 
 * 挂ReproducirDispositivo之anterior由持Con方调uno次 `configurePlayer` continuararriba.  */

/** ReproducirDispositivo读写ese几项Configuración. 对象由持Con方给出, ReproducirDispositivo改就地写回再调 `save`.  */
export interface PlayerSettings {
  ambientMode: boolean;
  theaterMode: boolean;
  seekSeconds: number;
  miniplayer: boolean;
  detailAutoplay: boolean;
  /** Código JAVObras开播anteriorese层Portada取OficialPortada还esVista previaImagen(`card-art`  `detailPosterUrl` 按它挑).  */
  javImage: string;
}

export interface PlayerHost {
  settings(): PlayerSettings;
  saveSettings(): void;
  toast(text: string, options: { timeout?: number; warn?: boolean }): void;
  /** 各来源此刻EnNoEn线(`/api/sources` rápido照, `false` 就es脱盘).  */
  loadSourceStatus(): Promise<Record<string, boolean>>;
  /** 脱盘时给人vereseuno句Original因.  */
  offlineReason(location: string): string;
  /** 舞元素: 氛围光 `--video-glow`, `data-ambient` y `data-theater` 挂En它身arriba.  */
  stage(): HTMLElement | null;
}

let current: PlayerHost | null = null;

export function configurePlayer(host: PlayerHost): void { current = host }

export function playerHost(): PlayerHost {
  if (!current) throw new Error('ReproductorAún no haycontinuararriba宿主(configurePlayer)');
  return current;
}
