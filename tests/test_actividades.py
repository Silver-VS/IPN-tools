"""Contrato del catálogo extracurricular, sin consultas de red."""
import json
import re
import unittest
from pathlib import Path
from urllib.parse import urlparse

RAIZ = Path(__file__).resolve().parents[1]


class Actividades(unittest.TestCase):
    def test_catalogo_documentado_sin_precios(self):
        datos = json.loads((RAIZ / 'data/guia/actividades-upiita.json').read_text(encoding='utf-8'))
        self.assertEqual(datos['categorias'], ['idiomas', 'deporte', 'cultura', 'salud', 'servicios'])
        self.assertEqual(set(datos['categorias']), {a['categoria'] for a in datos['elementos']})
        for a in datos['elementos']:
            with self.subTest(nombre=a['nombre']):
                for clave in ('nombre', 'ofrece', 'url', 'consulta'):
                    self.assertTrue(a[clave].strip(), clave)
                for clave in ('requisitos', 'inscripcion', 'donde'):
                    self.assertIsInstance(a[clave], str)
                url = urlparse(a['url'])
                self.assertEqual(url.scheme, 'https')
                self.assertTrue(url.hostname == 'ipn.mx' or url.hostname.endswith('.ipn.mx') or url.hostname == 'canalonce.mx')
                self.assertEqual(a['consulta'], '2026-10-23')
                self.assertNotRegex(json.dumps(a, ensure_ascii=False), r'\$|\bMXN\b|\d+\s*pesos|sin fuente|\]\(')
                self.assertNotIn('precio', a)


if __name__ == '__main__':
    unittest.main()
