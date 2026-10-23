"""Regresiones de SATE encontradas en la revisión visual (2026-10-22)."""
import pathlib
import re
import unittest

RAIZ = pathlib.Path(__file__).resolve().parents[1]


class TestSelectorCalendario(unittest.TestCase):
    def test_sin_selector_generico_cal(self):
        for js in (RAIZ / 'web/sate').glob('*.js'):
            texto = js.read_text(encoding='utf-8')
            self.assertIsNone(re.search(r"querySelectorAll\(\s*['\"]\.cal['\"]\s*\)", texto), js.name)


    def test_sate_actual_es_objeto(self):
        # SATE.actual es {unidad, pestana, …}: compararlo con una cadena nunca es verdadero
        for js in (RAIZ / 'web/sate').glob('*.js'):
            texto = js.read_text(encoding='utf-8')
            self.assertIsNone(re.search(r"SATE\.actual\s*===?\s*['\"]", texto), js.name)


if __name__ == '__main__':
    unittest.main()
