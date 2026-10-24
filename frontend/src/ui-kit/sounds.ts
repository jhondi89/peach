/* 界面音效: 按钮, 开关, 菜单, 弹层 y 操作回执各配uno声ligero响. 

   声音Todo由 Web Audio 当场合成, No带音频Archivo, 也Nomásuno网络Por favor求. 配方取自
   dannyjpwilliams/ui-sound-design-skill  `references/sound-recipes.md`(MIT): 
   点击es带通滤过噪声, 开关esuno段正弦扫频, Éxitoes升unograndetres度, 出错es压暗abajo行
   锯齿波, Advertenciaesen proceso频两abajocorto脉冲, 菜单es滤波噪声扫过, 弹层esuno记音alto骤降正弦. 
   Volumen按esteBiblioteca口径调到
   配方给abajo限附近: 它们uno天dentro要响几cien次, Solo能es陪衬. 

   Todo站Solo开uno AudioContext, 而且要etc.到No.uno声真要响时才建: Explorar dispositivoEn用户手势之anterior
   No让出声, página面uno进来就建会被挂起, 还más占uno路系统音频. 开关Estado由 Application 
   `appSettings.uiSounds` 决定, 通过 `setUiSoundsEnabled` 灌进来; 关着时aquí连
   AudioContext 都No碰. 

   随主包发出, 由共享源码直continuar引用: 开关EstadoSolo能Conuno, Configuración面板Abrir
    y 菜单开合时响es同uno.  */

type Recipe = (ctx: AudioContext, now: number) => void;

let audioContext:AudioContext|null=null;
let enabled=false;

/* 单例: `exponentialRampToValueAtTime` No能落到 0, 收尾uno律 0.001, 听No见pero合法. 
   每配方开头读uno次 `currentTime`, 之posteriorTodo从它推—en proceso途再读, 节点就排到过去.  */
function context(){
  const Context=globalThis.AudioContext||(globalThis as typeof globalThis & {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
  if(!Context)return null;
  if(!audioContext)audioContext=new Context();
  /* Sin用户手势时 resume 会被拒: eseuno声本来就No该响, 吞掉即puede, 别En控制DejaunonoProcesar拒绝.  */
  if(audioContext.state==='suspended')audioContext.resume()?.catch?.(()=>{});
  return audioContext;
}

interface ToneOptions {
  type?: OscillatorType; from: number; to?: number; duration: number; volume: number; attack?: number; start?: number;
  filter?: {type: BiquadFilterType; frequency: number; Q?: number} | null;
}
function tone(ctx:AudioContext,now:number,{type='sine',from,to=from,duration,volume,attack=0,start=0,filter=null}:ToneOptions){
  const at=now+start;
  const osc=ctx.createOscillator();
  const gain=ctx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(from,at);
  if(to!==from)osc.frequency.exponentialRampToValueAtTime(to,at+duration);
  if(attack){
    gain.gain.setValueAtTime(0.001,at);
    gain.gain.exponentialRampToValueAtTime(volume,at+attack);
  }else gain.gain.setValueAtTime(volume,at);
  gain.gain.exponentialRampToValueAtTime(0.001,at+duration);
  let tail:AudioNode=osc;
  if(filter){
    const shape=ctx.createBiquadFilter();
    shape.type=filter.type;
    shape.frequency.value=filter.frequency;
    shape.Q.value=filter.Q??1;
    osc.connect(shape);tail=shape;
  }
  tail.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at+duration+0.01);
}

interface NoiseOptions {
  duration: number; volume: number; filter: {frequency: number; Q: number}; sweepTo?: number | null; attack?: number;
}
/* 噪声源esuno次性: 每响uno声造uno段Nuevo缓冲, 放完Completo链拆掉. 振荡Dispositivo stop 之posterior会
   自己Desconectar, BufferSource No会, 滤波Dispositivo y 增益节点就uno直挂EnImagenarriba.  */
function noise(ctx:AudioContext,now:number,{duration,volume,filter,sweepTo=null,attack=0}:NoiseOptions){
  const length=Math.max(1,Math.round(ctx.sampleRate*duration));
  const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=Math.random()*2-1;
  const source=ctx.createBufferSource();
  source.buffer=buffer;
  const shape=ctx.createBiquadFilter();
  shape.type='bandpass';
  shape.Q.value=filter.Q;
  shape.frequency.setValueAtTime(filter.frequency,now);
  if(sweepTo)shape.frequency.exponentialRampToValueAtTime(sweepTo,now+duration);
  const gain=ctx.createGain();
  if(attack){
    gain.gain.setValueAtTime(0.001,now);
    gain.gain.exponentialRampToValueAtTime(volume,now+attack);
  }else gain.gain.setValueAtTime(volume,now);
  gain.gain.exponentialRampToValueAtTime(0.001,now+duration);
  source.connect(shape);
  shape.connect(gain);
  gain.connect(ctx.destination);
  source.onended=()=>{source.disconnect();shape.disconnect();gain.disconnect()};
  source.start(now);
}

/** 名字对应界面en launo类动作, No对应某Controles; 同uno类动作En哪unopágina都es同uno声.  */
const RECIPES:Record<string,Recipe>={
  /* 软点击: 配方 Soft click 变体, 再往bajo压uno档Volumen.  */
  click:(ctx,now)=>noise(ctx,now,{duration:0.06,volume:0.12,filter:{frequency:1200,Q:1}}),
  /* 开关: 升es开, 降es关, 配方 Minimal toggle 变体, 两头Volumenuno致.  */
  'toggle-on':(ctx,now)=>tone(ctx,now,{from:550,to:650,duration:0.08,volume:0.15}),
  'toggle-off':(ctx,now)=>tone(ctx,now,{from:650,to:550,duration:0.08,volume:0.15}),
  /* Éxito: C5 起升unograndetres度, 两音之间Deja 80ms.  */
  success:(ctx,now)=>{
    tone(ctx,now,{from:523,duration:0.12,volume:0.18});
    tone(ctx,now,{from:523*1.25,duration:0.12,volume:0.18,start:0.2});
  },
  /* Advertencia: en proceso频tres角波两abajocorto脉冲, 说es"Deja意unoabajo", No带出错ese负面.  */
  warning:(ctx,now)=>{
    tone(ctx,now,{type:'triangle',from:600,duration:0.08,volume:0.15});
    tone(ctx,now,{type:'triangle',from:600,duration:0.08,volume:0.15,start:0.16});
  },
  /* 出错: 锯齿波经bajo通压暗posteriorabajo行, 配方PredeterminadoParámetro按Volumenabajo限取.  */
  error:(ctx,now)=>tone(ctx,now,{type:'sawtooth',from:400,to:200,duration:0.25,volume:0.15,
    filter:{type:'lowpass',frequency:1500,Q:1}}),
  /* 菜单y面板进场: 配方 Quick swipe 变体.  */
  whoosh:(ctx,now)=>noise(ctx,now,{duration:0.12,volume:0.08,attack:0.036,
    filter:{frequency:1000,Q:1},sweepTo:6000}),
  /* 弹层进场: 配方 Light tap 变体.  */
  pop:(ctx,now)=>tone(ctx,now,{from:1500,to:500,duration:0.04,volume:0.15}),
};

export const UI_SOUNDS=Object.freeze(Object.keys(RECIPES));

export function setUiSoundsEnabled(on:unknown):void{enabled=on===true}
export function uiSoundsEnabled():boolean{return enabled}

/** 响uno声; 关着, Explorar dispositivoSin Web Audio 时什么都No做y返回 false. Sineste音效就抛错.  */
export function playUiSound(name:string):boolean{
  const recipe=RECIPES[name];
  if(!recipe)throw new Error(`Sin"${name}"esteSonidos de interfaz`);
  if(!enabled)return false;
  const ctx=context();
  if(!ctx)return false;
  recipe(ctx,ctx.currentTime);
  return true;
}

/* 会响Controles按角色认, No按类名: React 子树按钮 y antiguo壳按钮largo得Nouno样, pero都es
   `button`. 开关走 change 而Noes click: uno次点击Solo该响uno声, 而且响es开还es关要ver
   点完Estado. 禁用en proceso(`disabled`, `aria-disabled`)No响—它Sin发生任何事.  */
const CLICKABLE='button,[role="button"],[role="tab"],[role="menuitem"],[role="menuitemradio"],'
  +'[role="menuitemcheckbox"],[role="option"],summary,a[href]';
const SWITCH='input[type="checkbox"][role="switch"]';

function inert(control:Element){
  return (control as HTMLButtonElement).disabled===true||control.getAttribute('aria-disabled')==='true';
}

/** 挂到 document arriba: 用捕obtener阶段, 哪página面En自己ese层 stopPropagation 都拦No住esteuno声.  */
const soundRoots=new WeakSet<Document|Element>();
export function wireUiSounds(root:Document|Element=document):void{
  if(soundRoots.has(root))return;
  soundRoots.add(root);
  root.addEventListener('click',event=>{
    const control=(event.target as Element|null)?.closest?.(CLICKABLE);
    if(!control||inert(control))return;
    playUiSound('click');
  },{capture:true});
  root.addEventListener('change',event=>{
    const control=event.target as HTMLInputElement|null;
    if(!control?.matches?.(SWITCH)||inert(control))return;
    playUiSound(control.checked?'toggle-on':'toggle-off');
  },{capture:true});
}
