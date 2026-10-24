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
    externas = json.loads((ROOT / 'data/referencias/externas.json').read_text(encoding='utf-8'))
    assert resultado == {'resueltas': guardadas, 'externas': externas, 'ambiguas': ambiguas}
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
    assert any('Consejo General Consultivo' in r['documento'] for r in rs['externas'])
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


def test_alias_explicito_y_documento_externo_sin_enlace():
    registros = {
        'demo': {'titulo': 'Reglamento de prueba', 'articulos': [{'n': '1', 'texto': 'Artículo 2 de la Ley Orgánica del IPN. Artículo 4 del Reglamento del Consejo General Consultivo del IPN.'}]},
        'lo': {'titulo': 'Ley Orgánica del IPN', 'articulos': [{'n': '2', 'texto': 'Texto'}]},
        'cgc': {'titulo': 'Reglamento del Consejo General Consultivo del IPN', 'articulos': []},
    }
    anterior = mod.leer(ROOT / 'data/referencias/alias_reglamentos.json')
    try:
        mod.escribir(ROOT / 'data/referencias/alias_reglamentos.json', {'alias': {'lo': ['Ley Orgánica del IPN'], 'cgc': ['Reglamento del Consejo General Consultivo del IPN']}})
        r = mod.extraer(registros)
    finally:
        mod.escribir(ROOT / 'data/referencias/alias_reglamentos.json', anterior)
    assert len(r['resueltas']) == 1 and r['resueltas'][0]['destino'] == 'lo'
    assert len(r['externas']) == 1 and r['externas'][0]['documento'] == registros['cgc']['titulo']
    assert r['ambiguas'] == []


def test_nombre_ambiguo_sin_alias_no_se_enlaza():
    registros = {'demo': {'titulo': 'Reglamento de prueba', 'articulos': [
        {'n': '1', 'texto': 'Artículo 2 del Reglamento Desconocido.'}, {'n': '2', 'texto': 'A'}]},
        'uno': {'titulo': 'Reglamento Uno', 'articulos': [{'n': '2', 'texto': 'A'}]},
        'dos': {'titulo': 'Reglamento Dos', 'articulos': [{'n': '2', 'texto': 'A'}]}}
    r = mod.extraer(registros)
    assert not r['resueltas'] and not r['externas'] and r['ambiguas']


def test_este_reglamento_no_crea_un_autoenlace():
    registros = {'demo': {'titulo': 'Reglamento de prueba', 'articulos': [
        {'n': '1', 'texto': 'Este Reglamento establece la regla.'}]}}
    r = mod.extraer(registros)
    assert not any(x['texto'] == 'Este Reglamento' for x in r['resueltas'])
