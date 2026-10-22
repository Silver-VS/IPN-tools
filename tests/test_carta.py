"""Regresión del borrador de Carta de motivos con respuestas ficticias."""
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class CartaMotivos(unittest.TestCase):
    def test_respuestas_y_cierre(self):
        resultado = subprocess.run(
            [r'D:\Tools\nodejs\node.exe', 'tests/qa_sate_carta.mjs'],
            cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)


if __name__ == '__main__':
    unittest.main()
