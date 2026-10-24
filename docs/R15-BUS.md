# R15-BUS

## 1. Cambios

La portada de la Guía consulta un índice común fragmentado por fuente y, en programas y reglamentos, por carrera y documento. El manifiesto y los fragmentos se descargan al buscar; las consultas acotadas descargan únicamente su fuente. Se comparten las cadenas repetidas, se normaliza en memoria y se reutiliza el vocabulario de `data/guia/rutas.json`. Los resultados conservan enlace interno, migas, fragmento y carrera; las materias homónimas se agrupan.

El lector conserva un contexto pegajoso con reglamento, ubicación y artículo, búsqueda propia y cambio de documento. El título de pestaña sigue al artículo visible. Las referencias y las citas existentes de SATE abren la misma consulta flotante, con cierre por Esc y devolución del foco sin desplazar el origen. El marcado envuelve segmentos del texto original; no se corrigen ni sustituyen transcripciones.

## 2. Tamaño del índice

Bytes UTF-8 de los fragmentos JSON, sin compresión HTTP ni manifiesto. Los datos son derivados del contenido disponible en esta rama.

| Fuente | UPIITA | ESCOM | UPIBI |
|---|---:|---:|---:|
| Preguntas, rutas y glosario | 44 679 | 42 158 | 42 158 |
| Programas de estudio | 748 263 | 0 | 0 |
| Reglamentos | 1 045 496 | 1 042 597 | 1 042 597 |
| ¿A quién acudo? | 184 676 | 8 855 | 8 820 |
| Actividades y servicios | 17 567 | 0 | 0 |
| Formatos y trámites | 5 039 | 2 290 | 2 290 |
| Calendario | 20 098 | 9 787 | 9 787 |

## 3. Referencias reproducibles

`python tools/guia_busqueda.py` genera `data/referencias/reglamentos.json` y `docs/referencias-ambiguas.json`: 111 referencias resueltas y 87 ambiguas. Cada registro conserva documento y artículo de origen, posiciones Unicode y mención literal. Solo se enlazan destinos disponibles; nombres desconocidos, enumeraciones y párrafos sin ancla verificable quedan sin enlace. La compilación copia el artefacto revisable, sin sustituirlo por una extracción nueva.

## 4. Validación y límites

QA DOM/CSS a 1300, 1024, 768 y 375 px, claro y oscuro, sin red ni navegador. Las comprobaciones incluyen carga perezosa, acotación, carreras, vocabulario coloquial, enlaces internos, literalidad de referencias, consulta flotante y títulos al navegar y desplazarse. El DOM mínimo no calcula geometría, contraste efectivo ni solapamientos reales.

Se verifican los artículos y las fracciones completos contra su origen. Las fracciones referencian segmentos Unicode del artículo para evitar duplicar su texto en la descarga. En cuatro artículos hay numeraciones de fracción repetidas en los datos originales: los resultados usan además su posición interna para abrir el bloque exacto, sin renumerar ni corregir el documento.

El repositorio contiene 13 reglamentos, no 14. CGC, equivalencias y ética conservan texto plano sin articulado fiable: se indexa el texto disponible y se enlaza su sección de lectura; no se inventan artículos. ESCOM y UPIBI carecen de programas compilables y actividades en estos datos. Las alusiones ambiguas requieren revisión documental; no se han consultado fuentes externas.

Las huellas oficiales no se regeneran. Compilación de las tres unidades y cierre con solo UPIITA mediante `UPIITA_SITE=https://guinda-labs.github.io/prueba/`. Sin commit ni push.

Resultado: 55 archivos `qa_sate*.mjs` aprobados; pytest completo con 188 pruebas aprobadas y 798 omitidas por las condiciones de la suite, excluyendo el fuzz prohibido por el encargo. Verificación final: 19 701 huellas intactas y cinco HTML con 13 bloques de script, además de los módulos, parseados sin errores. Se retiraron los auxiliares y temporales de ejecución.
