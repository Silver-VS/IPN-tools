# Planes de estudio del IPN: extracción local de mapas curriculares escaneados

`tools/planes_ipn.py` indexa los PDF de mapas curriculares de ipn.mx; `tools/planes_ocr.py` los convierte en JSON.
Todo corre en local (PDF → PNG → OCR → análisis → validación → comparación) y **nada de lo que produce se sube al
repositorio**: PDF, imágenes y JSON viven en `UPIITA_DEV/recursos/planes-ipn/` (`pdf/`, `img/`, `json/`).

## Uso

```bash
D:/Tools/ai-venv/Scripts/python.exe tools/planes_ocr.py            # todos los PDF de recursos/planes-ipn/pdf/
D:/Tools/ai-venv/Scripts/python.exe tools/planes_ocr.py ruta.pdf   # uno solo
... --solo-ocr    # solo renderizar y hacer OCR
... --sin-llm     # sin respaldo con qwen3.5:9b
```

Requiere Ollama en `127.0.0.1:11434` con `glm-ocr` (y `qwen3.5:9b` para el respaldo). Imprime una línea por paso
(`[n/M] <pdf> pág <p> · ocr|análisis|validación`). Las páginas y el texto del OCR se guardan en caché
(`img/<pdf>-p<N>.png`, `.ocr.txt`, `.ocr.json` con prompt y segundos); borra la caché de una página para repetirla.

## Qué hace

1. **OCR** con `glm-ocr` a 2400 px, `Table Recognition:`; si no salen filas numéricas prueba `Text Recognition:` y
   conserva el resultado más completo. El modelo suele caer en bucle repitiendo encabezados: se lee en flujo y se
   corta al detectar un ciclo de 1 a 6 líneas repetido 3 veces. No usar `repeat_penalty` > 1: Ollama aborta con 500
   («token repeat limit») y se pierde el texto.
2. **Analizador determinista** (`analizar`): niveles (`NIVEL I`, `SEMESTRE 1`, «primer semestre»), materias con
   teoría, práctica, T/H, créditos TEPIC y SATCA (si existen; las columnas se deducen del encabezado), nombre y
   números en la misma línea o separados, números partidos en varias líneas, SUBTOTAL, TOTAL y bloques de optativas
   (por nivel o por trayectoria, con sus etiquetas «OPTATIVA A1 o B1»). Si una página no tiene estructura reconocible
   y sí filas numéricas, usa `qwen3.5:9b` (JSON, `num_ctx` 8192) y lo marca en `validacion.marcas`.
3. **Validación**: suma por nivel contra SUBTOTAL y suma total contra TOTAL (tolerancia 0.05); lista materias
   sospechosas (T+P ≠ T/H, o cuyo valor explica la diferencia). Si el OCR perdió columnas del TOTAL, cada valor
   debe coincidir con alguna suma.
4. **Comparación** con `data/` (sin modificarlo): materias que faltan o sobran por nombre normalizado, créditos
   TEPIC y niveles distintos. Plan comparado: IB → B/09, IM → M/09 (UPIITA), ISC → C/20 (ESCOM).

Salida `json/<pdf>.json`: `fuente, programa, unidades, plan, niveles[{nivel, materias[{nombre, teoria, practica,
horas, creditos_tepic, creditos_satca}], subtotal}], optativas, total, validacion, comparacion_repo,
paginas_no_tabla, tiempos`.

## Limitaciones

- El OCR cambia letras («SIMULAGION», «MATEMATICAS DISCRETA»): la validación por sumas no detecta un error de
  letras, solo de cifras; por eso la comparación con el SAES sirve de segunda barrera.
- Hay PDF cuyo TOTAL aparece incompleto o ausente (IB: sin TOTAL; IM: solo horas y SATCA): se informa, no es error.
- Las optativas por trayectoria (ESCOM) traen el nombre en inglés bajo un título en español; los SAES guardan
  «título + nombre». Esas diferencias de nombre aparecen como faltan/sobran y no son errores del plan.
- Una cifra mal leída que conserve la suma (dos errores que se compensan) pasa la validación. Las materias
  de respaldo con LLM siempre deben revisarse a mano.
- Páginas distintas de tabla (portadas, textos normativos) se guardan en `paginas_no_tabla`.
