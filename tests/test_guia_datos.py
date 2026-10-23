"""Contrato de los datos compartidos de la Guía politécnica (GUIA7): data/guia/comun.json más un archivo por unidad.

Comprueba que no haya bucles en el glosario, que cada marca en línea apunte a algo que existe y que cada artículo
citado exista en el texto literal de data/reglamentos/<doc>.json. Formato: coordinacion/ipt-estado/ipn-tools/diseno/FORMATO-GUIA7.md.
"""
import json
import re
import unittest
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / 'tools'))
from build_sate import fusionar_guia
UNIDADES = ('upiita', 'escom', 'upibi')
HTTPS = re.compile(r'^https://[^\s/]+(?:/[^\s]*)?$')
KEBAB = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
MARCA = re.compile(r'\[\[([ga]):([^\]|]+)\|([^\]]*)\]\]')
CUALQUIER_MARCA = re.compile(r'\[\[|\]\]|\{g:|\{a:')


def cargar(ruta):
    return json.loads((RAIZ / ruta).read_text(encoding='utf-8'))


COMUN = cargar('data/guia/comun.json')
GUIAS = {u: cargar('data/guia/%s.json' % u) for u in UNIDADES}
ARCHIVOS = {'comun': COMUN, **GUIAS}
FUSIONADAS = {'comun': COMUN, **{u: fusionar_guia(COMUN, g) for u, g in GUIAS.items()}}


def reglamento(doc):
    ruta = RAIZ / 'data/reglamentos' / (doc + '.json')
    return json.loads(ruta.read_text(encoding='utf-8')) if ruta.exists() else None


ARTICULOS = {}


def articulos(doc):
    if doc not in ARTICULOS:
        r = reglamento(doc)
        ARTICULOS[doc] = None if r is None else ({a['n'] for a in r['articulos']}, bool(r.get('sin_texto')))
    return ARTICULOS[doc]


def textos(p):
    """Todos los textos de una pregunta donde pueden ir marcas."""
    yield p['respuesta']
    yield from p.get('pasos', [])


def verificar_articulo(caso, doc, n):
    datos = articulos(doc)
    caso.assertIsNotNone(datos, 'el documento %s no tiene texto extraído en data/reglamentos' % doc)
    nums, sin_texto = datos
    caso.assertFalse(sin_texto, '%s está marcado sin_texto: se cita solo por documento' % doc)
    caso.assertIn(n, nums, 'el artículo %s no existe en %s' % (n, doc))


class TestEncabezados(unittest.TestCase):
    def test_encabezado_y_documentos(self):
        for nombre, g in ARCHIVOS.items():
            with self.subTest(archivo=nombre):
                self.assertTrue(g['_fuente'].strip())
                self.assertRegex(g['version'], r'^\d{4}\.\d{2}\.\d+$')
                self.assertEqual(g['revisado'], '2026-10-23' if nombre == 'upiita' else '2026-10-16')
                for id_, d in g['documentos'].items():
                    self.assertRegex(id_, r'^[a-z0-9_]+$')
                    self.assertTrue(d['titulo'].strip() and d['resumen'].strip())
                    self.assertRegex(d['url'], HTTPS)
                    self.assertIsInstance(d['reglamento'], bool)
                    if d['reglamento'] and id_ != 'calendario':
                        self.assertTrue(d.get('gaceta'), id_)

    def test_documentos_sin_repetir_entre_comun_y_unidad(self):
        for u, g in GUIAS.items():
            self.assertFalse(set(g['documentos']) & set(COMUN['documentos']), u)

    def test_cgc_y_reglamentos_en_comun(self):
        self.assertIn('cgc', COMUN['documentos'])
        self.assertIn('642', COMUN['documentos']['cgc']['gaceta'])
        for k in ('rge', 'ri', 'ro', 'lo', 'titulacion', 'servicio_social'):
            self.assertIn(k, COMUN['documentos'])
        for u in UNIDADES:
            self.assertIn('mo_' + u, GUIAS[u]['documentos'])


class TestGlosario(unittest.TestCase):
    def test_sin_bucles_y_con_fuente_verificada(self):
        gl = COMUN['glosario']
        self.assertTrue(20 <= len(gl) <= 35, len(gl))
        for k, d in gl.items():
            with self.subTest(termino=k):
                self.assertRegex(k, r'^[a-z0-9_]+$')
                self.assertTrue(d['termino'].strip() and d['definicion'].strip())
                self.assertIsNone(CUALQUIER_MARCA.search(d['definicion']), 'la definición no lleva marcas (sin bucles)')
                self.assertIsNone(CUALQUIER_MARCA.search(d['termino']))
                f = d.get('fuente')
                if f:
                    self.assertIn(f['doc'], COMUN['documentos'])
                    for n in f['arts']:
                        verificar_articulo(self, f['doc'], n)

    def test_cada_termino_se_usa(self):
        usados = set()
        for g in FUSIONADAS.values():
            for p in g['preguntas']:
                for t in textos(p):
                    usados |= {m.group(2) for m in MARCA.finditer(t) if m.group(1) == 'g'}
            for a in g['acudir']:
                usados |= {m.group(2) for m in MARCA.finditer(a['para']) if m.group(1) == 'g'}
        self.assertEqual(set(COMUN['glosario']) - usados, set(), 'términos del glosario sin usar')


class TestMarcas(unittest.TestCase):
    def _revisar(self, texto, contexto):
        resto = MARCA.sub('', texto)
        self.assertIsNone(CUALQUIER_MARCA.search(resto), 'marca mal formada en %s' % contexto)
        for m in MARCA.finditer(texto):
            tipo, ref, etiqueta = m.groups()
            self.assertTrue(etiqueta.strip(), contexto)
            if tipo == 'g':
                self.assertIn(ref, COMUN['glosario'], 'clave de glosario inexistente en %s' % contexto)
            else:
                self.assertEqual(ref.count(':'), 1, contexto)
                doc, n = ref.split(':')
                verificar_articulo(self, doc, n)

    def test_marcas_en_respuestas_pasos_y_acudir(self):
        for nombre, g in FUSIONADAS.items():
            for p in g['preguntas']:
                for t in textos(p):
                    self._revisar(t, '%s/%s' % (nombre, p['id']))
            for a in g['acudir']:
                self._revisar(a['para'], '%s/acudir/%s' % (nombre, a['id']))


class TestPreguntas(unittest.TestCase):
    def test_estructura_y_fuentes(self):
        for nombre, g in FUSIONADAS.items():
            ids = set()
            for p in g['preguntas']:
                with self.subTest(archivo=nombre, pregunta=p['id']):
                    self.assertRegex(p['id'], KEBAB)
                    self.assertNotIn(p['id'], ids, 'id repetido en el mismo archivo')
                    ids.add(p['id'])
                    self.assertIn(p['apartado'], ('situacion', 'tramites'))
                    self.assertTrue(p['pregunta'].strip().startswith('¿') or p['pregunta'].strip().endswith('?'))
                    self.assertTrue(p['respuesta'].strip())
                    self.assertTrue(1 <= len(p['pasos']) <= 5 and all(x.strip() for x in p['pasos']))
                    self.assertTrue(p['palabras'])
                    self.assertTrue(p['fuentes'], 'sin fuente no se publica')
                    docs = {**COMUN['documentos'], **g['documentos']}
                    for f in p['fuentes']:
                        self.assertIn(f['doc'], docs)
                        self.assertRegex(docs[f['doc']]['url'], HTTPS)
                        for n in f.get('arts', []):
                            verificar_articulo(self, f['doc'], n)
                        if 'arts' in f:
                            self.assertTrue(f.get('articulo'), 'arts siempre con su texto articulo')
                    # cada artículo marcado en el texto aparece en fuentes con arts
                    citados = {}
                    for t in textos(p):
                        for m in MARCA.finditer(t):
                            if m.group(1) == 'a':
                                d, n = m.group(2).split(':')
                                citados.setdefault(d, set()).add(n)
                    en_fuentes = {}
                    for f in p['fuentes']:
                        en_fuentes.setdefault(f['doc'], set()).update(f.get('arts', []))
                    for d, ns in citados.items():
                        self.assertTrue(ns <= en_fuentes.get(d, set()), 'artículos citados que faltan en fuentes: %s %s' % (d, ns - en_fuentes.get(d, set())))
                    if p.get('reemplaza'):
                        self.assertIs(p['reemplaza'], True)

    def test_sin_repetir_id_entre_comun_y_unidad_salvo_reemplazo(self):
        comunes = {p['id'] for p in COMUN['preguntas']}
        for u, g in GUIAS.items():
            for p in g['preguntas']:
                with self.subTest(unidad=u, pregunta=p['id']):
                    if p['id'] in comunes:
                        self.assertIs(p.get('reemplaza'), True, 'id común repetido sin "reemplaza": true')
                    else:
                        self.assertFalse(p.get('reemplaza'), 'reemplaza una pregunta común que no existe')

    def test_cantidades(self):
        self.assertGreaterEqual(len(COMUN['preguntas']), 26)
        self.assertGreaterEqual(len({a for a in (p['apartado'] for p in COMUN['preguntas'])}), 2)

    def test_acudir_resoluble_en_cada_unidad(self):
        comunes = {a['id'] for a in COMUN['acudir']}
        for u, g in GUIAS.items():
            propios = {a['id'] for a in g['acudir']}
            self.assertFalse(comunes & propios, 'acudir repetido entre comun y %s' % u)
            todos = comunes | propios
            docs = {**COMUN['documentos'], **g['documentos']}
            for a in COMUN['acudir'] + g['acudir']:
                self.assertTrue(a['nombre'].strip() and a['para'].strip())
                f = a['fuente']
                self.assertIn(f['doc'], docs)
                if f['doc'].startswith('mo_'):
                    self.assertIsInstance(f.get('pagina'), int, a['id'])
                for n in f.get('arts', []):
                    verificar_articulo(self, f['doc'], n)
            for p in COMUN['preguntas'] + g['preguntas']:
                for x in p.get('acudir', []):
                    self.assertIn(x, todos, '%s/%s cita acudir inexistente %s' % (u, p['id'], x))

    def test_sin_datos_personales_ni_voz_vetada(self):
        for nombre, g in ARCHIVOS.items():
            crudo = json.dumps(g, ensure_ascii=False)
            self.assertNotRegex(crudo, r'\b\d{10}\b')
            self.assertNotRegex(crudo, r'[\w.]+@[\w.]+\.\w+')
            for vetada in ('¡ups!', 'algo salió mal'):
                self.assertNotIn(vetada, crudo.lower())

    def test_baja_temporal_texto_del_dueno(self):
        p = next(x for x in COMUN['preguntas'] if x['id'] == 'baja-temporal')
        self.assertIn('hasta dos periodos semestrales completos en toda tu trayectoria; no tienen que ser seguidos', p['respuesta'])


if __name__ == '__main__':
    unittest.main()
