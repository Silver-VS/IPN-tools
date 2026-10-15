"""Integración node/pdf-lib y lectura geométrica independiente con pdfplumber."""
import base64
import json
from pathlib import Path
import subprocess
import sys
import unittest

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from build_sate import datos_bajas


class BajasPDF(unittest.TestCase):
    def test_originales(self):
        datos = datos_bajas()
        for tipo in ('temporal', 'definitiva'):
            self.assertEqual(base64.b64decode(datos['pdfs'][tipo]),
                             (ROOT / 'data/gestion_escolar' / datos[tipo]).read_bytes())

    def test_campos_pdf(self):
        resultado = subprocess.run([r'D:\Tools\nodejs\node.exe', 'tests/qa_sate_bajas_pdf.mjs'],
                                   cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)
        alumno = json.loads((ROOT / 'data/perfiles-prueba/regular-mecatronica.json').read_text(encoding='utf-8'))
        # Recuadros del original medidos con pdfplumber: x0, top, x1, bottom.
        campos = {
            'temporal': {'fecha': (327.3, 367.1, 546.6, 387.8), 'paterno': (148.7, 393.3, 301.6, 418.3),
                         'materno': (302.1, 393.3, 427.3, 418.3), 'nombres': (427.8, 393.3, 566.9, 418.3),
                         'boleta': (184, 432.7, 310.2, 457.6), 'carrera': (390.7, 432.7, 566.9, 457.6),
                         'correo': (250, 623.4, 559.8, 642), 'celular': (285, 643, 559.8, 665),
                         'periodos': (360, 665, 559.8, 681), 'motivos': (57, 494.5, 559.8, 596.2)},
            'definitiva': {'fecha': (343.5, 316.4, 562.8, 336.9), 'paterno': (128.4, 341.4, 282.2, 366.4),
                           'materno': (282.6, 341.4, 405.3, 366.4), 'nombres': (405.9, 341.4, 574.5, 366.4),
                           'boleta': (148.6, 401.8, 268.4, 426.8), 'carrera': (345.2, 401.8, 574.5, 426.8),
                           'correo': (105.5, 441.9, 286.6, 466.9), 'celular': (363.3, 441.9, 574.5, 466.9),
                           'motivos': (22.1, 503.7, 574.5, 605.5)}}
        valores = dict(fecha='15/10/2026', paterno='PRUEBA', materno='FICTICIA', nombres='ALUMNO DEMO',
                       boleta=alumno['boleta'], carrera=alumno['carrera_nombre'], correo='demo@example.test',
                       celular='5500000000', periodos='27/1, 27/2',
                       motivos='Salud. Solicitud ficticia para verificar el formato.')
        for tipo, recuadros in campos.items():
            with pdfplumber.open(ROOT / f'tmp-baj2/baja-{tipo}-ejemplo.pdf') as pdf:
                for campo, bbox in recuadros.items():
                    with self.subTest(tipo=tipo, campo=campo):
                        texto = pdf.pages[0].crop(bbox).extract_text() or ''
                        self.assertIn(valores[campo], texto)
                pdf.pages[0].to_image(resolution=110).save(ROOT / f'tmp-baj2/baja-{tipo}-ejemplo.png')


if __name__ == '__main__':
    unittest.main()
