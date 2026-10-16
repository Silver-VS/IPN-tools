"""Contratos del articulado oficial y regresiones de extracción, sin navegador."""
import json
import hashlib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from tools import reglamentos as r

ROOT = Path(__file__).resolve().parents[1]
CONTEOS = {'rge': (77, 7), 'ri': (295, 6), 'ro': (103, 4), 'lo': (34, 4),
           'titulacion': (46, 3), 'servicio_social': (51, 5), 'becas': (42, 5),
           'subcomite_becas': (45, 6), 'equivalencias': (0, 0),
           'cambio_carrera': (19, 3), 'honor': (45, 2), 'etica': (0, 0), 'cgc': (0, 0)}


class Extraccion(unittest.TestCase):
    def test_jerarquia_bis_fracciones_inciso_y_transitorio(self):
        a, t, e = r.extraer(['TÍTULO PRIMERO\nDisposiciones generales\n'
                            'CAPÍTULO IV\nConsulta\nSección Primera\nRequisitos\n'
                            'ARTÍCULO 1\nTexto literal de prueba.\nI. Fracción primera\n'
                            'a) Inciso primero\nb) Inciso segundo\nII. Fracción segunda\n'
                            'Artículo 1 Bis. Texto adicional.\nArtículo 2. Un texto com-\n'
                            'pleto.\nTRANSITORIOS\nPRIMERO.- Entra en vigor.'])
        self.assertEqual([x['n'] for x in a], ['1', '1 Bis', '2'])
        self.assertEqual(a[0]['ubicacion'], ['TÍTULO PRIMERO Disposiciones generales',
                                           'CAPÍTULO IV Consulta', 'Sección Primera Requisitos'])
        self.assertEqual(a[0]['fracciones'][0]['incisos'][1], {'inciso': 'b', 'texto': 'Inciso segundo'})
        self.assertEqual(a[2]['texto'], 'Un texto completo.')
        self.assertEqual(t[0]['texto'], 'Entra en vigor.')
        self.assertEqual(e[0]['hijos'][0]['hijos'][0]['articulos'], {'desde': '1', 'hasta': '2'})

    def test_referencias_no_son_articulos(self):
        a, _, _ = r.extraer(['Artículo 1. Conforme al\nArtículo 55 del Reglamento Interno.\n'
                             'Artículo 2. Texto. Artículo 3. Otro texto.'])
        self.assertEqual([x['n'] for x in a], ['1', '2', '3'])
        self.assertIn('Artículo 55 del Reglamento Interno.', a[0]['texto'])

    def test_limpieza_de_encabezados_y_paginacion(self):
        a, _, _ = r.extraer(['GACETA POLITÉCNICA\nArtículo 1. Primera línea\n1 de 3',
                            'GACETA POLITÉCNICA\ncontinúa literal\n2 de 3',
                            'GACETA POLITÉCNICA\nArtículo 2. Otra línea.\n3 de 3'])
        self.assertEqual(a[0]['texto'], 'Primera línea continúa literal')
        self.assertEqual(a[1]['texto'], 'Otra línea.')

    def test_citas_de_gaceta_no_se_eliminan_como_pies(self):
        a, _, _ = r.extraer(['Artículo 1. Publicado en la\nGaceta Politécnica de fecha anterior,\n'
                             'Número Extraordinario 1322 de fecha 6 de abril 2017.'])
        self.assertEqual(a[0]['texto'], 'Publicado en la Gaceta Politécnica de fecha anterior, '
                         'Número Extraordinario 1322 de fecha 6 de abril 2017.')

    def test_rechaza_huecos_duplicados_vacios_y_pies(self):
        for articulos in ([{'n': '1', 'texto': 'a'}, {'n': '3', 'texto': 'b'}],
                          [{'n': '1', 'texto': 'a'}, {'n': '1', 'texto': 'b'}],
                          [{'n': '1', 'texto': ''}],
                          [{'n': '1', 'texto': 'a Gaceta Politécnica 5'}]):
            with self.subTest(articulos=articulos), self.assertRaises(ValueError):
                r.validar({'id': 'prueba', 'articulos': articulos, 'transitorios': []})

    def test_descarga_solo_fuentes_y_pdf(self):
        with patch.object(r.urllib.request, 'build_opener') as abrir:
            with self.assertRaises(ValueError):
                r.descargar('https://example.org/ajeno.pdf')
            abrir.assert_not_called()
            abrir.return_value.open.return_value.__enter__.return_value.read.return_value = b'<html>Error</html>'
            with self.assertRaises(ValueError):
                r.descargar(r.fuentes()['rge']['url'])

    def test_no_sigue_redirecciones_ajenas(self):
        solicitud = r.urllib.request.Request(r.fuentes()['rge']['url'])
        with self.assertRaises(ValueError):
            r.SoloFuentes().redirect_request(solicitud, None, 302, '', {}, 'https://example.org/ajeno.pdf')

    def test_verificar_detecta_cambios_sin_sustituir_datos(self):
        fuente = r.fuentes()['rge']
        pdf = b'%PDF-prueba-ficticia'
        r.CACHE.mkdir(parents=True, exist_ok=True)  # en un clon limpio la caché aún no existe
        with tempfile.TemporaryDirectory(dir=r.CACHE) as carpeta:
            destino = Path(carpeta)
            archivo = destino / 'rge.json'
            previo = json.dumps({'sha256': hashlib.sha256(pdf).hexdigest()})
            archivo.write_text(previo, encoding='utf-8')
            with patch.object(r, 'DESTINO', destino), patch.object(r, 'fuentes', return_value={'rge': fuente}), \
                    patch.object(r, 'descargar', return_value=pdf) as descargar, \
                    patch('sys.argv', ['reglamentos.py', '--verificar']), self.assertLogs(r.LOG, level='INFO'):
                r.main()
                descargar.assert_called_once_with(fuente['url'])
                self.assertEqual(archivo.read_text(encoding='utf-8'), previo)
                descargar.return_value = b'%PDF-otra-version'
                with self.assertRaisesRegex(ValueError, 'SHA-256 cambió'):
                    r.main()
                self.assertEqual(archivo.read_text(encoding='utf-8'), previo)


class DatosOficiales(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.indice = json.loads((r.DESTINO / 'indice.json').read_text(encoding='utf-8'))
        cls.datos = {id_: json.loads((r.DESTINO / f'{id_}.json').read_text(encoding='utf-8'))
                     for id_ in r.fuentes()}

    def test_indice_completo_y_metadatos_de_la_fuente(self):
        self.assertEqual(set(self.datos), set(CONTEOS))
        self.assertEqual({x['id'] for x in self.indice}, set(self.datos))
        for entrada in self.indice:
            id_ = entrada['id']
            d = self.datos[id_]
            with self.subTest(id=id_):
                for campo in ('titulo', 'url', 'gaceta'):
                    self.assertEqual(d[campo], r.fuentes()[id_][campo])
                self.assertEqual(entrada['articulos'], len(d['articulos']))
                self.assertRegex(d['sha256'], r'^[0-9a-f]{64}$')
                self.assertRegex(d['extraido_el'], r'^\d{4}-\d{2}-\d{2}$')
                self.assertEqual((len(d['articulos']), len(d['transitorios'])), CONTEOS[id_])

    def test_secuencia_texto_y_limpieza_en_todos_los_documentos(self):
        for id_, d in self.datos.items():
            with self.subTest(id=id_):
                r.validar(d)
                self.assertEqual(len({a['n'] for a in d['articulos']}), len(d['articulos']))
                for a in d['articulos'] + d['transitorios']:
                    self.assertNotRegex(a['texto'], r'\(cid:|oremúN|oiranidroartxE|\b\d+ de 13\b|CÁMARA DE DIPUTADOS|Secretaría de Servicios Parlamentarios|\bSTITUTO POLITÉCNICO NACIONAL|ERAL DE ESTUDIOS|PARA EL ALUMNADO')

    def test_baja_temporal_y_faltas_y_sanciones(self):
        rge = {a['n']: a for a in self.datos['rge']['articulos']}
        self.assertIn('baja temporal', rge['55']['texto'])
        ri = {a['n']: a for a in self.datos['ri']['articulos']}
        self.assertTrue(all(str(n) in ri for n in range(106, 122)))
        texto = ' '.join(ri[str(n)]['texto'] for n in range(106, 122)).lower()
        self.assertIn('falta', texto)
        self.assertIn('sanciones', texto)
        self.assertGreaterEqual(sum(len(d['articulos']) > 20 for d in self.datos.values()), 5)
        self.assertIn('Número Extraordinario 1322 de fecha 6 de abril 2017.',
                      self.datos['subcomite_becas']['transitorios'][1]['texto'])

    def test_arbol_cubre_articulado_sin_inventar_rangos(self):
        for id_, d in self.datos.items():
            def revisar(nodos, ubicacion):
                for nodo in nodos:
                    ruta = ubicacion + [nodo['titulo']]
                    ids = [a['n'] for a in d['articulos'] if a['ubicacion'][:len(ruta)] == ruta]
                    self.assertTrue(ids, (id_, ruta))
                    self.assertEqual(nodo['articulos'], {'desde': ids[0], 'hasta': ids[-1]})
                    revisar(nodo['hijos'], ruta)
            with self.subTest(id=id_):
                revisar(d['estructura'], [])
                for a in d['articulos']:
                    self.assertTrue(a['ubicacion'], (id_, a['n']))

    def test_escaneados_y_codigo_sin_numeracion_se_declaran(self):
        por_id = {x['id']: x for x in self.indice}
        for id_ in ('equivalencias', 'cambio_carrera'):
            with self.subTest(id=id_):
                if self.datos[id_].get('ocr'):
                    # PDF escaneado con transcripción OCR revisable del mismo PDF (data/reglamentos/ocr/<id>.txt)
                    self.assertTrue(por_id[id_]['ocr'])
                    self.assertNotIn('sin_texto', self.datos[id_])
                    self.assertTrue(self.datos[id_]['articulos'] or self.datos[id_].get('texto'))
                    cabecera = (r.OCR / f'{id_}.txt').read_text(encoding='utf-8').split('\n', 1)[0]
                    self.assertEqual(cabecera, f"sha256: {self.datos[id_]['sha256']}")
                else:
                    self.assertTrue(por_id[id_]['sin_texto'])
                    self.assertTrue(self.datos[id_]['sin_texto'])
                    self.assertEqual(self.datos[id_]['articulos'], [])
        self.assertTrue(por_id['etica']['sin_articulado'])
        self.assertGreater(len(self.datos['etica']['texto']), 10000)


if __name__ == '__main__':
    unittest.main()
