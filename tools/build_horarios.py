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
        c = classes.setdefault(key, {"n": r["nivel"], "p": [], "h": [], "r": ""})
        sa, ed = clean(r.get("Salón") or r.get("Salon") or ""), clean(r.get("Edificio") or "")
        if salon and sa and not c["r"]:
            c["r"] = f"Edif. {ed} · {sa}" if ed else sa
        p = idx(prof, clean(r["Profesor"]))
        if p not in c["p"]:
            c["p"].append(p)
        for b in blocks(r):
            if b not in c["h"]:
                c["h"].append(b)
    out = []
    for (car, tur, grp, a), c in classes.items():
        row = [car, tur, c["n"], grp, idx(asig, a), c["p"], sorted(c["h"]), *lookup(cur, car, a, c["n"])]
        if c["r"]:
            row.append([c["r"]] * len(c["h"]))   # índice 10: salón por bloque
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
    """Mapa generado: columnas por área (categoría), filas por semestre, hasta 2 materias por renglón en cada celda.
    `e["areas"]`: [{nombre, claves, espacios: [[nombre, semestre]]}]; seriación en `e["seriacion"]` (oficial) o
    `e["seriacion_propuesta"]` (propuesta, líneas punteadas); «@Nombre» se refiere a un espacio (p. ej. «@Optativa A1»)."""
    bw, bh, gap, top, left = 128, 44, 8, 40, 40
    items = []  # (col, sem, clave, slot)
    for ci, a in enumerate(e["areas"]):
        for k in a["claves"]:
            if k in cur:
                items.append((ci, cur[k][2], k, ""))
        for name, sem in a.get("espacios", []):
            items.append((ci, sem, "", name))
    per = {}
    for ci, sem, k, sl in items:
        per.setdefault((ci, sem), []).append((k, sl))
    ncols = len(e["areas"])
    # hasta 2 materias por renglón dentro de cada celda (área × semestre)
    widths = [min(2, max(len(v) for (c, _), v in per.items() if c == ci)) * (bw + gap) + 16 for ci in range(ncols)]
    pitch = 2 * bh + 3 * gap + 10 if any(len(v) > 2 for v in per.values()) else bh + 26
    top = pitch / 2 + 4  # centro de la primera fila: deja media banda arriba para que ningún bloque quede cortado
    xs = [left + sum(widths[:i]) for i in range(ncols)]
    nsem = max(s for _, s in per)
    boxes, pos = [], {}
    for (ci, sem), lst in sorted(per.items()):
        for j, (k, sl) in enumerate(lst):
            nrow = (len(lst) + 1) // 2
            r, cc = divmod(j, 2)
            x = xs[ci] + 8 + cc * (bw + gap)
            y = top + (sem - 1) * pitch - (nrow * bh + (nrow - 1) * gap) / 2 + r * (bh + gap)
            if k:
                pos[k] = len(boxes)
            boxes.append([x, y, bw, bh, k, sl, sem])
    edges = []
    for (ci, sem), lst in sorted(per.items()):   # posición de los espacios por nombre
        pass
    for i, bx in enumerate(boxes):
        if not bx[4] and bx[5]:
            pos.setdefault("@" + bx[5], i)
    propuesta = "seriacion_propuesta" in e
    for a, b in e.get("seriacion_propuesta", e.get("seriacion", [])):
        if a not in pos or b not in pos:
            continue
        A, B = boxes[pos[a]], boxes[pos[b]]
        sx, sy, dx, dy = A[0] + A[2] / 2, A[1] + A[3], B[0] + B[2] / 2, B[1]
        mid = dy - 10
        edges.append([pos[a], pos[b], [round(v, 1) for v in (sx, sy, sx, mid, dx, mid, dx, dy)]])
    out = {
        "w": xs[-1] + widths[-1] + 20, "h": top + (nsem - 1) * pitch + pitch / 2 + 4, "pitch": pitch,
        "rows": [[s, top + (s - 1) * pitch] for s in range(1, nsem + 1)],
        "boxes": boxes, "edges": edges, "propuesto": propuesta,
        "cols": [[a["nombre"], xs[i], xs[i] + widths[i]] for i, a in enumerate(e["areas"])],
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
    return CATS["categorias"][k]["nombre"] if k else n


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
        entry = {"cur": cur[c], "lineas": esp["lineas"].get(c, []), "reglas": esp["reglas_nivel"].get(c, {})}
        if not upiita:
            # otra escuela: sin trayectorias propias; con mapa curricular del SAES se muestra la cuadrícula por nivel
            entry.update(lineas=[], reglas={}, generico=not any(v[1] for v in cur[c].values()))   # sin créditos: solo horarios
            if OPTA.get("lineas", {}).get(c):
                entry["lineas"] = OPTA["lineas"][c]
            ft = UNI_DIR / f"trayectoria_{c}.json"
            if ft.exists():
                t = json.loads(ft.read_text(encoding="utf-8"))
                if plan.get(c) == t.get("plan", plan.get(c)):
                    fa = UNI_DIR / f"areas_{c}.json"
                    if fa.exists():   # columnas por categoría (data/categorias.json); seriación del mapa oficial
                        ea = json.loads(fa.read_text(encoding="utf-8"))
                        ea["nota"] = (f"Mapa curricular {UCONF['siglas']} organizado por áreas de conocimiento (clasificación propuesta, "
                                      "sujeta a revisión). Las flechas indican la seriación del mapa oficial; al colocar el cursor sobre una "
                                      "materia se resalta su cadena de requisitos.")
                        entry["layout"], entry["generico"] = layout_por_areas(cur[c], ea), False
                    else:
                        entry["layout"], entry["generico"] = layout_de(t), False
                    if UCONF.get("modelo"):   # el modelo de la unidad aplica a los planes con mapa (ESCOM: planes 2020)
                        entry["modelo"] = UCONF["modelo"]
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
    }
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
    from acentos import acentuar  # el SAES publica los nombres sin tildes
    payload = acentuar(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    html = TPL.read_text(encoding="utf-8").replace("/*__DATA__*/null", payload)
    if UNIDAD != "upiita":   # nombre de la herramienta según la unidad
        html = html.replace("Horarios UPIITA", f"Horarios {UCONF['siglas']}")
    from skins import inject
    html = inject(html)
    import cuenta   # perfil IPN-tools: respaldo y sincronización con la cuenta institucional
    html = cuenta.inject(html, UNIDAD)
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
    write_dist("horarios", saes.inject(html, "horarios", site + "horarios.html" if site else ""))
    (ROOT / "web" / "dist" / "auth.html").write_text(cuenta.AUTH, encoding="utf-8")
    import shutil   # páginas fijas del sitio e ícono de la app (docs/marca)
    idx = cuenta.inject((ROOT / "web" / "index.html").read_text(encoding="utf-8")).replace("/*__SAES_CSS__*/", saes.CSS, 1)
    (ROOT / "web" / "dist" / "index.html").write_text(idx, encoding="utf-8")   # página principal con inicio de sesión
    for f in ("revision.html", "privacidad.html", "condiciones.html"):
        shutil.copy(ROOT / "web" / f, ROOT / "web" / "dist" / f)
    ico = ROOT / "web" / "dist" / "assets" / "icono"
    ico.mkdir(parents=True, exist_ok=True)
    for f in (ROOT / "docs" / "marca").glob("*"):
        if f.suffix in (".png", ".ico", ".svg"):
            shutil.copy(f, ico / f.name)   # retorno del inicio de sesión (ventana emergente)
    if site:   # Lector publicado como archivo para el marcador corto (Chrome para Android corta los marcadores largos)
        (ROOT / "web" / "dist" / "lector.js").write_text(saes.lector_js(site + "horarios.html"), encoding="utf-8")
        # capturador de la oferta del SAES (cualquier unidad) para el marcador corto
        (ROOT / "web" / "dist" / "captura.js").write_text((ROOT / "tools" / "captura_saes.js").read_text(encoding="utf-8"), encoding="utf-8")  # versión con encabezado institucional para el servidor de la UPIITA
    print(OUT, len(html), {k: len(v) for k, v in data["periodos"].items()})


if __name__ == "__main__":
    main()
