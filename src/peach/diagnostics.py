"""CLI 与 API 共用的分项诊断；不修复账本、配置、工具或挂载。"""
from __future__ import annotations

import ipaddress
import os
import platform
import shutil
import socket
import sqlite3
import sys
import tempfile
import time
from contextlib import closing

from . import __version__, access, distribution, settings_file
from .ffmpeg import FFmpegResolver, binary_diagnostics
from .health import inspect_database
from .mount_reachability import MountReachability, PROBE_TIMEOUT


def item(label, status, reason, *, action="", target=None, details=None):
    return {"label": label, "status": status, "reason": reason, "action": action,
            "target": target, "details": details or {}}


def doctor_endpoint(config):
    """选择配置端口或具有 TLS 材料的源码托盘入口。"""
    configured = (config.server.host, config.server.port)
    if distribution.standalone():
        return configured
    tls = config.directory("secrets") / "tls"
    if not all((tls / name).is_file() for name in ("peach-local-ca.crt", "peach.crt", "peach.key")):
        return configured
    if sys.platform == "darwin":
        return "0.0.0.0", 8443
    from .mdns import lan_ipv4
    try:
        address = os.environ.get("PEACH_LAN_ADDRESS") or lan_ipv4()
    except (OSError, RuntimeError):
        address = "0.0.0.0"
    return address, 443


def configuration(config, configured, *, validate=True):
    try:
        if validate:
            settings_file.load_config(environ=dict(os.environ, PEACH_DATA_ROOT=str(config.data_root)))
        elif settings_file.error():
            raise settings_file.SettingsFileError("No se puede leer el archivo de configuración")
    except settings_file.SettingsFileError:
        return item("Configuración", "failed", "No se puede leer el archivo de configuración", action="Reparar el archivo de configuración en este equipo")
    if not configured:
        return item("Configuración", "failed", "Aún no se completó la configuración inicial", action="Completar la configuración inicial", target="/settings/library")
    return item("Configuración", "ok", "La configuración se puede leer")


def database_checks(settings):
    state = inspect_database(settings.db_path)
    reasons = {"missing": "La base de datos no existe", "empty": "La base de datos aún no está inicializada", "unavailable": "No se puede leer la base de datos"}
    readable = state["database"] == "available" and state["readable"]
    database = item("Base de datos", "ok" if readable else "failed",
                    "La base de datos se puede leer" if readable else reasons.get(state["database"], "数据库结构无法读取"),
                    action="" if readable else "Revisar la base de datos local y las copias de seguridad", details={"state": state["database"]})
    schema_reasons = {"current": "Migraciones verificadas", "pending": "Hay migraciones pendientes", "empty": "La base de datos aún no está inicializada",
                      "mismatch": "El registro de migraciones no coincide con el programa actual", "unavailable": "No se obtuvo la verificación de migraciones"}
    current = state["schema"] == "current"
    schema = item("Migraciones de la base de datos", "ok" if current else "failed", schema_reasons[state["schema"]],
                  action="" if current else "Revisar en este equipo las migraciones y copias de seguridad",
                  details={key: state[key] for key in ("schema", "version", "pending", "mismatched", "unknown_versions")})
    return database, schema


def tools(settings, *, inspect=True):
    resolver = FFmpegResolver(settings.ffmpeg_root)
    found = {}
    for name, choice in (("ffmpeg", resolver.ffmpeg()), ("ffprobe", resolver.ffprobe())):
        found[name] = (binary_diagnostics(choice, decoders=name == 'ffmpeg') if inspect else
                       {'available': choice is not None, 'source': choice.source if choice else None,
                        'path': str(choice.path) if choice else None})
    openssl = shutil.which("openssl")
    found["openssl"] = {"available": openssl is not None, "source": "path" if openssl else None,
                        "path": openssl}
    missing = [name for name, value in found.items() if not value["available"]]
    unavailable = [name for name in ('ffmpeg', 'ffprobe') if found[name]['available'] and not found[name].get('usable', True)]
    incomplete = found['ffmpeg'].get('usable') and not found['ffmpeg'].get('av1_software')
    problems = (["No encontrado:" + "、".join(missing)] if missing else [])
    problems += (["No se puede ejecutar:" + "、".join(unavailable)] if unavailable else [])
    problems += ["A FFmpeg le falta el decodificador por software de AV1"] if incomplete else []
    return item("FFmpeg／OpenSSL", 'warning' if problems else 'ok',
                '；'.join(problems) or ("Las herramientas multimedia funcionan y el decodificador AV1 por software está disponible" if inspect else "Se encontró la ruta de las herramientas"),
                action="Actualizar herramientas multimedia" if problems else '', target='/settings/maintenance' if problems else None, details=found)


def security(settings):
    policy = access.load(settings.access_path)
    try:
        loopback = settings.host == "localhost" or ipaddress.ip_address(settings.host).is_loopback
    except ValueError:
        loopback = False
    protected = policy["mode"] == "password" or (policy["mode"] == "legacy" and bool(settings.token))
    exposed = not loopback or settings.tunnel_enabled
    if policy["mode"] == "locked":
        return item("Seguridad del acceso", "failed", "No se puede leer la configuración de la contraseña de acceso", action="Revisar en este equipo la configuración de la contraseña de acceso")
    if exposed and not protected:
        return item("Seguridad del acceso", "warning", "El acceso por red local o público no tiene contraseña",
                    action="Activar la contraseña de acceso en la configuración", target="/settings/network", details={"exposed": True, "protected": False})
    return item("Seguridad del acceso", "ok", "La contraseña de acceso está activada" if protected else "Solo escucha en este equipo",
                details={"exposed": exposed, "protected": protected})


def media_mounts(snapshot):
    if not snapshot["sources"]:
        return item("Montajes de medios", "disabled", "No hay fuentes locales configuradas")
    states = {"ok": "ok", "degraded": "warning", "checking": "unknown"}
    reason = "La fuente se puede leer" if snapshot["state"] == "ok" else "；".join(snapshot["warnings"]) or "La comprobación de montajes aún no terminó"
    return item("Montajes de medios", states[snapshot["state"]], reason,
                action="Revisar las carpetas de medios y los montajes" if snapshot["state"] != "ok" else "", target="/settings/library",
                details=snapshot)


def component_checks(settings, snapshot, *, config=None, validate_config=True, inspect_tools=True):
    config = config or settings_file.active()
    database, schema = database_checks(settings)
    checks = {"database": database, "schema": schema, "configured": configuration(config, settings.configured, validate=validate_config),
              "media_mounts": media_mounts(snapshot), "security": security(settings)}
    checks["ffmpeg"] = tools(settings, inspect=inspect_tools)
    return checks


def writable_root(root):
    try:
        with tempfile.TemporaryFile(dir=root, prefix=".peach-doctor-") as probe:
            probe.write(b"peach")
            probe.flush()
    except PermissionError:
        return item("Carpeta de datos", "failed", "Sin permiso para escribir en la carpeta de datos", action="Ajustar los permisos de escritura de la carpeta de datos")
    except OSError:
        return item("Carpeta de datos", "failed", "No se puede escribir en la carpeta de datos", action="Revisar la carpeta de datos y el espacio libre")
    return item("Carpeta de datos", "ok", "Escritura temporal y limpieza correctas")


def port_status(host, port):
    host = "127.0.0.1" if host == "localhost" else host
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        return item("Puerto del servicio", "unknown", "La dirección de escucha no es una IP; no se obtuvo el estado del puerto", details={"port": port})
    family = socket.AF_INET6 if address.version == 6 else socket.AF_INET
    try:
        with socket.socket(family, socket.SOCK_STREAM) as probe:
            probe.bind((host, port))
    except OSError as error:
        import errno
        if error.errno == errno.EADDRINUSE or getattr(error, "winerror", None) == 10048:
            return item("Puerto del servicio", "ok", "El puerto está en uso", details={"port": port, "state": "in_use"})
        return item("Puerto del servicio", "unknown", "No se obtuvo el estado del puerto", details={"port": port})
    return item("Puerto del servicio", "ok", "El puerto está disponible", details={"port": port, "state": "available"})


def recent_failure(path):
    try:
        with closing(sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True, timeout=1)) as connection:
            connection.execute("PRAGMA query_only=ON")
            row = connection.execute("SELECT id,finished_at FROM task_run WHERE status='failed' "
                                     "ORDER BY finished_at DESC,id DESC LIMIT 1").fetchone()
    except (sqlite3.Error, OSError):
        return item("Tareas en segundo plano", "unknown", "No se obtuvieron los registros de tareas fallidas")
    if row is None:
        return item("Tareas en segundo plano", "ok", "No hay tareas fallidas registradas")
    # 不公开任务 error、参数或结果原文，它们可能包含凭据和媒体路径。
    moment = str(row[1] or "")
    safe_time = moment if len(moment) <= 32 and all(c in "0123456789-:+.TZ " for c in moment) else None
    return item("Tareas en segundo plano", "warning", "Hay tareas fallidas registradas", action="Ver las tareas fallidas en Actividad",
                target="/tasks", details={"id": row[0], "finished_at": safe_time})


def probe_mounts(roots):
    monitor = MountReachability(roots)
    deadline = time.monotonic() + PROBE_TIMEOUT + 1.5
    try:
        while True:
            monitor.tick()
            snapshot = monitor.summary()
            if all(row["state"] != "checking" for row in snapshot["sources"]) or time.monotonic() >= deadline:
                return snapshot
            time.sleep(0.05)
    finally:
        monitor.stop()


def report(settings, snapshot, *, config=None):
    from . import library_diagnostics
    config = config or settings_file.active()
    checks = component_checks(settings, snapshot, config=config)
    checks.update(data_root=writable_root(config.data_root), port=port_status(settings.host, settings.port),
                  tasks=recent_failure(settings.db_path),
                  version=item("Versión", "ok", f"Peach {__version__} · Python {platform.python_version()}",
                               details={"peach": __version__, "python": platform.python_version()}))
    statuses = {check["status"] for check in checks.values()}
    state = "failed" if "failed" in statuses else "warning" if statuses & {"warning", "unknown"} else "ok"
    return {"version": __version__, "status": state, "checks": checks,
            "library": library_diagnostics.library(settings, config),
            "sources": library_diagnostics.sources(settings, config)}


def health_components(settings, snapshot):
    checks = component_checks(settings, snapshot, validate_config=False, inspect_tools=False)
    # 公开健康检查只保留分项原因；工具路径与详细修法由本机诊断提供。
    return {key: {name: value[name] for name in ("status", "reason")} for key, value in checks.items()}
