"""Datos oficiales y regresión del estampado de los módulos de Ventanilla."""
import base64
import pathlib
import sys
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from build_sate import datos_dictamen


class DictamenBuild(unittest.TestCase):
    def test_originales_embebidos_sin_cambios(self):
        datos = datos_dictamen()
        for tipo, nombre in [('interno', 'dictamen-interno-2026-1.pdf'),
                             ('externo', 'dictamen-externo-cosie-01.pdf')]:
            original = (ROOT / 'data/gestion_escolar' / nombre).read_bytes()
            self.assertEqual(base64.b64decode(datos['pdfs'][tipo]), original)

    def test_datos_reproducibles_y_estampado(self):
        self.assertEqual(datos_dictamen(), datos_dictamen())
        self.assertTrue(datos_dictamen()['materias'])
        resultado = subprocess.run([r'D:\Tools\nodejs\node.exe', 'tests/qa_sate_pdf.mjs'],
                                   cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)


if __name__ == '__main__':
    unittest.main()
