"""Pruebas aleatorias de perfiles académicos (tests/fuzz/fuzz_perfiles.js) en las tres unidades.

Arma web/dist/qa-fuzz-<unidad>.html (la página compilada más el script de pruebas; los qa-* no se publican), la abre en
Chrome sin ventana y revisa que ninguna invariante falle. Requiere haber compilado (tools/build_horarios.py) y Chrome
instalado; si no lo encuentra, la prueba se omite.

Variables de entorno: FUZZ_N (perfiles por corrida, 110 por omisión), FUZZ_SEMILLAS (p. ej. "1,2,3").
Para reproducir una falla: abre qa-fuzz-<unidad>.html?n=<N>&semilla=<S> en el navegador y lee #fuzz-resultado.
"""
import json, os, pathlib, re, shutil, subprocess, tempfile, unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIST = ROOT / 'web' / 'dist'
FUZZ = ROOT / 'tests' / 'fuzz' / 'fuzz_perfiles.js'
CHROME = next((p for p in [os.environ.get('CHROME', ''), r'C:\Program Files\Google\Chrome\Application\chrome.exe',
                           r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', shutil.which('google-chrome') or '',
                           shutil.which('chromium') or ''] if p and pathlib.Path(p).exists()), None)
N = int(os.environ.get('FUZZ_N', '110'))
SEMILLAS = [int(s) for s in os.environ.get('FUZZ_SEMILLAS', '1,2,3').split(',')]


def pagina(unidad):
    src = DIST / 'sate/index.html'
    if not src.exists():
        return None
    html = src.read_text(encoding='utf-8')
    datos = {}
    for bloque in ('nucleo', 'oferta', 'tramites'):
        datos.update(json.loads((DIST / f'sate/datos/{unidad}/{bloque}.json').read_text(encoding='utf-8')))
    # Fixture autocontenido: no fetch desde file:// ni redirección al cascarón.
    arranque = ('<script>window.SATE_UNIDAD=' + json.dumps(unidad) + ';window.SATE_DATA='
                + json.dumps(datos, ensure_ascii=False).replace('<', '\\u003c') + ';'
                + "localStorage.setItem('ipnt.bienvenida','1');let QA_API;"
                + "window.SATE={modulos:{},actual:{pestana:'mapa'},pestana(id,m){this.modulos[id]=m},"
                + "error(e){throw e},nucleoListo(a){QA_API=a;return Promise.resolve()},ir(){},"
                + "repintar(){QA_API.renderTop();QA_API.renderAviso();if(QA_API.estado.tab==='hor')QA_API.renderHor();else QA_API.renderTray()}};"
                + '</script><script src="nucleo.js"></script><script src="mapa.js"></script><script src="horarios.js"></script>')
    html = html.replace('<script src="inicio.js"></script>', arranque)
    html += ('\n<script>document.getElementById("v-tray").hidden=false;SATE.repintar();</script>\n<script>'
             + FUZZ.read_text(encoding='utf-8') + '</script>\n')
    out = DIST / 'sate' / f'qa-fuzz-{unidad}.html'
    out.write_text(html, encoding='utf-8')
    return out


def correr(archivo, semilla):
    perfil = tempfile.mkdtemp(prefix='fuzz-chrome-')
    try:
        r = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-first-run', f'--user-data-dir={perfil}',
                            '--allow-file-access-from-files', '--window-size=1280,900', '--virtual-time-budget=600000',
                            '--dump-dom', archivo.as_uri() + f'?n={N}&semilla={semilla}'],
                           capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=900)
    finally:
        shutil.rmtree(perfil, ignore_errors=True)
    m = re.search(r'<pre id="fuzz-resultado">({.*?)</pre>', r.stdout, re.S)
    if not m:
        return None
    return json.loads(m.group(1).replace('&quot;', '"').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&'))


@unittest.skipUnless(CHROME, 'Chrome no está disponible')
class FuzzPerfiles(unittest.TestCase):
    def _unidad(self, unidad):
        archivo = pagina(unidad)
        if archivo is None:
            self.skipTest(f'falta compilar horarios-{unidad}.html')
        for semilla in SEMILLAS:
            with self.subTest(unidad=unidad, semilla=semilla):
                res = correr(archivo, semilla)
                self.assertIsNotNone(res, 'la página no produjo resultado (¿error al cargar?)')
                self.assertEqual(res['casos'], N)
                self.assertEqual(res['cobertura']['personal'], N, 'perfiles no reconocidos como del alumno')
                self.assertGreater(res['cobertura']['horariosGenerados'], 0, 'no se generó ningún horario')
                resumen = '\n'.join(f"[{f['caso'].get('esc')} {f['caso'].get('car')} #{f['caso'].get('i')}"
                                    f"{' ' + f['caso']['modo'] if f['caso'].get('modo') else ''}] {f['prueba']}: "
                                    f"{f.get('detalle') or f.get('error')}" for f in res['fallas'][:25])
                self.assertEqual(res['fallas'], [], f'{len(res["fallas"])} fallas (semilla {semilla}):\n{resumen}')

    def test_upiita(self):
        self._unidad('upiita')

    def test_escom(self):
        self._unidad('escom')

    def test_upibi(self):
        self._unidad('upibi')


if __name__ == '__main__':
    unittest.main()
