"""Copia una versión etiquetada de ipn-comun a vendor/ipn-comun/ (consumo fijado, sin cargar nada de otro sitio).

Uso:  python tools/comun.py [etiqueta] [--origen RUTA]
      sin etiqueta: la más reciente (orden de versión); sin etiquetas: el commit actual (se anota en VERSION).
Genera vendor/ipn-comun/{dist,js,componentes,contenido/textos}, VERSION y SHA256SUMS. Es idempotente:
si el contenido ya coincide no escribe nada. `python tools/comun.py --verificar` comprueba las sumas.
También ofrece css() para que los build inyecten tokens.css + alias-herramientas.css.
"""
import hashlib, io, os, pathlib, re, subprocess, sys, tarfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
VENDOR = ROOT / "vendor" / "ipn-comun"
CARPETAS = ["dist", "js", "componentes", "contenido/textos"]
OMITIR = re.compile(r"\.test\.[cm]?js$")


def origen_por_omision():
    if os.environ.get("IPN_COMUN"):
        return pathlib.Path(os.environ["IPN_COMUN"])
    for base in [ROOT, *ROOT.parents]:   # funciona también desde un worktree (ipn-tools-wt/<rama>)
        if (base / "ipn-comun" / "dist").is_dir():
            return base / "ipn-comun"
    raise SystemExit("No encuentro ipn-comun; usa --origen RUTA o la variable IPN_COMUN.")


def git(origen, *args):
    return subprocess.run(["git", "-C", str(origen), *args], capture_output=True, check=True).stdout.decode().strip()


def elegir_version(origen, etiqueta):
    if etiqueta:
        return etiqueta, git(origen, "rev-parse", etiqueta + "^{commit}")
    etiquetas = [t for t in git(origen, "tag", "--sort=-v:refname").splitlines() if t]
    if etiquetas:
        return etiquetas[0], git(origen, "rev-parse", etiquetas[0] + "^{commit}")
    commit = git(origen, "rev-parse", "HEAD")
    return "sin-etiqueta-" + commit[:7], commit


def archivos_de(origen, commit):
    datos = subprocess.run(["git", "-C", str(origen), "archive", "--format=tar", commit, *CARPETAS], capture_output=True, check=True).stdout
    salida = {}
    with tarfile.open(fileobj=io.BytesIO(datos)) as tf:
        for m in tf.getmembers():
            if m.isfile() and not OMITIR.search(m.name):
                salida[m.name] = tf.extractfile(m).read()
    return salida


def suma(b):
    return hashlib.sha256(b).hexdigest()


def construir(origen, etiqueta=None):
    version, commit = elegir_version(origen, etiqueta)
    archivos = archivos_de(origen, commit)
    sumas = "".join(f"{suma(archivos[k])}  {k}\n" for k in sorted(archivos))
    nota = "" if not version.startswith("sin-etiqueta") else "nota=no había etiqueta; se usó el commit actual\n"
    cabecera = f"version={version}\ncommit={commit}\norigen=Silver-VS/ipn-comun\n{nota}sha256_de_sumas={suma(sumas.encode())}\n"
    return {**archivos, "VERSION": cabecera.encode(), "SHA256SUMS": sumas.encode()}


def escribir(archivos):
    cambios = 0
    previos = {p.relative_to(VENDOR).as_posix() for p in VENDOR.rglob("*") if p.is_file()} if VENDOR.exists() else set()
    for ruta in previos - set(archivos):
        (VENDOR / ruta).unlink(); cambios += 1
    for ruta, b in archivos.items():
        p = VENDOR / ruta
        if p.exists() and p.read_bytes() == b:
            continue
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(b); cambios += 1
    return cambios


def verificar():
    f = VENDOR / "SHA256SUMS"
    if not f.exists():
        return ["falta vendor/ipn-comun/SHA256SUMS (corre tools/comun.py)"]
    errores = []
    for linea in f.read_text(encoding="utf-8").splitlines():
        h, ruta = linea.split("  ", 1)
        p = VENDOR / ruta
        if not p.exists() or suma(p.read_bytes()) != h:
            errores.append("no coincide: " + ruta)
    return errores


# Las variables de color-scheme de tokens.css cambiarían controles y barras de desplazamiento de las páginas
# existentes (que ya manejan color-scheme con data-theme); se quitan al inyectar. El tema sigue en data-theme.
def css():
    """CSS comun para inyectar: tokens + alias de herramientas, sin tocar el aspecto actual."""
    partes = []
    for nombre in ("tokens.css", "alias-herramientas.css"):
        partes.append(re.sub(r"\s*color-scheme:\s*\w+;", "", (VENDOR / "dist" / nombre).read_text(encoding="utf-8")))
    return "\n".join(partes)


def inyectar(html):
    """Sustituye /*__TOKENS__*/ por el CSS común. Debe ir ANTES del :root propio: ante igualdad gana lo actual."""
    return html.replace("/*__TOKENS__*/", css(), 1)


def main(argv):
    if "--verificar" in argv:
        e = verificar()
        print("\n".join(e) or "ipn-comun vendor: sumas correctas")
        return 1 if e else 0
    origen = None; etiqueta = None
    it = iter(argv)
    for a in it:
        if a == "--origen":
            origen = pathlib.Path(next(it))
        else:
            etiqueta = a
    origen = origen or origen_por_omision()
    archivos = construir(origen, etiqueta)
    n = escribir(archivos)
    print(archivos["VERSION"].decode().splitlines()[0], "-", n, "archivos escritos" if n else "sin cambios")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
