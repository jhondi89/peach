/* 标签显示名：纯查表，无 DOM 或请求，Application 与 React 页面共用本模块。
 * 映射只影响显示名，不做同义词归并；数据库标签名仍是真相，查不到时原样返回。 */
const TAG_DISPLAY_NAMES:Record<string,string>={'1080P':'1080p','60fps':'60FPS','AI去码':'Sin censura (IA)',
  '眼镜':'Gafas','情趣内衣':'Lencería sexy',
  '口罩遮脸':'Mascarilla','强制剧情':'Forzado (ficción)','骑乘':'Vaquera',
  '后入':'Por detrás','3P多人':'3P','双洞齐插':'Doble penetración','毒龙':'Beso negro'};
/** 标签键到界面上的名称；表里没有就原样返回。 */
const tagLabel=(tag:string)=>TAG_DISPLAY_NAMES[tag]||tag;

export {TAG_DISPLAY_NAMES, tagLabel};
