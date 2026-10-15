#!/usr/bin/env python3
"""Catálogo de perfiles de prueba ficticios del alumnado (UPIITA, plan 09).

Produce, con semilla fija, los archivos de data/perfiles-prueba/: un JSON por perfil en el formato que SATE lee en
localStorage['saes.alumno'] (el mismo que entrega el Lector, ver tools/lector_saes.js) y un indice.json.

Las claves salen del mapa curricular real (data/mapa_curricular_saes.json) y la seriación de data/seriacion.json;
los periodos siguen el calendario de data/calendario.json (se cursa 26/2 y la reinscripción es la de 27/1).
Todo es ficticio: boletas 2099xxxxxx y nombres inventados. Nada se copia de un alumno real.

Uso:
    python tools/perfiles_prueba.py              # escribe data/perfiles-prueba/
    python tools/perfiles_prueba.py --verificar  # falla si los archivos difieren de lo que se generaría
"""
import argparse
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESTINO = ROOT / 'data' / 'perfiles-prueba'
SEMILLA = 2026
PLAN = '09'
LEIDO = '2026-10-14T18:00:00.000Z'
CARRERAS = {'B': 'INGENIERIA BIONICA', 'M': 'INGENIERIA MECATRONICA', 'T': 'INGENIERIA TELEMATICA'}
# Carga por periodo (créditos), como la que entrega el SAES a un alumno regular de la UPIITA.
CARGA = {'min': 27, 'media': 40, 'max': 80, 'duracion': 10, 'duracion_max': 15}
OBJETIVO_CR = 40          # créditos que se procura cursar por periodo
TOPE_CR = 44              # y que no se rebasan al armar un periodo
PERIODO_ACTUAL = (26, 2)  # se cursa ahora
# Espacios de optativas del mapa (nivel SAES de cada uno): lo que el alumno debe acreditar además de las obligatorias.
ESPACIOS_OPT = {'B': [4, 4, 3], 'M': [3, 3, 3, 4, 4, 4], 'T': [3, 2]}   # T: sin los 3 «elegibles» (optativas de otras líneas)


def periodo_txt(i):
    """Índice de periodo (año*2 + semestre-1) -> «26/1»."""
    return f'{i // 2}/{i % 2 + 1}'


def periodo_saes(i):
    """Formato del Estado general del SAES: «20261»."""
    return f'20{i // 2}{i % 2 + 1}'


IDX_ACTUAL = PERIODO_ACTUAL[0] * 2 + PERIODO_ACTUAL[1] - 1   # 26/2
IDX_ULTIMO = IDX_ACTUAL - 1                                   # 26/1: último periodo cerrado


def limpiar(t):
    return t.replace('�', '')


def cargar_plan(car):
    mapa = json.loads((ROOT / 'data/mapa_curricular_saes.json').read_text(encoding='utf-8'))
    cur = {}
    for r in mapa['rows']:
        if r[0] != car or r[1] != PLAN or not (len(r[3]) == 4 and r[3][0].isalpha() and r[3][0].isupper()):
            continue
        cur[r[3]] = {'nombre': limpiar(r[4]), 'nivel': int(r[2]), 'tipo': r[5], 'cr': float(r[6]),
                     'electiva': r[4].startswith('ELECTIVA')}
    req = json.loads((ROOT / 'data/seriacion.json').read_text(encoding='utf-8'))['requisitos'].get(car, {})
    return cur, req


def plan_info(car):
    """Mapa del plan: créditos por clave, obligatorias, electivas, optativas y créditos totales del plan."""
    cur, req = cargar_plan(car)
    # Una optativa que la seriación exige a una obligatoria (p. ej. T120 en Telemática) se cursa como obligatoria.
    exigidas = {r for rs in req.values() for r in rs}
    obl = sorted((k for k, v in cur.items() if not v['electiva'] and v['cr'] > 0 and
                  (v['tipo'] == 'OBLIGATORIA' or k in exigidas)), key=lambda k: (cur[k]['nivel'], k))
    ele = sorted(k for k, v in cur.items() if v['electiva'])
    opt = sorted((k for k, v in cur.items() if v['tipo'] == 'OPTATIVA' and k not in obl), key=lambda k: (cur[k]['nivel'], k))
    cr_opt = max(set(cur[k]['cr'] for k in opt), key=lambda c: sum(cur[k]['cr'] == c for k in opt))
    total = sum(cur[k]['cr'] for k in obl + ele) + cr_opt * len(ESPACIOS_OPT[car])
    return {'car': car, 'cur': cur, 'req': req, 'obl': obl, 'ele': ele, 'opt': opt, 'total': total}


def elegibles(info, hecho, excluidas, candidatas):
    return [k for k in candidatas if k not in hecho and k not in excluidas and all(r in hecho for r in info['req'].get(k, []))]


def armar_periodo(info, hecho, excluidas, obligadas=(), rng=None, objetivo=OBJETIVO_CR):
    """Cursos de un periodo: primero los obligados, después obligatorias por nivel hasta ~objetivo créditos."""
    cur = info['cur']
    elegidos = list(obligadas)
    cr = sum(cur[k]['cr'] for k in elegidos)
    for k in elegibles(info, hecho, excluidas, info['obl']):
        if k in elegidos:
            continue
        if cr >= objetivo - 3 or cr + cur[k]['cr'] > TOPE_CR:
            continue
        elegidos.append(k)
        cr += cur[k]['cr']
    return elegidos


def periodos_que_faltan(info, hecho, excluidas=frozenset()):
    """Periodos (armados como en la simulación) que necesita para acreditar todas las obligatorias pendientes."""
    hecho, n = set(hecho), 0
    while any(k not in hecho for k in info['obl']):
        c = armar_periodo(info, hecho, excluidas)
        if not c:
            raise RuntimeError('quedan materias que la seriación no deja cursar')
        hecho |= set(c)
        n += 1
    return n


def simular(car, *, grupos=None, quedan_periodos=None, fallos=None, huecos=None, optativas=0, opt_desde=2,
            electivas_en=None, revalidadas=(), rng):
    """Arma la historia periodo por periodo.

    grupos      : número de periodos cursados con aprobación (o None si se usa quedan_cr)
    quedan_periodos: cursa hasta que, con la seriación, falten a lo más estos periodos de obligatorias (a punto de egresar)
    fallos      : {n_grupo: [(posición_en_elegibles, veces), ...]}; una reprobada con veces=2 repite en el siguiente grupo
    huecos      : {n_grupo: n_periodos_sin_cursar_antes_de_ese_grupo} (baja temporal)
    optativas   : cuántas optativas acredita, repartidas desde el grupo opt_desde
    electivas_en: {n_grupo: clave} electivas liberadas en ese grupo
    revalidadas : claves revalidadas (EQV) en el primer periodo
    """
    info = plan_info(car)
    cur = info['cur']
    hecho = set(revalidadas)
    excluidas = set()                     # reprobadas sin recursar: no se vuelven a elegir (ni sus dependientes)
    historia = []                         # un dict por periodo cursado
    espacios = list(ESPACIOS_OPT[car])
    fallos = fallos or {}
    huecos = huecos or {}
    electivas_en = electivas_en or {}
    repetir = set()                       # reprobadas que se cursan otra vez (y vuelven a reprobar) en este grupo
    n = 0
    while True:
        if grupos is not None and n >= grupos:
            break
        if quedan_periodos is not None and periodos_que_faltan(info, hecho, excluidas) <= quedan_periodos:
            break
        if n > 40:
            raise RuntimeError('la simulación no termina')
        obligadas, fallan, siguiente = sorted(repetir), set(repetir), set()
        base = elegibles(info, hecho, excluidas | set(obligadas), info['obl'])
        for pos, veces in fallos.get(n, []):
            k = base[pos]
            obligadas.append(k)
            fallan.add(k)
            if veces == 2:
                siguiente.add(k)
        cursos = armar_periodo(info, hecho, excluidas | set(obligadas), obligadas, rng)
        aprobadas = [k for k in cursos if k not in fallan]
        extra = []
        if optativas and n >= opt_desde and espacios:
            cand = [k for k in elegibles(info, hecho, excluidas, info['opt']) if cur[k]['nivel'] in espacios]
            if cand:
                espacios.remove(cur[cand[0]]['nivel'])
                extra.append(cand[0])
                optativas -= 1
        ele = [electivas_en[n]] if n in electivas_en else []
        historia.append({'cursos': cursos, 'aprobadas': aprobadas, 'extra': extra, 'ele': ele,
                         'fallan': sorted(fallan), 'hueco_antes': huecos.get(n, 0)})
        hecho.update(aprobadas + extra + ele)
        excluidas |= fallan - siguiente
        repetir = siguiente
        n += 1
    # en curso (periodo actual): lo que sigue
    en_curso = armar_periodo(info, hecho, excluidas, (), rng)
    return info, historia, hecho, excluidas, en_curso


def etiquetar(historia):
    """Asigna periodos hacia atrás desde 26/1, respetando los huecos (bajas temporales)."""
    idx = IDX_ULTIMO
    for h in reversed(historia):
        h['periodo'] = idx
        idx -= 1 + h['hueco_antes']
    return idx + 1  # primer periodo usado


def calificacion(rng):
    return rng.choice([10, 10, 9, 9, 9, 8, 8, 8, 7, 7, 6])


def forma(rng):
    return rng.choice(['ORD'] * 12 + ['EXT', 'ETS'])


def construir(spec, rng):
    car = spec['carrera']
    rev_claves = []
    if spec.get('cambio_desde'):
        origen = plan_info(spec['cambio_desde'])
        destino = plan_info(car)
        nombres = {origen['cur'][k]['nombre'] for k in origen['obl']}
        rev_claves = [k for k in destino['obl'] if destino['cur'][k]['nombre'] in nombres and destino['cur'][k]['nivel'] <= 2]
        rev_claves = rev_claves[:spec.get('n_revalidadas', 14)]
    info, historia, hecho, excluidas, en_curso = simular(
        car, grupos=spec.get('grupos'), quedan_periodos=spec.get('quedan_periodos'), fallos=spec.get('fallos'),
        huecos=spec.get('huecos'), optativas=spec.get('optativas', 0), opt_desde=spec.get('opt_desde', 2),
        electivas_en=spec.get('electivas_en'), revalidadas=rev_claves, rng=rng)
    cur = info['cur']
    primero = etiquetar(historia) if historia else IDX_ULTIMO + 1
    acreditadas, kardex_rep, reprob_periodo = [], [], []
    # revalidaciones del cambio de carrera: primer periodo en la carrera nueva
    for k in rev_claves:
        acreditadas.append([k, calificacion(rng), periodo_txt(primero), 'EQV'])
    for h in historia:
        p = periodo_txt(h['periodo'])
        for k in h['aprobadas'] + h['extra'] + h['ele']:
            acreditadas.append([k, calificacion(rng), p, forma(rng) if k not in h['ele'] else 'ORD'])
        for k in h['fallan']:
            kardex_rep.append([k, rng.choice([5, 5, 4, 3, 0]), p, 'ORD'])
    # reprobadas que siguen pendientes: su último intento
    ultimos = {}
    for h in historia:
        for k in h['fallan']:
            ultimos[k] = h['periodo']
    vecesk = {}
    for h in historia:
        for k in h['fallan']:
            vecesk[k] = vecesk.get(k, 0) + 1
    pend = sorted(ultimos, key=lambda k: (ultimos[k], k))
    for k in pend:
        reprob_periodo.append([k, periodo_saes(ultimos[k]), vecesk[k]])
    nombre_rep = [[cur[k]['nombre'], cur[k]['cr']] for k in pend]
    # créditos
    obtenidos = sum(cur[a[0]]['cr'] for a in acreditadas)
    total = info['total']
    cr_retenidos = sum(cur[k]['cr'] for k in pend)
    prom_filas = [a[1] for a in acreditadas] + [r[1] for r in kardex_rep]
    promedio = round(sum(prom_filas) / len(prom_filas), 2) if prom_filas else None
    cursados = len(historia) + (1 if en_curso else 0)
    if pend:
        autorizada = f'MEDIA-REPROBADAS = {CARGA["media"]:.2f} - {cr_retenidos:.2f} CREDITOS'
    else:
        autorizada = f'MAXIMA ({CARGA["max"]:.2f} CREDITOS)'
    cita_dia = spec.get('cita_dia', 19)
    cita = {'inicio': f'{cita_dia:02d}/10/2026 {spec.get("cita_hora", 10):02d}:00:00 a. m.',
            'fin': f'{cita_dia + 1:02d}/10/2026 {spec.get("cita_hora", 10):02d}:00:00 a. m.'}
    claves = ([a[0] for a in acreditadas] + en_curso + [r[0] for r in reprob_periodo] + [r[0] for r in kardex_rep])
    perfil = {
        'upiita_saes': 1,
        'unidad': 'upiita',
        'materias': {k: [cur[k]['nombre'], cur[k]['nivel']] for k in sorted(set(claves))},
        'leido': LEIDO,
        'boleta': spec['boleta'],
        'nombre': spec['nombre'],
        'carrera': car,
        'carrera_nombre': CARRERAS[car],
        'plan': PLAN,
        'promedio': promedio,
        'reprobadas_num': len(pend),
        'cita': cita,
        'carga': {'total': total, **CARGA},
        'avance': {'obtenidos': obtenidos, 'faltan': total - obtenidos, 'cursados': cursados, 'autorizada': autorizada},
        'reprobadas': nombre_rep,
        'desfase_saes': 'No tienes materias reprobadas de mas de 2 periodos anteriores',
        'reprobadas_periodo': reprob_periodo,
        'no_cursadas': [],
        'desfasadas_saes': [],
        'en_curso': en_curso,
        'horario_inscrito': [],
        'acreditadas': acreditadas,
        'creditos_materias': {k: cur[k]['cr'] for k in sorted(set(claves))},
        'kardex_reprobadas': kardex_rep,
        'agenda': [['INICIO DE SEMESTRE 26-2', '2026-08-24', '2026-12-18'], ['INICIO DE SEMESTRE 27-1', '2027-01-25', '2027-06-04']],
        'lector': 'perfil-prueba',
        'perfil_prueba': {'id': spec['id'], 'caso': spec['caso']},
    }
    if pend:
        n = sum(1 for k in pend if ultimos[k] + 2 < IDX_ACTUAL + 1)   # desfasadas respecto de la reinscripción 27/1
        if n:
            perfil['desfase_saes'] = f'Tienes {n} materias reprobadas de mas de 2 periodos anteriores'
    return perfil


# Casos: orden = numeración del encargo AYUDA1.
CASOS = [
    dict(id='primer-ingreso-bionica', caso=1, carrera='B', titulo='Primer ingreso', grupos=0,
         boleta='2099000101', nombre='ALUMNA FICTICIA PRIMER INGRESO PRUEBA', cita_dia=19, cita_hora=9,
         demuestra='Sin kárdex ni materias acreditadas: cursa el primer periodo y SATE debe orientar sin historial.'),
    dict(id='regular-mecatronica', caso=2, carrera='M', titulo='Regular a mitad de carrera', grupos=5, optativas=0,
         boleta='2099000102', nombre='ALUMNO FICTICIO REGULAR PRUEBA', cita_dia=20, cita_hora=10,
         demuestra='Cinco periodos aprobados sin adeudos, seriación respetada y el siguiente periodo en curso.'),
    dict(id='adeuda-telematica', caso=3, carrera='T', titulo='Adeuda materias sin recursar', grupos=5,
         fallos={4: [(0, 1), (2, 1)]},
         boleta='2099000103', nombre='ALUMNA FICTICIA ADEUDO PRUEBA', cita_dia=20, cita_hora=12,
         demuestra='Dos reprobadas del último periodo que aún no se recursan: retienen créditos y limitan la carga.'),
    dict(id='desfase-dictamen-bionica', caso=4, carrera='B', titulo='En desfase: necesita dictamen', grupos=6,
         fallos={3: [(0, 1), (1, 2)]},
         boleta='2099000104', nombre='ALUMNO FICTICIO DESFASE PRUEBA', cita_dia=21, cita_hora=9,
         demuestra='Una reprobada de hace más de 3 periodos y otra con dos intentos: ambas exigen dictamen.'),
    dict(id='electivas-por-liberar-bionica', caso=5, carrera='B', titulo='Electivas por liberar', grupos=7, optativas=2,
         electivas_en={1: 'B113', 3: 'B214'},
         boleta='2099000105', nombre='ALUMNA FICTICIA ELECTIVAS PRUEBA', cita_dia=21, cita_hora=11,
         demuestra='Dos de cuatro electivas liberadas: faltan créditos de electivas y el trámite de acreditación.'),
    dict(id='electivas-liberadas-mecatronica', caso=6, carrera='M', titulo='Electivas ya liberadas', grupos=8, optativas=4,
         electivas_en={2: 'M325', 4: 'M411', 6: 'M502'},
         boleta='2099000106', nombre='ALUMNO FICTICIO LIBERADO PRUEBA', cita_dia=22, cita_hora=9,
         demuestra='Las tres electivas del plan ya liberadas: no debe ofrecerse de nuevo el trámite.'),
    dict(id='por-egresar-telematica', caso=7, carrera='T', titulo='A punto de egresar', quedan_periodos=2, optativas=2, opt_desde=1,
         electivas_en={1: 'T407', 2: 'T408', 3: 'T409', 4: 'T410'},
         boleta='2099000107', nombre='ALUMNA FICTICIA EGRESO PRUEBA', cita_dia=22, cita_hora=12,
         demuestra='Casi todo acreditado: al plan le faltan a lo más dos periodos (trabajo terminal y cierre).'),
    dict(id='cambio-carrera-mecatronica', caso=8, carrera='M', titulo='Cambio de carrera interno con revalidaciones',
         cambio_desde='B', n_revalidadas=14, grupos=3,
         boleta='2099000108', nombre='ALUMNO FICTICIO CAMBIO PRUEBA', cita_dia=23, cita_hora=10,
         demuestra='Viene de Bionica: materias comunes revalidadas (EQV) y avance menor al tiempo cursado.'),
    dict(id='baja-temporal-bionica', caso=9, carrera='B', titulo='Baja temporal previa', grupos=4, huecos={2: 2},
         boleta='2099000109', nombre='ALUMNA FICTICIA BAJA PRUEBA', cita_dia=23, cita_hora=12,
         demuestra='Dos periodos sin cursar entre su primer tramo y su regreso: hueco en el historial.'),
]


def generar():
    """-> {nombre_de_archivo: texto} con todos los perfiles y el índice."""
    salida, indice = {}, []
    rng = random.Random(SEMILLA)
    for spec in CASOS:
        perfil = construir(spec, rng)
        salida[spec['id'] + '.json'] = json.dumps(perfil, ensure_ascii=False, indent=1) + '\n'
        indice.append({'id': spec['id'], 'caso': spec['caso'], 'titulo': spec['titulo'], 'carrera': spec['carrera'],
                       'carrera_nombre': CARRERAS[spec['carrera']], 'plan': PLAN, 'demuestra': spec['demuestra'],
                       'archivo': spec['id'] + '.json'})
    salida['indice.json'] = json.dumps({
        'aviso': 'Perfiles ficticios para guías, manuales y demostraciones. Generados por tools/perfiles_prueba.py; no editar a mano.',
        'semilla': SEMILLA, 'formato': 'saes.alumno (tools/lector_saes.js)', 'unidad': 'upiita', 'perfiles': indice,
    }, ensure_ascii=False, indent=1) + '\n'
    return salida


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--verificar', action='store_true', help='no escribe; falla si algo difiere')
    a = ap.parse_args()
    salida = generar()
    if a.verificar:
        mal = [n for n, t in salida.items() if not (DESTINO / n).exists() or (DESTINO / n).read_text(encoding='utf-8') != t]
        if mal:
            print('Difieren:', ', '.join(mal))
            sys.exit(1)
        print('perfiles de prueba al día:', len(salida), 'archivos')
        return
    DESTINO.mkdir(parents=True, exist_ok=True)
    for n, t in salida.items():
        (DESTINO / n).write_text(t, encoding='utf-8', newline='\n')
    print('escritos', len(salida), 'archivos en', DESTINO)


if __name__ == '__main__':
    main()
