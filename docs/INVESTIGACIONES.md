# Investigaciones de reglamentos

## 1. Persistencia e intercambio

Los proyectos se guardan mediante `IPNT.set` en `hu.<unidad>.investigaciones`, incluida en la sincronización de `hu.*`. El objeto local es `{activa: índice, proyectos: [...]}`. No se consulta el SAES ni se toma del perfil un nombre o identificador. El nombre público del autor se escribe expresamente y es opcional.

El archivo JSON es el formato canónico para importar en SATE o en AULA-C. Versión 1:

```json
{
  "formato": "sate-investigacion",
  "version": 1,
  "nombre": "Proyecto ficticio",
  "proposito": "solicitud",
  "autor": "",
  "etiquetas": ["carga"],
  "marcadores": [{
    "doc": "rge", "n": "48", "fr": "",
    "anotaciones": [{
      "inicio": 0, "fin": 5, "literal": "Texto",
      "nota": "Ejemplo de nota propia", "etiqueta": "requisito"
    }]
  }]
}
```

| Campo | Restricción |
|---|---|
| nombre, autor | Texto plano, hasta 120 caracteres; nombre obligatorio |
| proposito | solicitud, queja, propuesta, estudio |
| etiquetas | Hasta 20 cadenas de 40 caracteres |
| marcadores | Hasta 300; documento con identificador alfanumérico, guion o subrayado |
| n, fr | Número o identificador literal, hasta 80 y 20 caracteres |
| anotaciones | Hasta 100 por marcador; nota hasta 4 000 caracteres |
| inicio, fin | Intervalo UTF-16 semiabierto dentro del `textContent` del cuerpo renderizado del artículo; máximo 200 000 |
| literal | Hasta 20 000 caracteres; longitud igual a `fin-inicio` |
| etiqueta | favor, contra, requisito, plazo |

La importación reconstruye únicamente estos campos. Rechaza controles y delimitadores HTML. Archivo y descompresión tienen límite de 2 MB. Los documentos y artículos desconocidos no aportan texto oficial inventado.

## 2. Enlaces y privacidad

`#/<unidad>/guia/reglamentos/<doc>?inv=<datos>` contiene JSON UTF-8 comprimido con DEFLATE y codificado en base64url. El signo `?` está dentro del fragmento, nunca en la consulta HTTP. No hay petición de red para compartir. Por encima de 7 000 caracteres comprimidos se indica compartir JSON. El receptor ve el proyecto en lectura y puede guardar una copia independiente.

`arts=<doc>:<artículo>[:<fracción>],...` comparte solo referencias, sin nombre ni notas. La identidad de una referencia es la terna `doc,n,fr`.

## 3. Texto oficial y exportación

Los rangos se pintan con CSS Custom Highlight API, por etiqueta. Antes de pintar se coteja el fragmento con `literal`; un desfase no se aplica silenciosamente a otro texto. Las notas son nodos propios fuera de `data-oficial`. No se escriben cambios en datos oficiales ni huellas. Si el entorno no implementa Highlight, las anotaciones siguen disponibles en el panel y en la exportación.

Markdown contiene el nombre, fundamento agrupado por documento, encabezados de documento y artículo, transcripción literal y notas con etiqueta. LaTeX usa la misma secuencia, escapa caracteres reservados y entrega un documento `article` UTF-8. Para intercambio estructurado con AULA-C se recomienda JSON, pues preserva fracciones, intervalos y etiquetas sin analizar prosa.

PDF utiliza la biblioteca local `pdf-lib`, con texto seleccionable y paginación. La fuente Helvetica del generador tiene el repertorio WinAnsi: un carácter fuera de ese repertorio produce error de exportación, nunca una sustitución del texto oficial.

## 4. Verificación y límites

`tests/qa_sate_investigacion.mjs` compara orden de artículos, encabezados y extremos reales por reglamento, prueba marcadores, agrupación, compresión y validación. La comparación identifica orden previo incorrecto solo en `ri.json`; no encuentra encabezados ausentes de la estructura.

Revisión de 1300, 1024, 768 y 375 px limitada a DOM y CSS, sin abrir navegador. No constituye una medición geométrica ni una inspección visual de renderizado. Claro y oscuro heredan los tokens comunes; etiquetas siempre tienen texto además del color.

Verificación del 2026-10-24: todas las `qa_sate*.mjs` correctas; pytest con `--ignore=tests/test_fuzz_perfiles.py --basetemp=_encargo/pytest-r15-inv`: 188 pruebas y 829 subpruebas correctas, 798 omitidas por la configuración existente. Las 19 701 huellas oficiales permanecen intactas. Compilación de las tres unidades; última compilación UPIITA con `UPIITA_SITE=https://guinda-labs.github.io/prueba/`. Sin red, navegador, commit ni publicación.
