# Búsqueda global de la Guía

## 1. Respuesta directa

Se normalizan acentos y mayúsculas, se aplican los sinónimos y las palabras vacías de `data/guia/rutas.json`, y se eliminan duplicados. Para reconocer definiciones también se omiten «es» y «son». Todas las palabras restantes deben coincidir con palabras completas del nombre de un término del Glosario. Estos términos tienen prioridad sobre las preguntas: «consejo consultivo» devuelve el General y el Escolar, con sus definiciones propias, las citas literales y los enlaces a instancias disponibles en cada unidad.

Las referencias `definicionFuentes` del Glosario identifican los artículos que definen o integran el órgano. Si no hay referencias específicas se usa `fuente`. Se leen los textos del reglamento existente, sin duplicarlos ni reescribirlos; cada fracción tiene su cita y abre la vista flotante con esa fracción. El General cita RI 184–185 y LO 25; el Escolar, RI 202–203 y LO 27–28. La atribución `data-oficial` cubre únicamente la transcripción.

Sin término coincidente, una intención declarada vale 100 puntos solo si cubre exactamente la consulta significativa. Para las demás preguntas se exigen todas las palabras en su contenido y al menos el 75 % en el título, redondeando hacia arriba. La puntuación es `3 × palabras en contenido + 4 × palabras en título`; el umbral es 7. Una coincidencia solo en la respuesta o en palabras auxiliares no basta. Sin candidata suficiente se omite el bloque. Esta regla no modifica la búsqueda general de resultados ni las sugerencias rápidas.

## 2. Resultados y conteos

Los grupos ocupan una sola columna y usan el mismo componente de fila, tipografía, espaciado e interlineado. La respuesta directa tiene una medida máxima de 68 caracteres. Los enlaces de resultados mantienen flujo de texto normal para conservar espacios entre marcas, también con acentos y referencias internas.

Los reglamentos con coincidencias en el texto de artículos preceden a los que solo coinciden en portada, título o ubicación. Entre los primeros se prioriza RGE cuando aparece y después el número de artículos distintos coincidentes; la puntuación deshace empates. Las fracciones de un artículo cuentan una sola vez en la cabecera y en «Ver los N de este reglamento ›». Se muestra una sola fila por artículo, conservando la entrada de mayor puntuación. La portada no aumenta ese conteo. El conteo del grupo Reglamentos indica documentos; los conteos de cada reglamento indican expresamente artículos. Los demás grupos cuentan entradas del índice. Las coincidencias solo documentales se identifican como título o portada y ofrecen abrir el reglamento.

## 3. Validación y limitaciones

Las QA usan el DOM local del repositorio y funciones puras, sin navegador ni red. Comprueban conservación literal, acentos, pertinencia, orden, conteos, filtro de carrera y enlaces flotantes. Las reglas CSS cubren reflujo y medida de lectura; no sustituyen una comprobación visual de geometría en los anchos 1440, 1024, 768, 375 y 320.

Validación del 2026-10-26: ESCOM, UPIBI y UPIITA compiladas; última compilación solo UPIITA con `UPIITA_SITE=https://guinda-labs.github.io/prueba/`. Las 19 701 huellas permanecen intactas. Pytest completo según R4 §5: 192 aprobadas, 798 omitidas y 801 subpruebas aprobadas. Ejecutadas las 58 `qa_sate*.mjs`: 57 aprobadas; falla `qa_sate_desempeno.mjs:78` con `TypeError: strip.scrollTo is not a function`, porque el doble de DOM de esa QA no implementa el método que llama `renderKardexLista` en `desempeno.js`. Ambos archivos conservan el contenido de HEAD y no se modificaron en este encargo. La QA de búsqueda se volvió a ejecutar tras los ajustes finales y pasa. No se ejecutaron los lanzadores prohibidos de R4 §6.
