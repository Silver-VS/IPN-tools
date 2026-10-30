"""Proyección trazable de vínculos existentes; no modifica las fuentes documentales."""
import re
from pathlib import Path


def generar(guia, config, unidad):
    preguntas = {p['id']: p for p in guia['preguntas']}
    areas = {a['id']: a for a in guia.get('acudir', [])}
    situaciones = []
    for pid, situacion in guia['orientacion']['aplicabilidad'].items():
        if pid in preguntas:
            situaciones.append(dict(situacion=situacion, pregunta=pid,
                                    fuente='data/guia/rutas.json#/aplicabilidad/' + pid))
    # resolverRuta ya remite estos casos a formato-dictamen, no a la baja del programa.
    for situacion in ('desfasada', 'recursando'):
        situaciones.append(dict(situacion=situacion, pregunta='veces-cursar-materia',
                                fuente='web/sate/guia.js#resolverRuta; data/guia/comun.json#veces-cursar-materia'))
    articulos = []
    for p in preguntas.values():
        for campo in ('respuesta', 'pasos'):
            textos = p.get(campo, [])
            for texto in ([textos] if isinstance(textos, str) else textos):
                for doc, art in re.findall(r'\[\[a:([^:|]+):([^|]+)\|', texto):
                    r = dict(pregunta=p['id'], doc=doc, articulo=art,
                             fuente=f'datos/{unidad}/guia.json#/preguntas/{p["id"]}/{campo}')
                    if not any(x['pregunta'] == p['id'] and x['doc'] == doc and x['articulo'] == art for x in articulos):
                        articulos.append(r)
    tramites = []
    cfg = config['unidades'][unidad]
    for tid, ruta in cfg.get('guiaTramites', {}).items():
        p = preguntas[ruta.split('/')[-1]]
        fundamento = [r for r in articulos if r['pregunta'] == p['id']]
        prefijo = 'sate.baja.aviso_' + tid.removeprefix('baja_') + '_' if tid.startswith('baja_') else tid + '.'
        for clave, citas in config.get('citasVentanilla', {}).items():
            if clave.startswith(prefijo):
                for doc, n in citas:
                    if not any(a['doc'] == doc and a['articulo'] == n for a in fundamento):
                        fundamento.append(dict(doc=doc, articulo=n, fuente='data/sate.json#/citasVentanilla/' + clave))
        # Las bajas dicen expresamente dónde presentar/entregar la solicitud.
        # Dictamen lo declara la fila «entrega» de rutaGuiada, no el orden de acudir.
        entrega = None
        if tid == 'dictamen':
            entrega = 'web/sate/guia.js#rutaGuiada/formato-dictamen/entrega'
        elif any(re.search(r'\b(?:presenta\w*|entr[eé]g\w*)\b', paso, re.I)
                 and ('[[g:gestion_escolar|' in paso or 'en Gestión Escolar' in paso)
                 for paso in p.get('pasos', [])):
            entrega = f'datos/{unidad}/guia.json#/preguntas/{p["id"]}/pasos'
        area = areas.get('gestion_escolar') if entrega else None
        tramites.append(dict(id=tid, pregunta=p['id'], articulos=fundamento,
                             area={k: area[k] for k in ('id', 'nombre', 'fuente')} if area else None,
                             fuente=f'data/sate.json#/unidades/{unidad}/guiaTramites/{tid}', fuenteEntrega=entrega))
    electivas = cfg.get('electivas', {}).get('tramite')
    instructivo = Path(__file__).resolve().parents[1] / 'data/gestion_escolar/instructivo.txt'
    if electivas in cfg.get('tramites', []) and instructivo.exists():
        texto = instructivo.read_text(encoding='utf-8')
        preambulo = texto.split('CONSIDERANDO.', 1)[1].split('Los criterios para la acreditación', 1)[0]
        ri, rge = preambulo.split('El Reglamento General de Estudios', 1)
        # Se extrae la enumeración de artículos, sin confundir fracciones ni la gaceta con artículos.
        grupos = [('ri', re.search(r'artículo\s+(\d+)', texto).group(1)),
                  ('ri', re.search(r'artículo\s+(\d+)', ri).group(1)),
                  ('rge', re.search(r'artículos\s+(.*?)\.', rge, re.S).group(1))]
        refs = []
        for doc, lista in grupos:
            for n in re.findall(r'\d+', lista):
                refs.append(dict(doc=doc, articulo=n, fuente='data/gestion_escolar/instructivo.txt#pagina-3/preambulo'))
        # La práctica vigente de la unidad (data/sate.json · electivas.entrega) manda sobre el instructivo, que nombra al DIE.
        vigente = cfg.get('electivas', {}).get('entrega')
        if vigente:
            area, entrega = areas.get(vigente['area']), True
            fuente_entrega = f'data/sate.json#/unidades/{unidad}/electivas/entrega'
        else:
            area = areas.get('innovacion_educativa')
            entrega = bool('El alumno entrega la constancia en el DIE.' in texto and re.search(r'Departamento de Innovación Educat\s*iva', texto))
            fuente_entrega = 'data/gestion_escolar/instructivo.txt#DIE'
        tramites.append(dict(id=electivas, pregunta=None, articulos=refs,
                             area={k: area[k] for k in ('id', 'nombre', 'fuente')} if area and entrega else None,
                             fuente=f'data/sate.json#/unidades/{unidad}/electivas/tramite',
                             fuenteEntrega=fuente_entrega if area and entrega else None))
    return dict(situaciones=situaciones, articulos=articulos, tramites=tramites)
