"""Candado de texto y procedencia: espacios equivalentes, cambios deliberados y cobertura."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

from tools.huellas_oficiales import ROOT, calcular, diferencias, normalizar, seleccionar


def test_texto_oficial():
    guardadas = json.loads((ROOT / 'tests/texto_oficial.sha256.json').read_text(encoding='utf-8'))
    cambios = diferencias(guardadas['huellas'], calcular())
    assert not cambios, ('Texto oficial o fuente alterados:\n' + '\n'.join(cambios) +
                         '\nActualizar A PROPÓSITO tras revisar el documento: '
                         'python tools/huellas_oficiales.py --actualizar --motivo "documento nuevo"')
    assert guardadas['motivo'].strip()


def test_espacios_y_puntuacion():
    assert normalizar(' Texto\n\t oficial\u00a0 ') == 'Texto oficial'
    h = lambda s: hashlib.sha256(normalizar(s).encode('utf-8')).hexdigest()
    assert h('Artículo 1.\nTexto') == h('Artículo 1. Texto')
    for texto in ['artículo 1. Texto', 'Artículo 1 Texto', 'Artículo 1. Otro']:
        assert h(texto) != h('Artículo 1. Texto')


def test_huellas_independientes_del_formato_json(tmp_path):
    """El build puede compactar JSON sin alterar texto ni procedencia protegidos."""
    (tmp_path / 'data').mkdir()
    inventario = {'archivos': {'data/documento.json': {
        'oficial': True, 'fuente': {'documento': 'Manual'}, 'campos': ['/texto']}}}
    (tmp_path / 'data/texto_oficial.json').write_text(json.dumps(inventario), encoding='utf-8')
    documento = {'fuente': {'doc': 'manual', 'pagina': 9}, 'texto': 'Artículo 1.\nTexto literal: á, ñ.'}
    ruta = tmp_path / 'data/documento.json'
    ruta.write_text(json.dumps(documento, ensure_ascii=False, indent=2), encoding='utf-8')
    antes = calcular(tmp_path)
    ruta.write_text(json.dumps(documento, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    assert calcular(tmp_path) == antes


def test_seleccion_y_fuente_heredada():
    d = {'fuente': {'doc': 'manual', 'pagina': 9}, 'funciones': [{'texto': 'Literal.'}], 'orientacion': 'Propia.'}
    textos = list(seleccionar(d, ['funciones', '*', 'texto']))
    assert textos == [('/funciones/0/texto', 'Literal.', {'fuente': d['fuente']})]
    assert diferencias({'a': {'sha256': 'x'}}, {}) == ['a']
    assert diferencias({}, {'b': {'sha256': 'x'}}) == ['b']
    assert diferencias({'a': 'x'}, {'a': 'y'}) == ['a']


def test_actualizar_exige_motivo():
    r = subprocess.run([sys.executable, str(ROOT / 'tools/huellas_oficiales.py'), '--actualizar'], capture_output=True, text=True)
    assert r.returncode == 2
    assert '--motivo' in r.stderr


def test_candado_detecta_edicion_y_cambio_de_fuente(tmp_path):
    (tmp_path / 'data').mkdir()
    p = tmp_path / 'data/documento.json'
    inventario = {'archivos': {'data/documento.json': {'oficial': True, 'fuente': {'documento': 'Manual'}, 'campos': ['/funciones/*/texto']}}}
    (tmp_path / 'data/texto_oficial.json').write_text(json.dumps(inventario), encoding='utf-8')
    datos = {'fuente': {'doc': 'manual', 'pagina': 9}, 'funciones': [{'texto': 'Texto literal.'}]}
    def escribir():
        p.write_text(json.dumps(datos), encoding='utf-8')
        return calcular(tmp_path)
    original = escribir()
    datos['funciones'][0]['texto'] = '  Texto\n literal. '
    assert escribir() == original
    datos['fuente']['pagina'] = 10
    assert diferencias(original, escribir()) == ['data/documento.json#/funciones/0/texto']
    datos['fuente']['pagina'] = 9
    datos['funciones'][0]['texto'] = 'Texto corregido.'
    assert diferencias(original, escribir()) == ['data/documento.json#/funciones/0/texto']
    datos['funciones'] = []
    assert diferencias(original, escribir()) == ['data/documento.json#/funciones/0/texto']


def test_inventario_y_catalogo_separados():
    from tools.contenido import cargar
    inventario = json.loads((ROOT / 'data/texto_oficial.json').read_text(encoding='utf-8'))
    huellas = calcular()
    for archivo, entrada in inventario['archivos'].items():
        assert entrada['oficial'] is True and entrada['fuente']
        assert any(k.startswith(archivo + '#') for k in huellas), archivo + ': regla sin textos'
    oficiales = json.loads((ROOT / 'data/denominaciones_oficiales.json').read_text(encoding='utf-8'))
    import tomllib
    from tools.contenido import aplanar
    propios = dict(aplanar(tomllib.loads((ROOT / 'contenido/textos/es.toml').read_text(encoding='utf-8'))))
    assert not oficiales.keys() & propios.keys()
    _, mapa, errores = cargar(ROOT / 'contenido/textos/es.toml')
    assert not errores
    assert all(mapa[k] == v for k, v in oficiales.items())
