"""Propone realces desde logos locales; --aplicar guarda el catálogo, sin red."""
import argparse
import colorsys
import json
import pathlib
import shutil
from collections import defaultdict

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
SUPERFICIES = {'claro': ('#ffffff', '#fafafa', '#f4f4f5'),
               'oscuro': ('#18181b', '#09090b')}


def luminancia(hexadecimal):
    rgb = [int(hexadecimal[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    lineal = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb]
    return sum(c * peso for c, peso in zip(lineal, (.2126, .7152, .0722)))


def contraste(a, b):
    x, y = sorted((luminancia(a), luminancia(b)))
    return (y + .05) / (x + .05)


def dominante(ruta):
    grupos = defaultdict(list)
    with Image.open(ruta) as imagen:
        imagen = imagen.convert('RGBA')
        imagen.thumbnail((256, 256))
        for r, g, b, a in (imagen.get_flattened_data() if hasattr(imagen, 'get_flattened_data') else imagen.getdata()):
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            # Excluir el fondo transparente y los trazos neutros, sin favorecer el rojo.
            if a >= 128 and s >= .25 and .12 <= v <= .97:
                grupos[int(h * 36) % 36].append((r, g, b, s * a / 255))
    if not grupos:
        raise ValueError(f'{ruta.name}: sin píxeles cromáticos; requiere revisión manual')
    pixeles = max(grupos.values(), key=lambda p: sum(c[3] for c in p))
    peso = sum(p[3] for p in pixeles)
    return tuple(round(sum(p[i] * p[3] for p in pixeles) / peso) for i in range(3))


def insignia_rgb(identidad):
    h = identidad.get('insignia')
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) if h else None


def proponer(rgb):
    h, luminosidad, saturacion = colorsys.rgb_to_hls(*(c / 255 for c in rgb))
    # Conservar matiz y saturación; buscar la luminosidad más próxima que pase AA.
    # 4.8 deja margen para chips con mezcla de 5 % de realce sobre superficie.
    resultado = {}
    for tema, fondos in SUPERFICIES.items():
        candidatos = []
        for i in range(1001):
            tono = '#' + ''.join(f'{round(c * 255):02x}' for c in colorsys.hls_to_rgb(h, i / 1000, saturacion))
            if min(contraste(tono, fondo) for fondo in fondos) >= 4.8:
                candidatos.append((abs(i / 1000 - luminosidad), tono))
        if not candidatos:
            raise ValueError(f'{rgb}/{tema}: no existe realce AA')
        resultado[tema] = min(candidatos)[1]
    return resultado


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--aplicar', action='store_true')
    parser.add_argument('--copiar-faltantes', action='store_true')
    args = parser.parse_args()
    archivo = ROOT / 'data/unidades_identidad.json'
    datos = json.loads(archivo.read_text(encoding='utf-8'))
    destino = ROOT / 'web/dist/assets/logos/unidades'
    origen = ROOT.parent / 'desfase/web/dist/assets/logos/unidades'
    for unidad, identidad in datos['unidades'].items():
        if not identidad.get('logo'):
            continue
        ruta = destino / (identidad['logo'] + '.webp')
        if not ruta.exists() and args.copiar_faltantes:
            destino.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(origen / ruta.name, ruta)
        try:
            # La insignia elegida (color más representativo del escudo) manda; el muestreo es solo propuesta inicial.
            rgb = insignia_rgb(identidad) or dominante(ruta)
            realce = proponer(rgb)
        except (OSError, ValueError) as error:
            raise RuntimeError(f'Realce: unidad={unidad}, logo={ruta.name}, fase=muestreo: {error}') from error
        print(f'{unidad}: dominante=#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}, realce={realce}')
        identidad['realce'] = realce
    if args.aplicar:
        datos['_fuente'] = ('Identidad: nombres completos de data/cuenta.json y data/unidades/*/unidad.json; ENCB según el dueño (2026-10-09). '
                            'Sin nombre documentado se conservan siglas. Logos SAES locales no versionados en web/dist/assets/logos/unidades/<logo>.webp; '
                            'UPIIH, UPIIC y UPIIT usan el escudo IPN. Realces reproducibles con python tools/realce_unidades.py --aplicar: '
                            'miniatura RGBA hasta 256 px, alfa >=128, HSV S>=0.25 y 0.12<=V<=0.97; histograma de matiz de 36 sectores '
                            'ponderado por saturación y alfa, promedio RGB del sector dominante. Se conserva matiz y saturación HSL y se busca '
                            'L en pasos de 0.001 más próximo al original. Contraste WCAG sRGB: (Lmayor+0.05)/(Lmenor+0.05), '
                            'luminancia lineal ponderada 0.2126R+0.7152G+0.0722B. Mínimo 4.8:1 (margen sobre AA 4.5) '
                            'contra claro #fff/#fafafa/#f4f4f5 y oscuro #18181b/#09090b. No hay color guinda por omisión en unidades con logo.')
        archivo.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
