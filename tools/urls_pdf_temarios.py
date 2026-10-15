"""Enlaces de descarga del PDF original de cada programa sintético (nube pública de la UPIITA, Nextcloud).

Los recursos compartidos viven en data/temarios/<unidad>/nube/fuentes.json; el campo `fuente` de cada temario trae la ruta
relativa del PDF (p. ej. «bionica/NIVEL_I/ALGEBRA LINEAL.pdf»). Patrón de Nextcloud:
    <nube><compartido>/<carpeta>/.../<archivo>   (WebDAV público; cada segmento codificado)
Sin argumentos imprime todas las URL (una por línea) para que se verifiquen en línea:
    python tools/urls_pdf_temarios.py [unidad]
"""
import json
import pathlib
import sys
from urllib.parse import quote

ROOT = pathlib.Path(__file__).resolve().parent.parent


def cargar_fuentes(unidad="upiita"):
    arch = ROOT / "data" / "temarios" / unidad / "nube" / "fuentes.json"
    return json.loads(arch.read_text(encoding="utf-8")) if arch.exists() else {}


def url_pdf(carrera, fuente, fuentes):
    """URL de descarga del PDF, o None si la carrera no tiene recurso compartido o la ruta no es utilizable."""
    cfg = (fuentes.get("carreras") or {}).get(carrera)
    if not cfg or not fuente or not cfg.get("compartido"):
        return None
    partes = [p for p in str(fuente).replace("\\", "/").split("/") if p]
    if partes and partes[0] == cfg.get("prefijo"):
        partes = partes[1:]
    if not partes or ".." in partes:
        return None
    return fuentes['nube'] + cfg['compartido'] + "/" + "/".join(quote(p, safe='') for p in partes)


def todas(unidad="upiita"):
    fuentes = cargar_fuentes(unidad)
    for arch in sorted((ROOT / "data" / "temarios" / unidad).glob("*.json")):
        d = json.loads(arch.read_text(encoding="utf-8"))
        if not isinstance(d, dict) or "materias" not in d:
            continue
        for m in d["materias"]:
            u = url_pdf(d["carrera"], m.get("fuente"), fuentes)
            if u:
                yield d["carrera"], m["clave"], u


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    for _carrera, _clave, url in todas(sys.argv[1] if len(sys.argv) > 1 else "upiita"):
        print(url)
