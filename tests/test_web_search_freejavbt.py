"""FreeJavBT como fuente principal de «Buscar en internet»: resultados y actrices de una ficha."""
import unittest

from peach import custom_metadata, web_search

SEARCH = """<div class="d-flex flex-wrap">
<div class="video-list-item"><div class="card"><a target="_blank" href="https://t.me/anuncio"><img data-src="/a.png"></a>
<div class="card-body"><a target="_blank" href="https://t.me/anuncio"><h5 class="card-title">Servicio X</h5>
<p class="card-text">Anuncio</p><span class="text-muted">2026-10-25</span></a></div></div></div>
<div class="video-list-item"><div class="card"><a href="https://freejavbt.com/es/BOIN-124"><img data-src="https://c0.jdbstatic.com/covers/ad/ADdM.jpg"></a>
<div class="card-body"><a href="https://freejavbt.com/es/BOIN-124"><h5 class="card-title">BOIN-124</h5>
<p class="card-text">揉み4時間</p><span class="text-muted">2012-08-03</span></a>
<div class="video-list-item-genres text-muted"><span>#巨乳</span></div></div></div></div></div>"""

WORK = """<div class="single-video-meta d-flex"><span>Actrices:&nbsp;</span><div>
<a class="actress text-primary" href="https://freejavbt.com/es/actor/MRJ4"> 志良玉弾吾 </a>
<a class="actress " href="https://freejavbt.com/es/actor/1KBW">
   JULIA
</a></div></div>"""


class FreeJavBTTests(unittest.TestCase):
    def test_search_page_gives_code_title_cover_and_date(self):
        url = 'https://freejavbt.com/es/search/julia%20boin'
        items = custom_metadata.parse_search(web_search.FREEJAVBT_SEARCH['search_fields'], url, SEARCH)
        own = [item for item in items if item['url'].startswith('https://freejavbt.com/')]
        self.assertEqual(own, [{'title': '揉み4時間', 'url': 'https://freejavbt.com/es/BOIN-124',
                                'image': 'https://c0.jdbstatic.com/covers/ad/ADdM.jpg',
                                'code': 'BOIN-124', 'date': '2012-08-03'}])

    def test_work_page_lists_actresses_without_male_actors(self):
        self.assertEqual(web_search.parse_freejavbt_actresses(WORK), [('1KBW', 'JULIA')])


if __name__ == '__main__':
    unittest.main()
