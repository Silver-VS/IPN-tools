"""Los manuales institucionales se consultan localmente, nunca se distribuyen."""
import json
import os
import re
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parents[1]
ORIGENES = {'mo_upiita': 'MO_UPIITA_2023.txt', 'mo_dae': 'MO_DAE.txt',
            'mp_upiita': 'MP_UPIITA_2022.txt'}


def normalizar(texto):
    return ' '.join(re.sub(r'(?<=\w)-\s*\n\s*(?=\w)', '', texto).split())


def areas():
    return [a for archivo in ('upiita', 'comun')
            for a in json.loads((RAIZ / f'data/guia/{archivo}.json').read_text(encoding='utf-8'))['acudir']]


OFICIALES = [(a['id'], x) for a in areas()
             for x in ([a['objetivo']] if a.get('objetivo') else []) + a.get('funciones', [])
             if x.get('oficial')]


def test_separacion_oficial_y_propio():
    for a in areas():
        if a.get('orientacion'):
            assert a['orientacion']['propio'] is True, a['id']
        for x in ([a['objetivo']] if a.get('objetivo') else []) + a.get('funciones', []):
            assert x['oficial'] is True, a['id']
            assert x['fuente']['pagina'] > 0, a['id']
    assert len(OFICIALES) > 700


@pytest.fixture(scope='module')
def manuales():
    carpeta = os.environ.get('IPNT_MANUALES')
    if not carpeta:
        pytest.skip('IPNT_MANUALES no definido; manuales institucionales locales opcionales')
    resultado = {}
    for doc, nombre in ORIGENES.items():
        ruta = Path(carpeta) / nombre
        if not ruta.is_file():
            continue
        paginas = re.findall(r'=== PDF (\d+) ===(.*?)(?==== PDF|\Z)', ruta.read_text(encoding='utf-8'), re.S)
        # Se retira solo el encabezado repetido para comprobar frases que cruzan páginas.
        resultado[doc] = {int(n): p.split('MO-3', 1)[-1] for n, p in paginas}
    return resultado


@pytest.mark.parametrize('area,texto', OFICIALES, ids=[f'{a}-{i}' for i, (a, _) in enumerate(OFICIALES)])
def test_texto_oficial_literal(area, texto, manuales):
    f = texto['fuente']
    if f['doc'] not in manuales:
        pytest.skip(f"No existe el TXT local de {f['doc']}")
    paginas = manuales[f['doc']]
    n = f['pagina']
    assert n in paginas, (area, f)
    assert normalizar(texto['texto']) in normalizar(paginas[n] + '\n' + paginas.get(n + 1, '')), (area, f, texto['texto'])


def test_nombres_procedimientos_literales(manuales):
    if 'mp_upiita' not in manuales:
        pytest.skip('No existe el TXT local del Manual de Procedimientos')
    for a in areas():
        for p in a.get('procedimientos', []):
            assert p['oficial'] is True
            assert normalizar(p['nombre']) in normalizar(manuales['mp_upiita'][p['paginaNombre']]), (a['id'], p['clave'])


def test_nombres_areas_literales(manuales):
    for a in areas():
        if not a.get('funciones'):
            continue
        f = a['funciones'][0]['fuente']
        if f['doc'] not in manuales:
            pytest.skip(f"No existe el TXT local de {f['doc']}")
        encabezado = re.split(r'^[−–]\s+', manuales[f['doc']][f['pagina']], maxsplit=1, flags=re.M)[0]
        assert normalizar(a['nombre']) in normalizar(encabezado), a['id']
