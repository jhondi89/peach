/* anterior端底层: DOM 取元素, Por favor求, 转义, Formato化y路由常量. 
 * Application y React página面直continuar引用共享源码, LOC, fmtDur etc.语义契约SoloConuno. 
 * 本层No引入其他anterior端模, 避免被所Con域引用基础层反向依赖. 
 * route() DejaEn应用导航域, 因Como它还要SincronizarTítuloy界面动作.  */
import { entityLinkId, registerEntityLink, registerResponseEntities } from './entity-links';
import { SOURCE_LABELS } from './media-sources';
import { requestErrorMessage } from './request-error';
import { iconGeometry } from './icon-geometry';
export { registerEntityLink, registerResponseEntities } from './entity-links';
export { requestErrorMessage } from './request-error';
const $=(s:string)=>document.querySelector(s);
/* 方形槽dentro塞No进 1.4:1 字形: 按ancho度对齐它就矮uno截, 挨着满格 Lucide
   Imagen标ver就espequeñouno号. este几exterior层 viewBox 跟着 symbol Relación走, 槽由 CSS 按alto定ancho.  */
/** 雪碧Imagen字形 SVG 片段; `cls` es挂En `<svg>` en la类(如 `ui-externalmark`).  */
const icon=(name:string,cls='')=>{
  const {wide,viewBox}=iconGeometry(name),classes=[wide?'iconwide':'',cls].filter(Boolean).join(' ');
  return `<svg${classes?` class="${classes}"`:''} viewBox="${viewBox}" aria-hidden="true"><use href="#i-${name}"/></svg>`};
/* `signal` 写成显uno项, No靠 Object.assign 顺带透传: 表面Cambiar要能作废Anterior屏
   还没读完Por favor求, "estePor favor求puede被Cancelar"得EnFirmaarribaver得见.  */
/** 遗Deja层取数入口: JSON Por favor求体, Fallo抛带人话Original因 Error.  */
const api=async(p:string,o?:RequestInit):Promise<unknown>=>{
  if(!o?.method||o.method==='GET'){
    const library=sessionStorage.getItem('peach.library');
    if(library&&/^\/api\/(items|facets)(\?|$)/.test(p))p+=(p.includes('?')?'&':'?')+'library='+encodeURIComponent(library);
  }
  const {signal=null,...rest}=o||{};
  const init:RequestInit={headers:{'Content-Type':'application/json'},...rest};
  if(signal)init.signal=signal;
  let response:Response;
  try{response=await fetch(p,init)}catch(error:any){if(error?.name==='AbortError')throw error;throw new Error(requestErrorMessage(error),{cause:error})}
  let payload:any=null;
  try{payload=await response.json()}catch{}
  if(!response.ok){
    const detail=payload&&(payload.message||payload.detail||payload.error);
    throw new Error(requestErrorMessage(detail,response.status));
  }
  registerResponseEntities(p,payload);
  return payload;
};
/* CancelarNoesFallo. abort Solopuede能来自表面Cambiar, 调用点本来就Conuno"ya过期"分支要走, 
   No该顺手弹uno"Por favor求Fallo"ErrorSugerencia.  */
const isAbort=(error:any):boolean=>error?.name==='AbortError';
/* Con界y发批量Por favor求. 串行发unomil次 POST es实测卡点(批量Etiqueta"yaver"要几分钟, 
   界面Todo程按住), 而uno次Todo发出去etc.于自己挤自己: Explorar dispositivo对同uno host SoloCon 6 
   HTTP/1.1 Conectar, más出来排En队dentro, 连同unoTiempo正常ExplorarPor favor求uno起etc.. 所以固定几
   工人按序取Tarea. 返回值顺序yIntroduciruno致; 某uno项FalloSolo记abajoOriginal因, Noen proceso断Completo批—
   批量操作dentrounoFalloNo该其余几cienuno起放弃.  */
const mapLimit=async<T,R>(items:Iterable<T>,limit:number,run:(item:T,index:number)=>Promise<R>)
  :Promise<({ok:true;value:R}|{ok:false;error:unknown})[]>=>{
  const list=[...items],results=new Array<{ok:true;value:R}|{ok:false;error:unknown}>(list.length);
  let next=0;
  const worker=async()=>{
    while(next<list.length){
      const index=next++;
      try{results[index]={ok:true,value:await run(list[index] as T,index)}}
      catch(error){results[index]={ok:false,error}}
    }
  };
  const workers=Math.min(Math.max(1,limit),list.length);
  await Promise.all(Array.from({length:workers},worker));
  return results;
};
const STATE_ROUTES:Record<string,string>={fresh:'/unseen',later:'/watch-later',flagged:'/flagged',ads:'/junk-files'};
const ROUTE_STATES:Record<string,string>=Object.fromEntries(Object.entries(STATE_ROUTES).map(([state,path])=>[path,state]));
const STATE_LABELS:Record<string,string>={fresh:'No visto',later:'Ver más tarde',flagged:'Marcado',ads:'Archivos basura'};
const isCatalogPath=(path:string)=>path==='/'||path==='/wall'||Object.prototype.hasOwnProperty.call(ROUTE_STATES,path);
const ENTITY_ROUTES:Record<string,string>={performer:'performers',studio:'studios',creator:'creators',series:'series',agency:'agencies',tag:'tags'};
const ROUTE_ENTITIES:Record<string,string>={performers:'performer',studios:'studio',creators:'creator',series:'series',agencies:'agency',tags:'tag'};
/** 实体资料página使用ya取得Estable身. 姓名地址由资料路由解析Como ID.  */
const entityPath=(kind:string,name:string,id?:number|null)=>{
  if(id)registerEntityLink(kind,name,id);
  const target=id||entityLinkId(kind,name);
  return `/${ENTITY_ROUTES[kind]||kind}/${target||encodeURIComponent(name)}`;
};
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as Record<string,string>)[c] as string);
/* exterior链arriba写es站点corto名: Agencia y 片商平时就被叫作 NAX, T-POWERS, DMM, 而DatosBibliotecaen la
   label esRecolectar时抄abajo来Todo称(`New Actor eXperience`, `DMM 检索`), 域名又要人先En
   `OFFICIAL.NAX-PRO.COM` dentro认出哪uno段es名字. 两样都比corto名难读, uno排链continuardentro尤其. 

   按Anfitrión名查表, último尾posterior缀也算(`official.nax-pro.com` 命en proceso `nax-pro.com`). 表dentroSin
   退回DatosBiblioteca label: este表覆盖常来常往ese些站, 剩abajolargo尾No值得逐登记, 而 label 至menos
   es人写过. DatosBibliotecaen la label No动—它esRecolectar证据, 显示es另uno件事.  */
const SITE_NAMES:[string,string][]=[['nax-pro.com','NAX'],['t-powers.co.jp','T-POWERS'],['dmm.co.jp','DMM'],
  ['mgstage.com','MGStage'],['av-event.jp','AV-EVENT'],['k-mib.com','K-MIB'],
  ['minnano-av.com','みんなのAV'],
  ['km-produce.com','KMP'],['mousouzoku-av.com','Fantasioso'],['mines-pro.jp','マインズ'],
  ['lightpro.jp','LIGHT'],['eltra.jp','ELTRA'],['linx.live','LINX'],['bambi.ne.jp','Bambi'],
  ['prestige-av.com','Prestige'],['cmore.jp','C-more'],['so-agent.jp','SO MODEL'],
  ['attractive-llc.net','Attractive'],['krone-web.jp','KRONE'],['actentertainment.jp','ACT'],
  ['crusegroup.net','Cruse'],['prime-recruit.com','Prime'],['life-promotion.com','Life'],
  ['8man.jp','Eightman'],['senzai.tv','Five'],['maxing.jp','MAXING'],['s1s1s1.com','S1'],
  ['ideapocket.com','Idea Pocket'],['faleno.jp','FALENO'],['capsule.bz','Capsule'],
  ['sod.co.jp','SOD'],['tokyo-hot.com','Tokyo-Hot'],['heyzo.com','HEYZO'],
  ['dogma.co.jp','DOGMA'],['naturalhigh.co.jp','Natural High'],['bangbros.com','BangBros'],
  ['dorcelclub.com','Dorcel']];
const bareHost=(host:unknown)=>String(host).replace(/^www\./,'').toLowerCase();
const linkHost=(url:unknown)=>{try{return bareHost(new URL(url as string).hostname)}catch{return ''}};
const siteName=(url:unknown)=>{
  const host=linkHost(url);
  return host&&SITE_NAMES.find(([domain])=>host===domain||host.endsWith('.'+domain))?.[1]||'';
};
/* 服务端Procesar过链continuarImagen标: 单色字形 favicon 会被做成"Fondo de color de marca + cuerpo blanco", 
   做No就OriginalImagen按 32 px 转出来. 放服务端Contres理由: 它要读别人站点Imagen, 要缓存, 
   而且este样Explorar dispositivoNo再直continuar向对方站点发Por favor求(也就No泄露En cursover谁资料página). 

   传es链continuar id 而Noes地址. 跟 `/follow-stream` 同uno规矩: 服务端Solo取DatosBibliotecadentroyaCon
   地址, 绝No去取anterior端递过来任意 URL—eseetc.于开uno任意地址抓取口子.  */
const linkMarkUrl=(link:{link_id?:number|null})=>`/link-mark?id=${encodeURIComponent(link.link_id ?? '')}`;
/* Recolectar来源 y 口味排行dentroese些站点圆标, 同uno规矩另uno入口: 递es服务端ya经
   知道Clave—Recolectar来源Clave, 或口味域名白名单en laeseposterior缀—Noes地址.  */
const siteMarkUrl=(params:{source:string}|{domain:string})=>`/site-mark?${new URLSearchParams(params)}`;
/* Imagen标BibliotecadentroCon常见社媒走interior联marcaEtiqueta, 连 favicon 都No取. 

   favicon es别人服务Dispositivoen launopequeñoImagen: X  y  Instagram 直continuar挡掉爬取, 资料páginaarribaSolo剩unoSolo
   地球; 取得到也máses 16×16, 放进 32 px 圆dentro必然糊. 站点自己给grandeImagen又es另uno坏
   法—Threads, TikTok 给es iOS 应用Imagen标ese圆角方Imagen, cuatro边uno圈alto光照着方角画, 裁成圆
   之posterior沿圆周露出uno道白, 而ese圈alto光es人家设计uno部分, `/link-mark` 抠No掉. interior联 SVG
   两样都Sin, 还省uno次跨站Por favor求, 场色esmarca自己ese, No跟着Tema走. 
   名单按Imagen标Biblioteca覆盖面定, No按链continuar数: Phosphor Conestesiete家字形, uno家uno配齐; Bibliotecadentro
   Sin(livedoor, ameblo, lit.link, pub.linx.live este类)Continuar走 `/link-mark`, ese边按
   站点自己Imagen标合成Color de marca圆底.  */
const BRAND_ICONS:[string[],string][]=[[['x.com','twitter.com'],'brand-x'],[['instagram.com'],'brand-instagram'],
  [['threads.com','threads.net'],'brand-threads'],[['tiktok.com'],'brand-tiktok'],
  [['youtube.com','youtu.be'],'brand-youtube'],[['facebook.com','fb.com'],'brand-facebook'],
  [['linktr.ee','linktree.com'],'brand-linktree']];
const brandIcon=(url:unknown)=>{
  const host=linkHost(url);
  return host&&BRAND_ICONS.find(([hosts])=>hosts.some(d=>host===d||host.endsWith('.'+d)))?.[1]||'';
};
/** 名字比对用折叠: NFKC, 去primero尾空白, pequeño写.  */
const foldName=(s:unknown)=>String(s??'').normalize('NFKC').trim().toLocaleLowerCase();
/* 官网链continuararribaese行字. 写站点corto名(`siteName`), 表dentroSin就用DatosBiblioteca label. 

   Sellopágina y Agenciapáginaarriba指回自家站写"Sitio web oficial": página头ya经es公司名, 链continuar再写uno遍 S1, 
   LIGHT SoloesRepetir. 人物página照antiguo写名字, eseen la名字说es她归哪uno家, 正es要verInformación. 名字es
   别家(Jackson páginaarriba链到 Prestige 名录página)也保Deja, ese说es另uno家. 自家判据es
   corto名或 label yNormalizar名, 别名互相Contiene: `C-more` 之于 `C-more Entertainment`, corto名es缩写
   时ver label(`NAX` ese label es `New Actor eXperience`). label Soloeseste链continuar自己
   Anfitrión名(`www.ran-maru.com`)etc.于没起名, 也算自家. 

   存档rápido照(`web.archive.org`)uno律照写 label: 公司关门posterior官网Solo剩esteuno, label dentro写着
   它es哪uno年存档, 改写成"Sitio web oficial"就读No出点过去ver到esantiguopágina面.  */
const ARCHIVE_HOSTS=['web.archive.org'];
const isArchiveLink=(url:unknown)=>ARCHIVE_HOSTS.includes(linkHost(url));
const officialLinkText=(link:{url?:string;label?:string},kind:string,names:readonly string[]=[])=>{
  const text=siteName(link.url)||link.label||'';
  if((kind!=='studio'&&kind!=='agency')||isArchiveLink(link.url))return text;
  const said=[text,link.label].map(foldName).filter(Boolean);
  const own=!said.length||said.includes('Sitio oficial')||said.some(shown=>
    bareHost(shown)===linkHost(link.url)||names.some(name=>{
      const folded=foldName(name);
      return Boolean(folded)&&(folded.includes(shown)||shown.includes(folded));
    }));
  return own?'Sitio oficial':text;
};
/* 什么才算uno真Duración—SoloConesteuno处说算. 

   DatosBibliotecadentro `-1` es probe "Fallo grave"哨兵(见 scripts/probe.py: 抽帧 duration>2 门槛
   会让FalloEntrada永远卡住, 所以Fallo grave写成 -1), 它NoesDuración. 而 `!s` este真值判断挡No住
   负数: `fmtDur(-1)` 会算出 `0:-1`, 喂进ReproducirDispositivo更糟—Video.js  duration() setter dentro写着
   `parseFloat(e)<0 ? Infinity : e`, 随posterior `=== Infinity` 就 `addClass("vjs-live")`, 
   于esuno部本地影片被标成"En vivo", TotalDuración显示 NaN. 

   所以判据es"Limitado y mayor que cero", Noes"No vacío".  */
const realDuration=(value:unknown)=>{const n=Number(value);return Number.isFinite(n)&&n>0?n:0};
/** 秒数Formato化成 `h:mm:ss`/`m:ss`, 48 pequeño时起写成 `N 天 N pequeño时`; `0`, 负数y非Limitado值都es `—`
 *  (probe Fallo grave哨兵).  */
const fmtDur:(seconds:number|null|undefined)=>string=(s:any)=>{s=realDuration(s);if(!s)return'—';s=Math.round(s);
  if(s>=48*3600){const d=Math.floor(s/86400),hours=Math.floor((s%86400)/3600);return hours?`${d} día(s) ${hours} hora(s)`:`${d} día(s)`}
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=s%60;
  return h?`${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`};
/** 秒数Formato化成ReproducirDispositivo时钟 `h:mm:ss`/`m:ss`; 非数值当 0.  */
const fmtClock:(seconds:unknown)=>string=(s:any)=>{s=Math.max(0,Math.floor(Number(s)||0));const h=s/3600|0,m=(s%3600)/60|0,x=s%60;
  return h?`${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`};
/* 网盘报Capacidadpuede以到 PB: PikPak 报 10 PiB, 写成 TB es"10240.00 TB". No到 1 MB 写 KB, 
   非cero最menos写 1 KB, 免得 1 字节读成"0". 缺值, NaN y负数es"Tamaño desconocido"; 0 es真 0—
   puede回收空间, yaDescargar量este类读数会es 0, 单Archivo 0 字节由调用方判成no知.  */
const fmtSize:(bytes:number|null|undefined)=>string=(value:any)=>{
  if(value===null||value===undefined||value==='')return 'Tamaño desconocido';
  const b=Number(value);
  if(!Number.isFinite(b)||b<0)return 'Tamaño desconocido';
  if(b===0)return '0 B';
  if(b<1048576)return `${Math.max(1,Math.round(b/1024))} KB`;
  return b>=1125899906842624?(b/1125899906842624).toFixed(2)+' PB':b>=1099511627776?(b/1099511627776).toFixed(2)+' TB':b>=1073741824?(b/1073741824).toFixed(1)+' GB':Math.floor(b/1048576)+' MB'};
/* 名字No.uno字素: Avatar垫底, primero字母圆框都取它. 按 UTF-16 码元取会 emoji 劈成medioProxy对, 
   画出来es"�"; 肤色, ZWJ 组合y国旗也要Completo取. 空名用 `fallback`.  */
const graphemeSegmenter=typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function'
  ? new Intl.Segmenter(undefined,{granularity:'grapheme'})
  : null;
const graphemesOf=(value:string)=>graphemeSegmenter
  ? Array.from(graphemeSegmenter.segment(value),part=>part.segment)
  : Array.from(value);
/** 开头 `count` 字素(No加省略号): SelloSin标识时垫两字用它.  */
const leadingGraphemes=(value:unknown,count:number)=>{
  const text=String(value??'').trim(),parts:string[]=[];
  if(!text||count<=0)return '';
  if(!graphemeSegmenter)return Array.from(text).slice(0,count).join('');
  for(const part of graphemeSegmenter.segment(text)){parts.push(part.segment);if(parts.length>=count)break}
  return parts.join('');
};
const firstGrapheme=(value:unknown,fallback='?')=>leadingGraphemes(value,1)||fallback;
/** 按字素截断: 超过 `max` 字素时Dejaanterior `max - 1` 再continuar"...".  */
const clipGraphemes=(value:unknown,max:number)=>{
  const parts=graphemesOf(String(value??''));
  return parts.length>max?`${parts.slice(0,Math.max(0,max-1)).join('')}...`:parts.join('');
};
/** 来源代号到界面名称: `local`→`本地`, `115`→`115`, `pikpak`→`PikPak`, `online`→`En线`.  */
const LOC:Record<string,string>={...SOURCE_LABELS,local:'Local',online:'En línea'};
/* SemillaAleatorio: FNV-1a "Semilla + Clave"压成uno 32 数当OrdenarClave. 同unoSemillaabajo顺序Estable, 
   换Semilla就es另uno套顺序, ClienteNo必存 PRNG Estado, 也No必让posterior端más带unoParámetro. primeropágina
   抽样 y 关注página岛两排共用esteuno, 同uno粒Semilla两边取到es同uno批.  */
const seededRank=(seed:number|string,value:string)=>{
  let hash=2166136261>>>0;
  for(const char of `${seed}\u0000${value}`){hash^=char.codePointAt(0) as number;hash=Math.imul(hash,16777619)>>>0}
  return hash;
};
/* 掷uno粒取样Semilla. 异或ResultadoesCon符号 32 , 先转Sin符号再取模: Semilla要写进地址, posterior端Solo认非负Completo数.  */
const newSeed=()=>String(((Date.now()^(Math.random()*1e9|0))>>>0)%99991);
/* Duracióncuatro档esFiltraren laDuración段, NoescontenidoEtiqueta: DirectorioEtiquetaFiltrardentroNo收它们, 地址arriba带来也摘掉.  */
const DURATION_TAGS:ReadonlySet<string>=new Set(['Corto (menos de 2 min)','Vídeo mediano - menos de 10 min','Película larga (menos de 30 min)','Largometraje (más de 30 min)']);
const cleanTagFilter=(value:unknown)=>String(value||'').split(',').filter(tag=>tag&&!DURATION_TAGS.has(tag)).join(',');

export {
  $,
  seededRank,
  newSeed,
  DURATION_TAGS,
  cleanTagFilter,
  realDuration,
  icon,
  api,
  isAbort,
  mapLimit,
  STATE_ROUTES,
  ROUTE_STATES,
  STATE_LABELS,
  isCatalogPath,
  ENTITY_ROUTES,
  ROUTE_ENTITIES,
  entityPath,
  esc,
  brandIcon,
  siteName,
  linkMarkUrl,
  siteMarkUrl,
  foldName,
  officialLinkText,
  fmtDur,
  fmtClock,
  fmtSize,
  firstGrapheme,
  leadingGraphemes,
  clipGraphemes,
  LOC,
};
