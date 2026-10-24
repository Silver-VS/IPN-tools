"""Referencias reales: posiciones literales, destinos existentes y extracción reproducible."""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('guia_busqueda', ROOT / 'tools/guia_busqueda.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def test_referencias_reproducibles_y_literales():
    resultado = mod.referencias()
    guardadas = json.loads((ROOT / 'data/referencias/reglamentos.json').read_text(encoding='utf-8'))
    ambiguas = json.loads((ROOT / 'docs/referencias-ambiguas.json').read_text(encoding='utf-8'))
    assert resultado == {'resueltas': guardadas, 'ambiguas': ambiguas}
    for r in guardadas:
        reg = mod.leer(ROOT / 'data/reglamentos' / (r['doc'] + '.json'))
        origen = next(a for a in reg['articulos'] if str(a['n']) == r['articulo'])
        assert origen['texto'][r['inicio']:r['fin']] == r['texto']
        destino = mod.leer(ROOT / 'data/reglamentos' / (r['destino'] + '.json'))
        articulo = next(a for a in destino['articulos'] if str(a['n']) == r['n'])
        if r['fr']:
            assert any(f['fr'] == r['fr'] for f in articulo['fracciones'])


def test_casos_reales_sin_inferir_texto_ausente():
    rs = mod.referencias()
    for doc, articulo, destino, numero in [
        ('cambio_carrera', '7', 'cambio_carrera', '6'),
        ('honor', '29', 'ri', '114'),
        ('honor', '34', 'ri', '106'),
        ('honor', '44', 'ri', '118'),
        ('rge', '2', 'ro', '2'),
        ('lo', '15', 'lo', '13'),
    ]:
        assert any(r['doc'] == doc and r['articulo'] == articulo and r['destino'] == destino and r['n'] == numero for r in rs['resueltas'])
    assert any('Consejo General Consultivo' in r['texto'] for r in rs['ambiguas'])
    assert not any(r['destino'] == 'cgc' for r in rs['resueltas'])


def test_extractor_no_confunde_otra_ley_o_enumeracion():
    registros = {'demo': {'titulo': 'Reglamento ficticio', 'articulos': [
        {'n': '1', 'texto': 'Artículo 2 del Reglamento desconocido. Artículo 2 y 3. Fracción III del artículo 2.'},
        {'n': '2', 'texto': 'Literal', 'fracciones': [{'fr': 'III', 'texto': 'Literal'}]},
        {'n': '3', 'texto': 'Literal'}]}}
    r = mod.extraer(registros)
    assert len(r['resueltas']) == 1
    assert r['resueltas'][0]['fr'] == 'III'
    assert len(r['ambiguas']) == 2
