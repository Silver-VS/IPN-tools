"""Cada arista generada conserva una fuente y referencias existentes."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from relaciones_sate import generar
from build_sate import fusionar_guia


def test_relaciones_generadas_trazables():
    leer = lambda p: json.loads((ROOT / p).read_text(encoding='utf-8'))
    config = leer('data/sate.json')
    for unidad in config['unidades']:
        guia = fusionar_guia(leer('data/guia/comun.json'), leer(f'data/guia/{unidad}.json'))
        guia['orientacion'] = leer('data/guia/rutas.json')
        r = generar(guia, config, unidad)
        preguntas = {p['id']: p for p in guia['preguntas']}
        for a in r['articulos']:
            p = preguntas[a['pregunta']]
            assert f'[[a:{a["doc"]}:{a["articulo"]}|' in p['respuesta'] + ' '.join(p.get('pasos', []))
            assert a['fuente']
        for s in r['situaciones']:
            assert s['pregunta'] in preguntas and s['fuente']
        for t in r['tramites']:
            assert t['id'] in config['unidades'][unidad]['tramites']
            assert t['fuente'] and t['articulos']
            if t['pregunta'] is None:
                assert t['id'] == config['unidades'][unidad]['electivas']['tramite']
                assert {(a['doc'], a['articulo']) for a in t['articulos']} == {
                    ('ri', '173'), ('ri', '98'), *{('rge', n) for n in ('3', '5', '18', '34', '40', '52', '61', '62')}}
            if t['area']:
                assert t['fuenteEntrega']
                assert any(a['id'] == t['area']['id'] and a['nombre'] == t['area']['nombre'] for a in guia['acudir'])
        assert len(r['tramites']) == len(config['unidades'][unidad]['tramites'])
        assert all(t['area'] for t in r['tramites']), 'Cada trámite con receptor documentado conserva el área'
        assert r == leer(f'web/dist/sate/datos/{unidad}/relaciones.json')
