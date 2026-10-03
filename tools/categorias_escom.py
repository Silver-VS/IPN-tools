"""Clasifica las materias de la ESCOM (plan 2020) en las categorías comunes (data/categorias.json).

Salida: data/unidades/escom/areas_<carrera>.json (formato del mapa por áreas: columnas por categoría, filas por
semestre, seriación del mapa oficial) y docs/CATEGORIAS-ESCOM.md (tabla para revisión).
Reglas explícitas por nombre, en orden; la primera que coincide define la categoría.

Uso:  python tools/categorias_escom.py
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
UNI = ROOT / "data" / "unidades" / "escom"
sys.path.insert(0, str(ROOT / "tools"))
from extract_mapa import norm

CAT = json.loads((ROOT / "data" / "categorias.json").read_text(encoding="utf-8"))
REGLAS = [   # (categoría, patrón sobre el nombre normalizado)
    ("prof", r"TRABAJO TERMINAL|ESTANCIA PROFESIONAL|METODOLOGIA DE LA INVESTIGACION"),
    ("integral", r"COMUNICACION ORAL|ETICA|FUNDAMENTOS ECONOMICOS|FINANZAS|LIDERAZGO|HABILIDADES SOCIALES|GESTION EMPRESARIAL|FORMULACION Y EVALUACION|ADMINISTRACION DE PROYECTOS"),
    ("redes", r"REDES DE COMPUTADORAS|COMUNICACIONES EN RED|SISTEMAS DISTRIBUIDOS|SERVICIOS EN RED"),
    ("ctrl", r"INSTRUMENTACION Y CONTROL"),
    ("elec", r"CIRCUITOS|ELECTRONICA|DISENO DIGITAL|SISTEMAS DIGITALES|ARQUITECTURA DE COMPUTADORAS|SISTEMAS EN CHIP|PROCESAMIENTO (DIGITAL )?DE SENALES"),
    ("fm", r"^MATEMATICAS|CALCULO|ALGEBRA|ANALISIS VECTORIAL|MECANICA Y ELECTROMAGNETISMO|ECUACIONES|PROBABILIDAD|^ESTADISTICA|METODOS NUMERICOS|PROCESOS ESTOCASTICOS|METODOS CUANTITATIVOS|ECONOMETRICOS"),
    ("comp", r"INGENIERIA DE SOFTWARE|APLICACIONES WEB|DESARROLLO DE APLICACIONES MOVILES|TECNOLOGIAS PARA (EL )?DESARROLLO"),
    ("datos", r"CIENCIA DE DATOS|BASES DE DATOS|INTELIGENCIA ARTIFICIAL|APRENDIZAJE|MINERIA|ANALITICA|VISUALIZACION|MODELADO PREDICTIVO|LENGUAJE NATURAL|SERIES DE TIEMPO|BIG DATA|VISION ARTIFICIAL|IMAGENES|RECONOCIMIENTO DE VOZ|REDES NEURONALES|BIOINSPIRADOS|ANALISIS DE DATOS"),
    ("comp", r"PROGRAMACION|ALGORITMOS|PARADIGMAS|TEORIA DE LA COMPUTACION|COMPILADORES|SISTEMAS OPERATIVOS|ANALISIS Y DISENO DE SISTEMAS|COMPUTO PARALELO|ALTO DESEMPENO"),
]
CARRERAS = {"A": "Licenciatura en Ciencia de Datos", "B": "Ingeniería en Inteligencia Artificial", "C": "Ingeniería en Sistemas Computacionales"}


def categoria(nombre):
    n = norm(nombre)
    return next((c for c, pat in REGLAS if re.search(pat, n)), None)


def main():
    doc = ["# Clasificación de las materias de la ESCOM por categoría (propuesta)", "",
           "Categorías comunes de `data/categorias.json`. Generado por `tools/categorias_escom.py`; para corregir una",
           "materia, ajusta las reglas del script. Pendiente de revisión por las academias.", ""]
    for c, carrera in CARRERAS.items():
        t = json.loads((UNI / f"trayectoria_{c}.json").read_text(encoding="utf-8"))
        bx = t["boxes"]
        areas = {k: {"nombre": CAT["categorias"][k]["nombre"], "claves": [], "espacios": []} for k in CAT["orden"] if k in CAT["categorias"]}
        sin = []
        slots = {}
        for i, b in enumerate(bx):
            if "clave" in b:
                k = categoria(b["nombre"])
                (areas[k]["claves"].append(b["clave"]) if k else sin.append(b["nombre"]))
            elif "slot" in b:
                nom = re.sub(r"\s+", " ", b["text"]).strip()
                nom = re.match(r"(Optativa\s+\w+)", nom).group(1) if re.match(r"Optativa\s+\w+", nom) else nom
                areas["esp"]["espacios"].append([nom, b["sem"]])
                slots[i] = "@" + nom
        if sin:
            raise SystemExit(f"{c}: sin categoría: {sin}")
        ser = []
        for e in t["edges"]:
            a = bx[e["s"]].get("clave") or slots.get(e["s"])
            d = bx[e["d"]].get("clave") or slots.get(e["d"])
            if a and d:
                ser.append([a, d])
        out = {"carrera": c, "plan": t.get("plan"), "estado": "Clasificación propuesta (tools/categorias_escom.py), pendiente de revisión por las academias.",
               "fuente_seriacion": t["fuente"], "areas": [a for a in areas.values() if a["claves"] or a["espacios"]], "seriacion": ser}
        (UNI / f"areas_{c}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
        nom = {b["clave"]: b["nombre"] for b in bx if "clave" in b}
        doc += [f"## {carrera} ({c})", "", "| Categoría | Materias |", "|---|---|"]
        for a in out["areas"]:
            ms = [f"{nom[k].capitalize()} ({k})" for k in sorted(a["claves"])] + [f"{n} — {s}.º" for n, s in a["espacios"]]
            doc.append(f"| {a['nombre']} | {'; '.join(ms)} |")
        doc.append("")
        print(c, {a["nombre"]: len(a["claves"]) + len(a["espacios"]) for a in out["areas"]}, len(ser), "seriaciones")
    (ROOT / "docs" / "CATEGORIAS-ESCOM.md").write_text("\n".join(doc), encoding="utf-8")


if __name__ == "__main__":
    main()
