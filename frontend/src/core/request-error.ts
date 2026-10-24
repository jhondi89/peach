/** 请求失败使用统一的中文原因，不初始化界面或路由状态。 */
export function requestErrorMessage(cause:any,status=0):string{
  const text=String(cause?.message??cause??'');
  const code=Number(status||cause?.status||text.match(/\b(400|401|403|404|408|409|413|429|500|502|503|504)\b/)?.[1]);
  const messages:Record<number,string>={400:'Hay un error en lo enviado; revisa los datos e inténtalo de nuevo.',401:'La sesión expiró; recarga la página para volver a iniciar sesión.',403:'Este dispositivo no tiene permiso para esta acción; hazla desde el equipo donde corre Peach.',404:'Lo que pediste ya no existe; actualiza la lista.',408:'La solicitud tardó demasiado; inténtalo más tarde.',409:'El estado actual no permite esta acción; actualiza e inténtalo de nuevo.',413:'Lo enviado es demasiado grande; reduce la cantidad e inténtalo de nuevo.',429:'Demasiadas solicitudes; inténtalo más tarde.',500:'El servicio de Peach falló; inténtalo de nuevo. Si sigue fallando, revisa el registro del icono de la barra.',502:'El servicio de Peach no obtuvo resultados; inténtalo más tarde. Si sigue fallando, revisa el registro del icono de la barra.',503:'El servicio de Peach no está disponible por ahora; inténtalo más tarde.',504:'Se agotó el tiempo de espera del servicio; inténtalo más tarde.'};
  if(/Failed to fetch|fetch failed|NetworkError|Load failed|network request failed|ERR_CONNECTION/i.test(text))return 'No se puede conectar al servicio de Peach; revisa la red y que el servicio de la barra esté iniciado.';
  /* 正文里的 timeout 字样只在没有状态码时才算超时：500 的堆栈里常带着某个库的 timeout 参数名。 */
  if(cause?.name==='TimeoutError'||(!code&&/timed? ?out|timeout/i.test(text)))return 'Se agotó el tiempo de espera del servicio; revisa la conexión e inténtalo de nuevo.';
  if(/[㐀-鿿]/.test(text)&&!/^请求失败[（(]/.test(text))return text;
  if(messages[code])return messages[code];
  return 'La acción no terminó; inténtalo de nuevo. Si sigue fallando, revisa el registro del icono de la barra.';
}
