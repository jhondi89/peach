"""Búsqueda en internet: actrices y obras en JavDB y en las fuentes web que configure el usuario.

Solo consulta; añadir algo (suscribirse a una actriz, «Lo quiero» de una obra) lo hacen los
puntos de escritura que ya existen (`/api/feeds/source`, `/api/wants`)."""
from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote

from . import custom_metadata, wants
from .catalog_rules import normalise_code_key, release_code_from_text
from .http import HttpRequest

#: JavDB también es una «fuente web con búsqueda», con los mismos selectores que puede escribir el usuario.
JAVDB_SEARCH = {
    'id': 'javdb', 'name': 'JavDB', 'search_endpoint': 'https://javdb.com/search?q={query}&f=all',
    'search_fields': {'item': '.movie-list .item', 'title': '.video-title', 'code': '.video-title strong',
                      'link': 'a.box@href', 'image': 'img@src', 'date': '.meta'},
}
SEARCH_TIMEOUT = 20.0
MAX_QUERY = 100


def _clean_query(raw: object) -> str:
    query = ' '.join(str(raw or '').split())
    if not query:
        raise ValueError("Escribe qué quieres buscar")
    if len(query) > MAX_QUERY:
        raise ValueError(f"La búsqueda puede tener como máximo {MAX_QUERY} caracteres")
    return query


def _javdb_works(contract, query: str) -> list[dict]:
    from .web_feeds import FETCH_MAX_BYTES, _transport
    url = JAVDB_SEARCH['search_endpoint'].replace('{query}', quote(query, safe=''))
    response = _transport(contract)(HttpRequest('GET', url, {'Accept': 'text/html'}), SEARCH_TIMEOUT, FETCH_MAX_BYTES)
    if response.status != 200:
        raise ValueError(f"JavDB respondió HTTP {response.status}")
    html = response.body.decode('utf-8', 'replace')
    from . import javdb
    if javdb.LOGIN.search(html):
        raise ValueError("JavDB pide iniciar sesión; inténtalo más tarde")
    return custom_metadata.parse_search(JAVDB_SEARCH['search_fields'], url, html)


def _actresses(contract, query: str) -> dict:
    """Actrices en JavDB. Si el nombre completo no da nada, se prueba con la primera palabra
    (por ejemplo, «julia boin» → «julia») y se avisa de que es una búsqueda aproximada."""
    from .web_feeds import q_feed_lookup
    found = q_feed_lookup(contract, {'q': query})
    words = query.split()
    if not found['candidates'] and len(words) > 1:
        broader = q_feed_lookup(contract, {'q': words[0]})
        if broader['candidates']:
            broader['approximate'] = True
            broader['asked'] = query
            return broader
    return found


def _mark(contract, items: list[dict]) -> list[dict]:
    """Marca qué resultados ya están en la colección o en «Lo quiero»."""
    keys = {normalise_code_key(item['code']) for item in items if item.get('code')}
    keys.discard('')
    if not keys:
        return items
    with contract.database.read_connection() as connection:
        wanted = wants.wanted_keys(connection, keys)
        owned = {key for key in keys if wants.in_library(connection, key)}
    for item in items:
        key = normalise_code_key(item['code']) if item.get('code') else ''
        item['wanted'] = key in wanted
        item['owned'] = key in owned
    return items


def q_web_search(contract, args) -> dict:
    query = _clean_query(args.get('q'))
    sources = [dict(JAVDB_SEARCH, builtin=True)]
    try:
        sources += [entry for entry in custom_metadata.load(contract.follow_secrets_root)
                    if entry.get('enabled') and entry.get('kind') == 'html' and entry.get('search_endpoint')]
    except ValueError:
        pass

    def run_source(source):
        try:
            if source.get('builtin'):
                items = _javdb_works(contract, query)
            else:
                items = custom_metadata.search(source, query, timeout=SEARCH_TIMEOUT,
                                               secrets_root=contract.follow_secrets_root)
            return {'id': source['id'], 'name': source['name'], 'items': _mark(contract, items), 'error': ''}
        except Exception as error:  # noqa: BLE001 - cada fuente falla por su lado; las demás siguen
            return {'id': source['id'], 'name': source['name'], 'items': [], 'error': str(error) or type(error).__name__}

    def run_actresses():
        try:
            return _actresses(contract, query)
        except Exception as error:  # noqa: BLE001
            return {'candidates': [], 'error': str(error) or type(error).__name__}

    with ThreadPoolExecutor(max_workers=4) as pool:
        actresses = pool.submit(run_actresses)
        results = list(pool.map(run_source, sources))
        actresses = actresses.result()
    code = release_code_from_text(query) if re.search(r'\d', query) else None
    exact = _mark(contract, [{'code': code}])[0] if code else None
    return {'q': query, 'code': exact, 'actresses': actresses, 'sources': results}
