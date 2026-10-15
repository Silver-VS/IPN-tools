"""AYUDA1: catálogo de perfiles de prueba ficticios (data/perfiles-prueba/). Sin navegador ni red."""
import json
import pathlib
import re
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import perfiles_prueba as PP

DIR = ROOT / 'data' / 'perfiles-prueba'
IDX_META = 27 * 2   # 27/1: reinscripción en curso (data/calendario.json)


def idx(p):
    m = re.match(r'^(?:20)?(\d{2})/?([12])$', str(p))
    return int(m.group(1)) * 2 + int(m.group(2)) - 1


class PerfilesPrueba(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.indice = json.loads((DIR / 'indice.json').read_text(encoding='utf-8'))
        cls.perfiles = {p['id']: json.loads((DIR / p['archivo']).read_text(encoding='utf-8')) for p in cls.indice['perfiles']}
        cls.infos = {c: PP.plan_info(c) for c in 'BMT'}

    def test_reproducible(self):
        """Los archivos son exactamente lo que genera tools/perfiles_prueba.py con la semilla fija."""
        for nombre, texto in PP.generar().items():
            with self.subTest(archivo=nombre):
                self.assertEqual((DIR / nombre).read_text(encoding='utf-8'), texto)
        self.assertEqual(PP.generar(), PP.generar())

    def test_indice(self):
        p = self.indice['perfiles']
        self.assertEqual([x['caso'] for x in p], list(range(1, 10)))
        self.assertEqual(len({x['id'] for x in p}), len(p))
        self.assertEqual(sorted(f.name for f in DIR.glob('*.json')), sorted([x['archivo'] for x in p] + ['indice.json']))
        for x in p:
            self.assertTrue(x['titulo'] and x['demuestra'] and x['carrera_nombre'])
        self.assertGreaterEqual(sum(x['carrera'] in 'BMT' for x in p), 9)
        self.assertEqual({x['carrera'] for x in p}, {'B', 'M', 'T'})

    def test_sin_datos_reales(self):
        for id_, d in self.perfiles.items():
            with self.subTest(perfil=id_):
                texto = json.dumps(d, ensure_ascii=False)
                self.assertRegex(d['boleta'], r'^2099\d{6}$')
                self.assertIn('FICTIC', d['nombre'])
                self.assertIn('PRUEBA', d['nombre'])
                self.assertNotRegex(texto, r'[\w.+-]+@[\w.-]+\.[a-z]{2,}')
                self.assertNotRegex(texto, r'[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d')
                self.assertEqual(len(set(re.findall(r'(?<!\d)\d{10}(?!\d)', texto))), 1)   # solo la boleta ficticia
        self.assertEqual(len({d['boleta'] for d in self.perfiles.values()}), len(self.perfiles))

    def test_formato_que_lee_sate(self):
        """Mismos campos que el Lector (tools/lector_saes.js) y que SAES.load/parse exigen."""
        obligatorios = {'upiita_saes', 'unidad', 'leido', 'boleta', 'nombre', 'carrera', 'plan', 'promedio', 'cita', 'carga', 'avance',
                        'reprobadas_periodo', 'en_curso', 'horario_inscrito', 'acreditadas', 'kardex_reprobadas', 'agenda'}
        for id_, d in self.perfiles.items():
            with self.subTest(perfil=id_):
                self.assertTrue(obligatorios <= set(d), obligatorios - set(d))
                self.assertEqual(d['upiita_saes'], 1)
                self.assertEqual(d['unidad'], 'upiita')
                self.assertEqual(d['plan'], '09')
                self.assertIn(d['carrera'], 'BMT')
                for a in d['acreditadas']:
                    self.assertEqual(len(a), 4)
                    self.assertTrue(6 <= a[1] <= 10)
                    self.assertRegex(a[2], r'^\d{2}/[12]$')
                for r in d['reprobadas_periodo']:
                    self.assertRegex(r[1], r'^20\d{2}[12]$')
                for r in d['kardex_reprobadas']:
                    self.assertLess(r[1], 6)

    def test_claves_en_el_mapa_y_creditos(self):
        for id_, d in self.perfiles.items():
            info = self.infos[d['carrera']]
            cur = info['cur']
            with self.subTest(perfil=id_):
                claves = [a[0] for a in d['acreditadas']] + d['en_curso'] + [r[0] for r in d['reprobadas_periodo']] \
                    + [r[0] for r in d['kardex_reprobadas']]
                for k in claves:
                    self.assertIn(k, cur, f'{k} no está en el mapa {d["carrera"]}/09')
                self.assertEqual(set(d['materias']), set(claves))
                acr = [a[0] for a in d['acreditadas']]
                self.assertEqual(len(acr), len(set(acr)), 'acreditadas duplicadas')
                self.assertFalse(set(acr) & set(d['en_curso']))
                self.assertFalse(set(acr) & {r[0] for r in d['reprobadas_periodo']})
                self.assertFalse(set(d['en_curso']) & {r[0] for r in d['reprobadas_periodo']})
                obt = sum(cur[k]['cr'] for k in acr)
                self.assertAlmostEqual(d['avance']['obtenidos'], obt)
                self.assertAlmostEqual(d['avance']['faltan'], d['carga']['total'] - obt)
                self.assertAlmostEqual(d['carga']['total'], info['total'])
                self.assertGreaterEqual(d['avance']['faltan'], 0)
                # promedio oficial: todo el kárdex, con las reprobadas
                filas = [a[1] for a in d['acreditadas']] + [r[1] for r in d['kardex_reprobadas']]
                if filas:
                    self.assertAlmostEqual(d['promedio'], round(sum(filas) / len(filas), 2))
                else:
                    self.assertIsNone(d['promedio'])
                # periodos: nada posterior al último cerrado (26/1) y en curso con carga razonable
                for a in d['acreditadas']:
                    self.assertLessEqual(idx(a[2]), 26 * 2)
                cr_enc = sum(cur[k]['cr'] for k in d['en_curso'])
                self.assertLessEqual(cr_enc, d['carga']['max'])
                # tipos: electivas liberadas son «ELECTIVA», optativas no exceden los espacios del mapa
                opt = [k for k in acr if cur[k]['tipo'] == 'OPTATIVA' and k not in info['obl']]
                self.assertLessEqual(len(opt), len(PP.ESPACIOS_OPT[d['carrera']]))

    def test_seriacion(self):
        """Lo cursado (salvo revalidado) cumple los requisitos de la seriación con periodos anteriores."""
        for id_, d in self.perfiles.items():
            info = self.infos[d['carrera']]
            with self.subTest(perfil=id_):
                per = {a[0]: idx(a[2]) for a in d['acreditadas']}
                for a in d['acreditadas']:
                    if a[3] == 'EQV':
                        continue
                    for r in info['req'].get(a[0], []):
                        self.assertIn(r, per, f'{a[0]} sin {r}')
                        self.assertLess(per[r], per[a[0]], f'{a[0]} no puede cursarse con {r} en el mismo periodo')
                for k in d['en_curso']:
                    for r in info['req'].get(k, []):
                        self.assertIn(r, per, f'en curso {k} sin {r}')

    def p(self, id_):
        return self.perfiles[id_]

    def test_caso1_primer_ingreso(self):
        d = self.p('primer-ingreso-bionica')
        self.assertEqual(d['acreditadas'], [])
        self.assertEqual(d['kardex_reprobadas'], [])
        self.assertEqual(d['reprobadas_periodo'], [])
        self.assertGreaterEqual(len(d['en_curso']), 4)
        self.assertEqual(d['avance']['obtenidos'], 0)
        cur = self.infos['B']['cur']
        self.assertTrue(all(cur[k]['nivel'] == 1 for k in d['en_curso']))
        self.assertIsNone(d['promedio'])

    def test_caso2_regular(self):
        d = self.p('regular-mecatronica')
        self.assertEqual(d['reprobadas_periodo'], [])
        self.assertEqual(d['kardex_reprobadas'], [])
        self.assertGreaterEqual(len({a[2] for a in d['acreditadas']}), 5)
        self.assertEqual({a[3] for a in d['acreditadas']} - {'ORD', 'EXT', 'ETS'}, set())
        self.assertTrue(0.2 <= d['avance']['obtenidos'] / d['carga']['total'] <= 0.7)

    def test_caso3_adeuda(self):
        d = self.p('adeuda-telematica')
        acr = {a[0] for a in d['acreditadas']}
        rep = [r[0] for r in d['reprobadas_periodo']]
        self.assertGreaterEqual(len(rep), 2)
        self.assertFalse(set(rep) & acr)                       # reprobadas sin aprobar
        self.assertFalse(set(rep) & set(d['en_curso']))        # y sin recursar todavía
        self.assertEqual(d['reprobadas_num'], len(rep))
        self.assertEqual(len(d['reprobadas']), len(rep))
        for r in d['reprobadas_periodo']:
            self.assertLessEqual(idx(r[1]) + 2, IDX_META)       # a lo más en riesgo, aún no desfasada
            self.assertGreaterEqual(idx(r[1]) + 2, IDX_META)
        self.assertIn('MEDIA-REPROBADAS', d['avance']['autorizada'])

    def test_caso4_desfase_dictamen(self):
        d = self.p('desfase-dictamen-bionica')
        rep = {r[0]: r for r in d['reprobadas_periodo']}
        self.assertGreaterEqual(len(rep), 2)
        self.assertFalse(set(rep) & {a[0] for a in d['acreditadas']})
        veces = {k: sum(1 for x in d['kardex_reprobadas'] if x[0] == k) for k in rep}
        # una desfasada desde hace más de 3 periodos (necesita dictamen) y otra con dos intentos (agotada)
        antigua = [k for k, r in rep.items() if idx(r[1]) < IDX_META - 3]
        agotada = [k for k, r in rep.items() if r[2] >= 2 and veces[k] >= 2]
        self.assertTrue(antigua, 'falta una reprobada de dictamen por antigüedad')
        self.assertTrue(agotada, 'falta una reprobada con veces cursada >= 2')
        for k, r in rep.items():
            self.assertGreater(IDX_META, idx(r[1]) + 2)         # desfasada respecto de 27/1
        self.assertIn('Tienes 2 materias reprobadas', d['desfase_saes'])

    def test_caso5_electivas_por_liberar(self):
        d = self.p('electivas-por-liberar-bionica')
        info = self.infos['B']
        lib = [a[0] for a in d['acreditadas'] if a[0] in info['ele']]
        self.assertTrue(0 < len(lib) < len(info['ele']), 'debe haber electivas liberadas y otras por liberar')
        self.assertLess(d['avance']['obtenidos'] + 0, d['carga']['total'])
        self.assertTrue(set(info['ele']) - set(lib))

    def test_caso6_electivas_liberadas(self):
        d = self.p('electivas-liberadas-mecatronica')
        info = self.infos['M']
        self.assertEqual({a[0] for a in d['acreditadas'] if a[0] in info['ele']}, set(info['ele']))

    def test_caso7_por_egresar(self):
        d = self.p('por-egresar-telematica')
        info = self.infos['T']
        acr = {a[0] for a in d['acreditadas']}
        self.assertTrue(set(info['ele']) <= acr)
        self.assertEqual(len([k for k in acr if info['cur'][k]['tipo'] == 'OPTATIVA' and k not in info['obl']]),
                         len(PP.ESPACIOS_OPT['T']))
        pendientes = [k for k in info['obl'] if k not in acr and k not in d['en_curso']]
        cr_enc = sum(info['cur'][k]['cr'] for k in d['en_curso'])
        cr_pend = sum(info['cur'][k]['cr'] for k in pendientes)
        # periodos que aún necesita (con la seriación): el que cursa ahora y a lo más uno más
        self.assertLessEqual(PP.periodos_que_faltan(info, acr | set(d['en_curso'])), 1)
        self.assertLessEqual(d['avance']['faltan'], 2 * d['carga']['media'])
        self.assertAlmostEqual(d['avance']['faltan'], cr_enc + cr_pend)   # no queda nada fuera del cálculo
        self.assertGreaterEqual(d['avance']['obtenidos'] / d['carga']['total'], 0.75)

    def test_caso8_cambio_de_carrera(self):
        d = self.p('cambio-carrera-mecatronica')
        info = self.infos['M']
        origen = self.infos['B']
        rev = [a for a in d['acreditadas'] if a[3] == 'EQV']
        self.assertGreaterEqual(len(rev), 8)
        nombres_origen = {origen['cur'][k]['nombre'] for k in origen['obl']}
        self.assertTrue(all(info['cur'][a[0]]['nombre'] in nombres_origen for a in rev))   # coinciden con Bionica
        self.assertEqual(len({a[2] for a in rev}), 1)           # todas en el primer periodo de la carrera nueva
        self.assertGreater(len(d['acreditadas']), len(rev))     # y además cursó en la carrera nueva
        self.assertEqual(d['carrera'], 'M')

    def test_caso9_baja_temporal(self):
        d = self.p('baja-temporal-bionica')
        usados = sorted({idx(a[2]) for a in d['acreditadas']})
        huecos = [b - a - 1 for a, b in zip(usados, usados[1:])]
        self.assertTrue(any(h >= 1 for h in huecos), 'debe haber al menos un periodo completo sin cursar')
        self.assertEqual(d['avance']['cursados'], len(usados) + 1)   # incluye el periodo en curso
        self.assertLess(d['avance']['cursados'], idx('26/2') - usados[0] + 1)


if __name__ == '__main__':
    unittest.main()
