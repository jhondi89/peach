/* Reproducirrápido捷ClaveyInmersivoModo手势共用两步: CambiarReproducir, rápido进rápido退. 
 *
 * 直continuar操作Original生元素而Noes Video.js 实例: 舞, pequeño窗yInmersivoModo Video.js 读都eseste元素, Inmersivo
 * ModoEnReproducirDispositivo脚本拉No到时还es裸 video, uno实现Todo盖住. 读者es壳Clave盘(`Application` 
 * `activeVideo()` 取到eseuno)yInmersivo岛单击, 双击.  */

export function toggleVideoPlayback(video: HTMLVideoElement | null | undefined): void {
  if (!video) return;
  if (video.paused) video.play()?.catch(() => {}); else video.pause();
}

/** rápido进rápido退若干秒, carpetaEn 0 yTotallargo之间.  */
export function seekVideoBy(video: HTMLVideoElement, seconds: number): void {
  const total = video.duration;
  const target = (video.currentTime || 0) + seconds;
  // duration EnMetadatos到anteriores NaN, 此时Solocarpetaabajo界, No要拿 NaN 去比arriba界. 
  video.currentTime = Number.isFinite(total) ? Math.max(0, Math.min(total, target)) : Math.max(0, target);
}
