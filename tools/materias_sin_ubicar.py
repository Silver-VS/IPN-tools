"""Clasificación compartida por el compilador y el diagnóstico de SATE.

Ejecutar después de compilar las unidades: python tools/materias_sin_ubicar.py.
No consulta servicios ni perfiles; solo los catálogos y la oferta compilados.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def clasificar(mapa):
    """Alcance estructural, independiente del avance, selección y vista Pendientes."""
    cajas = mapa.get('layout', {}).get('boxes', [])
    propias = {b[4] for b in cajas if b[4]}
    lineas = {k for linea in mapa.get('lineas', []) for k in linea['claves']}
    espacios = [b for b in cajas if not b[4] and b[5].lower().startswith('optativa')]
    resultado = {}
    for clave, materia in mapa['cur'].items():
        if materia[0].upper().startswith('ELECTIVA'):
            resultado[clave] = 'electiva'
        elif not mapa.get('layout') or clave in propias or clave in lineas:
            resultado[clave] = 'ubicada'
        elif materia[3] == 'P' and any(len(b) < 8 or not b[7] or b[7] == materia[2] for b in espacios):
            # slotFill coloca elecciones previas, pero el espacio vacío no permite elegir una clave.
            resultado[clave] = 'sin_selector'
        else:
            resultado[clave] = 'sin_ubicar'
    return resultado


def diagnostico(nucleo, oferta):
    resultado = {}
    for car, mapa in nucleo['mapas'].items():
        clases = {}
        for periodo, filas in oferta['periodos'].items():
            for fila in filas:
                if fila[0] == car:
                    clases.setdefault(fila[8], set()).add(periodo)
        estados = clasificar(mapa)
        resultado[car] = [(k, estados.get(k, 'sin_catalogo'), sorted(periodos))
                          for k, periodos in sorted(clases.items())]
    return resultado


def main():
    texto = ['# Materias sin ubicar en el mapa', '',
             '## 1. Criterio y reproducción', '',
             'Generado con `python tools/materias_sin_ubicar.py` después de compilar las tres unidades. '
             'Usa la misma función `clasificar` que el compilador. Se cruzan las claves compiladas de '
             'ambos periodos con cada carrera/plan, sin comparar nombres para determinar alcance.', '',
             'Una clave se puede elegir desde el mapa si tiene caja propia o pertenece a una línea '
             'seleccionable. Un espacio vacío de optativa no abre un selector: `slotFill` solo coloca '
             'elecciones previas (tipo P, nivel coincidente si el espacio lo especifica y cualquier '
             'nivel si no lo especifica). Se distinguen las materias con espacio compatible pero sin '
             'selector de las que tampoco tienen espacio compatible. Sin trayectoria, la cuadrícula '
             'incluye todo el catálogo. No depende de cupos ocupados, avance ni de la vista Pendientes. '
             'Las electivas se separan por la misma regla de `isElec` de SATE.', '',
             'El compilador ya normaliza las claves SAES a mayúsculas en catálogo y oferta. '
             'Las claves internas con `~` indican oferta sin correspondencia con el catálogo SAES.', '',
             '## 2. Casos por unidad y carrera/plan', '']
    for unidad in ('upiita', 'escom', 'upibi'):
        base = ROOT / 'web/dist/sate/datos' / unidad
        nucleo, oferta = [json.loads((base / f'{n}.json').read_text(encoding='utf-8'))
                          for n in ('nucleo', 'oferta')]
        for car, filas in diagnostico(nucleo, oferta).items():
            casos = [f for f in filas if f[1] in ('sin_ubicar', 'sin_selector', 'sin_catalogo')]
            electivas = [f for f in filas if f[1] == 'electiva']
            texto += [f"### {unidad.upper()} · {nucleo['carreras'][car]} ({car})", '',
                      f'{len(casos)} sin ubicar; {len(electivas)} electivas ofertadas (separadas).', '']
            for titulo, grupo in [('Sin acceso desde el mapa', casos), ('Electivas por actividades', electivas)]:
                if not grupo:
                    continue
                texto += [f'**{titulo}**', '', '| Clave | Nombre | Tipo | Nivel | Periodos | Motivo probable |',
                          '|---|---|---|---|---|---|']
                for k, estado, periodos in grupo:
                    v = nucleo['mapas'][car]['cur'].get(k, [k, 0, 'Sin dato', '?'])
                    motivo = ('Electiva: acreditación por actividades; consultar el trámite de la unidad.' if estado == 'electiva'
                              else 'Clave ofertada ausente del catálogo del mapa.' if estado == 'sin_catalogo'
                              else 'Espacio de optativa compatible, pero sin caja ni línea para elegirla; slotFill solo la coloca después de elegirla.' if estado == 'sin_selector'
                              else 'Sin caja ni línea; no hay espacio de optativa compatible con su tipo/nivel.')
                    nombre = v[0].replace('|', '\\|')
                    tipo = {'O': 'Obligatoria', 'P': 'Optativa', 'T': 'Taller'}.get(v[3], v[3])
                    texto.append(f"| {k} | {nombre} | {tipo} | {v[2]} | {', '.join(periodos)} | {motivo} |")
                texto.append('')
            print(f'{unidad}/{car}: {len(casos)} sin ubicar, {len(electivas)} electivas')
    texto += ['## 3. Modo genérico y límites', '',
              'El modo genérico no carga oferta de carrera/plan: representa las materias que el Lector '
              'informa en memoria, todas con caja en su cuadrícula. No hay casos estructurales ni '
              'selección de oferta que diagnosticar; Pendientes solo filtra las acreditadas. '
              'No se infieren claves, créditos ni reglas académicas ausentes del SAES.', '',
              '## 4. Aclaración del reporte original', '',
              '`b307` se normaliza a `B307`. En Biónica sí hay un espacio de optativa compatible '
              'de nivel 3; el defecto es la falta de un control para elegirla desde el mapa. '
              'El cajón ofrece ese acceso sin modificar el plan ni las reglas de acreditación.', '']
    (ROOT / 'docs/MATERIAS-SIN-UBICAR.md').write_text('\n'.join(texto), encoding='utf-8')


if __name__ == '__main__':
    main()
