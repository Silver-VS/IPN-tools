"""Valida contenido/textos/*.toml y data/sate.json, y los convierte a un objeto `T` para el navegador.

Uso:  python tools/contenido.py            # valida; sale con 1 si hay errores
      python tools/contenido.py --js       # imprime `const T=...;` (mapa plano clave -> plantilla)

Reglas (PRINCIPIOS-DE-CONSTRUCCION, seccion 2): claves a-z0-9_ con puntos, sin duplicados; variables {nombre} bien
formadas y las mismas que en el idioma base (es); plurales ICU {n, plural, one {...} other {...}}; sin `?` donde falta
un acento (error tipico de codificacion); sin caracteres de reemplazo; HTML solo <b> <i> <code> <a>.
"""
import html, json, pathlib, re, sys, tomllib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEXTOS = ROOT / "contenido" / "textos"
SATE = ROOT / "data" / "sate.json"
CLAVE = re.compile(r"^[a-z0-9_]+(\.[a-z0-9_]+)*$")
NOMBRE_VAR = re.compile(r"^[a-z][a-z0-9_]*$")
LETRA = "A-Za-zÁÉÍÓÚÑáéíóúñü"
ACENTO_PERDIDO = re.compile(f"[{LETRA}]\\?[{LETRA}]")
ETIQUETA = re.compile(r"</?([a-zA-Z][a-zA-Z0-9]*)")
PERMITIDAS = {"b", "i", "code", "a"}


def aplanar(d, prefijo=""):
    for k, v in d.items():
        ruta = prefijo + k
        if isinstance(v, dict):
            yield from aplanar(v, ruta + ".")
        else:
            yield ruta, v


def cargar(ruta):
    """Devuelve (version, {clave: texto}, errores). tomllib ya rechaza claves repetidas dentro de una tabla;
    aqui ademas se detecta la misma clave aplanada definida dos veces."""
    ruta = pathlib.Path(ruta)
    errores = []
    try:
        crudo = tomllib.loads(ruta.read_text(encoding="utf-8"))
    except (tomllib.TOMLDecodeError, UnicodeDecodeError) as e:
        return None, {}, [f"{ruta.name}: TOML invalido: {e}"]
    version = crudo.pop("version", None)
    if not isinstance(version, str) or not re.fullmatch(r"\d{4}\.\d{2}\.\d+", version):
        errores.append(f'{ruta.name}: falta version = "AAAA.MM.n"')
    mapa = {}
    for clave, valor in aplanar(crudo):
        if clave in mapa:
            errores.append(f"{ruta.name}: clave duplicada {clave}")
        mapa[clave] = valor
    return version, mapa, errores


def variables(plantilla, donde, errores):
    """Nombres de variable de una plantilla; los plurales ICU se leen aparte y su contenido se valida recursivamente."""
    nombres, i = set(), 0
    while i < len(plantilla):
        c = plantilla[i]
        if c == "{":
            j, nivel = i + 1, 1
            while j < len(plantilla) and nivel:
                nivel += (plantilla[j] == "{") - (plantilla[j] == "}")
                j += 1
            if nivel:
                errores.append(f"{donde}: llave sin cerrar")
                return nombres
            cuerpo = plantilla[i + 1:j - 1]
            m = re.match(r"^\s*([a-z][a-z0-9_]*)\s*,\s*plural\s*,(.*)$", cuerpo, re.S)
            if m:
                nombres.add(m.group(1))
                ramas = re.findall(r"(\w+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}", m.group(2))
                if not any(r[0] == "other" for r in ramas):
                    errores.append(f"{donde}: plural sin rama other")
                for _, texto in ramas:
                    nombres |= variables(texto.replace("#", ""), donde, errores)
            elif NOMBRE_VAR.match(cuerpo):
                nombres.add(cuerpo)
            else:
                errores.append(f"{donde}: variable no valida {{{cuerpo}}} (usa nombres como {{unidad}}, nunca {{0}})")
            i = j
        elif c == "}":
            errores.append(f"{donde}: llave de cierre sobrante")
            i += 1
        else:
            i += 1
    return nombres


def validar_texto(clave, valor, archivo, errores):
    donde = f"{archivo}: {clave}"
    if not CLAVE.match(clave):
        errores.append(f"{donde}: clave no valida (solo a-z, 0-9, _ y puntos)")
    if not isinstance(valor, str) or not valor.strip():
        errores.append(f"{donde}: el texto debe ser una cadena no vacia")
        return set()
    if "�" in valor or ACENTO_PERDIDO.search(valor):
        errores.append(f"{donde}: parece tener un acento perdido ('?' dentro de una palabra o caracter de reemplazo)")
    for et in ETIQUETA.findall(valor):
        if et.lower() not in PERMITIDAS:
            errores.append(f"{donde}: etiqueta HTML no permitida <{et}>")
    return variables(valor, donde, errores)


def validar_sate(claves, errores, ruta=SATE):
    ruta = pathlib.Path(ruta)
    if not ruta.exists():
        errores.append("falta data/sate.json")
        return
    d = json.loads(ruta.read_text(encoding="utf-8"))
    for u, c in d.get("unidades", {}).items():
        for p in c.get("pestanas", []):
            for suf in ("titulo", "corto"):
                if f"sate.pestana.{p}.{suf}" not in claves:
                    errores.append(f"data/sate.json: unidades.{u}: falta la clave sate.pestana.{p}.{suf}")
        for t in c.get("tramites", []):
            if f"sate.tramite.{t}.titulo" not in claves:
                errores.append(f"data/sate.json: unidades.{u}: falta la clave sate.tramite.{t}.titulo")
        if c.get("tramites") and "tramites" not in c.get("pestanas", []):
            errores.append(f"data/sate.json: unidades.{u}: hay tramites pero la pestana tramites no esta activa")
        if c.get("leyenda") not in ("prueba", None):
            errores.append(f"data/sate.json: unidades.{u}: leyenda desconocida")
        if c.get("leyenda") and "sate.leyenda." + c["leyenda"] not in claves:
            errores.append(f"data/sate.json: unidades.{u}: falta la clave sate.leyenda.{c['leyenda']}")


def validar(directorio=TEXTOS, sate=SATE):
    """Devuelve la lista de errores (vacia si todo esta bien). sate=None omite data/sate.json."""
    errores, base = [], {}
    archivos = sorted(pathlib.Path(directorio).glob("*.toml"), key=lambda a: (a.name != "es.toml", a.name))   # es primero
    if not any(a.name == "es.toml" for a in archivos):
        return ["falta es.toml"]
    for a in archivos:
        _, mapa, e = cargar(a)
        errores += e
        vars_ = {k: validar_texto(k, v, a.name, errores) for k, v in mapa.items()}
        if a.name == "es.toml":
            base = vars_
            if sate:
                validar_sate(set(mapa), errores, sate)
        else:   # otro idioma: puede tener claves faltantes (cae a es), pero no sobrantes ni variables distintas
            for k, vs in vars_.items():
                if k not in base:
                    errores.append(f"{a.name}: {k} no existe en es.toml")
                elif vs != base[k]:
                    errores.append(f"{a.name}: {k}: variables {sorted(vs)} distintas de es ({sorted(base[k])})")
    return errores


def objeto_t(idioma="es"):
    """Mapa plano clave -> plantilla del idioma (sin `version`)."""
    return cargar(TEXTOS / f"{idioma}.toml")[1]


def js(idioma="es"):
    """Codigo inyectable: `const T=...;` (GENERADO; el formateador de plantillas es js/texto.js de ipn-comun)."""
    return "/* GENERADO desde contenido/textos/%s.toml; no editar */\nconst T=%s;" % (
        idioma, json.dumps(objeto_t(idioma), ensure_ascii=False, separators=(",", ":")))


APOYO_CSS = """
.ipnt-apoyo{display:block;width:100%;box-sizing:border-box;color:var(--muted);overflow-wrap:anywhere}
.ipnt-apoyo a{display:inline-flex;align-items:center;gap:.4em;min-height:44px;max-width:100%;color:var(--accent);text-decoration:underline}
.ipnt-apoyo a:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.ipnt-apoyo svg{flex:none}
.ipnt-apoyo small{display:block;font-size:inherit}
"""


def html_apoyo():
    """Un solo fragmento para mantener iguales el enlace y los textos en las tres pantallas."""
    url = json.loads((ROOT / "data" / "cuenta.json").read_text(encoding="utf-8"))["donativos"]
    textos = objeto_t()
    return ('<div class="ipnt-apoyo"><a href="' + html.escape(url, quote=True) + '" target="_blank" rel="noopener">'
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>'
            '</svg><span>' + html.escape(textos["proyecto.apoyo.enlace"]) + '</span></a><small>'
            + html.escape(textos["proyecto.apoyo.ayuda"]) + '</small></div>')


def inject_apoyo(pagina):
    return pagina.replace("/*__APOYO_CSS__*/", APOYO_CSS, 1).replace("<!--__APOYO__-->", html_apoyo(), 1)


if __name__ == "__main__":
    if "--js" in sys.argv:
        print(js())
        sys.exit(0)
    errs = validar()
    print("\n".join(errs) if errs else f"contenido: {len(objeto_t())} textos validos")
    sys.exit(1 if errs else 0)
