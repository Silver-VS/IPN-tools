"""Analizador determinista y ejecución sin OCR ni red (datos ficticios)."""
import contextlib
import io
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

from tools import planes_ocr as p

ROOT = pathlib.Path(__file__).resolve().parents[1]
CAB = 'TEORÍA PRÁCTICA T/H CRÉDITOS TEPIC'


class AnalizadorPlanes(unittest.TestCase):
    def analizar(self, texto):
        nv, op, total, resto = p.analizar(texto)
        return nv, p.validar(nv, total, op), resto

    def test_referencias_partidas_y_periodo(self):
        nv, val, _ = self.analizar('PERÍODO II\n' + CAB +
                                 '\nMateria\n3\n1\n4\n7\nSUBTOTAL\n3\n1\n4\n7\n'
                                 'TOTAL DE HORAS\nTOTAL\n3\n1\n4\n7')
        self.assertEqual(2, nv[0]['nivel'])
        self.assertEqual('ok', val['estado'])
        self.assertEqual(7, nv[0]['materias'][0]['creditos_tepic'])

    def test_tres_estados_y_diferencia(self):
        nv = [{'nivel': 1, 'materias': [p.materia_de('Materia', [3, 1, 4, 7])], 'subtotal': None}]
        self.assertEqual('sin_referencia', p.validar(nv, None)['estado'])
        self.assertEqual('solo_total', p.validar(nv, {'creditos_tepic': 7})['estado'])
        nv[0]['subtotal'] = {'creditos_tepic': 8}
        val = p.validar(nv, {'creditos_tepic': 7})
        self.assertEqual('discrepancia', val['estado'])
        self.assertEqual(1, val['niveles'][0]['diferencias']['creditos_tepic']['dif'])
        self.assertIn('nivel 1', val['motivo'])

    def test_solo_total_general_tras_varios_niveles(self):
        _, val, _ = self.analizar('NIVEL I\n' + CAB + '\nÁlgebra 3 0 3 6\n'
                                 'NIVEL II\nFísica 2 1 3 5\nTOTAL 5 1 6 11')
        self.assertEqual('solo_total', val['estado'])

    def test_html_y_total_por_semestre(self):
        texto = '<table><tr><th>SEMESTRE I</th><th>T</th><th>P</th><th>T/H</th><th>C</th></tr>'
        texto += '<tr><td>Álgebra</td><td>3</td><td>0</td><td>3</td><td>6</td></tr>'
        texto += '<tr><td>TOTAL</td><td>3</td><td>0</td><td>3</td><td>6</td></tr></table>'
        nv, val, _ = self.analizar(texto)
        self.assertEqual('Álgebra', nv[0]['materias'][0]['nombre'])
        self.assertEqual('ok', val['estado'])
        self.assertIsNotNone(nv[0]['subtotal'])

    def test_guiones_no_modifican_nombres(self):
        nv, val, _ = self.analizar('SEMESTRE I\nT P T/H C\nGineco - obstetricia 3 --- 3 6\nTOTAL 3 --- 3 6')
        self.assertEqual('Gineco - obstetricia', nv[0]['materias'][0]['nombre'])
        self.assertEqual('ok', val['estado'])

    def test_creditos_sin_horas(self):
        nv, val, _ = self.analizar('NIVEL I\nCRÉDITOS SATCA\nMateria 8\nSUBTOTAL 8')
        self.assertIsNone(nv[0]['materias'][0]['teoria'])
        self.assertEqual(8, nv[0]['materias'][0]['creditos_satca'])
        self.assertEqual('ok', val['estado'])

    def test_varios_nombres_y_numeros_en_bloque(self):
        for nombres in ('Álgebra\nFísica', 'Álgebra  Física'):
            nv, val, _ = self.analizar('NIVEL I\n' + CAB + '\n' + nombres +
                                     '\n3 0\n3 6\n2 1\n3 5\nSUBTOTAL 5 1 6 11')
            self.assertEqual(['Álgebra', 'Física'], [m['nombre'] for m in nv[0]['materias']])
            self.assertEqual('ok', val['estado'])

    def test_catalogo_no_se_suma_al_plan(self):
        nv, val, _ = self.analizar('SEMESTRE I\n' + CAB + '\nMateria 3 0 3 6\nSUBTOTAL 3 0 3 6\n'
                                 'TOTAL DE HORAS\nTOTAL 3 0 3 6\nUNIDADES DE APRENDIZAJE OPTATIVAS\n'
                                 'SEMESTRE II\nOptativa 3 0 3 6')
        self.assertEqual(1, len(nv))
        self.assertEqual('ok', val['estado'])

    def test_no_asigna_subtotal_a_materia(self):
        nv, val, resto = self.analizar('SEMESTRE I\nT P T/H C\nÁlgebra\nFísica\nTOTAL 5 1 6 11')
        self.assertEqual(2, len(nv[0]['materias']))
        self.assertTrue(all(m['creditos_tepic'] is None for m in nv[0]['materias']))
        self.assertEqual('discrepancia', val['estado'])
        self.assertTrue(resto)

    def test_trayectorias_alternativas(self):
        texto = 'NIVEL I\n' + CAB + '\nComún 3 0 3 6\nSUBTOTAL 3 0 3 6\n'
        for tr in ('A', 'B'):
            texto += f'TRAYECTORIA "{tr}"\nNIVEL II\nMateria 3 0 3 6\nSUBTOTAL 3 0 3 6\n'
        texto += 'TOTAL DE HORAS\nTOTAL 6 0 6 12'
        _, val, _ = self.analizar(texto)
        self.assertEqual('ok', val['estado'])
        self.assertEqual(2, len(val['por_trayectoria']))


class Relectura(unittest.TestCase):
    def test_tolerancia_satca_025_y_tepic_005(self):
        def val(campo, sub, mat):
            nv = [{'nivel': 1, 'materias': [p.materia_de('M', [3, 1, 4, 7, mat])], 'subtotal': {campo: sub}}]
            return p.validar(nv, None)['estado']
        self.assertEqual('ok', val('creditos_satca', 6.0, 6.2))
        self.assertEqual('discrepancia', val('creditos_satca', 6.0, 6.3))
        self.assertEqual('discrepancia', val('creditos_tepic', 7.1, 7))

    def test_cortes_con_traslape_y_borde_en_zona_blanca(self):
        import numpy as np
        osc = np.full(1000, 200.0)
        osc[330:340] = 0.0            # zona blanca cerca del borde nominal
        c = p.cortes(1000, 3, osc)
        self.assertEqual(3, len(c))
        self.assertEqual((0, 1000), (c[0][0], c[-1][1]))
        for (a, b), (a2, b2) in zip(c, c[1:]):
            self.assertGreater(b, a2)            # hay traslape
        self.assertTrue(330 <= c[1][0] < 340 or 330 <= c[0][1] < 340)

    def test_unir_quita_lineas_duplicadas_del_traslape(self):
        a = 'Cálculo diferencial 3 1 4 7\nÁlgebra lineal 3 0 3 6\nFísica general 3 2 5 8'
        b = 'Álgebra lineal 3 0 3 6\nFísica general 3 2 5 8\nProgramación 2 2 4 6'
        self.assertEqual(a + '\nProgramación 2 2 4 6', p.unir([a, b]))
        # filas solo numéricas iguales no son traslape si no son un bloque final/inicial idéntico más corto
        self.assertEqual('X 1 2 3 4\nY 1 2 3 4', p.unir(['X 1 2 3 4', 'Y 1 2 3 4']))

    def test_mejor_resultado_y_diferencia_total(self):
        def plan(sub):
            nv = [{'nivel': 1, 'materias': [p.materia_de('M', [3, 1, 4, 7])], 'subtotal': {'creditos_tepic': sub}}]
            return {'niveles': nv, 'validacion': p.validar(nv, None)}
        ok, cerca, lejos = plan(7), plan(8), plan(20)
        self.assertEqual(1, p.dif_total(cerca))
        self.assertLess(p.clave_mejor(ok), p.clave_mejor(cerca))
        self.assertLess(p.clave_mejor(cerca), p.clave_mejor(lejos))
        self.assertEqual(float('inf'), p.dif_total({'niveles': [], 'validacion': {}}))


class SoloAnalisis(unittest.TestCase):
    def test_cache_sin_pdf_render_ocr_llm_ni_red(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as carpeta:
            base = pathlib.Path(carpeta)
            (base / 'img').mkdir()
            (base / 'img' / 'ficticio-p1.ocr.txt').write_text('SEMESTRE I\n' + CAB +
                '\nMateria 3 0 3 6\nSUBTOTAL 3 0 3 6', encoding='utf-8')
            (base / 'img' / 'portada-p1.ocr.txt').write_text('Ingeniería ficticia\nPlan 2020', encoding='utf-8')
            with patch.object(p, 'BASE', base), patch.object(p, 'renderizar', side_effect=AssertionError('render')), \
                    patch.object(p, 'ocr_pagina', side_effect=AssertionError('OCR')), \
                    patch.object(p, 'respaldo_llm', side_effect=AssertionError('LLM')), \
                    patch.object(p.urllib.request, 'urlopen', side_effect=AssertionError('red')), \
                    patch.object(p.sys, 'argv', ['planes_ocr.py', '--solo-analisis']), \
                    contextlib.redirect_stdout(io.StringIO()):
                p.main()
            resumen = json.loads((base / 'json' / '_resumen.json').read_text(encoding='utf-8'))
            self.assertEqual(1, resumen['conteos']['ok'])
            self.assertEqual(1, resumen['conteos']['no_es_tabla'])
            self.assertEqual(2, sum(resumen['conteos'].values()))
            self.assertIn('ficticio.pdf', resumen['pdfs'])

    def test_cache_faltante_no_intenta_ocr(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as carpeta, patch.object(p, 'BASE', pathlib.Path(carpeta)):
            with self.assertRaisesRegex(FileNotFoundError, 'no se ejecutará OCR'):
                p.procesar(pathlib.Path('ausente.pdf'), [1], 1,
                           {'solo_analisis': True, 'solo_ocr': False, 'sin_llm': False})

    @unittest.skipUnless((p.BASE / 'json' / '_antes.json').exists(), 'Comparación local requiere la línea base')
    def test_conserva_los_20_planes_validos_de_la_cache(self):
        antes = json.loads((p.BASE / 'json' / '_antes.json').read_text(encoding='utf-8'))
        validos = {n: d for n, d in antes.items() if d['validacion']['ok'] and any(x['materias'] for x in d['niveles'])}
        self.assertEqual(20, len(validos))
        for nombre, previo in validos.items():
            with self.subTest(pdf=nombre):
                nuevo = json.loads((p.BASE / 'json' / (nombre + '.json')).read_text(encoding='utf-8'))
                self.assertEqual('ok', nuevo['validacion']['estado'])
                self.assertEqual(previo['niveles'], nuevo['niveles'])
                self.assertEqual(previo['total'], nuevo['total'])

    @unittest.skipUnless((p.BASE / 'json' / '_antes.json').exists(), 'Requiere el corpus OCR local')
    def test_regenera_corpus_entero_sin_red(self):
        with patch.object(p, 'renderizar', side_effect=AssertionError('render')), \
                patch.object(p, 'ocr_pagina', side_effect=AssertionError('OCR')), \
                patch.object(p, 'respaldo_llm', side_effect=AssertionError('LLM')), \
                patch.object(p.urllib.request, 'urlopen', side_effect=AssertionError('red')), \
                patch.object(p.sys, 'argv', ['planes_ocr.py', '--solo-analisis']), \
                contextlib.redirect_stdout(io.StringIO()):
            p.main()
        resumen = json.loads((p.BASE / 'json' / '_resumen.json').read_text(encoding='utf-8'))
        self.assertEqual(82, len(resumen['pdfs']))
        self.assertEqual(0, resumen['conteos']['pendiente'])


if __name__ == '__main__':
    unittest.main()
