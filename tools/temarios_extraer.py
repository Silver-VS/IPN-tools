"""Extrae temarios OCR locales sin red, modelos ni dependencias externas.

Uso: python tools/temarios_extraer.py [--recursos RUTA]
La raíz predeterminada es recursos/temarios/upiita del proyecto UPIITA_DEV.
Escribe data/temarios/upiita/{bionica,mecatronica,telematica}.json y
docs/TEMARIOS.md. Conserva los OCR y PDF originales; no procesa imágenes.
Las rutas de fuente son relativas a esa raíz. Las ausencias no se completan
con datos del SAES: este solo aporta identidad, plan, nivel y tipo.
"""
import argparse
from collections import Counter, defaultdict
from difflib import SequenceMatcher
import html
import json
import logging
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
RECURSOS = ROOT.parents[1] / 'recursos' / 'temarios' / 'upiita'
CARRERAS = {'bionica': 'B', 'mecatronica': 'M', 'telematica': 'T'}
ROMANOS = ('I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X')
LOG = logging.getLogger(__name__)


def normalizar(texto):
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto.upper())
                    if unicodedata.category(c) != 'Mn')
    texto = re.sub(r'[^A-Z0-9]+', ' ', texto).strip()
    abreviaturas = {'PROC': 'PROCESOS', 'COMP': 'COMPUTACIONALES',
                    'TEC': 'TECNOLOGIA', 'ADMON': 'ADMINISTRACION'}
    tokens = [abreviaturas.get(t, t) for t in texto.split()]
    # Solo los números terminales: no confundir Inglés I con Inglés II ni 3D.
    if tokens and tokens[-1] in {'1', '2', '3', '4', '5'}:
        tokens[-1] = ROMANOS[int(tokens[-1]) - 1]
    return ' '.join(tokens)


def limpiar(texto):
    texto = html.unescape(texto)
    texto = re.sub(r'(?<=\w)-\s*\n\s*(?=[a-záéíóúñ])', '', texto)
    texto = re.sub(r'<\s*br\s*/?\s*>', '\n', texto, flags=re.I)
    texto = re.sub(r'</(?:td|th)>', ' ; ', texto, flags=re.I)
    texto = re.sub(r'</tr>', '\n', texto, flags=re.I)
    texto = re.sub(r'<[^>]+>', '', texto)
    lineas = []
    for linea in texto.splitlines():
        if re.fullmatch(r'\s*\|?\s*:?-{3,}.*', linea):
            continue
        linea = re.sub(r'^\s*#{1,6}\s*', '', linea)
        linea = linea.replace('**', '').replace('__', '').strip().strip('|').strip()
        if linea:
            lineas.append(re.sub(r'[ \t]+', ' ', linea))
    return '\n'.join(lineas)


ETIQUETAS = {
    'objetivo': r'OBJETIVO GENERAL|OBJETIVO DE LA UNIDAD DE APRENDIZAJE|PROPOSITO\s*DE LA UNIDAD DE\s*APREN(?:D|ID|DID)IZAJE|PROPOSITO GENERAL',
    'contenidos': r'CONTENIDOS?(?: TEMATICOS)?',
    'orientacion': r'ORIENTACION DIDACTICA',
    'evaluacion': r'EVALUACION Y ACREDITACION|EVALUACION DE LOS APRENDIZAJES|PROCEDIMIENTO DE EVALUACION',
    'bibliografia': r'(?:CLAVE B C )?BIBLIOGRAFIA(?: BASICA Y COMPLEMENTARIA)?',
}
FIN = (r'PROPOSITO GENERAL|TIEMPOS ASIGNADOS|UNIDAD DE APRENDIZAJE|'
       r'PERFIL DOCENTE|INSTITUTO POLITECNICO NACIONAL|SECRETARIA ACADEMICA|'
       r'ESTRATEGIAS DE APRENDIZAJE|OBJETIVO DE LA UNIDAD TEMATICA|'
       r'RELACION DE PRACTICAS|ELABORO|REVISO|AUTORIZO')


def secciones(pagina):
    """Reconoce encabezados sobre líneas normalizadas, conservando el texto original."""
    partes = defaultdict(list)
    actual = None
    for linea in pagina.splitlines():
        n = normalizar(linea)
        encontrada = False
        for campo, patron in ETIQUETAS.items():
            m = re.match(r'^(?:\d+ )?(?:' + patron + r')(?:\b)', n)
            if m:
                actual = campo
                if campo == 'bibliografia' and n in {'BIBLIOGRAFIA BASICA', 'BIBLIOGRAFIA COMPLEMENTARIA'}:
                    partes[campo].append(n.removeprefix('BIBLIOGRAFIA '))
                # El contenido en la misma línea siempre sigue a dos puntos.
                resto = linea.split(':', 1)[1].strip() if ':' in linea else ''
                if resto:
                    partes[campo].append(resto)
                encontrada = True
                break
        if encontrada:
            continue
        if re.match(r'^(?:\d+ )?(?:' + FIN + r')\b', n):
            actual = None
        if actual:
            partes[actual].append(linea)
    # Algunos sintéticos omiten CONTENIDOS, pero conservan la lista romana.
    if not partes['contenidos'] and partes['objetivo']:
        for i, linea in enumerate(partes['objetivo']):
            if re.match(r'^I\s*[.\-:)]+\s*\S', linea):
                partes['contenidos'] = partes['objetivo'][i:]
                partes['objetivo'] = partes['objetivo'][:i]
                break
    return {k: '\n'.join(v).strip() for k, v in partes.items()}


def unidades(texto):
    resultado = []
    for linea in texto.splitlines():
        m = re.match(r'^([IVX]+)(?:\s*[.\-:)]+\s*|\s+)(\S.*)', linea)
        if m:
            resultado.append({'numero': m[1], 'titulo': m[2].strip(), 'subtemas': []})
        elif re.match(r'^[•*\-]\s+\S', linea):
            resultado.append({'numero': '', 'titulo': re.sub(r'^[•*\-]\s+', '', linea), 'subtemas': []})
        elif resultado:
            if re.match(r'^\d+(?:\.\d+)*[.\s)]', linea):
                resultado[-1]['subtemas'].append(linea)
            elif resultado[-1]['subtemas']:
                resultado[-1]['subtemas'][-1] += ' ' + linea
            else:
                resultado[-1]['titulo'] += ' ' + linea
    return resultado


def bibliografia(texto):
    entradas = []
    tipo = ''
    for linea in texto.splitlines():
        n = normalizar(linea)
        if n in {'BASICA', 'BIBLIOGRAFIA BASICA', 'COMPLEMENTARIA', 'BIBLIOGRAFIA COMPLEMENTARIA'}:
            tipo = 'complementaria' if 'COMPLEMENTARIA' in n else 'básica'
            continue
        m = re.match(r'^\d+\s+[BC]\s+(.+)', linea)
        if m:
            tipo_fila = 'básica' if re.match(r'^\d+\s+B\b', linea) else 'complementaria'
            entradas.append({'texto': m[1], 'tipo': tipo_fila})
        elif entradas and re.match(r'^(?:[a-záéíóúñ]|ISBN\b|ISSN\b|\d+\s*(?:págs?\.|pp\.))', linea):
            entradas[-1]['texto'] += ' ' + linea.strip()
        elif linea.strip():
            entradas.append({'texto': linea.strip(), 'tipo': tipo})
    return entradas


def dato_linea(texto, etiqueta, fin=''):
    m = re.search(etiqueta + r'\s*:\s*([^\n]+)', texto, re.I)
    if not m:
        return ''
    valor = m[1]
    if fin:
        valor = re.split(fin, valor, flags=re.I)[0]
    return valor.strip(' .;')


def unidades_desarrolladas(paginas):
    resultado = []
    for pagina in paginas:
        m = re.search(r'UNIDAD TEM[AÁ]TICA\s*:\s*([IVX]+)\b\s*(?:\n)?\s*NOMBRE\s*:\s*(.*?)(?=\n(?:UNIDAD DE COMPETENCIA|OBJETIVO)|$)', pagina, re.S)
        if not m:
            continue
        subtemas = []
        en_tabla = False
        for linea in pagina.splitlines():
            n = normalizar(linea)
            if re.match(r'(?:NO )?CONTENIDOS\b', n):
                en_tabla = True
            elif n.startswith(('SUBTOTALES', 'ESTRATEGIAS', 'EVALUACION')):
                en_tabla = False
            elif en_tabla and re.match(r'^\d+\.\d+\s*', linea):
                subtemas.append(linea)
            elif en_tabla and subtemas and re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ]', linea):
                if not normalizar(linea).startswith(('T P', 'HORAS', 'CLAVE')):
                    subtemas[-1] += ' ' + linea
        resultado.append({'numero': m[1], 'titulo': ' '.join(m[2].split()), 'subtemas': subtemas})
    return resultado


def extraer(ruta, recursos):
    texto = ruta.read_text(encoding='utf-8')
    paginas = [limpiar(p) for p in re.split(r'(?m)^\s*---\s*$', texto)]
    sinteticas = [p for p in paginas if 'PROGRAMA SINTETICO' in normalizar(p)]
    # El perfil docente puede preceder al programa. No usar su objetivo ni sus firmas.
    academicas = [p for p in paginas if 'PERFIL DOCENTE' not in normalizar(p)]
    preferidas = sinteticas or academicas or paginas
    pagina = max(preferidas, key=lambda p: sum(bool(v) for v in secciones(p).values()))
    campos = secciones(pagina)
    if not sinteticas:
        for p in academicas:
            if 'UNIDAD TEMATICA' in normalizar(p):
                continue
            for k, valor in secciones(p).items():
                if valor and not campos.get(k):
                    campos[k] = valor
    nombre = ''
    for p in [pagina] + paginas:
        m = re.search(r'(?m)(?<!LA )UNIDAD DE\s+APRENDIZAJE\s*:[ \t]*([^\n]+(?:\n[^\n]+)?)', p)
        if m:
            nombre = re.split(r'\s+(?:NIVEL|HOJA|TIPO|OBJETIVO|ESPECIALIDAD|ÁREA|AREA)\b', m[1])[0]
            nombre = ' '.join(nombre.split()).strip(' .')
            if normalizar(nombre).startswith(('HOJA', 'PROCEDIMIENTO')):
                nombre = ''
            if nombre:
                break
    relativo = ruta.relative_to(recursos)
    partes = list(relativo.parts)
    partes.remove('_ocr')
    pdf_relativo = Path(*partes).with_suffix('.pdf')
    if not (recursos / pdf_relativo).is_file():
        # El generador OCR aplica with_suffix dos veces y trunca sufijos como N.II.
        candidatos = [p for p in (recursos / pdf_relativo.parent).glob('*.pdf')
                      if p.with_suffix('').with_suffix('.md').name == ruta.name]
        if len(candidatos) != 1:
            raise ValueError(f'{ruta}: PDF original ambiguo o ausente: {candidatos}')
        pdf_relativo = candidatos[0].relative_to(recursos)
    fuente = pdf_relativo.as_posix()
    carpeta = next((normalizar(p) for p in relativo.parts if normalizar(p).startswith('NIVEL ')), '')
    nivel_romano = carpeta.removeprefix('NIVEL ')
    nivel = ROMANOS.index(nivel_romano) + 1 if nivel_romano in ROMANOS else None
    todo = '\n'.join([pagina] + [p for p in paginas if p != pagina])
    horas = {}
    for m in re.finditer(r'HORAS\s*(TEOR[IÍÌ]A|PR[AÁÀ]CTICA|TOTALES)\s*/\s*(SEMANA|SEMESTRE)\s*:\s*(\d+(?:[.,]\d+)?)', todo, re.I):
        clave = normalizar(m[1]).lower() + '_' + m[2].lower()
        horas.setdefault(clave, float(m[3].replace(',', '.')))
    creditos = {}
    for linea in todo.splitlines():
        if re.match(r'CR[EÉ]DITOS\s*:', linea, re.I):
            for m in re.finditer(r'(\d+(?:[.,]\d+)?)\s*(TEPIC|SATCA)', linea, re.I):
                creditos.setdefault(m[2].lower(), float(m[1].replace(',', '.')))
    academia = dato_linea(todo, r'ACADEMIA', r'UNIDAD DE')
    if not academia:
        m = re.search(r'(?:POR:\s*)Academia\s*\n?(.*?)(?=\n(?:REVIS|APROBAD|AUTORIZ)|$)', todo, re.S)
        if m:
            academia = ' '.join(m[1].split()).strip(' .')
    tipo = 'elegible' if any('ELEGIBLE' in normalizar(p) for p in relativo.parts) else (
        'optativa' if any('OPTATIVA' in normalizar(p) for p in relativo.parts) else '')
    contenidos = unidades(campos.get('contenidos', ''))
    desarrolladas = unidades_desarrolladas(paginas)
    if not contenidos:
        contenidos = desarrolladas
    else:
        for u in contenidos:
            detalle = next((d for d in desarrolladas if d['numero'] == u['numero']), None)
            if detalle:
                u['subtemas'] = detalle['subtemas']
    return {'clave': '', 'plan': '', 'nombre': nombre, 'nivel': nivel, 'tipo': tipo,
            'objetivo': campos.get('objetivo', ''), 'contenidos': contenidos,
            'orientacion': campos.get('orientacion', ''), 'evaluacion': campos.get('evaluacion', ''),
            'bibliografia': bibliografia(campos.get('bibliografia', '')),
            'horas': horas, 'creditos': creditos,
            'vigencia': dato_linea(todo, 'VIGENCIA', r'\bNIVEL\b'), 'academia': academia,
            'fuente': fuente, 'confianza': 0.0}


def cargar_mapa(root=ROOT):
    mapa = json.loads((root / 'data/mapa_curricular_saes.json').read_text(encoding='utf-8'))
    return [dict(zip(mapa['cols'], r)) for r in mapa['rows']]


def plan_trayectoria(letra, mapa, root=ROOT):
    trayectoria = json.loads((root / f'data/trayectoria_{letra}.json').read_text(encoding='utf-8'))
    claves = {b.get('clave', '').casefold() for b in trayectoria['boxes']}
    planes = Counter(r['plan'] for r in mapa if r['carrera'] == letra and r['clave'].casefold() in claves)
    if not planes:
        raise ValueError(f'{letra}: la trayectoria no permite identificar un plan SAES')
    return planes.most_common(1)[0][0]


def puntuacion(materia, fila):
    a, b = normalizar(materia['nombre']), normalizar(fila['nombre'])
    if not a or not b:
        return 0.0
    ra = a.split()[-1] if a.split()[-1] in ROMANOS else ''
    rb = b.split()[-1] if b.split()[-1] in ROMANOS else ''
    if ra != rb:
        return 0.0
    nombre = SequenceMatcher(None, a, b).ratio()
    nivel = materia['nivel'] == int(fila['nivel'])
    return round(0.92 * nombre + 0.08 * nivel, 4)


def emparejar(materias, filas):
    duplicados, revision = [], []
    grupos = defaultdict(list)
    for materia in materias:
        opciones = sorted(((puntuacion(materia, r), r) for r in filas),
                          key=lambda x: (-x[0], x[1]['clave']))
        score, candidato = opciones[0]
        margen = score - opciones[1][0] if len(opciones) > 1 else score
        materia['confianza'] = score
        if score >= 0.86 and margen >= 0.035:
            materia['clave'], materia['plan'] = candidato['clave'], candidato['plan']
            tipo_saes = candidato['tipo'].lower()
            if materia['tipo'] and materia['tipo'] != tipo_saes:
                revision.append((materia['fuente'], f"Tipo carpeta {materia['tipo']} / SAES {tipo_saes}; se conserva carpeta"))
            materia['tipo'] = materia['tipo'] or tipo_saes
            grupos[materia['clave']].append(materia)
        else:
            revision.append((materia['fuente'], f"Sin asignar; candidato {candidato['clave']} ({score:.4f}), margen {margen:.4f}"))
        if score < 0.98:
            revision.append((materia['fuente'], f"Revisar nombre/nivel: {candidato['nombre']}, nivel {candidato['nivel']}; puntuación {score:.4f}"))
        archivo = normalizar(Path(materia['fuente']).stem)
        if SequenceMatcher(None, archivo, normalizar(materia['nombre'])).ratio() < 0.72:
            revision.append((materia['fuente'], f"Archivo y título interior difieren: {materia['nombre']}"))
    descartados = set()
    for clave, candidatos in grupos.items():
        if len(candidatos) < 2:
            continue
        # La completitud evita preferir una copia parcial solo por su nombre de archivo.
        def calidad(m):
            afinidad = SequenceMatcher(None, normalizar(Path(m['fuente']).stem), normalizar(m['nombre'])).ratio()
            completos = sum(bool(m[k]) for k in ('objetivo', 'contenidos', 'orientacion', 'evaluacion', 'bibliografia'))
            return (-m['confianza'], -completos, -afinidad, m['fuente'])
        ganador, *otros = sorted(candidatos, key=calidad)
        for otro in otros:
            duplicados.append((clave, ganador['fuente'], otro['fuente']))
            descartados.add(otro['fuente'])
    return [m for m in materias if m['fuente'] not in descartados], duplicados, revision


def celda(valor):
    return str(valor).replace('|', '\\|').replace('\n', ' ')


def tabla(encabezados, filas):
    return ['| ' + ' | '.join(encabezados) + ' |', '| ' + ' | '.join('---' for _ in encabezados) + ' |'] + [
        '| ' + ' | '.join(celda(v) for v in fila) + ' |' for fila in filas]


def generar(recursos=RECURSOS, root=ROOT):
    mapa = cargar_mapa(root)
    informe = ['# Temarios de UPIITA', '', '## 1. Fuente, extracción y criterio', '',
               'Generado por `python tools/temarios_extraer.py`. Solo lectura de OCR local; no hay llamadas de red.',
               'Cada JSON contiene `carrera`, `plan`, `materias` y `duplicados`. Campos ausentes: cadena vacía, lista vacía, objeto vacío o nivel nulo.',
               'Se prefiere la página «PROGRAMA SINTÉTICO» sobre perfiles docentes y programas desarrollados. Objetivo incluye el encabezado equivalente «Propósito de la unidad de aprendizaje». No se exportan autores ni firmas.',
               'Si solo hay páginas desarrolladas, se recuperan las unidades con N°/nombre y sus subtemas. Las cifras de horas y referencias dentro de sus filas se conservan como texto fuente, sin reinterpretarlas.',
               'Duplicados: mayor puntuación, más campos principales completos, mayor coincidencia entre archivo y título, y ruta en orden estable.',
               'El plan se identifica por coincidencias de claves con la trayectoria existente. El reporte incluye también el plan histórico sin atribuirle los temarios del plan seleccionado.',
               'Puntuación = 0.92 × similitud de nombres normalizados (SequenceMatcher) + 0.08 × coincidencia de nivel. Se conservan los números romanos terminales.',
               'Se asigna clave con puntuación ≥ 0.86 y margen al segundo candidato ≥ 0.035; se revisan puntuaciones < 0.98. No es una probabilidad estadística.',
               'El tipo de carpeta (optativa/elegible) prevalece sobre el SAES; los desacuerdos se registran. El resto usa el tipo SAES. Créditos y horas proceden exclusivamente del OCR.',
               'Bibliografía sin columnas inequívocas B/C mantiene tipo vacío. Una línea OCR por entrada puede conservar referencias partidas; requiere cotejo editorial. Los contenidos sin numeración conservan número vacío.',
               'Ingeniería en Energía queda fuera: no hay fuente disponible.', '',
               '## 1b. Descripciones breves (DESC1)', '',
               '`data/temarios/upiita/descripciones/<carrera>.json` guarda, por clave, una descripción de 25 a 45 palabras redactada a partir del objetivo y de los títulos de unidades del programa sintético (`base`). **No son textos oficiales del IPN y están pendientes de revisión humana** (`revisada: false`). El extractor no las sobrescribe; `tools/build_sate.py` las une a cada materia. Se omiten las materias con temario parcial o vacío (B207, B412, M121, M414, M415, M416, M418, T221). Si una materia no tiene descripción, la ficha no muestra el objetivo en bruto. Créditos y horas ausentes en el temario se completan con el plan del SAES (cifras semanales) o se ocultan.', '']
    resumen = []
    for numero, (carrera, letra) in enumerate(CARRERAS.items(), 2):
        rutas = sorted((recursos / carrera / '_ocr').rglob('*.md'))
        if not rutas:
            raise FileNotFoundError(f'No hay OCR: {recursos / carrera / "_ocr"}')
        plan = plan_trayectoria(letra, mapa, root)
        filas = [r for r in mapa if r['carrera'] == letra and r['plan'] == plan]
        materias = []
        for ruta in rutas:
            try:
                materias.append(extraer(ruta, recursos))
            except Exception:
                LOG.exception('Error al extraer %s', ruta)
                raise
        materias, duplicados, revision = emparejar(materias, filas)
        por_clave = {m['clave']: m for m in materias if m['clave']}
        salida = {'carrera': carrera, 'plan': plan, 'materias': materias,
                  'duplicados': [{'clave': c, 'elegido': e, 'descartado': d} for c, e, d in duplicados]}
        destino = root / f'data/temarios/upiita/{carrera}.json'
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(json.dumps(salida, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
        LOG.info('%s plan %s: %d OCR, %d/%d SAES, %d duplicados, %d sin clave', carrera, plan,
                 len(rutas), len(por_clave), len(filas), len(duplicados), sum(not m['clave'] for m in materias))
        informe += [f'## {numero}. {carrera.capitalize()}', '', f'Plan {plan}: **{len(por_clave)} / {len(filas)}** materias SAES con temario; {len(rutas)} OCR de entrada.', '']
        informe += tabla(['Plan', 'Clave', 'Nombre SAES', 'Nivel', 'Temario (PDF relativo)', 'Puntuación'], [
            (r['plan'], r['clave'], r['nombre'], r['nivel'], por_clave[r['clave']]['fuente'] if r['clave'] in por_clave else 'Sin temario',
             por_clave[r['clave']]['confianza'] if r['clave'] in por_clave else '')
            for r in mapa if r['carrera'] == letra])
        informe += ['', f'### {numero}.1. Temarios sin clave', '']
        sin_clave = [(m['nombre'], m['fuente'], m['confianza']) for m in materias if not m['clave']]
        informe += tabla(['Título interior', 'Fuente', 'Mejor puntuación'], sin_clave) if sin_clave else ['Ninguno.']
        informe += ['', f'### {numero}.2. Duplicados', '']
        informe += tabla(['Clave', 'Elegido', 'Descartado'], duplicados) if duplicados else ['Ninguno.']
        vacios = Counter(k for m in materias for k, v in m.items() if not v and k not in {'clave', 'plan', 'confianza'})
        informe += ['', f'### {numero}.3. Campos vacíos', '']
        informe += tabla(['Campo', 'Materias'], vacios.most_common())
        informe += ['', f'### {numero}.4. Revisión y decisiones pendientes', '']
        informe += tabla(['Fuente', 'Motivo'], revision) if revision else ['Sin incidencias.']
        incompletos = [(m['fuente'], ', '.join(k for k in ('nombre', 'objetivo', 'contenidos', 'orientacion', 'evaluacion', 'bibliografia') if not m[k]))
                       for m in materias if any(not m[k] for k in ('nombre', 'objetivo', 'contenidos', 'orientacion', 'evaluacion', 'bibliografia'))]
        if incompletos:
            informe += ['', 'Campos principales pendientes de cotejo:', ''] + tabla(['Fuente', 'Campos vacíos'], incompletos)
        informe += ['']
        resumen.append((carrera, len(por_clave), len(filas)))
    (root / 'docs').mkdir(exist_ok=True)
    (root / 'docs/TEMARIOS.md').write_text('\n'.join(informe), encoding='utf-8', newline='\n')
    return resumen


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--recursos', type=Path, default=RECURSOS)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format='%(levelname)s %(message)s')
    generar(args.recursos)
