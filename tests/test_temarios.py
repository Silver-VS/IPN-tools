"""Contrato de datos, regresiones OCR y generación determinista de temarios."""
import json
from pathlib import Path, PurePosixPath
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import temarios_extraer as te
import urls_pdf_temarios as up


class TestTemarios(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mapa = te.cargar_mapa()
        cls.datos = {c: json.loads((te.ROOT / f'data/temarios/upiita/{c}.json').read_text(encoding='utf-8'))
                     for c in te.CARRERAS}

    def test_esquema_simple_de_cada_json(self):
        cadenas = ('clave', 'plan', 'nombre', 'tipo', 'objetivo', 'orientacion',
                   'evaluacion', 'vigencia', 'academia', 'fuente')
        for carrera, datos in self.datos.items():
            self.assertEqual(set(datos), {'carrera', 'plan', 'materias', 'duplicados'})
            self.assertEqual(datos['carrera'], carrera)
            self.assertIsInstance(datos['plan'], str)
            self.assertIsInstance(datos['materias'], list)
            self.assertTrue(datos['materias'])
            for m in datos['materias']:
                with self.subTest(carrera=carrera, fuente=m['fuente']):
                    self.assertEqual(set(m), set(cadenas) | {'nivel', 'confianza', 'contenidos', 'bibliografia', 'horas', 'creditos'})
                    for k in cadenas:
                        self.assertIsInstance(m[k], str, k)
                    self.assertTrue(m['nivel'] is None or type(m['nivel']) is int)
                    self.assertIn(m['tipo'], ('', 'obligatoria', 'optativa', 'elegible'))
                    self.assertIsInstance(m['confianza'], (int, float))
                    self.assertTrue(0 <= m['confianza'] <= 1)
                    for campo in ('horas', 'creditos'):
                        self.assertIsInstance(m[campo], dict)
                        for valor in m[campo].values():
                            self.assertIsInstance(valor, (int, float))
                            self.assertGreaterEqual(valor, 0)
                    self.assertTrue(set(m['horas']) <= {f'{tipo}_{periodo}' for tipo in ('teoria', 'practica', 'totales') for periodo in ('semana', 'semestre')})
                    self.assertTrue(set(m['creditos']) <= {'tepic', 'satca'})
                    self.assertIsInstance(m['contenidos'], list)
                    for u in m['contenidos']:
                        self.assertEqual(set(u), {'numero', 'titulo', 'subtemas'})
                        self.assertIn(u['numero'], ('',) + te.ROMANOS)
                        self.assertIsInstance(u['titulo'], str)
                        self.assertIsInstance(u['subtemas'], list)
                        self.assertTrue(all(isinstance(s, str) for s in u['subtemas']))
                    self.assertIsInstance(m['bibliografia'], list)
                    for b in m['bibliografia']:
                        self.assertEqual(set(b), {'texto', 'tipo'})
                        self.assertIsInstance(b['texto'], str)
                        self.assertIn(b['tipo'], ('', 'básica', 'complementaria'))
            for d in datos['duplicados']:
                self.assertEqual(set(d), {'clave', 'elegido', 'descartado'})
                self.assertTrue(all(isinstance(v, str) for v in d.values()))

    def test_claves_existen_en_carrera_y_plan_saes_sin_duplicarse(self):
        for carrera, datos in self.datos.items():
            filas = {r['clave']: r for r in self.mapa if r['carrera'] == te.CARRERAS[carrera] and r['plan'] == datos['plan']}
            claves = [m['clave'] for m in datos['materias'] if m['clave']]
            self.assertEqual(len(claves), len(set(claves)))
            for m in datos['materias']:
                if m['clave']:
                    self.assertIn(m['clave'], filas)
                    self.assertEqual(m['plan'], datos['plan'])
                    self.assertGreaterEqual(m['confianza'], 0.86)
            self.assertEqual(datos['plan'], te.plan_trayectoria(te.CARRERAS[carrera], self.mapa))

    def test_algebra_lineal_bionica(self):
        m = next(m for m in self.datos['bionica']['materias'] if m['clave'] == 'B103')
        self.assertTrue(m['objetivo'])
        self.assertEqual([u['numero'] for u in m['contenidos']], ['I', 'II', 'III', 'IV', 'V'])
        self.assertEqual(m['nivel'], 1)
        self.assertEqual(m['creditos'], {'tepic': 7.5, 'satca': 4.71})
        self.assertEqual(m['horas']['practica_semana'], 1.5)

    def test_minusculas_saes_y_tipo_carpeta(self):
        b = next(m for m in self.datos['bionica']['materias'] if m['clave'] == 'b307')
        self.assertEqual(b['tipo'], 'optativa' if 'OPTATIVAS' in b['fuente'] else 'obligatoria')
        t = next(m for m in self.datos['telematica']['materias'] if m['clave'] == 'T120')
        self.assertEqual(t['tipo'], 'elegible')

    def test_sin_residuos_de_marcado_o_controles(self):
        def revisar(valor):
            if isinstance(valor, dict):
                for v in valor.values():
                    revisar(v)
            elif isinstance(valor, list):
                for v in valor:
                    revisar(v)
            elif isinstance(valor, str):
                self.assertNotRegex(valor, r'<\s*/?\s*(?:td|tr|th|table)\b|\|\s*---\s*\|')
                self.assertNotRegex(valor, r'[\x00-\x08\x0b\x0c\x0e-\x1f]')
        revisar(self.datos)

    def test_fuentes_relativas_y_pdf_existente(self):
        for carrera, datos in self.datos.items():
            for m in datos['materias']:
                ruta = PurePosixPath(m['fuente'])
                self.assertFalse(ruta.is_absolute())
                self.assertNotIn('..', ruta.parts)
                self.assertEqual(ruta.parts[0], carrera)
                self.assertEqual(ruta.suffix, '.pdf')
                self.assertTrue((te.RECURSOS / ruta).is_file(), m['fuente'])

    def test_duplicados_no_asignan_sistemas_biomecanicos_por_archivo(self):
        datos = self.datos['bionica']
        self.assertFalse(any(m['clave'] == 'B410' for m in datos['materias']))
        self.assertEqual({d['clave'] for d in datos['duplicados']}, {'B105', 'B412'})

    def test_normalizacion_preserva_romanos(self):
        self.assertEqual(te.normalizar(' Álgebra   Lineal.'), 'ALGEBRA LINEAL')
        self.assertEqual(te.normalizar('Inglés 1'), 'INGLES I')
        self.assertEqual(te.puntuacion({'nombre': 'Inglés I', 'nivel': 1},
                                     {'nombre': 'INGLES II', 'nivel': '1'}), 0)
        self.assertEqual(te.normalizar('Graficación en 3D'), 'GRAFICACION EN 3D')

    def test_encabezados_proposito_y_contenidos_sin_etiqueta(self):
        s = te.secciones('PROPÓSITO DE LA UNIDAD DE APRENDIZAJE:\nComprende conceptos.\nCONTENIDOS:\nI Tema\nII Otro\nORIENTACIÓN DIDÁCTICA:\nTrabajo en equipo.')
        self.assertEqual(s['objetivo'], 'Comprende conceptos.')
        self.assertEqual(len(te.unidades(s['contenidos'])), 2)
        for etiqueta in ('PROPOSITODE LA UNIDAD DE APRENDIZAJE', 'PROPÓSITO DE LA UNIDAD DEAPRENDIZAJE', 'PROPÓSITO DE LA UNIDAD DE APRENDIDIZAJE'):
            self.assertEqual(te.secciones(etiqueta + ':\nAnaliza sistemas.')['objetivo'], 'Analiza sistemas.')
        s = te.secciones('OBJETIVO GENERAL:\nComprende conceptos.\nI. Tema\nII. Otro\nORIENTACIÓN DIDÁCTICA:\nTrabajo.')
        self.assertEqual(s['objetivo'], 'Comprende conceptos.')
        self.assertEqual(len(te.unidades(s['contenidos'])), 2)

    def test_limpieza_y_bibliografia_tipificada(self):
        self.assertEqual(te.limpiar('transfor-\nmación\n|---|---|\n<td>Texto</td>'), 'transformación\nTexto ;')
        self.assertEqual(te.bibliografia('BÁSICA\nAutor. Libro.\nCOMPLEMENTARIA\nOtro. Libro.'),
                         [{'texto': 'Autor. Libro.', 'tipo': 'básica'}, {'texto': 'Otro. Libro.', 'tipo': 'complementaria'}])
        s = te.secciones('BIBLIOGRAFÍA BÁSICA:\nAutor. Libro.\nBIBLIOGRAFÍA COMPLEMENTARIA:\nOtro. Libro.')
        self.assertEqual([b['tipo'] for b in te.bibliografia(s['bibliografia'])], ['básica', 'complementaria'])
        self.assertEqual(te.unidades('• Redes ópticas'), [{'numero': '', 'titulo': 'Redes ópticas', 'subtemas': []}])

    def test_unidades_desarrolladas_con_subtemas(self):
        u = te.unidades_desarrolladas(['N° UNIDAD TEMÁTICA: II NOMBRE: Circuitos.\nUNIDAD DE COMPETENCIA\nAnaliza.\nNo. CONTENIDOS HORAS\n2.1 Resistencias\nSubtotales: 3.0'])
        self.assertEqual(u, [{'numero': 'II', 'titulo': 'Circuitos.', 'subtemas': ['2.1 Resistencias']}])

    def test_ambiguedad_se_conserva_sin_clave(self):
        materia = {'nombre': 'Control', 'nivel': 1, 'fuente': 'bionica/Control.pdf', 'tipo': '', 'clave': '', 'plan': ''}
        filas = [{'nombre': 'Control', 'nivel': '1', 'clave': c, 'plan': '09', 'tipo': 'OBLIGATORIA'} for c in ('B101', 'B102')]
        materias, duplicados, revision = te.emparejar([materia], filas)
        self.assertEqual(materias[0]['clave'], '')
        self.assertFalse(duplicados)
        self.assertTrue(any('Sin asignar' in motivo for _, motivo in revision))

    def test_generacion_integra_reproducible(self):
        with tempfile.TemporaryDirectory() as temporal:
            root = Path(temporal)
            (root / 'data').mkdir()
            for nombre in ('mapa_curricular_saes.json', 'trayectoria_B.json', 'trayectoria_M.json', 'trayectoria_T.json'):
                shutil.copyfile(te.ROOT / 'data' / nombre, root / 'data' / nombre)
            te.generar(root=root)
            for carrera in te.CARRERAS:
                ruta = f'data/temarios/upiita/{carrera}.json'
                self.assertEqual((root / ruta).read_bytes(), (te.ROOT / ruta).read_bytes())
            self.assertEqual((root / 'docs/TEMARIOS.md').read_bytes(), (te.ROOT / 'docs/TEMARIOS.md').read_bytes())


class TestEnlacesPdf(unittest.TestCase):
    """El PDF original vive en la nube pública de la UPIITA (recurso compartido de Nextcloud por carrera)."""

    @classmethod
    def setUpClass(cls):
        cls.fuentes = up.cargar_fuentes('upiita')

    def test_los_recursos_compartidos_viven_en_un_solo_archivo_de_datos(self):
        self.assertEqual(set(self.fuentes['carreras']), {'bionica', 'mecatronica', 'telematica'})
        self.assertEqual(self.fuentes['carreras']['bionica']['compartido'], '73kqMKWfwDNAd2r')
        self.assertEqual(self.fuentes['carreras']['mecatronica']['compartido'], 'WbEkK2p7LY6jfaz')
        self.assertEqual(self.fuentes['carreras']['telematica']['compartido'], '9tA4wYgYwezEcPW')
        codigo = (Path(up.__file__).read_text(encoding='utf-8'))
        for token in ('73kqMKWfwDNAd2r', 'WbEkK2p7LY6jfaz', '9tA4wYgYwezEcPW'):
            self.assertNotIn(token, codigo, 'los recursos compartidos no se escriben en el código')

    def test_patron_de_descarga_con_codificacion(self):
        base = 'https://cloud.upiita.ipn.mx/public.php/dav/files/'
        self.assertEqual(up.url_pdf('bionica', 'bionica/NIVEL_I/ALGEBRA LINEAL.pdf', self.fuentes),
                         base + '73kqMKWfwDNAd2r/NIVEL_I/ALGEBRA%20LINEAL.pdf')
        self.assertEqual(up.url_pdf('telematica', 'telematica/Nivel I/ANÁLISIS Y DISEÑO DE SISTEMAS.pdf', self.fuentes),
                         base + '9tA4wYgYwezEcPW/Nivel%20I/AN%C3%81LISIS%20Y%20DISE%C3%91O%20DE%20SISTEMAS.pdf')
        self.assertEqual(up.url_pdf('mecatronica', 'mecatronica/NIVEL_II/A&B #1.pdf', self.fuentes),
                         base + 'WbEkK2p7LY6jfaz/NIVEL_II/A%26B%20%231.pdf')

    def test_sin_recurso_o_con_ruta_peligrosa_no_hay_enlace(self):
        self.assertIsNone(up.url_pdf('otra', 'otra/N/a.pdf', self.fuentes))
        self.assertIsNone(up.url_pdf('bionica', None, self.fuentes))
        self.assertIsNone(up.url_pdf('bionica', 'bionica/../secreto.pdf', self.fuentes))
        self.assertIsNone(up.url_pdf('bionica', 'bionica', self.fuentes))

    def test_una_url_por_materia_y_ninguna_repetida(self):
        urls = [u for _, _, u in up.todas('upiita')]
        total = sum(len(json.loads((te.ROOT / f'data/temarios/upiita/{c}.json').read_text(encoding='utf-8'))['materias']) for c in te.CARRERAS)
        self.assertEqual(len(urls), total)
        self.assertEqual(len(set(urls)), len(urls))
        for u in urls:
            self.assertRegex(u, r'^https://cloud\.upiita\.ipn\.mx/public\.php/dav/files/[A-Za-z0-9]{15}/[^ ?&#]+\.pdf$')


class TestSeriacionDirecta(unittest.TestCase):
    def test_reduccion_transitiva(self):
        import build_sate
        req = {'C': ['A', 'B'], 'B': ['A'], 'D': ['A', 'B', 'C', 'X'], 'E': ['E', 'A']}
        r = build_sate.requisitos_directos(req)
        self.assertEqual(r['C'], ['B'])
        self.assertEqual(r['B'], ['A'])
        self.assertEqual(r['D'], ['C', 'X'])
        self.assertEqual(r['E'], ['A'], 'una materia no se requiere a sí misma')

    def test_tolera_ciclos_y_datos_que_no_son_listas(self):
        import build_sate
        r = build_sate.requisitos_directos({'A': ['B'], 'B': ['A'], 'C': {'x': 1}})
        self.assertEqual(set(r), {'A', 'B'})

    def test_el_indice_publica_requisitos_directos_y_areas(self):
        indice = json.loads((te.ROOT / 'web/dist/sate/datos/upiita/temarios/indice.json').read_text(encoding='utf-8'))
        self.assertEqual(indice['materias']['B105']['r'], ['B104'])
        self.assertNotIn('r', indice['materias']['B103'])
        for carrera in indice['carreras'].values():
            self.assertTrue(carrera['areas'])
            for a in carrera['areas']:
                self.assertTrue(a['nombre'] and a['color'].startswith('#'))
        for clave, m in indice['materias'].items():
            for r in m.get('r', []):
                self.assertIn(r, indice['materias'], clave)


if __name__ == '__main__':
    unittest.main()
