"""Índice fragmentado de la Guía y extracción conservadora de referencias, sin red.

Las posiciones siempre cuentan caracteres Unicode del texto original; no se normaliza
ni se corrige la transcripción. El consumidor envuelve esas posiciones en el DOM.
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def leer(p):
    return json.loads(p.read_text(encoding='utf-8'))


def escribir(p, d):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')


def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if not unicodedata.combining(c)).lower()


def compactar(entradas):
    """Diccionario de cadenas: evita repetir nombres, carreras y migas por fragmento."""
    cadenas, ids = [], {}
    def indice(s):
        s = s or ''
        if s not in ids:
            ids[s] = len(cadenas)
            cadenas.append(s)
        return ids[s]
    campos = ['titulo', 'texto', 'ruta', 'doc', 'carrera', 'carreraNombre', 'materia', 'oficial']
    filas = []
    for e in entradas:
        fila = [*[indice(e.get(k, '')) if k != 'texto' or not e.get('textoBase') else None for k in campos], [indice(x) for x in e['migas']]]
        if e.get('textoBase'):
            inicio = e['textoBase'].find(e['texto'])
            fila[1] = [indice(e['textoBase']), inicio, inicio + len(e['texto'])] if inicio >= 0 else indice(e['texto'])
        filas.append(fila)
    return {'cadenas': cadenas, 'filas': filas}


def extraer(registros):
    """Resuelve solo destinos presentes y únicos; no adivina artículos inexistentes."""
    resueltas, ambiguas, externas = [], [], []
    alias_path = ROOT / 'data/referencias/alias_reglamentos.json'
    alias_data = leer(alias_path) if alias_path.exists() else {'alias': {}}
    alias = {norm(nombre): destino for destino, nombres_alias in alias_data.get('alias', {}).items() for nombre in nombres_alias}
    nombres = {norm(r['titulo']).removesuffix(' del ipn'): k for k, r in registros.items()}
    patron = re.compile(r'(?:fracci[oó]n\s+([IVXLCDM]+)\s+del\s+)?art[ií]culo\s+(\d+(?:\s+Bis)?|anterior|siguiente)(?:\s*,?\s*fracci[oó]n\s+([IVXLCDM]+))?(?:\s+(?:del?|de la)\s+((?:Reglamento|Ley|C[oó]digo|Lineamientos)[^.;:\n]*))?', re.I)
    for doc, reg in registros.items():
        for a in reg.get('articulos', []):
            texto = a['texto']
            for m in patron.finditer(texto):
                fr, n, fr2, nombre = m.groups()
                destino, motivo = doc, None
                fin = m.end()
                if nombre and not norm(nombre).startswith('reglamento se'):
                    alias_destinos = {d for nombre_alias, d in alias.items() if norm(nombre).startswith(nombre_alias) and (len(norm(nombre)) == len(nombre_alias) or norm(nombre)[len(nombre_alias)] in ' ,')}
                    if len(alias_destinos) == 1:
                        destino = next(iter(alias_destinos))
                        if destino not in registros or not registros[destino].get('articulos'):
                            continue
                    candidatos = [k for titulo, k in nombres.items() if norm(nombre).startswith(titulo) and (len(norm(nombre)) == len(titulo) or norm(nombre)[len(titulo)] in ' ,')]
                    if len(candidatos) == 1:
                        destino = candidatos[0]
                        titulo = next(t for t, k in nombres.items() if k == destino)
                        resto = nombre[len(titulo):]
                        sufijo = re.match(r' del (?:IPN|Instituto Polit[eé]cnico Nacional)\b', resto, re.I)
                        if resto.startswith(' del ') and not sufijo:
                            motivo = 'Denominación de documento no identificada'
                        fin = m.start(4) + len(titulo) + (sufijo.end() if sufijo else 0)
                    elif norm(nombre).strip() not in ('reglamento', 'reglamento interno', 'ley'):
                        motivo = 'Documento no identificado de forma única'
                    elif norm(nombre).strip() != 'reglamento':
                        candidatos = [k for titulo, k in nombres.items() if titulo.startswith(norm(nombre).strip())]
                        if len(candidatos) == 1:
                            destino = candidatos[0]
                        else:
                            motivo = 'Nombre abreviado ambiguo'
                if n.lower() in ('anterior', 'siguiente'):
                    # La numeración contigua no basta si hay Bis o cambio de documento.
                    arts = reg.get('articulos', [])
                    i = arts.index(a) + (-1 if n.lower() == 'anterior' else 1)
                    if destino == doc and 0 <= i < len(arts):
                        n = arts[i]['n']
                    else:
                        motivo = 'Artículo relativo fuera del documento'
                n = str(n)
                objetivo = next((x for x in registros[destino].get('articulos', []) if str(x['n']).lower() == n.lower()), None)
                fr = (fr or fr2 or '').upper()
                if not objetivo:
                    motivo = motivo or 'Artículo no disponible'
                elif fr and not any(f['fr'] == fr for f in objetivo.get('fracciones', [])):
                    motivo = 'Fracción no disponible'
                elif fr and sum(f['fr'] == fr for f in objetivo.get('fracciones', [])) > 1:
                    motivo = 'Numeración de fracción repetida en el artículo de destino'
                # Las enumeraciones requieren resolver todos sus miembros conjuntamente.
                if re.match(r'\s*(?:,\s*\d|y\s+\d|a\s+\d)', texto[fin:]):
                    motivo = 'Enumeración de artículos sin destino único'
                if re.search(r'p[aá]rrafo\s+\w+\s+del\s+$', texto[:m.start()], re.I):
                    motivo = 'Párrafo sin ancla documental verificable'
                relativo = re.match(r'\s+de(?:l| la)?\s+(?:este|presente|mismo|presente)\s+(?:Reglamento|ordenamiento|Ley)\b', texto[fin:], re.I)
                if relativo:
                    fin += relativo.end()
                if re.match(r'\s+de(?:l| la)?\s+dich[oa]\b', texto[fin:], re.I):
                    motivo = 'Documento referido por antecedente no identificado'
                entrada = {'doc': doc, 'articulo': str(a['n']), 'inicio': m.start(), 'fin': fin, 'texto': texto[m.start():fin]}
                if motivo:
                    ambiguas.append({**entrada, 'motivo': motivo})
                else:
                    regla = 'alias explícito de documento' if nombre else 'número literal en el documento'
                    if n.lower() in ('anterior', 'siguiente'):
                        regla = 'artículo relativo adyacente en el mismo documento'
                    resueltas.append({**entrada, 'destino': destino, 'n': str(objetivo['n']), 'fr': fr, 'regla': regla})
            # Las alusiones sin número no tienen un destino de artículo demostrable.
            for m in re.finditer(r'\b(?:p[aá]rrafo (?:anterior|siguiente)|art[ií]culos\s+\d+[^.;]*)', texto, re.I):
                if not any(x['doc'] == doc and x['articulo'] == str(a['n']) and x['inicio'] <= m.start() < x['fin'] for x in resueltas):
                    registro = {'doc': doc, 'articulo': str(a['n']), 'inicio': m.start(), 'fin': m.end(), 'texto': m.group()}
                    ambiguas.append({**registro, 'motivo': 'Alusión sin destino único de artículo o párrafo'})
            for destino, nombres_alias in alias_data.get('alias', {}).items():
                if destino in registros and registros[destino].get('articulos'):
                    continue
                for nombre_alias in nombres_alias:
                    for m in re.finditer(re.escape(nombre_alias), texto, re.I):
                        externas.append({'doc': doc, 'articulo': str(a['n']), 'inicio': m.start(), 'fin': m.end(), 'texto': m.group(), 'documento': registros[destino]['titulo'] if destino in registros else nombre_alias})
    unicas = {}
    for e in externas:
        k = (e['doc'], e['articulo'], e['inicio'])
        if k not in unicas or e['fin'] > unicas[k]['fin']:
            unicas[k] = e
    externas = list(unicas.values())
    ambiguas = [x for x in ambiguas if not any(r['doc'] == x['doc'] and r['articulo'] == x['articulo'] and r['inicio'] == x['inicio'] for r in resueltas) and not any(e['doc'] == x['doc'] and e['articulo'] == x['articulo'] and x['inicio'] <= e['inicio'] < x['fin'] for e in externas)]
    return {'resueltas': resueltas, 'externas': externas, 'ambiguas': ambiguas}


def referencias():
    registros = {p.stem: leer(p) for p in sorted((ROOT / 'data/reglamentos').glob('*.json')) if p.stem != 'indice'}
    return extraer(registros)


def generar(datos, unidad):
    """Cada fuente se descarga solo al iniciar una consulta que la necesita."""
    guia = leer(datos / 'guia.json')
    import contenido
    from urllib.parse import quote
    textos = contenido.objeto_t()
    configuracion = leer(ROOT / 'data/sate.json')
    base = '#/' + unidad + '/guia/'
    fuentes = {k: [] for k in ('preguntas', 'programas', 'reglamentos', 'acudir', 'actividades', 'formatos', 'calendario')}
    def agregar(f, titulo, texto, ruta, migas, **meta):
        fuentes[f].append({'titulo': titulo, 'texto': texto, 'ruta': ruta, 'migas': migas, **meta})
    for p in guia.get('preguntas', []):
        ruta = base + p['apartado'] + '/' + p['id']
        agregar('preguntas', p['pregunta'], ' '.join([p.get('respuesta', ''), *p.get('pasos', []), *p.get('palabras', [])]), ruta, [p['apartado'], p['pregunta']])
        if p.get('formato') or p.get('ventanilla'):
            agregar('formatos', p['pregunta'], p.get('respuesta', ''), ruta, ['formatos', p['pregunta']])
    for clave, g in guia.get('glosario', {}).items():
        agregar('preguntas', g['termino'], g['definicion'], base + 'glosario/' + clave, ['glosario', g['termino']])
    for r in guia.get('orientacion', {}).get('rutas', []):
        titulo = textos.get('sate.guia.nueva.' + r['id'], r['id'])
        texto = textos.get('sate.guia.nueva.' + r['id'] + '_detalle', '')
        texto += ' ' + ' '.join(p['pregunta'] for p in guia['preguntas'] if p['id'] in r.get('preguntas', []))
        agregar('preguntas', titulo, texto, base + 'ruta/' + r['id'], ['ruta', titulo])
    for tramite in configuracion['unidades'][unidad].get('tramites', []):
        clave = 'sate.tramite.' + tramite + '.'
        titulo = textos.get(clave + 'titulo', tramite)
        agregar('formatos', titulo, ' '.join(v for k, v in textos.items() if k.startswith(clave)), '#/' + unidad + '/tramites/' + tramite, ['formatos', titulo])
    for a in guia.get('acudir', []):
        ruta = base + 'acudir/' + a['id']
        agregar('acudir', a['nombre'], a.get('para', ''), ruta, ['acudir', a['nombre']])
        for i, f in enumerate(a.get('funciones', [])):
            agregar('acudir', a['nombre'], f['texto'], ruta + '?funcion=' + str(i + 1), ['acudir', a['nombre'], str(i + 1)], oficial=a.get('fuente', {}).get('doc'))
    for a in guia.get('estructuraCentral', []):
        if any(x['id'] == a['id'] for x in guia.get('acudir', [])):
            continue
        nombre = textos.get(a.get('nombreClave', ''), a.get('nombre', ''))
        para = textos.get(a.get('paraClave', ''), a.get('para', ''))
        agregar('acudir', nombre, para, base + 'acudir/' + a['id'], ['acudir', nombre])
    for i, a in enumerate(guia.get('actividades', {}).get('elementos', [])):
        agregar('actividades', a['nombre'], ' '.join(str(a.get(k, '')) for k in ('ofrece', 'requisitos', 'inscripcion', 'donde')), base + 'actividades/' + a['categoria'] + '?actividad=' + str(i + 1), ['actividades', a['nombre']])
    indice = leer(datos / 'temarios/indice.json') if (datos / 'temarios/indice.json').exists() else {}
    for carrera, c in indice.get('carreras', {}).items():
        p = datos / 'temarios' / (carrera + '.json')
        if not p.exists():
            continue
        d = leer(p)
        for m in d['materias']:
            ruta = base + 'programas/' + carrera + '/' + m['clave']
            meta = {'carrera': carrera, 'carreraNombre': c['nombre'], 'materia': m['clave'], 'oficial': m.get('pdf', 'programa:' + m['clave'])}
            for seccion in ('objetivo', 'orientacion', 'evaluacion'):
                agregar('programas', m['nombre'], m.get(seccion, ''), ruta + '/' + seccion, ['programas', c['nombre'], m['nombre'], seccion], **meta)
            for i, u in enumerate(m.get('contenidos', [])):
                agregar('programas', m['nombre'], ' '.join([u['titulo'], *u.get('subtemas', [])]), ruta + '/unidad-' + str(i + 1), ['programas', c['nombre'], m['nombre'], u['titulo']], **meta)
            for b in m.get('bibliografia', []):
                agregar('programas', m['nombre'], b.get('texto', ''), ruta + '/bibliografia', ['programas', c['nombre'], m['nombre'], 'bibliografia'], **meta)
    for p in sorted((ROOT / 'data/reglamentos').glob('*.json')):
        if p.stem == 'indice':
            continue
        r = leer(p)
        for a in r.get('articulos', []):
            ruta = base + 'reglamentos/' + p.stem + '/art-' + str(a['n'])
            meta = {'doc': p.stem, 'oficial': p.stem}
            agregar('reglamentos', r['titulo'], a['texto'], ruta, [r['titulo'], *a.get('ubicacion', []), 'Art. ' + str(a['n'])], **meta)
            for i, f in enumerate(a.get('fracciones', [])):
                repetida = sum(x['fr'] == f['fr'] for x in a['fracciones']) > 1
                destino = ruta + '.' + f['fr'] + ('?frpos=' + str(i + 1) if repetida else '')
                agregar('reglamentos', r['titulo'], f['texto'], destino, [r['titulo'], 'Art. ' + str(a['n']), f['fr']], textoBase=a['texto'], **meta)
        for a in r.get('transitorios', []):
            agregar('reglamentos', r['titulo'], a['texto'], base + 'reglamentos/' + p.stem + '/transitorios', [r['titulo'], 'transitorios'], doc=p.stem, oficial=p.stem)
        if r.get('texto'):
            agregar('reglamentos', r['titulo'], r['texto'], base + 'reglamentos/' + p.stem + '/texto', [r['titulo']], doc=p.stem, oficial=p.stem)
    calendario = leer(ROOT / 'data/calendario_ipn.json')
    locales = leer(ROOT / 'data/calendario.json').get(unidad, {})
    for e in [*calendario.get('eventos', []), *locales.get('eventos', []), *locales.get('actividades', [])]:
        titulo = e.get('titulo', e.get('nombre', ''))
        agregar('calendario', titulo, ' '.join(str(e.get(k, '')) for k in ('desde', 'hasta', 'descripcion')), '#/' + unidad + '/calendario?fecha=' + e.get('desde', '') + '&evento=' + quote(titulo), ['calendario', titulo], oficial='calendario_ipn')
    manifiesto = {'fuentes': {}, 'carreras': {k: v['nombre'] for k, v in indice.get('carreras', {}).items()}, 'letras': {k: v['letra'] for k, v in indice.get('carreras', {}).items()}, 'orientacion': guia.get('orientacion', {})}
    nombres_migas = {k: textos.get('sate.guia.busqueda.' + k, k) for k in fuentes}
    nombres_migas.update({a['id']: textos.get(a['titulo'], a['id']) for a in configuracion['guia']})
    nombres_migas.update({'ruta': textos['sate.pestana.guia.titulo'], 'glosario': textos['sate.guia.glosario']})
    for fuente, entradas in fuentes.items():
        for e in entradas:
            if e['migas']:
                e['migas'][0] = nombres_migas.get(e['migas'][0], e['migas'][0])
        grupos = {}
        for e in entradas:
            clave = e.get('doc') if fuente == 'reglamentos' else e.get('carrera') if fuente == 'programas' else fuente
            grupos.setdefault(clave, []).append(e)
        partes = []
        for clave, filas in grupos.items():
            nombre = fuente + '-' + clave + '.json'
            archivo = datos / 'busqueda' / nombre
            escribir(archivo, compactar(filas))
            partes.append({'archivo': nombre, 'clave': clave, 'bytes': archivo.stat().st_size})
        manifiesto['fuentes'][fuente] = {'partes': partes, 'entradas': len(entradas), 'bytes': sum(p['bytes'] for p in partes)}
    escribir(datos / 'busqueda/indice.json', manifiesto)
    vigentes = {'indice.json', *(p['archivo'] for f in manifiesto['fuentes'].values() for p in f['partes'])}
    for anterior in (datos / 'busqueda').glob('*.json'):
        if anterior.name not in vigentes:
            anterior.unlink()
    # Se publica el artefacto revisable, no una extracción distinta al informe guardado.
    escribir(datos.parent / 'referencias.json', leer(ROOT / 'data/referencias/reglamentos.json'))
    escribir(datos / 'referencias-externas.json', leer(ROOT / 'data/referencias/externas.json'))
    return manifiesto


if __name__ == '__main__':
    refs = referencias()
    escribir(ROOT / 'data/referencias/reglamentos.json', refs['resueltas'])
    escribir(ROOT / 'data/referencias/externas.json', refs['externas'])
    escribir(ROOT / 'docs/referencias-ambiguas.json', refs['ambiguas'])
    nuevas = []
    ambiguas_iniciales = 87
    dudosas_iniciales = ambiguas_iniciales - len(nuevas) - len(refs['externas'])
    lineas = ['# Referencias cruzadas revisadas', '', f"(a) Enlazables entre las 87 ambiguas: {len(nuevas)}", f"(b) Externas: {len(refs['externas'])}", f"(c) Dudosas: {dudosas_iniciales}", '', '## Destinos enlazables', '']
    for r in nuevas:
        lineas.append(f"- `{r['doc']}` art. {r['articulo']}: «{r['texto']}» → `{r['destino']}` art. {r['n']}" + (f" fr. {r['fr']}" if r['fr'] else '') + f". Regla: {r['regla']}.")
    escribir(ROOT / 'docs/referencias-resueltas.md', '\n'.join(lineas) + '\n')
    print('Referencias:', len(refs['resueltas']), 'resueltas;', len(refs['externas']), 'externas;', len(refs['ambiguas']), 'ambiguas')
