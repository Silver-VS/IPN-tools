"""Decide el ritmo de vigilancia y ejecuta la lectura local de semestre.py."""
import datetime as dt
import contextlib
import io
import json
import os
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]


def toca_hoy(hoy=None):
    cfg = json.loads((ROOT / 'data/vigilancia_salones.json').read_text(encoding='utf-8'))
    hoy = hoy or dt.datetime.now(ZoneInfo(cfg['zona'])).date()
    comienzos = []
    for year in (hoy.year - 1, hoy.year):
        for mes_dia in (cfg['inicio_semestre_a'], cfg['inicio_semestre_b']):
            mes, dia = map(int, mes_dia.split('-'))
            comienzos.append(dt.date(year, mes, dia))
    inicio = max(d for d in comienzos if d <= hoy)
    if hoy < inicio + dt.timedelta(weeks=cfg['semanas_diarias']):
        return True
    return hoy.weekday() == cfg['dia_semanal']


def main():
    if os.environ.get('FORZAR_REVISION') != 'true' and not toca_hoy():
        print('changed=false')
        return 0
    sys.path.insert(0, str(ROOT / 'tools'))
    import semestre
    salida = io.StringIO()
    with contextlib.redirect_stdout(salida):
        resultado = semestre.cmd_vigilar(semestre.argparse.Namespace(html=None, json=True))
    try:
        detalle = json.loads(salida.getvalue())
    except json.JSONDecodeError:
        detalle = {'error': salida.getvalue().strip()}
    if resultado == 10:
        print('changed=true')
        print(f"periodo={detalle['periodo']}")
        print(f"fecha={detalle['despues']['actualizado']}")
    elif resultado == 2:
        mensaje = 'La página de salones no pudo leerse o cambió de estructura; se reintentará en la siguiente corrida.'
        print(f'::warning::{mensaje}')
        resumen = os.environ.get('GITHUB_STEP_SUMMARY')
        if resumen:
            with open(resumen, 'a', encoding='utf-8') as f:
                f.write(f'\n{mensaje}\n')
        print('changed=false')
    else:
        print('changed=false')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
