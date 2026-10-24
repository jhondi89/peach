/* 媒体来源选网盘时 CloudDrive 起步Configuración. 
 *
 * páginainteriorSoloDejaIntroduce哪dentro, Introducemásmenos, 怎么Confirmar; tres处缓存分工, 换算y起步值来源En
 * `docs/CLOUDDRIVE.md`, aquí链过去, 同uno段话NoEn两处维护.  */
import { Disclosure, ExternalLink, Help } from './section';

export const CLOUDDRIVE_PROFILES = [
  { name: '机械Disco duro, 或Memoria RAM 8 GB 以interior', cache: '10–20 GiB', read: '256 / 128 KB', task: '1' },
  { name: 'SATA SSD, 8–16 GB de RAM', cache: '20–50 GiB', read: '256 / 128 KB', task: '1–2' },
  { name: 'NVMe SSD, 16 GB o más de RAM', cache: '50–100 GiB', read: '256 / 128 KB', task: '2 o más' },
] as const;

const READINGS = [['cache', 'Cachéarriba限'], ['read', '读取largo度(Predeterminado / Más pequeño)'], ['task', '同时ProcesarVideos']] as const;

export function CloudDriveGuide() {
  return (
    <div className="@container flex flex-col gap-3">
      <Disclosure summary="Ayuda de configuración de CloudDrive">
        <Help>
          先将 CloudDrive2 或 OpenList en proceso网盘挂载Como本机Archivocarpeta, 再EnaquíSeleccionar. 
          <ExternalLink href="https://www.clouddrive2.com/help.html">MontarAyuda</ExternalLink>
        </Help>
        <Help>Caché按所EnDisco duro y DisponibleMemoria RAM选起步值, 再根据Reproducir表现调Completo. </Help>
        <Help>Para usar herramientas de archivos de acción necesarias y la cuenta de almacenamiento en la nubepermiso de escritura. para Luz Pato Cloud: Subir, 建Carpeta, 改名 y MoverNecesario CloudDrive2 v1.1.0 o superior, Eliminar y Copiar aún no soportados. </Help>
        {/* tres档同形, 跨档比较: estrecho处每档uno纵排, ancho处tres项读数排成tres列对齐.  */}
        <ul aria-label="按Caché所EnDisco duro分档" className="flex flex-col gap-2">
          {CLOUDDRIVE_PROFILES.map((profile) => (
            <li key={profile.name} className="flex flex-col gap-2 rounded-2lg border border-separator-border bg-background-primary-default p-3">
              <p className="text-body-medium text-text-primary">{profile.name}</p>
              <dl className="inline-grid grid-cols-1 gap-2 @md:grid-cols-3">
                {READINGS.map(([key, term]) => (
                  <div key={key} className="flex flex-col">
                    <dt className="text-caption-1-regular text-text-secondary">{term}</dt>
                    <dd className="text-body-regular text-text-primary">{profile[key]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-body-2-regular text-text-secondary">
          <li>Cachéarriba限 y LimpiarMétodoIntroduceEn CloudDrive"Configuración"dentro, LimpiarMétodo选 LRU. arriba限No要Introduce 0, Sistema盘至menosDeja 40 GiB; IntroduceCompletadopesado开ConfiguraciónpáginaConfirmar存住. </li>
          <li>读取largo度 y Descargas线程IntroduceEn每Almacenamiento en la nube各自DescargasConfiguracióndentro, 线程都从 2 Iniciar. </li>
          <li>Buffer Cache usa RAM; caché de disco/carpetas usa almacenamiento. Son independientes.</li>
        </ul>
        <Help>
          <ExternalLink href="https://github.com/peach-mitao/peach/blob/master/docs/CLOUDDRIVE.md">CompletadoCompletoConfiguracióny调优Descripción</ExternalLink>
        </Help>
      </Disclosure>
    </div>
  );
}
