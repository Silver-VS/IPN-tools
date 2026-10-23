"""Inventario y candado de transcripciones oficiales. No usa la red.

Actualizar deliberadamente: python tools/huellas_oficiales.py --actualizar --motivo "documento nuevo"
Las rutas del inventario son JSON Pointer con * para un elemento de lista/diccionario.
"""
import argparse
import hashlib
import json
import logging
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INVENTARIO = ROOT / 'data/texto_oficial.json'
DESTINO = ROOT / 'tests/texto_oficial.sha256.json'
LOG = logging.getLogger('texto_oficial')


def normalizar(texto):
    return ' '.join(texto.split())


def seleccionar(valor, partes, ruta='', contexto=None):
    contexto = dict(contexto or {})
    if isinstance(valor, dict):
        for k in ('fuente', 'pagina', 'paginas', 'articulo', 'n', 'pdf', 'archivo'):
            if k in valor:
                contexto[k] = valor[k]
    if not partes:
        if isinstance(valor, str) and normalizar(valor):
            yield ruta, valor, contexto
        return
    cabeza, *resto = partes
    elementos = enumerate(valor) if isinstance(valor, list) else valor.items() if isinstance(valor, dict) else []
    for k, v in elementos:
        if cabeza == '*' or cabeza == str(k):
            escapado = str(k).replace('~', '~0').replace('/', '~1')
            yield from seleccionar(v, resto, ruta + '/' + escapado, contexto)


def calcular(root=ROOT):
    inventario = json.loads((root / 'data/texto_oficial.json').read_text(encoding='utf-8'))
    huellas = {}
    for archivo, entrada in inventario['archivos'].items():
        texto = (root / archivo).read_text(encoding='utf-8')
        datos = {'texto': texto.partition('\n')[2]} if archivo.endswith('.txt') else json.loads(texto)
        for campo in entrada['campos']:
            for ruta, texto, contexto in seleccionar(datos, campo.lstrip('/').split('/')):
                huellas[archivo + '#' + ruta] = {
                    'sha256': hashlib.sha256(normalizar(texto).encode('utf-8')).hexdigest(),
                    # La fuente se consulta en datos; su huella evita duplicarla y protege cambios de atribución.
                    'procedencia_sha256': hashlib.sha256(json.dumps({'origen': entrada['fuente'], **contexto}, ensure_ascii=False, sort_keys=True).encode('utf-8')).hexdigest(),
                }
    return dict(sorted(huellas.items()))


def diferencias(antes, despues):
    return [k for k in sorted(antes.keys() | despues.keys()) if antes.get(k) != despues.get(k)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--actualizar', action='store_true')
    parser.add_argument('--motivo')
    args = parser.parse_args()
    if args.actualizar and not (args.motivo or '').strip():
        parser.error('--actualizar requiere --motivo "documento nuevo"')
    nuevas = calcular()
    if args.actualizar:
        anterior = json.loads(DESTINO.read_text(encoding='utf-8')) if DESTINO.exists() else {}
        historial = anterior.get('actualizaciones', [])
        historial.append({'motivo': args.motivo.strip(), 'numeroCambios': len(diferencias(anterior.get('huellas', {}), nuevas))})
        DESTINO.write_text(json.dumps({'version': 1, 'motivo': args.motivo.strip(), 'actualizaciones': historial, 'huellas': nuevas}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        LOG.info('Actualizadas %d huellas; motivo: %s', len(nuevas), args.motivo)
        return 0
    anteriores = json.loads(DESTINO.read_text(encoding='utf-8'))['huellas']
    cambios = diferencias(anteriores, nuevas)
    for clave in cambios:
        LOG.error('Texto oficial o procedencia alterados: %s', clave)
    if cambios:
        LOG.error('Revise el documento y actualice A PROPÓSITO: python tools/huellas_oficiales.py --actualizar --motivo "documento nuevo"')
    else:
        LOG.info('%d huellas oficiales intactas', len(nuevas))
    return int(bool(cambios))


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
    raise SystemExit(main())
