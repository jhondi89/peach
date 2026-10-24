import type { FollowPhotoLayout, FollowPhotoSize } from '../follow-feed/follow-feed';

/** 资料página视Imagen由 painted Informe; 异步Murono落 DOM 时也能正确SeleccionarTamañoImagenControles.  */
export interface PhotoSurfaceState {
  entityWall: boolean;
  entityCurrent: boolean;
  indexVisible: boolean;
  pathname: string;
  followMedia: 'videos' | 'images';
  statsVisible: boolean;
}

export function photoViewActive(state: PhotoSurfaceState, visibleSkeletonWall: () => boolean): boolean {
  if (state.entityWall && state.entityCurrent && state.indexVisible) return true;
  if (state.pathname === '/follow' && state.followMedia === 'images' && state.statsVisible) return true;
  return visibleSkeletonWall();
}

export interface PhotoWallPreferences { size: FollowPhotoSize; layout: FollowPhotoLayout; imagesOnly: boolean }
export interface PhotoSurfacePorts {
  preferences(): PhotoWallPreferences;
  walls(): Iterable<HTMLElement>;
  pushEntity(patch: { photoSize: FollowPhotoSize; photoLayout: FollowPhotoLayout; followImagesOnly: boolean }): void;
  pushFollow(patch: { photoSize: FollowPhotoSize; photoLayout: FollowPhotoLayout; imagesOnly: boolean }): void;
  syncDensity(): void;
  storeSize(size: string): void;
}

export function createPhotoSurfaceController(ports: PhotoSurfacePorts) {
  const sync = () => {
    const prefs = ports.preferences();
    for (const wall of ports.walls()) {
      wall.dataset.size = prefs.size;
      wall.dataset.layout = 'fixed';
      wall.dataset.imagesOnly = String(prefs.imagesOnly);
    }
    ports.pushEntity({ photoSize: prefs.size, photoLayout: prefs.layout, followImagesOnly: prefs.imagesOnly });
    ports.pushFollow({ photoSize: prefs.size, photoLayout: prefs.layout, imagesOnly: prefs.imagesOnly });
    ports.syncDensity();
  };
  return { sync, setSize(size: string) { ports.storeSize(size); sync() } };
}
