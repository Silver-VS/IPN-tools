"""OCR local de temarios escaneados: PDF -> PNG (pypdfium2) -> glm-ocr (Ollama local). Nada sale de la máquina.
Uso desde la raíz: python tools/temarios_ocr.py <carpeta_pdf> [limite_paginas].
Requiere pypdfium2, Pillow y Ollama ya instalado con glm-ocr disponible en
http://127.0.0.1:11434. No descarga el modelo. Ejecútalo por carpeta de carrera.
Salida: <carpeta_pdf>/_ocr/<ruta>-p<N>.png/.txt y un .md por PDF, con páginas
separadas por ---. Reutiliza los .txt existentes; el límite cuenta páginas.
Una línea [n/M] por página. Para convertir los .md a datos SAES después:
python tools/temarios_extraer.py --recursos <raiz_upiita>.
"""
import base64, json, pathlib, re, sys, time, urllib.request
import pypdfium2 as pdfium
OLLAMA = "http://127.0.0.1:11434"; LADO = 2400

def recortar(t):
    lin = t.split("\n")
    for i in range(len(lin)):
        for k in range(1, 7):
            b = lin[i:i+k]
            if len(b) == k and any(x.strip() for x in b) and all(lin[i+j*k:i+(j+1)*k] == b for j in range(3)):
                return "\n".join(lin[:i+k]).rstrip()
    return t.rstrip()

def ocr(png, prompt):
    cuerpo = {"model": "glm-ocr", "stream": True, "think": False,
              "messages": [{"role": "user", "content": prompt, "images": [base64.b64encode(png.read_bytes()).decode()]}],
              "options": {"num_ctx": 16384, "temperature": 0, "num_predict": 6000, "repeat_penalty": 1.0}}
    req = urllib.request.Request(OLLAMA + "/api/chat", json.dumps(cuerpo).encode(), {"Content-Type": "application/json"})
    t, n = "", 0
    with urllib.request.urlopen(req, timeout=900) as r:
        for linea in r:
            d = json.loads(linea)
            if "error" in d: break
            t += d.get("message", {}).get("content", ""); n += 1
            if n % 40 == 0 and len(recortar(t)) < len(t.rstrip()): break
            if d.get("done"): break
    return recortar(t)

raiz = pathlib.Path(sys.argv[1]); lim = int(sys.argv[2]) if len(sys.argv) > 2 else 10**9
sal = raiz / "_ocr"; pdfs = sorted(p for p in raiz.rglob("*.pdf") if "_ocr" not in p.parts)
tareas = []
for p in pdfs:
    n = len(pdfium.PdfDocument(str(p)))
    tareas += [(p, i) for i in range(1, n+1)]
tareas = tareas[:lim]; M = len(tareas); t0 = time.time()
for k, (p, i) in enumerate(tareas, 1):
    base = sal / p.relative_to(raiz).with_suffix(""); base.parent.mkdir(parents=True, exist_ok=True)
    png = base.parent / f"{base.name}-p{i}.png"; txt = png.with_suffix(".txt")
    if not txt.exists():
        if not png.exists():
            pg = pdfium.PdfDocument(str(p))[i-1]; w, h = pg.get_size()
            pg.render(scale=LADO/max(w, h)).to_pil().convert("RGB").save(png)
        s = time.time(); t = ocr(png, "Text Recognition:")
        txt.write_text(t, encoding="utf-8")
        print(f"[{k}/{M}] {p.relative_to(raiz)} pág {i} · {len(t)} car · {time.time()-s:.0f} s", flush=True)
    else:
        print(f"[{k}/{M}] {p.relative_to(raiz)} pág {i} · caché", flush=True)
for p in pdfs:
    base = sal / p.relative_to(raiz).with_suffix("")
    partes = sorted(base.parent.glob(f"{base.name}-p*.txt"), key=lambda x: int(re.search(r"-p(\d+)\.txt$", x.name).group(1)))
    if partes: base.with_suffix(".md").write_text("\n\n---\n\n".join(x.read_text(encoding="utf-8") for x in partes), encoding="utf-8")
print(f"listo en {time.time()-t0:.0f} s", flush=True)
