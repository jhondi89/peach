/* `avatarInner`(`card-art/markup.ts`)画出来Avatar放进 React 岛时, 圆框dentroeseImagen写法. 
 *
 * Imagen铺满圆框, 按 cover 裁. Con人脸框时, `avatarFrame`(`card-art/framing.ts`)EnImagenCargar时往Imagenarriba
 * 写interior联 left/top/width/height cien分比, 脸放grande到框en proceso, ancho度常常超过 100%. 岛en la Tailwind
 * 预检给每Imagen加 `max-width:100%`, No放开话ancho被carpeta回框ancho, alto照样放grande, 脸偏到izquierda边, derecha侧
 * 露出底abajoprimero字母. 遗Deja层自己 `.searchface img` Sineste预检.  */
export const LEGACY_AVATAR_IMG =
  '[&_img]:absolute [&_img]:inset-0 [&_img]:size-full [&_img]:max-w-none [&_img]:max-h-none [&_img]:object-cover';
