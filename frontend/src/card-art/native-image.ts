/** 手arribaeste相对边车ese源Imagen缩másmenos; 换成别Imagen就es 0. 
 *
 *  索引página取es实体Imagen缩到largo边 640 派生件, 人脸边车记仍esOriginal件像素. 取景几何
 *  Enetc.比ZoomabajoNo变, 唯独"放到másgrande就Empezar虚"eseuno问es真Conmásmenos像素puede用—拿Original件
 *  数去套派生件, 算出来倍数正bienunoImagen放糊. 所以按esteRelación脸框换算到手arribaeste. 
 *
 *  两轴各算uno次再比: etc.比ZoomSolo差取Completoeseuno点, 差得más就Descripcióneste根本es另unoImagen. 
 *  Solo认缩pequeño: 比源Imagen还grande必然Noes它缩出来.  */
export function faceSourceScale(width: number, height: number, sourceWidth: number, sourceHeight: number) {
  if (!(width > 0 && height > 0 && sourceWidth > 0 && sourceHeight > 0)) return 0;
  const byWidth = width / sourceWidth, byHeight = height / sourceHeight;
  if (byWidth > 1.001 || byHeight > 1.001) return 0;
  if (Math.abs(byWidth - byHeight) > Math.max(byWidth, byHeight) * .01) return 0;
  return byWidth;
}

/** 64 px 以abajoAvatar属于pequeñoImagen标; grandeImagen y  70 px 紧凑Avatar按源像素判断es否补底.  */
export function nativeImageFit(width: number, height: number, frameWidth: number, frameHeight: number, dpr = 1) {
  const density = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  width /= density;
  height /= density;
  const valid = [width, height, frameWidth, frameHeight].every(value => Number.isFinite(value) && value > 0);
  const small = valid && Math.min(frameWidth, frameHeight) >= 64
    && (width < frameWidth * .4 || height < frameHeight * .4);
  const scale = valid ? Math.min(1, frameWidth / width, frameHeight / height) : 1;
  return { small, width: width * scale, height: height * scale };
}

/** 标识按框 contain 之posterior, corto边至menos占框corto边esteuno. 10:1 字标En方框dentro正bien落Eneste线arriba.  */
export const MARK_MIN_SHORT = 0.1;

/** 超扁, 超alto标识(实测 1378×42, 42×600)按框 contain Solo剩uno道线: corto边撑到 `MARK_MIN_SHORT`, 
 *  largo边仍按框, 摆时候 cover, 裁掉eslargo边两头. Relación正常标识返回 `null`, 照常 contain.  */
export function markClamp(width: number, height: number, frameWidth: number, frameHeight: number) {
  if (![width, height, frameWidth, frameHeight].every(value => Number.isFinite(value) && value > 0)) return null;
  const scale = Math.min(frameWidth / width, frameHeight / height);
  const shownWidth = width * scale, shownHeight = height * scale;
  const floor = Math.min(frameWidth, frameHeight) * MARK_MIN_SHORT;
  if (Math.min(shownWidth, shownHeight) >= floor) return null;
  return shownHeight < shownWidth ? { width: shownWidth, height: floor } : { width: floor, height: shownHeight };
}
