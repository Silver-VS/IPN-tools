"""Extrae planes de estudio de mapas curriculares escaneados del IPN (solo imagen) con OCR local.

Cadena: PDF -> PNG (pypdfium2) -> OCR (glm-ocr en Ollama local) -> analizador determinista ->
validación de sumas -> comparación con los datos del repositorio. Todo corre en local; no se descarga nada.
Los PDF y las salidas viven en UPIITA_DEV/recursos/planes-ipn/ (fuera del repositorio; no se suben).

Uso:  python tools/planes_ocr.py [pdf ...]      (por omisión, todos los de recursos/planes-ipn/pdf/)
      python tools/planes_ocr.py --solo-ocr     (sin análisis)
      python tools/planes_ocr.py --sin-llm      (sin respaldo con qwen3.5:9b)
      python tools/planes_ocr.py --solo-analisis (solo .ocr.txt en caché; sin OCR, render ni Ollama)
      python tools/planes_ocr.py --relectura [pdf ...] (PDF en 'discrepancia': franjas a 3600 px, OCR y mejor resultado)
Salida: recursos/planes-ipn/json/<pdf>.json y caché img/<pdf>-p<N>.png / .ocr.txt
Imprime una línea por paso: [n/M] <pdf> pág <p> · ocr|análisis|validación
"""
import json, pathlib, re, sys, time, unicodedata, urllib.request, base64, io, html, itertools
from collections import Counter

OLLAMA = "http://127.0.0.1:11434"
LADO = 2400                       # px del lado largo
TOL = 0.05                        # tolerancia de sumas (TEPIC, horas)
TOL_SATCA = 0.25                  # los PDF redondean los créditos SATCA por nivel (p. ej. it-upiita difiere 0.2)
LADO_HR = 3600                    # relectura: lado largo de la página renderizada
TRASLAPE = 0.12                   # relectura: fracción de traslape entre franjas
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


ROMANOS = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10, 'XI': 11, 'XII': 12}
ORDINAL = {"PRIMER": 1, "SEGUNDO": 2, "TERCER": 3, "CUARTO": 4, "QUINTO": 5, "SEXTO": 6, "SEPTIMO": 7, "OCTAVO": 8,
           "NOVENO": 9, "DECIMO": 10}
RE_NIVEL = re.compile(r"^\W*(?:NIVEL|SEMESTRE|PER[IÍ]ODO)\s+([IVX]+|\d+)\W*$", re.I)
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
    filas = [len(l.split()) for l in texto.split('\n') if RE_NUMS.fullmatch(l.strip()) and len(l.split()) >= 4]
    comun = Counter(filas).most_common(1)[0][0] if filas else None
    if tipos:
        return max(3 + len(tipos), comun or 0)
    if re.search(r'C\.?\s*SATCA', texto, re.I):
        return 5
    if re.search(r'\bT\s+P\s+T/(?:H|II)\s+C\b', texto, re.I):
        return 4
    filas = [len(l.split()) for l in texto.split("\n") if RE_NUMS.match(l.strip()) and len(l.split()) >= 4]
    return max(set(filas), key=filas.count) if filas else 5


def valores(v):
    d = {c: x for c, x in zip(CAMPOS, v)}
    return d if len(v) >= 4 else {"valores": v}


def preparar_texto(texto):
    """Conserva las fronteras de celdas HTML y reúne referencias partidas por el OCR."""
    if re.search(r"<table\b", texto, re.I):
        def fila(m):
            celdas = [html.unescape(re.sub(r'<[^>]+>', '', c)).strip() for c in
                      re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', m[0], re.I | re.S)]
            celdas = [c for c in celdas if c]
            if celdas and nivel_de(celdas[0]) is not None:
                return '\n' + celdas[0] + '\n' + ' '.join(celdas[1:]) + '\n'
            return '\n' + ' '.join(celdas) + '\n'
        texto = re.sub(r'<tr\b[^>]*>.*?</tr>', fila, texto, flags=re.I | re.S)
        texto = html.unescape(re.sub(r"<[^>]+>", "", texto))
    # Los guiones en las columnas de horas indican ausencia de carga.
    texto = re.sub(rf"(?<=[\d ])\s+[-–—]{{1,3}}\s+(?={NUM})", " 0.0 ", texto)
    texto = re.sub(r'^\s*T\s+O\s+T\s+A\s+L\b', 'TOTAL', texto, flags=re.I | re.M)
    lineas = [l.strip().replace('|', ' ') for l in texto.splitlines() if l.strip()]
    salida = []
    i = 0
    while i < len(lineas):
        l = lineas[i]
        if re.fullmatch(r"SUB\s*TOTAL|TOTAL(?:ES)?", l, re.I):
            v = []
            j = i + 1
            while j < len(lineas) and RE_NUMS.fullmatch(lineas[j]):
                v.extend(lineas[j].split())
                j += 1
            if v:
                l += ' ' + ' '.join(v)
                i = j - 1
        salida.append(l)
        i += 1
    return '\n'.join(salida)


def columnas_de(texto):
    """No atribuye teoría/práctica a una tabla que solamente declara créditos."""
    cab = norm(texto)
    if re.search(r'\bAA\b', cab) and 'TEORIA' in cab:
        return ['teoria', 'practica', 'aprendizaje_autonomo', 'horas', 'creditos_tepic']
    if 'TEORIA' not in cab and not re.search(r'\bT P\b', cab) and 'CREDITOS' in cab and 'T H' not in cab:
        return [c for c, etiqueta in [('creditos_tepic', 'TEPIC'), ('creditos_satca', 'SATCA')]
                if etiqueta in cab] or ['creditos_tepic']
    nc = n_columnas(texto)
    if nc == 4 and 'SATCA' in cab and 'TEPIC' not in cab:
        return CAMPOS[:3] + ['creditos_satca']
    if re.search(r'\bT P T H\b', cab) and not re.search(r'\bT P T H C\b', cab) and 'CREDITOS' not in cab:
        return CAMPOS[:3]
    return CAMPOS[:nc]


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
    texto = preparar_texto(texto)
    campos = columnas_de(texto)
    nc = len(campos)
    niveles, optativas, resto = [], [], []
    actual = grupo = None
    total = None
    pend, buf, etiqueta = [], [], None
    referencia_general = False
    catalogo = False
    trayectoria = None
    totales = len(re.findall(r'^TOTAL(?:\s|:|$)', texto, re.I | re.M))

    def emitir():
        nonlocal pend, buf, etiqueta
        if len(pend) == 1 and len(buf) > nc:
            nombres = re.split(r'\s{2,}|\s*;\s*', pend[0])
            if len(nombres) * nc == len(buf):
                pend = nombres
        while pend and len(buf) >= nc:
            separadas = len(pend) > 1 and len(buf) == len(pend) * nc
            nombre = pend[0] if separadas else " ".join(pend)
            m = materia_de(nombre, [], etiqueta)
            m.update(zip(campos, [num(x) for x in buf[:nc]]))
            if grupo is not None:
                grupo["materias"].append(m)
            elif actual is not None:
                actual["materias"].append(m)
            else:
                resto.append(m["nombre"])
            pend, buf, etiqueta = pend[1:] if separadas else [], buf[nc:], None

    lineas = texto.splitlines()
    # En este formato las cifras preceden sistemáticamente al nombre y SUBTOTAL.
    if 'aprendizaje_autonomo' in campos:
        for i in range(len(lineas) - 1):
            if RE_NUMS.fullmatch(lineas[i]) and len(lineas[i].split()) == nc and \
                    not RE_NUMS.fullmatch(lineas[i + 1]):
                lineas[i], lineas[i + 1] = lineas[i + 1], lineas[i]
        lineas = preparar_texto('\n'.join(lineas)).splitlines()
    for i, l in enumerate(lineas):
        l = l.strip()
        if not l:
            continue
        if re.match(r'^(?:TRAYECTORIA\s+["“]|OPCI[ÓO]N\s+)', l, re.I):
            trayectoria = l
            pend, buf, etiqueta = [], [], None
            continue
        if re.search(r'\b(?:UNIDADES|ASIGNATURAS)\s+DE\s+APRENDIZAJE\s+OPTATIVAS|^ASIGNATURAS OPTATIVAS|^MEN[ÚU] DE ASIGNATURAS OPTATIVAS', l, re.I) and \
                not re.search(rf'(?:\s+{NUM}){{3,}}$', l):
            catalogo = True
            grupo = {'grupo': l, 'materias': []}
            optativas.append(grupo)
            pend, buf, etiqueta = [], [], None
            continue
        if re.search(r'\bTOTAL DE HORAS\b', l, re.I) and not re.match(r'^T/H', l, re.I):
            referencia_general = True
        mn = re.match(r'^(?:M[ÓO]DULO\s+)?((?:NIVEL|SEMESTRE|PER[IÍ]ODO)\s+(?:[IVX]+|\d+))\b(.*)$', l, re.I)
        nv = nivel_de(mn.group(1) if mn else l)
        if nv is not None:
            if catalogo:
                grupo = {'grupo': f'Optativas · {l}', 'materias': []}
                optativas.append(grupo)
                pend, buf, etiqueta = [], [], None
                continue
            actual = {"nivel": nv, "materias": [], "subtotal": None}
            if trayectoria:
                actual['trayectoria'] = trayectoria
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
            # TOTAL tras las materias de un semestre es su subtotal; el encabezado
            # «TOTAL DE HORAS» distingue el resumen general de la carrera.
            local = actual is not None and not referencia_general and grupo is None and \
                not re.search(r'^SUBTOTAL\b', texto, re.I | re.M) and actual['subtotal'] is None and \
                (totales > 1 or len(niveles) == 1)
            if ms.group(1).upper().startswith("SUBTOTAL") or local:
                if actual is not None:
                    actual["subtotal"] = dict(zip(campos, v)) if len(v) == nc else valores(v)
            else:
                total = dict(zip(campos, v)) if len(v) == nc else valores(v)
            if pend and not buf and local:
                # Si el OCR conserva nombres pero pierde todas sus cifras, no usa
                # el subtotal como si correspondiera a una materia.
                for nombre in pend:
                    actual['materias'].append(materia_de(nombre, []))
                resto.append('materias sin cifras individuales: ' + ' / '.join(pend))
            pend, buf = [], []
            referencia_general = False
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
        if RE_PIE.match(l) or re.fullmatch(r"[\W_]*", l) or \
                re.fullmatch(r'T|P|C|AA|TEPIC|SATCA|(?:TIPO )?T P T/(?:H|II) C(?:\. Tepic C\. SATCA)?|TEOR[IÍ]A PR[AÁ]CTICA AA.*', l, re.I):
            continue
        if re.match(rf'^T\s+{NUM}', l):
            resto.append('cifras en encabezado sin nombre: ' + l)
            continue
        if RE_ETIQ.match(l):
            etiqueta = l
            continue
        if RE_NUMS.match(l):
            if referencia_general and len(l.split()) == nc:
                total = dict(zip(campos, map(num, l.split())))
                referencia_general = False
                pend, buf = [], []
                continue
            buf.extend(l.split())
            if i + 1 == len(lineas) or not RE_NUMS.fullmatch(lineas[i + 1]):
                emitir()
            continue
        me = re.fullmatch(rf'(ELECTIVA\s*\**)\s+({NUM})\s+({NUM})', l, re.I)
        if me and nc == 5 and campos[-1] == 'creditos_satca':
            extra = {'nivel': 0, 'materias': [materia_de(me[1], [])], 'subtotal': None}
            extra['materias'][0].update(zip(campos[-2:], [num(me[2]), num(me[3])]))
            niveles.append(extra)
            continue
        m2 = re.match(rf"^(?P<nom>[^\d\W].*?)\s+(?P<n>(?:{NUM}\s*){{{min(nc, 3)},}})$", l)
        if m2:
            pend.append(m2.group("nom"))
            buf.extend(m2.group("n").split())
            emitir()
            continue
        if buf and pend:     # fila incompleta: se descarta y se avisa
            resto.append(f"fila incompleta: {' '.join(pend)} {' '.join(buf)}")
            pend, buf = [], []
        elif buf:
            resto.append('cifras sin nombre: ' + ' '.join(buf))
            buf = []
        pend.append(l)
    resto.extend(pend)
    optativas = [g for g in optativas if g["materias"]]
    return niveles, optativas, total, resto


def encabezado(texto):
    programa = plan = None
    unidades = []
    for l in texto.split("\n")[:12]:
        u = l.upper()
        m = re.search(r"PLAN(?: DE ESTUDIOS?)?\s*(\d{4})\s*(?:DE|DEL)?\s*(.*)", u)
        if m:
            plan, programa = m.group(1), m.group(2).strip().title()
        unidades += [x for x in re.findall(r"\(([A-Z]{3,8})\)", u.replace("UPIIТА", "UPIITA")) if x not in unidades]
    return programa, plan, unidades


# ---------------------------------------------------------------- validación
def tol(campo):
    return TOL_SATCA if campo == 'creditos_satca' else TOL


def _suma(materias, campo):
    return round(sum(m.get(campo) or 0 for m in materias), 2)


def validar(niveles, total, optativas=(), por_trayectoria=True):
    trayectorias = {n.get('trayectoria') for n in niveles} - {None}
    if trayectorias and por_trayectoria:
        informes = {tr: validar([n for n in niveles if not n.get('trayectoria') or n['trayectoria'] == tr],
                                total, optativas, False) for tr in sorted(trayectorias)}
        estados = {v['estado'] for v in informes.values()}
        estado = next(e for e in ('discrepancia', 'ok', 'solo_total', 'sin_referencia') if e in estados)
        return {'ok': estado != 'discrepancia', 'estado': estado,
                'motivo': '; '.join(f"{tr}: {v['motivo']}" for tr, v in informes.items()),
                'niveles': [dict(n, trayectoria=tr) for tr, v in informes.items() for n in v['niveles']],
                'total': {'por_trayectoria': {tr: v['total'] for tr, v in informes.items()}},
                'sospechosas': [dict(m, trayectoria=tr) for tr, v in informes.items() for m in v['sospechosas']],
                'por_trayectoria': informes}
    informe = {"ok": True, "niveles": [], "total": None, "sospechosas": []}

    def sospecha_horas(ms, donde):
        for m in ms:
            if all(m.get(c) is not None for c in CAMPOS[:3]) and abs(m["teoria"] + m["practica"] + (m.get('aprendizaje_autonomo') or 0) - m["horas"]) > TOL:
                informe["sospechosas"].append({"donde": donde, "materia": m["nombre"], "motivo": "T+P != T/H"})

    for n in niveles:
        sub = n["subtotal"]
        item = {"nivel": n["nivel"], "materias": len(n["materias"]), "ok": None, "diferencias": {}}
        sospecha_horas(n["materias"], f"nivel {n['nivel']}")
        if sub and "valores" not in sub:
            item["ok"] = True
            for c in sub:
                s = _suma(n["materias"], c)
                if sub.get(c) is not None and abs(s - sub[c]) > tol(c):
                    item["ok"] = False
                    item["diferencias"][c] = {"suma": s, "subtotal": sub[c], "dif": round(sub[c] - s, 2)}
                    for m in n["materias"]:   # materia cuyo valor explica la diferencia (sobra o falta una)
                        if m.get(c) is not None and abs(m[c] - abs(sub[c] - s)) < tol(c):
                            informe["sospechosas"].append({"donde": f"nivel {n['nivel']}", "materia": m["nombre"],
                                                           "motivo": f"{c} {m[c]} explica la diferencia {round(sub[c] - s, 2)}"})
        elif sub and 'valores' in sub:
            sumas = {c: _suma(n['materias'], c) for c in CAMPOS}
            faltan = [v for v in sub['valores'] if not any(abs(v - s) <= tol(c) for c, s in sumas.items())]
            item['ok'] = not faltan
            item['diferencias'] = {'referencia_parcial': faltan} if faltan else {}
        else:
            item['nota'] = 'no se encontró SUBTOTAL'
        informe["niveles"].append(item)
        if item["ok"] is False:
            informe["ok"] = False
    for g in optativas:
        sospecha_horas(g["materias"], g["grupo"])
    if total is None:
        informe["total"] = {"ok": None, "nota": "no se encontró TOTAL"}
    elif "valores" not in total:
        t = {"ok": True, "diferencias": {}}
        for c in total:
            s = round(sum(_suma(n["materias"], c) for n in niveles), 2)
            if total.get(c) is not None and abs(s - total[c]) > tol(c):
                t["ok"] = False
                t["diferencias"][c] = {"suma": s, "total": total[c], "dif": round(total[c] - s, 2)}
        informe["total"] = t
    else:   # el OCR perdió columnas del TOTAL: cada valor debe coincidir con alguna suma
        sumas = {c: round(sum(_suma(n["materias"], c) for n in niveles), 2) for c in CAMPOS}
        enc = {str(v): next((c for c, s in sumas.items() if abs(s - v) <= tol(c)), None) for v in total["valores"]}
        informe["total"] = {"ok": all(enc.values()), "parcial": True, "coincide_con": enc, "sumas": sumas}
    if informe["total"]["ok"] is False:
        informe["ok"] = False
    referencias = any(n['subtotal'] for n in niveles)
    informe['estado'] = ('discrepancia' if not informe['ok'] else 'ok' if referencias
                         else 'solo_total' if total else 'sin_referencia')
    motivos = [f"nivel {n['nivel']}: {n['diferencias']}" for n in informe['niveles'] if n['ok'] is False]
    if informe['total']['ok'] is False:
        motivos.append(f"TOTAL: {informe['total']}")
    informe['motivo'] = '; '.join(motivos) or {
        'ok': 'Las referencias disponibles cuadran (SUBTOTAL y/o TOTAL).',
        'solo_total': 'Sin subtotales; la suma general cuadra con TOTAL.',
        'sin_referencia': 'Sin SUBTOTAL ni TOTAL; no hay referencia para comprobar las sumas.',
    }.get(informe['estado'], '')
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


# ---------------------------------------------------------------- relectura (franjas a mayor resolución)
def n_franjas(w, h):
    """Páginas apaisadas: 3 franjas; verticales: 4."""
    return 3 if w >= h else 4


def tamanios(pdf):
    import pypdfium2 as pdfium
    doc = pdfium.PdfDocument(str(pdf))
    return [doc[i].get_size() for i in range(len(doc))]


def cortes(alto, n, oscuridad):
    """[(ini, fin)] de n franjas con traslape TRASLAPE; cada borde se ajusta a la fila más blanca cercana
    (la oscuridad media por fila está en `oscuridad`) para no partir texto."""
    h = alto / (n - (n - 1) * TRASLAPE)         # alto nominal de cada franja
    ov = h * TRASLAPE
    avance = h - ov

    def ajusta(y, ventana):
        a, b = max(0, int(y - ventana)), min(alto - 1, int(y + ventana))
        return min(range(a, b + 1), key=lambda i: (round(float(oscuridad[i]), 1), abs(i - y)))

    res = []
    for k in range(n):
        ini = 0 if k == 0 else ajusta(k * avance, 0.4 * ov)
        fin = alto if k == n - 1 else ajusta(k * avance + h, 0.4 * ov)
        res.append((ini, max(fin, ini + 1)))
    return res


def franjas(pdf, pagina):
    """Renderiza la página a LADO_HR y la corta; caché img/<pdf>-p<N>-hr-f<k>.png (k desde 1) y -hr.json."""
    nombre = pdf.stem
    meta = BASE / "img" / f"{nombre}-p{pagina}-hr.json"
    destino = lambda k: BASE / "img" / f"{nombre}-p{pagina}-hr-f{k}.png"
    if meta.exists():
        return [destino(k) for k in range(1, json.loads(meta.read_text(encoding="utf-8"))["franjas"] + 1)]
    import numpy as np
    import pypdfium2 as pdfium
    pg = pdfium.PdfDocument(str(pdf))[pagina - 1]
    w, h = pg.get_size()
    img = pg.render(scale=LADO_HR / max(w, h)).to_pil().convert("RGB")
    n = n_franjas(w, h)
    oscuridad = 255 - np.asarray(img.convert("L"), dtype=np.float32).mean(axis=1)
    lista = cortes(img.height, n, oscuridad)
    for k, (ini, fin) in enumerate(lista, 1):
        img.crop((0, ini, img.width, fin)).save(destino(k))
    meta.write_text(json.dumps({"franjas": n, "cortes": lista, "ancho": img.width, "alto": img.height}), encoding="utf-8")
    return [destino(k) for k in range(1, n + 1)]


def ocr_franja(png):
    """OCR 'Table Recognition:' de una franja; caché <png>.ocr2.txt (+ .ocr2.json). Devuelve (texto, segundos, en_cache)."""
    cache, meta = png.with_suffix(".ocr2.txt"), png.with_suffix(".ocr2.json")
    if cache.exists():
        m = json.loads(meta.read_text(encoding="utf-8")) if meta.exists() else {}
        return cache.read_text(encoding="utf-8"), m.get("segundos", 0), True
    t0 = time.time()
    t = ocr(png, "Table Recognition:")
    seg = round(time.time() - t0, 1)
    cache.write_text(t, encoding="utf-8")
    meta.write_text(json.dumps({"segundos": seg, "caracteres": len(t)}), encoding="utf-8")
    return t, seg, False


def quitar_bloques(lin, minimo=3):
    """Quita los bloques de >= `minimo` líneas que repiten literalmente (normalizadas) otros anteriores y que traen al
    menos dos líneas con texto: el OCR de una franja suele reiterar la tabla entre cercos ```markdown."""
    claves = [norm(l) for l in lin]
    vistos, salida, i = {}, [], 0
    while i < len(lin):
        k = tuple(claves[i:i + minimo])
        j = vistos.get(k) if len(k) == minimo else None
        if j is not None:
            m = minimo
            while i + m < len(lin) and j + m < len(lin) and claves[i + m] == claves[j + m]:
                m += 1
            if sum(1 for b in lin[i:i + m] if len(b) >= 12 and re.search(r"[A-Za-z]{3}", b)) >= 2:
                i += m
                continue
        if len(k) == minimo:
            vistos.setdefault(k, i)
        salida.append(lin[i])
        i += 1
    return salida


def unir(partes):
    """Concatena el texto de franjas consecutivas quitando las líneas duplicadas por el traslape, los cercos de código
    y los bloques que el OCR repite."""
    acc = []
    for t in partes:
        lin = [l for l in t.split("\n") if l.strip() and not l.strip().startswith("```")]
        if acc:
            for m in range(min(30, len(lin), len(acc)), 0, -1):       # bloque inicial igual al final acumulado
                if [norm(x) for x in acc[-m:]] == [norm(x) for x in lin[:m]]:
                    lin = lin[m:]
                    break
            cola = {norm(x) for x in acc[-40:] if len(x) >= 12 and re.search(r"[A-Za-z]{3}", x)}
            while lin and len(lin[0]) >= 12 and norm(lin[0]) in cola:   # filas sueltas repetidas
                lin = lin[1:]
        acc.extend(lin)
    return "\n".join(quitar_bloques(acc))


def _dif_ref(x):
    if not isinstance(x, dict):
        return 0
    if "diferencias" in x:
        return sum(abs(d["dif"]) for d in x["diferencias"].values())
    if x.get("parcial") and x.get("ok") is False:
        return sum(1 for c in x["coincide_con"].values() if c is None)
    sub = x.get("por_plan") or x.get("por_trayectoria")
    return sum(_dif_ref(y) for y in sub.values()) if sub else 0


def dif_total(salida):
    """Diferencia total de la validación: suma de |dif| de niveles y TOTAL (cada referencia parcial perdida vale 1);
    infinita si no hay materias."""
    if not any(n["materias"] for n in salida["niveles"]):
        return float("inf")
    v = salida["validacion"]
    t = 0.0
    for n in v.get("niveles", []):
        for c, d in (n.get("diferencias") or {}).items():
            t += len(d) if c == "referencia_parcial" else abs(d["dif"])
    return round(t + _dif_ref(v.get("total")), 2)


def clave_mejor(salida):
    """Menor es mejor: ok > solo_total > discrepancia (otros estados no compiten); luego menor diferencia total."""
    rango = {"ok": 0, "solo_total": 1, "discrepancia": 2}.get(salida["validacion"]["estado"], 9)
    return (rango, dif_total(salida), -sum(len(n["materias"]) for n in salida["niveles"]))


def textos_originales(nombre):
    caches = sorted((BASE / "img").glob(f"{nombre}-p*.ocr.txt"),
                    key=lambda f: int(re.search(r"-p(\d+)\.ocr\.txt$", f.name)[1]))
    if not caches:
        raise FileNotFoundError(f"{nombre}: no hay .ocr.txt original en caché")
    paginas = [int(re.search(r"-p(\d+)\.ocr\.txt$", f.name)[1]) for f in caches]
    return paginas, {p: c.read_text(encoding="utf-8") for p, c in zip(paginas, caches)}


OPC_SILENCIO = {"callar": True, "sin_llm": True, "solo_ocr": False}


def base_relectura(pdf):
    """Re-análisis (sin OCR) del texto original con las reglas actuales: (paginas, textos, salida)."""
    paginas, textos = textos_originales(pdf.stem)
    previo = json.loads((BASE / "json" / f"{pdf.stem}.json").read_text(encoding="utf-8"))
    return paginas, textos, armar(pdf, paginas, textos, previo.get("tiempos", {}), [1], 0, OPC_SILENCIO, escribir=False)


def relectura(pdf, base, k, total_pasos):
    """Relee el PDF en franjas a mayor resolución y conserva el mejor resultado (original o relectura)."""
    nombre = pdf.stem
    paginas, textos, orig = base
    jf = BASE / "json" / f"{nombre}.json"
    previo = json.loads(jf.read_text(encoding="utf-8"))
    estado_antes = previo.get("relectura", {}).get("estado_antes") or previo["validacion"]["estado"]
    dif_antes = dif_total(orig)
    ganador, fuente, info = orig, "original", {}
    if orig["validacion"]["estado"] != "ok":
        nuevos, tiempos, nfr = {}, {}, {}
        for p in paginas:
            partes, seg_pag = [], 0.0
            lista = franjas(pdf, p)
            for i, png in enumerate(lista, 1):
                t0 = time.time()
                texto, seg, cache = ocr_franja(png)
                seg_pag += seg
                partes.append(texto)
                print(f"[{k[0]}/{total_pasos}] {nombre} pág {p} franja {i} · ocr"
                      f"{' (caché)' if cache else f' ({time.time() - t0:.0f} s)'}", flush=True)
                k[0] += 1
            nuevos[p] = unir(partes)
            tiempos[p] = {"relectura_segundos": round(seg_pag, 1), "franjas": len(lista)}
            nfr[p] = len(lista)
        rel = armar(pdf, paginas, nuevos, tiempos, [1], 0, OPC_SILENCIO, escribir=False)
        k[0] += 1
        info = {"estado_relectura": rel["validacion"]["estado"], "dif_relectura": dif_total(rel),
                "segundos_por_pagina": {str(p): tiempos[p]["relectura_segundos"] for p in paginas}}
        if clave_mejor(rel) < clave_mejor(ganador):
            ganador, fuente = rel, "relectura"
        # combinaciones por página (original o relectura en cada una): hasta 6 páginas todas; más, solo cambios de una
        n = len(paginas)
        if 1 < n <= 6:
            mascaras = [m for m in itertools.product((0, 1), repeat=n) if 0 < sum(m) < n]
        elif n > 6:
            mascaras = [tuple(int(i == j) for i in range(n)) for j in range(n)]
        else:
            mascaras = []
        for m in mascaras:
            mezcla = {p: (nuevos[p] if usa else textos[p]) for p, usa in zip(paginas, m)}
            t_mezcla = {p: (tiempos[p] if usa else {}) for p, usa in zip(paginas, m)}
            cand = armar(pdf, paginas, mezcla, t_mezcla, [1], 0, OPC_SILENCIO, escribir=False)
            if clave_mejor(cand) < clave_mejor(ganador):
                ganador = cand
                fuente = "mixta (" + ", ".join(f"pág {p}: {'relectura' if usa else 'original'}"
                                               for p, usa in zip(paginas, m)) + ")"
    else:
        k[0] += 1
    despues = ganador["validacion"]["estado"]
    ganador["relectura"] = dict(info, fuente_ganadora=fuente, estado_antes=estado_antes, estado_despues=despues,
                                dif_original=dif_antes, dif_final=dif_total(ganador))
    ganador["relectura"] = {c: (None if v == float("inf") else v) for c, v in ganador["relectura"].items()}
    jf.write_text(json.dumps(ganador, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  {nombre}: {estado_antes} → {despues} (fuente: {fuente}; dif {ganador['relectura']['dif_original']} → "
          f"{ganador['relectura']['dif_final']})", flush=True)
    return ganador


# ---------------------------------------------------------------- principal
def procesar(pdf, k, total_pasos, opciones):
    nombre = pdf.stem
    if opciones.get('solo_analisis'):
        caches = sorted((BASE / 'img').glob(f'{nombre}-p*.ocr.txt'),
                        key=lambda f: int(re.search(r'-p(\d+)\.ocr\.txt$', f.name)[1]))
        if not caches:
            raise FileNotFoundError(f'{nombre}: no hay .ocr.txt en caché; no se ejecutará OCR')
        paginas = [int(re.search(r'-p(\d+)\.ocr\.txt$', f.name)[1]) for f in caches]
    else:
        import pypdfium2 as pdfium
        paginas = list(range(1, len(pdfium.PdfDocument(str(pdf))) + 1))
    (BASE / "img").mkdir(parents=True, exist_ok=True)
    textos, tiempos = {}, {}
    for p in paginas:
        png = BASE / "img" / f"{nombre}-p{p}.png"
        t0 = time.time()
        if opciones.get('solo_analisis'):
            textos[p] = png.with_suffix('.ocr.txt').read_text(encoding='utf-8')
            meta = png.with_suffix('.ocr.json')
            tiempos[p] = json.loads(meta.read_text(encoding='utf-8')) if meta.exists() else {}
        else:
            renderizar(pdf, p, png)
            print(f"[{k[0]}/{total_pasos}] {nombre} pág {p} · ocr", flush=True)
            k[0] += 1
            textos[p], tiempos[p] = ocr_pagina(png)
    if opciones["solo_ocr"]:
        return None
    return armar(pdf, paginas, textos, tiempos, k, total_pasos, opciones)


def paso(k, total_pasos, texto, opciones):
    if not opciones.get('callar'):
        print(f"[{k[0]}/{total_pasos}] {texto}", flush=True)
    k[0] += 1


def armar(pdf, paginas, textos, tiempos, k, total_pasos, opciones, escribir=True):
    """Analiza los textos por página, valida, compara con el repositorio y (si escribir) guarda el JSON."""
    nombre = pdf.stem
    niveles, optativas, total, no_tabla, marcas = [], [], None, [], []
    planes = {encabezado(t)[1] for t in textos.values()} - {None}
    varios_planes = len(planes) > 1
    plan_pagina, totales_plan = None, {}
    for p in paginas:
        paso(k, total_pasos, f"{nombre} pág {p} · análisis", opciones)
        nv, op, tot, resto = analizar(textos[p])
        plan_pagina = encabezado(textos[p])[1] or plan_pagina
        if varios_planes:
            for n in nv:
                n['plan'] = plan_pagina
            for g in op:
                g['plan'] = plan_pagina
            if tot:
                totales_plan[plan_pagina] = tot
        if not nv and not op and not opciones.get('solo_analisis') and not opciones["sin_llm"] and n_filas_numericas(textos[p]) >= 3:
            try:   # respaldo: el analizador no encontró estructura
                nv, tot = respaldo_llm(textos[p])
                marcas.append(f"pág {p}: respaldo qwen3.5:9b (verificar a mano)")
            except Exception as e:
                marcas.append(f"pág {p}: respaldo falló ({e})")
        total = tot or total
        if nv or op:
            niveles.extend(nv)
            optativas.extend(op)
            if resto:
                marcas.append(f"pág {p}: líneas sin clasificar: {resto}")
        else:
            no_tabla.append({"pagina": p, "texto": textos[p]})
    # une niveles repetidos (un nivel partido en dos páginas) y grupos de optativas
    fus = {}
    for n in niveles:
        clave = (n.get('plan') or '', n.get('trayectoria') or '', n['nivel'])
        if clave in fus:
            fus[clave]["materias"].extend(n["materias"])
            fus[clave]["subtotal"] = n["subtotal"] or fus[clave]["subtotal"]
        else:
            fus[clave] = n
    niveles = [fus[i] for i in sorted(fus)]
    gfus = {}
    for g in optativas:
        clave = (g.get('plan') or '', g['grupo'])
        if clave in gfus:
            gfus[clave]["materias"].extend(g["materias"])
        else:
            gfus[clave] = g
    optativas = list(gfus.values())
    paso(k, total_pasos, f"{nombre} · validación", opciones)
    val = validar(niveles, total, optativas)
    if varios_planes:
        informes = {pl: validar([n for n in niveles if n.get('plan') == pl], totales_plan.get(pl),
                               [g for g in optativas if g.get('plan') == pl]) for pl in sorted(planes)}
        val['por_plan'] = informes
        val['ok'] = all(v['ok'] for v in informes.values())
        val['estado'] = 'discrepancia' if not val['ok'] else 'ok' if any(v['estado'] == 'ok' for v in informes.values()) else 'solo_total' if totales_plan else 'sin_referencia'
        val['motivo'] = '; '.join(f"plan {pl}: {v['motivo']}" for pl, v in informes.items())
        val['niveles'] = [dict(n, plan=pl) for pl, v in informes.items() for n in v['niveles']]
        val['total'] = {'por_plan': {pl: v['total'] for pl, v in informes.items()}}
        total = None
    if not any(n['materias'] for n in niveles) and not optativas:
        estructura = any(re.search(r'\b(?:SEMESTRE|NIVEL|PER[IÍ]ODO)\s+(?:[IVX]+|\d+)\b', t, re.I)
                         or n_filas_numericas(preparar_texto(t)) >= 3
                         or (re.search(r'CR[EÉ]DITOS|T/H', t, re.I) and len(re.findall(NUM, t)) >= 4)
                         for t in textos.values())
        val.update(estado='discrepancia' if estructura else 'no_es_tabla', ok=False if estructura else None,
                   motivo='Tabla reconocible sin materias extraíbles; revisar la caché OCR.' if estructura
                   else 'Sin estructura curricular ni filas de materias; portada o imagen sin tabla.')
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
    if varios_planes:
        salida['totales_por_plan'] = totales_plan
    if escribir:
        (BASE / "json").mkdir(exist_ok=True)
        (BASE / "json" / f"{nombre}.json").write_text(json.dumps(salida, ensure_ascii=False, indent=1), encoding="utf-8")
    return salida


def modo_relectura(args):
    """--relectura: PDF con estado 'discrepancia' (o los indicados) se releen en franjas; reanudable por caché."""
    estados = {}
    for f in sorted((BASE / 'json').glob('*.json')):
        if not f.name.startswith('_'):
            d = json.loads(f.read_text(encoding='utf-8'))
            estados[f.stem] = (d['validacion'].get('estado'), 'relectura' in d)
    pdfs = [pathlib.Path(a) for a in args] or [BASE / 'pdf' / (n + '.pdf') for n, (e, _) in estados.items()
                                               if e == 'discrepancia']
    pdfs = [p for p in pdfs if p.stem in estados and estados[p.stem][0] == 'discrepancia']
    bases = {p: base_relectura(p) for p in pdfs}
    tam = {p: tamanios(p) for p in pdfs if bases[p][2]['validacion']['estado'] != 'ok'}
    pasos = sum(sum(n_franjas(*tam[p][pg - 1]) for pg in bases[p][0]) + 1 for p in tam) + (len(pdfs) - len(tam))
    k = [1]
    for p in pdfs:
        relectura(p, bases[p], k, pasos)
    resumen = {}
    for f in sorted((BASE / 'json').glob('*.json')):
        if not f.name.startswith('_'):
            d = json.loads(f.read_text(encoding='utf-8'))
            v = d['validacion']
            resumen[f.stem + '.pdf'] = {'estado': v.get('estado', 'pendiente'), 'motivo': v.get('motivo', ''),
                                       'materias': sum(len(n['materias']) for n in d['niveles']),
                                       **({'fuente': d['relectura']['fuente_ganadora']} if 'relectura' in d else {})}
    conteos = {e: sum(v['estado'] == e for v in resumen.values())
               for e in ('ok', 'solo_total', 'sin_referencia', 'discrepancia', 'no_es_tabla', 'pendiente')}
    (BASE / 'json' / '_resumen.json').write_text(json.dumps(
        {'conteos': conteos, 'pdfs': resumen}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Resumen: {conteos}', flush=True)


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding="utf-8")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    opciones = {"solo_ocr": "--solo-ocr" in sys.argv, "sin_llm": "--sin-llm" in sys.argv,
                'solo_analisis': '--solo-analisis' in sys.argv, 'relectura': '--relectura' in sys.argv}
    if opciones['relectura']:
        if opciones['solo_ocr'] or opciones['solo_analisis']:
            raise SystemExit('--relectura es incompatible con --solo-ocr y --solo-analisis')
        modo_relectura(args)
        return
    if opciones['solo_analisis'] and opciones['solo_ocr']:
        raise SystemExit('--solo-analisis y --solo-ocr son excluyentes')
    if opciones['solo_analisis']:
        pdfs = [pathlib.Path(a) for a in args] or [BASE / 'pdf' / (n + '.pdf') for n in sorted({
            re.sub(r'-p\d+\.ocr\.txt$', '', f.name) for f in (BASE / 'img').glob('*-p*.ocr.txt')})]
        pasos = sum(len(list((BASE / 'img').glob(f'{p.stem}-p*.ocr.txt'))) + 1 for p in pdfs)
    else:
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
                  f"validación={v['estado']} · {v['motivo']}", flush=True)
    if not opciones['solo_ocr']:
        resumen = {}
        for f in sorted((BASE / 'json').glob('*.json')):
            if not f.name.startswith('_'):
                d = json.loads(f.read_text(encoding='utf-8'))
                v = d['validacion']
                resumen[f.stem + '.pdf'] = {'estado': v.get('estado', 'pendiente'), 'motivo': v.get('motivo', ''),
                                           'materias': sum(len(n['materias']) for n in d['niveles'])}
        conteos = {e: sum(v['estado'] == e for v in resumen.values())
                   for e in ('ok', 'solo_total', 'sin_referencia', 'discrepancia', 'no_es_tabla', 'pendiente')}
        (BASE / 'json' / '_resumen.json').write_text(json.dumps(
            {'conteos': conteos, 'pdfs': resumen}, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'Resumen: {conteos}', flush=True)


if __name__ == "__main__":
    main()
