"""Extrae los mapas curriculares de la ESCOM (PDF vectorial, plan 2020) al formato de data/trayectoria_<c>.json.

Diferencias con los PDF de la UPIITA (tools/extract_mapa.py): las filas son semestres etiquetados «Sem. N» a la
derecha, con el semestre 1 abajo; el color de cada caja es el área de formación; solo algunos mapas dibujan
flechas de seriación. El resultado se voltea en vertical para que el semestre 1 quede arriba, como en la UPIITA.

Uso:  python tools/extract_mapa_escom.py ESCOM/mapaCurricularISC2020.pdf C
      (empata con data/unidades/escom/mapa_curricular_saes.json y escribe data/unidades/escom/trayectoria_C.json)
"""
import json, math, re, sys, pathlib, difflib
import pdfplumber
from extract_mapa import norm, inside, dist_to_box


def color(c):
    """Relleno como #rrggbb (RGB, CMYK o gris)."""
    v = c.get("non_stroking_color")
    if isinstance(v, (int, float)):
        v = (v,)
    if not isinstance(v, (list, tuple)):
        return None
    if len(v) == 1:
        v = (v[0],) * 3
    elif len(v) == 4:
        C, M, Y, K = v
        v = ((1 - C) * (1 - K), (1 - M) * (1 - K), (1 - Y) * (1 - K))
    elif len(v) != 3:
        return None
    return "#%02x%02x%02x" % tuple(round(max(0, min(1, x)) * 255) for x in v)

ROOT = pathlib.Path(__file__).resolve().parent.parent
UNI = ROOT / "data" / "unidades" / "escom"
FONDO = {"#ffffff", "#000000"}


def texto(chars, box, dup=1.6, limpia=True):
    """Texto de una caja en el orden del PDF (no por posición: la LCD trae caracteres duplicados y desplazados que,
    ordenados por x, se entrelazan). Se omiten duplicados contiguos y el renglón de horas y créditos («3/1.5  7.5»)."""
    out, prev = [], None
    for ch in chars:
        if not inside(ch, box):
            continue
        if prev and ch["text"] == prev["text"] and abs(ch["x0"] - prev["x0"]) < dup and abs(ch["top"] - prev["top"]) < dup:
            continue
        if prev and (abs(ch["top"] - prev["top"]) > 0.5 * ch["size"] or ch["x0"] - prev["x1"] > 0.22 * ch["size"] or ch["x0"] < prev["x0"] - 1):
            out.append(" ")
        out.append(ch["text"]); prev = ch
    t = re.sub(r"\s+", " ", "".join(out)).strip()
    if not limpia:
        return t
    return re.sub(r"(\s*[\d.]+/[\d.]+\s+[\d.]+\s*)+$|\s+[\d./]+(\s+[\d./]+)*$", "", t).strip()


def es_caja(c, W, H):
    w, h = c["x1"] - c["x0"], c["bottom"] - c["top"]
    f = color(c)
    return bool(c.get("fill")) and f and f not in FONDO and 0.045 * W <= w <= 0.13 * W and 0.035 * H <= h <= 0.09 * H


def extract(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        p = pdf.pages[0].dedupe_chars(tolerance=3)   # la LCD trae el texto en dos capas casi superpuestas
        W, H = p.width, p.height
        words = p.extract_words(keep_blank_chars=False)
        shapes = p.curves + p.rects
        boxes = []
        for c in shapes:
            if not es_caja(c, W, H) or any(abs(b["x0"] - c["x0"]) < 3 and abs(b["top"] - c["top"]) < 3 for b in boxes):
                continue
            txt = texto(p.chars, c)
            boxes.append({"x0": c["x0"], "top": c["top"], "x1": c["x1"], "bottom": c["bottom"], "fill": color(c), "text": txt})

        # filas: «Sem.» + número a la derecha; si no hay, se agrupan las cajas por altura (semestre 1 = la más baja)
        sems = []
        for i, w in enumerate(words):
            if w["text"].startswith("Sem"):
                n = next((x for x in words[i + 1:i + 3] if x["text"].isdigit() and abs(x["top"] - w["top"]) < 4), None)
                if n:
                    sems.append((int(n["text"]), (w["top"] + w["bottom"]) / 2))
        if len(sems) < 4:
            ys = sorted((b["top"] + b["bottom"]) / 2 for b in boxes)
            groups = [[ys[0]]]
            for y in ys[1:]:
                (groups[-1] if y - groups[-1][-1] < 0.04 * H else groups.append([y]) or groups[-1]).append(y)
            cs = [sum(g) / len(g) for g in groups]
            sems = [(len(cs) - i, y) for i, y in enumerate(cs)]

        # flechas (solo algunos mapas): trazos negros sin punta separada; varios segmentos forman una ruta que puede
        # ramificarse. Se arma un grafo de segmentos; en cada componente, la caja del semestre más bajo es el origen.
        def semde(b):
            yc = (b["top"] + b["bottom"]) / 2
            return min(sems, key=lambda r: abs(r[1] - yc))[0]
        segs = []
        for c in [s for s in shapes if not s.get("fill") and color({"non_stroking_color": s.get("stroking_color")}) == "#000000"] + list(p.lines):
            pts = [tuple(q) for q in (c.get("pts") or [(c["x0"], c["top"]), (c["x1"], c["bottom"])])]
            segs += [(a, b) for a, b in zip(pts, pts[1:]) if math.hypot(b[0] - a[0], b[1] - a[1]) > 0.5]
        key = lambda q: (round(q[0] / 3), round(q[1] / 3))
        adj = {}
        for a, b in segs:
            adj.setdefault(key(a), set()).add(key(b)); adj.setdefault(key(b), set()).add(key(a))
        pos = {}
        for a, b in segs:
            pos.setdefault(key(a), a); pos.setdefault(key(b), b)
        seen, edges = set(), []
        for n0 in adj:
            if n0 in seen:
                continue
            comp, stack = [], [n0]
            while stack:
                n = stack.pop()
                if n in seen:
                    continue
                seen.add(n); comp.append(n); stack += adj[n] - seen
            # nodos que tocan una caja (extremos de la ruta)
            touch = {}
            for n in comp:
                q = pos[n]
                i = min(range(len(boxes)), key=lambda i: dist_to_box(q, boxes[i])) if boxes else None
                if i is not None and dist_to_box(q, boxes[i]) < 6 and len(adj[n]) == 1:
                    touch.setdefault(i, n)
            if len(touch) < 2:
                continue
            src = min(touch, key=lambda i: semde(boxes[i]))
            for dst, nd in touch.items():
                if dst == src or semde(boxes[dst]) <= semde(boxes[src]):
                    continue
                # ruta más corta dentro del componente, del origen al destino
                prev, q = {touch[src]: None}, [touch[src]]
                while q:
                    n = q.pop(0)
                    if n == nd:
                        break
                    for m in adj[n]:
                        if m not in prev:
                            prev[m] = n; q.append(m)
                path, n = [], nd
                while n is not None:
                    path.append(pos[n]); n = prev.get(n)
                edges.append({"s": src, "d": dst, "pts": [[round(x, 1), round(y, 1)] for x, y in path[::-1]]})
        return boxes, edges, sems, H


def main():
    pdf, carrera = sys.argv[1], sys.argv[2]
    boxes, edges, sems, H = extract(pdf)
    m = json.loads((UNI / "mapa_curricular_saes.json").read_text(encoding="utf-8"))
    # plan vigente: el más frecuente en la oferta del SAES (el mapa curricular trae también planes anteriores)
    from collections import Counter
    oferta = json.loads((UNI / "horarios_saes.json").read_text(encoding="utf-8"))
    plan = Counter(r["plan"] for per in ("actual", "proximo") for r in oferta.get(per, []) if r["carrera"] == carrera).most_common(1)[0][0]
    cur = [(norm(r[4]), r) for r in m["rows"] if r[0] == carrera and r[1] == plan]
    names = [n for n, _ in cur]
    for b in boxes:
        yc = (b["top"] + b["bottom"]) / 2
        b["sem"] = min(sems, key=lambda r: abs(r[1] - yc))[0]
        n = norm(b["text"])
        mo = re.search(r"(?i)optativa\s+[A-Z]\d?", b["text"])   # el texto puede empezar con las horas («7.5 3/1.5 …»)
        if mo:
            b["slot"], b["text"] = "Optativa", mo.group(0)
            continue
        # se compara cada nombre del SAES con el inicio del texto (algunos PDF repiten el texto de la caja)
        # primero entre las materias del mismo semestre que la caja; si no hay parecido suficiente, entre todas
        sc = lambda idx: max(((difflib.SequenceMatcher(None, names[i], n[:len(names[i]) + 2]).ratio(), i) for i in idx), default=(0, None))
        best = sc([i for i, (_, r) in enumerate(cur) if str(r[2]) == str(b["sem"])])
        if best[0] < 0.5:   # dentro del mismo semestre basta un parecido moderado (p. ej. «Cálculo Aplicado» = CÁLCULO MULTIVARIABLE)
            best = sc(range(len(names)))
            best = best if best[0] >= 0.72 else (0, None)
        if best[1] is not None:
            r = cur[best[1]][1]
            b.update(clave=r[3].upper(), nombre=r[4], nivel_saes=int(r[2]), creditos=float(r[6]), tipo=r[5][0])
    keep = [i for i, b in enumerate(boxes) if "clave" in b or "slot" in b]
    remap = {o: n for n, o in enumerate(keep)}
    boxes = [boxes[i] for i in keep]
    edges = [dict(e, s=remap[e["s"]], d=remap[e["d"]]) for e in edges if e["s"] in remap and e["d"] in remap]
    # volteo vertical: semestre 1 arriba (como los mapas de la UPIITA)
    for b in boxes:
        b["top"], b["bottom"] = H - b["bottom"], H - b["top"]
    for e in edges:
        e["pts"] = [[x, round(H - y, 1)] for x, y in e["pts"]]
    rows = sorted(((s, H - y) for s, y in sems), key=lambda r: r[1])
    out = UNI / f"trayectoria_{carrera}.json"
    out.write_text(json.dumps({"fuente": pathlib.Path(pdf).name, "plan": plan, "rows": rows, "cols": [], "boxes": boxes, "edges": edges},
                              ensure_ascii=False, indent=1), encoding="utf-8")
    sin = [b["text"] for b in boxes if "clave" not in b and "slot" not in b]
    claves = {b.get("clave") for b in boxes if "clave" in b}
    faltan = [r[4] for _, r in cur if r[3].upper() not in claves and not re.match(r"(?i)optativa", r[4])]
    print(out.name, len(boxes), "cajas", len(edges), "flechas", len(claves), "con clave; filas", [r[0] for r in rows])
    print("  del SAES sin caja:", faltan[:15], len(faltan))


if __name__ == "__main__":
    sys.path.insert(0, str(ROOT / "tools"))
    main()
