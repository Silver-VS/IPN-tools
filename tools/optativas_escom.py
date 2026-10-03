"""Líneas de optativas de la ESCOM (plan 2020) -> data/unidades/escom/optativas.json.

- ISC (C): cada línea tiene una optativa de 6.º que da paso a una de 7.º. En el SAES los nombres vienen como
  «LÍNEA|MATERIA»; el nombre completo de cada línea sale del PDF de optativas.
- IIA (B) y LCD (A): tabla con las optativas de 6.º y de 7.º (PDF de optativas); cada nombre se empata con la
  clave del SAES del semestre correspondiente.

Uso:  python tools/optativas_escom.py
"""
import json, pathlib, re, difflib, sys
import pdfplumber

ROOT = pathlib.Path(__file__).resolve().parent.parent
UNI = ROOT / "data" / "unidades" / "escom"
PDF = ROOT / "ESCOM"
sys.path.insert(0, str(ROOT / "tools"))
from extract_mapa import norm

# prefijo del SAES -> nombre de la línea (PDF «Unidades de Aprendizaje Optativas» de ISC)
LINEAS_C = {
    "BIG DATA": "Big Data", "DES. DE APLIC": "Desarrollo de Aplicaciones", "MINERIA DE DATOS": "Minería de Datos",
    "INSTRUMENTAL VIRTUAL": "Instrumentación Virtual", "INTERNET DE LAS COSAS": "Internet de las Cosas",
    "GOBIERNO DE TI": "Gobierno de TI", "CRIPTOGRAFIA": "Criptografía", "PROC. DE LENG. NAT": "Procesamiento de Lenguaje Natural",
    "PROC. DE LENG": "Procesamiento de Lenguaje Natural", "ALGORITMOS BIOINSPIRADOS": "Algoritmos Bioinspirados",
    "COMPUTACION GRAFICA": "Computación Gráfica", "VISION POR COMPUTADORA": "Visión por Computadora",
    "SISTEMAS COMPLEJOS": "Sistemas Complejos", "GES. DE EMP. DE ALTA TEC": "Gestión de Empresas de Alta Tecnología",
    "TOPICOS SEL. DE COM": "Tópicos Selectos de Computación",
}


def main():
    m = json.loads((UNI / "mapa_curricular_saes.json").read_text(encoding="utf-8"))
    opt = lambda c: [r for r in m["rows"] if r[0] == c and r[1] == "20" and r[5].upper().startswith("OPT")]
    out = {"nombres_linea": LINEAS_C, "lineas": {}, "req": {}}

    # ISC: líneas por prefijo; seriación 6.º -> 7.º dentro de cada línea
    lin = {}
    for r in opt("C"):
        pre = r[4].split("|")[0].strip()
        lin.setdefault(LINEAS_C.get(pre, pre.title()), {})[int(r[2])] = r[3].upper()
    # área de conocimiento de cada línea (data/categorias.json): base para la afinidad del alumno con la línea
    CAT_LINEA = {"Algoritmos Bioinspirados": "Ciencia de datos e IA", "Big Data": "Ciencia de datos e IA", "Minería de Datos": "Ciencia de datos e IA",
                 "Procesamiento de Lenguaje Natural": "Ciencia de datos e IA", "Visión por Computadora": "Ciencia de datos e IA",
                 "Computación Gráfica": "Informática y computación", "Criptografía": "Informática y computación",
                 "Desarrollo de Aplicaciones": "Informática y computación", "Tópicos Selectos de Computación": "Informática y computación",
                 "Gestión de Empresas de Alta Tecnología": "Formación integral", "Gobierno de TI": "Comunicaciones y redes",
                 "Instrumentación Virtual": "Sistemas y control", "Internet de las Cosas": "Electrónica", "Sistemas Complejos": "Físico-matemáticas"}
    out["lineas"]["C"] = [{"area": "Optativas", "linea": n, "categoria": CAT_LINEA.get(n), "claves": [v[s] for s in sorted(v)]} for n, v in sorted(lin.items())]
    out["req"]["C"] = {v[7]: [v[6]] for v in lin.values() if 6 in v and 7 in v}

    # IIA y LCD: tabla 6.º | 7.º del PDF
    for c, f in (("B", "mapaCurricularIIA2020_optativas.pdf"), ("A", "mapaCurricularLCD2020_optativas.pdf")):
        rows = opt(c)
        with pdfplumber.open(PDF / f) as pdf:
            tab = [t for t in pdf.pages[0].extract_tables() if t][0]
        cols = {6: [], 7: []}
        for fila in tab:
            # celdas combinadas (None): la mitad izquierda de la fila es 6.º y la derecha, 7.º
            mitad = len(fila) // 2
            izq = next((x for x in fila[:mitad] if x and x.strip()), "")
            der = next((x for x in fila[mitad:] if x and x.strip()), "")
            for txt, sem in ((izq, 6), (der, 7)):
                if txt.strip() and not re.search(r"(?i)semestre|optativas", txt):
                    cols[sem].append(txt.strip())
        lineas = []
        for sem, nombres in cols.items():
            cand = [(norm(r[4]), r[3].upper()) for r in rows if int(r[2]) == sem]
            claves, faltan = [], []
            for n in nombres:
                hit = difflib.get_close_matches(norm(n), [x for x, _ in cand], n=1, cutoff=0.75)
                (claves.append(dict(cand)[hit[0]]) if hit else faltan.append(n))
            lineas.append({"area": "Optativas", "linea": f"{sem}.º semestre", "claves": claves})
            print(c, sem, len(claves), "empatadas", "sin clave:", faltan)
        out["lineas"][c] = lineas
    (UNI / "optativas.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("C", len(out["lineas"]["C"]), "líneas;", len(out["req"]["C"]), "seriaciones 6.º -> 7.º")


if __name__ == "__main__":
    main()
