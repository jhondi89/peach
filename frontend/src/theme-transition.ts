/* 明暗TemaCambiar过渡: 侧栏底栏ese对明暗Clave按abajo时走esteuno.  */
let themeChanging=false;
/** Board TemaCambiar从触发Dispositivoen proceso心扩散, 减menos动态效果时直continuar应用.  */
export async function transitionTheme(button:HTMLElement,apply:()=>void):Promise<void>{
  if(themeChanging)return;
  if(!document.startViewTransition||matchMedia('(prefers-reduced-motion: reduce)').matches){apply();return}
  const rect=button.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
  const size=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y))*2.5;
  /* 柔边eseuno圈由uno段 CSS 渐变画, No套 SVG: 遮罩尺寸每uno帧都En变, 每uno帧就要照Nuevo
     尺寸它pesadoNuevo光栅化uno遍, 而uno带alto斯Difuso滤镜 SVG 每次都要连滤镜uno起pesado跑. 
     渐变Sinesteuno层, 边缘过渡带靠色标Ubicación给.  */
  const mask='radial-gradient(circle closest-side,#000 78%,#0006 88%,transparent)';
  const style=document.createElement('style');style.textContent=`::view-transition-old(root){animation:none}::view-transition-new(root){mix-blend-mode:normal;mask-image:${mask};mask-repeat:no-repeat;will-change:mask-position,mask-size;animation:peach-theme-reveal 560ms cubic-bezier(.16,1,.3,1) both}@keyframes peach-theme-reveal{from{mask-position:${x}px ${y}px;mask-size:0px 0px}to{mask-position:${x-size/2}px ${y-size/2}px;mask-size:${size}px ${size}px}}`;
  themeChanging=true;document.head.append(style);
  const root=document.documentElement;
  root.dataset.themeSnapshot='true';
  let applied=false;
  const applyOnce=()=>{if(!applied){applied=true;apply()}};
  try{await document.startViewTransition(applyOnce).finished}catch{applyOnce()}
  finally{delete root.dataset.themeSnapshot;style.remove();themeChanging=false}
}
