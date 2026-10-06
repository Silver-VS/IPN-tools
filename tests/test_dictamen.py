"""Contrato del build: originales intactos, salidas reproducibles y sin marcadores pendientes."""
import base64
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import build_dictamen


class DictamenBuild(unittest.TestCase):
    def test_originales_embebidos_sin_cambios(self):
        originales = {nombre: (ROOT / "data/gestion_escolar" / nombre).read_bytes()
                      for nombre in build_dictamen.PDFS.values()}
        html = build_dictamen.construir()
        for nombre, original in originales.items():
            self.assertIn(base64.b64encode(original).decode(), html)
            self.assertEqual(original, (ROOT / "data/gestion_escolar" / nombre).read_bytes())

    def test_compilacion_reproducible_y_completa(self):
        html = build_dictamen.construir()
        self.assertEqual(html, build_dictamen.construir())
        for marca in ["/*__DATA__*/", "/*__TEXTOS__*/", "/*__TOKENS__*/", "/*__COMPONENTES_JS__*/"]:
            self.assertNotIn(marca, html)
        self.assertNotIn("\ufffd", html)
        self.assertIn("Fase de prueba", html)
        self.assertNotIn("2099000000", html)  # El perfil de prueba no forma parte de la herramienta.


if __name__ == "__main__":
    unittest.main()
