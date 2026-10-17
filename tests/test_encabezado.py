"""Componente compartido: integración con el dist y páginas hermanas, sin navegador."""
import json
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from contenido import objeto_t
from encabezado import encabezado_sate, pestanas_encabezado


class BaseEncabezado(HTMLParser):
    """Conserva el marcado base; las acciones inyectadas y pestañas son ranuras."""
    def __init__(self, html):
        super().__init__()
        self.base, self.profundidad, self.omitir = [], 0, 0
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'header' and 'sate-encabezado' in a.get('class', '').split():
            self.profundidad = 1
        elif self.profundidad:
            if tag not in ('img', 'input', 'br', 'hr', 'meta', 'link'):
                self.profundidad += 1
        else:
            return
        if self.omitir:
            return
        self.base.append((tag, tuple(attrs)))
        if a.get('class') == 'header-actions' or a.get('id') == 'sate-tabs':
            self.omitir = self.profundidad

    def handle_endtag(self, tag):
        if not self.profundidad:
            return
        if self.omitir == self.profundidad:
            self.omitir = 0
        if not self.omitir:
            self.base.append(('/' + tag, ()))
        self.profundidad -= 1


class EncabezadoTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.textos = objeto_t()
        cls.config = json.loads((ROOT / 'data/sate.json').read_text(encoding='utf-8'))

    def test_dist_y_pagina_hermana_comparten_base(self):
        compilado = (ROOT / 'web/dist/sate/index.html').read_text(encoding='utf-8')
        ejemplo = '<!doctype html><main>' + encabezado_sate(
            textos=self.textos, pestanas=pestanas_encabezado(self.config, 'upiita', self.textos),
            activa='mapa') + '</main>'
        self.assertEqual(BaseEncabezado(compilado).base, BaseEncabezado(ejemplo).base)
        cascaron = (ROOT / 'web/sate/cascaron.html').read_text(encoding='utf-8')
        self.assertEqual(cascaron.count('<!--__SATE_ENCABEZADO__-->'), 1)
        self.assertNotIn('<header class="top', cascaron)
        self.assertEqual(compilado.count('class="top sate-encabezado"'), 1)
        self.assertIn('href="encabezado.css"', compilado)
        self.assertEqual((ROOT / 'web/dist/sate/encabezado.css').read_bytes(),
                         (ROOT / 'web/sate/encabezado.css').read_bytes())

    def test_hermana_estatica_sin_nucleo_y_ranuras_opcionales(self):
        unidad = dict(self.config['unidades']['upiita'], siglas='UPIITA')
        unidad['siglas'] = 'Unidad <ficticia>'
        html = encabezado_sate(textos=self.textos, unidad=unidad, contexto=False,
                               acciones=False, avisos=False, recursos='../../',
                               pestanas=[dict(id='grupos', href='../grupos/', texto='Grupos <demo>')],
                               activa='grupos')
        self.assertIn('Unidad &lt;ficticia&gt;', html)
        self.assertIn('Grupos &lt;demo&gt;', html)
        self.assertIn('href="../grupos/" aria-current="page"', html)
        self.assertIn('src="../../assets/logos/', html)
        self.assertNotRegex(html, r'__SAES|__CUENTA|__THEME|id="f-carrera"|id="sate-avisos-globales"|<script>')
        self.assertIn('Fase de prueba', html)

    def test_vistas_externas_y_ocultas(self):
        cfg = json.loads(json.dumps(self.config))
        textos = dict(self.textos, **{'sate.pestana.grupos.titulo': 'Grupos'})
        vista = dict(id='grupos', href='grupos/', externa=True, habilitada=False)
        cfg['unidades']['upiita']['vistas'].append(vista)
        self.assertNotIn('grupos', [p['id'] for p in pestanas_encabezado(cfg, 'upiita', textos)])
        vista['habilitada'] = True
        items = pestanas_encabezado(cfg, 'upiita', textos, inicio='../index.html')
        self.assertEqual(items[-1], dict(id='grupos', href='grupos/', texto='Grupos'))
        self.assertTrue(items[0]['href'].startswith('../index.html#/upiita/'))
        cfg['pestanasOcultas'] = ['grupos']
        self.assertNotIn('grupos', [p['id'] for p in pestanas_encabezado(cfg, 'upiita', textos)])
        self.assertFalse(any(v.get('externa') for c in self.config['unidades'].values() for v in c.get('vistas', [])))

    def test_enlaces_no_locales_se_rechazan(self):
        for href in ('javascript:alert(1)', 'https://example.invalid/', '//example.invalid/', '\\externo', ''):
            with self.subTest(href=href), self.assertRaisesRegex(ValueError, 'no local'):
                encabezado_sate(textos=self.textos, pestanas=[dict(id='demo', href=href, texto='Demo')])

    def test_css_solo_tokens_ipn_y_contenedor_comun(self):
        css = (ROOT / 'web/sate/encabezado.css').read_text(encoding='utf-8')
        self.assertTrue(all(v.startswith('--ipn-') for v in re.findall(r'var\((--[\w-]+)', css)))
        cascaron = (ROOT / 'web/sate/cascaron.html').read_text(encoding='utf-8')
        self.assertIn('.wrap{max-width:var(--ipn-contenido-ancho)', cascaron)
        self.assertIn('padding-inline:var(--ipn-contenido-margen)', cascaron)
