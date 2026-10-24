/* 媒体来源选了网盘时的 CloudDrive 起步配置。
 *
 * 页内只留填哪里、填多少、怎么确认；三处缓存的分工、换算与起步值的来源在
 * `docs/CLOUDDRIVE.md`，这里链过去，同一段话不在两处维护。 */
import { Disclosure, ExternalLink, Help } from './section';

export const CLOUDDRIVE_PROFILES = [
  { name: 'Disco duro mecánico, o 8 GB de RAM o menos', cache: '10–20 GiB', read: '256 / 128 KB', task: '1' },
  { name: 'SSD SATA, 8–16 GB de RAM', cache: '20–50 GiB', read: '256 / 128 KB', task: '1–2' },
  { name: 'SSD NVMe, 16 GB de RAM o más', cache: '50–100 GiB', read: '256 / 128 KB', task: 'desde 2' },
] as const;

const READINGS = [['cache', 'Límite de caché'], ['read', 'Longitud de lectura (predeterminada / mínima)'], ['task', 'Videos procesados a la vez']] as const;

export function CloudDriveGuide() {
  return (
    <div className="@container flex flex-col gap-3">
      <Disclosure summary="Ayuda para configurar CloudDrive">
        <Help>
          Primero monta tu nube como carpeta local con CloudDrive2 u OpenList y luego elígela aquí.
          <ExternalLink href="https://www.clouddrive2.com/help.html">Ayuda de montaje</ExternalLink>
        </Help>
        <Help>Elige el valor inicial de la caché según el disco y la RAM disponible, y ajústalo según cómo reproduzca.</Help>
        <Help>Las operaciones con archivos necesitan permiso de escritura de la herramienta de montaje y de la cuenta de la nube. En Guangya Cloud, subir, crear carpetas, renombrar y mover requiere CloudDrive2 v1.1.0 o superior; borrar y copiar aún no se admite.</Help>
        {/* 三档同形、跨档比较：窄处每档一块纵排，宽处三项读数排成三列对齐。 */}
        <ul aria-label="Niveles según el disco de la caché" className="flex flex-col gap-2">
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
          <li>El límite de caché y la limpieza se configuran en “Ajustes” de CloudDrive; elige LRU como limpieza. No pongas 0 como límite y deja al menos 40 GiB libres en el disco del sistema; al terminar, vuelve a abrir los ajustes para confirmar que se guardó.</li>
          <li>La longitud de lectura y los hilos de descarga se configuran en los ajustes de descarga de cada nube; empieza con 2 hilos.</li>
          <li>Buffer Cache usa RAM; la caché de disco y la de carpetas usan el disco. Cambiar una no controla las otras dos.</li>
        </ul>
        <Help>
          <ExternalLink href="https://github.com/peach-mitao/peach/blob/master/docs/CLOUDDRIVE.md">Guía completa de configuración y ajuste</ExternalLink>
        </Help>
      </Disclosure>
    </div>
  );
}
