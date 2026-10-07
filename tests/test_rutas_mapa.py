"""Flechas de los mapas por áreas: ninguna atraviesa una materia ni se encima con otra de las que se dibujan completas."""
import json, pathlib, re, unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIST = ROOT / 'web' / 'dist'


def segmentos(p):
    pts = [(p[i], p[i + 1]) for i in range(0, len(p), 2)]
    return list(zip(pts, pts[1:]))


def cruza_caja(a, b, box, m=1.0):
    x, y, w, h = box[:4]
    if abs(a[0] - b[0]) < .01:      # vertical
        y0, y1 = sorted((a[1], b[1]))
        return x + m < a[0] < x + w - m and y0 < y + h - m and y1 > y + m
    x0, x1 = sorted((a[0], b[0]))   # horizontal
    return y + m < a[1] < y + h - m and x0 < x + w - m and x1 > x + m


class RutasMapa(unittest.TestCase):
    def mapas(self):
        for f in ('horarios-upiita.html', 'horarios-escom.html', 'horarios-upibi.html'):
            unidad = f.removeprefix('horarios-').removesuffix('.html')
            data = json.loads((DIST / 'sate/datos' / unidad / 'nucleo.json').read_text(encoding='utf8'))
            for car, mp in data.get('mapas', {}).items():
                if (mp.get('layout') or {}).get('rutas'):
                    yield f, car, mp['layout']

    def test_flechas_ortogonales_sin_atravesar_materias(self):
        n = 0
        for f, car, L in self.mapas():
            for s, d, p, *_ in L['edges']:
                for a, b in segmentos(p):
                    self.assertTrue(abs(a[0] - b[0]) < .01 or abs(a[1] - b[1]) < .01, (f, car, s, d))
                    for i, box in enumerate(L['boxes']):
                        self.assertFalse(cruza_caja(a, b, box), (f, car, L['boxes'][s][4], L['boxes'][d][4], box[4] or box[5]))
                n += 1
        self.assertGreater(n, 100)

    def test_flechas_de_materias_distintas_no_se_enciman(self):
        for f, car, L in self.mapas():
            tramos = []
            for s, d, p, larga, *_ in L['edges']:
                if larga:
                    continue   # conector: solo se dibuja completa al resaltar, con las demás atenuadas
                for a, b in segmentos(p):
                    tramos.append((s, d, a, b))
            for i, (s1, d1, a1, b1) in enumerate(tramos):
                for s2, d2, a2, b2 in tramos[:i]:
                    if s1 == s2 or d1 == d2:
                        continue   # misma salida o misma llegada: pueden compartir el último tramo
                    v1, v2 = abs(a1[0] - b1[0]) < .01, abs(a2[0] - b2[0]) < .01
                    if v1 != v2:
                        continue
                    k = 0 if v1 else 1      # eje común
                    if abs(a1[k] - a2[k]) > .5:
                        continue
                    o = 1 - k
                    lo = max(min(a1[o], b1[o]), min(a2[o], b2[o])); hi = min(max(a1[o], b1[o]), max(a2[o], b2[o]))
                    self.assertLessEqual(hi - lo, 1, (f, car, L['boxes'][s1][4], L['boxes'][d1][4], L['boxes'][s2][4], L['boxes'][d2][4]))


if __name__ == '__main__':
    unittest.main()
