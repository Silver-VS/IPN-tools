"""Fusión y capacidad de Guía sin alterar los datos editados por otros trabajadores."""
import ast
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
FIX = ROOT / 'tests/fixtures/guia'
leer = lambda nombre: json.loads((FIX / nombre).read_text(encoding='utf-8'))
arbol = ast.parse((ROOT / 'tools/build_sate.py').read_text(encoding='utf-8'))
funciones = ast.Module(body=[n for n in arbol.body if isinstance(n, ast.FunctionDef)
                            and n.name in ('fusionar_guia', 'tiene_guia', 'escribir_guia')], type_ignores=[])
ns = {'json': json, 'ROOT': ROOT, 'UNIDAD': 'escom'}
exec(compile(funciones, 'tools/build_sate.py', 'exec'), ns)


class TestGuia7(unittest.TestCase):
    def test_reemplazo_parcial_sin_mutar_origen(self):
        comun = leer('comun.json')
        original = json.loads(json.dumps(comun))
        cambio = {'id': 'consulta', 'reemplaza': True, 'ventanilla': 'dictamen', 'formato': None}
        fusion = ns['fusionar_guia'](comun, {'preguntas': [cambio]})
        self.assertEqual(fusion['preguntas'][0], {**comun['preguntas'][0], **cambio})
        self.assertEqual(comun, original)

    def test_fusion(self):
        comun, unidad = leer('comun.json'), leer('unidad.json')
        fusion = ns['fusionar_guia'](comun, unidad)
        self.assertEqual(fusion['preguntas'], unidad['preguntas'])
        self.assertEqual(set(fusion['documentos']), {'demo', 'manual'})
        self.assertEqual(set(fusion['glosario']), {'credito', 'local'})
        self.assertEqual([a['ambito'] for a in fusion['acudir']], ['ipn', 'unidad'])
        self.assertNotIn('ambito', comun['acudir'][0])

    def test_solo_comun(self):
        with tempfile.TemporaryDirectory() as tmp:
            raiz = Path(tmp)
            (raiz / 'data/guia').mkdir(parents=True)
            (raiz / 'data/gestion_escolar').mkdir()
            (raiz / 'data/gestion_escolar/bajas.json').write_text('{}', encoding='utf-8')
            (raiz / 'data/guia/comun.json').write_text(json.dumps(leer('comun.json')), encoding='utf-8')
            antes = ns['ROOT'], ns['UNIDAD']
            try:
                ns['ROOT'] = raiz
                for unidad in ('escom', 'upibi'):
                    self.assertTrue(ns['tiene_guia'](unidad))
                    ns['UNIDAD'] = unidad
                    destino = raiz / unidad
                    destino.mkdir()
                    ns['escribir_guia'](destino)
                    self.assertEqual(json.loads((destino / 'guia.json').read_text(encoding='utf-8'))['preguntas'], leer('comun.json')['preguntas'])
                (raiz / 'data/guia/comun.json').unlink()
                self.assertFalse(ns['tiene_guia']('escom'))
            finally:
                ns['ROOT'], ns['UNIDAD'] = antes


if __name__ == '__main__':
    if '--fusion' in sys.argv:
        print(json.dumps(ns['fusionar_guia'](leer('comun.json'), leer('unidad.json'))))
    else:
        unittest.main()
