<p align="center">
  <img src="resources/peach-logo.png" alt="Peach" width="96">
</p>

<h1 align="center">Peach</h1>

<p align="center">Una biblioteca privada de video: discos locales, nubes y los creadores que seguís, todo en un solo lugar.</p>

<p align="center">
  <a href="https://peach.video">Sitio web</a> ·
  <a href="https://github.com/peach-mitao/peach/releases">Descargar instaladores</a> ·
  <a href="https://demo.peach.video">Demo en vivo</a> ·
  <a href="https://github.com/peach-mitao/peach/releases/tag/intro-video">Video de presentación</a> ·
  <a href="https://github.com/peach-mitao/peach/issues">Reportar un problema</a> ·
  <a href="https://github.com/orgs/peach-mitao/projects/7/views/1">Panel de solicitudes</a> ·
  <a href="https://github.com/orgs/peach-mitao/projects/7/views/3">Hoja de ruta</a> ·
  <a href="#documentación">Documentación</a> ·
  <a href="README.md">中文</a> ·
  <a href="README.en.md">English</a>
</p>

<p align="center">
  <a href="https://github.com/peach-mitao/peach/releases"><img src="https://img.shields.io/github/v/release/peach-mitao/peach?include_prereleases&amp;filter=v*&amp;sort=semver&amp;display_name=tag" alt="release"></a>
  <a href="https://github.com/peach-mitao/peach/actions/workflows/test.yml"><img src="https://img.shields.io/github/actions/workflow/status/peach-mitao/peach/test.yml?branch=master&amp;label=tests&amp;logo=githubactions&amp;logoColor=white" alt="Estado de CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0--or--later-blue?logo=gnu&amp;logoColor=white" alt="licencia"></a>
  <a href="docs/TESTING_DESKTOP.md"><img src="https://img.shields.io/badge/Windows-x64-0078D4" alt="Windows x64"></a>
  <a href="docs/OPERATIONS.md#macos-独立测试包"><img src="https://img.shields.io/badge/macOS-DMG-555555?logo=apple&amp;logoColor=white" alt="Construir e instalar la app independiente para macOS"></a>
  <img src="https://img.shields.io/badge/18%2B-contenido%20adulto-critical" alt="18+ contenido adulto">
</p>

https://github.com/user-attachments/assets/a5610874-e611-41bb-be22-7d99f0d64b62

> **18+** Para adultos que gestionan su propia colección de contenido adulto. El repositorio no contiene medios ni datos de sitios externos. Acceder a sitios externos requiere las cuentas y permisos correspondientes.

## Funcionalidades

- **Local y nube juntos**: explorá discos duros y nubes montadas como 115, PikPak y OneDrive en una sola biblioteca.
- **Elegí desde el muro de videos**: deslizá por una pared de portadas en pantalla completa y reproducí en el mismo lugar, con versiones y partes del mismo título agrupadas.
- **Subtítulos en el reproductor**: cargá subtítulos locales, buscá en SubtitleCat por código de video y ajustá fuente, tamaño, colores y fondo. No se requiere API Key; los resultados pueden incluir traducciones automáticas.
- **Importá tu colección existente**: lee archivos NFO y pósters, luego completa títulos, actrices, estudios y portadas faltantes desde múltiples fuentes conservando tus ediciones manuales.
- **Seguí creadores en varios sitios**: combiná actualizaciones de un mismo creador desde FANBOX, Patreon, Kemono y otros sitios, con publicaciones equivalentes agrupadas en una sola tarjeta.
- **Encontrá tu próxima película**: suscribite a los nuevos lanzamientos de actrices, descubrí títulos según tus gustos y guardalos en tu lista de deseos.
- **Descarga en la nube**: buscá por código de video o pegá un enlace magnético, mandalo a 115 o PikPak y organizá el video descargado en tu biblioteca automáticamente.
- **Agregá JAV desde el navegador**: detectá o seleccioná un código de video en JavDB, MissAV, Jable y otros sitios, y mandalo a Peach para descargarlo e indexarlo. El [userscript](https://github.com/peach-mitao/peach-userscript) se mantiene de forma independiente; ver [instalación y configuración](docs/JAV_BROWSER.md).
- **Preferencias de gusto**: combiná reproducciones, reacciones, tu biblioteca, historial del navegador, marcadores y follows para entender tus preferencias. Leé historial y marcadores de navegadores locales compatibles de una sola vez, o importá marcadores HTML y JSON de Chromium. Podés dejar de leer una fuente o eliminarla cuando quieras. Ver [fuentes de datos de gustos](docs/TASTE_SOURCES.md).

El historial de reproducción, favoritos y configuración quedan guardados en tu computadora. El escaneo no modifica los archivos originales; la organización manual ofrece una vista previa y permite deshacer el último lote.

El escaneo, las actualizaciones de seguimiento y la recolección de metadatos de nuevos lanzamientos guardan su progreso y continúan los elementos incompletos cuando la app se reinicia. Ver [recuperación de tareas](docs/OPERATIONS.md#长时任务断点续跑).

La opción combinada «Enviar estadísticas de versión y diagnóstico de errores (recomendado)» está marcada por defecto. Podés desmarcarla durante la instalación, la configuración inicial o desde la configuración. Cuando está activa, envía los campos técnicos indicados a Sentry; los logs completos, ZIPs de diagnóstico, detalles de medios e historial de reproducción quedan excluidos. Ver [diagnóstico remoto](docs/DIAGNOSTICS.md#可选远程诊断).

Compartir detalles de biblioteca y gustos es una opción separada en el instalador y la configuración, desactivada por defecto. Revisá los campos completos y la vista previa local antes de dar tu consentimiento explícito para los envíos semanales de obras, etiquetas, valoraciones, resúmenes de reproducción y todas las dimensiones de preferencia. No se incluyen identificadores de cuenta, dispositivo ni instalación. Los envíos detallados pueden vincularse o re-identificarse, y el servicio receptor puede ver la IP de conexión. Ver [diagnóstico de biblioteca y gustos](docs/DIAGNOSTICS.md#馆藏与口味群体研究).

## Capturas de pantalla

Probá búsqueda, filtros y perfiles en el [demo de solo lectura](https://demo.peach.video). Hacé clic en una captura para ver la imagen original.

<table>
  <tr>
    <td width="50%"><a href="https://peach.video/assets/screenshots/home-20261014.png" target="_blank" rel="noopener"><img src="https://peach.video/assets/screenshots/home-20261014.webp" alt="Filtros de biblioteca y tarjetas de video" width="600"></a></td>
    <td width="50%"><a href="https://peach.video/assets/screenshots/profile-20261014.png" target="_blank" rel="noopener"><img src="https://peach.video/assets/screenshots/profile-20261014.webp" alt="Retrato, perfil y videos de la actriz" width="600"></a></td>
  </tr>
  <tr>
    <td align="center">Biblioteca: buscá por actriz, fuente y etiqueta</td>
    <td align="center">Perfil de actriz: detalles, alias y todos los videos</td>
  </tr>
  <tr>
    <td><a href="https://peach.video/assets/screenshots/follow-20261014.png" target="_blank" rel="noopener"><img src="https://peach.video/assets/screenshots/follow-20261014.webp" alt="Navegación de creadores y actualizaciones de imágenes" width="600"></a></td>
    <td><a href="https://peach.video/assets/screenshots/stats-20261014.png" target="_blank" rel="noopener"><img src="https://peach.video/assets/screenshots/stats-20261014.webp" alt="Estadísticas de biblioteca, almacenamiento y contenido" width="600"></a></td>
  </tr>
  <tr>
    <td align="center">Seguidos: actualizaciones de creadores en varios sitios</td>
    <td align="center">Estadísticas: almacenamiento e historial de reproducción</td>
  </tr>
  <tr>
    <td colspan="2"><a href="https://peach.video/assets/screenshots/wall-20261014.png" target="_blank" rel="noopener"><img src="https://peach.video/assets/screenshots/wall-20261014-readme.webp" alt="Muro de portadas de video en pantalla completa" width="1200"></a></td>
  </tr>
  <tr>
    <td colspan="2" align="center">Muro de video: deslizá para navegar, reproducí en el lugar</td>
  </tr>
</table>

## Descarga y uso

### Windows

1. Descargá el instalador completo `Peach-<versión>-windows-x64-setup.exe` desde [Releases](https://github.com/peach-mitao/peach/releases) y ejecutalo. No se necesitan permisos de administrador. También podés extraer el paquete portable completo y ejecutar `Peach.exe`.
2. Elegí los directorios de medios y los permisos de acceso en la página de configuración que se abre en el navegador.
3. Iniciá el escaneo, luego explorá y reproducí en tu navegador.

El instalador completo incluye las herramientas de medios para instalación sin conexión. El instalador lite más pequeño descarga las herramientas según se necesiten durante la instalación.

Las versiones de prueba no están firmadas. Si Windows muestra «Windows protegió tu PC», confirmá que el archivo viene de la sección Releases de este proyecto y elegí «Más información → Ejecutar de todos modos». Ver la [guía de Windows](docs/TESTING_DESKTOP.md) para instalación, actualizaciones y resolución de problemas.

### Compilar en macOS

Compilá una `.app` autónoma y un DMG localmente en macOS. Para ejecutarla no hace falta Python, el código fuente ni otra computadora. Ver [la guía de compilación para macOS](docs/OPERATIONS.md#macos-独立测试包).

El flujo de lanzamiento genera paquetes de prueba separados para Apple Silicon (`macos-arm64.dmg`) e Intel (`macos-x86_64.dmg`). Revisá los activos disponibles en [Releases](https://github.com/peach-mitao/peach/releases). Verificá tu chip en «Acerca de esta Mac», abrí la imagen correspondiente y arrastrá Peach a Aplicaciones. Los paquetes de prueba no están notarizados; las herramientas de medios deben instalarse por separado.

### Ejecutar desde el código fuente (Windows, macOS)

Requiere Git, uv y Python 3.14 o superior. Ver [ejecutar desde el código fuente](docs/OPERATIONS.md#从源码运行windowsmacos).

### Docker (VPS / NAS)

Ver [despliegue con Docker](docs/DOCKER.md) para la configuración y las opciones compatibles.

## Preguntas frecuentes

- **¿Modifica mis archivos?** El escaneo y la búsqueda de detalles no tocan los originales. La organización manual renombra o mueve archivos; vaciar la papelera elimina archivos, y la limpieza de sincronización de recursos borra carpetas vacías. Cada acción requiere confirmación.
- **¿Qué nubes son compatibles?** Las nubes montadas como carpetas locales a través de herramientas como CloudDrive2; ver [montajes de nube](docs/CLOUDDRIVE.md). La descarga en la nube admite 115 y PikPak, con los tokens de sesión guardados localmente.
- **¿Cómo miro en el celular?** Permitís dispositivos en la misma red durante la configuración, conectás el celular a esa red, abrís la dirección que se muestra y configurás una contraseña de acceso.
- **¿Dónde están mis datos?** En la carpeta local `peach-data`. En la versión para Windows, la ubicación predeterminada es `%LOCALAPPDATA%\Peach\peach-data`.

## Reportar problemas

Revisá los [reportes de usuarios](https://github.com/peach-mitao/peach/issues), o [abrí un issue](https://github.com/peach-mitao/peach/issues/new/choose) con la versión, los pasos, el resultado esperado y el resultado actual. Ocultá credenciales, direcciones de red local y rutas completas en las capturas; no subas bases de datos ni medios. Reportá problemas de seguridad de forma privada a través de la [política de seguridad](SECURITY.md).

## Documentación

[Operaciones](docs/OPERATIONS.md) · [Fuentes](docs/SOURCING.md) · [Reproductores externos](docs/EXTERNAL_PLAYERS.md) · [Registro de cambios](CHANGELOG.md)

Contribuciones: [Guía de desarrollo](AGENTS.md) · [Pruebas y dependencias](docs/TESTING.md)

## Proyectos relacionados

Gracias a [amane](https://github.com/sqzw-x/amane), [Gfriends](https://github.com/gfriends/gfriends), [CloudDrive2](https://www.clouddrive2.com/) y otros. Ver el [inventario de reutilización](docs/REUSE.md) para créditos y detalles completos.

## Historial de estrellas

<a href="https://www.star-history.com/?repos=peach-mitao%2Fpeach&amp;type=date&amp;logscale=&amp;releases=&amp;legend=top-left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=peach-mitao/peach&amp;type=date&amp;theme=dark&amp;logscale&amp;legend=top-left">
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=peach-mitao/peach&amp;type=date&amp;logscale&amp;legend=top-left">
    <img alt="Historial de estrellas de Peach" src="https://api.star-history.com/svg?repos=peach-mitao/peach&amp;type=date&amp;logscale&amp;legend=top-left">
  </picture>
</a>

## Licencia

[AGPL-3.0-or-later](LICENSE) · Copyright (C) 2026 longmeidao. Los componentes de terceros conservan sus propias licencias.
