"""Fuentes de página web: selectores CSS, identidad de la obra y portada."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from peach import custom_metadata as custom

PAGE = """<html><head><title>ABW-001 en Ejemplo</title><script>var codigo = "ABW-001";</script></head>
<body><h1 class="titulo">Título de ejemplo</h1>
<span class="codigo">ABW-001</span>
<div class="estudio">Prestige</div><time class="fecha">2024-05-01</time>
<ul class="reparto"><li>Actriz Uno</li><li>Actriz Dos</li><li>Actriz Uno</li></ul>
<a class="tag">Drama</a><a class="tag">Oficina</a>
<img class="portada" src="/img/abw001.jpg"></body></html>"""


def definition(**changes):
    fields = {'code': 'span.codigo', 'title': 'h1.titulo', 'studio': '.estudio', 'release_date': 'time.fecha',
              'performers': 'ul.reparto li', 'tags': 'a.tag', 'cover': 'img.portada@src'}
    return dict(dict(name='Página de ejemplo', kind='html', endpoint='https://ejemplo.com/obra/{code}', fields=fields,
                     content_types=['censored'], enabled=True), **changes)


class HtmlSourceTests(unittest.TestCase):
    def test_reads_fields_with_css_selectors(self):
        record = custom.parse_html(definition(), 'ABW-001', PAGE)
        self.assertEqual(record.title, 'Título de ejemplo')
        self.assertEqual(record.studio, 'Prestige')
        self.assertEqual(record.release_date, '2024-05-01')
        self.assertEqual([row['japanese_name'] for row in record.performers], ['Actriz Uno', 'Actriz Dos'])
        self.assertEqual(record.tags, ('Drama', 'Oficina'))
        self.assertEqual(record.cover_urls, ('https://ejemplo.com/img/abw001.jpg',))
        self.assertEqual(record.provenance, 'custom-html')

    def test_code_read_from_page_must_match(self):
        with self.assertRaises(ValueError):
            custom.parse_html(definition(), 'ABW-002', PAGE)

    def test_without_code_selector_the_code_must_appear_in_visible_text(self):
        fields = dict(definition()['fields'])
        del fields['code']
        config = definition(fields=fields)
        self.assertEqual(custom.parse_html(config, 'ABW-001', PAGE).code, 'ABW-001')
        # el código solo dentro de un <script> no cuenta como prueba
        hidden = PAGE.replace('<span class="codigo">ABW-001</span>', '').replace('<title>ABW-001 en Ejemplo</title>', '')
        with self.assertRaises(ValueError):
            custom.parse_html(config, 'ABW-001', hidden)

    def test_invalid_selectors_and_kinds_are_refused(self):
        for fields in ({'title': 'h1[unclosed'}, {'title': 'h1@on click'}, {'code': 'span'}):
            with self.subTest(fields=fields), self.assertRaises(ValueError):
                custom.validate(definition(fields=fields))
        with self.assertRaises(ValueError):
            custom.validate(definition(kind='xml'))

    def test_json_sources_keep_their_key_and_html_sources_get_their_own(self):
        json_source = dict(name='API', endpoint='https://ejemplo.com/api/{code}', fields={'code': 'id'},
                           content_types=['censored'], enabled=True, id='custom-0123456789abcdef')
        before = custom.source_key(json_source)
        self.assertEqual(custom.source_key(dict(json_source, kind='json')), before)
        self.assertNotEqual(custom.source_key(dict(definition(), id=json_source['id'])), before)

    def test_query_fetches_the_page_and_saves_with_kind(self):
        with patch.object(custom, 'fetch_html', return_value=PAGE) as fetch:
            record = custom.query(definition(), 'ABW-001')
        self.assertEqual(fetch.call_args.args[0], 'https://ejemplo.com/obra/ABW-001')
        self.assertEqual(record.title, 'Título de ejemplo')
        with tempfile.TemporaryDirectory() as tmp:
            saved = custom.save(Path(tmp), definition())[0]
            self.assertEqual(custom.load(Path(tmp))[0]['kind'], 'html')
            self.assertEqual(saved['fields']['cover'], 'img.portada@src')


if __name__ == '__main__':
    unittest.main()
