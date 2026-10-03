"""Extrae las trayectorias de la UPIBI (PDF vectorial: niveles en columnas, de izquierda a derecha).

Por cada caja: nombre, nivel (columna «Nivel I…VIII» o «Semestre 1…8»), área de formación (color), horas y
créditos; y la seriación de las flechas (punta gris = destino). Sin captura del SAES aún no hay claves: el
empate con el mapa curricular se hace después (data/unidades/upibi/).

Uso:  python tools/extract_mapa_upibi.py            (todas las de UPIBI/*.pdf)
"""
import json, math, pathlib, re, sys
import pdfplumber

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from extract_mapa import inside, dist_to_box
from extract_mapa_escom import color, texto

ROMANO = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10}
OUT = ROOT / "data" / "unidades" / "upibi" / "mapas_pdf"


def area(c):
    """Área de formación por color (el más cercano de la paleta; los PDF varían en un tono)."""
    f = color(c)
    if not f:
        return None
    rgb = tuple(int(f[i:i + 2], 16) for i in (1, 3, 5))
    pal = {"Profesional": (247, 252, 62), "Científica básica": (88, 169, 7), "Terminal y de integración": (244, 111, 12),
           "Institucional": (28, 200, 240)}
    nombre, d = min(((n, sum((a - b) ** 2 for a, b in zip(rgb, v)) ** .5) for n, v in pal.items()), key=lambda x: x[1])
    return nombre if d < 45 else None


def extract(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        p = pdf.pages[0].dedupe_chars(tolerance=1)
        words = p.extract_words()
        titulo = " ".join(w["text"] for w in words if 40 < w["top"] < 80 and w["x0"] > 150 and w["x1"] < 560)
        # columnas: «Nivel I» … o «Semestre 1» …
        cols = []
        for i, w in enumerate(words):
            if w["text"] in ("Nivel", "Semestre") and i + 1 < len(words):
                n = words[i + 1]["text"]
                v = ROMANO.get(n) or (int(n) if n.isdigit() else None)
                if v and abs(words[i + 1]["top"] - w["top"]) < 3:
                    cols.append((v, (w["x0"] + words[i + 1]["x1"]) / 2))
        boxes = []
        for c in p.rects + p.curves:
            w_, h_ = c["x1"] - c["x0"], c["bottom"] - c["top"]
            if not c.get("fill") or not (60 <= w_ <= 120 and 24 <= h_ <= 40) or not area(c):
                continue
            if any(abs(b["x0"] - c["x0"]) < 2 and abs(b["top"] - c["top"]) < 2 for b in boxes):
                continue
            t = texto(p.chars, c, dup=0.4, limpia=False)   # letra pequeña: «ll» de «Taller» no es un duplicado
            m = re.search(r"HT\s*([\d.]+)\s*HP\s*([\d.]+)\s*CT\s*([\d.]+)?", t)
            nombre = re.sub(r"\s+", " ", re.split(r"\bHT\b", t)[0]).strip()
            nombre = re.sub(r"\b(I)\s+(I{1,2})\b", r"", nombre)   # «I I» -> «II»
            if not nombre:
                continue
            xc = (c["x0"] + c["x1"]) / 2
            nivel = min(cols, key=lambda k: abs(k[1] - xc))[0] if cols else None
            boxes.append({"x0": c["x0"], "top": c["top"], "x1": c["x1"], "bottom": c["bottom"], "nombre": nombre, "nivel": nivel,
                          "area_formacion": area(c), "ht": float(m.group(1)) if m else None, "hp": float(m.group(2)) if m else None,
                          "creditos": float(m.group(3)) if m and m.group(3) else None})
        # flechas: segmentos grises; extremo junto a una punta (triángulo de 3 pt) = destino
        heads = [c for c in p.curves + p.rects if c.get("fill") and color(c) == "#575756" and c["x1"] - c["x0"] < 6 and c["bottom"] - c["top"] < 6]
        segs = []
        for c in [s for s in p.curves + p.rects if not s.get("fill")] + list(p.lines):
            pts = [tuple(q) for q in (c.get("pts") or [(c["x0"], c["top"]), (c["x1"], c["bottom"])])]
            segs += [(a, b) for a, b in zip(pts, pts[1:]) if math.hypot(b[0] - a[0], b[1] - a[1]) > 0.3]
        key = lambda q: (round(q[0] / 2), round(q[1] / 2))
        adj, pos = {}, {}
        for a, b in segs:
            adj.setdefault(key(a), set()).add(key(b)); adj.setdefault(key(b), set()).add(key(a))
            pos.setdefault(key(a), a); pos.setdefault(key(b), b)
        near_head = lambda q: any(math.hypot((h["x0"] + h["x1"]) / 2 - q[0], (h["top"] + h["bottom"]) / 2 - q[1]) < 6 for h in heads)
        seen, pares = set(), set()
        for n0 in adj:
            if n0 in seen:
                continue
            comp, st = [], [n0]
            while st:
                n = st.pop()
                if n in seen:
                    continue
                seen.add(n); comp.append(n); st += adj[n] - seen
            src, dst = set(), set()
            for n in comp:
                if len(adj[n]) != 1:
                    continue
                q = pos[n]
                i = min(range(len(boxes)), key=lambda i: dist_to_box(q, boxes[i])) if boxes else None
                if i is None or dist_to_box(q, boxes[i]) > 8:
                    continue
                (dst if near_head(q) else src).add(i)
            for a in src:
                for d in dst:
                    if a != d and (boxes[a]["nivel"] or 0) < (boxes[d]["nivel"] or 99):
                        pares.add((a, d))
        return titulo, boxes, sorted(pares)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for f in sorted((ROOT / "UPIBI").glob("*.pdf")):
        titulo, boxes, pares = extract(f)
        data = {"fuente": f.name, "titulo": titulo, "materias": [{k: v for k, v in b.items() if k not in ("x0", "x1", "top", "bottom")} for b in boxes],
                "seriacion": [[a, d] for a, d in pares]}
        (OUT / (f.stem + ".json")).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        niv = {}
        for b in boxes:
            niv[b["nivel"]] = niv.get(b["nivel"], 0) + 1
        print(f.stem, "|", titulo[:60], "|", len(boxes), "materias", len(pares), "seriaciones", dict(sorted(niv.items())))


if __name__ == "__main__":
    main()
