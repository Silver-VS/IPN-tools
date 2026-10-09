"""Contratos de partición de datos y build compatible, sin navegador."""
import pathlib
import functools
import http.server
import json
import re
import sys
import threading
import subprocess
import unittest
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))


class SateBuild(unittest.TestCase):
    def test_unidad_generica_y_lector(self):
        resultado = subprocess.run([r'D:\Tools\nodejs\node.exe', 'tests/qa_sate_generico.mjs'], cwd=ROOT,
                                   capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)

    def test_ventanilla_y_pdf(self):
        for archivo in ('qa_sate_ventanilla.mjs', 'qa_sate_pdf.mjs', 'qa_sate_electivas.mjs'):
            with self.subTest(archivo=archivo):
                resultado = subprocess.run([r'D:\Tools\nodejs\node.exe', 'tests/' + archivo], cwd=ROOT,
                                           capture_output=True, text=True, encoding='utf-8')
                self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)

    def test_recortes_del_calendario(self):
        """API, filtros y clic al proceso con DOM en memoria y datos ficticios."""
        resultado = subprocess.run(
            [r'D:\Tools\nodejs\node.exe', 'tests/qa_sate_calendario.mjs'], cwd=ROOT,
            capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)

    def test_mi_semana(self):
        """Rutina opcional y los tres modos reales del generador, sin red ni navegador."""
        resultado = subprocess.run(
            [r'D:\Tools\nodejs\node.exe', 'tests/qa_sate_semana.mjs'], cwd=ROOT,
            capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)

    def test_primera_visita_sin_datos(self):
        """Salidas, ayuda recordada y pegado con permisos o respaldo manual."""
        resultado = subprocess.run(
            [r'D:\Tools\nodejs\node.exe', 'tests/qa_sate_primera_visita.mjs'], cwd=ROOT,
            capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)

    def test_planeacion_un_periodo_y_anual(self):
        """Perfiles ficticios y DOM local: conserva datos, selección, carga y oferta."""
        resultado = subprocess.run(
            [r'D:\Tools\nodejs\node.exe', 'tests/qa_sate_cargas.mjs'], cwd=ROOT,
            capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)

    def test_avisos_por_pestana(self):
        resultado = subprocess.run(
            [r'D:\Tools\nodejs\node.exe', 'tests/qa_sate_situacion.mjs'], cwd=ROOT,
            capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(resultado.returncode, 0, resultado.stdout + resultado.stderr)

    def test_particion_conserva_campos_e_indices(self):
        from build_sate import separar_datos
        data = {'mapas': {'DEMO': {'cur': {}}}, 'periodos': {'actual': [[0, 1, 2]]},
                'asig': ['Materia ficticia'], 'prof': ['Docente ficticio'],
                'calendario': {'periodo': '27/1'}, 'equiv': {'rel': [['a', 'b']]}}
        nucleo, oferta, tramites = separar_datos(data)
        self.assertEqual(data, {**nucleo, **oferta, **tramites})
        self.assertNotIn('periodos', nucleo)
        self.assertEqual(nucleo['calendario'], tramites['calendario'])
        self.assertIs(data['periodos'], oferta['periodos'])

    def test_redireccion_no_embebe_datos_academicos(self):
        from build_sate import redireccion
        html = redireccion('upibi')
        self.assertNotIn('const DATA=', html)
        self.assertIn('location.search,location.hash', html)
        self.assertIn('sate/index.html', html)

    def test_recursos_publicados_por_http(self):
        """Resuelve las rutas como http.server --directory web, sin navegador."""
        class Servidor(http.server.SimpleHTTPRequestHandler):
            def log_message(self, formato, *args):
                pass

        handler = functools.partial(Servidor, directory=str(ROOT / 'web'))
        with http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler) as servidor:
            hilo = threading.Thread(target=servidor.serve_forever, daemon=True)
            hilo.start()
            try:
                base = f'http://127.0.0.1:{servidor.server_port}/dist/sate/'
                with urllib.request.urlopen(base + 'index.html') as respuesta:
                    html = respuesta.read().decode('utf-8')
                rutas = set(re.findall(r'(?:src|href)="([^"#]+)"', html))
                rutas = {r for r in rutas if not re.match(r'[a-z]+:', r)}
                rutas.update(('nucleo.js', 'situacion.js', 'desempeno.js', 'mapa.js',
                              'horarios.js', 'exportacion.js', 'saes-dialogo.js', 'tramites.js',
                              '../tramites/pdf-comun.js', '../tramites/pdf-dictamen.js', '../tramites/pdf-electivas.js'))
                config = json.loads(re.search(r'window.SATE_CONFIG=(.*?);</script>', html, re.S)[1])
                for unidad, cfg in config['unidades'].items():
                    rutas.update(f'datos/{unidad}/{nombre}.json' for nombre in ('nucleo', 'oferta'))
                    rutas.update('../' + cfg['logo'][tema] for tema in ('claro', 'oscuro') if 'logo' in cfg)
                for ruta in sorted(rutas):
                    with self.subTest(ruta=ruta):
                        with urllib.request.urlopen(base + ruta) as respuesta:
                            self.assertEqual(respuesta.status, 200, ruta)
            finally:
                servidor.shutdown()
                hilo.join()


if __name__ == '__main__':
    unittest.main()
