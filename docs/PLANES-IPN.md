# Planes de estudio del IPN: extracción local de mapas curriculares escaneados

`tools/planes_ipn.py` indexa los PDF de mapas curriculares de ipn.mx; `tools/planes_ocr.py` los convierte en JSON.
Todo corre en local (PDF → PNG → OCR → análisis → validación → comparación) y **nada de lo que produce se sube al
repositorio**: PDF, imágenes y JSON viven en `UPIITA_DEV/recursos/planes-ipn/` (`pdf/`, `img/`, `json/`).

## 1. Uso

```bash
D:/Tools/ai-venv/Scripts/python.exe tools/planes_ocr.py            # todos los PDF de recursos/planes-ipn/pdf/
D:/Tools/ai-venv/Scripts/python.exe tools/planes_ocr.py ruta.pdf   # uno solo
... --solo-ocr    # solo renderizar y hacer OCR
... --sin-llm     # sin respaldo con qwen3.5:9b
... --solo-analisis # regenera JSON exclusivamente desde img/*.ocr.txt; sin render, OCR ni Ollama
... --relectura [pdf ...] # relee en franjas a mayor resolución los PDF con estado 'discrepancia' (sección 2b)
```

El modo OCR requiere Ollama en `127.0.0.1:11434` con `glm-ocr` (y `qwen3.5:9b` para el respaldo).
`--solo-analisis` descubre los PDF a partir de la caché, incluso sin los archivos PDF; una caché ausente
se informa como error, sin intentar obtenerla. Es incompatible con `--solo-ocr`. Imprime una línea por paso
(`[n/M] <pdf> pág <p> · ocr|análisis|validación`). Las páginas y el texto del OCR se guardan en caché
(`img/<pdf>-p<N>.png`, `.ocr.txt`, `.ocr.json` con prompt y segundos); borra la caché de una página para repetirla.

## 2. Qué hace

1. **OCR** con `glm-ocr` a 2400 px, `Table Recognition:`; si no salen filas numéricas prueba `Text Recognition:` y
   conserva el resultado más completo. El modelo suele caer en bucle repitiendo encabezados: se lee en flujo y se
   corta al detectar un ciclo de 1 a 6 líneas repetido 3 veces. No usar `repeat_penalty` > 1: Ollama aborta con 500
   («token repeat limit») y se pierde el texto.
2. **Analizador determinista** (`analizar`): niveles (`NIVEL I`, `SEMESTRE 1`, «primer semestre»), materias con
   teoría, práctica, T/H, créditos TEPIC y SATCA (si existen; las columnas se deducen del encabezado), nombre y
   números en la misma línea o separados, números partidos en varias líneas, SUBTOTAL, TOTAL y bloques de optativas
   (por nivel o por trayectoria, con sus etiquetas «OPTATIVA A1 o B1»). Si una página no tiene estructura reconocible
   y sí filas numéricas, usa `qwen3.5:9b` (JSON, `num_ctx` 8192) y lo marca en `validacion.marcas`.
3. **Validación**: suma por nivel contra SUBTOTAL y suma total contra TOTAL (tolerancia 0.05 en TEPIC y horas; **0.25 por nivel en créditos SATCA**, porque los PDF
   redondean: p. ej. it-upiita difiere 0.2); lista materias
   sospechosas (T+P ≠ T/H, o cuyo valor explica la diferencia). Si el OCR perdió columnas del TOTAL, cada valor
   debe coincidir con alguna suma.
4. **Comparación** con `data/` (sin modificarlo): materias que faltan o sobran por nombre normalizado, créditos
   TEPIC y niveles distintos. Plan comparado: IB → B/09, IM → M/09 (UPIITA), ISC → C/20 (ESCOM).

Salida `json/<pdf>.json`: `fuente, programa, unidades, plan, niveles[{nivel, materias[{nombre, teoria, practica,
horas, creditos_tepic, creditos_satca}], subtotal}], optativas, total, validacion, comparacion_repo,
paginas_no_tabla, tiempos`.

`validacion.estado`: `ok` si cuadran los subtotales y las demás referencias disponibles; `solo_total` si solo
existe TOTAL y cuadra; `sin_referencia` si no existe ninguna referencia (no es error); `discrepancia` si alguna
referencia no cuadra, con nivel, campo y diferencia. `no_es_tabla` identifica documentos sin estructura curricular;
una tabla cuyo OCR perdió nombres o cifras conserva la discrepancia. `json/_resumen.json` contiene conteos y
estado/motivo de cada PDF. Las líneas no clasificadas quedan completas en `validacion.marcas`.

Se admiten tablas HTML del OCR, encabezados PERÍODO, referencias y cifras partidas, guiones de carga cero,
bloques de nombres seguidos de cifras, columnas solo de créditos y AA (aprendizaje autónomo). TOTAL repetido
por semestre se trata como subtotal. Los catálogos de optativas se excluyen de la suma obligatoria; electivas
de dos créditos sin horas se registran en el nivel 0. Los PDF con varios planes conservan `nivel.plan`,
`totales_por_plan` y `validacion.por_plan`; las opciones/trayectorias explícitas se validan por separado.

## 2b. Relectura en franjas (`--relectura`)

Para los PDF cuyo `validacion.estado` es `discrepancia` (por omisión todos; o los que se indiquen):

1. Re-analiza el `.ocr.txt` original con las reglas actuales (tolerancia SATCA 0.25). Si ya cuadra (`ok`), no gasta OCR.
2. Si no, renderiza cada página a 3600 px de lado largo y la corta en franjas horizontales con 12 % de traslape
   (3 franjas en páginas apaisadas, 4 en verticales); cada borde se ajusta a la fila más blanca cercana para no
   partir texto. OCR de cada franja con `glm-ocr` «Table Recognition:» (misma protección contra bucles) y unión del
   texto quitando las líneas duplicadas por el traslape.
3. Re-analiza con el texto nuevo y conserva el mejor resultado: `ok` > `solo_total` > `discrepancia`; entre
   discrepancias, la de menor diferencia total (suma de |dif| de niveles y TOTAL; cada referencia parcial perdida
   vale 1; sin materias = infinita). También prueba combinaciones por página (original o relectura en cada una; `fuente_ganadora` = «mixta (…)»).
   Antes de unir, se quitan cercos ```` ``` ```` y bloques repetidos (`quitar_bloques`). El JSON anota `relectura.fuente_ganadora` (`original`|`relectura`),
   `estado_antes`, `estado_despues`, `dif_original`, `dif_final` y segundos por página; `_resumen.json` agrega `fuente`.
4. Caché propia, sin tocar el OCR original: `img/<pdf>-p<N>-hr.json` (cortes), `-hr-f<k>.png`, `.ocr2.txt`
   y `.ocr2.json`. Es **reanudable**: al repetir el comando se salta lo ya presente en caché. Borra los
   `-p<N>-hr*` de un PDF para repetir su relectura.
5. Prueba (2026-10-06, ienergia-upiita e ibm-upibi): ~11 s por franja, ~45 s por página; la relectura no mejoró
   (conservó el original): `glm-ocr` en franjas estrechas inventa encabezados y mezcla semestres. Es una opción más, no
   una garantía. Lote completo: 140 páginas / 560 franjas, ~1.5 a 2 h.
6. Progreso: `[n/M] <pdf> pág <p> franja <k> · ocr (14 s)` por franja y, al final de cada PDF,
   `<pdf>: estado antes → después (fuente: ...)`.

## 3. Limitaciones y pendientes

- El OCR cambia letras («SIMULAGION», «MATEMATICAS DISCRETA»): la validación por sumas no detecta un error de
  letras, solo de cifras; por eso la comparación con el SAES sirve de segunda barrera.
- Hay PDF cuyo TOTAL aparece incompleto o ausente (IB: sin TOTAL; IM: solo horas y SATCA): se informa, no es error.
- Las optativas por trayectoria (ESCOM) traen el nombre en inglés bajo un título en español; los SAES guardan
  «título + nombre». Esas diferencias de nombre aparecen como faltan/sobran y no son errores del plan.
- Una cifra mal leída que conserve la suma (dos errores que se compensan) pasa la validación. Las materias
  de respaldo con LLM siempre deben revisarse a mano.
- Páginas distintas de tabla (portadas, textos normativos) se guardan en `paginas_no_tabla`.
- Persisten filas desordenadas o truncadas, nombres concatenados sin delimitador, referencias no rotuladas y
  catálogos/alternativas cuyo contexto se perdió. ENMH conserva nombres sin cifras individuales; IAM perdió
  los nombres. No se reconstruyen cifras a partir de subtotales ni se corrige la caché para forzar coincidencias.

## 4. Comprobación local (2026-10-06)

`D:/Tools/ai-venv/Scripts/python.exe -m unittest tests.test_planes_ocr` ejecuta pruebas unitarias y de integración.
Con el corpus y `json/_antes.json` disponibles también regenera los 82 JSON con red/OCR/LLM bloqueados por las
pruebas y compara los 20 válidos originales: niveles, materias, cifras y TOTAL sin cambios. La línea base era
20 válidos, 54 discrepancias y 8 vacíos; después son 35 `ok` y 47 `discrepancia` (los demás estados, 0).
