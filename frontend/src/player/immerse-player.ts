/* InmersivoModo每uno格ReproducirDispositivo: SoloDeja媒体本身. Progreso, CargarSugerenciay动作Clave都由Inmersivo岛自己画, 所以 Video.js
 * 挂成裸uno层, SinControles, 海报, 转圈yError层. 
 *
 * 片源yDetalles同uno判据(`playableStreamSource`), 要转码分片片子SoloCon Video.js 播得; 分片出错
 * 退回直读,  y DetallesReproducirDispositivo同uno兜底. 每格uno流会话, 由调用方建bien传进来: 拆esteuno格时按会话Cancelar, 
 * 离开página面时调用方也按它Cancelar.  */
import { disposePlayer } from './dispose';
import { cancelStreamSession, directStreamSource, playableStreamSource } from './stream';
import { stopTelemetry, wireTelemetry } from './telemetry';
import type { PlayerItem, VjsPlayer } from './types';
import { ensureVideojs } from './videojs';

export interface ImmersePlayerOptions {
  kind: 'immerse';
  item: PlayerItem;
  /** esteuno格流会话(`newStreamSession()`).  */
  session: string;
  /** 放完之posterior(InmersivoModocontinuar着放Siguiente).  */
  onEnded?: () => void;
  /** 片源ya经交给 video: 调用方从esteuno刻起etc.它puede以出画. 拆得比片源解析rápido时No回调.  */
  onLoaded?: () => void;
}

const BARE = {
  controls: false, preload: 'auto', posterImage: false, titleBar: false, textTrackDisplay: false, loadingSpinner: false,
  bigPlayButton: false, controlBar: false, errorDisplay: false, textTrackSettings: false,
};

export function mountImmersePlayer(video: HTMLVideoElement, options: ImmersePlayerOptions): () => void {
  const { item, session } = options;
  let player: VjsPlayer | null = null, released = false;
  void Promise.all([playableStreamSource(item, session), ensureVideojs().catch(() => null)]).then(([source, vjs]) => {
    if (released) return;
    const direct = directStreamSource(item, session);
    const segmented = String(source.type || '').includes('mpegurl');
    // ReproducirDispositivo脚本拉No到时退回Original生 video; Original生元素播No分片, Solo能直读. 
    if (!vjs) video.src = (segmented ? direct : source).src;
    else {
      const mounted = vjs(video, BARE);
      player = mounted;
      if (segmented) mounted.one('error', () => { if (!released) mounted.src(direct) });
      mounted.src(source);
    }
    wireTelemetry(item, video, options.onEnded ? { onEnded: options.onEnded } : {});
    options.onLoaded?.();
  });
  return () => {
    if (released) return;
    released = true;
    cancelStreamSession(session);
    if (player) disposePlayer(player);
    else { video.pause(); stopTelemetry(video); video.removeAttribute('src'); video.load() }
  };
}
