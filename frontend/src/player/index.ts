/* ReproducirDispositivo模: 命令 TypeScript, No进入 React 渲染. 
 * Video.js continuar管 video 宿主yControles DOM; 舞 y Inmersivo effect 调 mountPlayer yGuardarLimpiar函数. 
 * Application y React página面共享源码Imagen, 宿主, ReproducirDispositivo槽, 流会话yderechaClave菜单Estado各SoloConuno.  */
export type { PlayerHost, PlayerSettings } from './host';
export { configurePlayer } from './host';
export type { PlayerMenuHooks } from './menu';
export { closePlayerMenu, configurePlayerMenu } from './menu';
export { applyAmbientMode, applyTheaterMode, clickPlayerControl } from './controls';
export type { DetailPlayerOptions, MountPlayerOptions, PlayerMedia, PlayerResume } from './detail-player';
export {
  attachPlayerChrome, mountDetailPlayer, mountPlayer, preparePlayerFrame, stopPlayerPanels,
} from './detail-player';
export { disposePlayer } from './dispose';
export type { ImmersePlayerOptions } from './immerse-player';
export { seekVideoBy, toggleVideoPlayback } from './playback';
export { detailPlayer, resizeSoon, setDetailPlayer } from './registry';
export { fmtSpeed, streamSpeedBits } from './stats';
export {
  cancelDetailStream, cancelStreamSession, directStreamSource, newStreamSession, playableStreamSource,
} from './stream';
export type { TelemetryOptions } from './telemetry';
export { wireFollowTelemetry, wireTelemetry } from './telemetry';
export type { PlayerItem, VjsPlayer } from './types';
export { ensureVideojs } from './videojs';
export { mountPreviewPlayer } from './preview-player';
