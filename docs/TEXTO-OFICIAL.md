# Texto oficial

## 1. Regla y alcance

«Todo lo que sea exacto por documento no se cambia». Reglamentos, programas, funciones y nombres de áreas/departamentos se conservan literalmente. Solo se redactan nuestros bloques. `data-oficial` identifica transcripciones sin cambiar su aspecto; la ausencia identifica texto propio o elementos de interfaz. Una fuente citada por una explicación no convierte esa explicación en transcripción.

El inventario ejecutable es `data/texto_oficial.json`: cada archivo declara `oficial: true`, fuente común y campos JSON Pointer. `*` selecciona un nivel de lista o diccionario. No se duplica la fuente en miles de registros. Se heredan `fuente`, `pagina`, `paginas`, `n`, `pdf` y `archivo` del registro más cercano. Las huellas protegen tanto ese contexto como el origen común mediante `procedencia_sha256`, sin duplicar las fuentes. Las referencias `fuente.doc` se resuelven con `documentos` de la Guía común y de la unidad. Los artículos conservan su número; los programas, su clave y PDF/archivo; SAES no tiene paginación.

## 2. Archivos y campos oficiales

| Archivo | Campos protegidos | Textos |
|---|---|---:|
| `data/calendario.json` | `/upiita/actividades/*/desde`, `/upiita/actividades/*/hasta`, `/upiita/eventos/*/desde`, `/upiita/eventos/*/hasta` | 164 |
| `data/calendario_ipn.json` | `/eventos/*/titulo`, `/eventos/*/desde`, `/eventos/*/hasta`, `/periodos/*/inicio_clases`, `/periodos/*/fin_clases` | 197 |
| `data/denominaciones_oficiales.json` | `/*` | 14 |
| `data/guia/comun.json` | `/documentos/*/titulo`, `/acudir/*/nombre`, `/acudir/*/objetivo/texto`, `/acudir/*/funciones/*/texto`, `/acudir/*/procedimientos/*/nombre` | 46 |
| `data/guia/escom.json` | `/documentos/*/titulo`, `/acudir/*/nombre`, `/acudir/*/objetivo/texto`, `/acudir/*/funciones/*/texto`, `/acudir/*/procedimientos/*/nombre` | 10 |
| `data/guia/organigrama-upiita.json` | `/raiz/nombre`, `/raiz/colegiados/*`, `/raiz/apoyo/*`, `/raiz/areas/*/nombre`, `/raiz/areas/*/colegiados/*`, `/raiz/areas/*/dependencias/*` | 27 |
| `data/guia/upibi.json` | `/documentos/*/titulo`, `/acudir/*/nombre`, `/acudir/*/objetivo/texto`, `/acudir/*/funciones/*/texto`, `/acudir/*/procedimientos/*/nombre` | 10 |
| `data/guia/upiita.json` | `/documentos/*/titulo`, `/acudir/*/nombre`, `/acudir/*/objetivo/texto`, `/acudir/*/funciones/*/texto`, `/acudir/*/procedimientos/*/nombre` | 838 |
| `data/horarios_upiita.json` | `/carreras/*`, `/actual/*/Asignatura`, `/proximo/*/Asignatura` | 1448 |
| `data/mapa_curricular_saes.json` | `/rows/*/4` | 658 |
| `data/reglamentos/becas.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 193 |
| `data/reglamentos/cambio_carrera.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 48 |
| `data/reglamentos/cgc.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 2 |
| `data/reglamentos/equivalencias.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 2 |
| `data/reglamentos/etica.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 2 |
| `data/reglamentos/honor.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 280 |
| `data/reglamentos/indice.json` | `/*/titulo` | 13 |
| `data/reglamentos/lo.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 214 |
| `data/reglamentos/ocr/cambio_carrera.txt` | `/texto` | 1 |
| `data/reglamentos/ocr/equivalencias.txt` | `/texto` | 1 |
| `data/reglamentos/rge.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 283 |
| `data/reglamentos/ri.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 1425 |
| `data/reglamentos/ro.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 1258 |
| `data/reglamentos/servicio_social.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 242 |
| `data/reglamentos/subcomite_becas.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 281 |
| `data/reglamentos/titulacion.json` | `/titulo`, `/estructura/*/titulo`, `/estructura/*/hijos/*/titulo`, `/articulos/*/ubicacion/*`, `/articulos/*/texto`, `/articulos/*/fracciones/*/texto`, `/transitorios/*/texto`, `/texto` | 141 |
| `data/salones_26-2.json` | `/clases/*/materia` | 2105 |
| `data/salones_27-1.json` | `/clases/*/materia` | 2171 |
| `data/temarios/upiita/bionica.json` | `/materias/*/nombre`, `/materias/*/objetivo`, `/materias/*/orientacion`, `/materias/*/evaluacion`, `/materias/*/academia`, `/materias/*/vigencia`, `/materias/*/contenidos/*/titulo`, `/materias/*/contenidos/*/subtemas/*`, `/materias/*/bibliografia/*/texto` | 1075 |
| `data/temarios/upiita/mecatronica.json` | `/materias/*/nombre`, `/materias/*/objetivo`, `/materias/*/orientacion`, `/materias/*/evaluacion`, `/materias/*/academia`, `/materias/*/vigencia`, `/materias/*/contenidos/*/titulo`, `/materias/*/contenidos/*/subtemas/*`, `/materias/*/bibliografia/*/texto` | 1432 |
| `data/temarios/upiita/telematica.json` | `/materias/*/nombre`, `/materias/*/objetivo`, `/materias/*/orientacion`, `/materias/*/evaluacion`, `/materias/*/academia`, `/materias/*/vigencia`, `/materias/*/contenidos/*/titulo`, `/materias/*/contenidos/*/subtemas/*`, `/materias/*/bibliografia/*/texto` | 1075 |
| `data/trayectoria_B.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 121 |
| `data/trayectoria_M.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 135 |
| `data/trayectoria_T.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 109 |
| `data/unidades/escom/horarios_saes.json` | `/carreras/*`, `/actual/*/Asignatura`, `/proximo/*/Asignatura` | 672 |
| `data/unidades/escom/mapa_curricular_saes.json` | `/rows/*/4` | 521 |
| `data/unidades/escom/trayectoria_A.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 82 |
| `data/unidades/escom/trayectoria_B.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 86 |
| `data/unidades/escom/trayectoria_C.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 96 |
| `data/unidades/upibi/horarios_saes.json` | `/carreras/*`, `/actual/*/Asignatura`, `/proximo/*/Asignatura` | 1032 |
| `data/unidades/upibi/mapa_curricular_saes.json` | `/rows/*/4` | 403 |
| `data/unidades/upibi/mapas_pdf/alimentos-2006.json` | `/titulo`, `/materias/*/nombre` | 60 |
| `data/unidades/upibi/mapas_pdf/ambiental-2006.json` | `/titulo`, `/materias/*/nombre` | 61 |
| `data/unidades/upibi/mapas_pdf/biomedica-2006.json` | `/titulo`, `/materias/*/nombre` | 66 |
| `data/unidades/upibi/mapas_pdf/biotecnologia-2006.json` | `/titulo`, `/materias/*/nombre` | 60 |
| `data/unidades/upibi/mapas_pdf/biotecnologia-2024.json` | `/titulo`, `/materias/*/nombre` | 65 |
| `data/unidades/upibi/mapas_pdf/farmaceutica-2006.json` | `/titulo`, `/materias/*/nombre` | 61 |
| `data/unidades/upibi/trayectoria_A.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 62 |
| `data/unidades/upibi/trayectoria_B.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 69 |
| `data/unidades/upibi/trayectoria_B_06.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 61 |
| `data/unidades/upibi/trayectoria_F.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 63 |
| `data/unidades/upibi/trayectoria_L.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 61 |
| `data/unidades/upibi/trayectoria_M.json` | `/boxes/*/texto`, `/boxes/*/text`, `/boxes/*/nombre` | 68 |
| `data/unidades_identidad.json` | `/unidades/*/nombre`, `/unidades/*/nombreCompleto` | 31 |

## 3. Textos propios y datos mixtos

| Ubicación | Clasificación |
|---|---|
| `contenido/textos/es.toml` | Redacción y rótulos propios. Las claves documentales migradas se conservan en la API de `tools/contenido.py`, pero sus valores viven en `data/denominaciones_oficiales.json`. |
| `data/guia/*.json` | Preguntas, respuestas, pasos, glosario, resúmenes de documentos, `para`, orientación, necesidades, participación en procedimientos y notas son redacción propia. Solo los campos del inventario son literales. |
| `data/temarios/upiita/descripciones/*.json` | Descripciones redactadas para SATE; no son el programa oficial. |
| `data/recursos/**` | Selección y fichas de orientación propias; enlaces a terceros no son transcripciones. |
| `data/actividades.json` | Catálogo R27 cotejado: `nombre`, `descripcion`, `requisitos`, `horario`, `lugar` y `contacto` se conservan literalmente del bloque aprobado. Cada elemento declara su URL y localizador en `fuente`; `nota`, `estado`, `seccion` y controles son metadatos u orientación. `no_verificado` se muestra mediante una clave de texto propio. |
| `data/calendario.json` | Fechas procedentes de avisos protegidas; títulos abreviados, instrucciones, condiciones y notas son adaptaciones propias. |
| `data/categorias.json`, `data/energia_areas.json`, `data/unidades/*/areas_*.json` | Clasificación propuesta por el proyecto, no nombres de departamentos de los manuales. |
| `data/especialidades.json`, `data/unidades/*/optativas.json` | Agrupaciones de trayectorias y propuestas; no atribuirles carácter normativo. Los nombres de materias se protegen en las capturas y mapas. |
| `data/creditos_oficiales.json`, `data/seriacion*.json`, `data/unidades/upibi/equivalencias.json` | Créditos y relaciones académicas, sin bloques documentales textuales; sus fuentes son metadatos. Este candado es de texto, no certifica reglas de negocio ni números. |
| `data/gestion_escolar/bajas.json`, `data/dictamen_motivos.json` | URLs, configuración de formatos y relaciones a artículos; no contienen articulado literal. |
| `data/sate.json`, `data/cuenta.json`, `data/recorrido.json`, `data/sugerencias.json`, `data/encuesta.json`, `data/vigilancia_salones.json`, `data/identidad/*`, `data/unidades/*/unidad.json` | Configuración, rótulos, enlaces y notas propias; no contenido de manuales. |
| `data/perfiles-prueba/*` | Datos ficticios, excluidos del inventario documental. |
| `data/seriacion_reporte.md` | Análisis generado del proyecto. |

## 4. Actualización deliberada y verificación

`python tools/huellas_oficiales.py` verifica; `python -m pytest -q tests/test_texto_oficial.py` comprueba huellas, normalización, procedencia y separación del catálogo. SHA-256 se calcula sobre UTF-8 tras sustituir cualquier secuencia de espacios por un solo espacio y eliminar espacios extremos. No se normalizan mayúsculas, acentos ni puntuación. Se detectan cambios, altas, bajas y cambios de procedencia.

Para una nueva edición, revisar primero la fuente y el inventario, actualizar solo lo que cambió en el documento y ejecutar `python tools/huellas_oficiales.py --actualizar --motivo "documento nuevo, edición y páginas"`. El motivo queda en la línea base y en su historial. Compilar no actualiza huellas. No regenerarlas para hacer pasar una prueba tras una corrección editorial.

Los QA DOM existentes de Guía, reglamentos, temarios y calendario comprueban `data-oficial` y que las explicaciones propias no lo tengan. Los lectores contienen también controles propios: se marca el contenido documental, no la búsqueda, los botones ni los avisos de OCR. Los nuevos resaltados heredan la procedencia de su texto.

## 5. Aclaraciones y pendientes

Esta línea base protege las transcripciones existentes, incluidas sus posibles erratas de extracción/OCR. Sin red ni PDFs originales cotejados no certifica su exactitud. Donde las extracciones antiguas no registraron página, el inventario lo declara; no se inventaron páginas. Un cotejo futuro debe completar esos localizadores con el documento correspondiente y un motivo explícito.

## 6. Validación R14-MARCA (2026-10-23)

Compiladas ESCOM, UPIBI y UPIITA con `UPIITA_SITE=https://guinda-labs.github.io/prueba/`. Última compilación: solo UPIITA. Candado: 19 701 huellas de 54 archivos. Pytest: 183 aprobadas, 798 omitidas y 800 subpruebas aprobadas, con `--ignore=tests/test_fuzz_perfiles.py -p no:cacheprovider --basetemp=.cache/pytest-r14-marca`.

Se ejecutaron todas las `tests/qa_sate*.mjs`. Las QA del módulo, arquitectura, seguridad, scripts y Ventanilla pasan tras los ajustes. Permanece un fallo ajeno a este cambio en `qa_sate_diseno.mjs:338`: a `.box .plan-marca` de `web/sate/cascaron.html` le falta el comentario `/* escala del mapa */` dentro de su declaración `.72em`. Ni el cascarón ni esa QA se modificaron.

La verificación de marcas usa los DOM locales existentes; no es una comprobación visual en navegador real. No hay pruebas Playwright existentes. No se ejecutaron `qa_componentes.mjs`, `qa_dictamen.mjs` ni fuzz, ni se utilizó CDP, perfiles o red, conforme a seguridad §6.
