# Autohospedaje: Horarios con los datos de otra unidad académica

La herramienta de horarios funciona con la oferta del SAES de cualquier unidad del IPN. Con datos de otra
unidad se activan el **mapa por niveles** (si hay mapa curricular) y la **planeación de horario** completa
(oferta, filtros, generador, exportación). La **trayectoria académica** (seriación, desfases, lector de
kárdex) y las **electivas** están hechas para la UPIITA y no se activan en otras unidades.

## 1. Capturar la oferta del SAES

1. Inicia sesión en el SAES de tu unidad (`https://www.saes.<unidad>.ipn.mx`).
2. Crea un marcador con este código como dirección (o pégalo en la consola del navegador):

   ```
   javascript:(function(){var s=document.createElement('script');s.src='https://silver-vs.github.io/upiita/captura.js?v='+Date.now();document.head.appendChild(s)})()
   ```

   Si hospedas tu propia copia, cambia la dirección por la de tu sitio (`<tu-sitio>/captura.js`).
3. Ejecuta el marcador estando en el SAES. El capturador recorre, solo en modo de lectura, Académica ›
   Horarios de clase (periodo actual y próximo) y Académica › Mapa curricular. Tarda unos minutos.
4. Descarga los dos archivos que ofrece al terminar:
   - `horarios_saes.json`
   - `mapa_curricular_saes.json`

El código del capturador está en `tools/captura_saes.js`.

## 2. Compilar

1. Clona este repositorio.
2. Copia los dos archivos en `data/`. `horarios_saes.json` tiene prioridad sobre `horarios_upiita.json`;
   `mapa_curricular_saes.json` reemplaza al de la UPIITA.
3. Compila:

   ```bash
   UPIITA_SITE=https://<tu-sitio>/ python tools/build_horarios.py
   ```

   El compilador detecta la unidad por la fuente de la captura (`saes.<unidad>.ipn.mx`) y desactiva lo
   exclusivo de la UPIITA: trayectorias, líneas de especialización, reglas por nivel y salones.
   Las materias que no aparecen en el mapa curricular reciben una clave interna para que el armado funcione.

## 3. Publicar

Sube el contenido de `web/dist/` a cualquier hosting estático (GitHub Pages, Netlify, el servidor de la
unidad). Pesa alrededor de 1.3 MB y no necesita servidor de aplicaciones ni base de datos.

## Limitaciones conocidas

- El encabezado y los textos dicen «UPIITA».
- El botón «Usar mis datos del SAES» (lector de kárdex) solo entiende el SAES de la UPIITA.
- Los salones se toman del PDF de horarios por aula de la UPIITA (`tools/salones.py`); en otras unidades
  aún no se usan los campos Edificio y Salón del SAES.
- La captura refleja la oferta del momento: vuelve a ejecutar el capturador cuando el SAES publique cambios.
