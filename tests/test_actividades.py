"""Contratos del catálogo R27 y su integración compilada, sin red."""
import json
import unittest
from pathlib import Path
from urllib.parse import urlparse

RAIZ = Path(__file__).resolve().parents[1]
leer = lambda ruta: json.loads((RAIZ / ruta).read_text(encoding='utf-8'))


class Actividades(unittest.TestCase):
    def test_catalogo_y_procedencia(self):
        catalogo = leer('data/actividades.json')
        items = [a for s in catalogo['secciones'] for a in s['items']]
        self.assertEqual(len(items), 44)
        self.assertEqual(len({a['nombre'] for a in items}), 44)
        for a in items:
            with self.subTest(nombre=a['nombre']):
                for campo in ('nombre', 'descripcion', 'requisitos', 'horario', 'lugar', 'contacto'):
                    self.assertIsInstance(a[campo], str)
                    self.assertTrue(a[campo])
                url = urlparse(a['url'])
                self.assertEqual(url.scheme, 'https')
                self.assertTrue(url.hostname == 'ipn.mx' or url.hostname.endswith('.ipn.mx'))
                self.assertEqual(a['fuente']['url'], a['url'])
                self.assertEqual(a['fuente']['localizador'], a['nombre'])
                self.assertIn(a['estado'], ('verificado', 'no_verificado'))
        inventario = leer('data/texto_oficial.json')['archivos']['data/actividades.json']
        self.assertEqual(len(inventario['campos']), 6)

    def test_integracion_por_capacidad(self):
        origen = leer('data/actividades.json')['secciones']
        for unidad, total in [('upiita', 27), ('escom', 28), ('upibi', 27)]:
            with self.subTest(unidad=unidad):
                capacidad = leer('data/sate.json')['unidades'][unidad]['actividadesDatos']
                permitido = capacidad['ambitos']
                compilado = leer(f'web/dist/sate/datos/{unidad}/guia/actividades.json')['actividades']
                esperado = [dict(s, items=[a for a in s['items'] if a['unidad'] in permitido])
                            for s in origen if any(a['unidad'] in permitido for a in s['items'])]
                self.assertEqual(compilado['secciones'], esperado)
                self.assertEqual(sum(len(s['items']) for s in esperado), total)
                self.assertEqual(len(esperado), 6)
                indice = leer(f'web/dist/sate/datos/{unidad}/guia/indice.json')
                self.assertEqual(indice['actividades']['total'], total)


if __name__ == '__main__':
    unittest.main()
