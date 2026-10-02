"""Salones: lee el PDF de horarios por aula que publica la UPIITA y genera un diccionario de salones.

Uso:  python tools/salones.py <pdf o URL> [--periodo 26/2]
Salida: data/salones_<periodo>.json  {fuente, periodo, aulas, clases:[{aula, dia, inicio, fin, grupo, materia, profesor}]}

El PDF (exportado de Excel) tiene una página por aula: columnas Lunes–Viernes separadas por líneas verticales y
renglones de 1:30 (07:00–20:30) separados por líneas horizontales. Cada celda contiene materia, grupo y profesor;
una clase de varios bloques aparece en una sola celda combinada. Las horas exactas se toman del SAES al cruzar.
"""
import json, re, sys, pathlib, tempfile, urllib.request, urllib.parse
import pdfplumber

ROOT = pathlib.Path(__file__).resolve().parents[1]
GRUPO = re.compile(r'^\d[A-Z]{2,3}\d{1,2}$')
DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']


def norm(s):
    s = s.lower()
    for a, b in zip('áéíóúüñ', 'aeiouun'):
        s = s.replace(a, b)
    return re.sub(r'\s+', ' ', s).strip()


def hm(m):
    return f'{m // 60:02d}:{m % 60:02d}'


def parse_page(pg):
    words = pg.extract_words(keep_blank_chars=False, use_text_flow=False)
    txt = ' '.join(w['text'] for w in words[:40])
    m = re.search(r'CICLO ESCOLAR\s+(\d{4}/\d)', txt)
    ciclo = m.group(1) if m else None
    # nombre del aula: palabras del renglón que empieza con AULA/LAB/... justo arriba de los días
    head = [w for w in words if w['text'].upper() in ('AULA', 'LABORATORIO', 'LAB', 'LAB.', 'SALA', 'SALÓN', 'SALON')]
    aula = None
    if head:
        h = head[0]
        aula = ' '.join(w['text'] for w in words if abs(w['top'] - h['top']) < 2)
        m2 = re.match(r'^AULA\s+(\d+)$', aula)
        aula = f'Aula {m2.group(1)}' if m2 else re.sub(r'^AULA\s+', '', aula)
    # cuadrícula
    hl = sorted({round(r['top']) for r in pg.rects if r['height'] < 2 and r['width'] > 400})
    vl = sorted({round(r['x0']) for r in pg.rects if r['width'] < 2 and r['height'] > 300})
    days = [w for w in words if norm(w['text']) in DIAS]
    if len(hl) < 3 or len(vl) < 3 or not days:
        return ciclo, aula, []
    rows = [(hl[i], hl[i + 1]) for i in range(len(hl) - 1)]
    cols = [(vl[i], vl[i + 1]) for i in range(len(vl) - 1)]
    day_of = {}
    for i, (a, b) in enumerate(cols):
        for w in days:
            if a <= (w['x0'] + w['x1']) / 2 <= b:
                day_of[i] = DIAS.index(norm(w['text']))
    # hora de inicio de cada renglón (etiquetas "07:00 - 8:30" a la izquierda)
    start = {}
    for w in words:
        if re.fullmatch(r'\d{1,2}:\d{2}', w['text']) and w['x0'] < vl[0]:
            for j, (a, b) in enumerate(rows):
                if a <= w['top'] <= b and j not in start:
                    hh, mm = map(int, w['text'].split(':'))
                    start[j] = hh * 60 + mm
    out = []
    for ci, (xa, xb) in enumerate(cols):
        if ci not in day_of:
            continue
        cw = [w for w in words if xa < (w['x0'] + w['x1']) / 2 < xb and w['top'] > rows[0][0]]
        # renglones de texto de la columna (de arriba abajo)
        lines = []
        for w in sorted(cw, key=lambda w: (round(w['top']), w['x0'])):
            if lines and abs(lines[-1]['top'] - w['top']) < 3:
                lines[-1]['t'] += ' ' + w['text']
            else:
                lines.append({'top': w['top'], 't': w['text']})
        # secuencias materia… / grupo / profesor
        mat = []
        i = 0
        while i < len(lines):
            L = lines[i]
            toks = L['t'].split()
            if len(toks) == 1 and (GRUPO.match(toks[0]) or toks[0] in ('RECUPERACON', 'RECUPERACION', 'CURSO')):
                prof = lines[i + 1]['t'] if i + 1 < len(lines) and not GRUPO.match(lines[i + 1]['t'].split()[0]) else ''
                top = mat[0]['top'] if mat else L['top']
                bot = lines[i + 1]['top'] if prof else L['top']
                rj = [j for j, (a, b) in enumerate(rows) if b > top - 2 and a < bot + 2]
                ini = start.get(rj[0]) if rj else None
                fin = (start.get(rj[-1]) + 90) if rj and start.get(rj[-1]) is not None else None
                out.append({'dia': day_of[ci], 'inicio': hm(ini) if ini is not None else None, 'fin': hm(fin) if fin is not None else None,
                            'grupo': toks[0], 'materia': ' '.join(x['t'] for x in mat), 'profesor': prof})
                mat = []
                i += 2 if prof else 1
                continue
            mat.append(L)
            i += 1
    return ciclo, aula, out


STOP = {'de', 'la', 'el', 'y', 'e', 'en', 'los', 'las', 'a', 'del', 'i', 'ii', 'iii', 'iv', 'optativa'}


def _words(s):
    return {w for w in re.sub(r'[^a-z0-9 ]', ' ', norm(s)).split() if w not in STOP}


def _sim(a, b):
    A, B = _words(a), _words(b)
    return len(A & B) / max(1, min(len(A), len(B)))


def _mins(t):
    hh, mm = map(int, t.split(':'))
    return hh * 60 + mm


def asignar(clases, asig, data, minimo=0.7):
    """Agrega a cada clase [.., bloques(6), ..] una lista de salones paralela a sus bloques (índice 10).
    Cruza por grupo + día + materia; con varios salones el mismo día elige el más cercano en hora.
    Si la cobertura es menor a `minimo` (PDF de otro periodo), no asigna nada y devuelve la cobertura."""
    idx = {}
    for r in data['clases']:
        idx.setdefault((r['grupo'], r['dia']), []).append(r)
    tot = ok = 0
    res = []
    for c in clases:
        grp, materia, bloques = c[3], asig[c[4]], c[6]
        rooms = []
        for d, a, b in bloques:
            tot += 1
            cand = [r for r in idx.get((grp, d), []) if _sim(materia, r['materia']) >= 0.5]
            if cand:
                ok += 1
                mid = (a + b) / 2
                best = min(cand, key=lambda r: abs((_mins(r['inicio']) + _mins(r['fin'])) / 2 - mid) if r['inicio'] and r['fin'] else 0)
                rooms.append(best['aula'])
            else:
                rooms.append('')
        res.append(rooms)
    cob = ok / tot if tot else 0
    if cob >= minimo:
        for c, rooms in zip(clases, res):
            while len(c) < 10:
                c.append(None)
            c.append(rooms)
    return cob


def main():
    src = sys.argv[1]
    per = sys.argv[sys.argv.index('--periodo') + 1] if '--periodo' in sys.argv else None
    if re.match(r'https?://', src):
        tmp = pathlib.Path(tempfile.gettempdir()) / 'salones_upiita.pdf'
        url = urllib.parse.quote(src, safe=':/?=&%')
        urllib.request.urlretrieve(url, tmp)
        path = tmp
    else:
        path = pathlib.Path(src)
    clases, aulas, ciclo = [], [], None
    with pdfplumber.open(path) as pdf:
        for pg in pdf.pages:
            c, aula, out = parse_page(pg)
            ciclo = ciclo or c
            if not aula:
                continue
            aulas.append(aula)
            for r in out:
                clases.append({'aula': aula, **r})
    per = per or (ciclo[2:].replace('/', '/') if ciclo else 'desconocido')
    data = {'fuente': src, 'periodo': per, 'ciclo': ciclo, 'aulas': aulas, 'clases': clases}
    dst = ROOT / 'data' / f"salones_{per.replace('/', '-')}.json"
    dst.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    print(dst, len(aulas), 'aulas', len(clases), 'clases')


if __name__ == '__main__':
    main()
