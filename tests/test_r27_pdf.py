"""Verifica los PDF descargados por qa_r27_hor.mjs, sin generar datos personales."""
import json
from pathlib import Path
import re
import unittest

from pypdf import PdfReader


class HorariosPdf(unittest.TestCase):
    def test_texto_en_todas_las_modalidades(self):
        carpeta = Path('web/dist/qa-r27-hor')
        esperado = json.loads((carpeta / 'expected.json').read_text(encoding='utf-8'))
        nombre, segundo = esperado['name'], esperado['second']
        archivos = list(carpeta.glob('*.pdf'))
        self.assertEqual(len(archivos), 12)
        for archivo in archivos:
            with self.subTest(pdf=archivo.name):
                pdf = PdfReader(archivo)
                self.assertEqual(len(pdf.pages), 2 if archivo.stem.endswith('-one') else 1)
                for i, pagina in enumerate(pdf.pages):
                    texto = re.sub(r'\s+', ' ', pagina.extract_text())
                    self.assertIn(segundo if i else nombre, texto)
                    self.assertIn('Horario', texto)
                    self.assertEqual(len(pagina.images), 0, 'Sin capturas incrustadas')
                if archivo.stem.endswith('-two'):
                    texto = pdf.pages[0].extract_text()
                    self.assertIn('Horario A', texto)
                    self.assertIn('Horario B', texto)
                    self.assertIn(segundo, re.sub(r'\s+', ' ', texto))
                print(archivo.name, len(pdf.pages), 'hojas, texto seleccionable:', nombre)


if __name__ == '__main__':
    unittest.main()
