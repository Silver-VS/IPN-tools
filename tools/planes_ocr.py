"""Extrae planes de estudio de mapas curriculares escaneados del IPN (solo imagen) con OCR local.

Cadena: PDF -> PNG (pypdfium2) -> OCR (glm-ocr en Ollama local) -> analizador determinista ->
validación de sumas -> comparación con los datos del repositorio. Todo corre en local; no se descarga nada.
Los PDF y las salidas viven en UPIITA_DEV/recursos/planes-ipn/ (fuera del repositorio; no se suben).

Uso:  python tools/planes_ocr.py [pdf ...]      (por omisión, todos los de recursos/planes-ipn/pdf/)
      python tools/planes_ocr.py --solo-ocr     (sin análisis)
      python tools/planes_ocr.py --sin-llm      (sin respaldo con qwen3.5:9b)
Salida: recursos/planes-ipn/json/<pdf>.json y caché img/<pdf>-p<N>.png / .ocr.txt
Imprime una línea por paso: [n/M] <pdf> pág <p> · ocr|análisis|validación
"""
import json, pathlib, re, sys, time, unicodedata, urllib.request, base64, io

OLLAMA = "http://127.0.0.1:11434"
LADO = 2400                       # px del lado largo
TOL = 0.05
RAIZ = next(p for p in pathlib.Path(__file__).resolve().parents if (p / "recursos").is_dir())
BASE = RAIZ / "recursos" / "planes-ipn"
REPO = pathlib.Path(__file__).resolve().parents[1]
NUM = r"\d+(?:[.,]\d+)?"


# ---------------------------------------------------------------- imagen y OCR
def renderizar(pdf, pagina, png):
    if png.exists():
        return
    import pypdfium2 as pdfium
    doc = pdfium.PdfDocument(str(pdf))
    pg = doc[pagina - 1]
    w, h = pg.get_size()
    pg.render(scale=LADO / max(w, h)).to_pil().convert("RGB").save(png)


def _llamar(modelo, prompt, imagen=None, opciones=None, formato=None, timeout=900):
    msg = {"role": "user", "content": prompt}
    if imagen:
        msg["images"] = [base64.b64encode(pathlib.Path(imagen).read_bytes()).decode()]
    cuerpo = {"model": modelo, "messages": [msg], "stream": False, "options": opciones or {}, "think": False}
    if formato:
        cuerpo["format"] = formato
    req = urllib.request.Request(OLLAMA + "/api/chat", json.dumps(cuerpo).encode(),
                                 {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())["message"]["content"]


def recortar_repeticion(texto):
    """Quita el bucle final: un ciclo de 1 a 6 líneas repetido 3 o más veces seguidas se deja una sola vez."""
    lin = texto.split("\n")
    i = 0
    while i < len(lin):
        for k in range(1, 7):
            bloque = lin[i:i + k]
            if len(bloque) == k and any(b.strip() for b in bloque) and \
                    all(lin[i + j * k:i + (j + 1) * k] == bloque for j in range(3)) and \
                    not all(re.fullmatch(r"[\d.,\s]*", b) for b in bloque):
                return "\n".join(lin[:i + k]).rstrip()
        i += 1
    return texto.rstrip()


def ocr(png, prompt):
    """OCR en flujo: corta apenas aparece un bucle de repetición (el servidor, con repeat_penalty, aborta con 500
    y se pierde el texto; sin él, el modelo repite encabezados hasta agotar num_predict)."""
    cuerpo = {"model": "glm-ocr", "stream": True, "think": False,
              "messages": [{"role": "user", "content": prompt,
                            "images": [base64.b64encode(pathlib.Path(png).read_bytes()).decode()]}],
              "options": {"num_ctx": 16384, "temperature": 0, "num_predict": 4000, "repeat_penalty": 1.0}}
    req = urllib.request.Request(OLLAMA + "/api/chat", json.dumps(cuerpo).encode(), {"Content-Type": "application/json"})
    t, n = "", 0
    with urllib.request.urlopen(req, timeout=900) as r:
        for linea in r:
            d = json.loads(linea)
            if "error" in d:
                break
            t += d.get("message", {}).get("content", "")
            n += 1
            if n % 40 == 0 and len(recortar_repeticion(t)) < len(t.rstrip()):
                break
            if d.get("done"):
                break
    return recortar_repeticion(t)


def n_filas_numericas(texto):
    return len(re.findall(rf"^\s*{NUM}(?:\s+{NUM}){{3,}}\s*$", texto, re.M))


def ocr_pagina(png):
    """Caché en <png>.ocr.txt. Prueba 'Table Recognition:' y, si no sale tabla, 'Text Recognition:'."""
    cache = png.with_suffix(".ocr.txt")
    meta = png.with_suffix(".ocr.json")
    if cache.exists():
        m = json.loads(meta.read_text(encoding="utf-8")) if meta.exists() else {}
        return cache.read_text(encoding="utf-8"), m
    t0 = time.time()
    t = ocr(png, "Table Recognition:")
    prompt = "Table Recognition:"
    if n_filas_numericas(t) < 3:
        t2 = ocr(png, "Text Recognition:")
        if len(t2) > len(t) or n_filas_numericas(t2) > n_filas_numericas(t):
            t, prompt = t2, "Text Recognition:"
    cache.write_text(t, encoding="utf-8")
    m = {"prompt": prompt, "segundos": round(time.time() - t0, 1), "caracteres": len(t)}
    meta.write_text(json.dumps(m), encoding="utf-8")
    return t, m


# ---------------------------------------------------------------- analizador
def num(s):
    return float(s.replace(",", "."))


def norm(s):
    s = unicodedata.normalize("NFD", s.upper())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return " ".join(re.sub(r"[^A-Z0-9 ]", " ", s).split())


ROMANOS = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10}
ORDINAL = {"PRIMER": 1, "SEGUNDO": 2, "TERCER": 3, "CUARTO": 4, "QUINTO": 5, "SEXTO": 6, "SEPTIMO": 7, "OCTAVO": 8,
           "NOVENO": 9, "DECIMO": 10}
RE_NIVEL = re.compile(r"^\W*(?:NIVEL|SEMESTRE)\s+([IVX]+|\d+)\W*$", re.I)
RE_NIVEL2 = re.compile(r"^\W*(PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO|OCTAVO|NOVENO|D[EÉ]CIMO)\s+"
                       r"(?:NIVEL|SEMESTRE)\W*$", re.I)
CAMPOS = ["teoria", "practica", "horas", "creditos_tepic", "creditos_satca"]
RE_NUMS = re.compile(rf"^(?:{NUM}\s*)+$")
RE_SUB = re.compile(rf"^\W*(SUBTOTAL|TOTAL(?:\s+DE\s+(?:CR[EÉ]DITOS|HORAS))?|TOTALES?)\b[\s:]*((?:{NUM}\s*)+)$", re.I)
_TOK = r"(?:TE[OÓ]R[IÍ]A|PR[AÁ]CTICA|T/H|CR[EÉ]DITOS(?:\s+(?:TEPIC|SATCA))?|DISTRIBUCI[OÓ]N DE HORAS)"
RE_ENCAB = re.compile(rf"^(?:{_TOK}\s*)+$", re.I)                       # línea solo de encabezados de columna
RE_TITULO_ENCAB = re.compile(rf"^(?P<t>.+?)\s+TE[OÓ]R[IÍ]A\s+PR[AÁ]CTICA.*$", re.I)   # "BIG DATA TEORIA PRÁCTICA ..."
RE_PIE = re.compile(r"^(T/H\s*=|VIGENCIA|INSTITUTO POLIT|DIRECCI[OÓ]N DE EDUCACI|\d+\s+de\s+\d+$|TOTAL DE HORAS\b|"
                    r"CR[EÉ]DITOS\b|NOMBRE\b|UNIDAD(?:ES)? DE APRENDIZAJE)", re.I)
RE_ETIQ = re.compile(r"^OPTATIVA\s+[AB]\d\s+o\s+[AB]\d$", re.I)
RE_GRUPO = re.compile(r"^OPTATIVAS\b.*$", re.I)


def nivel_de(l):
    m = RE_NIVEL.match(l)
    if m:
        v = m.group(1).upper()
        return ROMANOS.get(v) or (int(v) if v.isdigit() else None)
    m = RE_NIVEL2.match(l)
    return ORDINAL.get(norm(m.group(1))) if m else None


def n_columnas(texto):
    """Columnas numéricas: T, P, T/H + una por cada tipo de crédito del encabezado (TEPIC, SATCA)."""
    tipos = {m.upper() for m in re.findall(r"CR[EÉ]DITOS\s+(TEPIC|SATCA)", texto, re.I)}
    if tipos:
        return 3 + len(tipos)
    filas = [len(l.split()) for l in texto.split("\n") if RE_NUMS.match(l.strip()) and len(l.split()) >= 4]
    return max(set(filas), key=filas.count) if filas else 5


def valores(v):
    d = {c: x for c, x in zip(CAMPOS, v)}
    return d if len(v) >= 4 else {"valores": v}


def materia_de(nombre, v, etiqueta=None):
    r = {"nombre": nombre.strip(), "teoria": None, "practica": None, "horas": None,
         "creditos_tepic": None, "creditos_satca": None}
    r.update(zip(CAMPOS, v))
    if etiqueta:
        r["etiqueta"] = etiqueta
    return r


def analizar(texto):
    """Devuelve (niveles, optativas, total, resto). Tolera nombre y números en la misma línea o en líneas separadas,
    números partidos en varias líneas, nombres de varias líneas, 'NIVEL I'/'SEMESTRE 1', encabezados repetidos y
    bloques de optativas (por nivel o por trayectoria)."""
    nc = n_columnas(texto)
    niveles, optativas, resto = [], [], []
    actual = grupo = None
    total = None
    pend, buf, etiqueta = [], [], None

    def emitir():
        nonlocal pend, buf, etiqueta
        while pend and len(buf) >= nc:
            m = materia_de(" ".join(pend), [num(x) for x in buf[:nc]], etiqueta)
            if grupo is not None:
                grupo["materias"].append(m)
            elif actual is not None:
                actual["materias"].append(m)
            else:
                resto.append(m["nombre"])
            pend, buf, etiqueta = [], buf[nc:], None

    for l in (x.strip() for x in texto.replace("|", " ").split("\n")):
        if not l:
            continue
        nv = nivel_de(l)
        if nv is not None:
            actual = {"nivel": nv, "materias": [], "subtotal": None}
            niveles.append(actual)
            grupo, pend, buf, etiqueta = None, [], [], None
            continue
        if RE_GRUPO.match(l) and not RE_NUMS.match(l):
            grupo = {"grupo": l, "materias": []}
            optativas.append(grupo)
            pend, buf, etiqueta = [], [], None
            continue
        ms = RE_SUB.match(l)
        if ms:
            v = [num(x) for x in ms.group(2).split()]
            if ms.group(1).upper().startswith("SUBTOTAL"):
                if actual is not None:
                    actual["subtotal"] = valores(v)
            else:
                total = valores(v)
            pend, buf = [], []
            continue
        mt = RE_TITULO_ENCAB.match(l)
        if mt or RE_ENCAB.match(l):
            # título de un bloque de optativas: el texto antes de las columnas o la línea anterior (solo fuera de un nivel)
            titulo = mt.group("t").strip() if mt else (pend[-1] if pend and not buf else "")
            if titulo and (mt or actual is None or grupo is not None) and re.search(r"[A-ZÁÉÍÓÚ]{3}", titulo):
                grupo = {"grupo": titulo, "materias": []}
                optativas.append(grupo)
                pend, buf, etiqueta = [], [], None
            continue
        if RE_PIE.match(l) or re.fullmatch(r"[\W_]*", l):
            continue
        if RE_ETIQ.match(l):
            etiqueta = l
            continue
        if RE_NUMS.match(l):
            buf.extend(l.split())
            emitir()
            continue
        m2 = re.match(rf"^(?P<nom>[^\d\W].*?)\s+(?P<n>(?:{NUM}\s*){{3,}})$", l)
        if m2:
            pend.append(m2.group("nom"))
            buf.extend(m2.group("n").split())
            emitir()
            continue
        if buf and pend:     # fila incompleta: se descarta y se avisa
            resto.append(f"fila incompleta: {' '.join(pend)} {' '.join(buf)}")
            pend, buf = [], []
        pend.append(l)
    resto.extend(pend)
    optativas = [g for g in optativas if g["materias"]]
    return niveles, optativas, total, resto


def encabezado(texto):
    programa = plan = None
    unidades = []
    for l in texto.split("\n")[:12]:
        u = l.upper()
        m = re.search(r"PLAN DE ESTUDIOS\s*(\d{4})\s*(?:DE|DEL)?\s*(.*)", u)
        if m:
            plan, programa = m.group(1), m.group(2).strip().title()
        unidades += [x for x in re.findall(r"\(([A-Z]{3,8})\)", u.replace("UPIIТА", "UPIITA")) if x not in unidades]
    return programa, plan, unidades


# ---------------------------------------------------------------- validación
def _suma(materias, campo):
    return round(sum(m[campo] or 0 for m in materias), 2)


def validar(niveles, total, optativas=()):
    informe = {"ok": True, "niveles": [], "total": None, "sospechosas": []}

    def sospecha_horas(ms, donde):
        for m in ms:
            if m["horas"] is not None and m["teoria"] is not None and abs(m["teoria"] + m["practica"] - m["horas"]) > TOL:
                informe["sospechosas"].append({"donde": donde, "materia": m["nombre"], "motivo": "T+P != T/H"})

    for n in niveles:
        sub = n["subtotal"]
        item = {"nivel": n["nivel"], "materias": len(n["materias"]), "ok": None, "diferencias": {}}
        sospecha_horas(n["materias"], f"nivel {n['nivel']}")
        if sub and "teoria" in sub:
            item["ok"] = True
            for c in CAMPOS:
                s = _suma(n["materias"], c)
                if sub.get(c) is not None and abs(s - sub[c]) > TOL:
                    item["ok"] = False
                    item["diferencias"][c] = {"suma": s, "subtotal": sub[c], "dif": round(sub[c] - s, 2)}
                    for m in n["materias"]:   # materia cuyo valor explica la diferencia (sobra o falta una)
                        if m[c] is not None and abs(m[c] - abs(sub[c] - s)) < TOL:
                            informe["sospechosas"].append({"donde": f"nivel {n['nivel']}", "materia": m["nombre"],
                                                           "motivo": f"{c} {m[c]} explica la diferencia {round(sub[c] - s, 2)}"})
        elif sub is None:
            item["ok"] = False
            item["diferencias"]["subtotal"] = "no se encontró SUBTOTAL"
        informe["niveles"].append(item)
        if item["ok"] is False:
            informe["ok"] = False
    for g in optativas:
        sospecha_horas(g["materias"], g["grupo"])
    if total is None:
        informe["total"] = {"ok": None, "nota": "no se encontró TOTAL"}
    elif "teoria" in total:
        t = {"ok": True, "diferencias": {}}
        for c in CAMPOS:
            s = round(sum(_suma(n["materias"], c) for n in niveles), 2)
            if total.get(c) is not None and abs(s - total[c]) > TOL:
                t["ok"] = False
                t["diferencias"][c] = {"suma": s, "total": total[c]}
        informe["total"] = t
    else:   # el OCR perdió columnas del TOTAL: cada valor debe coincidir con alguna suma
        sumas = {c: round(sum(_suma(n["materias"], c) for n in niveles), 2) for c in CAMPOS}
        enc = {str(v): next((c for c, s in sumas.items() if abs(s - v) <= TOL), None) for v in total["valores"]}
        informe["total"] = {"ok": all(enc.values()), "parcial": True, "coincide_con": enc, "sumas": sumas}
    if informe["total"]["ok"] is False:
        informe["ok"] = False
    return informe


# ---------------------------------------------------------------- respaldo con LLM
def respaldo_llm(texto):
    prompt = ("Del siguiente texto de un mapa curricular (OCR) extrae los niveles/semestres y sus materias. "
              "Cada materia: nombre, teoria, practica, horas, creditos_tepic, creditos_satca (null si no aparece). "
              "Responde solo JSON: {\"niveles\":[{\"nivel\":int,\"materias\":[...],\"subtotal\":obj|null}],"
              "\"total\":obj|null}.\n\n" + texto[:12000])
    t = _llamar("qwen3.5:9b", prompt, opciones={"num_ctx": 8192, "temperature": 0}, formato="json")
    d = json.loads(t)
    return d.get("niveles") or [], d.get("total")


# ---------------------------------------------------------------- comparación con el repositorio
def conocidos(nombre_pdf):
    """Filas del repositorio (SAES) del plan que corresponde al PDF: {(carrera, plan): [filas]}."""
    if "-ib-" in nombre_pdf:
        f, claves = REPO / "data" / "mapa_curricular_saes.json", {("B", "09")}
    elif "-im-" in nombre_pdf:
        f, claves = REPO / "data" / "mapa_curricular_saes.json", {("M", "09")}
    elif "-isc-" in nombre_pdf:
        f, claves = REPO / "data" / "unidades" / "escom" / "mapa_curricular_saes.json", {("C", "20")}
    else:
        return {}
    if not f.exists():
        return {}
    d = json.loads(f.read_text(encoding="utf-8"))
    planes = {}
    for r in d["rows"]:
        x = dict(zip(d["cols"], r))
        if (x["carrera"].upper(), x["plan"]) in claves:
            planes.setdefault((x["carrera"].upper(), x["plan"]), []).append(x)
    return planes


def llave(s):
    """Clave tolerante: sin acentos, mayúsculas y sin vocales (el SAES de ESCOM trae caracteres dañados en lugar de
    las vocales acentuadas)."""
    return re.sub(r"[AEIOU ]", "", norm(s.replace("�", "")))


def comparar(nombre_pdf, niveles, optativas=()):
    mias = {}
    for n in niveles:
        for m in n["materias"]:
            mias[llave(m["nombre"])] = (n["nivel"], m)
    for g in optativas:
        for m in g["materias"]:
            mias.setdefault(llave(m["nombre"]), (None, m))
    res = []
    for (car, plan), filas in conocidos(nombre_pdf).items():
        ref = {llave(x["nombre"]): x for x in filas}
        inter = set(ref) & set(mias)
        res.append({
            "carrera": car, "plan": plan, "materias_repo": len(ref), "materias_pdf": len(mias), "coinciden": len(inter),
            "faltan_en_pdf": sorted(norm(ref[k]["nombre"].replace("�", "?")) for k in set(ref) - set(mias)),
            "sobran_en_pdf": sorted(norm(mias[k][1]["nombre"]) for k in set(mias) - set(ref)),
            "creditos_distintos": [{"materia": norm(mias[k][1]["nombre"]), "pdf_tepic": mias[k][1]["creditos_tepic"],
                                    "repo": float(ref[k]["creditos"])} for k in sorted(inter)
                                   if mias[k][1]["creditos_tepic"] is not None
                                   and abs(mias[k][1]["creditos_tepic"] - float(ref[k]["creditos"])) > TOL],
            "nivel_distinto": [{"materia": norm(mias[k][1]["nombre"]), "pdf": mias[k][0], "repo": int(ref[k]["nivel"])}
                               for k in sorted(inter) if mias[k][0] is not None and mias[k][0] != int(ref[k]["nivel"])]})
    return res


# ---------------------------------------------------------------- principal
def procesar(pdf, k, total_pasos, opciones):
    import pypdfium2 as pdfium
    nombre = pdf.stem
    npag = len(pdfium.PdfDocument(str(pdf)))
    (BASE / "img").mkdir(parents=True, exist_ok=True)
    textos, tiempos = {}, {}
    for p in range(1, npag + 1):
        png = BASE / "img" / f"{nombre}-p{p}.png"
        t0 = time.time()
        renderizar(pdf, p, png)
        print(f"[{k[0]}/{total_pasos}] {nombre} pág {p} · ocr", flush=True)
        k[0] += 1
        textos[p], tiempos[p] = ocr_pagina(png)
    if opciones["solo_ocr"]:
        return None
    niveles, optativas, total, no_tabla, marcas = [], [], None, [], []
    for p in range(1, npag + 1):
        print(f"[{k[0]}/{total_pasos}] {nombre} pág {p} · análisis", flush=True)
        k[0] += 1
        nv, op, tot, resto = analizar(textos[p])
        if not nv and not op and not opciones["sin_llm"] and n_filas_numericas(textos[p]) >= 3:
            try:   # respaldo: el analizador no encontró estructura
                nv, tot = respaldo_llm(textos[p])
                marcas.append(f"pág {p}: respaldo qwen3.5:9b (verificar a mano)")
            except Exception as e:
                marcas.append(f"pág {p}: respaldo falló ({e})")
        if nv or op:
            niveles.extend(nv)
            optativas.extend(op)
            total = tot or total
            if resto:
                marcas.append(f"pág {p}: líneas sin clasificar: {resto[:6]}")
        else:
            no_tabla.append({"pagina": p, "texto": textos[p]})
    # une niveles repetidos (un nivel partido en dos páginas) y grupos de optativas
    fus = {}
    for n in niveles:
        if n["nivel"] in fus:
            fus[n["nivel"]]["materias"].extend(n["materias"])
            fus[n["nivel"]]["subtotal"] = n["subtotal"] or fus[n["nivel"]]["subtotal"]
        else:
            fus[n["nivel"]] = n
    niveles = [fus[i] for i in sorted(fus)]
    gfus = {}
    for g in optativas:
        if g["grupo"] in gfus:
            gfus[g["grupo"]]["materias"].extend(g["materias"])
        else:
            gfus[g["grupo"]] = g
    optativas = list(gfus.values())
    print(f"[{k[0]}/{total_pasos}] {nombre} · validación", flush=True)
    k[0] += 1
    val = validar(niveles, total, optativas)
    val["marcas"] = marcas
    programa = plan = None
    unidades = []
    for p in sorted(textos):
        pr, pl, un = encabezado(textos[p])
        programa, plan = programa or pr, plan or pl
        unidades += [u for u in un if u not in unidades]
    indice = json.loads((BASE / "indice.json").read_text(encoding="utf-8")) if (BASE / "indice.json").exists() else {}
    fuente = next((p["url"] for pr in indice.get("programas", []) for p in pr["pdfs"]
                   if p["url"].lower().endswith(nombre.lower() + ".pdf")), None)
    salida = {"fuente": fuente or str(pdf.name), "programa": programa, "unidades": unidades, "plan": plan,
              "niveles": niveles, "optativas": optativas, "total": total, "validacion": val,
              "comparacion_repo": comparar(nombre, niveles, optativas),
              "paginas_no_tabla": no_tabla, "tiempos": tiempos}
    (BASE / "json").mkdir(exist_ok=True)
    (BASE / "json" / f"{nombre}.json").write_text(json.dumps(salida, ensure_ascii=False, indent=1), encoding="utf-8")
    return salida


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    opciones = {"solo_ocr": "--solo-ocr" in sys.argv, "sin_llm": "--sin-llm" in sys.argv}
    pdfs = [pathlib.Path(a) for a in args] or sorted((BASE / "pdf").glob("*.pdf"))
    import pypdfium2 as pdfium
    pasos = sum(len(pdfium.PdfDocument(str(p))) * (1 if opciones["solo_ocr"] else 2) + (0 if opciones["solo_ocr"] else 1)
                for p in pdfs)
    k = [1]
    for pdf in pdfs:
        s = procesar(pdf, k, pasos, opciones)
        if s:
            v = s["validacion"]
            print(f"  {pdf.stem}: niveles={len(s['niveles'])} materias={sum(len(n['materias']) for n in s['niveles'])} "
                  f"validación={'OK' if v['ok'] else 'CON DISCREPANCIAS'}", flush=True)


if __name__ == "__main__":
    main()
