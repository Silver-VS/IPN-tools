# Lector de documentos de PoliCORE

Componente común de GuindaLabs para mostrar documentos con estructura: temarios hoy, reglamentos después. Vive en
`web/policore/lector.js` y `web/policore/lector.css`, no tiene dependencias y no conoce ningún documento concreto: recibe
un documento genérico y lo muestra. Cada tipo de documento tiene su propio **adaptador** que lo convierte a ese formato
(el de temarios es `documento()` en `web/sate/temarios.js`).

Qué da el lector: encabezado con datos clave en «chips», índice de secciones (lateral con ancho suficiente; desplegable
arriba si no), texto oficial en Noto Serif, búsqueda dentro del documento con resaltado y navegación entre coincidencias,
enlace a la fuente, botón para copiar el enlace de cada sección y avisos (por ejemplo, que el dato viene de una
transcripción automática). Claro y oscuro salen de los tokens `--ipn-*`.

## API

```js
const instancia = PoliCORE.lector.montar(contenedor, documento, opciones);
instancia.irA('contenidos');    // desplaza a la sección y la marca en el índice
instancia.buscar('derivadas');  // resalta; devuelve el número de coincidencias
instancia.desmontar();          // o PoliCORE.lector.desmontar(contenedor); sin argumento desmonta todas
```

`montar` reemplaza lo que hubiera en el contenedor (si ya había un lector ahí, lo desmonta antes). Sirve en página
completa, dentro de un panel lateral o de una hoja inferior: el índice y la barra de búsqueda se adaptan al **ancho del
contenedor**, no al de la ventana.

### Opciones

| Opción | Valor | Para qué |
|---|---|---|
| `texto` | `(clave, vars) => string` | Función de textos. Si falta, usa `PoliCORE.texto`, luego `SATE.texto` y, al final, la clave. Los textos del lector están en `contenido/textos/es.toml`, bajo `policore.lector.*`. |
| `modo` | `'pagina'` (por omisión) o `'panel'` | `panel` quita el ancho máximo del texto y ajusta tamaños. |
| `nivelTitulo` | 1 a 5 (por omisión 2) | Nivel del título del documento; las secciones van un nivel más abajo. |
| `indice` | `'lateral'`, `'desplegable'` o automático | Automático: lateral si el contenedor mide `anchoLateral` (760 px) o más. |
| `enlace` | `(idSeccion) => url` | Dirección que se copia o se abre para una sección. Sin ella, la página actual con `#<id>`. |
| `alNavegar` | `(idSeccion) => void` | Se llama al ir a una sección desde el índice. SATE actualiza la dirección con `history.replaceState`. |
| `alCopiar` | `(url, ok) => void` | Después de copiar un enlace. |
| `seccion` | id | Sección a la que ir al montar (enlace profundo). |
| `consulta` | texto | Búsqueda inicial con resaltado. |
| `buscar` | `false` | Oculta la barra de búsqueda. |
| `css` | `false` o URL | Por omisión el lector carga `lector.css` desde su carpeta. |

## Formato del documento

```js
{
  titulo: 'Álgebra lineal',                       // obligatorio
  subtitulo: 'B103 · Ingeniería Biónica',
  metadatos: [{etiqueta: 'Nivel', valor: '1'}],    // chips; los de valor vacío se omiten
  secciones: [{id, titulo, tipo, contenido, rotulo?}],
  fuente: {texto: 'Programa sintético…', url: 'https://…'},   // url solo http(s)
  avisos: ['texto', {tipo: 'ocr', texto: '…'}]     // `tipo` queda como data-tipo para dar estilo
}
```

Tipos de sección (`tipo`) y su `contenido`:

| Tipo | Contenido | Se muestra como |
|---|---|---|
| `texto` | cadena; cada salto de línea abre un párrafo | párrafos de texto oficial |
| `lista` | arreglo de cadenas o de `{texto}` | lista con viñetas |
| `unidades` | `[{numero, titulo, subtemas: []}]`; `rotulo` (p. ej. «Unidad») va antes del número | tarjetas numeradas con sus subtemas |
| `bibliografia` | `[{texto, tipo}]`; `tipo` es el encabezado del grupo (puede ir vacío) | listas por grupo |

Las secciones sin contenido, sin `id` o sin `titulo` no se muestran, y el documento sigue funcionando sin ninguna. Todo
se inserta con `textContent`: el lector no interpreta HTML ni de los documentos ni de las claves de texto.

## Cómo lo usará el Explorador de reglamentos

Un reglamento se convierte a este formato con su propio adaptador y no necesita cambios en el lector:

- Cada título o capítulo es una sección `unidades` con `rotulo: 'Título'` y `numero: 'III'`; cada artículo, un elemento de
  `subtemas` (o su propia sección `texto` si hace falta enlazarlo por separado: `id: 'art-57'`).
- Metadatos: vigencia, fecha de publicación, ámbito. Avisos: «criterio de tu unidad», «sin cita verificada».
- `fuente.url`: el PDF oficial; `enlace(id)`: la dirección profunda del explorador.
- Lo que el diseño del explorador añade (modos «En claro / Texto oficial / Lado a lado», glosario, «Se conecta con») no está
  en el lector: se monta encima de él o como secciones adicionales del documento. Los términos del glosario y las
  referencias cruzadas piden un tipo de sección nuevo; se añade en `cuerpoSeccion()` con una prueba en
  `tests/qa_sate_temarios.mjs`.

## Archivos y pruebas

- `web/policore/lector.js`, `web/policore/lector.css`. La compilación (`tools/build_sate.py`) los copia a `web/dist/policore/`.
- Adaptador de temarios, panel y explorador: `web/sate/temarios.js` y `web/sate/temarios.css` (ver `docs/TEMARIOS.md` para
  los datos).
- Pruebas: `tests/qa_sate_temarios.mjs` (DOM en memoria de `tests/dom_minimo.mjs`; incluye un documento que no es temario
  para comprobar la reutilización).
- Revisión visual local: `python tools/build_qa_temarios.py` y abrir `web/qa-temarios.html` (no se publica). Trae botones
  de tema y de ancho (1440, 1024, 768, 414, 375) y acepta `?tema=oscuro` y `?q=palabra` para ver el resaltado.
