"""Índice de los mapas curriculares publicados en ipn.mx (educación superior).

Recorre la página de oferta educativa, abre la ficha de cada programa y anota cada PDF de mapa curricular con la
unidad académica que lo enlaza. No descarga los PDF: solo pide su tamaño (HEAD).

Uso:  python tools/planes_ipn.py [salida.json]
      por omisión escribe ../../recursos/planes-ipn/indice.json (fuera del repositorio).
Imprime una línea por programa ([n/N] nombre) para seguir el avance.
"""
import html, json, pathlib, re, sys, time, urllib.parse, urllib.request

BASE = "https://www.ipn.mx"
OFERTA = BASE + "/oferta-educativa/educacion-superior/"
UA = {"User-Agent": "Mozilla/5.0 (IPN-tools; indice de planes)"}
PAUSA = 1.0   # segundos entre peticiones: el sitio es institucional, no hay prisa


def pedir(url, metodo="GET"):
    req = urllib.request.Request(url, headers=UA, method=metodo)
    with urllib.request.urlopen(req, timeout=30) as r:
        if metodo == "HEAD":
            return r.headers
        datos = r.read()
        juego = r.headers.get_content_charset() or "latin-1"
    try:
        return datos.decode(juego)
    except UnicodeDecodeError:
        return datos.decode("latin-1")


def texto(fragmento):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragmento))).strip()


def url_absoluta(href):
    return urllib.parse.urljoin(BASE, urllib.parse.quote(html.unescape(href), safe="/:?&=%#"))


def fichas(portada):
    vistos = {}
    for href in re.findall(r'href="([^"]*ver-carrera\.html\?lg=es&id=(\d+)[^"]*)"', portada):
        vistos.setdefault(int(href[1]), href[0])
    return sorted(vistos.items())


def leer_ficha(pid, href):
    pagina = pedir(url_absoluta(href))
    titulo = re.search(r"<h1[^>]*>(.*?)</h1>", pagina, re.S)
    nombre = texto(titulo.group(1)) if titulo else re.sub(r".*nombre=", "", html.unescape(href)).replace("-", " ")
    pdfs = []
    for m in re.finditer(r'<a[^>]*href="([^"]+\.pdf)"[^>]*>(.*?)</a>', pagina, re.S | re.I):
        pdfs.append({"url": url_absoluta(m.group(1)), "unidad": texto(m.group(2))})
    return {"id": pid, "programa": nombre, "ficha": url_absoluta(href), "pdfs": pdfs}


def main():
    if len(sys.argv) > 1:
        salida = pathlib.Path(sys.argv[1])
    else:   # UPIITA_DEV/recursos, tanto desde ipn-tools/ como desde un worktree en ipn-tools-wt/<rama>/
        base = next(p for p in pathlib.Path(__file__).resolve().parents if (p / "recursos").is_dir())
        salida = base / "recursos" / "planes-ipn" / "indice.json"
    lista = fichas(pedir(OFERTA))
    programas, tamanos = [], {}
    for n, (pid, href) in enumerate(lista, 1):
        try:
            prog = leer_ficha(pid, href)
        except Exception as e:   # una ficha caída no detiene el índice
            prog = {"id": pid, "ficha": url_absoluta(href), "error": str(e), "pdfs": []}
        for p in prog["pdfs"]:
            if p["url"] not in tamanos:
                try:
                    tamanos[p["url"]] = int(pedir(p["url"], "HEAD").get("Content-Length") or 0)
                except Exception:
                    tamanos[p["url"]] = None
                time.sleep(PAUSA)
            p["bytes"] = tamanos[p["url"]]
        programas.append(prog)
        print(f"[{n}/{len(lista)}] {prog.get('programa', pid)} · {len(prog['pdfs'])} PDF", flush=True)
        time.sleep(PAUSA)
    salida.parent.mkdir(parents=True, exist_ok=True)
    salida.write_text(json.dumps({"fuente": OFERTA, "fecha": time.strftime("%Y-%m-%d"), "programas": programas},
                                 ensure_ascii=False, indent=1), encoding="utf-8")
    unicos = [u for u, b in tamanos.items()]
    total = sum(b or 0 for b in tamanos.values())
    print(f"Listo: {len(programas)} programas, {len(unicos)} PDF distintos, {total/1e6:.0f} MB en total → {salida}")


if __name__ == "__main__":
    main()
