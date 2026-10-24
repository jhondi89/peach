/* 卡片Imagen片, 人脸取景yPasar el ratónVista previa(@peach/card-art). 
 * Application y React página面引用同uno源码, 随 peach-app.js 发出. 
 * Obra representativa表, Pasar el ratónConfiguraciónyDocumentación监听Todo站SoloConuno.  */
export { faceFrame, faceZoom, hasFaceBox, FACE_CEILING, FACE_TARGET, MIN_FACE_PX } from './face-frame';
export type { FaceBox, FrameSize } from './face-frame';
export { advanceImageFallback, imageFallbackAttrs, parseFallbacks, wireImageFallbacks } from './image-fallback';
export { faceSourceScale, nativeImageFit } from './native-image';
export { rememberRepresentatives, representativeOf } from './representatives';
export type { RepresentativeRow } from './representatives';
export {
  avatarInner, cardArtwork, cardIdentity, coverImage, coverUrl, detailPosterUrl, entityAvatar, entityFaceImg,
  faceBoxAttrs, faceOrigin, facePos, javArtwork, logoUrl, mixFace, mixLabel, performerLabel, queueAvatarHtml,
  queueThumbHtml, withVersion,
} from './markup';
export type { Artwork, ArtworkKind, CoverItem, FaceFocus, FaceRef, IdentityItem } from './markup';
export {
  avatarFrame, coverAnchor, coverFace, coverRatio, fitNativeImage, frameCachedImages, installCardArt,
  posterPanel, refitNativeImages, relayoutCovers, settleImage, upgradeCover, watchPendingImages,
} from './framing';
export { configureHoverPreview, releaseHover, releaseHoverPreviews, setHoverState, wireHover } from './hover';
export type { HoverItem, HoverPreviewConfig } from './hover';
