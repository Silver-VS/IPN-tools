"""Extrae las fuentes oficiales declaradas en la Guía, sin OCR ni paráfrasis.

python tools/reglamentos.py reutiliza los PDF de .cache/reglamentos/.
--verificar descarga las mismas URL y compara SHA-256 sin sustituir la caché.
Requiere pdfplumber. sin_texto identifica PDF escaneados; sin_articulado
conserva en texto los documentos que no tienen artículos numerados.
Los márgenes corresponden a las ediciones enlazadas, no a futuros PDF:
un cambio de SHA requiere revisar la extracción antes de sustituir los datos.
"""
import argparse
from collections import Counter
from datetime import date
import hashlib
import json
import logging
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache/reglamentos'
DESTINO = ROOT / 'data/reglamentos'
LOG = logging.getLogger(__name__)


def fuentes():
    documentos = json.loads((ROOT / 'data/guia/upiita.json').read_text(encoding='utf-8'))['documentos']
    return {k: v for k, v in documentos.items() if v.get('reglamento') and k != 'calendario'}


class SoloFuentes(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if newurl != req.full_url:
            raise ValueError(f'Redirección fuera de la URL declarada: {newurl}')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def descargar(url):
    if url not in {f['url'] for f in fuentes().values()}:
        raise ValueError(f'URL no declarada: {url}')
    solicitud = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/pdf'})
    with urllib.request.build_opener(SoloFuentes).open(solicitud, timeout=90) as respuesta:
        pdf = respuesta.read()
    if not pdf.startswith(b'%PDF-'):
        raise ValueError(f'La respuesta no es PDF: {url}')
    return pdf


def paginas(ruta):
    import pdfplumber
    # Estas ediciones de Gaceta tienen dos columnas; dividir antes de extraer
    # evita intercalar frases de artículos distintos. RI, LO y Titulación son de una.
    columnas = ruta.stem in {'rge', 'ro', 'servicio_social', 'becas', 'subcomite_becas', 'honor'}
    salida = []
    with pdfplumber.open(ruta) as pdf:
        for numero, pagina in enumerate(pdf.pages, 1):
            if ruta.stem == 'rge' and not 6 <= numero <= 22:
                continue
            p = pagina.dedupe_chars() if ruta.stem == 'etica' else pagina
            p = p.filter(lambda obj: obj.get('upright', True))
            if columnas:
                superior = {'rge': 100, 'ro': 70, 'servicio_social': 100}.get(ruta.stem, 40)
                # Las portadillas a todo el ancho preceden a ambas columnas.
                if ruta.stem == 'rge' and numero == 6:
                    superior = 150
                if ruta.stem == 'becas' and numero == 3:
                    superior = 110
                if ruta.stem == 'ro' and numero == 3:
                    superior = 130
                inferior = pagina.height - (65 if ruta.stem in {'rge', 'servicio_social'} else 35)
                # Las firmas son de ancho completo; no deben mezclarse con la última columna.
                palabras = p.extract_words()
                for j, palabra in enumerate(palabras):
                    if palabra['top'] > superior and (
                            palabra['text'] == 'Dado' or
                            palabra['text'] == 'Ciudad' and j+3 < len(palabras) and
                            palabras[j+1]['text'] == 'de' and palabras[j+2]['text'] == 'México,' and
                            palabras[j+3]['text'] == 'a'):
                        inferior = min(inferior, palabra['top'] - 1)
                mitad = (311.8 if numero % 2 else 297.6) if ruta.stem == 'ro' else pagina.width / 2
                salida.append(p.crop((25, superior, mitad, inferior)).extract_text(x_tolerance=2) or '')
                salida[-1] += '\n' + (p.crop((mitad, superior, pagina.width-25, inferior)).extract_text(x_tolerance=2) or '')
            else:
                salida.append(p.extract_text(x_tolerance=2) or '')
    return salida


ARTICULO = re.compile(r'^Art[íi]culo\s+(\d+)(?:\s+(Bis|Ter|Qu[áa]ter))?(?:[.º°:\-–]+\s*|\s+(?=(?-i:[A-ZÁÉÍÓÚ]))|$)(.*)$', re.I)
CABECERA = re.compile(r'^(T[íi]tulo|Cap[íi]tulo|Secci[óo]n)\s+([IVXLCDM]+|\d+|Primer[oa]|Segund[oa]|Tercer[oa]|Cuart[oa]|Quint[oa]|Sext[oa]|S[ée]ptim[oa]|Octav[oa]|Noven[oa]|D[ée]cim[oa]|[ÚU]nic[oa])(?:[.:]?\s+(?-i:[A-ZÁÉÍÓÚ]).*)?$', re.I)
TRANSITORIOS = re.compile(r'^(?:ART[ÍI]CULOS?\s+)?TRANSITORIOS\b', re.I)
ORDINAL = re.compile(r'^(?:Art[íi]culo\s+)?(Primero|Segundo|Tercero|Cuarto|Quinto|Sexto|S[ée]ptimo|Octavo|Noveno|D[ée]cimo|[ÚU]nico|\d+)[.\-–]+\s*(.*)$', re.I)
RESTO = re.compile(r'^(?:/?\d+(?:\s+de\s+\d+)?|Gaceta Polit[ée]cnica(?:\s+\d+)?|Secretar[íi]a General|Secretar[íi]a de Servicios Parlamentarios|C[ÁA]MARA DE DIPUTADOS.*|LEY ORG[ÁA]NICA DEL INSTITUTO POLIT[ÉE]CNICO NACIONAL|R eglamento|A cuerdo|REGLAMENTO)$', re.I)


def limpiar(textos):
    # Sólo se detectan repeticiones en los márgenes, nunca por frecuencia en el cuerpo.
    bordes = Counter()
    for texto in textos:
        lineas = texto.splitlines()
        bordes.update(set(lineas[:4] + lineas[-4:]))
    repetidos = {s for s, n in bordes.items() if n >= 3 and len(s) < 120 and not CABECERA.match(s)}
    lineas = []
    for texto in textos:
        texto = re.sub(r'(?<=\S) +(?=Art[íi]culo\s+\d+[.])', '\n', texto)
        pagina = texto.splitlines()
        for i, linea in enumerate(pagina):
            linea = linea.strip()
            if (not linea or RESTO.fullmatch(linea) or '(cid:' in linea or
                    linea in repetidos and (i < 4 or i >= len(pagina)-4)):
                continue
            lineas.append(linea)
    return lineas


def unir(lineas):
    texto = '\n'.join(lineas)
    texto = re.sub(r'(?<=\w)-\n(?=[a-záéíóúüñ])', '', texto)
    return re.sub(r'(?<!\n)\n(?!\n)', ' ', texto).strip()


def subdividir(texto, patron, clave):
    marcas = list(re.finditer(patron, texto, re.M))
    salida = []
    for i, marca in enumerate(marcas):
        fin = marcas[i+1].start() if i+1 < len(marcas) else len(texto)
        item = {clave: marca[1], 'texto': unir(texto[marca.end():fin].splitlines())}
        if clave == 'fr':
            incisos = subdividir(texto[marca.end():fin], r'^\s*([a-z])\)\s+', 'inciso')
            if incisos:
                item['incisos'] = incisos
        salida.append(item)
    return salida


def extraer(textos):
    lineas = limpiar(textos)
    articulos, transitorios, estructura = [], [], []
    pila = []
    actual = None
    cuerpo = []
    trans = False
    iniciado = False

    def terminar():
        if actual is None:
            return
        actual['texto'] = unir(cuerpo)
        epigrafe = re.match(r'^(De (?:la|las|los|el) [^.]{1,90})\. (?=El |La |Los |Las |En )', actual['texto'])
        if epigrafe:
            actual['titulo'] = epigrafe[1]
        fracciones = subdividir('\n'.join(cuerpo), r'^\s*([IVXLCDM]+)\s*[.\)]-?\s+', 'fr')
        if fracciones:
            actual['fracciones'] = fracciones
        incisos = subdividir('\n'.join(cuerpo), r'^\s*([a-z])\)\s+', 'inciso')
        if incisos and not fracciones:
            actual['incisos'] = incisos

    for linea in lineas:
        if trans and re.match(r'^(?:Aprobado por el|México, D\.?\s*F\.?|Dado en |Ciudad de México, a |[“"]LA TÉCNICA)', linea, re.I):
            terminar()
            actual, cuerpo = None, []
            break
        if TRANSITORIOS.match(linea):
            if iniciado:
                terminar()
                actual, cuerpo, trans = None, [], True
            continue
        encabezado = CABECERA.match(linea)
        if encabezado and not trans:
            terminar()
            actual, cuerpo = None, []
            nivel = {'t': 0, 'c': 1, 's': 2}[encabezado[1][0].lower()]
            while pila and pila[-1][0] >= nivel:
                pila.pop()
            nodo = {'titulo': linea, 'articulos': [], 'hijos': []}
            (pila[-1][1]['hijos'] if pila else estructura).append(nodo)
            pila.append((nivel, nodo))
            continue
        marca = ORDINAL.match(linea) if trans else ARTICULO.match(linea)
        if marca:
            if not trans and not iniciado and marca[1] != '1':
                continue
            terminar()
            iniciado = True
            n = marca[1] if trans else marca[1] + (' ' + marca[2].title() if marca[2] else '')
            actual = {'n': n, 'ubicacion': [] if trans else [p[1]['titulo'] for p in pila], 'texto': ''}
            (transitorios if trans else articulos).append(actual)
            cuerpo = [marca[2] if trans else marca[3]]
            if not trans:
                for _, nodo in pila:
                    nodo['articulos'].append(n)
            continue
        if actual is not None:
            cuerpo.append(linea)
        elif pila and not trans:
            # El epígrafe del capítulo suele ocupar un renglón separado.
            pila[-1][1]['titulo'] += ' ' + linea
    terminar()

    def rangos(nodos):
        for nodo in nodos:
            nodo['hijos'] = [h for h in nodo['hijos'] if h['articulos']]
            nums = nodo['articulos']
            nodo['articulos'] = {'desde': nums[0], 'hasta': nums[-1]} if nums else None
            rangos(nodo['hijos'])
    # El índice de la Gaceta precede al articulado y no pertenece al árbol.
    estructura = [n for n in estructura if n['articulos']]
    rangos(estructura)
    return articulos, transitorios, estructura


def validar(documento):
    articulos = documento['articulos']
    numeros = [int(a['n'].split()[0]) for a in articulos if ' ' not in a['n']]
    if numeros and numeros != list(range(1, max(numeros)+1)):
        raise ValueError(f'{documento["id"]}: secuencia incompleta o duplicada: {numeros}')
    ids = [a['n'] for a in articulos]
    if len(ids) != len(set(ids)) or any(int(n.split()[0]) not in numeros for n in ids):
        raise ValueError(f'{documento["id"]}: numeración Bis sin base o duplicada: {ids}')
    for a in articulos + documento['transitorios']:
        if not a['texto'].strip():
            raise ValueError(f'{documento["id"]}: artículo vacío: {a["n"]}')
        if (re.search(r'\(cid:|Gaceta Politécnica \d|oremúN|oiranidroartxE|Página\s+\d+|CÁMARA DE DIPUTADOS|Secretaría de Servicios Parlamentarios|ERAL DE ESTUDIOS|PARA EL ALUMNADO', a['texto'])
                or any(RESTO.fullmatch(s.strip()) for s in a['texto'].splitlines())):
            raise ValueError(f'{documento["id"]}: restos de página en {a["n"]}')


def guardar(ruta, datos):
    ruta.write_text(json.dumps(datos, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verificar', action='store_true', help='Descarga y compara SHA-256 sin modificar datos ni caché')
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format='%(levelname)s %(message)s')
    CACHE.mkdir(parents=True, exist_ok=True)
    DESTINO.mkdir(parents=True, exist_ok=True)
    indice = []
    documentos = []
    errores = []
    for id_, fuente in fuentes().items():
        ruta = CACHE / f'{id_}.pdf'
        LOG.info('%s: %s', id_, fuente['url'])
        if args.verificar:
            digest = hashlib.sha256(descargar(fuente['url'])).hexdigest()
            previo = json.loads((DESTINO / f'{id_}.json').read_text(encoding='utf-8'))
            if digest != previo['sha256']:
                errores.append(f'{id_}: SHA-256 cambió: {previo["sha256"]} -> {digest}')
                LOG.error('%s', errores[-1])
            else:
                LOG.info('%s: SHA-256 OK %s', id_, digest)
            continue
        if not ruta.exists():
            LOG.info('%s: descargando PDF', id_)
            ruta.write_bytes(descargar(fuente['url']))
        else:
            LOG.info('%s: caché %s', id_, ruta.relative_to(ROOT))
        textos = paginas(ruta)
        (CACHE / f'{id_}.txt').write_text('\n\f\n'.join(textos), encoding='utf-8')
        LOG.info('%s: %s páginas, %s caracteres', id_, len(textos), sum(map(len, textos)))
        articulos, transitorios, estructura = extraer(textos)
        documento = {k: fuente[k] for k in ('titulo', 'url', 'gaceta')}
        documento.update(id=id_, sha256=hashlib.sha256(ruta.read_bytes()).hexdigest(),
                         extraido_el=date.today().isoformat(), estructura=estructura,
                         articulos=articulos, transitorios=transitorios)
        entrada = {'id': id_, 'titulo': fuente['titulo'], 'articulos': len(articulos), 'url': fuente['url']}
        if sum(len(re.findall(r'[a-záéíóúñ]{3,}', t, re.I)) for t in textos) < 20:
            documento['sin_texto'] = entrada['sin_texto'] = True
            LOG.warning('%s: sin texto normativo extraíble; no se usa OCR', id_)
        elif not articulos:
            documento['texto'] = unir(limpiar(textos))
            documento['sin_articulado'] = entrada['sin_articulado'] = True
            LOG.warning('%s: texto disponible sin artículos numerados', id_)
        try:
            validar(documento)
        except ValueError as error:
            errores.append(str(error))
        documentos.append(documento)
        indice.append(entrada)
        LOG.info('%s: %s artículos, %s transitorios', id_, len(articulos), len(transitorios))
    if errores:
        raise ValueError('\n'.join(errores))
    if not args.verificar:
        for documento in documentos:
            guardar(DESTINO / f'{documento["id"]}.json', documento)
        guardar(DESTINO / 'indice.json', indice)


if __name__ == '__main__':
    main()
