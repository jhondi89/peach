/* ReproducirUbicación属于当anteriorExplorar dispositivo续播Estado; 观verEstadísticas仍由 ledger 活动Interfaz累计.  */
import { realDuration } from '@peach/legacy/core';

import type { PlayerItem } from './types';

const KEY = 'peach.playback-position.v1';
const tracking = new WeakMap<HTMLVideoElement, () => void>();

export function stopPlaybackPosition(video: HTMLVideoElement): void {
  tracking.get(video)?.();
  tracking.delete(video);
}

export function playbackKey(kind: 'item' | 'follow', item: PlayerItem, media: number | null = null): string {
  const follow = kind === 'follow' ? item.id : item.location === 'online' ? item.follow_item_id : null;
  return follow ? `follow:${follow}:${media ?? 'main'}` : `item:${item.id}`;
}

function storedPosition(key: string): number | null {
  try {
    const raw = localStorage.getItem(`${KEY}:${key}`);
    const time = raw === null || !raw.trim() ? NaN : Number(raw);
    return Number.isFinite(time) && time >= 0 ? time : null;
  } catch { return null }
}

export function playbackPosition(key: string, item: PlayerItem): number {
  const stored = storedPosition(key);
  if (stored !== null) return stored;
  const ratio = Number(item.leave_ratio);
  return ratio > 0 && ratio < 1 ? ratio * realDuration(item.duration) : 0;
}

/** MetadatosCargar且定Completadoposterior才登记, 换源y销毁产生ceroUbicaciónNo覆盖续播Estado.  */
export function trackPlaybackPosition(key: string, video: HTMLVideoElement): void {
  stopPlaybackPosition(video);
  let ready = video.readyState >= 1;
  const save = () => {
    if (!ready || !Number.isFinite(video.currentTime)) return;
    const time = video.ended ? 0 : Math.max(0, video.currentTime);
    try {
      localStorage.setItem(`${KEY}:${key}`, String(time));
    } catch { /* 存储Nopuede用No阻断Reproducir.  */ }
  };
  const loaded = () => { ready = true };
  const empty = () => { ready = false };
  video.addEventListener('loadedmetadata', loaded);
  video.addEventListener('emptied', empty);
  for (const event of ['timeupdate', 'seeked', 'pause', 'ended']) video.addEventListener(event, save);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', save);
  tracking.set(video, () => {
    save();
    video.removeEventListener('loadedmetadata', loaded);
    video.removeEventListener('emptied', empty);
    for (const event of ['timeupdate', 'seeked', 'pause', 'ended']) video.removeEventListener(event, save);
    window.removeEventListener('pagehide', save);
    document.removeEventListener('visibilitychange', save);
  });
}
