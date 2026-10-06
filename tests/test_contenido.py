"""Pruebas de tools/contenido.py (validador de textos TOML y data/sate.json)."""
import pathlib, sys, tempfile, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "tools"))
import contenido  # noqa: E402


def validar_texto(toml, extra=None):
    with tempfile.TemporaryDirectory() as d:
        d = pathlib.Path(d)
        (d / "es.toml").write_text('version = "2026.10.1"\n' + toml, encoding="utf-8")
        for nombre, t in (extra or {}).items():
            (d / nombre).write_text('version = "2026.10.1"\n' + t, encoding="utf-8")
        return contenido.validar(d, sate=None)


class TestContenido(unittest.TestCase):
    def test_los_textos_reales_son_validos(self):
        self.assertEqual(contenido.validar(), [])

    def test_sate_json_y_toml_coinciden(self):
        t = contenido.objeto_t()
        self.assertEqual(t["sate.siglas"], "SATE")
        self.assertIn("{unidad}", t["sate.leyenda.prueba"])
        self.assertTrue(contenido.js().startswith("/* GENERADO"))

    def test_clave_duplicada(self):
        e = validar_texto('[a]\nx = "uno"\n[a]\ny = "dos"\n')
        self.assertTrue(any("TOML" in m for m in e), e)

    def test_variable_posicional_o_mal_formada(self):
        self.assertTrue(validar_texto('a = "Hola {0}"\n'))
        self.assertTrue(validar_texto('a = "Hola {nombre"\n'))
        self.assertTrue(validar_texto('a = "Hola nombre}"\n'))

    def test_variable_valida_y_plural(self):
        self.assertEqual(validar_texto('a = "Hola {nombre}"\nb = "{n, plural, one {# error} other {# errores}}"\n'), [])
        self.assertTrue(validar_texto('b = "{n, plural, one {# error}}"\n'))

    def test_acento_perdido(self):
        self.assertTrue(validar_texto('a = "Situaci?n escolar"\n'))
        self.assertEqual(validar_texto('a = "¿Cuál es tu unidad?"\n'), [])

    def test_clave_invalida_y_html(self):
        self.assertTrue(validar_texto('"Mala-Clave" = "x"\n'))
        self.assertTrue(validar_texto('a = "<script>x</script>"\n'))
        self.assertEqual(validar_texto('a = "<b>Ojo</b> con <a href=\\"#\\">esto</a>"\n'), [])

    def test_variables_distintas_entre_idiomas(self):
        e = validar_texto('a = "Hola {x}"\n', {"en.toml": 'a = "Hello {y}"\n'})
        self.assertTrue(any("distintas" in m for m in e), e)
        self.assertEqual(validar_texto('a = "Hola {x}"\n', {"en.toml": 'a = "Hello {x}"\n'}), [])

    def test_sate_json_exige_claves(self):
        errores = []
        contenido.validar_sate({"sate.leyenda.prueba"}, errores)
        self.assertTrue(any("sate.pestana.mapa.titulo" in m for m in errores))


if __name__ == "__main__":
    unittest.main()
