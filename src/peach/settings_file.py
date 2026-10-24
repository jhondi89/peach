"""设置文件层：Peach 数据目录的发现，以及 `<Peach 数据目录>/config.toml` 的读取、合并与写回。

三层优先级固定为 **环境变量 > 设置文件 > 内建默认**，`config.py` 只消费合并结果。
内建默认必须对一个全新用户成立，所以这里（和 `config.py`）不许出现任何一台具体机器的
路径、主机名、账号名或局域网地址（ADR-0023 第一阶段）。当前部署的那些值不是删掉了，
而是搬进设置文件：`peach init --from-existing` 生成它。

Peach 数据目录的发现刻意**不**依赖设置文件内容——设置文件本身就住在 Peach 数据目录里面：

1. `PEACH_DATA_ROOT` 环境变量；
2. 从起点逐级向上，第一个存在的 `<上级目录>/peach-data`。起点在源码树里是项目根，
   打包后是 EXE 所在目录——单文件包的 `_MEIPASS` 是 `%TEMP%` 下的临时目录，它上面
   没有任何东西。ADR-0017 的顶层布局把 `peach-app` 与 `peach-data` 并列，向上找因此
   覆盖主检出、`peach-worktrees/<task>` 里的隔离工作树和 `dist/Peach` 里的托盘；
3. 都没有 → 未配置。此时仍然给出建议的数据目录（`peach init` 会去建它），但 `configured`
   为 False：服务照常启动，`/healthz` 报 `configured=false`，页面提示去跑 `peach init`。

读用标准库 `tomllib`（Python 3.11+ 只读），写用本模块自带的最小序列化器。设置文件里
出现的值只有字符串、布尔、整数和字符串表这四种，为这点需求引入 `tomli-w`／`tomlkit`
不值得——依赖策略要求每个外部模块都精确固定版本并有归属（`docs/REUSE.md`）。
"""
from __future__ import annotations

import os
import sys
import tomllib
from dataclasses import dataclass, field, replace
from functools import lru_cache
from pathlib import Path

from . import distribution

#: 设置文件名。位置固定为 Peach 数据目录下，不做多候选路径搜索。
SETTINGS_FILENAME = "config.toml"
DATA_ROOT_ENV = "PEACH_DATA_ROOT"
DATA_ROOT_LOCATION = "data-root.txt"
#: ADR-0017 的顶层布局里这两个目录名是固定的，不随机器变化。
DATA_ROOT_DIRNAME = "peach-data"
SHARED_ROOT_DIRNAME = "peach-sync"

#: Peach 数据目录下的子目录键。设置文件里省略某项就取同名目录；写绝对路径可以搬出 Peach 数据目录。
DIRECTORY_KEYS = (
    "database", "generated", "sources", "state", "secrets", "logs", "tools", "review",
)

#: 媒体来源的键（如 local、115）对应数据库 asset.location 的值，不是盘符。
#: 值是数据库 asset.path 中保存的目录前缀；各系统均使用 Windows 格式。
#: 一个来源有多个目录时写数组；[media.mounts] 按同一顺序保存本机实际目录。
#: peach.platform 在读取文件前转换路径（ADR-0023 勘误）。
DEFAULT_LOCATION_ROOTS: dict[str, tuple[str, ...]] = {
    "local": (r"R:\media",),
    "115": ("B:/",),
    "pikpak": ("A:/",),
}

#: `[media]` 下按子表保存路径、媒体库与读取策略，没有标量键。第一阶段的 `[media] R = '...'` 是盘符键，
#: 键空间和 location ID 不同，静默接受只会让整台机器脱盘，所以要显式报升级提示。
_LOCATIONS_KEY = "locations"
_MOUNTS_KEY = "mounts"


class SettingsFileError(RuntimeError):
    """设置文件存在但读不出来。

    消息必须带文件路径；`tomllib` 的语法错误自带行列号，一并转述。Peach 数据目录的发现不看
    文件内容，所以出错后仍然知道账本在哪：调用方退回内建默认并显式拒绝提供服务，
    而不是拿一份半生不熟的配置去跑。
    """


def _project_root(module_file: str = __file__, bundle_root: str | None = None) -> Path:
    """资源来自源码树、wheel 内的资源目录或 PyInstaller 的 `_MEIPASS`。"""
    packaged = Path(module_file).resolve().parent / "_resources"
    if bundle_root is None and packaged.is_dir():
        return packaged
    return (Path(bundle_root) if bundle_root is not None
            else Path(module_file).resolve().parents[2])


PROJECT_ROOT = _project_root(bundle_root=getattr(sys, "_MEIPASS", None))


def _search_anchor(
    project_root: Path = PROJECT_ROOT, *,
    frozen: bool = bool(getattr(sys, "frozen", False)), executable: str = sys.executable,
) -> Path:
    """向上找 Peach 数据目录的起点：源码树用项目根，打包产物用 EXE 所在目录。

    资源根和发现起点是两回事。PyInstaller 的资源在 `_MEIPASS`，单文件包把它解到
    `%TEMP%/_MEIxxxx`，从那里向上只会走到用户目录，托盘于是把一台配置好的机器判成
    首次运行并起 `serve --setup`。`sys.executable` 在两种打包形态里都是 EXE 本身。
    """
    if frozen:
        return Path(executable).resolve().parent
    return project_root


SEARCH_ANCHOR = _search_anchor()

#: 向上找几层。四层刚好覆盖最深的那种形态（`peach-app/dist/Peach` 里的 EXE 走三层
#: 回到 `peach/`，再留一层给更深的检出）。不做无界搜索：一路走到磁盘根会撞上碰巧同名的
#: 目录，而那种「找错 Peach 数据目录」的故障看起来完全像是数据丢了。
_SEARCH_DEPTH = 4


def _bootstrap_data_root(
    project_root: Path = SEARCH_ANCHOR, environ: dict[str, str] | None = None,
) -> tuple[Path, bool]:
    """返回 (Peach 数据目录, 是否真的找到了)。找不到时第一项是 `peach init` 的默认数据目录。

    `project_root` 是向上找的起点，默认取 `SEARCH_ANCHOR`。
    """
    environ = os.environ if environ is None else environ
    explicit = (environ.get(DATA_ROOT_ENV) or "").strip()
    if explicit:
        return Path(explicit), True
    if distribution.standalone():
        candidate = distribution.user_data_root(environ)
        return candidate, (candidate / SETTINGS_FILENAME).is_file()
    for parent in project_root.parents[:_SEARCH_DEPTH]:
        candidate = parent / DATA_ROOT_DIRNAME
        if candidate.is_dir():
            return candidate, True
    return project_root.parent / DATA_ROOT_DIRNAME, False


def _selected_data_root(root: Path) -> Path:
    """读取本机首次设置保存的位置；最多跟随八次，并拒绝循环与相对路径。"""
    visited = {root}
    for _ in range(9):
        locator = root / "state" / DATA_ROOT_LOCATION
        try:
            text = locator.read_text(encoding="utf-8").strip()
        except FileNotFoundError:
            return root
        except (OSError, UnicodeError) as exc:
            raise SettingsFileError(f"No se puede leer la ubicación de la carpeta de datos: {locator}: {exc}") from exc
        selected = Path(text)
        if not text or not selected.is_absolute() or selected in visited:
            raise SettingsFileError(f"La ubicación de la carpeta de datos no es válida o forma un ciclo: {locator}")
        visited.add(selected)
        root = selected
    raise SettingsFileError("La ubicación de la carpeta de datos redirige más de ocho veces")


def discover_data_root(
    project_root: Path = SEARCH_ANCHOR, environ: dict[str, str] | None = None,
) -> tuple[Path, bool]:
    """从默认数据目录读取已保存的数据目录位置，返回实际 Peach 数据目录及发现状态。"""
    root, found = _bootstrap_data_root(project_root, environ)
    selected = _selected_data_root(root)
    return selected, found or (selected / SETTINGS_FILENAME).is_file()


def remember_data_root(bootstrap: PeachConfig, selected: PeachConfig) -> None:
    """将首次设置选定的位置原子记录在默认数据目录，不复制账本或其他数据。"""
    if bootstrap.data_root.resolve() == selected.data_root.resolve():
        return
    from .fsutil import atomic_write_text
    atomic_write_text(bootstrap.data_root / "state" / DATA_ROOT_LOCATION,
                      str(selected.data_root.resolve()))


@dataclass(frozen=True)
class ServerSettings:
    host: str = "127.0.0.1"
    port: int = 8900
    #: 本机发布的 mDNS 名。两台机器同时在线时必须显式改一台，否则互相抢同一个名字。
    mdns_name: str = "peach"
    #: reader 复核镜像要读的 writer 源，形如 `https://<地址>`；空串表示本机不做镜像。
    review_writer_origin: str = ""
    #: 只对上面那个源生效的 HTTP 代理；空串表示直连。macOS 上 LaunchAgent 的 Python
    #: 可能拿不到 Local Network 权限，那种机器才需要填。
    review_writer_proxy: str = ""


@dataclass(frozen=True)
class ReplicationSettings:
    """单写者 ledger 复制（ADR-0017、ADR-0020）的坐标。

    `enabled` 默认 False：多数部署只有一台机器，没有第二台就没有单写者复制可言。
    关闭时不装配 ledger 同步观察器、不探测也不挂载 SMB、托盘不出 Ledger 菜单项，
    服务按独立写者跑（`/healthz` 的 `ledger_sync` 为 `disabled`）。现有双机部署由
    `peach init --from-existing` 写成 true，读到 true 的机器上面这些逐项生效。
    """

    enabled: bool = False
    #: 共享传输点。空串表示取 `<Peach 数据目录的上级>/peach-sync`。
    shared_root: str = ""
    smb_host: str = ""
    smb_share: str = ""
    #: 挂载共享用的账号，必须和钥匙串里已有的那条同名；空串表示不预检、不弹认证框。
    smb_user: str = ""


@dataclass(frozen=True)
class TunnelSettings:
    """Cloudflare Tunnel 的本机开关。

    Quick Tunnel 没有稳定域名，也没有 Cloudflare Access 身份层，所以默认关闭，
    只有在 Peach 自己已经启用访问密码时才允许打开。`binary` 只记录本机可执行文件
    的显式位置，不把二进制或下载地址写进设置文件。

    `mode = "named"` 换成用户自己在 Cloudflare 后台建的命名隧道：入口是 `hostname`
    这个固定主机名，凭据是 `token`。令牌只落在这个文件里，不进账本、日志和健康检查。
    命名隧道只在源码开发环境可用，独立包读到它会拒绝启动隧道。
    """

    enabled: bool = False
    binary: str = ""
    mode: str = "quick"
    token: str = ""
    hostname: str = ""


@dataclass(frozen=True)
class PeachConfig:
    """一次合并的结果。`config.py` 把它投影成模块常量。"""

    data_root: Path
    #: 设置文件**应该**在哪。文件不存在时这个值照样有效，`present` 才是存在判据。
    path: Path
    present: bool = False
    #: Peach 数据目录是被找到的，还是只是一个建议使用的数据目录。
    data_root_found: bool = False
    directories: dict[str, str] = field(default_factory=dict)
    #: `asset.location` -> 本机挂载点，即该来源的每个数据库路径前缀落在本机哪个目录，按顺序
    #: 与 `locations` 里的数据库路径前缀一一对应。Windows 上通常为空：盘符本身就是挂载点。
    mounts: dict[str, tuple[str, ...]] = field(default_factory=dict)
    library_names: dict[str, str] = field(default_factory=dict)
    library_icons: dict[str, str] = field(default_factory=dict)
    media_costs: dict[str, str] = field(default_factory=dict)
    #: `asset.location` -> 数据库中的目录前缀，至少一个。
    locations: dict[str, tuple[str, ...]] = field(
        default_factory=lambda: dict(DEFAULT_LOCATION_ROOTS))
    server: ServerSettings = ServerSettings()
    replication: ReplicationSettings = ReplicationSettings()
    tunnel: TunnelSettings = TunnelSettings()

    @property
    def configured(self) -> bool:
        """有设置文件，或者已经找到 Peach 数据目录，就算配置过。

        单独看设置文件会把所有现有部署判成「未配置」——它们的 Peach 数据目录真实存在、账本也在
        跑，只是还没生成过 config.toml。反过来，全新克隆两个条件都不成立，页面才应该
        弹首次运行提示。
        """
        return self.present or self.data_root_found

    def directory(self, key: str) -> Path:
        """Peach 数据目录下的子目录。相对路径按 Peach 数据目录解析，绝对路径原样使用。"""
        raw = (self.directories.get(key) or "").strip() or key
        candidate = Path(raw)
        return candidate if candidate.is_absolute() else self.data_root / candidate

    @property
    def shared_root(self) -> Path:
        raw = self.replication.shared_root.strip()
        return Path(raw) if raw else self.data_root.parent / SHARED_ROOT_DIRNAME

    @property
    def smb_share(self) -> str:
        """共享名默认取共享目录名：两边同名是最不容易配错的形状。"""
        return self.replication.smb_share or self.shared_root.name


# --------------------------------------------------------------------------- 读取

def _fail(path: Path, detail: str) -> SettingsFileError:
    return SettingsFileError(f"No se puede leer el archivo de ajustes: {path}: {detail}")


def _read_document(path: Path) -> dict:
    try:
        raw = path.read_bytes()
    except OSError as exc:
        raise _fail(path, str(exc)) from exc
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise _fail(path, f"No está en codificación UTF-8 ({exc})") from exc
    try:
        return tomllib.loads(text)
    except tomllib.TOMLDecodeError as exc:
        # tomllib 的消息自带 `at line N, column M`，直接转述比自己数行可靠。
        raise _fail(path, f"Error de sintaxis TOML: {exc}") from exc


def _table(document: dict, key: str, path: Path) -> dict:
    value = document.get(key, {})
    if not isinstance(value, dict):
        raise _fail(path, f"`{key}` debe ser una tabla ([{key}])")
    return value


def _string(table: dict, key: str, default: str, path: Path, prefix: str) -> str:
    value = table.get(key, default)
    if not isinstance(value, str):
        raise _fail(path, f"`{prefix}{key}` debe ser texto")
    return value


def _integer(table: dict, key: str, default: int, path: Path, prefix: str) -> int:
    value = table.get(key, default)
    # bool 是 int 的子类，端口写成 true 必须报错而不是静默变成 1。
    if isinstance(value, bool) or not isinstance(value, int):
        raise _fail(path, f"`{prefix}{key}` debe ser un número entero")
    return value


def _boolean(table: dict, key: str, default: bool, path: Path, prefix: str) -> bool:
    value = table.get(key, default)
    if not isinstance(value, bool):
        raise _fail(path, f"`{prefix}{key}` debe ser true o false")
    return value


def _string_map(table: dict, path: Path, prefix: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for key, value in table.items():
        if not isinstance(value, str):
            raise _fail(path, f"`{prefix}{key}` debe ser texto")
        result[key] = value
    return result


def _root_map(table: dict, path: Path, prefix: str) -> dict[str, tuple[str, ...]]:
    """`[media.locations]` / `[media.mounts]` 的值：一个字符串，或一个字符串数组。

    单个来源常常只有一个目录，写成字符串最好读；第二块硬盘加进来时改成数组即可。
    两张表的解析口径一致，数组里不能有空串、不能重复——那两种写法都说不清用户想要什么。
    """
    result: dict[str, tuple[str, ...]] = {}
    for key, value in table.items():
        if isinstance(value, str):
            result[key] = (value,) if value else ()
            continue
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise _fail(path, f"`{prefix}{key}` debe ser texto o una lista de textos")
        if any(not item for item in value):
            raise _fail(path, f"La lista de `{prefix}{key}` no puede tener textos vacíos")
        if len(set(value)) != len(value):
            raise _fail(path, f"La lista de `{prefix}{key}` tiene rutas repetidas")
        result[key] = tuple(value)
    return result


def _merge(
    data_root: Path, path: Path, present: bool, found: bool,
    document: dict, environ: dict[str, str],
) -> PeachConfig:
    directories = _string_map(
        _table(document, "directories", path), path, "directories.")
    unknown = sorted(set(directories) - set(DIRECTORY_KEYS))
    if unknown:
        raise _fail(path, "`directories` tiene claves desconocidas:" + "、".join(unknown))

    media = _table(document, "media", path)
    stray = sorted(set(media) - {_LOCATIONS_KEY, _MOUNTS_KEY, "libraries", "library_icons", "costs"})
    if stray:
        # 第一阶段的 `[media] R = '/Volumes/Media'`。键空间从盘符换成了 location ID，
        # 把它当未知键忽略等于「所有来源都没挂」——整台机器安静地进脱盘模式。
        raise _fail(path, (
            "`[media]` ya no acepta claves de letra de unidad:" + "、".join(stray)
            + ". Cámbialo a `[media.mounts] <location-id> = <ruta local>`, donde el ID es una clave de fuente ya configurada en `[media.locations]` y la ruta es la carpeta de medios local de esa fuente, por ejemplo `local = '/mnt/media'`"
        ))
    # 文件里写了 `[media.locations]` 就以它为准：`peach init` 的问答只声明用户给过的
    # 来源，内建默认那三个示例盘符不能从旁边混进来，否则陌生人的机器上会多出两个
    # 永远脱盘的来源。没写这张表才退回内建默认。
    if _LOCATIONS_KEY in media:
        locations = _root_map(_table(media, _LOCATIONS_KEY, path), path, "media.locations.")
        empty = sorted(key for key, roots in locations.items() if not roots)
        if empty:
            raise _fail(path, "En `[media.locations]` estas fuentes de medios no tienen prefijo de carpeta:" + "、".join(empty))
    else:
        locations = dict(DEFAULT_LOCATION_ROOTS)
    mounts = _root_map(_table(media, _MOUNTS_KEY, path), path, "media.mounts.")
    unknown_mounts = sorted(set(mounts) - set(locations))
    if unknown_mounts:
        # 打错一个 ID 却静默忽略，同样是安静地脱盘。
        raise _fail(path, (
            "`[media.mounts]` tiene fuentes que no están declaradas en `[media.locations]`:"
            + "、".join(unknown_mounts)
        ))
    for key, points in mounts.items():
        # 媒体目录按顺序对应数据库路径前缀，数目不一致时拒绝保存。
        if points and len(points) != len(locations[key]):
            raise _fail(path, (
                f"`[media.mounts] {key}` tiene {len(points)} carpetas de medios, pero `[media.locations] {key}` tiene {len(locations[key])} prefijos de ruta de la base de datos; se corresponden en orden uno a uno, así que deben tener la misma cantidad o dejarse vacíos"
            ))

    server_table = _table(document, "server", path)
    fallback = ServerSettings()
    server = ServerSettings(
        host=_string(server_table, "host", fallback.host, path, "server."),
        port=_integer(server_table, "port", fallback.port, path, "server."),
        mdns_name=_string(
            server_table, "mdns_name", fallback.mdns_name, path, "server."),
        review_writer_origin=_string(
            server_table, "review_writer_origin", fallback.review_writer_origin,
            path, "server."),
        review_writer_proxy=_string(
            server_table, "review_writer_proxy", fallback.review_writer_proxy,
            path, "server."),
    )

    replication_table = _table(document, "replication", path)
    defaults = ReplicationSettings()
    replication = ReplicationSettings(
        enabled=_boolean(
            replication_table, "enabled", defaults.enabled, path, "replication."),
        shared_root=_string(
            replication_table, "shared_root", defaults.shared_root, path, "replication."),
        smb_host=_string(
            replication_table, "smb_host", defaults.smb_host, path, "replication."),
        smb_share=_string(
            replication_table, "smb_share", defaults.smb_share, path, "replication."),
        smb_user=_string(
            replication_table, "smb_user", defaults.smb_user, path, "replication."),
    )

    tunnel_table = _table(document, "tunnel", path)
    tunnel_defaults = TunnelSettings()
    tunnel = TunnelSettings(
        enabled=_boolean(
            tunnel_table, "enabled", tunnel_defaults.enabled, path, "tunnel."),
        binary=_string(
            tunnel_table, "binary", tunnel_defaults.binary, path, "tunnel."),
        mode=_string(
            tunnel_table, "mode", tunnel_defaults.mode, path, "tunnel."),
        token=_string(
            tunnel_table, "token", tunnel_defaults.token, path, "tunnel."),
        hostname=_string(
            tunnel_table, "hostname", tunnel_defaults.hostname, path, "tunnel."),
    )

    media_costs = _string_map(_table(media, "costs", path), path, "media.costs.")
    if any(cost not in {"free", "metered"} for cost in media_costs.values()):
        raise _fail(path, "`[media.costs]` solo acepta free o metered")
    config = PeachConfig(
        data_root=data_root, path=path, present=present, data_root_found=found,
        directories=directories, mounts=mounts, locations=locations,
        library_names=_string_map(_table(media, "libraries", path), path, "media.libraries."),
        library_icons=_string_map(_table(media, "library_icons", path), path, "media.library_icons."),
        media_costs=media_costs,
        server=server, replication=replication, tunnel=tunnel,
    )
    return _apply_environment(config, environ)


#: 环境变量 -> 设置项。这一层永远压过文件，临时覆盖和 CI 都靠它，不用改文件。
#: `PEACH_DATA_ROOT` 在 `discover_data_root` 里就用掉了；`PEACH_MEDIA_MOUNTS` 由
#: `peach.platform` 在每次 `location_mounts()` 里现读，测试会在运行期改它。
_SERVER_ENV = {
    "PEACH_MDNS_NAME": "mdns_name",
    "PEACH_REVIEW_WRITER_ORIGIN": "review_writer_origin",
    "PEACH_REVIEW_WRITER_PROXY": "review_writer_proxy",
}
_REPLICATION_ENV = {
    "PEACH_SHARED_DATA_ROOT": "shared_root",
    "PEACH_SHARED_SMB_HOST": "smb_host",
    "PEACH_SHARED_SMB_SHARE": "smb_share",
    "PEACH_SHARED_SMB_USER": "smb_user",
}


def _apply_environment(config: PeachConfig, environ: dict[str, str]) -> PeachConfig:
    server_changes = {
        field_name: environ[name]
        for name, field_name in _SERVER_ENV.items() if environ.get(name)
    }
    replication_changes = {
        field_name: environ[name]
        for name, field_name in _REPLICATION_ENV.items() if environ.get(name)
    }
    if server_changes:
        config = replace(config, server=replace(config.server, **server_changes))
    if replication_changes:
        config = replace(
            config, replication=replace(config.replication, **replication_changes))
    return config


def load_config(
    project_root: Path = SEARCH_ANCHOR, environ: dict[str, str] | None = None,
    *, strict: bool = True,
) -> PeachConfig:
    """读一次设置文件并合并三层。

    `strict=False` 时坏文件退回内建默认（Peach 数据目录仍然照发现顺序算），给 `peach init
    --force` 留一条自救路径；否则抛 `SettingsFileError`。

    「坏」包括语法读不出来和合并时被拒（未知目录键、`[media]` 下的盘符键之类）。
    两者都要走同一条退路：`_merge` 的拒绝漏在 try 外面的话，自救入口自己也会崩——
    而 `[media] R = ...` 这种被判成硬错误的盘符键，正是最常见的一份坏文件。
    """
    environ = os.environ if environ is None else environ
    data_root, found = discover_data_root(project_root, environ)
    path = data_root / SETTINGS_FILENAME
    document: dict = {}
    present = False
    if path.is_file():
        try:
            document = _read_document(path)
            present = True
        except SettingsFileError:
            if strict:
                raise
    try:
        return _merge(data_root, path, present, found, document, environ)
    except SettingsFileError:
        if strict:
            raise
        # 文件内容整份作废，只保留 Peach 数据目录的发现结果和环境变量层。
        return _merge(data_root, path, False, found, {}, environ)


@lru_cache(maxsize=1)
def _load_once() -> tuple[PeachConfig, SettingsFileError | None]:
    try:
        return load_config(), None
    except SettingsFileError as exc:
        return load_config(strict=False), exc


def active() -> PeachConfig:
    """当前生效的设置。文件坏了也返回一份可用的（内建默认），错误留在 `error()`。"""
    return _load_once()[0]


def error() -> SettingsFileError | None:
    """设置文件坏了时的原始错误。CLI 据此拒绝提供服务，而不是拿默认值糊过去。"""
    return _load_once()[1]


def reset_cache() -> None:
    """测试换过环境变量或文件之后调用。生产路径只在进程启动时读一次。"""
    _load_once.cache_clear()


# --------------------------------------------------------------------------- 写回

def _render_value(value: object) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    text = str(value)
    # Windows 路径里全是反斜杠。TOML 的字面量字符串不做转义，比 "R:\\media" 好读得多；
    # 只有值里本来就带单引号或换行时才退回基本字符串。
    if "'" not in text and "\n" not in text and "\r" not in text:
        return f"'{text}'"
    escaped = (text.replace("\\", "\\\\").replace('"', '\\"')
               .replace("\n", "\\n").replace("\r", "\\r"))
    return f'"{escaped}"'


def _render_roots(pairs: dict[str, tuple[str, ...]]) -> list[str]:
    """渲染数据库路径前缀或媒体目录：单个写成字符串，多个写成数组。"""
    rendered: dict[str, object] = {}
    for key, roots in pairs.items():
        if len(roots) == 1:
            rendered[key] = roots[0]
        elif not roots:
            rendered[key] = ""
        else:
            rendered[key] = "[" + ", ".join(_render_value(root) for root in roots) + "]"
    return [f"{_render_key(key)} = {value if isinstance(value, str) and value.startswith('[') else _render_value(value)}"
            for key, value in rendered.items()]


def _render_key(key: str) -> str:
    allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-")
    return key if key and set(key) <= allowed else _render_value(key)


def _render_pairs(pairs: dict[str, object]) -> list[str]:
    return [f"{_render_key(key)} = {_render_value(value)}" for key, value in pairs.items()]


def render(config: PeachConfig) -> str:
    """把设置渲染成带注释的 TOML。注释是给人读的，`load_config` 不依赖它们。"""
    lines = [
        "# Archivo de ajustes de Peach. Prioridad: variables de entorno > este archivo > valores por defecto; tras editarlo a mano reinicia el servicio.",
        "# Este archivo vive en la carpeta de datos de Peach; esa carpeta la decide PEACH_DATA_ROOT o la carpeta peach-data junto al proyecto.",
        "# Docker: este archivo está en /data/config.toml; pon /data en un volumen y consérvalo al recrear el contenedor.",
        "# En Docker, /media es la carpeta de medios dentro del contenedor; la carpeta del host se monta aquí con Compose.",
        "# Guía de Docker: https://github.com/peach-mitao/peach/blob/master/docs/DOCKER.md",
        f"# Generado con: peach init (carpeta de datos de Peach: {config.data_root})",
        "",
        "[directories]",
        "# Subcarpetas de la carpeta de datos de Peach, como database o logs; si se omiten se usan carpetas con ese nombre.",
        "# También se pueden poner rutas absolutas. En Docker las rutas relativas quedan dentro de /data; otras carpetas hay que montarlas aparte y conservarlas.",
    ]
    lines += _render_pairs({key: config.directories[key]
                            for key in DIRECTORY_KEYS if key in config.directories})
    lines += [
        "",
        "[media.locations]",
        "# Normalmente basta con escribir la carpeta real en la web; Peach mantiene esta tabla y [media.mounts] al guardar.",
        "# Lo siguiente es referencia para editar a mano; los videos existentes se buscan con esta tabla y un valor que no coincida hará que no se puedan leer.",
        "# Claves como local, 115 o pikpak son fuentes de medios; el valor es el prefijo de carpeta de las rutas de video en la base de datos.",
        "# La base de datos de Peach guarda las rutas en formato Windows en todos los sistemas, por ejemplo R:\\media\\a.mp4.",
        "# Por eso Docker / Linux / macOS también usan esta tabla; R:\\media no tiene que existir en esos sistemas.",
        "# Ejemplo: en esta tabla local = 'R:\\media' y en [media.mounts] local = '/media'.",
        "# Peach convierte R:\\media\\a.mp4 de la base de datos en /media/a.mp4 y luego lee el archivo.",
        "# Esta tabla debe coincidir con las rutas de la base de datos; en Docker / Linux / macOS, si mueves la carpeta real conserva esta tabla y cambia [media.mounts].",
        "# Ejemplo en Windows: local = ['D:\\Videos', 'E:\\Movies'], usando directamente las carpetas de este equipo.",
    ]
    lines += _render_roots(dict(config.locations))
    lines += [
        "",
        "[media.libraries]",
        "# Prefijo de carpeta de [media.locations] -> nombre de la biblioteca en la interfaz; si se omite se usa el nombre de la carpeta.",
        "# Si varias carpetas usan el mismo nombre, en la interfaz aparecen como una sola biblioteca.",
    ]
    lines += [f"{_render_value(root)} = {_render_value(name)}" for root, name in config.library_names.items()]
    lines += [
        "",
        "[media.library_icons]",
        "# Prefijo de carpeta de [media.locations] -> icono de la biblioteca. El valor es un nombre de icono de peach.media_libraries.LIBRARY_ICONS;",
        "# los valores desconocidos se ignoran: una colección con una sola fuente usa el icono de esa fuente y una con varias usa database.",
    ]
    lines += [f"{_render_value(root)} = {_render_value(icon)}" for root, icon in config.library_icons.items()]
    lines += ["", "[media.costs]", "# Prefijo de carpeta de [media.locations] -> protección del tráfico del proxy. free la desactiva, metered la activa."]
    lines += [f"{_render_value(root)} = {_render_value(cost)}" for root, cost in config.media_costs.items()]
    lines += [
        "",
        "[media.mounts]",
        "# Usa las mismas claves de fuente que [media.locations]; el valor es la carpeta desde la que Peach lee los archivos.",
        "# En Docker pon la ruta dentro del contenedor, por ejemplo local = '/media'; la carpeta del host se configura en volumes de Compose.",
        "# Linux / macOS también usan rutas absolutas locales, por ejemplo /mnt/media o /Volumes/Media.",
        "# Si una fuente tiene varias carpetas, ambas tablas usan listas con la misma cantidad y el mismo orden.",
        "# Docker / Linux / macOS deben tener carpetas reales; si no, no se pueden leer los medios de esa fuente, aunque los registros se conservan.",
        "# Windows lee directamente las carpetas de [media.locations]; no hace falta llenar esta tabla.",
    ]
    lines += _render_roots(dict(config.mounts))
    lines += [
        "",
        "[server]",
        "# El servicio de Docker escucha siempre en 0.0.0.0:8900; la dirección y el puerto del host se configuran en Compose.",
        "# host y port se usan al ejecutar peach serve directamente; los parámetros de Docker tienen prioridad.",
        "# mdns_name debe ser único en la red local: dos equipos con el mismo nombre se lo disputan.",
        "# review_writer_origin es la dirección del dispositivo que puede modificar la base de datos; los de solo lectura obtienen de ahí los datos por confirmar.",
        "# Vacío significa que este equipo no muestra los datos por confirmar de otro dispositivo.",
    ]
    lines += _render_pairs({
        "host": config.server.host,
        "port": config.server.port,
        "mdns_name": config.server.mdns_name,
        "review_writer_origin": config.server.review_writer_origin,
        "review_writer_proxy": config.server.review_writer_proxy,
    })
    lines += [
        "",
        "[replication]",
        "# Replicación de la base de datos entre dos equipos (ADR-0017); solo uno puede modificarla y el otro es de solo lectura.",
        "# En un solo equipo o en Docker independiente deja enabled = false.",
        "# Si está desactivado no se inicia el vigilante de sincronización ni se prueba SMB; el icono de la barra no muestra el menú Ledger.",
        "# shared_root es la carpeta donde dos equipos intercambian copias de la base de datos; si está vacío se usa peach-sync junto a la carpeta de datos de Peach.",
        "# smb_* sirve para conectar con la carpeta compartida del otro equipo; si está vacío no se conecta.",
    ]
    lines += _render_pairs({
        "enabled": config.replication.enabled,
        "shared_root": config.replication.shared_root,
        "smb_host": config.replication.smb_host,
        "smb_share": config.replication.smb_share,
        "smb_user": config.replication.smb_user,
    })
    lines += [
        "",
        "[tunnel]",
        "# Cloudflare Tunnel está desactivado por defecto; antes de activarlo pon una contraseña de acceso.",
        "# Si binary está vacío, cloudflared se busca en el paquete incluido, PEACH_CLOUDFLARED y PATH, en ese orden.",
        "# mode = \"quick\" es un enlace temporal con dirección aleatoria; \"named\" usa un túnel con nombre propio, solo disponible",
        "# en desarrollo desde código fuente; necesita hostname (nombre público vinculado en Cloudflare) y token (token del túnel).",
        "# token es una credencial: este archivo es su único lugar; no lo copies a otro sitio ni lo subas a Git.",
    ]
    lines += _render_pairs({
        "enabled": config.tunnel.enabled,
        "binary": config.tunnel.binary,
        "mode": config.tunnel.mode,
        "hostname": config.tunnel.hostname,
        "token": config.tunnel.token,
    })
    return "\n".join(lines) + "\n"


def write(config: PeachConfig, *, force: bool = False) -> Path:
    """把设置写到 `config.path`。已存在且没给 `force` 就拒绝，不悄悄覆盖。"""
    path = config.path
    if path.exists() and not force:
        raise SettingsFileError(f"El archivo de ajustes ya existe; añade --force para sobrescribirlo: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render(config), encoding="utf-8")
    return path


def capture_existing(
    config: PeachConfig, *, replication_enabled: bool = True,
    overrides: dict[str, object] | None = None,
    mounts: dict[str, tuple[str, ...]] | None = None,
) -> PeachConfig:
    """把当前生效的配置整理成一份可写回的设置。

    `--from-existing` 用它：现有部署的坐标散在环境变量、平台默认和运行现场里，先按
    当前进程实际解析到的值落盘，再让命令行显式补上进程看不见的那几项（局域网地址、
    钥匙串账号名之类只有本机的人知道的事实）。

    `replication_enabled` 默认 True：加了 `--from-existing` 就说明这是一台已经在跑的
    机器，它的复制行为必须和现在一致，不能因为写了设置文件就静悄悄关掉。
    """
    overrides = {key: value for key, value in (overrides or {}).items()
                 if value is not None and value != ""}
    server = replace(config.server, **{
        key: value for key, value in overrides.items()
        if key in ServerSettings.__dataclass_fields__
    })
    replication = replace(config.replication, enabled=replication_enabled, **{
        key: value for key, value in overrides.items()
        if key in ReplicationSettings.__dataclass_fields__
    })
    # 共享目录和共享名先落成显式值：设置文件是给人读的，留空让人去猜默认规则不合适。
    if not replication.shared_root:
        replication = replace(replication, shared_root=str(config.shared_root))
    if not replication.smb_share:
        replication = replace(replication, smb_share=config.smb_share)
    return replace(
        config, server=server, replication=replication,
        directories={key: config.directories.get(key, key) for key in DIRECTORY_KEYS},
        mounts=dict(mounts) if mounts is not None else dict(config.mounts),
    )
