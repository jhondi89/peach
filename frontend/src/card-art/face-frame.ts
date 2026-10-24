/* 圆Avatar人脸取景: 按源Imagendentroese脸Conmásmenos像素, 算出能放grandemásmenos倍. 

   Solo挪No放grande时候, "脸太pequeño"este件事es没法解决: `object-fit:cover` Zoom由框 y 
   ImagenRelación定死, 脸EnImagendentro占másmenos, En框dentro就占másmenos. 实测 539 实体Imagen, 脸框ancho占框ancho
   en proceso数es 44%—cuatro分之tresAvatar本来就es特写, 放grandeSolo会头顶 y abajo巴切出去; 真正偏pequeño
   SoloCon 29 , 它们几乎都esTodo身站姿照, 脸落EnImagenarribamedio截unopequeñodentro. 

   所以放grande倍数No能写死, 也No能Solo由服务端算uno: 约束es"源Imagendentroese脸Conmásmenos像素"比
   "este框要显示másmenos像素", 而posterior者取决于框实际尺寸 y 设备像素比. 同uno 640×960, 
   脸SoloCon 67 px anchoImagen(`performer-8711`), En资料página 160 px 圆框arriba放grande 2 倍就到
   源Imagen 1:1, 再放grande就esarriba采样; En顶栏 64 px 圆框arriba放到 3 倍仍Con余量. 判据uno样, 
   结论差uno倍más, SoloConEnpágina面esteuno侧, 拿到框真实尺寸时才算得出来. 

   carpeta持顺序固定: 先算"要másgrande才ver得清, 才摆得正", 用构Imagenarriba限刹住, 最posterior由"放到másgrande
   就Empezar虚"压死. `zoom` Como 1 时Solo挪No放grande, ya经够grandeese 395 走就eseste路. 

   Sinunoarriba限es倍数: 倍数答No任何uno问题. 同样 3 倍, 特写被放成cinco官grande头, 远景
   Todo身Imagen脸却还SoloCon 6 px. 问es脸放完Conmásgrande(`FACE_CEILING`) y 源Imagen还剩másmenos像素
   (Sin损arriba限), 两都用得着框真实尺寸 y 设备像素比, 所以Solo能Enpágina面esteuno侧算.  */

/** 脸框ancho占框corto边esteRelación就算ver得清es谁, No再往arriba放. 
 *
 *  检出给框Solo覆盖眼鼻嘴, No含头发 y abajo巴exterior沿; 32% 时Completo头grande约占siete成, 构Imagen还松. 
 *  往arriba调会让本来就偏紧特写被esteuno档"救"进放grande, ese些ImagenNo需要.  */
export const FACE_TARGET = 0.32;

/** 脸框En框dentro至menos要Coneste么más CSS 像素ancho. 
 *
 *  Relaciónesteuno档回答Nopequeño圆标问题: 32% En 120 px 资料página框dentroes 38 px 脸, En
 *  28 px 题材圆标dentroSoloCon 9 px, 而 9 px ancho眼鼻嘴认No出es谁—este排圆标存En理由
 *  正es让人uno眼认出题材. 像素abajo限SoloEn框pequeño到esteRelaciónNo够用时才continuar管(28 px 框要 46%, 
 *  48 px 框算出来bajo于 32% 就仍走Relacióneseuno档), grande框Anterior数都No动.  */
export const MIN_FACE_PX = 13;

/** 构Imagenarriba限: 脸框最más占框corto边este么más. 
 *
 *  脸框Solo覆盖眼鼻嘴: 60% 时Completo头刚bienIntroduce满框, 再往arriba就Empezar切头顶 y abajo巴. 
 *
 *  este问es"放完之posterior脸Conmásgrande", No问放grande几倍: 倍数答No构Imagen问题—同样
 *  3 倍, 特写被放成cinco官grande头, 远景Todo身Imagen脸却还SoloCon 6 px. 
 *  实测ese 16:9  `Clair Obscur` Portada, 脸占Imagenancho 4.5%, cover 进 28 px 圆dentro
 *  Solo剩 2.2 px—它要 5.8 倍才够ver, 而Sin损arriba限本来就还Con 5.1 倍余量.  */
export const FACE_CEILING = 0.6;

/** 人脸Datos齐No齐. 缺uno样就没法算, 调用方Solo挪No放grande. 
 *
 *  `faceW` es脸框ancho**源Imagen像素**, Noes归uno化值: Sin损arriba限问就es"Conmásmenos像素puede用", 
 *  归uno化值除得出Relación却除No出像素, 换算要En拿得到OriginalImagen尺寸eseuno侧做.  */
export interface FaceBox { cx: number; cy: number; faceW: number; imgW: number; imgH: number }

/** 框 CSS 像素尺寸.  */
export interface FrameSize { w: number; h: number }

export function hasFaceBox(face: Partial<FaceBox> | null | undefined): face is FaceBox {
  if (!face) return false;
  // 脸心puede以es 0: 脸贴着izquierda边缘或顶边Imagen确实存En, eseNoes缺Datos. 
  return Number.isFinite(face.cx) && Number.isFinite(face.cy)
    && Number(face.faceW) > 0 && Number(face.imgW) > 0 && Number(face.imgH) > 0;
}

/** 放grandemásmenos倍. `frame` es框 CSS 像素尺寸, `dpr` es设备像素比. 
 *
 *  推着它往en laCon两样: 脸要够grande(`wanted`), 脸还要摆得正(`centred`); 
 *  压着它Con两样: 脸放完No许超过构Imagenarriba限, 源Imagen剩abajo像素No许被arriba采样.  */
export function faceZoom(face: Partial<FaceBox> | null | undefined, frame: FrameSize | null | undefined, dpr = 1,
                         target = FACE_TARGET, ceiling = FACE_CEILING): number {
  if (!hasFaceBox(face) || !(frame && frame.w > 0 && frame.h > 0)) return 1;
  const ratio = dpr > 0 ? dpr : 1;
  // cover 基础Zoom: Imagen缩到刚bien盖住框, 紧eseuno边说话. 
  const base = Math.max(frame.w / face.imgW, frame.h / face.imgH);
  const shown = face.faceW * base;
  if (!(shown > 0)) return 1;
  const side = Math.min(frame.w, frame.h);
  // 两档取anchoeseuno档: Relación管grande框, 像素abajo限管pequeño到RelaciónNo够用框. 
  const wanted = Math.max(target, MIN_FACE_PX / side) * side / shown;
  /* 摆正也要放grande. 脸心拉到框心anterior提esImagen比框grande得够más—No许露白, ImagenNo够grande时脸Solo能
     被顶En框边arriba, 量出来es够grande, ver着却es"pequeño而偏". 脸离Imagen边缘越近, 它拉到
     框心要放grande越más, 所以判据es"更近eseuno边到en proceso线距离", 两根轴各算uno次取紧.  */
  const centred = Math.max(
    frame.w / (2 * Math.min(face.cx, 1 - face.cx) * face.imgW * base),
    frame.h / (2 * Math.min(face.cy, 1 - face.cy) * face.imgH * base));
  // 脸源像素 ÷ 现Eneste框要设备像素. etc.于 1 就esya经 1:1, 再放grande就esarriba采样. 
  const lossless = face.faceW / (shown * ratio);
  return Math.max(1, Math.min(
    Math.max(wanted, Math.min(centred, ceiling * side / shown)),
    lossless));
}

/** 取景Resultado, cuatro值都es相对框cien分比. 
 *
 *  给cien分比而Noes像素: 索引páginagrandeImagen版框ancho跟着列ancho走, 视口uno变就得跟着变, 
 *  cien分比让 CSS 自己跟随. `zoom` 按Cargar时框尺寸算uno次就够—框变grandeSolo会让
 *  放grande倍数偏保守, No会突然越过Sin损arriba限.  */
export function faceFrame(face: Partial<FaceBox> | null | undefined, frame: FrameSize | null | undefined, dpr = 1,
                          target = FACE_TARGET, ceiling = FACE_CEILING):
  { zoom: number; width: number; height: number; left: number; top: number } | null {
  const zoom = faceZoom(face, frame, dpr, target, ceiling);
  // 倍数grande于 1 就Descripción框量得到尺寸; aquí再判uno次Soloes给Tipo收estrecho. 
  if (zoom <= 1 || !hasFaceBox(face) || !frame) return null;
  const scale = Math.max(frame.w / face.imgW, frame.h / face.imgH) * zoom;
  const width = face.imgW * scale;
  const height = face.imgH * scale;
  // 脸心对准框心, 再carpeta回来No许露白. `zoom >= 1` 且底子es cover, 所以Imagenuno定比框grande, 
  // este区间No会es空. 
  const left = Math.min(0, Math.max(frame.w - width, frame.w / 2 - face.cx * width));
  const top = Math.min(0, Math.max(frame.h - height, frame.h / 2 - face.cy * height));
  const pct = (value: number, span: number) => Math.round(value / span * 1e4) / 100;
  return {
    zoom: Math.round(zoom * 1000) / 1000,
    width: pct(width, frame.w), height: pct(height, frame.h),
    left: pct(left, frame.w), top: pct(top, frame.h),
  };
}
