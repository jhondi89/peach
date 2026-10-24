/* InstalarposteriorTutorialEstado. 由共享源码直continuar引用, 随 `peach-app.js` 发出; Por favor求代际es模级Estado, 
   壳yConfiguración面板读写es同uno. 

   Tutorial DOM 由 application/tutorial.js 装配; CompletadoEstadoy渲染分开. 
   清单Completado跟着DatosBiblioteca走(`/api/settings`  `postSetupTutorialDone`), 
   换设备AbrirNo会又被教uno遍; 折叠 y 逐项Omitires当abajoeste屏幕摆法, DejaEn本地. 
   tresClave, Firma y Por favor求代际都收Enaquí, 装配eseuno侧Solo管它们continuar到 DOM arriba.  */
export const POST_SETUP_TUTORIAL_KEY='peach.post-setup-tutorial.v1';
export const POST_SETUP_TUTORIAL_COLLAPSED_KEY='peach.post-setup-tutorial-collapsed.v1';
export const POST_SETUP_TUTORIAL_SKIPPED_KEY='peach.post-setup-tutorial-skipped.v1';

const readStored=(key:string)=>{try{return localStorage.getItem(key)}catch{return null}};
const writeStored=(key:string,value:string)=>{try{localStorage.setItem(key,value)}catch{}};

export const postSetupTutorialMarker=():string=>readStored(POST_SETUP_TUTORIAL_KEY)||'';
export const setPostSetupTutorialMarker=(value:string):void=>writeStored(POST_SETUP_TUTORIAL_KEY,value);
export const postSetupTutorialCollapsed=():boolean=>readStored(POST_SETUP_TUTORIAL_COLLAPSED_KEY)==='1';
export const setPostSetupTutorialCollapsed=(value:unknown):void=>
  writeStored(POST_SETUP_TUTORIAL_COLLAPSED_KEY,value?'1':'0');
export const postSetupTutorialSkipped=():Set<string>=>{
  try{
    const parsed=JSON.parse(readStored(POST_SETUP_TUTORIAL_SKIPPED_KEY)||'[]');
    return new Set(Array.isArray(parsed)?parsed.filter(key=>typeof key==='string'):[]);
  }catch{return new Set()}
};
export const setPostSetupTutorialSkipped=(values:Iterable<string>):void=>
  writeStored(POST_SETUP_TUTORIAL_SKIPPED_KEY,JSON.stringify([...values]));

/* pesado绘判据: 清单dentro每uno项文字, 目标 y Completadoy否. Solo要esteuno串没变, página面arribaese卡就
   还es对, pesado画uno次Solo会打断En curso读它人 y 刚点开折叠.  */
export const postSetupTutorialSignature=(tasks:any[]):string=>JSON.stringify(
  tasks.map(task=>[task.key,task.done,task.label,task.description,task.href]));

/* Por favor求代际: Tutorial跟着每次路由CambiarpesadoNuevo取数, lentoeseuno发回来时página面puede能ya经换.  */
let postSetupTutorialRequest=0;
export const nextPostSetupTutorialRequest=():number=>++postSetupTutorialRequest;
export const isCurrentPostSetupTutorialRequest=(request:number):boolean=>request===postSetupTutorialRequest;

/** pesadoNuevoAbrirTutorial: 清掉Omitiry折叠, 本地Etiqueta回到noCompletado, 由调用方负责服务端eseunomedio.  */
export function resetPostSetupTutorialState():void{
  setPostSetupTutorialSkipped(new Set());
  setPostSetupTutorialCollapsed(false);
  setPostSetupTutorialMarker('pending');
}
