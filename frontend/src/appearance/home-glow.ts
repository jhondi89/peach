/* exterior观配色纯Datos层: 光晕Parámetro, 预设, 命名色板, 强调色清单y存量Normalizar化. 
 * 当anteriorConfiguracióny目标元素由 glow.ts, settings.ts 递进来, paintHomeGlow Solo写目标元素. 
 * @peach/appearance 直continuar解析到共享源码, 主界面SoloPublicaruno预设表 y Normalizar化实现. 
 * glowNumber y number-setting.ts  boundedPreference 都要求Completo数落En区间interior, 否则取Predeterminado值. 
 * 光晕写En局部元素, 避免拖动时触发Completo棵Documentación样pesado算; 实测Registro见 web/css/01-base.css.  */

export interface GlowSpot { color: string; alpha: number }
/** uno光晕Configuración.  */
export interface HomeGlow {
  on: boolean; preset: string; strength: number; noise: number; speed: number; soften: number; size: number;
  spot1: GlowSpot; spot2: GlowSpot; spot3: GlowSpot;
}
type SpotKey = 'spot1' | 'spot2' | 'spot3';
type GlowPalette = Pick<HomeGlow, SpotKey>;
type GlowField = 'strength' | 'noise' | 'speed' | 'soften' | 'size';

/* uno档配色就estres光晕ColoryNo透明度; 开关, 强度 y 粒No属于配色, 换档时No动. 
   椭圆medio轴 y 收边UbicaciónNoEnaquí, SoloCon web/css/01-base.css uno, 用户No调, 也No存; 圆心
   根本No存En—tres光晕由 glowdrift ese两动画uno直推着走, esees侧栏玻璃自带漂移. 
   este形状借自 feralui.dev/gradients  JSON Exportar(登记En docs/HANDOFF.md), Solo借Parámetro
   模型, 渲染仍esesetres层纯 CSS 径向渐变, No引入 Canvas. 
   tres光晕各自向 transparent 收边, 落En侧栏ese玻璃arriba, 所以每uno都得自己亮得起来: 
   压暗eseColorEnprofundo色侧栏arribaetc.于Sin, Ensuperficial色侧栏arribaesuno团脏. 
   `ash` esPredeterminadoeseuno档,  y  :root en laPredeterminado值uno字No差. 
   每uno档还带uno搭配强调色: 换配色es换Completo套exterior观, 按钮, 焦点环 y 链continuar跟着走才esuno副面. 
   单点强调色puede以它覆盖掉, eseunoabajoSolo改强调色, No动光晕.  */
const HOME_GLOW_SPOTS:readonly SpotKey[]=['spot1','spot2','spot3'];
const GLOW_SPOT_LABELS:readonly string[]=['Resplandor 1','Resplandor 2','Resplandor 3'];
/* "玻璃Original色"es每玻璃自带ese两团反光, Color由明暗Tema给: profundo色近白, superficial色uno蓝uno灰. 
   它No走光晕eseuno层—两团, 各自尺寸y轨迹TodoEn board.css  `--glass-drift-a/b` dentro, 
   照着tres光晕pesado画uno遍Solo会得到uno形状No同仿制品. 选en procesoesteuno档时光晕Completo层强度算成 0, 
   同时No往根arriba写 `--glass-tint-*`, 每玻璃于es退回自己eseuno档Tema色. 
   Deja着estetresColores模型en laIntroduce充, 让"tres光晕"En任何uno档abajo都取得到合法值; esteuno档
   界面No显示它们.  */
const GLASS_NATIVE_PRESET='native';
/* Predeterminadoeseuno档排En最anterior: 灰雾配蓝. 灰es最No挑Tema光晕, 蓝es BoardUI 自己强调色, 
   两者uno起就eseste壳没被改过时样子; 暖色ese几档Deja给人自己挑.  */
/** `[Clave, 名称, tres光晕, 搭配强调色]`.  */
const HOME_GLOW_PRESETS:readonly (readonly [key:string,label:string,palette:GlowPalette,accent:string])[]=[
  ['ash','Gris niebla',{
    spot1:{color:'#8f98a4',alpha:52},spot2:{color:'#b6bcc4',alpha:38},spot3:{color:'#6f7783',alpha:50}},'blue'],
  ['amber','Sala cálida',{
    spot1:{color:'#e08a2f',alpha:62},spot2:{color:'#c4544a',alpha:52},spot3:{color:'#a86a52',alpha:52}},'amber'],
  ['plum','Sakura nocturno',{
    spot1:{color:'#b455a0',alpha:64},spot2:{color:'#6a4fd0',alpha:54},spot3:{color:'#7a4f96',alpha:56}},'violet'],
  ['pine','Verde selva',{
    spot1:{color:'#3f9e57',alpha:66},spot2:{color:'#7fae4a',alpha:48},spot3:{color:'#4f9463',alpha:56}},'emerald'],
  /* abajo面diezdos档照 feralui.dev/gradients 预设区esediezdos chip 取色, 逐档记En
     docs/reference-snapshots/feralui-gradients-measured.md. 它每档cuatro色标, No.unouno律es
     铺满画布底色(diezuno档near-white, Midnight bloom ese档es近黑), Peach Sin底色层—
     tres光晕各自向 transparent 收边, 身posterior就espágina面自己面, eseuno搬过来Enprofundo色侧栏arriba
     etc.于Sin, Ensuperficial色侧栏arribaesuno团脏. 所以取esNo.dos, tres, cuatro, 也就es它真正当光斑用
     esetres. No透明度No跟着走: eseeseste玻璃自己浓淡, Unificado用Predeterminado档eseuno组. 
     档名en proceso文自拟, 按Color取, No照抄英文名.  */
  ['iris','Cristal aurora',{
    spot1:{color:'#1e50a2',alpha:62},spot2:{color:'#f09199',alpha:52},spot3:{color:'#895b8a',alpha:52}},'indigo'],
  ['opal','Ópalo',{
    spot1:{color:'#9be0e8',alpha:62},spot2:{color:'#c4b5f7',alpha:52},spot3:{color:'#f8b8d9',alpha:52}},'sky'],
  ['lagoon','Azul laguna',{
    spot1:{color:'#5ce3e6',alpha:62},spot2:{color:'#0f9cc2',alpha:52},spot3:{color:'#274a78',alpha:52}},'teal'],
  ['jade','Jade',{
    spot1:{color:'#8fe3b0',alpha:62},spot2:{color:'#22c79a',alpha:52},spot3:{color:'#0b5f51',alpha:52}},'emerald'],
  ['flare','Destello',{
    spot1:{color:'#ffc24b',alpha:62},spot2:{color:'#f4664d',alpha:52},spot3:{color:'#8a2e5e',alpha:52}},'orange'],
  ['orchid','Púrpura orquídea',{
    spot1:{color:'#e794c9',alpha:62},spot2:{color:'#9678ce',alpha:52},spot3:{color:'#4a3894',alpha:52}},'violet'],
  ['peach','Rosa melocotón',{
    spot1:{color:'#ffc9a3',alpha:62},spot2:{color:'#f08a8c',alpha:52},spot3:{color:'#b65e8c',alpha:52}},'rose'],
  ['tide','Azul eléctrico',{
    spot1:{color:'#6fd8f2',alpha:62},spot2:{color:'#4c5be0',alpha:52},spot3:{color:'#2a2450',alpha:52}},'blue'],
  ['sunset','Ocaso',{
    spot1:{color:'#ffae3f',alpha:62},spot2:{color:'#f0574d',alpha:52},spot3:{color:'#5d2a66',alpha:52}},'amber'],
  ['mint','Menta hielo',{
    spot1:{color:'#a8f0dc',alpha:62},spot2:{color:'#52cbb0',alpha:52},spot3:{color:'#147a5f',alpha:52}},'emerald'],
  ['bloom','Noche profunda',{
    spot1:{color:'#4c3894',alpha:62},spot2:{color:'#b387e8',alpha:52},spot3:{color:'#f6c6e2',alpha:52}},'fuchsia'],
  ['rosegold','Oro rosa',{
    spot1:{color:'#fbc9ac',alpha:62},spot2:{color:'#e79ba7',alpha:52},spot3:{color:'#8e5a74',alpha:52}},'rose'],
  [GLASS_NATIVE_PRESET,'Vidrio original',{
    spot1:{color:'#6686b8',alpha:52},spot2:{color:'#8f98a4',alpha:44},spot3:{color:'#6686b8',alpha:52}},'blue'],
];
/** "玻璃Original色"eseuno档: Sintres光晕, 面arriba漂es每玻璃自带两团反光.  */
const isNativeGlass=(key:string):boolean=>key===GLASS_NATIVE_PRESET;
/* 手调过Color之posterior当anterior档就No再es任何uno预设, 侧栏eseuno格 y 面板顶en la标识要如实说este件事, 
   No能Continuar顶着Anterior档名字.  */
const HOME_GLOW_CHOICES:readonly (readonly [key:string,label:string])[]=[...HOME_GLOW_PRESETS.map(([key,label])=>[key,label] as const),['custom','Personalizado']];
const glowPresetName=(key:string):string=>(HOME_GLOW_CHOICES.find(([name])=>name===key)||HOME_GLOW_CHOICES[0]!)[1];
/** uno档预设tres光晕(profundo拷贝); 认No出Clave给Predeterminadoeseuno档.  */
const glowPalette=(key:string):GlowPalette=>structuredClone((HOME_GLOW_PRESETS.find(([name])=>name===key)||HOME_GLOW_PRESETS[0]!)[2]);
/* 强调色es按钮, 焦点环, 链continuar y Datoseseuno档色, 走 BoardUI  accent 机制: diezuno级色阶Completo组
   换掉, 组件本身uno字No改(`frontend/src/react/boardui/styles/theme.css`  accent 段). 
   aquíSolo存档名, diezuno级实际值En `web/board.css` dentro按 `:root[data-accent=...]` uno档uno; 
   色阶抄进 JS 会得到两必然走偏色板, 而圆球本身正es拿同uno组变量画. 
   diezdos档es Tailwind v4 色板dentro绕色轮uno圈取diezdos色相, seis列两行正bien铺满; en proceso性色No收, 
   灰链continuar y 灰焦点环Eneste套界面arriba读No出es"puede点东西".  */
/** `[Clave, 名称]`, diezdos档强调色.  */
const ACCENTS:readonly (readonly [key:string,label:string])[]=[['red','Rojo'],['orange','Naranja'],['amber','Ámbar'],['lime','Verde lima'],['emerald','Verde esmeralda brillante'],['teal','Verde cian'],
  ['sky','Azul cielo'],['blue','Azul'],['indigo','Azul índigo'],['violet','Violeta'],['fuchsia','Magenta'],['rose','Rojo rosa']];
const DEFAULT_ACCENT:string='blue';
const normalizeAccent=(value:unknown):string=>ACCENTS.some(([key])=>key===value)?value as string:DEFAULT_ACCENT;
/** uno档预设搭配强调色.  */
const glowAccent=(key:string):string=>(HOME_GLOW_PRESETS.find(([name])=>name===key)||[])[3]||DEFAULT_ACCENT;
/* 挑Colorese色板. 名字按Color本身取, No按它被用En哪儿—同unoColor换到另uno光晕arriba
   还es同uno名字. 每uno档预设用到ColorTodo落Eneste表dentro, 所以从侧栏选完预设再AbrirColor
   弹层, 选en proceso环指得出当anterioreseuno格; 表dentro缺哪uno, eseuno就永远es"没选en proceso". 
   anteriorsiete色系每系seis档明度打底, 其余es各档预设带进来Color, 按色相归进对应色系, 所以
   各系No再uno样largo. 青绿自成uno系: feralui ese几档水色预设主色都落Enesteuno段, 它Enprofundo色玻璃
   arriba确实偏冷, peroeseesunopuede以挑冷, NoesNo能出现Color.  */
/** `[色系, 名称]`, No.uno项es"Todo".  */
const GLOW_SWATCH_FAMILIES:readonly (readonly [key:string,label:string])[]=[['all','Todo'],['gray','Gris'],['red','Rojo'],['yellow','Amarillo'],
  ['green','Verde'],['cyan','Cian'],['blue','Azul'],['purple','Púrpura'],['brown','Marrón']];
/** `[色系, 名称, #rrggbb]`.  */
const GLOW_SWATCHES:readonly (readonly [family:string,name:string,hex:string])[]=[
  ['gray','Gris nube','#d8dade'],['gray','Gris niebla','#b6bcc4'],['gray','Gris cal','#8f98a4'],
  ['gray','Gris hierro','#6f7783'],['gray','Gris tinta','#4a4e56'],['gray','Gris oscuro','#2e3138'],
  ['red','Rojo sakura','#f08a8a'],['red','Coral','#e26a62'],['red','Rojo ladrillo','#c4544a'],
  ['red','Rojo bermellón','#b5322f'],['red','Vino tinto','#8e2a2c'],['red','Rojo oscuro','#6b2224'],
  ['yellow','Amarillo trigo','#f2d48a'],['yellow','Ámbar','#e8b451'],['yellow','Filamento de tungsteno','#e08a2f'],
  ['yellow','Amarillo dorado','#cf8a20'],['yellow','Amarillo jengibre','#a9701c'],['yellow','Amarillo castaño','#7d5216'],
  ['green','Verde brote','#a9cf7e'],['green','Verde hoja','#7fae4a'],['green','Verde hierba','#5da34f'],
  ['green','Verde bosque','#3f9e57'],['green','Verde musgo','#4f9463'],['green','Verde tinta','#27563a'],
  ['blue','Azul cielo','#9fc2e8'],['blue','Azul lago','#6a9fd8'],['blue','Azul índigo','#4478c0'],
  ['blue','Azul zafiro','#2f5ba3'],['blue','Azul marino','#27467c'],['blue','Azul nocturno','#1c3358'],
  ['purple','Lila','#c3a7e0'],['purple','Magenta','#b455a0'],['purple','Lavanda','#a67fd2'],
  ['purple','Uva','#6a4fd0'],['purple','Violeta berenjena','#7a4f96'],['purple','Púrpura oscuro','#432c6d'],
  ['brown','Marrón arena','#d6b492'],['brown','Marrón terracota','#bd8f68'],['brown','Siena','#a86a52'],
  ['brown','Marrón castaño','#8c5340'],['brown','Marrón pardo','#6d3f31'],['brown','Marrón oscuro','#4e2d23'],
  ['red','Rojo aurora','#f09199'],['red','Rosa loto','#f8b8d9'],['red','Rojo fuego','#f4664d'],
  ['red','Rosa melocotón intenso','#f08a8c'],['red','Rojo atardecer','#f0574d'],['red','Rosa sakura','#f6c6e2'],
  ['red','Rosa','#e79ba7'],
  ['yellow','Amarillo sol','#ffc24b'],['yellow','Naranja mandarina','#ffae3f'],
  ['green','Verde jade','#8fe3b0'],['green','Verde esmeralda brillante','#22c79a'],['green','Jade oscuro','#0b5f51'],
  ['green','Verde pino','#147a5f'],
  ['cyan','Cian claro','#9be0e8'],['cyan','Aguamarina','#5ce3e6'],['cyan','Verde pavo real','#0f9cc2'],
  ['cyan','Azul hielo','#6fd8f2'],['cyan','Menta','#a8f0dc'],['cyan','Verde esmeralda','#52cbb0'],
  ['blue','Azul cristal','#1e50a2'],['blue','Azul índigo','#274a78'],['blue','Azul eléctrico','#4c5be0'],
  ['purple','Púrpura antiguo','#895b8a'],['purple','Glicinia','#c4b5f7'],['purple','Púrpura ciruela','#8a2e5e'],
  ['purple','Rosa orquídea','#e794c9'],['purple','Púrpura orquídea','#9678ce'],['purple','Índigo','#4a3894'],
  ['purple','Púrpura baya','#b65e8c'],['purple','Púrpura tinta','#2a2450'],['purple','Púrpura crepúsculo','#5d2a66'],
  ['purple','Violeta nocturno','#4c3894'],['purple','Lila','#b387e8'],['purple','Púrpura rosa','#8e5a74'],
  ['brown','Naranja albaricoque','#ffc9a3'],['brown','Albaricoque claro','#fbc9ac'],
  /* esteunoes玻璃自带ese团蓝色反光Ensuperficial色TemaabajoColor, 另uno团esarriba面灰系石灰. "玻璃Original色"
     eseuno档界面No显示Color, pero它En模型dentro仍Contres合法色, 同uno"预设用到Color都En表dentro"
     因此也要对它成立.  */
  ['blue','Azul cielo despejado','#6686b8'],
];
const glowNumber=(value:number,min:number,max:number,fallback:number):number=>Number.isInteger(value)&&value>=min&&value<=max?value:fallback;
/** 合法 `#rrggbb` 转成pequeño写Original样返回, 否则给 `fallback`.  */
const glowColor=(value:unknown,fallback:string):string=>/^#[0-9a-f]{6}$/i.test(String(value))?String(value).toLowerCase():fallback;
const glowRgba=(hex:string,alpha:number)=>`rgba(${[1,3,5].map(at=>parseInt(hex.slice(at,at+2),16)).join(',')},${(alpha/100).toFixed(2)})`;
/* Velocidad度, 柔化 y Tamaño都存成 0–100 eseuno档Completo数, 换算成 CSS 要倍率En paintHomeGlow dentro
   uno次算完: 存倍率话, "Predeterminado"EnDatosdentro就es 1, En界面arriba却要显示成en proceso间eseuno格, 两边迟早
   会各按各理解走. Velocidad度es例exterior, 它en procesoes 100, arriba限 300—eseuno档拉满estres倍rápido, 
   而 0 就es停住.  */
const GLOW_RANGES:Record<GlowField,[min:number,max:number,fallback:number]>={strength:[0,100,100],noise:[0,100,0],speed:[0,300,100],soften:[0,100,50],size:[0,100,50]};
const DEFAULT_HOME_GLOW:HomeGlow={on:true,preset:'ash',strength:100,noise:0,speed:100,soften:50,size:50,
  ...glowPalette('ash')};
/* 光晕ParámetroCompleto来自 localStorage, 形态 y Rango都Nopuede信: Color写成任意字符串会让eseuno层
   渐变CompletoInválido, cien分比越界会光晕糊成unoCompleto片或者缩没. 逐项carpeta回区间, 认No出就退回
   Predeterminadoeseuno档, 而NoesCompleto丢掉—uno坏掉数No该用户调bien其余几档uno起清空. 
   SoloConuno情形要连Coloruno起换掉: 存着档名ya经NoEn清单dentro. eseDescripciónesteuno档被清退, 
   DejaEn旁边tresColor正es被清退eseuno版, 按坏值逐项carpeta回去Solo会它Original样DejaEnpágina面arriba. 
   自定义NoEn此列—esetresColores用户自己挑, 档名认得出来, 照样Deja着. 
   ya经No存EnClaveNo必单独Limpiar: aquíSolo按当anterior模型逐项取值, pesado建出来对象dentroSin它们. 
   antiguoVersiónese套横躺Enprimeropágina顶部圆心ymedio轴就eseste么掉—几何现EnSolo由 CSS 给, 存过ese
   要es跟着carpeta回来, 老用户ver到还esmedio截光.  */
/** 读回存量时Normalizar化; 给 null 得到出厂eseuno套.  */
function normalizeHomeGlow(raw:unknown):HomeGlow{
  const stored:any=raw&&typeof raw==='object'?raw:{};
  const known=HOME_GLOW_CHOICES.some(([key])=>key===stored.preset);
  const preset:string=known?stored.preset:'ash';
  const seed=glowPalette(preset==='custom'?'ash':preset);
  const glow={on:stored.on!==false,preset} as HomeGlow;
  for(const [field,[min,max,fallback]] of Object.entries(GLOW_RANGES) as [GlowField,[number,number,number]][])
    glow[field]=glowNumber(+stored[field],min,max,fallback);
  for(const key of HOME_GLOW_SPOTS){
    const spot=known&&stored[key]&&typeof stored[key]==='object'?stored[key]:{},fallback=seed[key];
    glow[key]={color:glowColor(spot.color,fallback.color),
      alpha:glowNumber(+spot.alpha,0,100,fallback.alpha)};
  }
  return glow;
}
/* 预设圆球eseuno圈: 几Color就etc.分成几段. 写成函数es因Como自定义档Color数 y 预设uno样más, 
   却要En弹层dentro现算uno遍.  */
const glowChipFill=(colors:readonly string[]):string=>`conic-gradient(from -90deg,${colors.map((color,index)=>
  `${color} ${(index*100/colors.length).toFixed(3)}% ${((index+1)*100/colors.length).toFixed(3)}%`).join(',')})`;
/* Solo写值, 光晕怎么画DejaEn web/css/01-base.css uno. 关掉 y "玻璃Original色"eseuno档都让强度y
   粒归cero, `.glowlayer::before` No透明度按ese句乘法算成 0, No另设uno"关"分支—
   否则"关着""玻璃Original色" y "强度 0"会estres各自演化Ruta. 

   写之anterior先 y Anterior次写进este元素值比uno遍. 拖任意uno拉时变SoloConuno变量; No比就es
   每uno步nueve都pesado设uno遍, en proceso间eseocho次Todoes白写. 
   记账按元素分开存, más壳各画各eseuno层时No会互相对方值判成"ya经写过". 

   tres几何ParámetroEnaquí换算成倍率: 柔化 0–100 落En 0.7–1.3, 收边Ubicación按它Zoom; Tamaño同理
   落En 0.5–1.5, 椭圆两根medio轴同乘. Velocidad度esDuración倒数—拉en la 100 esOriginalVelocidad, 所以倍率写成
   `100/speed`; 拉到 0 Sin倒数puede言, eseuno档直continuar漂移ese两动画Pausar, 淡入eseunoNo跟着停, 
   否则Completo层会停En opacity 0 arriba, ver起来像光晕被关掉.  */
const glowWritten=new WeakMap<HTMLElement,Map<string,string>>();
/** 光晕eseuno层变量写到 `el` arriba(同值Nopesado写).  */
function paintHomeGlow(el:HTMLElement|null,glow:HomeGlow):void{
  if(!el)return;
  let written=glowWritten.get(el);
  if(!written){written=new Map();glowWritten.set(el,written)}
  const live=glow.on&&!isNativeGlass(glow.preset);
  const write=(name:string,value:string)=>{
    if(written.get(name)===value)return;
    written.set(name,value);el.style.setProperty(name,value);
  };
  write('--glow-strength',String(live?glow.strength/100:0));
  write('--glow-noise',String(live?glow.noise/100:0));
  write('--glow-soften',(0.7+glow.soften/100*0.6).toFixed(3));
  write('--glow-size',(0.5+glow.size/100).toFixed(3));
  write('--glow-drift-scale',glow.speed?(100/glow.speed).toFixed(3):'1');
  write('--glow-drift-play',glow.speed?'running':'paused');
  HOME_GLOW_SPOTS.forEach((key,index)=>{
    const spot=glow[key];
    write(`--glow-spot-${index+1}-color`,glowRgba(spot.color,spot.alpha));
  });
}

/* 玻璃面arribaese两团lento漂反光色相. 侧栏ese玻璃交给光晕层, 其余每uno(Buscar框, 顶栏Imagen标
   钮, Filtrar浮层, Configuración卡分区导航, 媒体Biblioteca弹层, 配色弹层, estrecho栏, Seleccionar工具)仍antiguo走
   `--glass-drift-a/b`, SoloesColorNo再写死: 两团分别取No.uno y No.dos光晕Color, 尺寸, 
   alpha 档 y ese李萨如轨迹uno概No动, 换SoloCon色相. 
   写es根元素, esteuno点 y 光晕eseuno层相反—ese几玻璃分散EnCompleto棵树arriba, Sin共同宿主. 
   代价也因此照付: 写uno次根就esCompleto棵树pesado算样. 所以aquíSoloEn点选配色, 换档, 开关 y 松开
   Velocidad度ese拉时被调用, 拖动过程en procesouno次都No写—拖动期间SoloCon侧栏eseuno层跟着动. 
   跟着走SoloCon漂移Velocidad度. 柔化 y TamañoNo跟: ese两团medio轴 y 收边es按各Controles自己尺寸量过, 
   unoBuscar框 y unoCompleto侧栏共用uno倍率, pequeñoese会先糊成unoCompleto片. 
   "玻璃Original色" y Completo项关掉走同uno路: 两色相变量摘掉, 每玻璃退回样表dentro自己eseuno档
   Tema色. 摘掉而Noes写回Tema色, es因ComoTema色Con两套, 跟着明暗Cambiar, 写回去eseuno套会En
   切Tema时僵EnOriginal地. Velocidad度No摘—Original色ese两团也En漂, 停No停由用户eseuno拉说算.  */
/** 其余玻璃面ese两团反光色相写到 `el`(根元素)arriba.  */
function paintGlassFaces(el:HTMLElement|null,glow:HomeGlow):void{
  if(!el)return;
  const native=!glow.on||isNativeGlass(glow.preset);
  el.toggleAttribute('data-glow-native',native);
  el.style.setProperty('--glow-drift-scale',glow.speed?(100/glow.speed).toFixed(3):'1');
  el.style.setProperty('--glow-drift-play',glow.speed?'running':'paused');
  if(native){el.style.removeProperty('--glass-tint-a');el.style.removeProperty('--glass-tint-b');return}
  el.style.setProperty('--glass-tint-a',glow.spot1.color);
  el.style.setProperty('--glass-tint-b',glow.spot2.color);
}

export {ACCENTS, DEFAULT_ACCENT, DEFAULT_HOME_GLOW, GLASS_NATIVE_PRESET, GLOW_SPOT_LABELS,
  GLOW_SWATCHES, GLOW_SWATCH_FAMILIES, HOME_GLOW_CHOICES, HOME_GLOW_PRESETS, HOME_GLOW_SPOTS,
  glowAccent, glowChipFill, glowColor, glowPalette, glowPresetName, isNativeGlass,
  normalizeAccent, normalizeHomeGlow, paintGlassFaces, paintHomeGlow};
