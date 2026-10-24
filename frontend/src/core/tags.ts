/* Etiqueta显示名: 纯查表, Sin DOM 或Por favor求, Application y React página面共用本模. 
 * 映射Solo影响显示名, No做同义词归y; DatosBibliotecaEtiqueta名仍es真相, 查No到时Original样返回.  */
const TAG_DISPLAY_NAMES:Record<string,string>={'1080P':'1080p','60fps':'60FPS','Descensurado IA':'Decodificado IA',
  'Gafas':'Gafas娘','Lencería seductora':'Lencería',
  'Cara con mascarilla':'Mascarilla','Escena de fantasía de no-consenso':'Forzar','Amazona':'Amazona resultado(s)',
  'Por detrás':'背posterior resultado(s)','Grupal':'3P','Doble penetración (alternada)':'Doble penetración (simultánea)','Doble penetración (posición)':'Doble penetración intensa'};
/** EtiquetaClave到界面en la名称; 表dentroSin就Original样返回.  */
const tagLabel=(tag:string)=>TAG_DISPLAY_NAMES[tag]||tag;

export {TAG_DISPLAY_NAMES, tagLabel};
