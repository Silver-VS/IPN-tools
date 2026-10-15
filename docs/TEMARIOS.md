# Temarios de UPIITA

## 1. Fuente, extracción y criterio

Generado por `python tools/temarios_extraer.py`. Solo lectura de OCR local; no hay llamadas de red.
Cada JSON contiene `carrera`, `plan`, `materias` y `duplicados`. Campos ausentes: cadena vacía, lista vacía, objeto vacío o nivel nulo.
Se prefiere la página «PROGRAMA SINTÉTICO» sobre perfiles docentes y programas desarrollados. Objetivo incluye el encabezado equivalente «Propósito de la unidad de aprendizaje». No se exportan autores ni firmas.
Si solo hay páginas desarrolladas, se recuperan las unidades con N°/nombre y sus subtemas. Las cifras de horas y referencias dentro de sus filas se conservan como texto fuente, sin reinterpretarlas.
Duplicados: mayor puntuación, más campos principales completos, mayor coincidencia entre archivo y título, y ruta en orden estable.
El plan se identifica por coincidencias de claves con la trayectoria existente. El reporte incluye también el plan histórico sin atribuirle los temarios del plan seleccionado.
Puntuación = 0.92 × similitud de nombres normalizados (SequenceMatcher) + 0.08 × coincidencia de nivel. Se conservan los números romanos terminales.
Se asigna clave con puntuación ≥ 0.86 y margen al segundo candidato ≥ 0.035; se revisan puntuaciones < 0.98. No es una probabilidad estadística.
El tipo de carpeta (optativa/elegible) prevalece sobre el SAES; los desacuerdos se registran. El resto usa el tipo SAES. Créditos y horas proceden exclusivamente del OCR.
Bibliografía sin columnas inequívocas B/C mantiene tipo vacío. Una línea OCR por entrada puede conservar referencias partidas; requiere cotejo editorial. Los contenidos sin numeración conservan número vacío.
Ingeniería en Energía queda fuera: no hay fuente disponible.

## 1b. Descripciones breves (DESC1)

`data/temarios/upiita/descripciones/<carrera>.json` guarda, por clave, una descripción de 25 a 45 palabras redactada a partir del objetivo y de los títulos de unidades del programa sintético (`base`). **No son textos oficiales del IPN y están pendientes de revisión humana** (`revisada: false`). El extractor no las sobrescribe; `tools/build_sate.py` las une a cada materia. Se omiten las materias con temario parcial o vacío (B207, B412, M121, M414, M415, M416, M418, T221). Si una materia no tiene descripción, la ficha no muestra el objetivo en bruto. Créditos y horas ausentes en el temario se completan con el plan del SAES (cifras semanales) o se ocultan.

## 2. Bionica

Plan 09: **72 / 79** materias SAES con temario; 74 OCR de entrada.

| Plan | Clave | Nombre SAES | Nivel | Temario (PDF relativo) | Puntuación |
| --- | --- | --- | --- | --- | --- |
| 09 | B101 | BIOLOGIA CELULAR | 1 | bionica/NIVEL_I/BIOLOGÍA CELULAR.pdf | 1.0 |
| 09 | B102 | QUIMICA ORGANICA | 1 | Sin temario |  |
| 09 | B103 | ALGEBRA LINEAL | 1 | bionica/NIVEL_I/ALGEBRA LINEAL.pdf | 1.0 |
| 09 | B104 | CALCULO DIFERENCIAL E INTEGRAL | 1 | bionica/NIVEL_I/CALCULO DIFERENCIAL E INTEGRAL.pdf | 1.0 |
| 09 | B105 | CALCULO VECTORIAL | 1 | bionica/NIVEL_I/CALCULO VECTORIAL.pdf | 1.0 |
| 09 | B106 | FUNDAMENTOS DE FISICA PARA LA INGENIERIA | 1 | bionica/NIVEL_I/FUNDAMENTOS DE FÍSICA PARA LA INGENIERÍA.pdf | 1.0 |
| 09 | B107 | FUNDAMENTOS DE TEORIA ELECTROMAGNETICA | 1 | bionica/NIVEL_I/FUNDAMENTOS DE TEORÍA ELECTROMAGNÉTICA.pdf | 1.0 |
| 09 | B108 | BIOESTADISTICA | 1 | bionica/NIVEL_I/BIOESTADÍSTICA.pdf | 1.0 |
| 09 | B109 | METROLOGIA | 1 | bionica/NIVEL_I/METROLOGÍA.pdf | 1.0 |
| 09 | B110 | PROGRAMACION ORIENTADA A OBJETOS | 1 | bionica/NIVEL_I/PROGRAMACIÓN ORIENTADA A OBJETOS.pdf | 1.0 |
| 09 | B111 | ANATOMIA | 1 | bionica/NIVEL_I/ANATOMÍA.pdf | 1.0 |
| 09 | B112 | HERRAMIENTAS COMPUTACIONALES | 1 | bionica/NIVEL_I/HERRAMIENTAS COMPUTACIONALES.pdf | 1.0 |
| 09 | B113 | ELECTIVA I | 1 | Sin temario |  |
| 09 | B114 | BIOETICA | 1 | bionica/NIVEL_I/BIOÉTICA.pdf | 1.0 |
| 09 | B115 | DESARROLLO SOSTENIBLE | 1 | bionica/NIVEL_I/DESARROLLO SOSTENIBLE.pdf | 1.0 |
| 09 | B116 | INGLES I | 1 | bionica/NIVEL_I/INGLÉS.pdf | 1.0 |
| 09 | B201 | ECUACIONES DIFERENCIALES | 2 | bionica/NIVEL_II/ECUACIONES DIFERENCIALES.pdf | 1.0 |
| 09 | B202 | FUNDAMENTOS MATEMATICOS DE INGENIERIA | 2 | bionica/NIVEL_II/FUNDAMENTOS MATEMÁTICOS DE INGENIERÍA_f.pdf | 1.0 |
| 09 | B203 | ONDAS ELECTROMAGNETICAS Y SISTEMAS RADIANTES | 2 | bionica/NIVEL_II/ONDAS ELECTROMAGNÉTICAS.pdf | 1.0 |
| 09 | B204 | FISICA MODERNA Y OPTICA | 2 | bionica/NIVEL_II/FÍSICA MODERNA Y ÓPTICA N.II.pdf | 1.0 |
| 09 | B205 | FISICOQUIMICA | 2 | bionica/NIVEL_II/FISICOQUIMICA0001.pdf | 1.0 |
| 09 | B206 | BIOQUIMICA | 2 | bionica/NIVEL_II/BIOQUÍMICA_f.pdf | 1.0 |
| 09 | B207 | TEORIA DE LOS CIRCUITOS | 2 | bionica/NIVEL_II/TEORIA DE LOS CIRCUITOS.pdf | 1.0 |
| 09 | B208 | FISIOLOGIA | 2 | bionica/NIVEL_II/FISIOLOGIA.pdf | 1.0 |
| 09 | B209 | BIOFISICA | 2 | bionica/NIVEL_II/Biofísica.pdf | 1.0 |
| 09 | B210 | BIOLOGIA MOLECULAR | 2 | bionica/NIVEL_II/BIOLOGÍA MOLECULAR_f.pdf | 1.0 |
| 09 | B211 | INVESTIGACION Y DESARROLLO DE PROYECTOS | 2 | bionica/NIVEL_II/INVESTIGACION Y DESARROLLO DE PROYECTOS.pdf | 1.0 |
| 09 | B212 | SISTEMAS DE GESTION DE CALIDAD | 2 | bionica/NIVEL_II/sistemas de gestion de calidad.pdf | 1.0 |
| 09 | B213 | BIOGNOSIS | 2 | bionica/NIVEL_II/BIOGNOSIS.pdf | 1.0 |
| 09 | B214 | ELECTIVA II | 2 | Sin temario |  |
| 09 | B215 | LIDERAZGO Y EMPRENDEDORES | 2 | bionica/NIVEL_II/LIDERAZGO Y EMPRENDEDORES.pdf | 1.0 |
| 09 | B216 | INGLES II | 2 | bionica/NIVEL_II/INGLÉS II.pdf | 1.0 |
| 09 | B301 | ANALISIS NUMERICO | 3 | bionica/NIVEL_III/Análisis Numérico.pdf | 1.0 |
| 09 | B302 | DISPOSITIVOS ELECTRONICOS | 3 | bionica/NIVEL_III/DISPOSITIVOS ELECTRÓNICOS_1.pdf | 1.0 |
| 09 | B303 | ELECTRONICA DIGITAL | 3 | bionica/NIVEL_III/Electrónica Digital.pdf | 1.0 |
| 09 | B304 | TEORIA DEL CONTROL | 3 | bionica/NIVEL_III/TEORÍA DEL CONTROL.pdf | 1.0 |
| 09 | B305 | BIOMATERIALES | 3 | bionica/NIVEL_III/Biomateriales.pdf | 1.0 |
| 09 | B306 | CONTROL NEURODIFUSO | 3 | bionica/NIVEL_III/Control Neurodifuso.pdf | 1.0 |
| 09 | b307 | COMUNICACION ORAL Y ESCRITA | 3 | bionica/NIVEL_III/OPTATIVAS/Comunicación Oral y Escrita.pdf | 1.0 |
| 09 | B308 | INGLES III | 3 | bionica/NIVEL_III/INGLÉS III.pdf | 1.0 |
| 09 | B309 | ELECTRONICA ANALOGICA Y DE POTENCIA | 3 | bionica/NIVEL_III/ELECTRÓNICA ANALÓGICA Y DE POTENCIA N.III.pdf | 1.0 |
| 09 | B310 | PROCESAMIENTO DE IMAGENES | 3 | bionica/NIVEL_III/PROCESAMIENTO DE IMAGENES N.III.pdf | 1.0 |
| 09 | B311 | BIOMAGNETISMO | 3 | bionica/NIVEL_III/BIOMAGNETISMO N.III.pdf | 1.0 |
| 09 | B312 | MECANISMOS BIOMIMETICOS | 3 | bionica/NIVEL_III/MECANISMOS BIOMIMÉTICOS N.III.pdf | 1.0 |
| 09 | B313 | BIOINSTRUMENTACION | 3 | bionica/NIVEL_III/BIOINSTRUMENTACION0001.pdf | 1.0 |
| 09 | B314 | PROCESAMIENTO DE SEÑALES BIOLOGICAS | 3 | bionica/NIVEL_III/PROCESAMIENTO DE SEÑALES BIOLOGICAS0001.pdf | 1.0 |
| 09 | B315 | SENSORES Y ACTUADORES | 3 | bionica/NIVEL_III/SENSORES Y ACTUADORES0001.pdf | 1.0 |
| 09 | B316 | CONTROL DE SISTEMAS BIOLOGICOS | 3 | bionica/NIVEL_III/OPTATIVAS/CONTROL DE SISTEMAS BIOLÓGICOS.pdf | 1.0 |
| 09 | B317 | PROTESIS BIOMIMETICAS | 3 | bionica/NIVEL_III/OPTATIVAS/PRÓTESIS BIOMIMÉTICAS.pdf | 1.0 |
| 09 | B318 | VISION ARTIFICIAL | 3 | bionica/NIVEL_III/OPTATIVAS/VISION ARTIFICIAL.pdf | 1.0 |
| 09 | B319 | INSTRUMENTACION BIOMEDICA | 3 | bionica/NIVEL_III/OPTATIVAS/INSTRUMENTACION BIOMEDICA.pdf | 1.0 |
| 09 | B320 | INTELIGENCIA ARTIFICIAL | 3 | bionica/NIVEL_III/OPTATIVAS/INTELIGENCIA ARTIFICIAL.pdf | 1.0 |
| 09 | B321 | ROBOTICA EVOLUTIVA Y AUTONOMA | 3 | bionica/NIVEL_III/OPTATIVAS/ROBOTICA EVOLUTIVA Y AUTONOMA.pdf | 1.0 |
| 09 | B322 | SIMULACION DE ANALISIS DE ESFUERZOS | 3 | bionica/NIVEL_III/OPTATIVAS/Simulación de análisis de esfuerzos.pdf | 1.0 |
| 09 | B323 | ERGONOMIA Y BIODINAMICA | 3 | bionica/NIVEL_III/OPTATIVAS/ERGONOMIA Y BIODINAMICA.pdf | 1.0 |
| 09 | B324 | INSTRUMENTACION CLINICA Y LABORATORIO | 3 | bionica/NIVEL_III/OPTATIVAS/INSTRUMENTACION CLINICA Y LABORATORIO.pdf | 1.0 |
| 09 | B401 | MODELADO Y CONTROL DE SISTEMAS BIONICOS | 4 | bionica/NIVEL_IV/MODELADO Y CONTROL DE SISTEMAS BIÓNICOS0001.pdf | 1.0 |
| 09 | B402 | DISPOSITIVOS PROGRAMABLES | 4 | bionica/NIVEL_IV/DISPOSITIVOS PROGRAMABLES0001.pdf | 1.0 |
| 09 | B403 | ANALISIS DE ESFUERZOS | 4 | bionica/NIVEL_IV/ANÁLISIS DE ESFUERZOS0001.pdf | 1.0 |
| 09 | B404 | MANUFACTURA DE ELEMENTOS BIOMIMETICOS | 4 | bionica/NIVEL_IV/MANUFACTURA DE ELEMENTOS BIOMIMÉTICOS0001.pdf | 1.0 |
| 09 | B405 | RECONOCIMIENTO DE PATRONES | 4 | bionica/NIVEL_IV/RECONOCIMIENTO DE PATRONES.pdf | 1.0 |
| 09 | B406 | NORMATIVIDAD Y GESTION TECNOLOGICA | 4 | bionica/NIVEL_IV/NORMATIVIDAD Y GESTIÓN TECNOLÓGICA.pdf | 1.0 |
| 09 | B407 | INSTRUMENTACION BIOTECNOLOGICA | 4 | bionica/NIVEL_IV/OPTATIVAS 2 Y 3/INSTRUMENTACIÓN BIOTECNOLÓGICA.pdf | 1.0 |
| 09 | B408 | BIOSENSORES Y BIOCHIPS | 4 | bionica/NIVEL_IV/OPTATIVAS 2 Y 3/BIOSENSORES Y BIOCHIPS.pdf | 1.0 |
| 09 | B409 | INGENIERIA DEL CONTROL HUMANO | 4 | bionica/NIVEL_IV/OPTATIVAS 2 Y 3/INGENIERIA DEL CONTROL HUMANO.pdf | 1.0 |
| 09 | B410 | SISTEMAS BIOMECANICOS | 4 | Sin temario |  |
| 09 | B411 | ELECTIVA III | 4 | Sin temario |  |
| 09 | B412 | SISTEMAS SENSORIALES | 4 | bionica/NIVEL_IV/OPTATIVAS 2 Y 3/SISTEMAS SENSORIALES.pdf | 1.0 |
| 09 | B413 | NEUROROBOTICA | 4 | bionica/NIVEL_IV/OPTATIVAS 2 Y 3/NEUROROBOTICA.pdf | 1.0 |
| 09 | B414 | TELEMETRIA MEDICA | 4 | bionica/NIVEL_IV/OPTATIVAS 2 Y 3/TELEMETRIA MEDICA.pdf | 1.0 |
| 09 | B415 | IMAGENOLOGIA | 4 | bionica/NIVEL_IV/OPTATIVAS 2 Y 3/IMAGENOLOGIA.pdf | 1.0 |
| 09 | B501 | BIOROBOTICA | 5 | bionica/NIVEL_V/BIOROBOTICA.pdf | 1.0 |
| 09 | B503 | BIOMECANICA | 5 | bionica/NIVEL_V/BIOMECÁNICA.pdf | 1.0 |
| 09 | B504 | METODOLOGIA DE LA INVESTIGACION | 5 | bionica/NIVEL_V/METODOLOGÍA DE LA INVESTIGACIÓN.pdf | 1.0 |
| 09 | B505 | TRABAJO TERMINAL I | 5 | bionica/NIVEL_V/TRABAJO TERMINAL I.pdf | 1.0 |
| 09 | B502 | BIOELECTRONICA | 5 | bionica/NIVEL_V/BIOELECTRÓNICA.pdf | 1.0 |
| 09 | B506 | TRABAJO TERMINAL II | 5 | bionica/NIVEL_V/TRABAJO TERMINAL II.pdf | 1.0 |
| 09 | B507 | ELECTIVA IV | 5 | Sin temario |  |
| 09 | B508 | SERVICIO SOCIAL | 5 | Sin temario |  |
| 98 | C101 | FISICA I | 1 | Sin temario |  |
| 98 | C102 | HERRAMIENTAS COMPUTACIONALES | 1 | Sin temario |  |
| 98 | C103 | HISTORIA E IMPACTO DE LA TEC. | 1 | Sin temario |  |
| 98 | C104 | MATEMATICAS I | 1 | Sin temario |  |
| 98 | C105 | MATEMATICAS II | 1 | Sin temario |  |
| 98 | C106 | PROGRAMACION | 1 | Sin temario |  |
| 98 | C207 | FISICA II | 2 | Sin temario |  |
| 98 | C208 | HERRAMIENTAS COMP. II | 2 | Sin temario |  |
| 98 | C209 | HISTORIA MODERNA DE MEXICO | 2 | Sin temario |  |
| 98 | C210 | MATEMATICAS III | 2 | Sin temario |  |
| 98 | C211 | MATEMATICAS IV | 2 | Sin temario |  |
| 98 | C212 | METODOS NUMERICOS | 2 | Sin temario |  |
| 98 | C313 | FISICA III | 3 | Sin temario |  |
| 98 | C314 | MATEMATICAS V | 3 | Sin temario |  |
| 98 | C315 | MODELADO Y SIMULACION | 3 | Sin temario |  |
| 98 | C316 | TECNICAS DE LA COMUNICACION | 3 | Sin temario |  |
| 98 | C317 | TEORIA ELECTROMAGNETICA | 3 | Sin temario |  |
| 98 | C318 | TEORIA DE LOS CIRCUITOS | 3 | Sin temario |  |
| 98 | C419 | COMUNICACIONES I | 4 | Sin temario |  |
| 98 | C420 | CONTROL I | 4 | Sin temario |  |
| 98 | C421 | ELECTRONICA I | 4 | Sin temario |  |
| 98 | C422 | ETICA, INGENIERIA Y SOCIEDAD | 4 | Sin temario |  |
| 98 | C423 | METROLOGIA | 4 | Sin temario |  |
| 98 | C424 | PROG. DE SIST. EN TIEM. REAL | 4 | Sin temario |  |
| 98 | C525 | COMUNICACIONES II | 5 | Sin temario |  |
| 98 | C526 | CIRCUITOS LOGICOS | 5 | Sin temario |  |
| 98 | C527 | ELECTRONICA II | 5 | Sin temario |  |
| 98 | C528 | FUNDAMENTOS DE ECONOMIA | 5 | Sin temario |  |
| 98 | C529 | SENSORES Y ACTUADORES | 5 | Sin temario |  |
| 98 | C530 | SISTEMAS NEURODIFUSOS | 5 | Sin temario |  |
| 98 | B631 | ARQUITECTURA DE COMPUTADORAS | 6 | Sin temario |  |
| 98 | B632 | BIOLOGIA | 6 | Sin temario |  |
| 98 | B633 | GEN. Y ADMON. DE PROYECTOS | 6 | Sin temario |  |
| 98 | B634 | MECATRONICA II | 6 | Sin temario |  |
| 98 | B635 | PROCESAMIENTO DE IMAGENES | 6 | Sin temario |  |
| 98 | B636 | QUIMICA | 6 | Sin temario |  |
| 98 | B737 | ANALISIS DE ORGANIZACIONES | 7 | Sin temario |  |
| 98 | B738 | BIOMAGNETISMO | 7 | Sin temario |  |
| 98 | B739 | BIOMECANICA | 7 | Sin temario |  |
| 98 | B740 | DISPOSITIVOS PROGRAMABLES | 7 | Sin temario |  |
| 98 | B741 | FISIOANATOMIA | 7 | Sin temario |  |
| 98 | B742 | FISICOQUIMICA | 7 | Sin temario |  |
| 98 | B843 | BIONICA I | 8 | Sin temario |  |
| 98 | B844 | BIONICA II | 8 | Sin temario |  |
| 98 | B845 | BIOQUIMICA | 8 | Sin temario |  |
| 98 | B846 | FORM. EMPREND. Y LIDERAZGO | 8 | Sin temario |  |
| 98 | B847 | MECANISMOS Y MICROMECANISMOS | 8 | Sin temario |  |
| 98 | B848 | MECATRONICA I | 8 | Sin temario |  |
| 98 | B949 | BIOFISICA | 9 | Sin temario |  |
| 98 | B950 | BIONICA III | 9 | Sin temario |  |
| 98 | B951 | NORMATIVIDAD Y GESTION TECN. | 9 | Sin temario |  |
| 98 | B952 | VISION ARTIFICIAL | 9 | Sin temario |  |
| 98 | B953 | TRABAJO TERMINAL I | 9 | Sin temario |  |
| 98 | BA54 | BIONICA IV | 10 | Sin temario |  |
| 98 | BA55 | IMPACTO AMBIENTAL | 10 | Sin temario |  |
| 98 | BA56 | TRABAJO TERMINAL II | 10 | Sin temario |  |

### 2.1. Temarios sin clave

Ninguno.

### 2.2. Duplicados

| Clave | Elegido | Descartado |
| --- | --- | --- |
| B105 | bionica/NIVEL_I/CALCULO VECTORIAL.pdf | bionica/NIVEL_I/Cálculo Vectorial.pdf |
| B412 | bionica/NIVEL_IV/OPTATIVAS 2 Y 3/SISTEMAS SENSORIALES.pdf | bionica/NIVEL_IV/OPTATIVAS 2 Y 3/SISTEMAS BIOMECANICOS.pdf |

### 2.3. Campos vacíos

| Campo | Materias |
| --- | --- |
| academia | 40 |
| horas | 15 |
| creditos | 15 |
| vigencia | 15 |
| orientacion | 3 |
| bibliografia | 3 |
| objetivo | 2 |
| contenidos | 1 |
| evaluacion | 1 |

### 2.4. Revisión y decisiones pendientes

| Fuente | Motivo |
| --- | --- |
| bionica/NIVEL_II/ONDAS ELECTROMAGNÉTICAS.pdf | Archivo y título interior difieren: Ondas Electromagnéticas y Sistemas Radiantes |
| bionica/NIVEL_IV/OPTATIVAS 2 Y 3/SISTEMAS BIOMECANICOS.pdf | Archivo y título interior difieren: Sistemas Sensoriales |

Campos principales pendientes de cotejo:

| Fuente | Campos vacíos |
| --- | --- |
| bionica/NIVEL_II/TEORIA DE LOS CIRCUITOS.pdf | objetivo, orientacion, bibliografia |
| bionica/NIVEL_IV/OPTATIVAS 2 Y 3/INSTRUMENTACIÓN BIOTECNOLÓGICA.pdf | contenidos, orientacion, evaluacion, bibliografia |
| bionica/NIVEL_IV/OPTATIVAS 2 Y 3/SISTEMAS SENSORIALES.pdf | objetivo, orientacion, bibliografia |

## 3. Mecatronica

Plan 09: **97 / 102** materias SAES con temario; 99 OCR de entrada.

| Plan | Clave | Nombre SAES | Nivel | Temario (PDF relativo) | Puntuación |
| --- | --- | --- | --- | --- | --- |
| 09 | M101 | ALGEBRA LINEAL Y NUMEROS COMPLEJOS | 1 | mecatronica/NIVEL_I/ALGEBRA LINEAL Y NUMEROS COMPLEJOS.pdf | 1.0 |
| 09 | M102 | ANALISIS Y DISEÑO DE PROGRAMAS | 1 | mecatronica/NIVEL_I/ANÁLISIS Y DISEÑO DE PROGRAMAS.pdf | 1.0 |
| 09 | M103 | CALCULO DIFERENCIAL E INTEGRAL | 1 | mecatronica/NIVEL_I/CÁLCULO DIFERENCIAL E INTEGRAL.pdf | 1.0 |
| 09 | M104 | CALCULO VECTORIAL | 1 | mecatronica/NIVEL_I/CÁLCULO VECTORIAL.pdf | 1.0 |
| 09 | M105 | CIRCUITOS ELECTRICOS | 1 | mecatronica/NIVEL_I/CIRCUITOS ELÉCTRICOS.pdf | 1.0 |
| 09 | M106 | CIRCUITOS ELECTRICOS AVANZADOS | 1 | mecatronica/NIVEL_I/CIRCUITOS ELÈCTRICOS AVANZADOS.pdf | 1.0 |
| 09 | M107 | DIBUJO ASISTIDO POR COMPUTADORA | 1 | mecatronica/NIVEL_I/DIBUJO ASISTIDO POR COMPUTADORA.pdf | 1.0 |
| 09 | M108 | ECUACIONES DIFERENCIALES | 1 | mecatronica/NIVEL_I/ECUACIONES DIFERENCIALES.pdf | 1.0 |
| 09 | M109 | ELECTRICIDAD Y MAGNETISMO | 1 | mecatronica/NIVEL_I/ELECTRICIDAD Y MAGNETISMO.pdf | 1.0 |
| 09 | M110 | ESTRUCTURA Y PROPIEDADES DE LOS MATERIALES | 1 | mecatronica/NIVEL_I/ESTRUCTURA Y PROPIEDADES DE LOS MATERIALES.pdf | 1.0 |
| 09 | M111 | COMUNICACION ORAL Y ESCRITA | 1 | mecatronica/NIVEL_I/COMUNICACIÓN ORAL Y ESCRITA.pdf | 1.0 |
| 09 | M112 | FUNDAMENTOS DE ELECTRONICA | 1 | mecatronica/NIVEL_I/FUNDAMENTOS DE ELECTRÓNICA.pdf | 1.0 |
| 09 | M113 | HERRAMIENTAS COMPUTACIONALES | 1 | mecatronica/NIVEL_I/HERRAMIENTAS COMPUTACIONALES.pdf | 1.0 |
| 09 | M114 | INGLES I | 1 | mecatronica/NIVEL_I/INGLÉS I.pdf | 1.0 |
| 09 | M115 | INGLES II | 1 | mecatronica/NIVEL_I/INGLÉS II.pdf | 1.0 |
| 09 | M116 | INTRODUCCION A LA MECATRONICA | 1 | mecatronica/NIVEL_I/INTRODUCCIÓN A LA MECATRÓNICA.pdf | 1.0 |
| 09 | M117 | INTRODUCCION A LA PROGRAMACION | 1 | mecatronica/NIVEL_I/INTRODUCCIÓN A LA PROGRAMACIÓN.pdf | 1.0 |
| 09 | M118 | MECANICA DE LA PARTICULA | 1 | mecatronica/NIVEL_I/MECÁNICA DE LA PARTÍCULA.pdf | 1.0 |
| 09 | M119 | MECANICA DEL CUERPO RIGIDO | 1 | mecatronica/NIVEL_I/MECÁNICA DEL CUERPO RÍGIDO.pdf | 1.0 |
| 09 | M120 | PROCESO DE MANUFACTURA | 1 | mecatronica/NIVEL_I/PROCESOS DE MANUFACTURA.pdf | 0.9796 |
| 09 | M121 | RESISTENCIA DE MATERIALES | 1 | mecatronica/NIVEL_I/RESISTENCIA DE MATERIALES.pdf | 1.0 |
| 09 | M201 | ADMINISTRACION ORGANIZACIONAL | 2 | mecatronica/NIVEL_II/ADMINISTRACION ORGANIZACIONAL N.II.pdf | 1.0 |
| 09 | M202 | ANALISIS DE SEÑALES Y SISTEMAS | 2 | mecatronica/NIVEL_II/ANÁLISIS DE SEÑALES Y SISTEMAS.pdf | 1.0 |
| 09 | M203 | ANALISIS Y SINTESIS DE MECANISMOS | 2 | mecatronica/NIVEL_II/ANÁLISIS Y SÍNTESIS DE MECANISMOS.pdf | 1.0 |
| 09 | M204 | CIRCUITOS LOGICOS | 2 | mecatronica/NIVEL_II/CIRCUITOS LÓGICOS.pdf | 1.0 |
| 09 | M205 | DISEÑO BASICO DE ELEMENTOS DE MAQUINAS | 2 | mecatronica/NIVEL_II/DISEÑO BÁSICO DE ELEMNTOS DE MÁQUINAS.pdf | 1.0 |
| 09 | M206 | DISPOSITIVOS LOGICOS PROGRAMABLES | 2 | mecatronica/NIVEL_II/DISPOSITIVOS LÓGICOS PROGRAMABLES.pdf | 1.0 |
| 09 | M207 | ELECTRONICA ANALOGICA | 2 | mecatronica/NIVEL_II/ELECTRÓNICA ANALÓGICA.pdf | 1.0 |
| 09 | M208 | INGLES III | 2 | mecatronica/NIVEL_II/INGLÉS III.pdf | 1.0 |
| 09 | M209 | LIDERAZGO Y EMPRENDEDORES | 2 | mecatronica/NIVEL_II/Liderazgo y emprendedores.pdf | 1.0 |
| 09 | M210 | MANTENIMIENTO Y SISTEMAS DE MANUFACTURA | 2 | mecatronica/NIVEL_II/MANTENIMIENTO Y SISTEMAS DE MANUFACTURA N.II.pdf | 1.0 |
| 09 | M211 | MAQUINAS ELECTRICAS | 2 | mecatronica/NIVEL_II/MÁQUINAS ELÉCTRICAS.pdf | 1.0 |
| 09 | M212 | MECANICA DE FLUIDOS | 2 | mecatronica/NIVEL_II/MECÁNICA DE FLUIDOS.pdf | 1.0 |
| 09 | M213 | MICROPROCESADORES, MICROCONTROLADORES E INTERFAZ | 2 | mecatronica/NIVEL_II/Microprocesadores, Microcontroladores e Interfaz.pdf | 1.0 |
| 09 | M214 | NEUMATICA E HIDRAULICA | 2 | mecatronica/NIVEL_II/NEUMÁTICA E HIDRÁULICA.pdf | 1.0 |
| 09 | M215 | OSCILACIONES Y OPTICA | 2 | mecatronica/NIVEL_II/OSCILACIONES Y ÓPTICA.pdf | 1.0 |
| 09 | M216 | PROBABILIDAD Y ESTADISTICA PARA INGENIERIA | 2 | mecatronica/NIVEL_II/Probabilidad y Estadistica para Ingenieria.pdf | 1.0 |
| 09 | M217 | PROGRAMACION AVANZADA | 2 | mecatronica/NIVEL_II/Programacion Avanzada.pdf | 1.0 |
| 09 | M218 | SENSORES Y ACONDICIONADORES DE SEÑAL | 2 | mecatronica/NIVEL_II/SENSORES Y ACONDICIONADORES DE SEÑAL.pdf | 1.0 |
| 09 | M219 | SIMULACION ELECTRONICA Y DISEÑO DE CIRCUITOS IMPRESOS | 2 | mecatronica/NIVEL_II/SIMULACIÓN ELECTRÓNICA Y DISEÑO DE CIRCUITOS IMPRESOS.pdf | 1.0 |
| 09 | M220 | SISTEMAS NEURODIFUSOS | 2 | mecatronica/NIVEL_II/SISTEMAS NEURODIFUSOS.pdf | 1.0 |
| 09 | M221 | TEORIA ELECTROMAGNETICA | 2 | mecatronica/NIVEL_II/TEORÍA ELECTROMAGNÉTICA.pdf | 1.0 |
| 09 | M222 | TERMODINAMICA | 2 | mecatronica/NIVEL_II/Termodinamica.pdf | 1.0 |
| 09 | M301 | CONTROL CLASICO | 3 | mecatronica/NIVEL_III/Control Clásico.pdf | 1.0 |
| 09 | M302 | ETICA PARA EL EJERCICIO PROFESIONAL | 3 | mecatronica/NIVEL_III/Ética para el Ejercicio Profesional.pdf | 1.0 |
| 09 | M303 | INSTRUMENTACION VIRTUAL | 3 | mecatronica/NIVEL_III/Instrumentación Virtual.pdf | 1.0 |
| 09 | M304 | MODELADO Y SIMULACION DE SISTEMAS MECATRONICOS | 3 | mecatronica/NIVEL_III/Modelo de Simulación de Sistemas Mecatrónicos.pdf | 1.0 |
| 09 | M305 | AUTOMATIZACION INDUSTRIAL | 3 | mecatronica/NIVEL_III/AUTOMATIZACIÓN INDUSTRIAL.pdf | 1.0 |
| 09 | M306 | DISEÑO AVANZADO DE ELEMENTOS DE MAQUINAS | 3 | mecatronica/NIVEL_III/DISEÑO AVANZADO DE ELEMENTOS DE MÁQUINAS N.III.pdf | 1.0 |
| 09 | M307 | FINANZAS E INGENIERIA ECONOMICA | 3 | mecatronica/NIVEL_III/FINANZAS E INGENIERÍA ECONÓMICA N.III.pdf | 1.0 |
| 09 | M308 | PROCESADOR DIGITAL DE SEÑALES | 3 | mecatronica/NIVEL_III/PROCESADOR DIGITAL DE SEÑALES0001.pdf | 1.0 |
| 09 | M309 | INGENIERIA AMBIENTAL | 3 | mecatronica/NIVEL_III/INGENIERÍA AMBIENTAL.pdf | 1.0 |
| 09 | M310 | ECONOMIA Y LOGISTICA | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/ECONOMÍA Y LOGISTICA.pdf | 1.0 |
| 09 | M311 | CONTROL DISTRIBUIDO | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/CONTROL DISTRIBUIDO.pdf | 1.0 |
| 09 | M312 | TOPICOS AVANZADOS DE ELECTRONICA | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/TÓPICOS AVANZADOS DE ELECTRÓNICA.pdf | 1.0 |
| 09 | M313 | DISEÑO AVANZADO Y MANUFACTURA ASISTIDA POR COMPUTADORA | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/diseño avanzado y manufactura asistido por computadora.pdf | 0.983 |
| 09 | M314 | PROYECTO INTEGRADOR | 3 | mecatronica/NIVEL_III/PROYECTO INTEGRADOR N.III.pdf | 1.0 |
| 09 | M315 | AUTOMATAS INDUSTRIALES | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/AUTÓMATAS INDUSTRIALES.pdf | 1.0 |
| 09 | M316 | AUTOMATIZACION DE LINEA DE PRODUCCION | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/AUTOMATIZACIÓN DE LÍNEA DE PRODUCCIÓN N.III.pdf | 1.0 |
| 09 | M317 | TOPICOS AVANZADOS DE SENSORES | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/Topicos Avanzados de Sensores.pdf | 1.0 |
| 09 | M318 | DESARROLLO EMPRESARIAL | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/DESARROLLO EMPRESARIAL0001.pdf | 1.0 |
| 09 | M319 | SEGURIDAD INDUSTRIAL | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/SEGURIDAD INDUSTRIAL0001.pdf | 1.0 |
| 09 | M320 | SISTEMAS OPERATIVOS EN TIEMPO REAL | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/SISTEMAS OPERATIVOS EN TIEMPO REAL0001.pdf | 1.0 |
| 09 | M321 | GRAFICACION EN 3D | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/Graficacion 3D.pdf | 1.0 |
| 09 | M322 | PROCESOS INDUSTRIALES | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/Processos Industriales.pdf | 1.0 |
| 09 | M323 | PRODUCCION MAS LIMPIA | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/PRODUCCION MAS LIMPIA.pdf | 1.0 |
| 09 | M324 | USO Y MANTENIMIENTO DE HERRAMENTAL PARA PROC. DE MANUFACTURA | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/USO Y MANTENIMIENTO DE HERRAMIENTAS PARA PROCESOS DE MANUFACTURA.pdf | 0.9854 |
| 09 | M325 | ELECTIVA I | 3 | Sin temario |  |
| 09 | M327 | SISTEMAS DE CALIDAD PARA LA MANUFACTURA | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/SISTEMAS DE CALIDAD PARA LA MANUFACTURA N.III.pdf | 1.0 |
| 09 | M328 | PROTOCOLOS AVANZADOS DE COMUNICACIONES | 3 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/PROTOCOLOS AVANZADOS DE COMUNICACIONES.pdf | 1.0 |
| 09 | M401 | CONTROL DE SISTEMAS MECATRONICOS | 4 | mecatronica/NIVEL_IV/CONTROL DE SISTEMAS MECATRÓNICOS.pdf | 1.0 |
| 09 | M402 | ELECTRONICA DE POTENCIA | 4 | mecatronica/NIVEL_IV/ELECTRÓNICA DE POTENCIA.pdf | 1.0 |
| 09 | M403 | INGENIERIA ASISTIDA POR COMPUTADORA | 4 | Sin temario |  |
| 09 | M404 | METODOLOGIA DE LA INVESTIGACION | 4 | mecatronica/NIVEL_IV/METODOLOGÍA DE LA INVESTIGACIÓN.pdf | 1.0 |
| 09 | M405 | PROYECTOS DE INVERSION | 4 | mecatronica/NIVEL_IV/Proyectos de Inversion.pdf | 1.0 |
| 09 | M406 | SISTEMAS DE VISION ARTIFICIAL | 4 | mecatronica/NIVEL_IV/SISTEMAS DE VISIÓN ARTIFICIAL APLICADA.pdf | 1.0 |
| 09 | M407 | MICROCONTROLADORES AVANZADOS | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/MICROCONTROLADORES AVANZADOS.pdf | 1.0 |
| 09 | M408 | MERCADOTECNIA | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/MERCADOTECNIA.pdf | 1.0 |
| 09 | M409 | INTEGRACION DE UN SISTEMA ROBOTICO | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/INTEGRACIÓN DE UN SISTEMA ROBOTICO.pdf | 1.0 |
| 09 | M410 | VISION ARTIFICIAL APLICADA | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/VISIÓN ARTIFICIAL APLICADA.pdf | 1.0 |
| 09 | M411 | ELECTIVA II | 4 | Sin temario |  |
| 09 | M412 | PROCESOS AVANZADOS DE MANUFACTURA | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Procesos Avanzados deManufactura.pdf | 1.0 |
| 09 | M413 | CONTROL DE SISTEMAS ROBOTICOS | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Control de Sistemas Roboticos.pdf | 1.0 |
| 09 | M414 | IMPLEMENTACION DE SISTEMAS DIGITALES | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Implementacion de Sistemas digitales.pdf | 1.0 |
| 09 | M415 | INSTRUMENTACION VIRTUAL APLICADA | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Instrumentacion Virtual Aplicada.pdf | 1.0 |
| 09 | M416 | MANUFACTURA INTEGRADA POR COMPUTADORA | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Maufactura Integrada por computadora.pdf | 1.0 |
| 09 | M417 | TOPICOS AVANZADOS DE AUTOMATIZACION | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Topicos Avanzados de Automatizacion.pdf | 1.0 |
| 09 | M418 | SISTEMAS AVANZADOS DE MANUFACTURA | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Sistemas Avanzados de Manufactura.pdf | 1.0 |
| 09 | M419 | CONTROL DE PROCESOS INDUSTRIALES | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/CONTROL DE PROCESOS INDUSTRIALES.pdf | 1.0 |
| 09 | M420 | CONTROL INTELIGENTE | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/CONTROL INTELIGENTE.pdf | 1.0 |
| 09 | M421 | DISEÑO DE EQUIPO PARA MANEJO DE MATERIALES | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Diseño de Equipo para Manejo de Materiales.pdf | 1.0 |
| 09 | M422 | DISEÑO ERGONOMICO | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/diseño ergonomico.pdf | 1.0 |
| 09 | M423 | PROTOCOLOS DE COMUNICACION INDUSTRIAL | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Protocolos de Comunicacion Industrial.pdf | 1.0 |
| 09 | M424 | PROYECTO DE SISTEMAS EMBEBIDOS | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Proyacto de Sistemas Embebidos.pdf | 1.0 |
| 09 | M425 | REALIDAD VIRTUAL | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Realidad Virtual.pdf | 1.0 |
| 09 | M426 | SISTEMAS DE PROCESAMIENTO DIGITAL DE SEÑALES | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Sistemas de procesamiento digital de señales.pdf | 1.0 |
| 09 | M427 | TOPICOS AVANZADOS DE SOLDADURA | 4 | mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/TOPÍCOS AVANZADOS DE SOLDADURA.pdf | 1.0 |
| 09 | M501 | CONTROL DE MAQUINAS ELECTRICAS | 5 | mecatronica/NIVEL_V/CONTROL DE MÁQUINAS ELECTRÓNICAS0001.pdf | 1.0 |
| 09 | M502 | ELECTIVA III | 5 | Sin temario |  |
| 09 | M503 | TRABAJO TERMINAL I | 5 | mecatronica/NIVEL_V/TRABAJO TERMINAL 1.pdf | 1.0 |
| 09 | M504 | TRABAJO TERMINAL II | 5 | mecatronica/NIVEL_V/Trabajo Terminal II.pdf | 1.0 |
| 09 | M505 | SERVICIO SOCIAL | 5 | Sin temario |  |
| 98 | C101 | FISICA I | 1 | Sin temario |  |
| 98 | C102 | HERRAMIENTAS COMPUTACIONALES | 1 | Sin temario |  |
| 98 | C103 | HISTORIA E IMPACTO DE LA TEC. | 1 | Sin temario |  |
| 98 | C104 | MATEMATICAS I | 1 | Sin temario |  |
| 98 | C105 | MATEMATICAS II | 1 | Sin temario |  |
| 98 | C106 | PROGRAMACION | 1 | Sin temario |  |
| 98 | C207 | FISICA II | 2 | Sin temario |  |
| 98 | C208 | HERRAMIENTAS COMP. II | 2 | Sin temario |  |
| 98 | C209 | HISTORIA MODERNA DE MEXICO | 2 | Sin temario |  |
| 98 | C210 | MATEMATICAS III | 2 | Sin temario |  |
| 98 | C211 | MATEMATICAS IV | 2 | Sin temario |  |
| 98 | C212 | METODOS NUMERICOS | 2 | Sin temario |  |
| 98 | C313 | FISICA III | 3 | Sin temario |  |
| 98 | C314 | MATEMATICAS V | 3 | Sin temario |  |
| 98 | C315 | MODELADO Y SIMULACION | 3 | Sin temario |  |
| 98 | C316 | TECNICAS DE LA COMUNICACION | 3 | Sin temario |  |
| 98 | C317 | TEORIA ELECTROMAGNETICA | 3 | Sin temario |  |
| 98 | C318 | TEORIA DE LOS CIRCUITOS | 3 | Sin temario |  |
| 98 | C419 | COMUNICACIONES I | 4 | Sin temario |  |
| 98 | C420 | CONTROL I | 4 | Sin temario |  |
| 98 | C421 | ELECTRONICA I | 4 | Sin temario |  |
| 98 | C422 | ETICA, INGENIERIA Y SOCIEDAD | 4 | Sin temario |  |
| 98 | C423 | METROLOGIA | 4 | Sin temario |  |
| 98 | C424 | PROG. DE SIST. EN TIEM. REAL | 4 | Sin temario |  |
| 98 | C525 | COMUNICACIONES II | 5 | Sin temario |  |
| 98 | C526 | CIRCUITOS LOGICOS | 5 | Sin temario |  |
| 98 | C527 | ELECTRONICA II | 5 | Sin temario |  |
| 98 | C528 | FUNDAMENTOS DE ECONOMIA | 5 | Sin temario |  |
| 98 | C529 | SENSORES Y ACTUADORES | 5 | Sin temario |  |
| 98 | C530 | SISTEMAS NEURODIFUSOS | 5 | Sin temario |  |
| 98 | M631 | ARQUITECTURA DE COMPUTADORAS | 6 | Sin temario |  |
| 98 | M633 | GENERACION Y ADMON. DE PROYECTOS | 6 | Sin temario |  |
| 98 | M648 | MECATRONICA I | 6 | Sin temario |  |
| 98 | M657 | CONTROL II | 6 | Sin temario |  |
| 98 | M658 | DINAMICA | 6 | Sin temario |  |
| 98 | M659 | TERMODINA. Y MEC. DE FLUIDOS | 6 | Sin temario |  |
| 98 | M734 | MECATRONICA II | 7 | Sin temario |  |
| 98 | M737 | ANALISIS DE ORGANIZACIONES | 7 | Sin temario |  |
| 98 | M740 | DISPOSITIVOS PROGRAMABLES | 7 | Sin temario |  |
| 98 | M760 | MECATRONICA III | 7 | Sin temario |  |
| 98 | M761 | MAQUINAS ELECTRICAS | 7 | Sin temario |  |
| 98 | M762 | MECATRONICA IV | 7 | Sin temario |  |
| 98 | M846 | FORM. EMP. Y LIDERAZGO | 8 | Sin temario |  |
| 98 | M852 | VISION ARTIFICIAL | 8 | Sin temario |  |
| 98 | M863 | MECATRONICA V | 8 | Sin temario |  |
| 98 | M864 | MECATRONICA VI | 8 | Sin temario |  |
| 98 | M865 | MECATRONICA VII | 8 | Sin temario |  |
| 98 | M866 | CONTROL DE MAQUINAS ELECTRICAS | 8 | Sin temario |  |
| 98 | M953 | TRABAJO TERMINAL I | 9 | Sin temario |  |
| 98 | M967 | MECATRONICA VIII | 9 | Sin temario |  |
| 98 | M968 | MECATRONICA IX | 9 | Sin temario |  |
| 98 | M969 | MECATRONICA X | 9 | Sin temario |  |
| 98 | M970 | REINGENIERIA | 9 | Sin temario |  |
| 98 | MA55 | IMPACTO AMBIENTAL | 10 | Sin temario |  |
| 98 | MA56 | TRABAJO TERMINAL II | 10 | Sin temario |  |
| 98 | MA71 | MECATRONICA XI | 10 | Sin temario |  |

### 3.1. Temarios sin clave

Ninguno.

### 3.2. Duplicados

| Clave | Elegido | Descartado |
| --- | --- | --- |
| M313 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/diseño avanzado y manufactura asistido por computadora.pdf | mecatronica/NIVEL_III/Optativa 1, 2 y 3/DISEÑO AVANZADOS Y MANUFACTURA ASISTIDO POR COMPUTADORA.pdf |
| M317 | mecatronica/NIVEL_III/Optativa 1, 2 y 3/Topicos Avanzados de Sensores.pdf | mecatronica/NIVEL_III/Optativa 1, 2 y 3/TÓPICOS AVANZADOS DE SENSORES0001.pdf |

### 3.3. Campos vacíos

| Campo | Materias |
| --- | --- |
| academia | 37 |
| creditos | 34 |
| horas | 32 |
| vigencia | 32 |
| objetivo | 5 |
| orientacion | 5 |
| bibliografia | 4 |
| contenidos | 1 |

### 3.4. Revisión y decisiones pendientes

| Fuente | Motivo |
| --- | --- |
| mecatronica/NIVEL_I/PROCESOS DE MANUFACTURA.pdf | Revisar nombre/nivel: PROCESO DE MANUFACTURA, nivel 1; puntuación 0.9796 |

Campos principales pendientes de cotejo:

| Fuente | Campos vacíos |
| --- | --- |
| mecatronica/NIVEL_I/RESISTENCIA DE MATERIALES.pdf | objetivo, contenidos, orientacion |
| mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Implementacion de Sistemas digitales.pdf | objetivo, orientacion, bibliografia |
| mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Instrumentacion Virtual Aplicada.pdf | objetivo, orientacion, bibliografia |
| mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Maufactura Integrada por computadora.pdf | objetivo, orientacion, bibliografia |
| mecatronica/NIVEL_IV/OPTATIVAS 4, 5 Y 6/Sistemas Avanzados de Manufactura.pdf | objetivo, orientacion, bibliografia |

## 4. Telematica

Plan 09: **71 / 77** materias SAES con temario; 71 OCR de entrada.

| Plan | Clave | Nombre SAES | Nivel | Temario (PDF relativo) | Puntuación |
| --- | --- | --- | --- | --- | --- |
| 09 | T101 | PROGRAMACION | 1 | telematica/Nivel I/PROGRAMACIÓN.pdf | 1.0 |
| 09 | T102 | ANALISIS Y DISEÑO DE SISTEMAS | 1 | telematica/Nivel I/ANÁLISIS Y DISEÑO DE SISTEMAS.pdf | 1.0 |
| 09 | T103 | ESTRUCTURA DE DATOS | 1 | telematica/Nivel I/ESTRUCTURA DE DATOS.pdf | 1.0 |
| 09 | T104 | ADMINISTRACION DE SISTEMAS OPERATIVOS | 1 | telematica/Nivel I/ADMINISTRACIÓN DE SISTEMAS OPERATIVOS.pdf | 1.0 |
| 09 | T105 | DISEÑO DIGITAL | 1 | telematica/Nivel I/DISEÑO DIGITAL.pdf | 1.0 |
| 09 | T106 | ARQUITECTURA DE COMPUTADORAS | 1 | telematica/Nivel I/ARQUITECTURA DE COMPUTADORAS.pdf | 1.0 |
| 09 | T107 | FUNDAMENTOS DE FISICA | 1 | telematica/Nivel I/FUNDAMENTOS DE FÍSICA.pdf | 1.0 |
| 09 | T108 | ECUACIONES DIFERENCIALES | 1 | telematica/Nivel I/ECUACIONES DIFERENCIALES.pdf | 1.0 |
| 09 | T109 | PROBABILIDAD | 1 | telematica/Nivel I/PROBABILIDAD.pdf | 1.0 |
| 09 | T110 | CALCULO DIFERENCIAL E INTEGRAL | 1 | telematica/Nivel I/CÁLCULO DIFERENCIAL E INTEGRAL.pdf | 1.0 |
| 09 | T111 | VARIABLE COMPLEJA | 1 | telematica/Nivel I/VARIABLE COMPLEJA.pdf | 1.0 |
| 09 | T112 | ALGEBRA LINEAL | 1 | telematica/Nivel I/ALGEBRA LINEAL.pdf | 1.0 |
| 09 | T113 | ELECTROMAGNETISMO | 1 | telematica/Nivel I/ELECTROMAGNETISMO.pdf | 1.0 |
| 09 | T114 | CALCULO MULTIVARIABLE | 1 | telematica/Nivel I/CÁLCULO MULTIVARIABLE.pdf | 1.0 |
| 09 | T115 | ADMINISTRACION ORGANIZACIONAL | 1 | telematica/Nivel I/ADMINISTRACION ORGANIZACIONAL_T.pdf | 1.0 |
| 09 | T116 | ETICA, PROFESION Y SOCIEDAD | 1 | telematica/Nivel I/ÉTICA, PROFESIÓN Y SOCIEDAD.pdf | 1.0 |
| 09 | T117 | COMUNICACION ORAL Y ESCRITA | 1 | telematica/Nivel I/COMUNICACIÓN ORAL Y ESCRITA.pdf | 1.0 |
| 09 | T118 | INGLES I | 1 | telematica/Nivel I/INGLÉS I.pdf | 1.0 |
| 09 | T119 | INGLES II | 1 | telematica/Nivel I/INGLÉS II_T.pdf | 1.0 |
| 09 | T120 | PROGRAMACION ESTRUCTURADA | 1 | telematica/Nivel I/ELEGIBLES/PROGRAMACION ESTRUCTURADA.pdf | 1.0 |
| 09 | T121 | SOCIEDAD, CIENCIA Y TECNOLOGIA | 1 | telematica/Nivel I/ELEGIBLES/SOCIEDAD, CIENCIA Y TECNOLOGIA.pdf | 1.0 |
| 09 | T201 | SEÑALES Y SISTEMAS | 2 | telematica/Nivel II/SEÑALES Y SISTEMAS_f.pdf | 1.0 |
| 09 | T202 | PROPAGACION DE ONDAS ELECTROMAGNETICAS | 2 | telematica/Nivel II/PROPAGACION DE ONDAS ELECTROMAGNETICAS.pdf | 1.0 |
| 09 | T203 | ELECTRONICA | 2 | telematica/Nivel II/ELECTRÓNICA N.II.pdf | 1.0 |
| 09 | T204 | TEORIA DE LOS CIRCUITOS | 2 | telematica/Nivel II/TEORIA DE LOS CIRCUITOS.pdf | 1.0 |
| 09 | T205 | TEORIA DE LA INFORMACION | 2 | telematica/Nivel II/TEORÍA DE LA INFORMACIÓN N.II.pdf | 1.0 |
| 09 | T206 | TEORIA DE LAS COMUNICACIONES | 2 | telematica/Nivel II/TEORÍA DE LAS COMUNICACIONES.pdf | 1.0 |
| 09 | T207 | COMUNICACIONES DIGITALES | 2 | telematica/Nivel II/COMUNICACIONES DIGITALES.pdf | 1.0 |
| 09 | T208 | PROCESAMIENTO DIGITAL DE SEÑALES | 2 | telematica/Nivel II/PROCESAMIENTO DIGITAL DE SEÑALES.pdf | 1.0 |
| 09 | T209 | TELEFONIA | 2 | telematica/Nivel II/TELEFONÍA.pdf | 1.0 |
| 09 | T210 | SISTEMAS CELULARES | 2 | telematica/Nivel II/SISTEMAS CELULARES.pdf | 1.0 |
| 09 | T211 | PROTOCOLOS DE INTERNET | 2 | telematica/Nivel II/PROTOCOLOS DE INTERNET.pdf | 1.0 |
| 09 | T212 | SISTEMAS DISTRIBUIDOS | 2 | telematica/Nivel II/SISTEMAS DISTRIBUIDOS NII.pdf | 1.0 |
| 09 | T213 | INGENIERIA WEB | 2 | telematica/Nivel II/INGENIERÍA WEB.pdf | 1.0 |
| 09 | T214 | PROGRAMACION AVANZADA | 2 | telematica/Nivel II/PROGRAMACIÓN AVANZADA.pdf | 1.0 |
| 09 | T215 | BASES DE DATOS | 2 | telematica/Nivel II/BASE DE DATOS N.II.pdf | 1.0 |
| 09 | T216 | TRANSMISION DE DATOS | 2 | telematica/Nivel II/TRANSMISIÓN DE DATOS.pdf | 1.0 |
| 09 | T217 | INFORMACION FINANCIERA E INGENIERIA ECONOMICA | 2 | telematica/Nivel II/INFORMACION FINANCIERA E INGENIERIA ECONOMICA.pdf | 1.0 |
| 09 | T218 | OPTATIVA I | 2 | Sin temario |  |
| 09 | T219 | INGLES III | 2 | telematica/Nivel II/INGLES III_f.pdf | 1.0 |
| 09 | T220 | METODOS NUMERICOS | 2 | telematica/Nivel II/ELEGIBLES/METODOS NUMERICOS.pdf | 1.0 |
| 09 | T221 | ELECTRONICA PARA COMUNICACIONES | 2 | telematica/Nivel II/ELEGIBLES/ELECTRONICA PARA COMUNICACIONES.pdf | 1.0 |
| 09 | T222 | OPTICA | 2 | telematica/Nivel II/ELEGIBLES/OPTICA.pdf | 1.0 |
| 09 | T223 | DESARROLLO SUSTENTABLE | 2 | telematica/Nivel II/ELEGIBLES/DESARROLLO SUSTENTABLE.pdf | 1.0 |
| 09 | T224 | ECONOMIA PARA INGENIEROS | 2 | telematica/Nivel II/ELEGIBLES/ECONOMIA PARA INGENIEROS.pdf | 1.0 |
| 09 | T225 | INGLES IV | 2 | telematica/Nivel II/ELEGIBLES/INGLÉS IV_f.pdf | 1.0 |
| 09 | T226 | REDES INALAMBRICAS | 2 | telematica/Nivel II/OPTATIVAS/REDES INALÁMBRICAS_f.pdf | 1.0 |
| 09 | T227 | REDES NEURONALES | 2 | telematica/Nivel II/OPTATIVAS/REDES NEURONALES.pdf | 1.0 |
| 09 | T228 | LOGICA DIFUSA | 2 | telematica/Nivel II/OPTATIVAS/LÓGICA DIFUSA.pdf | 1.0 |
| 09 | T229 | SISTEMAS DE INFORMACION GEOGRAFICA | 2 | telematica/Nivel II/OPTATIVAS/SISTEMAS DE INFORMACIÒN GEOGRÁFICA_f.pdf | 1.0 |
| 09 | T230 | PROGRAMACION DE DISPOSITIVOS MOVILES | 2 | telematica/Nivel II/OPTATIVAS/PROGRAMACIÓN DE DISPOSITIVOS MÓVILES_f.pdf | 1.0 |
| 09 | T231 | NORMATIVIDAD EN TELECOMUNICACIONES E INFORMATICA | 2 | telematica/Nivel II/OPTATIVAS/NORMATIVIDAD EN TELECOMUNICACIONES E INFORMATICA.pdf | 1.0 |
| 09 | T301 | REDES INTELIGENTES | 3 | telematica/Nivel III/REDES INTELIGENTES.pdf | 1.0 |
| 09 | T302 | LINEAS DE TRANSMISION Y ANTENAS | 3 | telematica/Nivel III/LÍNEAS DE TRANSMISIÓN Y ANTENAS N.III.pdf | 1.0 |
| 09 | T303 | SEGURIDAD EN REDES | 3 | telematica/Nivel III/SEGURIDAD EN REDES.pdf | 1.0 |
| 09 | T304 | MULTIMEDIA | 3 | telematica/Nivel III/MULTIMEDIA.pdf | 1.0 |
| 09 | T305 | BASES DE DATOS DISTRIBUIDAS | 3 | telematica/Nivel III/BASE DE DATOS DISTRIBUIDAS.pdf | 1.0 |
| 09 | T306 | METODOLOGIA DE LA INVESTIGACION | 3 | telematica/Nivel III/METODOLOGÍA DE LA INVESTIGACIÓN.pdf | 1.0 |
| 09 | T307 | ADMINISTRACION DE PROYECTOS | 3 | telematica/Nivel III/ADMINISTRACIÓN DE PROYECTOS N.III.pdf | 1.0 |
| 09 | T308 | LIDERAZGO Y EMPRENDEDORES | 3 | telematica/Nivel III/LIDERAZGO Y EMPRENDEDORES N.III.pdf | 1.0 |
| 09 | T310 | CRIPTOGRAFIA | 3 | telematica/Nivel III/OPTATIVAS 2/CRIPTOGRAFÍA N.III.pdf | 1.0 |
| 09 | T311 | MICROONDAS | 3 | telematica/Nivel III/OPTATIVAS 2/MICROONDAS N.III.pdf | 1.0 |
| 09 | T312 | PROCESAMIENTO DE IMAGENES | 3 | telematica/Nivel III/OPTATIVAS 2/PROCESAMIENTO DE IMÁGENES N.III.pdf | 1.0 |
| 09 | T313 | TELEVISION DIGITAL | 3 | telematica/Nivel III/OPTATIVAS 2/TELEVISION DIGITAL.pdf | 1.0 |
| 09 | T314 | SISTEMAS DE CALIDAD | 3 | telematica/Nivel III/OPTATIVAS 2/SISTEMAS DE CALIDAD.pdf | 1.0 |
| 09 | T315 | PROCESAMIENTO DE VOZ | 3 | telematica/Nivel III/OPTATIVAS 2/PROESAMIENTO DEVOZ.pdf | 1.0 |
| 09 | T316 | FILTRADO AVANZADO | 3 | telematica/Nivel III/OPTATIVAS 2/FILTRADO AVANZADO.pdf | 1.0 |
| 09 | T401 | PROYECTO TERMINAL I | 4 | telematica/Nivel IV/PROYECTO TERMINAL I.pdf | 1.0 |
| 09 | T402 | PROYECTO TERMINAL II | 4 | telematica/Nivel IV/PROYECTO TERMINAL II.pdf | 1.0 |
| 09 | T403 | REDES DE TELECOMUNICACIONES | 4 | telematica/Nivel IV/REDES DE TELECOMUNICACIONES.pdf | 1.0 |
| 09 | T404 | APLICACIONES DISTRIBUIDAS | 4 | telematica/Nivel IV/APLICACIONES DISTRIBUIDAS.pdf | 1.0 |
| 09 | T405 | DISPOSITIVOS PROGRAMABLES | 4 | telematica/Nivel IV/DISPOSITIVOS PROGRAMABLES0001.pdf | 1.0 |
| 09 | T406 | SERVICIO SOCIAL | 4 | Sin temario |  |
| 09 | T407 | ELECTIVA I | 4 | Sin temario |  |
| 09 | T408 | ELECTIVA II | 4 | Sin temario |  |
| 09 | T409 | ELECTIVA III | 4 | Sin temario |  |
| 09 | T410 | ELECTIVA IV | 4 | Sin temario |  |
| 98 | C101 | FISICA I | 1 | Sin temario |  |
| 98 | C102 | HERRAMIENTAS COMPUTACIONALES | 1 | Sin temario |  |
| 98 | C103 | HISTORIA E IMPACTO DE LA TEC. | 1 | Sin temario |  |
| 98 | C104 | MATEMATICAS I | 1 | Sin temario |  |
| 98 | C105 | MATEMATICAS II | 1 | Sin temario |  |
| 98 | C106 | PROGRAMACION | 1 | Sin temario |  |
| 98 | C207 | FISICA II | 2 | Sin temario |  |
| 98 | C208 | HERRAMIENTAS COMP. II | 2 | Sin temario |  |
| 98 | C209 | HISTORIA MODERNA DE MEXICO | 2 | Sin temario |  |
| 98 | C210 | MATEMATICAS III | 2 | Sin temario |  |
| 98 | C211 | MATEMATICAS IV | 2 | Sin temario |  |
| 98 | C212 | METODOS NUMERICOS | 2 | Sin temario |  |
| 98 | C313 | FISICA III | 3 | Sin temario |  |
| 98 | C314 | MATEMATICAS V | 3 | Sin temario |  |
| 98 | C315 | MODELADO Y SIMULACION | 3 | Sin temario |  |
| 98 | C316 | TECNICAS DE LA COMUNICACION | 3 | Sin temario |  |
| 98 | C317 | TEORIA ELECTROMAGNETICA | 3 | Sin temario |  |
| 98 | C318 | TEORIA DE LOS CIRCUITOS | 3 | Sin temario |  |
| 98 | C419 | COMUNICACIONES I | 4 | Sin temario |  |
| 98 | C420 | CONTROL I | 4 | Sin temario |  |
| 98 | C421 | ELECTRONICA I | 4 | Sin temario |  |
| 98 | C422 | ETICA, INGENIERIA Y SOCIEDAD | 4 | Sin temario |  |
| 98 | C423 | METROLOGIA | 4 | Sin temario |  |
| 98 | C424 | PROG. DE SIST. EN TIEM. REAL | 4 | Sin temario |  |
| 98 | C525 | COMUNICACIONES II | 5 | Sin temario |  |
| 98 | C526 | CIRCUITOS LOGICOS | 5 | Sin temario |  |
| 98 | C527 | ELECTRONICA II | 5 | Sin temario |  |
| 98 | C528 | FUNDAMENTOS DE ECONOMIA | 5 | Sin temario |  |
| 98 | C529 | SENSORES Y ACTUADORES | 5 | Sin temario |  |
| 98 | C530 | SISTEMAS NEURODIFUSOS | 5 | Sin temario |  |
| 98 | T631 | ARQUITECTURA DE COMPUTADORAS | 6 | Sin temario |  |
| 98 | T633 | GENERACION Y ADMON. DE PROYEC. | 6 | Sin temario |  |
| 98 | T672 | DISEÑO Y ANALISIS DE ALGORITMOS | 6 | Sin temario |  |
| 98 | T673 | PROCESADORES DIGITAL. DE SENA. | 6 | Sin temario |  |
| 98 | T674 | SISTEMAS DE COMUNICACIONES I | 6 | Sin temario |  |
| 98 | T675 | SISTEMAS OPERATIVOS | 6 | Sin temario |  |
| 98 | T737 | ANALISIS DE ORGANIZACIONES | 7 | Sin temario |  |
| 98 | T776 | BASES DE DATOS | 7 | Sin temario |  |
| 98 | T777 | COMUNICACIONES III | 7 | Sin temario |  |
| 98 | T778 | SISTEMAS DISTRIBUIDOS | 7 | Sin temario |  |
| 98 | T779 | SISTEMAS TELEMATICOS I | 7 | Sin temario |  |
| 98 | T780 | TELEMATICA I | 7 | Sin temario |  |
| 98 | T846 | FORM. DE EMPREN. Y LIDERAZGO | 8 | Sin temario |  |
| 98 | T881 | BASES DE DATOS DISTRIBUIDAS | 8 | Sin temario |  |
| 98 | T882 | TELEMATICA II | 8 | Sin temario |  |
| 98 | T883 | TEORIA DE LA INFORMACION | 8 | Sin temario |  |
| 98 | T884 | SISTEMAS DE COMUNICACIONES II | 8 | Sin temario |  |
| 98 | T885 | SISTEMAS TELEMATICOS II | 8 | Sin temario |  |
| 98 | T951 | NORMATIVIDAD Y GEST. TECNOL. | 9 | Sin temario |  |
| 98 | T953 | TRABAJO TERMINAL I | 9 | Sin temario |  |
| 98 | T970 | REINGENIERIA | 9 | Sin temario |  |
| 98 | T986 | OPTATIVA | 9 | Sin temario |  |
| 98 | T987 | SISTEMAS TELEMATICOS III | 9 | Sin temario |  |
| 98 | TA55 | IMPACTO AMBIENTAL | 10 | Sin temario |  |
| 98 | TA56 | TRABAJO TERMINAL II | 10 | Sin temario |  |
| 98 | TA88 | SEGURIDAD DE DATOS | 10 | Sin temario |  |

### 4.1. Temarios sin clave

Ninguno.

### 4.2. Duplicados

Ninguno.

### 4.3. Campos vacíos

| Campo | Materias |
| --- | --- |
| creditos | 34 |
| horas | 32 |
| vigencia | 32 |
| academia | 21 |
| objetivo | 1 |
| orientacion | 1 |
| bibliografia | 1 |

### 4.4. Revisión y decisiones pendientes

| Fuente | Motivo |
| --- | --- |
| telematica/Nivel I/ELEGIBLES/PROGRAMACION ESTRUCTURADA.pdf | Tipo carpeta elegible / SAES optativa; se conserva carpeta |
| telematica/Nivel I/ELEGIBLES/SOCIEDAD, CIENCIA Y TECNOLOGIA.pdf | Tipo carpeta elegible / SAES optativa; se conserva carpeta |
| telematica/Nivel II/ELEGIBLES/DESARROLLO SUSTENTABLE.pdf | Tipo carpeta elegible / SAES optativa; se conserva carpeta |
| telematica/Nivel II/ELEGIBLES/ECONOMIA PARA INGENIEROS.pdf | Tipo carpeta elegible / SAES optativa; se conserva carpeta |
| telematica/Nivel II/ELEGIBLES/ELECTRONICA PARA COMUNICACIONES.pdf | Tipo carpeta elegible / SAES optativa; se conserva carpeta |
| telematica/Nivel II/ELEGIBLES/INGLÉS IV_f.pdf | Tipo carpeta elegible / SAES optativa; se conserva carpeta |
| telematica/Nivel II/ELEGIBLES/METODOS NUMERICOS.pdf | Tipo carpeta elegible / SAES optativa; se conserva carpeta |
| telematica/Nivel II/ELEGIBLES/OPTICA.pdf | Tipo carpeta elegible / SAES optativa; se conserva carpeta |

Campos principales pendientes de cotejo:

| Fuente | Campos vacíos |
| --- | --- |
| telematica/Nivel II/ELEGIBLES/ELECTRONICA PARA COMUNICACIONES.pdf | objetivo, orientacion, bibliografia |
