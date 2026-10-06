"""Genera Dictamen con los PDF originales y coordenadas en puntos, sin datos del alumnado.

Uso: UPIITA_SITE=https://silver-vs.github.io/upiita/ python tools/build_dictamen.py
"""
import base64
import json
import os
import pathlib
import re

import comun
import contenido
from institucional import write_dist

ROOT = pathlib.Path(__file__).resolve().parent.parent
PDFS = {"interno": "dictamen-interno-2026-1.pdf", "externo": "dictamen-externo-cosie-01.pdf"}


def construir():
    errores = contenido.validar()
    if errores:
        raise ValueError("\n".join(errores))
    mapa = json.loads((ROOT / "data/mapa_curricular_saes.json").read_text(encoding="utf-8"))
    materias = {f"{c}|{p}|{clave.upper()}": [nombre, nivel]
                for c, p, nivel, clave, nombre, *_ in mapa["rows"]}
    data = {"pdfs": {k: base64.b64encode((ROOT / "data/gestion_escolar" / f).read_bytes()).decode()
                     for k, f in PDFS.items()}, "materias": materias}
    html = (ROOT / "web/dictamen.template.html").read_text(encoding="utf-8")
    texto = re.sub(r"^export ", "", (comun.VENDOR / "js/texto.js").read_text(encoding="utf-8"), flags=re.M)
    texto = "var Texto=(function(){" + texto + "\nreturn {t:t,registrar:registrar};})();"
    for marca, valor in (("/*__DATA__*/null", json.dumps(data, ensure_ascii=False)),
                         ("/*__TEXTOS__*/", contenido.js()), ("/*__TEXTO_JS__*/", texto),
                         ("/*__COMPONENTES_CSS__*/", (ROOT / "web/sate/componentes.css").read_text(encoding="utf-8")),
                         ("/*__COMPONENTES_JS__*/", (ROOT / "web/sate/componentes.js").read_text(encoding="utf-8"))):
        html = html.replace(marca, valor, 1)
    return comun.inyectar(html)


def main():
    html = construir()
    (ROOT / "web/dictamen.html").write_text(html, encoding="utf-8")
    out = write_dist("dictamen", html)
    print(f"Dictamen: {out} ({len(html.encode('utf-8')) // 1024} KB); UPIITA_SITE={os.environ.get('UPIITA_SITE', '')}")


if __name__ == "__main__":
    main()
