"""Convierte los informes REC2 (Markdown de investigación) a data/recursos/upiita/<carrera>.json.

Uso:
    python tools/rec2_importar.py                 # parsea, verifica URL y escribe los JSON
    python tools/rec2_importar.py --sin-red       # solo parsea y reporta (no hace peticiones)

La verificación usa solo peticiones de lectura (HEAD y, si falla, GET) con timeout de 15 s.
Conserva como máximo MAX_POR_MATERIA recursos por clave, con URL que responda 200 tras redirecciones.
"""
import argparse
import concurrent.futures
import json
import pathlib
import re
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DESTINO = ROOT / "data" / "recursos" / "upiita"
ENTRADA = pathlib.Path("D:/Documents/Development/UPIITA_DEV/coordinacion-wt/ipt-estado/ipn-tools/investigacion")
INFORMES = {
    "bionica": ["G-REC2-bionica-n345.md"],
    "mecatronica": ["G-REC2-mecatronica.md"],
    "telematica": ["G-REC2-telematica-1.md", "G-REC2-telematica-2.md"],
}
MAX_POR_MATERIA = 4
ROM = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10}
ROM_RE = r"(?:VIII|VII|VI|IV|IX|V|III|II|I|X)"
ENCABEZADO = re.compile(r"^#{2,4}\s+(?:\d+\.\s+)?([BMT]\d{3})\b")
RECURSO = re.compile(r"^\s*[*-]\s+\*\*Recurso\s*\d+[^*]*\*\*\s*(.*)$")
CAMPO = re.compile(r"^\s*[*-]\s+\*\*([^*]+?):\*\*\s*(.*)$")
CABECERAS = {"User-Agent": "Mozilla/5.0 (IPN-tools verificador de enlaces; solo lectura)"}


def limpio(texto):
    return texto.replace("`", "").replace("**", "").strip()


def limpiar_url(url):
    url = url.rstrip(".,;:*`'")
    while url.endswith(")") and url.count("(") < url.count(")"):
        url = url[:-1]
    return url


def enlaces(texto):
    """Lista de (texto, url) de enlaces Markdown [texto](url), respetando paréntesis anidados."""
    salida = []
    for m in re.finditer(r"\[([^\]]*)\]\(", texto):
        inicio, profundidad, j = m.end(), 1, m.end()
        while j < len(texto) and profundidad:
            if texto[j] == "(":
                profundidad += 1
            elif texto[j] == ")":
                profundidad -= 1
            j += 1
        if profundidad == 0:
            url = limpiar_url(texto[inicio:j - 1].strip())
            if re.match(r"https?://\S+$", url):
                salida.append((m.group(1).strip(), url))
    return salida


def url_de(texto):
    enl = enlaces(texto or "")
    if enl:
        return enl[0][1]
    sueltas = re.findall(r"https?://[^\s`<>\"]+", texto or "")
    return limpiar_url(sueltas[0]) if sueltas else None


def titulo_de(texto):
    texto = texto or ""
    enl = enlaces(texto)
    if enl:
        return enl[0][0]
    m = re.search(r"\*([^*]+)\*", texto)
    if m:
        return m.group(1).strip()
    if re.search(r"https?://", texto):
        return ""
    return limpio(texto)


def idioma_de(texto):
    s = limpio(texto).lower()
    if "(en)" in s or "inglés" in s or "ingles" in s or s == "en":
        return "en"
    if "(es)" in s or "español" in s or "espanol" in s or s == "es":
        return "es"
    return s


def unidades_de(texto, total):
    t = re.sub(r"\([^()]*\)", "", limpio(texto))
    if re.search(r"\btodas?\b|\btodo el\b|\bcompleto\b", t, re.I) and total:
        return list(range(1, total + 1))
    nums = set()
    rango = rf"({ROM_RE})\s*(?:–|-|a)\s*({ROM_RE})"
    for a, b in re.findall(rango, t):
        nums.update(range(ROM[a], ROM[b] + 1))
    for r in re.findall(rf"\b({ROM_RE})\b", re.sub(rango, " ", t)):
        nums.add(ROM[r])
    if total:
        nums = {n for n in nums if n <= total}
    return sorted(nums)


def parsear(ruta, materias):
    """Llena materias[clave] = {'total': n, 'recursos': [dict]} desde un informe."""
    clave, rec = None, None
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        m = ENCABEZADO.match(linea)
        if m:
            clave, rec = m.group(1), None
            materias.setdefault(clave, {"total": 0, "recursos": []})
            continue
        if linea.startswith("#") or linea.strip() == "---":
            clave, rec = None, None
            continue
        if clave is None:
            continue
        m = RECURSO.match(linea)
        if m:
            rec = {"titulo_linea": m.group(1), "campos": {}}
            materias[clave]["recursos"].append(rec)
            continue
        if rec is None:
            if re.search(r"Unidades[^:]*:", linea):
                items = linea.split(":", 1)[1].replace("*", "").split(";")
                numeros = [ROM[r] for it in items for r in re.findall(rf"^\s*({ROM_RE})\.", it)]
                materias[clave]["total"] = max([materias[clave]["total"], *numeros])
            continue
        m = CAMPO.match(linea)
        if not m:
            continue
        etiqueta, valor = m.group(1).lower(), m.group(2)
        if etiqueta.startswith(("título", "titulo")):
            rec["campos"]["titulo"] = valor
        elif etiqueta.startswith("url"):
            rec["campos"]["url"] = valor
        elif etiqueta.startswith("fuente"):
            rec["campos"]["fuente"] = valor
        elif etiqueta.startswith("idioma"):
            rec["campos"]["idioma"] = valor
        elif etiqueta.startswith("tipo"):
            rec["campos"]["tipo"] = valor
        elif etiqueta.startswith("licencia"):
            rec["campos"]["licencia"] = valor
        elif etiqueta.startswith("unidades") and ("cubre" in etiqueta or "cubiertas" in etiqueta):
            rec["campos"]["unidades"] = valor


def candidatos(rec, total):
    """Convierte un recurso parseado en dict con la estructura de bionica.json, o devuelve (None, motivo)."""
    c = rec["campos"]
    titulo = titulo_de(rec["titulo_linea"]) or titulo_de(c.get("titulo", ""))
    url = url_de(c.get("url", "")) or url_de(c.get("titulo", "")) or url_de(rec["titulo_linea"])
    if not url:
        return None, "sin URL"
    if urllib.parse.urlsplit(url).path in ("", "/"):
        return None, "portada (raíz del sitio)"
    faltan = [k for k, v in (("titulo", titulo), ("fuente", c.get("fuente")), ("tipo", c.get("tipo")),
                             ("licencia", c.get("licencia")), ("idioma", c.get("idioma"))) if not v]
    if faltan:
        return None, "faltan campos: " + ",".join(faltan)
    r = {"titulo": titulo, "url": url, "fuente": limpio(c["fuente"]), "idioma": idioma_de(c["idioma"]),
         "tipo": limpio(c["tipo"]), "licencia": limpio(c["licencia"])}
    unidades = unidades_de(c["unidades"], total) if c.get("unidades") else []
    if unidades:
        r["unidades"] = unidades
    return r, None


def estado(url):
    """(ok, código). Solo lectura: HEAD y, si HEAD da 403/405/406/501, GET. Cada petición con timeout de 15 s."""
    codigo = None
    for metodo in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(url, method=metodo, headers=CABECERAS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                codigo = resp.status
        except urllib.error.HTTPError as e:
            codigo = e.code
        except Exception as e:  # red, DNS, TLS, timeout
            return False, type(getattr(e, "reason", e)).__name__
        if codigo == 200:
            return True, 200
        if metodo == "HEAD" and codigo not in (403, 405, 406, 501):
            return False, codigo
    return False, codigo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sin-red", action="store_true", help="no verificar URL (solo parsear)")
    args = ap.parse_args()

    resumen, descartes = {}, []
    for unidad, archivos in INFORMES.items():
        materias = {}
        for nombre in archivos:
            parsear(ENTRADA / nombre, materias)
        candidatas = {}
        for clave, datos in materias.items():
            for rec in datos["recursos"]:
                r, motivo = candidatos(rec, datos["total"])
                if r:
                    candidatas.setdefault(clave, []).append(r)
                else:
                    descartes.append((clave, rec["titulo_linea"][:60] or rec["campos"].get("titulo", "")[:60], motivo, None))
        resumen[unidad] = candidatas

    urls = sorted({r["url"] for c in resumen.values() for rs in c.values() for r in rs})
    print(f"Candidatas: {sum(len(rs) for c in resumen.values() for rs in c.values())} recursos, {len(urls)} URL únicas")
    if not args.sin_red:
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            estados = dict(zip(urls, pool.map(estado, urls)))
    else:
        estados = {u: (True, "sin verificar") for u in urls}

    resultado_final = {}
    for unidad, candidatas in resumen.items():
        salida = {}
        for clave, rs in candidatas.items():
            vistos, aceptadas = set(), []
            for r in rs:
                ok, codigo = estados[r["url"]]
                if not ok:
                    descartes.append((clave, r["titulo"][:60], f"URL {codigo}", r["url"]))
                    continue
                if r["url"] in vistos:
                    continue
                if len(aceptadas) >= MAX_POR_MATERIA:
                    descartes.append((clave, r["titulo"][:60], f"más de {MAX_POR_MATERIA} por materia", r["url"]))
                    continue
                vistos.add(r["url"])
                aceptadas.append(r)
            if aceptadas:
                salida[clave] = aceptadas
        resultado_final[unidad] = salida

    if args.sin_red:
        for unidad, salida in resultado_final.items():
            print(unidad, len(salida), "materias", sum(len(v) for v in salida.values()), "recursos")
        return

    for unidad, salida in resultado_final.items():
        ruta = DESTINO / f"{unidad}.json"
        datos = json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else {}
        nuevas = 0
        for clave in sorted(salida):
            if clave in datos:
                print(f"[omitida, ya existe] {unidad}/{clave}")
                continue
            datos[clave] = salida[clave]
            nuevas += 1
        ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{unidad}: {nuevas} materias nuevas, {sum(len(v) for v in salida.values())} recursos en el informe")

    por_motivo = {}
    for _, _, motivo, _ in descartes:
        grupo = motivo if motivo.startswith(("portada", "sin ", "faltan", "más")) else "URL " + str(motivo)
        por_motivo[grupo] = por_motivo.get(grupo, 0) + 1
    print("Descartes por motivo:", por_motivo)
    for clave, titulo, motivo, url in descartes:
        print(f"  {clave} | {titulo} | {motivo} | {url or ''}")


if __name__ == "__main__":
    main()
