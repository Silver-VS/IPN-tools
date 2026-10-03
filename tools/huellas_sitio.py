"""Actualiza el manifiesto de archivos protegidos del sitio (src/build/protected.json en Silver-VS.github.io).

El portafolio verifica byte a byte /upiita/** y el archivo de verificación de Google; cada publicación de IPN-tools
cambia esos archivos de forma legítima, así que el manifiesto se regenera en el mismo commit de la publicación.

Uso:  python tools/huellas_sitio.py <ruta al clon de Silver-VS.github.io>
"""
import hashlib, json, pathlib, sys

site = pathlib.Path(sys.argv[1])
man = site / "src" / "build" / "protected.json"
if not man.exists():
    print("sin manifiesto de archivos protegidos; nada que actualizar")
    sys.exit(0)
# huellas del contenido que guarda Git (el índice), no del disco: en Windows, core.autocrlf cambia los saltos de
# línea al sacar los archivos y las pruebas del portafolio verifican el contenido del repositorio
import subprocess
git = lambda *a: subprocess.run(["git", "-C", str(site), *a], check=True, capture_output=True).stdout
git("add", "-A", "upiita", "googlebd435cdd0b631f3c.html")
rels = sorted(r for r in git("ls-files", "upiita", "googlebd435cdd0b631f3c.html").decode().splitlines() if r)
data = {r: hashlib.sha256(git("cat-file", "blob", ":" + r)).hexdigest() for r in rels}
man.write_text(json.dumps(dict(sorted(data.items())), indent=2) + "\n", encoding="utf-8")
print(f"{man.relative_to(site).as_posix()}: {len(data)} archivos")
