"""Transcripción OCR local de los reglamentos escaneados (Ollama + glm-ocr), revisable a mano.

Uso: con Ollama corriendo en 127.0.0.1:11434 y el modelo glm-ocr, `python tools/ocr_reglamentos.py <id> [<id>…]`
(p. ej. equivalencias cambio_carrera). Lee .cache/reglamentos/<id>.pdf (lo descarga tools/reglamentos.py) y escribe
data/reglamentos/ocr/<id>.txt: primera línea `sha256: <hex del PDF>` y las páginas separadas por salto de página.
Requiere pypdfium2. Corta cada página en bandas por renglones en blanco y, si el modelo se cicla, parte la banda.
Después: revisar el texto contra el PDF y correr `python tools/reglamentos.py`."""
import base64, io, json, re, sys, time, urllib.request, urllib.error
import pypdfium2 as pdfium

URL = 'http://127.0.0.1:11434/api/generate'
SALTO = '\n\f\n'  # separador de páginas, igual que tools/reglamentos.py

def ocr(img):
    buf = io.BytesIO(); img.save(buf, format='PNG')
    c = json.dumps({'model': 'glm-ocr', 'prompt': 'Text Recognition:', 'images': [base64.b64encode(buf.getvalue()).decode()],
                    'stream': False, 'options': {'temperature': 0, 'num_ctx': 16384, 'num_predict': 1500}}).encode()
    r = urllib.request.urlopen(urllib.request.Request(URL, c, {'Content-Type': 'application/json'}), timeout=900)
    return sin_bucles(json.loads(r.read())['response'])

def sin_bucles(texto):
    """Quita cercas de markdown y corta donde el modelo empieza a repetirse (un renglón largo que vuelve a salir)."""
    vistos, salida = set(), []
    for linea in texto.splitlines():
        l = linea.strip()
        if l.startswith('```') or l == '---':
            continue
        if len(l) > 15:
            if l in vistos:
                break
            vistos.add(l)
        salida.append(linea.rstrip())
    return '\n'.join(salida).strip()

def cortes_blancos(gris, desde, hasta):
    """Filas sin tinta entre desde y hasta (proyección horizontal)."""
    w, _ = gris.size
    px = gris.load()
    blancas = []
    for y in range(desde, hasta):
        if all(px[x, y] > 200 for x in range(0, w, 3)):
            blancas.append(y)
    return blancas

def bandas(gris, alto_max):
    _, h = gris.size
    y, res = 0, []
    while y < h:
        fin = min(h, y + alto_max)
        if fin < h:
            b = cortes_blancos(gris, y + alto_max // 2, fin)
            if b: fin = b[-1]
        res.append((y, fin)); y = fin
    return res

def leer(img, y0, y1, nivel=0):
    trozo = img.crop((0, y0, img.size[0], y1))
    if trozo.convert('L').getextrema()[0] > 200:  # banda en blanco
        return ''
    try:
        return ocr(trozo)
    except urllib.error.HTTPError as e:
        if nivel >= 3 or y1 - y0 < 120:
            print(f'    banda {y0}-{y1} ilegible ({e.code}); se omite', flush=True)
            return '[ilegible]'
        gris = trozo.convert('L')
        b = cortes_blancos(gris, (y1 - y0) // 3, 2 * (y1 - y0) // 3)
        m = y0 + (b[len(b) // 2] if b else (y1 - y0) // 2)
        return (leer(img, y0, m, nivel + 1) + '\n' + leer(img, m, y1, nivel + 1)).strip()


PIE = re.compile(r'Unidad Profesional .Adolfo L|Zacatenco|www\.ipn\.mx|abogadogeneral\.ipn\.mx|^\*\d+ Aniversario', re.I)


def limpiar_pagina(texto):
    """Ruido típico del OCR por bandas: pies de página, renglones repetidos (bandas que se leyeron dos veces)
    y rachas de un mismo renglón corto («j.»). No corrige palabras: el texto sigue siendo la transcripción."""
    vistos, salida, anterior = set(), [], None
    for linea in texto.splitlines():
        l = linea.strip()
        clave = re.sub(r'^[•\-–*]\s*', '', l)
        if PIE.search(l) or (l and l == anterior):
            continue
        if len(clave) > 15:
            if clave in vistos:
                continue
            vistos.add(clave)
        salida.append(linea.rstrip())
        anterior = l or anterior
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(salida)).strip()


def transcribir(pdf, salida, digest):
    doc = pdfium.PdfDocument(str(pdf))
    paginas = []
    for i in range(len(doc)):
        t = time.time()
        img = doc[i].render(scale=200 / 72).to_pil().convert('RGB')
        w, h = img.size
        img = img.crop((int(w * .06), int(h * .05), int(w * .94), int(h * .95)))
        partes = [leer(img, a, b) for a, b in bandas(img.convert('L'), img.size[1] // 4)]
        paginas.append(limpiar_pagina('\n'.join(p for p in partes if p)))
        print(f'[{i + 1}/{len(doc)}] {len(paginas[-1])} caracteres, {time.time() - t:.0f} s', flush=True)
        salida.write_text(f'sha256: {digest}\n' + SALTO.join(paginas) + '\n', encoding='utf-8')


if __name__ == '__main__':
    import hashlib
    from pathlib import Path
    raiz = Path(__file__).resolve().parents[1]
    (raiz / 'data/reglamentos/ocr').mkdir(parents=True, exist_ok=True)
    if sys.argv[1:2] == ['--limpiar']:  # vuelve a limpiar transcripciones ya hechas, sin repetir el OCR
        for id_ in sys.argv[2:]:
            ruta = raiz / 'data/reglamentos/ocr' / f'{id_}.txt'
            cabecera, _, cuerpo = ruta.read_text(encoding='utf-8').partition('\n')
            ruta.write_text(cabecera + '\n' + SALTO.join(map(limpiar_pagina, cuerpo.split(SALTO))) + '\n', encoding='utf-8')
            print('limpio', id_)
        sys.exit()
    for id_ in sys.argv[1:]:
        pdf = raiz / '.cache/reglamentos' / f'{id_}.pdf'
        print('==', id_, flush=True)
        transcribir(pdf, raiz / 'data/reglamentos/ocr' / f'{id_}.txt', hashlib.sha256(pdf.read_bytes()).hexdigest())
