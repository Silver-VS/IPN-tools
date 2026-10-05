"""Convierte data/horarios_upiita.json (captura del SAES) en web/horarios.html.

Uso:  python tools/build_horarios.py
Cada fila del SAES es grupo+materia+profesor; aquí se fusionan en una "clase"
por (carrera, turno, grupo, materia) con lista de profesores y bloques horarios.
"""
import json, re, pathlib, unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
# oferta del SAES: la que descarga tools/captura_saes.js (horarios_saes.json) o la captura original de la UPIITA
SRC = next((f for f in (ROOT / "data" / "horarios_saes.json", ROOT / "data" / "horarios_upiita.json") if f.exists()), ROOT / "data" / "horarios_upiita.json")
CUR = ROOT / "data" / "mapa_curricular_saes.json"
TPL = ROOT / "web" / "horarios.template.html"
OUT = ROOT / "web" / "horarios.html"
DAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
import os
UNIDAD = os.environ.get("UNIDAD", "upiita").lower()
UNI_DIR = ROOT / "data" / "unidades" / UNIDAD
UCONF = (json.loads((UNI_DIR / "unidad.json").read_text(encoding="utf-8")) if (UNI_DIR / "unidad.json").exists()
         else {"id": "upiita", "siglas": "UPIITA"})
if UNIDAD != "upiita":
    SRC, CUR, OUT = UNI_DIR / "horarios_saes.json", UNI_DIR / "mapa_curricular_saes.json", ROOT / "web" / f"horarios-{UNIDAD}.html"
PLANES = {}   # carrera -> plan vigente (otras unidades: el más frecuente en la oferta)
OPTA = json.loads((UNI_DIR / "optativas.json").read_text(encoding="utf-8")) if (UNI_DIR / "optativas.json").exists() else {}


def carrera_plan(c, p):
    """Separa planes simultáneos que reutilizan claves; el primer plan conserva el id del SAES."""
    planes = UCONF.get("planes", {}).get(c, [])
    return f"{c}_{p}" if planes and p != planes[0] else c


def nombre_vis(n):
    """Nombre para mostrar: «LÍNEA|MATERIA» del SAES (optativas de la ESCOM) -> «MATERIA (LÍNEA)»."""
    if "|" not in n:
        return n
    pre, post = (x.strip() for x in n.split("|", 1))
    lin = OPTA.get("nombres_linea", {}).get(pre, pre).upper()
    return post if norm(post) == norm(lin) else f"{post} ({lin})"


def clean(s):
    return re.sub(r"\s+", " ", s.replace(" .", "")).strip()


def to_min(hhmm):
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def blocks(row):
    out = []
    for d, name in enumerate(DAYS):
        for rng in re.findall(r"\d{1,2}:\d{2}-\d{1,2}:\d{2}", row.get(name, "")):
            a, b = rng.split("-")
            out.append([d, to_min(a), to_min(b)])
    return out


def norm(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s.upper()).strip()


def tipo_letra(t):
    """Tipo de materia del SAES: O obligatoria, P optativa, T taller (OBLIGATORIA y OPTATIVA empiezan igual)."""
    t = (t or "").upper()
    return "P" if t.startswith("OPT") else (t[:1] or "O")


def load_curriculum():
    """(carrera, nombre normalizado) -> [(nivel, clave, creditos, tipo)] sin el plan 98."""
    m = json.loads(CUR.read_text(encoding="utf-8")) if CUR.exists() else {"rows": []}   # opcional fuera de la UPIITA
    cur = {}
    for c, p, niv, clave, nom, tipo, cred, _ht, _hp in m["rows"]:
        c = carrera_plan(c, p)
        if p == "98" or (PLANES.get(c) and p != PLANES[c]):
            continue
        cur.setdefault((c, norm(nom)), []).append((int(niv), clave.upper(), float(cred), tipo_letra(tipo)))
    return cur


def lookup(cur, carrera, nombre, nivel):
    opts = cur.get((carrera, norm(nombre)))
    if not opts:   # el mapa curricular del SAES recorta los nombres largos: se acepta un prefijo de 25+ caracteres
        n = norm(nombre)
        opts = next((v for (c, k), v in cur.items() if c == carrera and len(k) >= 25 and n.startswith(k)), None)
    if not opts:
        return [0, "", ""]
    # mismo nivel y, si el nombre se repite (p. ej. "Tópicos selectos" de varias opciones terminales), la clave de la carrera
    cand = [o for o in opts if o[0] == nivel] or opts
    best = next((o for o in cand if o[1].startswith(carrera)), cand[0]) if carrera == "S" else cand[0]
    return [best[2], best[1], best[3]]


def build(rows, asig, prof, cur, salon=False):
    def idx(lst, v):
        if v not in lst:
            lst.append(v)
        return lst.index(v)

    classes = {}
    for r in rows:
        key = (r["carrera"], r["turno"], r["Grupo"], clean(r["Asignatura"]))
        c = classes.setdefault(key, {"n": r["nivel"], "p": [], "h": [], "r": {}})
        sa, ed = clean(r.get("Salón") or r.get("Salon") or ""), clean(r.get("Edificio") or "")
        p = idx(prof, clean(r["Profesor"]))
        if p not in c["p"]:
            c["p"].append(p)
        for b in blocks(r):
            if b not in c["h"]:
                c["h"].append(b)
            if salon and sa:
                rooms = c["r"].setdefault(tuple(b), [])
                room = f"Edif. {ed} · {sa}" if ed else sa
                if room not in rooms:
                    rooms.append(room)
    out = []
    for (car, tur, grp, a), c in classes.items():
        row = [car, tur, c["n"], grp, idx(asig, a), c["p"], sorted(c["h"]), *lookup(cur, car, a, c["n"])]
        if c["r"]:
            row.append([" / ".join(c["r"].get(tuple(b), [])) for b in row[6]])   # índice 10: salón por bloque
        out.append(row)
    return out


# Áreas de conocimiento de las trayectorias propuestas: límites x (coordenadas del PDF) de cada columna.
AREAS = {
    "B": [["Formación profesional", 228, 427], ["Sistemas y control", 427, 697], ["Electrónica", 697, 967], ["Estructura de los materiales", 967, 1248],
          ["Informática", 1248, 1517], ["Físico-matemáticas", 1517, 1880], ["Formación integral", 1880, 2117], ["Especialización", 2117, 2290]],
    "M": [["Profesional", 132, 339], ["Mecánica", 339, 620], ["Electrónica", 620, 845], ["Control", 845, 1062], ["Computación", 1062, 1280],
          ["Formación integral", 1280, 1458], ["Físico-matemáticas", 1458, 1738], ["Línea de especialización", 1738, 1897]],
    "T": [["Profesional", 433, 731], ["Comunicaciones", 731, 1029], ["Informática", 1029, 1288], ["Electrónica", 1288, 1548], ["OEM", 1548, 1806],
          ["Físico-matemáticas", 1806, 2162], ["Formación integral", 2162, 2500], ["Elegibles", 2500, 2718], ["Línea de aplicación", 2718, 2907]],
}


def energia_layout(cur):
    """Mapa generado para Energía (sin trayectoria de academia): columnas por área, filas por semestre del plan."""
    e = json.loads((ROOT / "data" / "energia_areas.json").read_text(encoding="utf-8"))
    return layout_por_areas(cur, e), e


def layout_por_areas(cur, e):
    """Mapa generado: columnas por área (categoría) y un renglón por semestre.
    `e["areas"]`: [{nombre, claves, espacios: [[nombre, semestre]]}]; seriación en `e["seriacion"]` (oficial) o
    `e["seriacion_propuesta"]` (propuesta, líneas punteadas); «@Nombre» se refiere a un espacio (p. ej. «@Optativa A1»).

    Para que las flechas no atraviesen materias ni se confundan entre sí:
    - cada celda (área × semestre) es un solo renglón y sus materias se acomodan bajo sus requisitos (baricentro);
    - cada flecha baja al canal entre semestres por su propio puerto y recorre su propia pista horizontal; el orden de
      las pistas minimiza los cruces y el canal crece con el número de pistas;
    - la seriación que salta semestres baja por un canal vertical entre columnas, con pista propia."""
    bw, bh, sg = 120, 46, 10           # caja y separación entre cajas de una celda
    TS, MG, MINGAP = 6, 9, 34          # separación entre pistas, margen del canal a las cajas, canal mínimo
    left, top = 22, 30
    # Un área de una sola materia no se aísla en su propia columna: las vecinas de una materia se agrupan en una sola
    # columna («A · B»); si queda sola, se une a su vecina de la izquierda. La categoría de cada materia se
    # conserva en `cat` (estadísticas por área).
    cnt = [sum(k in cur for k in a["claves"]) + len(a.get("espacios", [])) for a in e["areas"]]
    grupos = []
    for i, n in enumerate(cnt):
        if not n:
            continue
        if grupos and n == 1 and all(cnt[j] == 1 for j in grupos[-1]) and len(grupos[-1]) < 3:
            grupos[-1].append(i)
        else:
            grupos.append([i])
    cambio = True
    while cambio:
        cambio = False
        for gi, g in enumerate(grupos):
            if len(grupos) > 1 and sum(cnt[j] for j in g) == 1:
                v = gi - 1 if gi else gi + 1   # la vecina de la izquierda: en el catálogo, el área más general
                grupos[v] = sorted(grupos[v] + g)
                del grupos[gi]
                cambio = True
                break
    cat = {k: nombre_cat(a["nombre"]) for a in e["areas"] for k in a["claves"] if k in cur}
    areas = [{"nombre": " · ".join(nombre_cat(e["areas"][j]["nombre"]) for j in g),
              "claves": [k for j in g for k in e["areas"][j]["claves"]],
              "espacios": [x for j in g for x in e["areas"][j].get("espacios", [])]} for g in grupos]
    items = []                         # [col, sem, clave, espacio]
    for ci, a in enumerate(areas):
        for k in a["claves"]:
            if k in cur:
                items.append([ci, cur[k][2], k, ""])
        for name, sem in a.get("espacios", []):
            items.append([ci, sem, "", name])
    ncols, nsem = len(areas), max(it[1] for it in items)
    cells = {}
    for i, it in enumerate(items):
        cells.setdefault((it[0], it[1]), []).append(i)
    K = [max([len(v) for (c, _), v in cells.items() if c == ci] or [1]) for ci in range(ncols)]
    ref = {}
    for i, (ci, sem, k, sl) in enumerate(items):
        ref.setdefault(k or "@" + sl, i)
    pares = []
    for a, b in e.get("seriacion_propuesta", e.get("seriacion", [])):
        if a in ref and b in ref and ref[a] != ref[b] and (ref[a], ref[b]) not in pares:
            pares.append((ref[a], ref[b]))
    # Reducción transitiva: si A → B → C, la flecha directa A → C no se dibuja (C ya depende de A a través de B).
    # La seriación completa se conserva en `req` y al resaltar una materia se ve toda su cadena.
    suc = {}
    for a, b in pares:
        suc.setdefault(a, set()).add(b)
    def alcanza(x, meta, salto):   # ¿hay camino x → meta sin usar la arista directa (x, salto)?
        pila, vis = [y for y in suc.get(x, ()) if y != salto], set()
        while pila:
            y = pila.pop()
            if y == meta:
                return True
            if y not in vis:
                vis.add(y)
                pila.extend(suc.get(y, ()))
        return False
    redundantes = [(a, b) for a, b in pares if alcanza(a, b, b)]
    pares = [f for f in pares if f not in redundantes]
    pre, post = {}, {}
    for a, b in pares:
        pre.setdefault(b, []).append(a)
        post.setdefault(a, []).append(b)

    # 1) orden dentro de cada celda: barridos hacia abajo (requisitos) y hacia arriba (dependientes)
    ustart = [sum(K[:ci]) + ci + 1 for ci in range(ncols)]          # coordenada en «casillas» (con canal entre columnas)
    slot = {}
    for (ci, sem), lst in cells.items():
        s0 = (K[ci] - len(lst)) // 2
        for j, i in enumerate(lst):
            slot[i] = s0 + j
    ux = lambda i: ustart[items[i][0]] + slot[i] + .5

    def acomoda(lst, kk, want):
        """Asigna casillas crecientes 0..kk-1 a `lst` (ya ordenada) minimizando la distancia a `want`."""
        n, INF = len(lst), float("inf")
        best = [[INF] * kk for _ in range(n)]
        prev = [[-1] * kk for _ in range(n)]
        for s in range(kk):
            best[0][s] = abs(s - want[0])
        for j in range(1, n):
            m, ms = INF, -1
            for s in range(kk):
                if s and best[j - 1][s - 1] < m:
                    m, ms = best[j - 1][s - 1], s - 1
                if ms >= 0:
                    best[j][s], prev[j][s] = m + abs(s - want[j]), ms
        s = min(range(kk), key=lambda s: best[n - 1][s])
        for j in range(n - 1, -1, -1):
            slot[lst[j]] = s
            s = prev[j][s]

    for it in range(6):
        sems = range(1, nsem + 1) if it % 2 == 0 else range(nsem, 0, -1)
        vec = pre if it % 2 == 0 else post
        for sem in sems:
            for ci in range(ncols):
                lst = cells.get((ci, sem))
                if not lst:
                    continue
                d = {i: (sum(ux(x) for x in vec[i]) / len(vec[i]) if vec.get(i) else ux(i)) for i in lst}
                lst.sort(key=lambda i: (d[i], slot[i]))
                acomoda(lst, K[ci], [d[i] - ustart[ci] - .5 for i in lst])

    # 1b) búsqueda local: mover una materia a una casilla libre de su celda o intercambiarla con otra si así las flechas
    #     quedan más cortas, más rectas o con menos cruces (p. ej. una seriación que salta un semestre baja recta por
    #     una casilla vacía en lugar de rodear por un canal lateral)
    sem_of = lambda i: items[i][1]
    col_of = lambda i: items[i][0]
    occ = {}
    for i in range(len(items)):
        occ.setdefault((col_of(i), sem_of(i)), {})[slot[i]] = i
    gu = [ustart[g] - .5 for g in range(ncols)] + [sum(K) + ncols + .5]
    def libre(ci, s, s0, s1):
        return all(s not in occ.get((ci, m), {}) for m in range(s0 + 1, s1))
    def largo(f):
        a, b = f
        sa, sb = sem_of(a), sem_of(b)
        if sb == sa + 1:
            d = abs(ux(a) - ux(b))
            return d + (.6 if d > .01 else 0)
        if sb > sa + 1:
            if col_of(a) == col_of(b) and slot[a] == slot[b] and libre(col_of(a), slot[a], sa, sb):
                return 0
            return 1.5 + min(abs(g - ux(a)) + abs(g - ux(b)) for g in gu)
        return 1
    por_gap = {}
    for f in pares:
        if sem_of(f[1]) == sem_of(f[0]) + 1:
            por_gap.setdefault(sem_of(f[0]), []).append(f)
    def cruza(f, g):
        return (ux(f[0]) - ux(g[0])) * (ux(f[1]) - ux(g[1])) < -1e-9
    incid = {}
    for f in pares:
        incid.setdefault(f[0], []).append(f)
        incid.setdefault(f[1], []).append(f)
    def costo_de(mov, ci, sm):
        fs = {f for i in mov for f in incid.get(i, [])}
        fs |= {f for f in pares if col_of(f[0]) == ci == col_of(f[1]) and sem_of(f[0]) < sm < sem_of(f[1])}   # cruzan la celda
        c = sum(largo(f) for f in fs)
        for f in fs:
            for g in por_gap.get(sem_of(f[0]), []) if sem_of(f[1]) == sem_of(f[0]) + 1 else []:
                if g != f and cruza(f, g):
                    c += .5 if g in fs else 1
        return c
    for _ in range(30):
        mejoro = False
        for (ci, sm), lst in sorted(cells.items()):
            for i in list(lst):
                for t in range(K[ci]):
                    if t == slot[i]:
                        continue
                    j = occ[(ci, sm)].get(t)
                    mov = [i] + ([j] if j is not None else [])
                    antes = costo_de(mov, ci, sm)
                    si = slot[i]
                    def aplica(si_, t_):
                        occ[(ci, sm)].pop(si_, None)
                        if j is not None:
                            occ[(ci, sm)].pop(t_, None)
                            slot[j] = si_
                            occ[(ci, sm)][si_] = j
                        slot[i] = t_
                        occ[(ci, sm)][t_] = i
                    aplica(si, t)
                    if costo_de(mov, ci, sm) < antes - 1e-6:
                        mejoro = True
                    else:   # deshace
                        occ[(ci, sm)].pop(t, None)
                        if j is not None:
                            occ[(ci, sm)].pop(si, None)
                            slot[j] = t
                            occ[(ci, sm)][t] = j
                        slot[i] = si
                        occ[(ci, sm)][si] = i
        if not mejoro:
            break

    # 2) topología de cada flecha: canales horizontales (entre semestres), recta por casillas vacías o canal vertical
    #    entre columnas si salta semestres
    recta = {f for f in pares if sem_of(f[1]) > sem_of(f[0]) + 1 and col_of(f[0]) == col_of(f[1])
             and slot[f[0]] == slot[f[1]] and libre(col_of(f[0]), slot[f[0]], sem_of(f[0]), sem_of(f[1]))}
    via = {}                                                          # flecha -> canal vertical
    for a, b in pares:
        if (a, b) in recta:
            continue
        if abs(sem_of(b) - sem_of(a)) > 1 or sem_of(b) <= sem_of(a):
            if sem_of(b) == sem_of(a):
                continue
            sx, dx = ux(a), ux(b)
            via[(a, b)] = min(range(ncols + 1), key=lambda g: (abs(ustart[g] - .5 - sx if g < ncols else sum(K) + ncols + .5 - sx)
                                                              + abs((ustart[g] - .5 if g < ncols else sum(K) + ncols + .5) - dx), g))
    def gap_rango(a, b):     # canales horizontales que usa la vertical: del canal bajo el origen al canal sobre el destino
        sa, sb = sem_of(a), sem_of(b)
        return (sa, sb - 1) if sb > sa else (sb, sa)
    gtracks = {}
    for (a, b), g in sorted(via.items(), key=lambda kv: gap_rango(*kv[0])):
        lo, hi = gap_rango(a, b)
        usados = {t for (a2, b2), t in gtracks.items() if via[(a2, b2)] == g and not (gap_rango(a2, b2)[1] < lo or gap_rango(a2, b2)[0] > hi)}
        gtracks[(a, b)] = min(t for t in range(len(usados) + 1) if t not in usados)
    nG = [1 + max([t for f, t in gtracks.items() if via[f] == g] or [-1]) for g in range(ncols + 1)]
    GW = [max(22, nG[g] * TS + 16) for g in range(ncols + 1)]

    # 3) coordenadas x de columnas, cajas y canales verticales
    xc, x = [], left
    for ci in range(ncols):
        x += GW[ci]
        xc.append(x)
        x += K[ci] * bw + (K[ci] - 1) * sg
    W = x + GW[ncols] + left
    gx0 = [xc[g] - GW[g] if g < ncols else W - left - GW[ncols] for g in range(ncols + 1)]
    gtx = lambda f: gx0[via[f]] + GW[via[f]] / 2 + (gtracks[f] - (nG[via[f]] - 1) / 2) * TS
    bx = {i: xc[items[i][0]] + slot[i] * (bw + sg) for i in range(len(items))}

    # 4) puertos: salida por abajo; llegada por arriba (o por abajo si el destino no está más abajo); repartidos
    #    según la posición del otro extremo para que las flechas de una misma caja no se crucen al salir
    def otro(f, lado):
        a, b = f
        if f in via:
            return gtx(f)
        return bx[b] + bw / 2 if lado == "out" else bx[a] + bw / 2
    ports = {}
    lados = {}
    for f in pares:
        a, b = f
        lados.setdefault((a, "bot"), []).append((f, "out"))
        lados.setdefault((b, "top" if sem_of(b) > sem_of(a) else "bot"), []).append((f, "in"))
    for (i, side), lst in lados.items():
        lst.sort(key=lambda fl: otro(*fl))
        n = len(lst)
        for j, fl in enumerate(lst):
            ports[fl] = bx[i] + bw / 2 if n == 1 else bx[i] + bw * (.2 + .6 * j / (n - 1))
    # flecha corta entre cajas que se enciman en x y sin más flechas en esos lados: recta
    for f in pares:
        a, b = f
        if f in via or sem_of(b) != sem_of(a) + 1:
            continue
        if len(lados[(a, "bot")]) == 1 and len(lados[(b, "top")]) == 1:
            lo, hi = max(bx[a], bx[b]), min(bx[a], bx[b]) + bw
            if hi - lo > 16:
                ports[(f, "out")] = ports[(f, "in")] = (lo + hi) / 2
        elif len(lados[(a, "bot")]) == 1 and bx[b] + 8 < ports[(f, "in")] < bx[b] + bw - 8 and bx[a] + 8 < ports[(f, "in")] < bx[a] + bw - 8:
            ports[(f, "out")] = ports[(f, "in")]
        elif len(lados[(b, "top")]) == 1 and bx[b] + 8 < ports[(f, "out")] < bx[b] + bw - 8:
            ports[(f, "in")] = ports[(f, "out")]

    # seriación recta por casillas vacías: el mismo x en la salida y en la llegada
    for f in recta:
        x = ports[(f, "out")] if len(lados[(f[0], "bot")]) > 1 else ports[(f, "in")]
        ports[(f, "out")] = ports[(f, "in")] = x
    # una llegada no comparte x con una salida de otra flecha en el mismo canal (se encimarían sus tramos verticales)
    for f in pares:
        a, b = f
        if sem_of(b) != sem_of(a) + 1 or f in via:
            continue
        salidas = [ports[(g, "out")] for g in pares if g != f and sem_of(g[0]) == sem_of(a)]
        x = ports[(f, "in")]
        for paso in (6, -6, 12, -12, 18, -18):
            if all(abs(x - s) >= 4 for s in salidas):
                break
            if bx[b] + 6 < ports[(f, "in")] + paso < bx[b] + bw - 6:
                x = ports[(f, "in")] + paso
        ports[(f, "in")] = x

    # Ruta en «L»: si el renglón del origen está libre hacia un costado hasta la columna de la llegada y la bajada no toca
    # otra materia, la flecha sale por el lado, cruza recta y baja directo (una sola curva).
    fila_cajas = {}
    for i in range(len(items)):
        fila_cajas.setdefault(sem_of(i), []).append(i)
    ele, ele_h = {}, {}   # flecha -> (lado, desplazamiento vertical); fila -> [(x0, x1, desplazamiento)]
    def toca(i, x0, x1, m=4):
        return bx[i] - m < x1 and x0 < bx[i] + bw + m
    for f in sorted(pares, key=lambda f: abs(ports[(f, "in")] - bx[f[0]] - bw / 2)):
        a, b = f
        sa, sb = sem_of(a), sem_of(b)
        if sb <= sa or f in recta:
            continue
        x = ports[(f, "in")]
        if bx[a] - 6 <= x <= bx[a] + bw + 6:
            continue   # destino debajo del origen: la ruta normal ya es recta o casi
        der = x > bx[a] + bw
        h0, h1 = (bx[a] + bw, x) if der else (x, bx[a])
        if any(toca(i, h0, h1) for i in fila_cajas[sa] if i != a):
            continue
        if any(toca(i, x - 3, x + 3, 6) for m in range(sa + 1, sb) for i in fila_cajas.get(m, [])):
            continue
        for d in (0, -9, 9):
            if not any(d == dd and x0 < h1 + 6 and h0 < x1 + 6 for x0, x1, dd in ele_h.get(sa, [])):
                ele[f] = ("der" if der else "izq", d)
                ele_h.setdefault(sa, []).append((h0, h1, d))
                break

    # 5) tramos horizontales por canal; cada tramo: (flecha, parte, [(x, lado)]) con lado 'up' = viene/va arriba
    # Flecha larga (salta filas o cruza más de dos columnas y media): se dibuja como conector, con un tramo de salida y uno
    # de llegada; completa solo al resaltar. No ocupa pista en los canales.
    larga = {f: f not in recta and f not in ele and sem_of(f[1]) > sem_of(f[0]) and (sem_of(f[1]) - sem_of(f[0]) > 1 or
                                                abs(ports[(f, "out")] - ports[(f, "in")]) > 2.3 * (bw + sg)) for f in pares}
    tramo = {(f, ext): 12 for f in pares if larga[f] for ext in ("out", "in")}   # tramo corto de salida y de llegada
    canal = {}
    for f in pares:
        if larga[f] or f in recta or f in ele:
            continue
        a, b = f
        sa, sb = sem_of(a), sem_of(b)
        po, pi = ports[(f, "out")], ports[(f, "in")]
        if sb == sa + 1:
            canal.setdefault(sa, []).append((f, 0, [(po, "up"), (pi, "down")]))
        elif sb == sa:
            canal.setdefault(sa, []).append((f, 0, [(po, "up"), (pi, "up")]))
        elif sb > sa:
            g = gtx(f)
            canal.setdefault(sa, []).append((f, 0, [(po, "up"), (g, "down")]))
            canal.setdefault(sb - 1, []).append((f, 1, [(g, "up"), (pi, "down")]))
        else:
            g = gtx(f)
            canal.setdefault(sa, []).append((f, 0, [(po, "up"), (g, "up")]))
            canal.setdefault(sb, []).append((f, 1, [(g, "down"), (pi, "up")]))
    pista = {}
    ntr = {}
    for s, segs in canal.items():
        span = [(min(x for x, _ in st), max(x for x, _ in st)) for _, _, st in segs]
        hor = [j for j in range(len(segs)) if span[j][1] - span[j][0] > .5]

        def costo(i, j):   # cruces si el tramo i va por encima del j
            c = 0
            (i0, i1), (j0, j1) = span[i], span[j]
            for x, ld in segs[i][2]:
                if ld == "down" and j0 + .5 < x < j1 - .5:
                    c += 1
            for x, ld in segs[j][2]:
                if ld == "up" and i0 + .5 < x < i1 - .5:
                    c += 1
            for x, ld in segs[i][2]:
                for y, l2 in segs[j][2]:
                    if ld == "down" and l2 == "up" and abs(x - y) < 1:
                        c += 5   # tramos verticales encimados
            return c
        C = {(i, j): costo(i, j) for i in hor for j in hor if i != j}
        orden = []
        for j in sorted(hor, key=lambda j: span[j][0]):
            best = min(range(len(orden) + 1), key=lambda p: sum(C[(o, j)] for o in orden[:p]) + sum(C[(j, o)] for o in orden[p:]))
            orden.insert(best, j)
        mejora = True
        while mejora:
            mejora = False
            for p in range(len(orden) - 1):
                u, v = orden[p], orden[p + 1]
                if C[(v, u)] < C[(u, v)]:
                    orden[p], orden[p + 1] = v, u
                    mejora = True
        tr = {}
        for p, j in enumerate(orden):
            enc = [tr[o] for o in orden[:p] if not (span[o][1] + 6 < span[j][0] or span[j][1] + 6 < span[o][0])]
            tr[j] = 1 + max(enc) if enc else 0
        ntr[s] = 1 + max(tr.values()) if tr else 0
        for j, (f, parte, _) in enumerate(segs):
            pista[(f, parte)] = (s, tr.get(j))

    # 6) coordenadas y: el canal entre semestres crece con sus pistas
    sal = {s: max([v for (f, ext), v in tramo.items() if ext == "out" and sem_of(f[0]) == s] or [0]) for s in range(1, nsem + 1)}
    lle = {s: max([v for (f, ext), v in tramo.items() if ext == "in" and sem_of(f[1]) == s + 1] or [0]) for s in range(1, nsem + 1)}
    gapH = {s: max(MINGAP, sal[s] + lle[s] + (ntr.get(s, 1) - 1) * TS + 2 * MG) for s in range(1, nsem + 1)}
    rtop = {1: top}
    for s in range(1, nsem):
        rtop[s + 1] = rtop[s] + bh + gapH[s]
    def ty(s, t):
        g0, n = rtop[s] + bh + sal[s], ntr.get(s, 1)   # las pistas van entre los tramos de salida y los de llegada
        h = gapH[s] - sal[s] - lle[s]
        return g0 + h / 2 + (t - (n - 1) / 2) * TS if t is not None else g0 + h / 2
    H = rtop[nsem] + bh + (gapH[nsem] if ntr.get(nsem) else MINGAP / 2) + 4

    boxes, idx = [], {}
    for i, (ci, sem, k, sl) in enumerate(items):
        idx[i] = len(boxes)
        boxes.append([bx[i], rtop[sem], bw, bh, k, sl, sem])
    edges = []
    r1 = lambda v: round(v, 1)
    for f in pares:
        a, b = f
        sa, sb = sem_of(a), sem_of(b)
        po, pi = ports[(f, "out")], ports[(f, "in")]
        y0 = rtop[sa] + bh
        y1 = rtop[sb] if sb > sa else rtop[sb] + bh
        if f in recta:
            pts = [(po, y0), (po, y1)]
        elif f in ele:
            lado, d = ele[f]
            ym = rtop[sa] + bh / 2 + d
            pts = [(bx[a] + bw if lado == "der" else bx[a], ym), (pi, ym), (pi, y1)]
        elif larga[f]:
            ys, yd = y0 + tramo[(f, "out")], y1 - tramo[(f, "in")]
            pts = [(po, y0), (po, ys)] + ([(gtx(f), ys), (gtx(f), yd), (pi, yd)] if f in via else [(pi, ys)]) + [(pi, y1)]
        else:
            s0, t0 = pista[(f, 0)]
            pts = [(po, y0), (po, ty(s0, t0))]
            if (f, 1) in pista:
                s1, t1 = pista[(f, 1)]
                g = gtx(f)
                pts += [(g, ty(s0, t0)), (g, ty(s1, t1)), (pi, ty(s1, t1))]
            else:
                pts.append((pi, ty(s0, t0)))
            pts.append((pi, y1))
        limpio = []
        for p in pts:   # sin puntos repetidos ni colineales
            if limpio and abs(p[0] - limpio[-1][0]) < .05 and abs(p[1] - limpio[-1][1]) < .05:
                continue
            if len(limpio) >= 2 and ((abs(limpio[-2][0] - limpio[-1][0]) < .05 and abs(limpio[-1][0] - p[0]) < .05) or
                                     (abs(limpio[-2][1] - limpio[-1][1]) < .05 and abs(limpio[-1][1] - p[1]) < .05)):
                limpio[-1] = p
                continue
            limpio.append(p)
        pp = [r1(v) for p in limpio for v in p]
        edges.append([idx[a], idx[b], pp, 1, tramo[(f, "out")], tramo[(f, "in")]] if larga[f] else [idx[a], idx[b], pp, 0])
    centros = [[s, rtop[s] + bh / 2] for s in range(1, nsem + 1)]
    out = {
        "w": r1(W), "h": r1(H),
        "pitch": r1(min([centros[i + 1][1] - centros[i][1] for i in range(nsem - 1)] or [bh + MINGAP])),
        "rows": [[s, r1(y)] for s, y in centros],
        "boxes": [[r1(v) if isinstance(v, float) else v for v in b] for b in boxes], "edges": edges,
        "propuesto": "seriacion_propuesta" in e, "filas_exactas": True, "rutas": True, "ocultas": len(redundantes),
        "cols": [[a["nombre"], r1(gx0[i] + GW[i] / 2), r1(gx0[i + 1] + GW[i + 1] / 2)] for i, a in enumerate(areas)], "cat": cat,
    }
    if e.get("nota"):
        out["nota"] = e["nota"]
    return out


# ISISA: en la UPIITA solo se imparte la opción terminal (7.º a 9.º semestre, línea "S" del plan 08). El resto del plan
# (semestres 1 a 6 y opciones terminales de otras unidades) no aplica. Los espacios de Tópicos selectos I y II
# corresponden a Control inteligente I y II.
ISISA = [(7, ["S741", "S739", "S740", "S742", "S737", "S738"]),
         (8, ["S845", "S843", "S844", "S846", "S848", "S849"]),
         (9, ["S950"])]
ISISA_NOMBRES = {"S742": "CONTROL INTELIGENTE I", "S846": "CONTROL INTELIGENTE II"}


def isisa_layout():
    bw, bh, gx, pitch, left, top = 150, 52, 14, 86, 70, 54
    boxes, rows = [], []
    for i, (sem, claves) in enumerate(ISISA):
        y = top + i * pitch
        rows.append([sem, y])
        for j, k in enumerate(claves):
            boxes.append([left + j * (bw + gx), y - bh / 2, bw, bh, k, "", sem])
    return {"w": left + 6 * (bw + gx) + 10, "h": top + (len(ISISA) - 1) * pitch + pitch / 2 + 4, "pitch": pitch,
            "rows": rows, "boxes": boxes, "edges": [],
            "nota": "En la UPIITA, Ingeniería en Sistemas Automotrices se imparte únicamente como opción terminal "
                    "(7.º a 9.º semestre). Control inteligente I y II "
                    "corresponden en el SAES a Tópicos selectos de ingeniería I y II."}


CATS = json.loads((ROOT / "data" / "categorias.json").read_text(encoding="utf-8")) if (ROOT / "data" / "categorias.json").exists() else {}


def nombre_cat(n):
    """Nombre de columna del catálogo común (data/categorias.json); las áreas propias de una carrera se conservan."""
    k = CATS.get("sinonimos", {}).get(n)
    return CATS["categorias"][k]["nombre"] if k else CATS.get("cortos", {}).get(n, n)


# categoría (data/categorias.json) de cada línea de especialización de la UPIITA: base de la afinidad del alumno
CAT_LINEA_UPIITA = {
    ("B", "I · Bioinstrumentación"): "Electrónica", ("B", "II · Prótesis inteligentes"): "Electrónica",
    ("B", "I · Control inteligente"): "Sistemas y control", ("B", "II · Sistemas ergonómicos"): "Estructura de los materiales",
    ("B", "I · Robótica suave"): "Sistemas y control", ("B", "II · Biorobótica"): "Sistemas y control",
    ("M", "Administración de sistemas"): "Formación integral", ("M", "Control y automatización"): "Sistemas y control",
    ("M", "Robótica y sistemas inteligentes"): "Sistemas y control", ("M", "Sistemas de manufactura"): "Mecánica",
    ("M", "Sistemas embebidos e interfaces hombre-máquina"): "Electrónica",
    ("T", "Administración"): "Formación integral", ("T", "II"): "Comunicaciones y redes", ("T", "Redes"): "Comunicaciones y redes",
    ("T", "Informática"): "Informática y computación",
}


def layout_de(t, areas=()):
    """Trazado del mapa (cajas, filas y flechas) relativo a su esquina, desde data/.../trayectoria_<c>.json."""
    bx = t["boxes"]
    x0 = min(b["x0"] for b in bx) - 40
    y0 = min(r[1] for r in t["rows"]) - 40
    r1 = lambda v: round(v, 1)
    return {
        "w": r1(max(b["x1"] for b in bx) - x0 + 20),
        "h": r1(max(r[1] for r in t["rows"]) - y0 + 40),
        "pitch": r1((t["rows"][-1][1] - t["rows"][0][1]) / (len(t["rows"]) - 1)),
        "rows": [[r[0], r1(r[1] - y0)] for r in t["rows"]],
        "boxes": [[r1(b["x0"] - x0), r1(b["top"] - y0), r1(b["x1"] - b["x0"]), r1(b["bottom"] - b["top"]),
                   b.get("clave") or "", b.get("slot") or "", b["sem"]] for b in bx],
        "edges": [[e["s"], e["d"], [r1(v - (x0 if i % 2 == 0 else y0)) for pt in e["pts"] for i, v in enumerate(pt)]] for e in t["edges"]],
        "cols": [[n, r1(a - x0), r1(b - x0)] for n, a, b in areas],
    }


def load_maps(offer, upiita=True, extra=None):
    """Mapas curriculares: plan vigente del SAES + cajas/flechas de las trayectorias propuestas.
    `offer`: oferta del SAES (para saber el plan vigente de cada carrera); `upiita`: aplica las trayectorias y mapas
    propios de la UPIITA; `extra`: materias sin mapa curricular {carrera: {clave: [nombre, 0, nivel, 'O']}}."""
    m = json.loads(CUR.read_text(encoding="utf-8")) if CUR.exists() else {"rows": []}
    # plan vigente por carrera: el más frecuente en la oferta (en la UPIITA, además, los planes conocidos)
    from collections import Counter
    freq = Counter((r["carrera"], r.get("plan")) for per in ("actual", "proximo") for r in offer.get(per, []))
    plan = {}
    for (c, pl), _ in freq.most_common():
        plan.setdefault(c, pl)
    if upiita:
        plan.update({"B": "09", "M": "09", "T": "09", "E": "18", "S": "08"})
    cur = {}
    for c, p, niv, clave, nom, tipo, cred, _ht, _hp in m["rows"]:
        c = carrera_plan(c, p)
        if plan.get(c) == p:
            cur.setdefault(c, {})[clave.upper()] = [nom, float(cred), int(niv), tipo_letra(tipo)]
    for c, extra_c in (extra or {}).items():
        for k, v in extra_c.items():
            cur.setdefault(c, {}).setdefault(k, v)
    esp = json.loads((ROOT / "data" / "especialidades.json").read_text(encoding="utf-8"))
    seri = json.loads((ROOT / "data" / "seriacion.json").read_text(encoding="utf-8"))["requisitos"]
    maps = {}
    for c in cur:
        f = ROOT / "data" / f"trayectoria_{c}.json"
        entry = {"cur": cur[c], "lineas": [dict(l, categoria=nombre_cat(CAT_LINEA_UPIITA.get((c, l["linea"]))) if CAT_LINEA_UPIITA.get((c, l["linea"])) else None) for l in esp["lineas"].get(c, [])],
                 "reglas": esp["reglas_nivel"].get(c, {})}
        if not upiita:
            # otra escuela: sin trayectorias propias; con mapa curricular del SAES se muestra la cuadrícula por nivel
            entry.update(lineas=[], reglas={}, generico=not any(v[1] for v in cur[c].values()))   # sin créditos: solo horarios
            if OPTA.get("lineas", {}).get(c):
                entry["lineas"] = [dict(l, categoria=nombre_cat(l["categoria"])) if l.get("categoria") else l for l in OPTA["lineas"][c]]
            ft = UNI_DIR / f"trayectoria_{c}.json"
            if ft.exists():
                t = json.loads(ft.read_text(encoding="utf-8"))
                if plan.get(c) == t.get("plan", plan.get(c)):
                    fa = UNI_DIR / f"areas_{c}.json"
                    if fa.exists():   # columnas por categoría (data/categorias.json); seriación del mapa oficial
                        ea = json.loads(fa.read_text(encoding="utf-8"))
                        ea.setdefault("nota", (f"Mapa curricular {UCONF['siglas']} organizado por áreas de conocimiento (clasificación propuesta, "
                                      "sujeta a revisión). Las flechas indican la seriación del mapa oficial; al colocar el cursor sobre una "
                                      "materia se resalta su cadena de requisitos."))
                        entry["layout"], entry["generico"] = layout_por_areas(cur[c], ea), False
                    else:
                        entry["layout"], entry["generico"] = layout_de(t), False
                    if t.get("modelo") or UCONF.get("modelo"):   # el modelo de la unidad aplica a los planes con mapa (ESCOM: planes 2020)
                        entry["modelo"] = t.get("modelo", UCONF.get("modelo"))
                    req = {}
                    for e in t["edges"]:
                        a_, b_ = t["boxes"][e["s"]].get("clave"), t["boxes"][e["d"]].get("clave")
                        if a_ and b_:
                            req.setdefault(b_, []).append(a_)
                    for b_, as_ in OPTA.get("req", {}).get(c, {}).items():   # optativas: 6.º -> 7.º de la misma línea
                        req.setdefault(b_, []).extend(as_)
                    entry["req"] = req
            maps[c] = entry
            continue
        if f.exists():
            entry["layout"] = layout_de(json.loads(f.read_text(encoding="utf-8")), [[nombre_cat(n), x0, x1] for n, x0, x1 in AREAS.get(c, [])])
            entry["req"] = seri.get(c, {})
        elif c == "S":
            keep = {k for _, ks in ISISA for k in ks}
            entry["cur"] = {k: ([ISISA_NOMBRES[k]] + v[1:] if k in ISISA_NOMBRES else v) for k, v in cur[c].items() if k in keep}
            entry["layout"], entry["req"] = isisa_layout(), {}
        elif c == "E":
            entry["layout"], e = energia_layout(cur[c])
            req = {}
            for a, b in e["seriacion_propuesta"]:
                req.setdefault(b, []).append(a)
            entry["req"] = req
            # las optativas tienen una clave por semestre: se agrupan todas las variantes del mismo nombre
            byname = {}
            for k, v in cur[c].items():
                byname.setdefault(v[0].upper(), []).append(k)
            entry["lineas"] = [{**l, "claves": [x for k in l["claves"] for x in byname[cur[c][k][0].upper()]]} for l in e["lineas"]]
        maps[c] = entry
    return maps


def main():
    import sys
    sys.path.insert(0, str(ROOT / "tools"))
    d = json.loads(SRC.read_text(encoding="utf-8"))
    opciones = {}
    for c, planes in UCONF.get("planes", {}).items():
        nombre = d["carreras"].pop(c)
        for p in planes:
            ident = carrera_plan(c, p)
            d["carreras"][ident] = f"{nombre} (plan 20{p})"
            opciones[ident] = {"carrera": c, "plan": p}
    for per in ("actual", "proximo"):
        for row in d[per]:
            row["carrera"] = carrera_plan(row["carrera"], row["plan"])
    if UNIDAD != "upiita":   # plan vigente por carrera
        from collections import Counter
        for (c_, pl), _ in Counter((r["carrera"], r.get("plan")) for k in ("actual", "proximo") for r in d.get(k, [])).most_common():
            PLANES.setdefault(c_, pl)
    asig, prof, cur = [], [], load_curriculum()
    data = {
        "capturado": d["capturado"],
        "carreras": d["carreras"],
        "asig": asig,
        "prof": prof,
        "periodos": {k: build(d[k], asig, prof, cur, salon=UNIDAD != "upiita") for k in ("proximo", "actual")},
        "unidad": UNIDAD,
        "siglas": UCONF["siglas"],
        "opciones_plan": opciones,
    }
    # Equivalencias entre carreras de la misma unidad (tabla del SAES), solo entre los planes que se ofrecen aquí.
    # Se muestran como consulta en la planeación de horario; no modifican el avance ni la seriación.
    fe = UNI_DIR / "equivalencias.json"
    if fe.exists():
        eq = json.loads(fe.read_text(encoding="utf-8"))
        def ident(c_, p_):
            i_ = carrera_plan(c_, p_)
            ok = i_ in data["carreras"] and (opciones[i_]["plan"] == p_ if i_ in opciones else PLANES.get(c_) == p_)
            return i_ if ok else None
        rel = []
        for r in eq["relaciones"]:
            o, dd = r["origen"], r["destino"]
            io, idd = ident(o[0], o[1]), ident(dd[0], dd[1])
            if io and idd and io != idd:
                rel.append([io, o[3], o[2], idd, dd[3], dd[2]])
        mult = [[ident(*m["origen"][:2]), m["origen"][3], ident(*m["destino_contexto"][:2]), [x[3] for x in m["destinos"]]]
                for m in eq.get("multiples", [])]
        data["equiv"] = {"fuente": eq["fuente"], "consultado": eq["consultado"], "rel": rel,
                         "multiples": [m for m in mult if m[0] and m[2]]}
    # materias sin mapa curricular (otra escuela o materia nueva): clave interna estable por carrera y nombre,
    # para que el armado de horario funcione aunque no haya trayectoria ni créditos
    upiita = UNIDAD == "upiita" and "saes.upiita" in d.get("fuente", "saes.upiita")
    extra, syn = {}, {}
    for per in data["periodos"].values():
        for c in per:
            if not c[8]:
                key = (c[0], c[4])
                if key not in syn:
                    syn[key] = f"{c[0]}~{len([k for k in syn if k[0] == c[0]]) + 1}"
                    extra.setdefault(c[0], {})[syn[key]] = [asig[c[4]], 0.0, c[2], "O"]
                c[8], c[7], c[9] = syn[key], 0.0, "O"
    data["mapas"] = load_maps(d, upiita, extra)
    # salones: PDF de horarios por aula de la unidad (tools/salones.py) -> solo el periodo actual; el próximo aún no
    # los tiene. Se toma el archivo data/salones_*.json más reciente y se aplica si coincide con la oferta del SAES.
    import salones
    sal = sorted((ROOT / "data").glob("salones_*.json"), key=lambda p: p.stat().st_mtime)
    if sal and upiita:
        sd = json.loads(sal[-1].read_text(encoding="utf-8"))
        cob = salones.asignar(data["periodos"]["actual"], asig, sd)
        if cob >= 0.7:
            data["salones"] = {"periodo": sd.get("ciclo") or sd["periodo"], "cobertura": round(cob, 3)}
        print("salones", sal[-1].name, f"cobertura {cob:.1%}", "aplicados" if cob >= 0.7 else "NO aplicados (otro periodo)")
    if UNIDAD != "upiita":
        full = {}   # clave -> nombre completo según la oferta (el mapa curricular los recorta)
        for per in data["periodos"].values():
            for c in per:
                if c[8]:
                    full.setdefault((c[0], c[8]), asig[c[4]])
        for car, mp in data["mapas"].items():
            for k, v in mp["cur"].items():
                n = full.get((car, k), v[0])
                v[0] = nombre_vis(n if norm(n).startswith(norm(v[0])) else v[0])
        data["asig"] = [nombre_vis(a) for a in asig]
    nb = sum(len(c[6]) for per in data["periodos"].values() for c in per)
    con = sum(1 for per in data["periodos"].values() for c in per if len(c) > 10 for _ in c[6])
    if not upiita and con:
        data["salones"] = {"fuente": "saes", "periodo": "SAES", "cobertura": round(con / nb, 3)}
    from acentos import acentuar, acentuar_nombre  # el SAES publica los nombres sin tildes
    # reglas ortográficas en todo menos los nombres de profesores (apellidos como MUJICA no llevan tilde)
    def tildes(v):
        if isinstance(v, str):
            return acentuar_nombre(v)
        if isinstance(v, list):
            return [tildes(x) for x in v]
        if isinstance(v, dict):
            return {k: (x if k == "prof" else tildes(x)) for k, x in v.items()}
        return v
    cal = json.loads((ROOT / "data" / "calendario.json").read_text(encoding="utf-8")) if (ROOT / "data" / "calendario.json").exists() else {}
    data["calendario"] = cal.get(UNIDAD)   # fechas de Gestión Escolar (publicación de citas, etc.)
    payload = acentuar(json.dumps(tildes(data), ensure_ascii=False, separators=(",", ":")))
    html = TPL.read_text(encoding="utf-8").replace("/*__DATA__*/null", payload)
    if UNIDAD != "upiita":   # nombre de la herramienta según la unidad
        html = html.replace("Horarios UPIITA", f"Horarios {UCONF['siglas']}")
    from skins import inject
    html = inject(html)
    import cuenta   # perfil IPN-tools: respaldo y sincronización con la cuenta institucional
    html = cuenta.inject(html, UNIDAD)
    import encuesta   # encuesta de satisfacción de la fase de pruebas (data/encuesta.json)
    html = encuesta.inject(html, UNIDAD)
    import saes
    # el marcador de la versión compartida abre esta herramienta; el de la versión institucional, la URL del servidor (pendiente)
    OUT.write_text(saes.inject(html, "horarios", "https://claude.ai/artifact/2ujcEF2YK8FZrYjoyPbKEk", UCONF), encoding="utf-8")
    from institucional import write_dist
    import os
    site = os.environ.get("UPIITA_SITE", "")  # p. ej. https://silver-vs.github.io/upiita/ : el marcador abre esta dirección
    if UNIDAD != "upiita":
        nombre = f"horarios-{UNIDAD}"
        write_dist(nombre, saes.inject(html, "horarios", site + nombre + ".html" if site else "", UCONF), f" | {UCONF['siglas']} IPN", UCONF)
        print(OUT, len(html), {k: len(v) for k, v in data["periodos"].items()}, "salones", data.get("salones"))
        return
    write_dist("horarios-upiita", saes.inject(html, "horarios", site + "horarios-upiita.html" if site else ""))
    # horarios.html ya no es la UPIITA: lleva a la unidad que este navegador ya usa o muestra el selector de unidad
    # (los marcadores y enlaces anteriores apuntan aquí)
    unis = json.loads((ROOT / "data" / "cuenta.json").read_text(encoding="utf-8")).get("unidades", [])
    from vista_previa import aplicar
    (ROOT / "web" / "dist" / "horarios.html").write_text(aplicar(selector_horarios(unis), "horarios"), encoding="utf-8")
    (ROOT / "web" / "dist" / "auth.html").write_text(cuenta.AUTH, encoding="utf-8")
    import shutil   # páginas fijas del sitio e ícono de la app (docs/marca)
    idx = cuenta.inject((ROOT / "web" / "index.html").read_text(encoding="utf-8")).replace("/*__SAES_CSS__*/", saes.CSS, 1)
    idx = idx.replace("/*__UNIDADES__*/[]", json.dumps(json.loads((ROOT / "data" / "cuenta.json").read_text(encoding="utf-8")).get("unidades", []), ensure_ascii=False), 1)
    (ROOT / "web" / "dist" / "index.html").write_text(aplicar(idx, "index"), encoding="utf-8")   # página principal con inicio de sesión
    for f in ("revision.html", "privacidad.html", "condiciones.html"):
        shutil.copy(ROOT / "web" / f, ROOT / "web" / "dist" / f)
    ico = ROOT / "web" / "dist" / "assets" / "icono"
    ico.mkdir(parents=True, exist_ok=True)
    for f in (ROOT / "docs" / "marca").glob("*"):
        if f.suffix in (".png", ".ico", ".svg") and (f.name.startswith(("ipn-tools-icono", "ipn-tools-og")) or f.name == "favicon.ico"):   # no los bocetos
            shutil.copy(f, ico / f.name)   # retorno del inicio de sesión (ventana emergente)
    if site:   # Lector publicado como archivo para el marcador corto (Chrome para Android corta los marcadores largos)
        (ROOT / "web" / "dist" / "lector.js").write_text(saes.lector_js(site + "horarios-upiita.html"), encoding="utf-8")
        # capturador de la oferta del SAES (cualquier unidad) para el marcador corto
        (ROOT / "web" / "dist" / "captura.js").write_text((ROOT / "tools" / "captura_saes.js").read_text(encoding="utf-8"), encoding="utf-8")  # versión con encabezado institucional para el servidor de la UPIITA
    print(OUT, len(html), {k: len(v) for k, v in data["periodos"].items()})


def selector_horarios(unis):
    """Página horarios.html: redirige a la unidad recordada (ipnt.unidad, el Lector o datos guardados) o deja elegirla."""
    import html as h
    lista = "".join(f'<a class="u" href="{h.escape(u["url"])}"><b>Horarios {h.escape(u["siglas"])}</b><span>{h.escape(u["nombre"])}</span></a>'
                    for u in unis if u.get("disponible"))
    destinos = json.dumps({u["id"]: u["url"] for u in unis if u.get("disponible")})
    return f"""<!doctype html>
<html lang="es">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Horarios | IPN-tools</title>
<link rel="icon" href="assets/icono/favicon.ico">
<script>
// Unidad recordada: la última página de Horarios abierta, la unidad del Lector o datos guardados de la UPIITA (claves hu.*)
(function(){{var D={destinos},u=null;
  try{{u=localStorage.getItem('ipnt.unidad');
    if(!D[u]){{var a=JSON.parse(localStorage.getItem('saes.alumno')||'null');u=a&&(a.unidad||'upiita')}}
    if(!D[u]){{for(var i=0;i<localStorage.length;i++){{var k=localStorage.key(i);if(/^hu[.]/.test(k)&&!/^hu[.](escom|upibi)[.]/.test(k)){{u='upiita';break}}}}}}
  }}catch(e){{}}
  if(D[u])location.replace(D[u]+location.search+location.hash);}})();
</script>
<style>
:root{{--bg:#faf8f9;--fg:#231f20;--muted:#6b6266;--line:#e4dde0;--surface:#fff;--accent:#8a1849}}
@media (prefers-color-scheme:dark){{:root{{--bg:#171416;--fg:#ece6e9;--muted:#a99ea3;--line:#332c30;--surface:#211d20;--accent:#e889b2}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif}}
main{{max-width:720px;margin:0 auto;padding:40px 16px}}
h1{{font-size:1.5rem;margin:0 0 6px}} p{{color:var(--muted);margin:0 0 20px}}
.g{{display:grid;gap:12px}}
a.u{{display:block;padding:16px 18px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:inherit;text-decoration:none}}
a.u:hover{{border-color:var(--accent)}} a.u b{{display:block;font-size:1.05rem}} a.u span{{color:var(--muted);font-size:.9rem}}
a{{color:var(--accent)}}
</style>
<main>
  <h1>Horarios</h1>
  <p>Selecciona tu unidad académica.</p>
  <div class="g">{lista}</div>
  <p style="margin-top:24px"><a href="index.html">Volver a IPN-tools</a></p>
</main>
</html>
"""


if __name__ == "__main__":
    main()
