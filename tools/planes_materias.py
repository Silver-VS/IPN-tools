"""Lista pública de materias por plan para clasificarlas en categorías (data/planes_ipn_materias.json).

Lee los JSON de recursos/planes-ipn/json/ (extraídos de los mapas curriculares publicados en ipn.mx) y conserva solo
la fuente, las unidades, el año del plan y el nombre y nivel de cada materia. No copia cifras ni imágenes.
Uso: python tools/planes_materias.py [carpeta_json]
"""
import json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGEN = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent.parent / 'recursos/planes-ipn/json'
SALIDA = ROOT / 'data/planes_ipn_materias.json'


def limpio(nombre):
    nombre = re.sub(r'^(T P T/H|T P)\s+', '', nombre.strip())
    return re.sub(r'\s+', ' ', nombre)


def normal(nombre):
    s = unicodedata.normalize('NFD', nombre.upper())
    return re.sub(r'[^A-Z0-9 ]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn')).strip()


planes, nombres = {}, {}
for f in sorted(ORIGEN.glob('*.json')):
    if f.name.startswith('_'):
        continue
    d = json.loads(f.read_text(encoding='utf-8'))
    materias = []
    for nivel in d.get('niveles', []):
        for m in nivel.get('materias', []):
            materias.append([nivel.get('nivel'), limpio(m['nombre'])])
    for g in d.get('optativas', []) or []:
        for m in g.get('materias', []):
            materias.append(['optativa', limpio(m['nombre'])])
    materias = [m for m in materias if len(normal(m[1])) > 3]
    if not materias:
        continue
    planes[f.stem] = {'fuente': d.get('fuente'), 'unidades': d.get('unidades') or [], 'plan': d.get('plan'),
                      'materias': materias}
    for _, n in materias:
        nombres.setdefault(normal(n), n)

SALIDA.write_text(json.dumps({
    '_fuente': 'Mapas curriculares publicados en ipn.mx (oferta educativa, nivel superior), leídos con tools/planes_ocr.py. '
               'Solo nombres y niveles; el OCR puede tener errores de lectura.',
    'planes': planes, 'nombres_unicos': len(nombres)}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(planes), 'planes,', sum(len(p['materias']) for p in planes.values()), 'materias,', len(nombres), 'nombres únicos')
