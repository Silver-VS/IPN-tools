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
            nombre = re.sub(r"\b(I)\s+(I{1,2})\b", r"\1\2", nombre)   # «I I» -> «II»
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


# Empates revisados contra las tablas del SAES; no se aceptan coincidencias difusas.
ALIAS_SAES = {
    "Comunicacion y Sistemas de Informacion (Taller)": "COMUNICA. Y SIST. DE INFORMACION (TALLER)",
    "Biologia de Eucariontes": "BIOLOGIA DE EUCARIOTES",
    "Remediacion de Suelos Acuiferos": "REMEDIACION DE SUELOS Y ACUIFEROS",
    "Laboratorio de Bioingenieria": "LAB. DE BIOINGENIERIA",
    "Laboratorio de Bioseparaciones": "LAB. DE BIOSEPARACIONES",
    "Procesos de Transferencia de Calor": "PROC.DE TRANS.DE CALOR",
    "Manejo Integral de la Calidad del Aire": "MANEJO INT.DE LA CAL.DEL AIRE",
    "Formulacion y Evaluacion de Proyectos": "FOR.Y EVAL.DE PROYECTOS",
    "Ingenieria de Reactores y Biorreactores": "ING.DE REACTORES Y BIORREACTORES",
    "Dinamica de Bioprocesos del Medioambiente (Taller)": "DINAMICA DE BIOPROC.DEL MEDIO AMB. (TALLER)",
    "Laboratorio de Tecnicas Microbiologicas": "LAB. TEC. MICROBIOLOGICAS",
    "Laboratorio de Biorreactores": "LAB. DE BIORREACTORES",
    "Laboratorio de Biotecnologia Molecular": "LAB. BIOTECNOLOGIA MOLECULAR",
    "Tecnologias de Recombinacion Genetica": "TEC.DE RECOMBINACION GENETICA",
    "Biotecnologia de la Respuesta Inmune": "BIOTECNOLOGIA DE LA RESP.INMUNE",
    "Laboratorio de Bioconversiones": "LAB. DE BIOCONVERSIONES",
    "Tecnologias de Produccion de Biomoleculas": "TEC.DE LA PROD.DE BIOMOLECULAS",
    "Validacion de Procesos Farmaceuticos": "VALIDACION DE PROC.FARMACEUTICOS",
    "Quimica y Funcionalidad de los Alimentos": "QUIMICA Y FUNC.DE LOS ALIMENTOS",
    "Fisicoquimica de los Alimentos": "FISICOQUIMICA DE ALIMENTOS",
    "Topicos Selectos de Ingenieria Biomedica I": "TOP.SELEC.DE ING.BIOMEDICA I",
    "Topicos Selectos de Ingenieria Biomedica II": "TOP.SELEC.DE ING.BIOMEDICA II",
    "Procesamiento Digital de Biosenales e Imagenes": "PROC.DIG.DE BIOSENALES E IMAGENES",
    "Administracion de la Conservacion Hospitalaria (Taller)": "ADMON. DE LA CONSERV. HOSPITALARIA",
    "Administracion de Tecnologias en Salud": "ADMON.DE LA TEC.EN SALUD",
    "Balances de Materia y Energia": "BALANCE DE MATERIA Y ENERGIA",
    "Project Management": "PROYECT MANAGEMENT",
}


def nombre_empate(s):
    import unicodedata
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().upper()
    return re.sub(r"[^A-Z0-9]", "", re.sub(r"\s*\(TALLER\)$", "", s))


def empatar_materia(materia, filas, carrera, plan):
    n = nombre_empate(materia["nombre"])
    nombres = {n}
    nombres.update(nombre_empate(v) for k, v in ALIAS_SAES.items() if nombre_empate(k) == n)
    if n == nombre_empate("Procesos de Transferencia de Calor") and carrera == "B" and plan == "06":
        nombres.add(nombre_empate("PROCS. DE TRANSF.DE CALOR"))
    if n == nombre_empate("Tecnologias de Produccion de Biomoleculas") and plan == "24":
        nombres.add(nombre_empate("TECNOLOGIA Y PRODUCCION DE BIOMOLECULAS"))
    cand = [r for r in filas if nombre_empate(r[4]) in nombres]
    if len(cand) != 1:
        raise ValueError(f"{carrera}/{plan}: empate ambiguo o ausente: {materia['nombre']!r}; claves={[r[3] for r in cand]}")
    return cand[0]


def categoria_upibi(nombre, formacion):
    n = nombre_empate(nombre)
    if n == "ETICA":
        return "integral"
    reglas = [
        ("prof", r"ESTANCIAPROFESIONAL|PROYECTOTERMINAL|METODOLOGIADELAINVESTIGACION"),
        ("fm", r"CALCULO|ALGEBRA|ECUACIONES|ESTADISTICA|FISICADEL|FISICADELA|METODOSNUMERICOS|METODOSCUANTITATIVOS"),
        ("comp", r"PROGRAMACION"),
        ("elec", r"ELECTRONICA|CIRCUITOS|SISTEMASDIGITALES|MICROPROCESADORES|PROCESAMIENTODIGITALDEBIOSENALES"),
        ("ctrl", r"INSTRUMENTACION|CONTROL"),
        ("integral", r"COMUNICA|INGLES|RELACIONESLABORALES|ADMINISTRACION|ADMON|GESTION|PLANEACION|ECONOMIA|QUALITY|MANAGEMENT|FORMULACION|FORYEVAL|LEGISLACION"),
        # áreas comunes a las carreras de la UPIBI (antes todo quedaba en el área propia de la carrera)
        ("bio", r"BIOLOGIA|BIOQUIMICA|INMUNOLOGIA|(?<!INGENIERIA)GENETICA|ECOLOGIA|EUCARIOTES"),
        ("quim", r"QUIMICA|ANALITIC"),
        ("proc", r"BALANCE|FENOMENOS|TRANSFERENCIA|TERMODINAMICA|BIORREACTORES|BIOSEPARACION|OPERACIONESUNITARIAS|MECANICADEFLUIDOS|DISENODEPLANTAS|DINAMICAYCONTROLDEPROCESOS"),
    ]
    return next((c for c, pat in reglas if re.search(pat, n)), "propia")


def integrar():
    """Empata los seis PDF con el SAES y genera mapas por categorías reproducibles."""
    uni = OUT.parent
    filas = json.loads((uni / "mapa_curricular_saes.json").read_text(encoding="utf-8"))["rows"]
    cat = json.loads((ROOT / "data" / "categorias.json").read_text(encoding="utf-8"))
    nombres = {"A": "Ingeniería Ambiental", "B": "Ingeniería Biotecnológica", "F": "Ingeniería Farmacéutica",
               "L": "Ingeniería en Alimentos", "M": "Ingeniería Biomédica"}
    propias = {"A": "Ciencias ambientales y bioprocesos", "B": "Biotecnología y bioprocesos", "F": "Ciencias farmacéuticas",
               "L": "Ciencia e ingeniería de alimentos", "M": "Ciencias e ingeniería biomédica"}
    archivos = {"ambiental-2006": ("A", "06"), "biotecnologia-2006": ("B", "06"), "biotecnologia-2024": ("B", "24"),
                "farmaceutica-2006": ("F", "06"), "alimentos-2006": ("L", "06"), "biomedica-2006": ("M", "06")}
    doc = ["# Integración de UPIBI", "", "## 1. Fuentes y alcance", "",
           "Tablas académicas del SAES y seis mapas oficiales PDF. Sin datos personales del alumnado. Captura inicial del 2 de octubre de 2026 de planes 2006 y 2024; los planes 1999 quedan fuera de esta integración. Oferta actual: 1,027 filas del SAES, fusionadas en 664 clases. El próximo periodo no tiene filas publicadas en la captura.",
           "Clasificación por categorías propuesta, pendiente de revisión por las academias. Los planes 2006 son por niveles; Biotecnológica 2024 es semestral.", "",
           "## 2. Empates y diferencias", "", "| Carrera y plan | Materias PDF | Espacios optativos | Diferencias PDF / SAES |", "|---|---:|---:|---|"]
    opta = {"lineas": {}}
    for archivo, (c, p) in archivos.items():
        ident = "B_06" if c == "B" and p == "06" else c
        m = json.loads((OUT / f"{archivo}.json").read_text(encoding="utf-8"))
        rr = [r for r in filas if r[0] == c and r[1] == p]
        areas = {k: {"nombre": propias[c] if k == "propia" else cat["categorias"][k]["nombre"], "claves": [], "espacios": []}
                 for k in cat["orden"]}
        boxes, diferencias, usados = [], [], set()
        for i, b in enumerate(m["materias"]):
            bx = {"nombre": b["nombre"], "sem": b["nivel"], "x0": 40, "x1": 168,
                  "top": b["nivel"] * 100 + i % 8 * 8, "bottom": b["nivel"] * 100 + i % 8 * 8 + 44}
            if re.match(r"^Optativa\b", b["nombre"], re.I):
                bx.update(slot=b["nombre"], text=b["nombre"])
                areas["esp"]["espacios"].append([b["nombre"], b["nivel"]])
            else:
                r = empatar_materia(b, rr, c, p)
                if r[3] in usados:
                    raise ValueError(f"{c}/{p}: clave duplicada {r[3]}")
                usados.add(r[3]); bx["clave"] = r[3]
                for campo, original, real in (("nivel", b["nivel"], int(r[2])), ("créditos", b["creditos"], float(r[6])),
                                               ("HT", b["ht"], float(r[7])), ("HP", b["hp"], float(r[8]))):
                    if original != real:
                        diferencias.append(f"{r[3]} {campo}: PDF {original}, SAES {real}")
                # Conserva el nivel del PDF en la trayectoria; créditos y horas proceden del SAES.
                areas[categoria_upibi(b["nombre"], b["area_formacion"])]["claves"].append(r[3])
            boxes.append(bx)
        extra = [r for r in rr if r[3] not in usados and not r[5].startswith("OPT")]
        for r in extra:
            areas[categoria_upibi(r[4], "")]["claves"].append(r[3])
            boxes.append({"nombre": r[4], "sem": int(r[2]), "clave": r[3], "x0": 40, "x1": 168,
                          "top": int(r[2]) * 100, "bottom": int(r[2]) * 100 + 44})
        opc = [r for r in rr if r[5].startswith("OPT")]
        if opc:
            opta["lineas"][ident] = [{"area": "Optativas", "linea": "Opciones del SAES", "categoria": "Especialización", "claves": [r[3] for r in opc]}]
        ser = []
        for a, d in m["seriacion"]:
            ka = boxes[a].get("clave") or "@" + boxes[a]["slot"]
            kd = boxes[d].get("clave") or "@" + boxes[d]["slot"]
            ser.append([ka, kd])
        t = {"fuente": m["fuente"], "plan": p, "modelo": "semestral" if p == "24" else "niveles",
             "rows": [[n, n * 100 + 22] for n in range(1, 9)], "boxes": boxes,
             "edges": [{"s": a, "d": d, "pts": []} for a, d in m["seriacion"]]}
        nota = "Clasificación por áreas propuesta, pendiente de revisión. Seriación extraída del PDF oficial; consulta el SAES para confirmar requisitos."
        if p == "24":
            nota += " El PDF suma 354 créditos sin Electiva; con sus 18 créditos son 372. El SAES asigna 1.5 a Estancia Profesional I y el PDF 3; el total con las cuatro optativas es 370.5 según el SAES. Diferencia pendiente de aclaración."
        ea = {"carrera": c, "plan": p, "estado": "Clasificación propuesta, pendiente de revisión por las academias.",
              "fuente_seriacion": m["fuente"], "nota": nota,
              "areas": [a for a in areas.values() if a["claves"] or a["espacios"]], "seriacion": ser}
        for nombre, obj in ((f"trayectoria_{ident}.json", t), (f"areas_{ident}.json", ea)):
            (uni / nombre).write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        doc.append(f"| {nombres[c]} {p} | {len(m['materias'])} | {len(areas['esp']['espacios'])} | {'; '.join(diferencias) or 'Ninguna en las materias empatadas'} |")
        print(f"UPIBI {c}/{p}: {len(usados)} empates, {len(opc)} opciones, {len(extra)} obligatorias adicionales, {len(ser)} seriaciones; diferencias={diferencias}")
    (uni / "optativas.json").write_text(json.dumps(opta, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    doc += ["", "## 3. Créditos de Biotecnológica 2024", "",
            "La extracción de 354 créditos omite Electiva (18 créditos, B612): 354 + 18 = 372, igual al encabezado del PDF.",
            "Persiste una diferencia independiente: Estancia Profesional I tiene 3 créditos en el PDF y 1.5 en el SAES. El mapa usa los créditos del SAES y señala la discrepancia; no fuerza el total a 372.",
            "", "## 4. Validación local", "", "Ejecutar `python tools/extract_mapa_upibi.py --integrar` y `UNIDAD=upibi python tools/build_horarios.py`.",
            "Biotecnológica se ofrece por separado para 2024 y 2006. Las opciones optativas se consultan en el panel de optativas; las cajas del mapa representan los espacios del plan.",
            "", "## 5. Pendientes de revisión", "", "Confirmar la diferencia de Estancia Profesional I con Gestión Escolar. Validar categorías y flechas extraídas con las academias.",
            "No se infieren reglas de seriación entre optativas, equivalencias entre planes ni restricciones de inscripción ausentes en las fuentes."]
    (ROOT / "docs" / "UPIBI.md").write_text("\n".join(doc) + "\n", encoding="utf-8")


if __name__ == "__main__":
    integrar() if "--integrar" in sys.argv else main()
