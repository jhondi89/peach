/** Por favor求Fallo使用Unificadoen proceso文Original因, NoInicializar界面或路由Estado.  */
export function requestErrorMessage(cause:any,status=0):string{
  const text=String(cause?.message??cause??'');
  const code=Number(status||cause?.status||text.match(/\b(400|401|403|404|408|409|413|429|500|502|503|504)\b/)?.[1]);
  const messages:Record<number,string>={400:'EnviarcontenidoCon误, Por favorVerificarIntroducirposteriorReintentar. ',401:'Iniciar sesiónYaInválido, Por favorActualizarpágina面pesadoNuevoIniciar sesión. ',403:'ActualDispositivoSin执行此AcciónPermiso, Por favorEn运行 Peach 电脑arribaAcción. ',404:'Por favor求contenidoYaNo存En, Por favorActualizarLista. ',408:'Por favor求Tiempo de espera, Por favorMás tardeReintentar. ',409:'ActualEstadoNo允许此Acción, Por favorActualizarposteriorReintentar. ',413:'Enviarcontenido过grande, Por favor减menosCantidadposteriorReintentar. ',429:'Por favor求过于频繁, Por favorMás tardeReintentar. ',500:'Error de servicio. Reintenta; si persiste, revisa el log.',502:'Sin respuesta del servicio. Inténtalo más tarde.',503:'Servicio no disponible temporalmente. Inténtalo más tarde.',504:'etc.Pendiente服务RespuestaTiempo de espera, Por favorMás tardeReintentar. '};
  if(/Failed to fetch|fetch failed|NetworkError|Load failed|network request failed|ERR_CONNECTION/i.test(text))return 'Ninguno法Conectar到 Peach 服务, Por favorConfirmarRedConectar y Bandeja del sistema服务YaIniciar. ';
  /* 正文en la timeout 字样SoloEnSinEstado码时才算Tiempo de espera: 500 Piladentro常带着某Biblioteca timeout Parámetro名.  */
  if(cause?.name==='TimeoutError'||(!code&&/timed? ?out|timeout/i.test(text)))return 'etc.Pendiente服务RespuestaTiempo de espera, Por favorVerificar conexiónposteriorReintentar. ';
  if(/[㐀-鿿]/.test(text)&&!/^Por favor求Fallo[((]/.test(text))return text;
  if(messages[code])return messages[code];
  return 'Operación no completada, Por favorReintentar; 持续Fallido时verBandeja del sistemaRegistro. ';
}
