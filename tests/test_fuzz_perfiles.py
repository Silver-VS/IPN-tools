"""Fuzz de perfiles: pendiente de portar el DOM completo a un arnés sin navegador.

El arnés anterior reemplazaba inicio.js y accedía a QA_API antes de que
SATE.nucleoListo registrara la API. Se retira ese arranque y el lanzador de
Chrome: no son compatibles con la política de ejecución sin navegadores.
Las invariantes originales se conservan en tests/fuzz/fuzz_perfiles.js.
"""
import unittest


@unittest.skip("Fuzz requiere DOM y renderizado de SATE; pendiente portar a jsdom/vm. Navegadores prohibidos en R15-PUL.")
class FuzzPerfiles(unittest.TestCase):
    def test_upiita(self):
        pass

    def test_escom(self):
        pass

    def test_upibi(self):
        pass
