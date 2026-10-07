"""Contratos de partición de datos y build compatible, sin navegador."""
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))


class SateBuild(unittest.TestCase):
    def test_particion_conserva_campos_e_indices(self):
        from build_sate import separar_datos
        data = {'mapas': {'DEMO': {'cur': {}}}, 'periodos': {'actual': [[0, 1, 2]]},
                'asig': ['Materia ficticia'], 'prof': ['Docente ficticio'],
                'calendario': {'periodo': '27/1'}, 'equiv': {'rel': [['a', 'b']]}}
        nucleo, oferta, tramites = separar_datos(data)
        self.assertEqual(data, {**nucleo, **oferta, **tramites})
        self.assertNotIn('periodos', nucleo)
        self.assertEqual(nucleo['calendario'], tramites['calendario'])
        self.assertIs(data['periodos'], oferta['periodos'])

    def test_redireccion_no_embebe_datos_academicos(self):
        from build_sate import redireccion
        html = redireccion('upibi')
        self.assertNotIn('const DATA=', html)
        self.assertIn('location.search,location.hash', html)
        self.assertIn('sate/index.html', html)


if __name__ == '__main__':
    unittest.main()
