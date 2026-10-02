"""Extrae cajas (materias) y flechas (seriación) de los PDF vectoriales de trayectoria.

Uso:  python tools/extract_mapa.py "programas/Ingenieria Bionica trayectoria 0624.pdf" B
Salida: data/trayectoria_<carrera>.json con cajas en coordenadas del PDF, su color
de relleno (nivel), texto, y flechas origen -> destino; luego empata con claves del SAES.
"""
import json, math, re, sys, pathlib, unicodedata, difflib
import pdfplumber

ROOT = pathlib.Path(__file__).resolve().parent.parent


def norm(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z0-9 ]", "", re.sub(r"\s+", " ", s.upper())).strip()


def inside(w, b, pad=2):
    cx, cy = (w["x0"] + w["x1"]) / 2, (w["top"] + w["bottom"]) / 2
    return b["x0"] - pad <= cx <= b["x1"] + pad and b["top"] - pad <= cy <= b["bottom"] + pad


def dist_to_box(pt, b):
    x, y = pt
    dx = max(b["x0"] - x, 0, x - b["x1"])
    dy = max(b["top"] - y, 0, y - b["bottom"])
    return math.hypot(dx, dy)


def color(c):
    v = c.get("non_stroking_color")
    if isinstance(v, (list, tuple)) and len(v) == 3:
        return "#%02x%02x%02x" % tuple(round(x * 255) for x in v)
    return None


def extract(pdf_path, region):
    with pdfplumber.open(pdf_path) as pdf:
        p = pdf.pages[0].dedupe_chars()
        x0, top, x1, bottom = region
        inr = lambda o: o["x0"] >= x0 and o["x1"] <= x1 and o["top"] >= top and o["bottom"] <= bottom
        words = [w for w in p.extract_words(keep_blank_chars=False) if inr(w)]
        shapes = [c for c in p.curves + p.rects if inr(c)]

        boxes = []
        for c in shapes:
            w, h = c["x1"] - c["x0"], c["bottom"] - c["top"]
            if c.get("fill") and 34 <= h <= 70 and 55 <= w <= 200:
                txt = " ".join(x["text"] for x in sorted((x for x in words if inside(x, c)), key=lambda x: (round(x["top"] / 4), x["x0"])))
                if txt and not any(abs(b["x0"] - c["x0"]) < 2 and abs(b["top"] - c["top"]) < 2 for b in boxes):
                    boxes.append({"x0": c["x0"], "top": c["top"], "x1": c["x1"], "bottom": c["bottom"], "fill": color(c), "text": txt})

        heads = [c for c in shapes if c.get("fill") and c["x1"] - c["x0"] < 10.5 and c["bottom"] - c["top"] < 10.5]
        conns = []
        for c in shapes + [l for l in p.lines if inr(l)]:
            w, h = c["x1"] - c["x0"], c["bottom"] - c["top"]
            if c.get("fill") or (34 <= h <= 70 and 55 <= w <= 200) or (w < 10.5 and h < 10.5):
                continue
            pts = c.get("pts") or [(c["x0"], c["top"]), (c["x1"], c["bottom"])]
            conns.append(pts)

        edges = []
        for pts in conns:
            pts = [tuple(q) for q in pts]
            # el extremo más cercano a una punta de flecha es el destino
            hd = lambda q: min((math.hypot((h["x0"] + h["x1"]) / 2 - q[0], (h["top"] + h["bottom"]) / 2 - q[1]) for h in heads), default=99)
            if hd(pts[0]) < hd(pts[-1]):
                pts = pts[::-1]
            a, b = pts[0], pts[-1]
            if hd(b) > 14:
                continue
            src = min(range(len(boxes)), key=lambda i: dist_to_box(a, boxes[i]))
            dst = min(range(len(boxes)), key=lambda i: dist_to_box(b, boxes[i]))
            if src != dst and dist_to_box(a, boxes[src]) < 14 and dist_to_box(b, boxes[dst]) < 18:
                edges.append({"s": src, "d": dst, "pts": [[round(x, 1), round(y, 1)] for x, y in pts]})

        # filas (semestre) por las etiquetas numéricas a la izquierda; columnas por el encabezado
        mx = min(b["x0"] for b in boxes)
        rows = sorted(((int(w["text"]), (w["top"] + w["bottom"]) / 2) for w in words
                       if w["text"].isdigit() and 1 <= int(w["text"]) <= 10 and w["x1"] < mx), key=lambda r: r[1])
        mt = min(b["top"] for b in boxes)
        hw = sorted((w for w in words if mt - 90 < w["top"] and w["bottom"] < mt - 4 and w["x0"] > mx - 60), key=lambda w: w["x0"])
        cols, cur = [], None
        for w in hw:
            if cur and w["x0"] - cur["x1"] < 14:
                cur["text"] += " " + w["text"]; cur["x1"] = max(cur["x1"], w["x1"])
            else:
                cur = {"text": w["text"], "x0": w["x0"], "x1": w["x1"]}; cols.append(cur)
        if not rows:  # sin etiquetas de semestre: agrupar cajas por altura
            ys = sorted((b["top"] + b["bottom"]) / 2 for b in boxes)
            groups = [[ys[0]]]
            for y in ys[1:]:
                (groups[-1] if y - groups[-1][-1] < 25 else groups.append([y]) or groups[-1]).append(y)
            cs = [sum(g) / len(g) for g in groups]
            pitch = sorted(b - a for a, b in zip(cs, cs[1:]))[len(cs) // 2]  # mediana del espaciado
            rows = [(i + 1, cs[0] + i * pitch) for i in range(10)]
        return boxes, edges, rows, cols


def match_saes(boxes, carrera):
    m = json.loads((ROOT / "data" / "mapa_curricular_saes.json").read_text(encoding="utf-8"))
    cur = [(norm(r[4]), r) for r in m["rows"] if r[0] == carrera and r[1] != "98"]
    names = [n for n, _ in cur]
    for b in boxes:
        n = norm(b["text"])
        hit = difflib.get_close_matches(n, names, n=1, cutoff=0.72)
        if hit:
            r = cur[names.index(hit[0])][1]
            b.update(clave=r[3].upper(), nombre=r[4], nivel_saes=int(r[2]), creditos=float(r[6]), tipo=r[5][0])


if __name__ == "__main__":
    pdf, carrera = sys.argv[1], sys.argv[2]
    region = tuple(map(float, sys.argv[3].split(","))) if len(sys.argv) > 3 else (0, 360, 2300, 1240)
    boxes, edges, rows, cols = extract(pdf, region)
    match_saes(boxes, carrera)
    for b in boxes:
        yc = (b["top"] + b["bottom"]) / 2
        b["sem"] = min(rows, key=lambda r: abs(r[1] - yc))[0] if rows else None
        if re.match(r"(?i)^(electiva|optativa|opativa|elegible)", b["text"]) and len(b["text"]) < 16:
            for k in ("clave", "nombre", "nivel_saes", "creditos", "tipo"):
                b.pop(k, None)
            b["slot"] = re.split(r"\s", b["text"])[0].capitalize().replace("Opativa", "Optativa")
    pitch = (rows[-1][1] - rows[0][1]) / (len(rows) - 1)
    off = lambda b: min(abs(r[1] - (b["top"] + b["bottom"]) / 2) for r in rows)
    keep = [i for i, b in enumerate(boxes) if ("clave" in b or "slot" in b) and off(b) < 0.6 * pitch]
    remap = {o: n for n, o in enumerate(keep)}
    boxes = [boxes[i] for i in keep]
    edges = [dict(e, s=remap[e["s"]], d=remap[e["d"]]) for e in edges if e["s"] in remap and e["d"] in remap]
    out = ROOT / "data" / f"trayectoria_{carrera}.json"
    out.write_text(json.dumps({"fuente": pathlib.Path(pdf).name, "rows": rows, "cols": cols, "boxes": boxes, "edges": edges}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(out, len(boxes), "cajas", len(edges), "flechas", sum(1 for b in boxes if "clave" in b), "con clave")
    for b in boxes:
        if "clave" not in b:
            print("  sin clave:", b["text"])
    print("  filas", [r[0] for r in rows], "columnas", [c["text"] for c in cols])
    print("  sin semestre", [b["text"] for b in boxes if not b["sem"]])
