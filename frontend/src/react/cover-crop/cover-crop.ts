/* RecortarPortadaDatos契约. 
 *
 * SoloConuno写端点: 给框就es设成手工取景, 给 null 就es按折痕判据pesado算uno遍. 
 * 框es源Imagen像素, derechaabajo开区间, y `poster_box` eseSolo读字段同uno套坐标.  */
import { apiSend } from '../../api';
import type { CropBox } from '../../crop-geometry';

export const COVER_CROP_URL = '/api/cover-crop';

export interface CoverCropResult {
  ok: boolean;
  code: string;
  poster_box: { x0: number; y0: number; x1: number; y1: number; method: string; px: number[] } | null;
}

export const sendCoverCrop = (code: string, box: CropBox | null) =>
  apiSend<CoverCropResult>(COVER_CROP_URL, { code, box });
