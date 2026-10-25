"""Búsqueda en internet: actrices y obras en FreeJavBT (fuente principal), JavDB y las fuentes
web que configure el usuario.

Solo consulta; añadir algo (suscribirse a una actriz, «Lo quiero» de una obra) lo hacen los
puntos de escritura que ya existen (`/api/feeds/source`, `/api/wants`)."""
from __future__ import annotations

import re
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote, urlsplit

from bs4 import BeautifulSoup

from . import custom_metadata, wants
from .catalog_rules import normalise_code_key, release_code_from_text
from .http import HttpRequest

#: Fuente principal. Sus números de actriz (`/es/actor/1KBW`) son los mismos que los de JavDB,
#: así que suscribirse desde aquí usa la misma página de estrenos de siempre.
FREEJAVBT_BASE = 'https://freejavbt.com/es/'
FREEJAVBT_SEARCH = {
    'id': 'freejavbt', 'name': 'FreeJavBT', 'search_endpoint': FREEJAVBT_BASE + 'search/{query}',
    'search_fields': {'item': '.video-list-item', 'title': '.card-text', 'code': '.card-title',
                      'link': '.card-body a@href', 'image': 'img@data-src',
                      'date': '.card-body span.text-muted'},
}
#: JavDB también es una «fuente web con búsqueda», con los mismos selectores que puede escribir el usuario.
JAVDB_SEARCH = {
    'id': 'javdb', 'name': 'JavDB', 'search_endpoint': 'https://javdb.com/search?q={query}&f=all',
    'search_fields': {'item': '.movie-list .item', 'title': '.video-title', 'code': '.video-title strong',
                      'link': 'a.box@href', 'image': 'img@src', 'date': '.meta'},
}
SEARCH_TIMEOUT = 20.0
MAX_QUERY = 100
#: Cuántas fichas de obra se abren para saber quién sale en ellas.
ACTRESS_PAGES = 4
ACTOR_LINK = re.compile(r'/actor/([A-Za-z0-9]{1,16})/?$')


def _clean_query(raw: object) -> str:
    query = ' '.join(str(raw or '').split())
    if not query:
        raise ValueError("Escribe qué quieres buscar")
    if len(query) > MAX_QUERY:
        raise ValueError(f"La búsqueda puede tener como máximo {MAX_QUERY} caracteres")
    return query


def _get(contract, url: str, site: str) -> str:
    from .web_feeds import FETCH_MAX_BYTES, _transport
    response = _transport(contract)(HttpRequest('GET', url, {'Accept': 'text/html'}), SEARCH_TIMEOUT, FETCH_MAX_BYTES)
    if response.status != 200:
        raise ValueError(f"{site} respondió HTTP {response.status}")
    return response.body.decode('utf-8', 'replace')


def _freejavbt_works(contract, query: str) -> list[dict]:
    url = FREEJAVBT_SEARCH['search_endpoint'].replace('{query}', quote(query, safe=''))
    items = custom_metadata.parse_search(FREEJAVBT_SEARCH['search_fields'], url, _get(contract, url, 'FreeJavBT'))
    # Fuera los anuncios: solo quedan las fichas del propio sitio.
    return [item for item in items if urlsplit(item['url']).hostname == 'freejavbt.com']


def parse_freejavbt_actresses(html: str) -> list[tuple[str, str]]:
    """(número, nombre) de las actrices de una ficha; `text-primary` marca a los actores."""
    found = []
    for link in BeautifulSoup(html, 'html.parser').select('a.actress'):
        match = ACTOR_LINK.search(urlsplit(str(link.get('href') or '')).path)
        name = ' '.join(link.get_text(' ', strip=True).split())
        if match and name and 'text-primary' not in (link.get('class') or []):
            found.append((match.group(1), name))
    return found


def _freejavbt_actresses(contract, query: str, works: list[dict]) -> dict:
    """Actrices que salen en las primeras obras encontradas: primero las que coinciden con
    alguna palabra buscada, luego las que más se repiten."""
    pages = [item['url'] for item in works if item.get('code')][:ACTRESS_PAGES]
    if not pages:
        return {'candidates': []}
    with ThreadPoolExecutor(max_workers=ACTRESS_PAGES) as pool:
        def read(url):
            try:
                return parse_freejavbt_actresses(_get(contract, url, 'FreeJavBT'))
            except Exception:  # noqa: BLE001 - una ficha que falla no tumba la lista
                return []
        rows = [row for found in pool.map(read, pages) for row in found]
    names = dict(rows)
    counts = Counter(actor_id for actor_id, _ in rows)
    words = {word.casefold() for word in query.split()}

    def matches(actor_id):
        return any(word in words for word in names[actor_id].casefold().split()) \
            or names[actor_id].casefold() in query.casefold()
    order = sorted(counts, key=lambda actor_id: (not matches(actor_id), -counts[actor_id]))
    from .web_feeds import _describe_card
    with contract.database.read_connection() as connection:
        candidates = [dict(_describe_card(connection, {'id': actor_id, 'names': [names[actor_id]], 'record': ''}),
                           url=f'{FREEJAVBT_BASE}actor/{actor_id}') for actor_id in order]
    return {'candidates': candidates, 'site': 'FreeJavBT'}


def _javdb_works(contract, query: str) -> list[dict]:
    url = JAVDB_SEARCH['search_endpoint'].replace('{query}', quote(query, safe=''))
    html = _get(contract, url, 'JavDB')
    from . import javdb
    if javdb.LOGIN.search(html):
        raise ValueError("JavDB pide iniciar sesión; inténtalo más tarde")
    return custom_metadata.parse_search(JAVDB_SEARCH['search_fields'], url, html)


def _javdb_actresses(contract, query: str) -> dict:
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
            found = broader
    return dict(found, site='JavDB')


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


def _source_result(source: dict, run) -> dict:
    try:
        items = run()
        return {'id': source['id'], 'name': source['name'], 'items': items, 'error': ''}
    except Exception as error:  # noqa: BLE001 - cada fuente falla por su lado; las demás siguen
        return {'id': source['id'], 'name': source['name'], 'items': [], 'error': str(error) or type(error).__name__}


def q_web_search(contract, args) -> dict:
    query = _clean_query(args.get('q'))
    custom = []
    try:
        custom = [entry for entry in custom_metadata.load(contract.follow_secrets_root)
                  if entry.get('enabled') and entry.get('kind') == 'html' and entry.get('search_endpoint')]
    except ValueError:
        pass

    def run_custom(source):
        return _source_result(source, lambda: custom_metadata.search(
            source, query, timeout=SEARCH_TIMEOUT, secrets_root=contract.follow_secrets_root))

    with ThreadPoolExecutor(max_workers=6) as pool:
        main = pool.submit(_source_result, FREEJAVBT_SEARCH, lambda: _freejavbt_works(contract, query))
        javdb = pool.submit(_source_result, JAVDB_SEARCH, lambda: _javdb_works(contract, query))
        others = list(pool.map(run_custom, custom))
        main = main.result()
        try:
            actresses = _freejavbt_actresses(contract, query, main['items'])
        except Exception as error:  # noqa: BLE001
            actresses = {'candidates': [], 'error': str(error) or type(error).__name__}
        if not actresses['candidates']:
            try:
                actresses = _javdb_actresses(contract, query)
            except Exception as error:  # noqa: BLE001
                actresses.setdefault('error', str(error) or type(error).__name__)
        results = [main, javdb.result(), *others]
    for result in results:
        _mark(contract, result['items'])
    code = release_code_from_text(query) if re.search(r'\d', query) else None
    exact = _mark(contract, [{'code': code}])[0] if code else None
    return {'q': query, 'code': exact, 'actresses': actresses, 'sources': results}
