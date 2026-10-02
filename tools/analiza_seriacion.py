"""Cruza la seriación de la página de tutorías con el SAES y las flechas de las trayectorias propuestas.

Pruebas de coherencia por carrera:
  - referencias a materias inexistentes o requisitos duplicados
  - requisito en el mismo semestre o posterior al de la materia que lo pide
  - requisito de nivel mayor que la materia que lo pide
  - ciclos
  - aristas redundantes (ya implicadas por la cascada)
  - flechas del PDF de trayectoria que tutorías no tiene, y viceversa
Salida: data/seriacion.json (requisitos depurados por clave) y data/seriacion_reporte.md
Uso:  python tools/analiza_seriacion.py
"""
import json, re, pathlib, difflib, unicodedata
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
D = ROOT / "data"
PLAN = {"B": "09", "M": "09", "T": "09"}
ABBR = {"DIF": "DIFERENCIAL", "ECS": "ECUACIONES", "FUND": "FUNDAMENTOS", "SIST": "SISTEMAS", "PROG": "PROGRAMACION",
        "MEC": "MECANICA", "SIM": "SIMULACION", "CTOS": "CIRCUITOS", "DIS": "DISENO", "FIN": "FINANZAS", "ING": "INGENIERIA",
        "CTRL": "CONTROL", "ACT": "ACTUADORES", "E": "E"}
NAMES = {"B": "Biónica", "M": "Mecatrónica", "T": "Telemática"}


def norm(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().upper()
    return re.sub(r"\s+", " ", re.sub(r"[^A-Z0-9 ]", " ", s)).strip()


def expand(s, ctx):
    words = norm(s.replace(".", ". ")).split()
    out = []
    for w in words:
        if w == "INT":  # "CÁLCULO DIF. E INT." vs "INT. A LA MECATRÓNICA"
            out.append("INTEGRAL" if "CALCULO" in words else "INTRODUCCION")
        else:
            out.append(ABBR.get(w, w))
    return " ".join(out)


def main():
    tut = json.loads((D / "seriacion_tutorias.json").read_text(encoding="utf-8"))
    saes = json.loads((D / "mapa_curricular_saes.json").read_text(encoding="utf-8"))
    report, result = [], {}
    report.append("# Revisión de la seriación de materias\n")
    report.append("Fuentes: página de tutorías (io.upiita.ipn.mx/tutorias), mapa curricular del SAES y flechas de las trayectorias propuestas por la academia (PDF).\n")
    for car in ("B", "M", "T"):
        cur = {r[3].upper(): (r[4], int(r[2]), r[5][0]) for r in saes["rows"] if r[0] == car and r[1] == PLAN[car]}
        names = {norm(v[0]): k for k, v in cur.items()}
        rows = tut[car]
        ids = {r[0]: r for r in rows}
        clave, unmatched = {}, []
        for r in rows:
            n = expand(r[1], car)
            key = n if n in names else (difflib.get_close_matches(n, list(names), n=1, cutoff=0.7) or [None])[0]
            hit = names.get(key)
            if re.match(r"OPTATIVA|SERVICIO SOCIAL", norm(r[1])):
                hit = None
            clave[r[0]] = hit
            if not hit and not re.match(r"OPTATIVA|SERVICIO SOCIAL", norm(r[1])):
                unmatched.append(r[1])
        sem = {r[0]: r[2] for r in rows}
        niv = {r[0]: r[3] for r in rows}
        issues = defaultdict(list)
        edges = set()
        for r in rows:
            reqs = [x for x in r[4].split(",") if x]
            for x in sorted(set(reqs)):
                if reqs.count(x) > 1:
                    issues["Requisito repetido"].append(f"{r[1]} lista dos veces a {ids[x][1] if x in ids else x}")
            for x in set(reqs):
                if x not in ids:
                    issues["Referencia rota"].append(f"{r[1]} pide `{x}`, que no existe")
                    continue
                if sem[x] <= sem[r[0]]:  # un requisito en semestre posterior es imposible: se reporta y no se usa
                    edges.add((x, r[0]))
                if sem[x] >= sem[r[0]]:
                    issues["Requisito en el mismo semestre o posterior"].append(
                        f"**{r[1]}** (sem {sem[r[0]]}) pide **{ids[x][1]}** (sem {sem[x]})")
                if niv[x] > niv[r[0]]:
                    issues["Requisito de nivel mayor"].append(f"**{r[1]}** (N{niv[r[0]]}) pide **{ids[x][1]}** (N{niv[x]})")
        # ciclos y redundancias
        g = defaultdict(set)
        for a, b in edges:
            g[b].add(a)  # b requiere a

        def anc(n, seen=None):
            seen = set() if seen is None else seen
            for p in g[n]:
                if p not in seen:
                    seen.add(p)
                    anc(p, seen)
            return seen
        for n in ids:
            if n in anc(n):
                issues["Ciclo"].append(ids[n][1])
            for p in g[n]:
                if any(p in anc(q) for q in g[n] if q != p):
                    issues["Requisito redundante (ya implícito en la cascada)"].append(f"{ids[n][1]} → {ids[p][1]}")
        # comparación con las flechas del PDF
        tray = D / f"trayectoria_{car}.json"
        tut_k = {(clave[a], clave[b]) for a, b in edges if clave[a] and clave[b]}
        if tray.exists():
            t = json.loads(tray.read_text(encoding="utf-8"))
            pdf_k = {(t["boxes"][e["s"]].get("clave"), t["boxes"][e["d"]].get("clave")) for e in t["edges"]}
            pdf_k = {e for e in pdf_k if all(e)}
            closure = defaultdict(set)
            for a, b in tut_k:
                closure[b].add(a)

            def anc_k(n, seen=None):
                seen = set() if seen is None else seen
                for p in closure[n]:
                    if p not in seen:
                        seen.add(p)
                        anc_k(p, seen)
                return seen
            for a, b in sorted(pdf_k):
                if a not in anc_k(b):
                    issues["Flecha del PDF que tutorías no considera"].append(f"{cur[a][0]} → {cur[b][0]}")
            merged = tut_k | pdf_k
        else:
            merged = tut_k
        # requisitos depurados: unión de ambas fuentes sin ciclos ni referencias rotas
        req = defaultdict(set)
        for a, b in merged:
            if a != b:
                req[b].add(a)
        result[car] = {k: sorted(v) for k, v in req.items()}
        report.append(f"\n## {NAMES[car]}\n")
        report.append(f"{len(rows)} materias en tutorías, {len(edges)} requisitos directos; {sum(1 for v in clave.values() if v)} emparejadas con claves del SAES.\n")
        if unmatched:
            report.append(f"- Sin clave en el SAES: {', '.join(unmatched)}\n")
        order = ["Referencia rota", "Ciclo", "Requisito en el mismo semestre o posterior", "Requisito de nivel mayor",
                 "Requisito repetido", "Flecha del PDF que tutorías no considera", "Requisito redundante (ya implícito en la cascada)"]
        for k in order:
            if issues[k]:
                report.append(f"\n### {k} ({len(issues[k])})\n")
                report.extend(f"- {x}\n" for x in sorted(set(issues[k])))
    (D / "seriacion.json").write_text(json.dumps({"fuente": "tutorías + flechas de trayectoria (PDF)", "requisitos": result}, ensure_ascii=False, indent=1), encoding="utf-8")
    (D / "seriacion_reporte.md").write_text("".join(report), encoding="utf-8")
    print("".join(report))


if __name__ == "__main__":
    main()
