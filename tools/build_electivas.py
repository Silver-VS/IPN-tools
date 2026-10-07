"""Genera web/electivas.html: asistente para liberar electivas (UAE).

Incrusta los formatos oficiales (PDF de gestión escolar) en base64 para llenarlos en el
navegador con pdf-lib, y la oferta del SAES para los formatos DIE-01/DIE-02.
Uso:  python tools/build_electivas.py
"""
import base64, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
GE = ROOT / "data" / "gestion_escolar"
TPL = ROOT / "web" / "electivas.template.html"
OUT = ROOT / "web" / "electivas.html"
PDFS = {
    "die01": "FORMATO DIE-01 OTRO PROGRAMA_1.pdf",
    "die02": "FORMATO DIE-02 MISMO PROGRAMA.pdf",
    "die03": "FORMATO DIE-03 REPORTE DE LA ACTIVIDAD.pdf",
    "form": "FORMULARIO ACTUALIZADO25-2.pdf",
}


def offer():
    """Oferta del próximo periodo por clase: carrera, turno, grupo, materia, profesores, horas/semana, clave, tipo."""
    h = json.loads((ROOT / "data" / "horarios_upiita.json").read_text(encoding="utf-8"))
    m = json.loads((ROOT / "data" / "mapa_curricular_saes.json").read_text(encoding="utf-8"))
    plan = {"B": "09", "M": "09", "T": "09", "E": "18", "S": "08"}
    import sys
    sys.path.insert(0, str(ROOT / "tools"))
    from build_horarios import norm, blocks, clean
    cur = {}
    for c, p, niv, clave, nom, tipo, cred, ht, hp in m["rows"]:
        if plan.get(c) == p:
            cur[(c, norm(nom))] = [clave.upper(), tipo[0], float(ht), float(hp), float(cred)]
    out = {}
    for r in h["proximo"]:
        key = (r["carrera"], r["Grupo"], clean(r["Asignatura"]))
        o = out.setdefault(key, {"t": r["turno"], "p": [], "m": 0})
        prof = clean(r["Profesor"])
        if prof not in o["p"]:
            o["p"].append(prof)
        o["m"] = max(o["m"], sum(b - a for _, a, b in blocks(r)))
    rows = []
    for (c, g, a), o in out.items():
        info = cur.get((c, norm(a)), ["", "", 0, 0, 0])
        rows.append([c, o["t"], g, a, " / ".join(o["p"]), round(o["m"] / 60, 2), info[0], info[1]])
    curric = {f"{c}|{v[0]}": [n, v[2], v[3], v[4]] for (c, n), v in cur.items()}
    return rows, curric, h["capturado"]


def main():
    import sys
    sys.path.insert(0, str(ROOT / "tools"))
    pdfs = {k: base64.b64encode((GE / f).read_bytes()).decode() for k, f in PDFS.items()}
    rows, curric, cap = offer()
    data = {"pdfs": pdfs, "oferta": rows, "curric": curric, "capturado": cap}
    html = TPL.read_text(encoding="utf-8").replace("/*__DATA__*/null", __import__("acentos").acentuar(json.dumps(data, ensure_ascii=False, separators=(",", ":"))))
    pdf = (ROOT / 'web/tramites/pdf-comun.js').read_text(encoding='utf-8') + '\n' + (ROOT / 'web/tramites/pdf-electivas.js').read_text(encoding='utf-8')
    html = html.replace('/*__PDF_ELECTIVAS__*/', pdf)
    import comun
    html = comun.inyectar(html)   # tokens + alias de ipn-comun (antes del :root propio: lo actual gana)
    from skins import inject
    html = inject(html)
    import cuenta   # perfil IPN-tools: respaldo y sincronización con la cuenta institucional
    html = cuenta.inject(html)
    import saes
    # el marcador de la versión compartida abre esta herramienta; el de la versión institucional, la URL del servidor (pendiente)
    OUT.write_text(saes.inject(html, "electivas", "https://claude.ai/artifact/DT1GkGs8Jzmu9D3CgiSTGg"), encoding="utf-8")
    from institucional import write_dist
    import os
    site = os.environ.get("UPIITA_SITE", "")  # p. ej. https://silver-vs.github.io/upiita/ : el marcador abre esta dirección
    write_dist("electivas", saes.inject(html, "electivas", site + "horarios-upiita.html" if site else ""))  # versión con encabezado institucional para el servidor de la UPIITA
    print(OUT, round(len(html) / 1024), "KB", len(rows), "clases", len(curric), "materias")


if __name__ == "__main__":
    main()
