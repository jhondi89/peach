"""Fuentes configurables: una API JSON o una página web pública como fuente de datos.

Ambas usan un punto HTTPS fijo con `{code}`; la JSON mapea rutas con puntos y la página web usa
selectores CSS (`selector` o `selector@atributo`). El código devuelto se comprueba siempre."""
from __future__ import annotations

import ipaddress
import hashlib
import json
import re
import secrets
import time
from pathlib import Path
from urllib.parse import quote, urljoin, urlsplit

import soupsieve
from bs4 import BeautifulSoup
from curl_cffi import CurlOpt, ffi, lib, requests
from filelock import FileLock

from .fsutil import atomic_write_text
from .http import host_addresses, public_https_url
from .metadata import identifies_code, validate_provider_code
from .metadata_routes import CONTENT_TYPES
from .sources.base import SiteRecord

FIELDS = ('code', 'title', 'studio', 'series', 'release_date', 'performers', 'tags', 'cover')
KINDS = ('json', 'html')
MAX_BYTES = 1024 * 1024
MAX_HTML_BYTES = 4 * 1024 * 1024
MAX_SOURCES = 12
_PATH = re.compile(r'[A-Za-z_][A-Za-z_0-9]*(?:\.[A-Za-z_][A-Za-z_0-9]*|\.\d+){0,7}')
_ID = re.compile(r'custom-[a-f0-9]{16}')
_ATTR = re.compile(r'[A-Za-z_:][A-Za-z0-9_:.-]{0,40}')


def _selector(value: str) -> tuple[str, str]:
    """`selector@atributo` -> (selector, atributo); sin `@` se lee el texto del elemento."""
    selector, _, attr = value.rpartition('@') if '@' in value else (value, '', '')
    return selector.strip(), attr.strip()


def _valid_selector(value: object) -> bool:
    if not isinstance(value, str) or not value.strip() or len(value) > 300 or any(ord(c) < 32 for c in value):
        return False
    selector, attr = _selector(value)
    if not selector or (attr and not _ATTR.fullmatch(attr)):
        return False
    try:
        soupsieve.compile(selector)
    except Exception:
        return False
    return True


def validate(raw: dict) -> dict:
    if not isinstance(raw, dict):
        raise ValueError("La configuración de la fuente debe ser un objeto")
    name = str(raw.get('name', '')).strip()
    endpoint = str(raw.get('endpoint', '')).strip()
    if not name or len(name) > 80:
        raise ValueError("El nombre de la fuente debe tener entre 1 y 80 caracteres")
    if endpoint.count('{code}') != 1 or '{' in endpoint.replace('{code}', '') or '}' in endpoint.replace('{code}', ''):
        raise ValueError("La dirección de la API debe incluir un {code}")
    parsed = urlsplit(endpoint.replace('{code}', 'ABW-001'))
    if (not public_https_url(endpoint.replace('{code}', 'ABW-001')) or parsed.port not in (None, 443)
            or not re.fullmatch(r'[a-z0-9-]+(?:\.[a-z0-9-]+)+', parsed.hostname or '')
            or parsed.fragment or '{code}' in endpoint.split('://', 1)[-1].split('/', 1)[0]
            or len(endpoint) > 2048 or any(ord(c) < 33 for c in endpoint)):
        raise ValueError("La API debe usar una dirección HTTPS con dominio público fijo y puerto 443")
    kind = raw.get('kind', 'json')
    if kind not in KINDS:
        raise ValueError("Elige si la fuente es una API JSON o una página web")
    mapping = raw.get('fields')
    if not isinstance(mapping, dict) or set(mapping) - set(FIELDS):
        raise ValueError("La asignación de campos no es válida")
    mapping = {key: value for key, value in mapping.items() if value}
    if kind == 'json':
        if not mapping.get('code'):
            raise ValueError("Escribe la ruta del campo de código en la respuesta")
        if any(not isinstance(v, str) or not _PATH.fullmatch(v) for v in mapping.values()):
            raise ValueError("La asignación de campos solo acepta rutas con puntos formadas por claves de objeto o índices de lista")
    else:
        if not mapping.get('title'):
            raise ValueError("Escribe al menos el selector del título")
        bad = [key for key, value in mapping.items() if not _valid_selector(value)]
        if bad:
            raise ValueError(f"El selector CSS de {bad[0]} no es válido; usa `selector` o `selector@atributo`")
    kinds = raw.get('content_types', [])
    if not isinstance(kinds, list) or not kinds or any(kind not in CONTENT_TYPES for kind in kinds):
        raise ValueError("Elige al menos un tipo de contenido válido")
    if not isinstance(raw.get('enabled', False), bool):
        raise ValueError("El estado de activación debe ser verdadero o falso")
    network = raw.get('network', 'direct')
    if network not in ('direct', 'peach_proxy'):
        raise ValueError("Elige conexión directa o proxy de Peach")
    code_format = raw.get('code_format', 'original')
    if code_format not in ('original', 'lowercase', 'compact', 'underscore'):
        raise ValueError("El formato del código no es válido")
    return dict(name=name, kind=kind, endpoint=endpoint, fields=dict(mapping),
                content_types=list(dict.fromkeys(kinds)), enabled=raw.get('enabled', False), network=network,
                code_format=code_format)


def endpoint(config: dict, code: str) -> str:
    shape = config.get('code_format', 'original')
    value = code.lower() if shape == 'lowercase' else code.replace('-', '') if shape == 'compact' else (
        code.replace('-', '_') if shape == 'underscore' else code)
    return config['endpoint'].replace('{code}', quote(value, safe=''))


def source_key(config: dict) -> str:
    """查询规则的指纹隔离候选、成功缓存和缺失记忆。"""
    fields = {key: config.get(key) for key in ('endpoint', 'fields', 'code_format', 'network')}
    if config.get('kind', 'json') != 'json':
        fields['kind'] = config['kind']
    version = hashlib.sha256(json.dumps(fields, sort_keys=True).encode()).hexdigest()[:12]
    return f"{config['id']}-{version}"


def load(root: Path) -> list[dict]:
    path = Path(root) / 'custom-metadata.json'
    if not path.exists():
        return []
    rows = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(rows, list) or len(rows) > MAX_SOURCES:
        raise ValueError("La configuración de la fuente personalizada no es válida")
    return [dict(validate(row), id=row['id']) for row in rows if _ID.fullmatch(str(row.get('id', '')))]


def save(root: Path, body: dict) -> list[dict]:
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)
    with FileLock(str(root / 'custom-metadata.lock')):
        rows = load(root)
        identity = str(body.get('id', ''))
        if identity and not any(row['id'] == identity for row in rows):
            raise ValueError("La fuente no existe; actualiza la página")
        if body.get('action') == 'delete':
            if not identity:
                raise ValueError("Elige una fuente")
            rows = [row for row in rows if row['id'] != identity]
        else:
            incoming = dict(validate(body), id=identity or 'custom-' + secrets.token_hex(8))
            rows = [incoming if row['id'] == identity else row for row in rows]
            if not identity:
                rows.append(incoming)
            if len(rows) > MAX_SOURCES:
                raise ValueError(f"Se pueden guardar como máximo {MAX_SOURCES} fuentes")
        atomic_write_text(root / 'custom-metadata.json', json.dumps(rows, ensure_ascii=False))
        return rows


def _value(document, path):
    for key in path.split('.'):
        if isinstance(document, dict):
            document = document.get(key)
        elif isinstance(document, list) and key.isdecimal() and int(key) < len(document):
            document = document[int(key)]
        else:
            return None
    return document


def parse(config: dict, code: str, document: object) -> SiteRecord:
    config = dict(validate(config), id=config.get('id', 'custom-preview'))
    values = {field: _value(document, path) for field, path in config['fields'].items()}
    def text(field):
        value = values.get(field)
        if value is None:
            return ''
        if not isinstance(value, (str, int, float)) or isinstance(value, bool) or len(str(value)) > 4096:
            raise ValueError(f"El campo {field} necesita texto o un número")
        return str(value).strip()
    def strings(field):
        value = values.get(field)
        if value is None:
            return ()
        if not isinstance(value, list) or len(value) > 100 or any(not isinstance(v, str) or len(v) > 256 for v in value):
            raise ValueError(f"El campo {field} necesita una lista de textos")
        return tuple(dict.fromkeys(v.strip() for v in value if v.strip()))
    returned_code = text('code')
    # 身份只核对响应字段，查询 URL 不能替来源证明自己答对了。
    if not returned_code or not identifies_code(code, {'id': returned_code}):
        raise ValueError("El código que devolvió la fuente no coincide con el consultado")
    return SiteRecord(source=config['id'], provenance='custom-json', code=returned_code,
                      source_url=endpoint(config, code),
                      title=text('title'), studio=text('studio'), series=text('series'),
                      release_date=text('release_date'),
                      performers=tuple({'japanese_name': name} for name in strings('performers')),
                      tags=strings('tags') if 'tags' in values else None,
                      cover_urls=_cover(text('cover'), endpoint(config, code)), confidence=0.5)


def _cover(value: str, base: str) -> tuple[str, ...]:
    """Una dirección de portada https pública; las relativas se resuelven contra la página."""
    if not value:
        return ()
    url = urljoin(base, value)
    return (url,) if url.startswith('https://') and public_https_url(url) else ()


def _compact(value: str) -> str:
    return re.sub(r'[^0-9A-Z]', '', value.upper())


def parse_html(config: dict, code: str, html: str) -> SiteRecord:
    """Lee una página con los selectores CSS de la fuente.

    Si hay selector de código, el código leído debe ser la obra pedida; si no lo hay, el código
    tiene que aparecer en el texto de la página, para no aceptar una página de búsqueda sin
    resultados o una portada genérica como datos de esta obra."""
    config = dict(validate(config), id=config.get('id', 'custom-preview'))
    if config['kind'] != 'html':
        raise ValueError("Esta fuente no es una página web")
    page = BeautifulSoup(html, 'html.parser')
    for hidden in page(['script', 'style', 'noscript', 'template']):
        hidden.decompose()

    def read(element, attr):
        value = element.get(attr) if attr else element.get_text(' ', strip=True)
        if isinstance(value, list):
            value = ' '.join(value)
        return ' '.join(str(value or '').split())

    def one(field):
        if field not in config['fields']:
            return ''
        selector, attr = _selector(config['fields'][field])
        element = page.select_one(selector)
        value = read(element, attr) if element is not None else ''
        return value[:4096]

    def many(field):
        if field not in config['fields']:
            return None
        selector, attr = _selector(config['fields'][field])
        values = [read(element, attr) for element in page.select(selector, limit=100)]
        return tuple(dict.fromkeys(value[:256] for value in values if value))

    returned_code = one('code')
    if returned_code:
        if not identifies_code(code, {'id': returned_code}):
            raise ValueError("El código que devolvió la fuente no coincide con el consultado")
    else:
        if 'code' in config['fields'] or _compact(code) not in _compact(page.get_text(' ')):
            raise ValueError("La página no muestra el código consultado; no se aceptan sus datos")
        returned_code = code
    title = one('title')
    if not title:
        raise ValueError("La página no tiene título con el selector configurado")
    performers = many('performers') or ()
    return SiteRecord(source=config['id'], provenance='custom-html', code=returned_code,
                      source_url=endpoint(config, code), title=title, studio=one('studio'),
                      series=one('series'), release_date=one('release_date'),
                      performers=tuple({'japanese_name': name} for name in performers),
                      tags=many('tags'), cover_urls=_cover(one('cover'), endpoint(config, code)),
                      confidence=0.5)


def _remaining_seconds(deadline: float) -> float:
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise ValueError("Se agotó el tiempo de la consulta a la fuente")
    return remaining


def fetch_json(url: str, timeout: float, *, client_options=None):
    return json.loads(_fetch(url, timeout, client_options=client_options, accept='application/json', limit=MAX_BYTES))


def fetch_html(url: str, timeout: float, *, client_options=None) -> str:
    body = _fetch(url, timeout, client_options=client_options,
                  accept='text/html,application/xhtml+xml', limit=MAX_HTML_BYTES)
    return body.decode('utf-8', errors='replace')


def _fetch(url: str, timeout: float, *, client_options, accept: str, limit: int) -> bytes:
    expires = time.monotonic() + timeout
    _remaining_seconds(expires)
    host = urlsplit(url).hostname or ''
    addresses = host_addresses(host)
    _remaining_seconds(expires)
    if not addresses or any(not ipaddress.ip_address(ip).is_global for ip in addresses):
        raise ValueError("El dominio de la fuente debe resolver a una dirección pública")
    address = addresses[0]
    if ':' in address:
        address = f'[{address}]'
    # CONNECT_TO 固定已验证地址，HTTP 代理也只 CONNECT 到该公网 IP，TLS 仍校验原域名。
    options = dict(client_options or {'trust_env': False})
    # curl_cffi 0.16.3 的 CONNECT_TO 接收原生 slist；Session 关闭后才释放。
    target = ffi.gc(lib.curl_slist_append(ffi.NULL, f'{host}:443:{address}:443'.encode()), lib.curl_slist_free_all)
    curl_options = {CurlOpt.CONNECT_TO: target}
    if not options.get('proxy') and not options.get('trust_env'):
        curl_options[CurlOpt.NOPROXY] = '*'
    with requests.Session(curl_options=curl_options, **options) as client:
        try:
            with client.stream('GET', url, timeout=_remaining_seconds(expires), allow_redirects=False,
                               headers={'Accept': accept}) as response:
                if response.status_code != 200:
                    raise ValueError(f"La fuente respondió HTTP {response.status_code}")
                chunks, total = [], 0
                for chunk in response.iter_content():
                    total += len(chunk)
                    if total > limit:
                        raise ValueError(f"La respuesta de la fuente supera {limit // (1024 * 1024)} MiB")
                    chunks.append(chunk)
                return b''.join(chunks)
        except requests.exceptions.RequestException as error:
            raise ValueError("No se pudo conectar con la fuente") from error


def query(config: dict, code: str, *, deadline=None, secrets_root=None) -> SiteRecord:
    checked = validate(config)
    code = validate_provider_code(code)
    expires = time.monotonic() + 15.0
    if deadline is not None:
        expires = min(expires, deadline)
    _remaining_seconds(expires)
    url = endpoint(checked, code)
    options = None
    if checked['network'] == 'peach_proxy':
        if secrets_root is None:
            raise ValueError("No se obtuvo la configuración del proxy de Peach")
        from .peach_proxy import client_options
        options = client_options(Path(secrets_root))
    if checked['kind'] == 'html':
        return parse_html(config, code, fetch_html(url, _remaining_seconds(expires), client_options=options))
    try:
        document = fetch_json(url, _remaining_seconds(expires), client_options=options)
    except (json.JSONDecodeError, UnicodeError) as error:
        raise ValueError("La respuesta de la fuente no es JSON válido") from error
    return parse(config, code, document)
