"""Contrato de los datos de la Guía politécnica (data/guia/<unidad>.json), de sus enlaces con la Ventanilla y de los
buscadores de bibliotecas de data/sate.json. Cada respuesta cita su fuente con una URL https."""
import json
import re
import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / 'tools'))

SATE = json.loads((RAIZ / 'data/sate.json').read_text(encoding='utf-8'))
GUIA = json.loads((RAIZ / 'data/guia/upiita.json').read_text(encoding='utf-8'))
BAJAS = json.loads((RAIZ / 'data/gestion_escolar/bajas.json').read_text(encoding='utf-8'))
HTTPS = re.compile(r'^https://[^\s/]+(?:/[^\s]*)?$')
KEBAB = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


class TestDatosGuia(unittest.TestCase):
    def test_encabezado_y_documentos(self):
        self.assertRegex(GUIA['version'], r'^\d{4}\.\d{2}\.\d+$')
        self.assertRegex(GUIA['revisado'], r'^\d{4}-\d{2}-\d{2}$')
        for id_, d in GUIA['documentos'].items():
            with self.subTest(documento=id_):
                self.assertRegex(id_, r'^[a-z0-9_]+$')
                self.assertTrue(d['titulo'].strip() and d['resumen'].strip())
                self.assertRegex(d['url'], HTTPS)
                self.assertIsInstance(d['reglamento'], bool)
                if d['reglamento'] and id_ != 'calendario':
                    self.assertTrue(d.get('gaceta'), 'un reglamento oficial indica dónde se publicó')

    def test_cada_respuesta_tiene_fuente_https(self):
        ids = set()
        for p in GUIA['preguntas']:
            with self.subTest(pregunta=p['id']):
                self.assertRegex(p['id'], KEBAB)
                self.assertNotIn(p['id'], ids, 'id repetido')
                ids.add(p['id'])
                for campo in ('pregunta', 'respuesta'):
                    self.assertTrue(p[campo].strip(), campo)
                self.assertTrue(p['pregunta'].startswith('¿') or p['pregunta'].endswith(('?', '.')) or '¿' in p['pregunta'] or p['pregunta'].endswith(':'), 'se lee como pregunta')
                self.assertTrue(1 <= len(p['pasos']) <= 5 and all(x.strip() for x in p['pasos']), 'pasos cortos y claros')
                self.assertTrue(p['fuentes'], 'sin fuente no se publica')
                for f in p['fuentes']:
                    self.assertIn(f['doc'], GUIA['documentos'])
                    self.assertRegex(GUIA['documentos'][f['doc']]['url'], HTTPS)
                    if f['doc'] in ('rge', 'ri', 'ro', 'servicio_social'):
                        self.assertTrue(f.get('articulo'), 'un reglamento se cita con su artículo')
                self.assertLessEqual(len(p['respuesta'].split()), 95, 'respuesta breve: sin muros de texto')
                for x in p.get('acudir', []):
                    self.assertIn(x, {a['id'] for a in GUIA['acudir']})

    def test_apartados_y_ventanilla(self):
        faq = {a['id'] for a in SATE['guia'] if a.get('datos') == 'faq'}
        self.assertEqual(faq, {'situacion', 'tramites'})
        tramites = set(SATE['unidades']['upiita']['tramites'])
        for p in GUIA['preguntas']:
            self.assertIn(p['apartado'], faq, p['id'])
            if p.get('ventanilla'):
                self.assertIn(p['ventanilla'], tramites, p['id'])
        for a in faq:
            self.assertGreaterEqual(sum(1 for p in GUIA['preguntas'] if p['apartado'] == a), 5, a)
        # Enlaces de la Ventanilla a su respuesta: tramite -> apartado/pregunta
        enlaces = SATE['unidades']['upiita']['guiaTramites']
        por_id = {p['id']: p for p in GUIA['preguntas']}
        for tramite, destino in enlaces.items():
            apartado, pid = destino.split('/')
            self.assertIn(tramite, tramites)
            self.assertEqual(por_id[pid]['apartado'], apartado)
            self.assertEqual(por_id[pid]['ventanilla'], tramite, 'la respuesta devuelve a su trámite')
        for t in ('dictamen', 'baja_temporal', 'baja_definitiva'):
            self.assertIn(t, enlaces)

    def test_acudir_con_fuente(self):
        ids = [a['id'] for a in GUIA['acudir']]
        self.assertEqual(len(ids), len(set(ids)))
        for a in GUIA['acudir']:
            self.assertTrue(a['nombre'].strip() and a['para'].strip())
            self.assertIn(a['fuente']['doc'], GUIA['documentos'])
        self.assertIn('cosie_ctce', ids)
        self.assertIn('defensoria', ids)

    def test_formatos_resolubles(self):
        for p in GUIA['preguntas']:
            f = p.get('formato')
            if not f:
                continue
            with self.subTest(pregunta=p['id']):
                self.assertTrue(f['texto'].strip())
                self.assertTrue(f.get('url') or f.get('doc') or f.get('ref'))
                if f.get('doc'):
                    self.assertIn(f['doc'], GUIA['documentos'])
                if f.get('ref'):
                    origen, clave = f['ref'].split('.')
                    self.assertEqual(origen, 'bajas')
                    self.assertIn(clave, BAJAS)

    def test_sin_datos_personales_ni_voz_vetada(self):
        crudo = json.dumps(GUIA, ensure_ascii=False)
        self.assertNotRegex(crudo, r'\b\d{10}\b', 'ni boletas ni teléfonos')
        self.assertNotRegex(crudo, r'[\w.]+@[\w.]+\.\w+', 'ni correos')
        for vetada in ('¡Ups!', 'Algo salió mal', 'kernel', 'token', 'clave API'):
            self.assertNotIn(vetada.lower(), crudo.lower())

    def test_lo_no_verificado_no_se_publica(self):
        # [?] de G-GUIA1: el micrositio de la COSIE de la UPIITA no abre desde fuera de la red del IPN.
        crudo = json.dumps(GUIA, ensure_ascii=False)
        self.assertNotIn('upiita.ipn.mx/coordinaciones/cosie.html', crudo)
        self.assertNotIn('Decanato', crudo)


class TestBibliotecas(unittest.TestCase):
    def test_buscadores_oficiales_de_sate_json(self):
        fuentes = {b['id']: b for b in SATE['bibliotecas']}
        self.assertEqual(set(fuentes), {'catalogo', 'digital', 'tesis'})
        for b in fuentes.values():
            self.assertRegex(b['url'], HTTPS)
            self.assertIn('{termino}', b['url'])
            self.assertRegex(b['inicio'], HTTPS)
        cat = fuentes['catalogo']
        self.assertTrue(cat['url'].startswith('https://www.busqueda.dirbibliotecas.ipn.mx/F/?func=find-b&request={termino}&find_code={campo}'))
        self.assertEqual({k: v['codigo'] for k, v in cat['campos'].items()}, {'todo': 'WRD', 'titulo': 'WTI', 'autor': 'WAU', 'tema': 'WSU'})
        self.assertEqual(cat['filtroUnidad'], '&filter_code_5=WSL&filter_request_5={biblioteca}')
        self.assertEqual(SATE['unidades']['upiita']['biblioteca'], 'UPITA')
        dig = fuentes['digital']
        self.assertTrue(dig['url'].startswith('https://searchbox.ebsco.com/search/?'))
        self.assertIn('custid=s3753448', dig['url'])
        self.assertTrue(dig['url'].endswith('bquery={termino}'))
        self.assertEqual(fuentes['tesis']['url'], 'https://tesis.ipn.mx/discover?query={termino}')

    def test_textos_de_sate_json_existen(self):
        import contenido
        errores = []
        contenido.validar_sate(set(contenido.objeto_t()), errores)
        self.assertEqual(errores, [])


class TestCompilacion(unittest.TestCase):
    def test_guia_compilada(self):
        destino = RAIZ / 'web/dist/sate/datos/upiita/guia.json'
        if not destino.exists():
            self.skipTest('Compila antes: python tools/build_sate.py')
        d = json.loads(destino.read_text(encoding='utf-8'))
        self.assertNotIn('_fuente', d)
        for p in d['preguntas']:
            f = p.get('formato')
            if f:
                self.assertNotIn('ref', f)
                self.assertTrue(f.get('url') or f.get('doc'), p['id'])
                if f.get('url'):
                    self.assertRegex(f['url'], HTTPS)
        temporal = next(p for p in d['preguntas'] if p['id'] == 'baja-temporal')['formato']['url']
        self.assertEqual(temporal, 'https://www.upiita.ipn.mx/adjuntos/gestion_escolar/2026/BAJA%20TEMPORAL%2026-2_2.pdf')
        for u in ('escom', 'upibi'):
            self.assertFalse((RAIZ / 'web/dist/sate/datos' / u / 'guia.json').exists(), u)


if __name__ == '__main__':
    unittest.main()
