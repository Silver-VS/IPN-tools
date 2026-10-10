# Categorías de los planes del IPN (propuesta)

## 1. Alcance y método

82 planes; 7157 registros de materias. Clasificador `1.0.0`: excepciones exactas, función curricular, contexto de plan y reglas temáticas por prioridad. Los conteos incluyen repeticiones por nivel; las claves de salida agrupan nombres normalizados dentro de cada plan.

Fuente: mapas curriculares leídos mediante OCR. Se conserva el nombre recibido; esta propuesta requiere revisión académica y no establece equivalencias ni modifica las áreas de UPIITA, ESCOM o UPIBI.

Supuesto: el núcleo económico, administrativo y jurídico de los planes de negocios va en `adm`; en los demás planes, economía y gestión van en `integral`. Las optativas con tema siguen su disciplina; las optativas y electivas sin tema van en `esp`. No se asigna una disciplina por el solo hecho de pertenecer a un plan.

## 2. Categorías nuevas

| Clave | Nombre | Incluye |
|---|---|---|
| mec | Mecánica y materiales | Mecánica, diseño mecánico, manufactura, termofluidos, materiales, metalurgia y textiles. |
| civil | Construcción y tierra | Estructuras, geotecnia, hidráulica, topografía, geología, geofísica y petróleo. |
| amb | Ambiente y energía | Ingeniería ambiental, energía, recursos naturales y sustentabilidad. |
| ind | Operaciones y logística | Investigación de operaciones, calidad, producción, logística y transporte. |
| salud | Ciencias de la salud | Anatomía, fisiología, farmacología, patología, salud pública y nutrición. |
| clin | Práctica clínica | Clínicas, propedéuticas, internado, odontología y optometría clínicas y enfermería clínica. |
| adm | Administración y negocios | Contabilidad, finanzas, mercadotecnia, comercio, economía y derecho mercantil y fiscal; núcleo disciplinar de negocios, economía y contaduría. |
| soc | Ciencias sociales | Psicología, trabajo social, sociología, derecho y educación. |
| info | Información y documentación | Biblioteconomía, archivonomía y gestión documental. |

## 3. Conteo global y pendientes

Sin categoría: **62/7157 = 0.87 %** (registros sin categoría / registros totales × 100).

| Categoría | Materias (n) |
|---|---:|
| fm | 724 |
| comp | 326 |
| datos | 157 |
| elec | 263 |
| ctrl | 163 |
| redes | 68 |
| bio | 227 |
| quim | 138 |
| proc | 192 |
| integral | 920 |
| prof | 224 |
| esp | 376 |
| mec | 472 |
| civil | 479 |
| amb | 247 |
| ind | 286 |
| salud | 555 |
| clin | 414 |
| adm | 585 |
| soc | 215 |
| info | 64 |
| sin_categoria | 62 |

### 3.1. Decisiones pendientes y limitaciones

4 planes superan el 5 % sin categoría. La meta global es menor del 2 %; el resultado se conserva sin asignaciones de relleno.

| Motivo de revisión | Registros |
|---|---:|
| Tema ambiguo, título incompleto o regla pendiente | 30 |
| Posible fila de horas/créditos del OCR | 14 |
| Posible encabezado del OCR | 18 |

Las optativas y electivas sin tema van en `esp`; `esp` no sustituye a una disciplina desconocida. Las filas sospechosas del OCR requieren cotejo local del mapa. No se elimina ningún registro de la entrada.

No se propone otra categoría: teoría general de sistemas, ingeniería de sistemas y títulos genéricos de diseño requieren confirmar contenido antes de decidir si el catálogo resulta suficiente.

### 3.2. Lista de materias sin categoría

| Plan | Nivel | Materia OCR | Motivo |
|---|---|---|---|
| esime--ing.-ele--plan-2026--281-29 | 5 | TEORÍA GENERAL DE SISTEMAS | Tema ambiguo, título incompleto o regla pendiente |
| esime--ing.-ele--plan-2026--281-29 | 6 | TEORÍA GENERAL DE SISTEMAS | Tema ambiguo, título incompleto o regla pendiente |
| ingenieria-civil-2--282-29 | 6 | INGENIERÍA DE SISTEMAS I | Tema ambiguo, título incompleto o regla pendiente |
| ingenieria-civil-2--282-29 | 7 | Ingeniería de sistemas | Tema ambiguo, título incompleto o regla pendiente |
| licenciatura-en-fisica-y-matematicas | optativa | OPTATIVA I 4.5 0.0 4.5 9.0 OPTATIVA II | Tema ambiguo, título incompleto o regla pendiente |
| licenciatura-en-fisica-y-matematicas | optativa | CURSO ESPECIAL 4.5 0.0 4.5 9.0 INTRODUCCIÓN A SISTEMAS | Tema ambiguo, título incompleto o regla pendiente |
| licenciatura-en-fisica-y-matematicas | optativa | CURSO ESPECIAL | Tema ambiguo, título incompleto o regla pendiente |
| licenciatura-en-fisica-y-matematicas | optativa | C SEMESTRE VIII T P T/H C CURSO ESPECIAL | Posible fila de horas/créditos del OCR |
| licenciatura-en-fisica-y-matematicas | optativa | C SEMESTRE VIII T P T/H C OPTATIVA I 4.5 0.0 4.5 9.0 OPTATIVA I | Posible fila de horas/créditos del OCR |
| licenciatura-en-fisica-y-matematicas | optativa | OPTATIVA II 4.5 0.0 4.5 9.0 OPTATIVA II | Tema ambiguo, título incompleto o regla pendiente |
| licenciatura-en-fisica-y-matematicas | optativa | OPTATIVA III 4.5 0.0 4.5 9.0 OPTATIVA III | Tema ambiguo, título incompleto o regla pendiente |
| licenciatura-en-fisica-y-matematicas | optativa | LABORATORIO III** --- | Tema ambiguo, título incompleto o regla pendiente |
| licenciatura-en-fisica-y-matematicas | optativa | LABORATORIO IV** --- | Tema ambiguo, título incompleto o regla pendiente |
| licenciatura-en-fisica-y-matematicas | optativa | CURSO ESPECIAL | Tema ambiguo, título incompleto o regla pendiente |
| licenciatura-en-fisica-y-matematicas | optativa | LABORATORIO II** --- 6.0 6.0 12.0 LABORATORIO II** --- LABORATORIO III** --- 6.0 6.0 12.0 LABORATORIO III** --- | Tema ambiguo, título incompleto o regla pendiente |
| licenciatura-en-fisica-y-matematicas | optativa | LABORATORIO IV** --- 6.0 6.0 12.0 LABORATORIO IV** --- | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curicular-esit-textil-bis | 5 | Trayectoria | Posible encabezado del OCR |
| mapa-curicular-esit-textil-bis | 6 | Trayectoria | Posible encabezado del OCR |
| mapa-curicular-esit-textil-bis | 6 | Trayectoria | Posible encabezado del OCR |
| mapa-curicular-esit-textil-bis | 7 | Trayectoria | Posible encabezado del OCR |
| mapa-curicular-esit-textil-bis | 8 | Trayectoria | Posible encabezado del OCR |
| mapa-curicular-esit-textil-bis | 8 | Trayectoria | Posible encabezado del OCR |
| mapa-curicular-esit-textil-bis | 8 | Trayectoria | Posible encabezado del OCR |
| mapa-curicular-esit-textil-bis | 8 | Trayectoria | Posible encabezado del OCR |
| mapa-curricular-ibiotecnologica-upibi-upiip-upiit--283-29--281-29--281-29 | optativa | TÓPICOS SELECTOS DE DISEÑO I | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-ibiotecnologica-upibi-upiip-upiit--283-29--281-29--281-29 | optativa | TÓPICOS SELECTOS DE DISEÑO II | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-ibiotecnologica-upiig | optativa | TÓPICOS SELECTOS DE DISEÑO I | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-ibiotecnologica-upiig | optativa | TÓPICOS SELECTOS DE DISEÑO II | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-ibq-encb | 7 | TRAYECTORIA | Posible encabezado del OCR |
| mapa-curricular-ibq-encb | 7 | TRAYECTORIA | Posible encabezado del OCR |
| mapa-curricular-ibq-encb | 8 | TRAYECTORIA | Posible encabezado del OCR |
| mapa-curricular-ibq-encb | 8 | TRAYECTORIA | Posible encabezado del OCR |
| mapa-curricular-ibq-encb | 9 | TRAYECTORIA | Posible encabezado del OCR |
| mapa-curricular-icivil-esia-uzac-upiip | 1 | TOTAL 16.5 9.0 25.5 42.0 T O T A L | Posible fila de horas/créditos del OCR |
| mapa-curricular-icivil-esia-uzac-upiip | 3 | TOTAL 21.0 9.0 30.0 51.0 T O T A L | Posible fila de horas/créditos del OCR |
| mapa-curricular-icivil-esia-uzac-upiip | 5 | TOTAL 23.0 4.0 27.0 50.0 T O T A L | Posible fila de horas/créditos del OCR |
| mapa-curricular-icivil-esia-uzac-upiip | 7 | TOTAL 22.5 6.0 28.5 51.0 T O T A L | Posible fila de horas/créditos del OCR |
| mapa-curricular-icivil-esia-uzac-upiip | 9 | TOTAL 22.5 3.0 25.5 48.0 T O T A L | Posible fila de horas/créditos del OCR |
| mapa-curricular-icivil-esia-uzac-upiip | 6 | Ingeniería de sistemas | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-icivil-esia-uzac-upiip | 7 | Ingeniería de sistemas | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-imym-esiqie | 5 | TOPICOS AVANZADOS | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-ingenieria-en-sistemas-automotrices--281-29 | 7 | TÓPICOS SELECTOS DE INGENIERÍA I | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-ingenieria-en-sistemas-automotrices--281-29 | 7 | TÓPICOS SELECTOS DE INGENIERÍA I: TECNOLOGÍAS ALTERNATIVAS I | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-ingenieria-en-sistemas-automotrices--281-29 | 8 | TÓPICOS SELECTOS DE INGENIERÍA II: TECNOLOGÍAS ALTERNATIVAS II | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-isa-encb | 7 | TRAYECTORIA | Posible encabezado del OCR |
| mapa-curricular-isa-encb | 7 | TRAYECTORIA | Posible encabezado del OCR |
| mapa-curricular-isa-encb | 8 | TRAYECTORIA | Posible encabezado del OCR |
| mapa-curricular-isa-encb | 8 | TRAYECTORIA | Posible encabezado del OCR |
| mapa-curricular-isa-encb | 9 | TRAYECTORIA | Posible encabezado del OCR |
| mapa-curricular-la-enba | 2 | Teoría general de sistemas | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-lb-enba | 3 | Teoria general de sistemas | Tema ambiguo, título incompleto o regla pendiente |
| mapa-curricular-lenfermeria-cics-uma | 1 | SUBTOTAL 25.0 5.0 30.0 55.0 SUBTOTAL | Posible fila de horas/créditos del OCR |
| mapa-curricular-lenfermeria-cics-uma | 3 | SUBTOTAL 19.0 11.0 30.0 49.0 SUBTOTAL | Posible fila de horas/créditos del OCR |
| mapa-curricular-lenfermeria-cics-uma | 5 | SUBTOTAL 19.0 11.0 30.0 49.0 SUBTOTAL | Posible fila de horas/créditos del OCR |
| mapa-curricular-lenfermeria-cics-uma | 5 | SUBTOTAL 15.0 15.0 30.0 45.0 SUBTOTAL | Posible fila de horas/créditos del OCR |
| mapa-curricular-lenfermeria-cics-uma | 7 | SUBTOTAL 13.0 17.0 30.0 43.0 SUBTOTAL | Posible fila de horas/créditos del OCR |
| mapa-curricular-loptometria-cics-uma-ust | optativa | OPTATIVA II TEORÍA PRÁCTICA T/H CRÉDITOS TEPIC CRÉDITOS SATCA | Posible fila de horas/créditos del OCR |
| mapa-curricular-mch-enmh | 11 | II/SEMANA INTERVALO H/SEMANA INTERVALO CRÉDITOS | Posible fila de horas/créditos del OCR |
| mapacurricular-iaeronautica-esimetic-upiig | 7 | OPTATIVA TECNOLOGÍA (4) | Tema ambiguo, título incompleto o regla pendiente |
| mapacurricular-iaeronautica-esimetic-upiig | 7 | OPTATIVA II (5 o 6) | Tema ambiguo, título incompleto o regla pendiente |
| mapacurricular-iaeronautica-esimetic-upiig | 7 | OPTATIVA IV (5 o 6) | Tema ambiguo, título incompleto o regla pendiente |
| mapacurricular-iaeronautica-esimetic-upiig | 7 | TÓPICOS SELECTOS DE INGENIERÍA II | Tema ambiguo, título incompleto o regla pendiente |

## 4. Revisión por plan

### 4.1. esime--ing.-ele--plan-2026--281-29

Unidades académicas: ESIME. Año del plan: 2026. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/esime--ing.-ele--plan-2026--281-29.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 20 | CÁLCULO DIFERENCIAL E INTEGRAL; FÍSICA CLÁSICA; FUNDAMENTOS DE ÁLGEBRA; CÁLCULO VECTORIAL; ECUACIONES DIFERENCIALES; ELECTRICIDAD Y MAGNETISMO |
| comp: Computación | 5 | FUNDAMENTOS DE PROGRAMACIÓN; PROGRAMACIÓN ORIENTADA A OBJETOS; Fundamentos de programación; Programación avanzada; Optativa II: Diseño asistido por computadora |
| elec: Electrónica | 57 | ANÁLISIS DE CIRCUITOS ELÉCTRICOS I; ELECTRÓNICA I; ANÁLISIS DE CIRCUITOS ELÉCTRICOS II; ELECTRÓNICA II: POTENCIA BÁSICA; EQUIPO ELÉCTRICO; INSTALACIONES ELÉCTRICAS EN BAJA TENSIÓN |
| ctrl: Control y automatización | 7 | ELEMENTOS DE CONTROL ELÉCTRICO; ACCIONAMIENTO Y CONTROLES ELÉCTRICOS; MEDICIONES ELÉCTRICAS; Sistemas de control eléctrico; Metrología e instrumentación eléctrica; Accionamiento y control eléctrico |
| quim: Química | 2 | QUÍMICA BÁSICA; QUÍMICA APLICADA |
| integral: Humanidades y gestión | 25 | HUMANIDADES I: INGENIERÍA, CIENCIA Y SOCIEDAD; HUMANIDADES II: LA COMUNICACIÓN Y LA INGENIERÍA; HUMANIDADES III: DESARROLLO HUMANO; HUMANIDADES IV: DESARROLLO PERSONAL Y PROFESIONAL; ADMINISTRACIÓN Y AHORRO DE ENERGÍA; ECONOMÍA |
| prof: Práctica profesional | 10 | METODOLOGÍA DE LA INVESTIGACIÓN; DESARROLLO PROSPECTIVO DE PROYECTOS O TOPICOS SELECTOS DE INGENIERÍA I; PROYECTO DE INGENIERÍA O TOPICOS SELECTOS DE INGENIERÍA II; Metodología de la investigación; Desarrollo prospectivo de proyectos o Tópicos selectos de ingeniería I; Proyectos de ingeniería o Tópicos selectos de ingeniería II |
| esp: Especialidad | 6 | OPTATIVA I; OPTATIVA II; OPTATIVA III; Electiva ** |
| mec: Mecánica y materiales | 10 | MECÁNICA; MATERIALES ELECTROTÉCNICOS; TEORÍA DE RESISTENCIA DE MATERIALES; Materiales electrotécnicos; Mecánica de los cuerpos indeformables; Teoria de resistencia de materiales |
| civil: Construcción y tierra | 1 | Proyectos de infraestructura eléctrica |
| amb: Ambiente y energía | 7 | CONVERSIÓN DE LA ENERGÍA I; CONVERSIÓN DE LA ENERGÍA II; CONVERSIÓN DE LA ENERGÍA III; FUENTES DE GÉNERACIÓN; Química sustentable; Optativa V: Diseño de generadores eólicos |
| ind: Operaciones y logística | 4 | Sistemas de tracción eléctrica y movilidad; Optativa V: Calidad de la energía para centros de carga; INGENIERÍA INDUSTRIAL; SISTEMAS DE PRODUCCIÓN Y CALIDAD |
| sin_categoria: Sin categoría | 2 | TEORÍA GENERAL DE SISTEMAS |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| ADMINISTRACION Y AHORRO DE ENERGIA | integral | contexto: formación integral fuera del núcleo de negocios |
| ECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| LINEAS Y REDES DE DISTRIBUCION | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| DESARROLLO PROSPECTIVO DE PROYECTOS O TOPICOS SELECTOS DE INGENIERIA I | prof | contexto: proyecto de integración profesional en ingeniería; confirmar alternativa de tópicos |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| PROYECTO DE INGENIERIA O TOPICOS SELECTOS DE INGENIERIA II | prof | contexto: proyecto de integración profesional en ingeniería; confirmar alternativa de tópicos |
| FUNDAMENTOS ECONOMICOS PARA LA INGENIERIA | integral | contexto: formación integral fuera del núcleo de negocios |
| LUMINOTECNIA Y FOTOMETRIA | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| REDES GENERALES DE DISTRIBUCION | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| FINANZAS PARA LA INGENIERIA | integral | contexto: formación integral fuera del núcleo de negocios |
| PROYECTOS DE INGENIERIA O TOPICOS SELECTOS DE INGENIERIA II | prof | contexto: proyecto de integración profesional en ingeniería; confirmar alternativa de tópicos |
| GESTION DE NEGOCIOS EN LA INGENIERIA | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I: ADMINISTRACION DE LA DEMANDA Y USO EFICIENTE DE LA ENERGIA | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.2. iia-escom-upiic-upiit

Unidades académicas: ESCOM, UPIIC, UPIIT. Año del plan: 2020. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/iia-escom-upiic-upiit.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 8 | Matemáticas discreta; Cálculo; Mecánica y electromagnetismo; Algebra lineal; Cálculo multivariable; Ecuaciones diferenciales |
| comp: Computación | 10 | Fundamentos de programación; Análisis y diseño de algoritmos; Paradigmas de programación; Tecnologías para el desarrollo de aplicaciones web; Análisis y diseño de sistemas; Teoria de la computación |
| datos: Ciencia de datos e IA | 18 | Bases de datos; Fundamentos de inteligencia artificial; Procesamiento digital de imágenes; Aprendizaje de máquina; Visión artificial; Algoritmos bioinspirados |
| elec: Electrónica | 3 | Fundamentos de diseño digital; Diseño de sistemas digitales; Procesamiento de señales |
| ctrl: Control y automatización | 1 | Técnicas de programación para robots móviles |
| integral: Humanidades y gestión | 10 | Fundamentos económicos; Comunicación oral y escrita; Ingeniería, ética y sociedad; Finanzas empresariales; Liderazgo personal; Formulación y evaluación de proyectos informáticos |
| prof: Práctica profesional | 4 | Metodología de la investigación y divulgación científica; Trabajo terminal I; Trabajo terminal II; Estancia profesional |
| esp: Especialidad | 4 | Optativa A; Optativa B; Optativa C; Optativa D |
| civil: Construcción y tierra | 1 | Algoritmos y estructuras de datos |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MECANICA Y ELECTROMAGNETISMO | fm | excepción: Física básica, como en las reglas de ESCOM |
| FUNDAMENTOS ECONOMICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| FINANZAS EMPRESARIALES | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO DE HABILIDADES SOCIALES PARA LA ALTA DIRECCION | integral | contexto: formación integral fuera del núcleo de negocios |
| INNOVACION Y EMPRENDIMIENTO TECNOLOGICO | integral | contexto: formación integral fuera del núcleo de negocios |
| PROPIEDAD INTELECTUAL | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.3. ingenieria-civil-2--282-29

Unidades académicas: ESIA, UPIIP. Año del plan: 2023. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/ingenieria-civil-2--282-29.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 16 | FÍSICA; MATEMÁTICAS I; MATEMÁTICAS II; MATEMÁTICAS III; MATEMÁTICAS IV; MATEMÁTICAS V |
| comp: Computación | 6 | HERRAMIENTAS COMPUTACIONALES; PROGRAMACIÓN; Herramientas computacionales en la ingeniería **; Fundamentos de programación estructurada **; DESARROLLO DE APLICACIONES INFORMÁTICAS (1); SISTEMAS DE INFORMACIÓN (1) |
| quim: Química | 2 | QUÍMICA BÁSICA Y APLICADA; Química básica y aplicada *** |
| integral: Humanidades y gestión | 19 | RELACIONES HUMANAS; ECONOMÍA; ESTRUCTURA Y DESARROLLO DE MÉNICO; ADMINISTRACIÓN; PLANEACIÓN; Desarrollo humano integral ** |
| prof: Práctica profesional | 2 | METODOLOGÍA DE LA INVESTIGACIÓN; Metodología de la investigación ** |
| esp: Especialidad | 4 | OPTATIVA I; Optativa I; Optativa II; Optativa III |
| mec: Mecánica y materiales | 16 | DINÁMICA DE LA PARTÍCULA; ESTÁTICA; MECÁNICA DE SUELOS I; MECÁNICA DE SUELOS II; RESISTENCIA DE MATERIALES; MECÁNICA DE SUELOS III |
| civil: Construcción y tierra | 88 | EXPRESIÓN GRAFICA I; GEOLOGÍA; EXPRESIÓN GRÁFICA II; TOPOGRAFÍA; ESTRUCTURAS ISOSTÁTICAS; GEOMÁTICA |
| amb: Ambiente y energía | 6 | INGENIERÍA SANITARIA Y AMBIENTAL; Ingeniería sanitaria y ambiental; FUNDAMENTOS DE POTABILIZACIÓN Y TRATAMIENTO DE AGUA (4); RESIDUOS PELIGROSOS (4); GENERACIÓN DE ENERGÍA HIDROELÉCTRICA (3); INGENIERÍA DE PLANTAS POTABILIZADORAS (4) |
| ind: Operaciones y logística | 5 | TRANSPORTE E INGENIERÍA DE TRÁNSITO; CALIDAD DEL AGUA Y CONTAMINACIÓN DE CUERPOS DE AGUA (4); CONTROL DE CALIDAD DE MATERIALES NATURALES Y ARTIFICIALES (7); INGENIERÍA DE TRÁNSITO (6); INGENIERÍA DE TRANSPORTE (6) |
| soc: Ciencias sociales | 1 | SOCIOLOGÍA |
| sin_categoria: Sin categoría | 2 | INGENIERÍA DE SISTEMAS I; Ingeniería de sistemas |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| EXPRESION GRAFICA I | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| ECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| EXPRESION GRAFICA II | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION | integral | contexto: formación integral fuera del núcleo de negocios |
| ESTATISTICA *** | fm | excepción: Lectura OCR de estadística; verificar original |
| ECONOMIA PARA INGENIEROS ** | integral | contexto: formación integral fuera del núcleo de negocios |
| FUNDAMENTOS DE ADMINISTRACION ** | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE OBRA | integral | contexto: formación integral fuera del núcleo de negocios |
| FORMULACION DE PROYECTOS DE INVERSION (1) | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANIFICACION URBANA (6) | integral | contexto: formación integral fuera del núcleo de negocios |
| NORMATIVIDAD DE LA OBRA PUBLICA Y TIPOS DE LICITACIONES (7) | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE OBRAS CIVILES (1) | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA DE PLANTAS DE TRATAMIENTO (4) | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| OPERACION, MANTENIMIENTO Y ADMINISTRACION DE SERVICIOS MUNICIPALES (4) | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.4. ingenieria-quimica-petrolera

Unidades académicas: ESIQUIE. Año del plan: 2010. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/ingenieria-quimica-petrolera.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 7 | ÁLGEBRA LINEAL Y MATRICIAL; CÁLCULO DIFERENCIAL E INTEGRAL; ECUACIONES DIFERENCIALES APLICADAS; ELECTRICIDAD Y MAGNETISMO; MÉTODOS NUMÉRICOS; MODELACIÓN, SIMULACIÓN Y OPTIMIZACIÓN DE PROCESOS |
| comp: Computación | 3 | HERRAMIENTAS COMPUTACIONALES EN INGENIERÍA; TALLER DE PROGRAMACIÓN; PAQUETERÍA COMPUTACIONAL PARA EL MANEJO DE FLUIDOS EN EMULSIÓN |
| elec: Electrónica | 1 | INGENIERÍA ELÉCTRICA Y ELECTRÓNICA |
| ctrl: Control y automatización | 1 | INSTRUMENTACIÓN Y CONTROL DE PLANTAS DE PROCESO |
| quim: Química | 6 | FUNDAMENTOS DE QUÍMICA; CINÉTICA QUÍMICA EN REACTORES HOMOGÉNEOS; ELECTROQUÍMICA Y CORROSIÓN; TERMODINÁMICA DEL EQUILIBRIO QUÍMICO; PETROQUÍMICA BÁSICA Y PROCESOS PETROQUÍMICOS; PROCESOS PETROQUÍMICOS INDUSTRIALES |
| proc: Ingeniería de procesos | 12 | TALLER DE OPERACIÓN DE PLANTAS; TERMODINÁMICA DEL EQUILIBRIO DE FASES; INGENIERÍA DE REACTORES HETEROGÉNEOS; OPERACIONES DE SEPARACIÓN DIFUSIONALES; TRANSFERENCIA DE CALOR; ABSORCIÓN Y AGOTAMIENTO |
| integral: Humanidades y gestión | 8 | COMUNICACIÓN ORAL Y ESCRITA; INGLÉS I; FUNDAMENTOS DE ECONOMÍA Y ADMINISTRACIÓN; TALLER DE RELACIONES HUMANAS; ÉTICA PROFESIONAL; FINANZAS |
| prof: Práctica profesional | 8 | ESTANCIA Y PRÁCTICA PROFESIONAL I (INTERSEMESTRAL); ESTANCIA Y PRÁCTICA PROFESIONAL II (INTERSEMESTRAL); ESTANCIA Y PRÁCTICA PROFESIONAL III (INTERSEMESTRAL); TALLER DE PROYECTO TERMINAL I; INGENIERÍA DE PROYECTOS; TALLER DE PROYECTO TERMINAL II |
| esp: Especialidad | 10 | ELECTIVA I; ELECTIVA II; OPTATIVA I; ELECTIVA III; ELECTIVA IV; OPTATIVA II |
| mec: Mecánica y materiales | 6 | CIENCIA Y TECNOLOGÍA DE MATERIALES; FLUJO DE FLUIDOS; INGENIERÍA MECÁNICA; MANEJO DE FLUIDOS EN EMULSIÓN; POLÍMEROS; TÉCNICAS DE MANTENIMIENTO DE LA GESTIÓN DE LA CALIDAD |
| civil: Construcción y tierra | 7 | CARACTERIZACIÓN DEL PETRÓLEO Y SUS PRODUCTOS; QUÍMICA DEL PETRÓLEO Y CATÁLISIS; TALLER DE ANÁLISIS DEL PETRÓLEO; VALORACIÓN TECNOLÓGICA DEL PETRÓLEO Y SUS PRODUCTOS; VALORACION TECNOLÓGICA DEL PETRÓLEO Y SUS PRODUCTOS; FLUIDOS DE PERFORACIÓN |
| amb: Ambiente y energía | 7 | BALANCE DE MATERIA Y ENERGÍA; TRATAMIENTO DE AGUAS; INGENIERÍA AMBIENTAL; ENERGÉTICOS ALTERNOS; OBTENCIÓN DE COMBUSTIBLES DE TRANSPORTE; NORMATIVIDAD DE LA GESTIÓN AMBIENTAL |
| ind: Operaciones y logística | 8 | FUNDAMENTOS DE FENÓMENOS DE TRANSPORTE; TRANSPORTE Y ALMACENAMIENTO DEL PETRÓLEO Y SUS PRODUCTOS; ADMINISTRACIÓN Y GESTIÓN DE LA CALIDAD; INSPECCIÓN Y SEGURIDAD INDUSTRIAL; MEJORAMIENTO EN EL TRANSPORTE DE CRUDOS PESADOS; TÉCNICAS DE MEJORAMIENTO DE LA CALIDAD |
| soc: Ciencias sociales | 1 | TALLER DE PSICOLOGÍA INDUSTRIAL |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| FUNDAMENTOS DE ECONOMIA Y ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| FINANZAS | integral | contexto: formación integral fuera del núcleo de negocios |
| ANALISIS DE RIESGOS | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| NORMATIVIDAD DE ADQUISICION DE BIENES Y SERVICIOS | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.5. licenciatura-en-comercio-internacional--28plan-2024-29-vigencia-2025-1

Unidades académicas: ESCA. Año del plan: 2024. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/no-escolarizado/licenciatura-en-comercio-internacional--28plan-2024-29-vigencia-2025-1.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| comp: Computación | 1 | Herramientas digitales básicas |
| integral: Humanidades y gestión | 3 | Habilidades para la comunicación; Comportamiento humano en el trabajo; Etica y responsabilidad social |
| prof: Práctica profesional | 3 | Metodología de la investigación; Estancia empresarial; Seminario de investigación aplicada |
| esp: Especialidad | 4 | Optativa I; Optativa II; Optativa III; Electiva ** |
| amb: Ambiente y energía | 1 | Desarrollo sustentable |
| ind: Operaciones y logística | 5 | Transportación internacional en la gestión logística; Investigación de operaciones; Calidad; International logistics management *; Dirección logística internacional |
| adm: Administración y negocios | 50 | Fundamentos de administración; Fundamentos de derecho; Matemáticas para negocios; Fundamentos de mercadotecnia; Economía de las empresas; Pensamiento innovador y toma de decisiones |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| FUNDAMENTOS DE ADMINISTRACION | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE DERECHO | adm | contexto: núcleo de negocios |
| MATEMATICAS PARA NEGOCIOS | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE MERCADOTECNIA | adm | contexto: núcleo de negocios |
| ECONOMIA DE LAS EMPRESAS | adm | contexto: núcleo de negocios |
| PENSAMIENTO INNOVADOR Y TOMA DE DECISIONES | adm | contexto: núcleo de negocios |
| DERECHO MERCANTIL | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE CONTABILIDAD | adm | contexto: núcleo de negocios |
| MACROECONOMIA | adm | contexto: núcleo de negocios |
| TALENTO HUMANO DEL LCI | adm | contexto: vocabulario disciplinar de negocios y economía |
| REGIMEN LEGAL DEL COMERCIO EXTERIOR | adm | contexto: núcleo de negocios |
| MERCEOLOGIA Y CLASIFICACION ARANCELARIA | adm | contexto: vocabulario disciplinar de negocios y economía |
| GESTION ADMINISTRATIVA DEL COMERCIO INTERNACIONAL | adm | contexto: núcleo de negocios |
| ENTORNO ECONOMICO INTERNACIONAL | adm | contexto: núcleo de negocios |
| DERECHO ADUANERO | adm | contexto: vocabulario disciplinar de negocios y economía |
| MARKETING FOR INTERNATIONAL TRADE * | adm | contexto: vocabulario disciplinar de negocios y economía |
| ADMINISTRACION ESTRATEGICA PARA EL COMERCIO INTERNACIONAL | adm | contexto: núcleo de negocios |
| ADMINISTRACION ADUANERA | adm | contexto: vocabulario disciplinar de negocios y economía |
| FINANZAS INTERNACIONALES | adm | contexto: núcleo de negocios |
| DERECHO TRIBUTARIO | adm | contexto: núcleo de negocios |
| ANALISIS JURIDICO DE LOS TRATADOS DE LIBRE COMERCIO | adm | contexto: núcleo de negocios |
| ADMINISTRACION DE LAS CADENAS DE SUMINISTRO | adm | contexto: núcleo de negocios |
| TALLER DOCUMENTAL DEL COMERCIO EXTERIOR | adm | contexto: núcleo de negocios |
| INTERNATIONAL LOGISTICS MANAGEMENT * | ind | excepción: Logística internacional |
| PROGRAMAS DE FOMENTO AL COMERCIO EXTERIOR | adm | contexto: núcleo de negocios |
| COMERCIO ELECTRONICO Y DE SERVICIOS | adm | contexto: núcleo de negocios |
| TRATADOS DE LIBRE COMERCIO | adm | contexto: núcleo de negocios |
| PRACTICAS CONTRACTUALES INTERNACIONALES | adm | contexto: vocabulario disciplinar de negocios y economía |
| EVALUACION DE RIESGOS EN EL COMERCIO INTERNACIONAL | adm | contexto: núcleo de negocios |
| DESARROLLO DE EMPRENDEDORES | adm | contexto: núcleo de negocios |
| PROYECT MANAGEMENT FOR INTERNATIONAL TRADE * | adm | contexto: vocabulario disciplinar de negocios y economía |
| HERRAMIENTAS TECNOLOGICAS EN EL COMERCIO INTERNACIONAL | adm | contexto: núcleo de negocios |
| CUMPLIMIENTO ADUANERO | adm | contexto: vocabulario disciplinar de negocios y economía |
| FEASIBILITY STUDY FOR INTERNATIONAL * | adm | excepción: Estudio de factibilidad en comercio; título truncado |
| OPTIMIZACION, SOSTENIBILIDAD Y TECNOLOGIA EN LA EMPRESA | adm | contexto: núcleo de negocios |
| FORMACION DIRECTIVA | adm | contexto: vocabulario disciplinar de negocios y economía |
| MEDIOS DE DEFENSA EN MATERIA DE COMERCIO EXTERIOR | adm | contexto: núcleo de negocios |
| AUDITORIA DE COMERCIO EXTERIOR | adm | contexto: núcleo de negocios |
| DIRECCION DE LA ESTRATEGIA DEL COMERCIO INTERNACIONAL | adm | contexto: núcleo de negocios |
| OPTATIVA I TALLER DE CLASIFICACION ARANCELARIA | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA II CERTIFICACIONES ADUANERAS NACIONALES E INTERNACIONALES | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA III SOLUCION DE CONTROVERSIAS EN EL COMERCIO INTERNACIONAL | adm | contexto: núcleo de negocios |
| OPTATIVA I ADMINISTRACION DE LA CAPACIDAD Y DEMANDA | adm | contexto: núcleo de negocios |
| OPTATIVA II GESTION DE INVENTARIOS Y ALMACENES | adm | contexto: núcleo de negocios |
| OPTATIVA III ESTRATEGIAS PARA LA LOGISTICA GLOBAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA I SEMINARIO DE EVALUACION ADUANERA | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA II ESQUEMAS DE OPERACION EN MATERIA ADUANERA Y DE COMERCIO EXTERIOR | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA III ADMINISTRACION DE AUTORIZACIONES Y DE REGISTRO DE COMERCIO EXTERIOR | adm | contexto: núcleo de negocios |
| OPTATIVA I PRINCIPIOS DE MERCADOTECNIA ESTRATEGICA | adm | contexto: núcleo de negocios |
| OPTATIVA II TOPICOS DE MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| OPTATIVA III ESTRATEGIAS DE LA NEGOCIACION EN LA COMERCIALIZACION | adm | contexto: vocabulario disciplinar de negocios y economía |

### 4.6. licenciatura-en-fisica-y-matematicas

Unidades académicas: ESFM. Año del plan: 1994. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/licenciatura-en-fisica-y-matematicas.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 92 | ÁLGEBRA I; ÁLGEBRA II; ECUACIONES DIFERENCIALES; CÁLCULO I; FÍSICA II; ANÁLISIS VECTORIAL |
| comp: Computación | 9 | PROGRAMACIÓN II; OPTATIVA I 4.5 0.0 4.5 9.0 PROGRAMACIÓN II; PROGRAMACIÓN I 4.5 0.0 4.5 9.0 --- --- --- --- --- GEOMETRÍA PROYECTIVA 4.5 0.0 4.5 9.0 TOTAL; ASIGNATURA DE LA OPCION EN FISICA DEL 5° AL 8° SEM. --- --- 3.0-6.0 6.0-12.0 PROGRAMACIÓN LINEAL; PROGRAMACIÓN I |
| datos: Ciencia de datos e IA | 4 | GEOMETRÍA ANALÍTICA; GEOMETRÍA ANALITICA |
| elec: Electrónica | 3 | OPTATIVA I 4.5 0.0 4.5 9.0 CIRCUITOS ELÉCTRICOS; ELECTRÓNICA FUNCIONAL I** --- ASIGNATURA DE LA OPCIÓN EN MATEMÁTICAS; ELECTRÓNICA FUNCIONAL II** --- 5.0 5.0 10.0 CURSO ESPECIAL |
| ctrl: Control y automatización | 2 | TEORÍA DEL CONTROL I 3.0 0.0 3.0 6.0 INTRODUCCIÓN A FÍSICA ATÓMICA Y MOLECULAR; CURSO ESPECIAL 3.0 0.0 3.0 6.0 TEORÍA DE CONTROL II |
| proc: Ingeniería de procesos | 4 | TEORÍA DE REACTORES NUCLEARES II; TEORÍA DE REACTORES NUCLEARES I; TERMODINÁMICA DE CICLOS DE POTENCIA; TRANSFERENCIA DE CALOR |
| prof: Práctica profesional | 1 | INTRODUCIÓN A LA INGENIERÍA NUCLEAR |
| esp: Especialidad | 12 | OPTATIVA I; OPTATIVA II; OPTATIVA III |
| mec: Mecánica y materiales | 2 | INTRODUCCION A FISICA MODERNA 6.0 0.0 6.0 12.0 MECÁNICA CUÁNTICA I; INTRODUCCIÓN A LA FÍSICA DEL ESTADO SÓLIDO 3.0 0.0 3.0 6.0 RADIACIÓN Y PROPAGACIÓN |
| civil: Construcción y tierra | 1 | TOPOLOGÍA I 4.5 0.0 4.5 9.0 ARQUITECTURA DE UNA COMPUTADORA |
| amb: Ambiente y energía | 1 | INGENIERÍA NUCLEAR I |
| ind: Operaciones y logística | 2 | FUNDAMENTOS DE COMPUTACIÓN 4.5 0.0 4.5 9.0 INVESTIGACIÓN DE OPERACIONES II; INVESTIGACIÓN DE OPERACIONES I 4.5 0.0 4.5 9.0 ESTADÍSTICA II |
| soc: Ciencias sociales | 6 | DIDÁCTICA GENERAL; HISTORIA DE LAS MATEMÁTICAS; TALLER PEDAGÓGICO II; FILOSOFÍA DE LA CIENCIA I; TALLER PEDAGÓGICO I; FILOSOFÍA DE LA CIENCIA II |
| sin_categoria: Sin categoría | 12 | OPTATIVA I 4.5 0.0 4.5 9.0 OPTATIVA II; CURSO ESPECIAL 4.5 0.0 4.5 9.0 INTRODUCCIÓN A SISTEMAS; CURSO ESPECIAL; C SEMESTRE VIII T P T/H C CURSO ESPECIAL; C SEMESTRE VIII T P T/H C OPTATIVA I 4.5 0.0 4.5 9.0 OPTATIVA I; OPTATIVA II 4.5 0.0 4.5 9.0 OPTATIVA II |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MECANICA CUANTICA II | fm | excepción: Física básica |
| MECANICA CUANTICA I | fm | excepción: Física básica |

### 4.7. mapa-curicular-esit-textil-bis

Unidades académicas: ESIT. Año del plan: 2018. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curicular-esit-textil-bis.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 7 | Álgebra lineal; Mecánica clásica; Cálculo diferencial e integral; Electricidad y magnetismo; Cálculo vectorial; Ecuaciones diferenciales |
| comp: Computación | 2 | Fundamentos de programación; Programación orientada a objetos |
| elec: Electrónica | 1 | Fundamentos de electromecánica y electrónica |
| quim: Química | 5 | Fibras químicas; Química básica textil; Fisicoquímica textil; Química aplicada a la ingeniería textil; Hilatura de fibras químicas |
| integral: Humanidades y gestión | 15 | Habilidades y técnicas de comunicación; Desarrollo y liderazgo; Ingeniería económica; Relaciones industriales; Contabilidad industrial; Legislación aduanera |
| esp: Especialidad | 2 | Optativa |
| mec: Mecánica y materiales | 54 | Fibras naturales; Métodos de hilados; Fundamentos de tejidos de calada y jacquard; Contexto de la ingeniería textil; Métodos de acabados; Fundamentos de tejido de punto |
| amb: Ambiente y energía | 3 | Gestión ambiental y tecnologías limpias; Tecnología del reciclado y geotextiles; ISO 14001 en procesos de hilados |
| ind: Operaciones y logística | 12 | Higiene y seguridad industrial; Análisis y cálculo de producción en tejidos; Control de calidad en los tejidos; Sistemas de gestión de calidad; Análisis y producción en tejido de punto por urdimbre; Programación y control de la producción |
| sin_categoria: Sin categoría | 8 | Trayectoria |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MECANICA CLASICA | fm | excepción: Física básica |
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| FUNDAMENTOS DE TERMODINAMICA | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| CONTABILIDAD INDUSTRIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| LEGISLACION ADUANERA | integral | contexto: formación integral fuera del núcleo de negocios |
| SISTEMA DE COSTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE PROYECTOS EN HILADOS * | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE PROYECTOS EN TEJIDOS* | integral | contexto: formación integral fuera del núcleo de negocios |
| ACABADOS CON ATRIBUTOS O FUNCIONALES | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE PROYECTOS EN ACABADOS* | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE PROYECTOS EN CONFECCION* | integral | contexto: formación integral fuera del núcleo de negocios |
| EMPRENDIMIENTO | integral | contexto: formación integral fuera del núcleo de negocios |
| NEGOCIACION Y SOLUCION DE CONFLICTOS | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.8. mapa-curricular-contadorpublico-esca-ust-utepepan

Unidades académicas: ESCA. Año del plan: 2022. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-contadorpublico-esca-ust-utepepan.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 1 | Estadística |
| comp: Computación | 1 | Herramientas digitales básicas |
| datos: Ciencia de datos e IA | 1 | Taller de análisis de datos |
| integral: Humanidades y gestión | 2 | Habilidades para la comunicación; Comportamiento humano en el trabajo |
| prof: Práctica profesional | 2 | Metodología de la investigación; Seminario de investigación aplicada |
| esp: Especialidad | 4 | Optativa I; Optativa II; Electiva *; Optativa III |
| amb: Ambiente y energía | 1 | Desarrollo sustentable |
| ind: Operaciones y logística | 2 | Investigación de operaciones; OPTATIVA II Auditoria de control de calidad |
| adm: Administración y negocios | 56 | Fundamentos de contabilidad; Matemáticas para negocios; Fundamentos de derecho; Pensamiento innovador y toma de decisiones; Ciclo financiero a corto plazo; Derecho mercantil |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| FUNDAMENTOS DE CONTABILIDAD | adm | contexto: núcleo de negocios |
| MATEMATICAS PARA NEGOCIOS | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE DERECHO | adm | contexto: núcleo de negocios |
| PENSAMIENTO INNOVADOR Y TOMA DE DECISIONES | adm | contexto: núcleo de negocios |
| CICLO FINANCIERO A CORTO PLAZO | adm | contexto: núcleo de negocios |
| DERECHO MERCANTIL | adm | contexto: núcleo de negocios |
| MATEMATICAS FINANCIERAS | adm | contexto: núcleo de negocios |
| ECONOMIA DE LA EMPRESA | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE ADMINISTRACION | adm | contexto: núcleo de negocios |
| CICLO FINANCIERO A LARGO PLAZO | adm | contexto: núcleo de negocios |
| CONTABILIDAD DE COSTOS HISTORICOS | adm | contexto: núcleo de negocios |
| INTRODUCCION A LAS FINANZAS | adm | contexto: núcleo de negocios |
| DERECHO LABORAL Y SEGURIDAD SOCIAL | adm | contexto: núcleo de negocios |
| HERRAMIENTAS DIGITALES ADMINISTRATIVAS | adm | contexto: núcleo de negocios |
| MACROECONOMIA | adm | contexto: núcleo de negocios |
| ESTUDIO DE CAPITAL CONTABLE | adm | contexto: vocabulario disciplinar de negocios y economía |
| CONTABILIDAD DE COSTOS PREDETERMINADOS | adm | contexto: núcleo de negocios |
| TRIBUTACION DE PERSONAS MORALES | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE AUDITORIA | adm | contexto: núcleo de negocios |
| ADMINISTRACION FINANCIERA DEL CAPITAL DEL TRABAJO | adm | contexto: vocabulario disciplinar de negocios y economía |
| DERECHO TRIBUTARIO Y MEDIOS DE DEFENSA FISCAL | adm | contexto: núcleo de negocios |
| CONTABILIDAD CORPORATIVA | adm | contexto: núcleo de negocios |
| TRIBUTACION DE PERSONAS FISICAS | adm | contexto: núcleo de negocios |
| PLANEACION FINANCIERA | adm | contexto: núcleo de negocios |
| AUDITORIA DE ESTOS FINANCIEROS: RESULTADOS Y ACTIVO | adm | contexto: núcleo de negocios |
| CONTABILIDAD DE COSTOS PARA LA TOMA DE DESICIONES | adm | contexto: núcleo de negocios |
| FINANZAS CORPORATIVAS | adm | contexto: núcleo de negocios |
| INTERNATIONAL ACCOUNTING STANDARS | adm | contexto: vocabulario disciplinar de negocios y economía |
| GESTION DE COSTOS | adm | contexto: núcleo de negocios |
| TRIBUTACION DE REGIMENES ESPECIALES | adm | contexto: núcleo de negocios |
| AUDITORIA DE ESTOS FINANCIEROS: PASIVO, CAPITAL Y CIERRE | adm | contexto: vocabulario disciplinar de negocios y economía |
| ANALISIS FINANCIERO | adm | contexto: núcleo de negocios |
| MANAGEMENT OF BUSINESS MODELS AND ENTREPRENEURSHIP | adm | contexto: vocabulario disciplinar de negocios y economía |
| INFORME Y DICTAMEN DEL CONTADOR | adm | contexto: vocabulario disciplinar de negocios y economía |
| TRIBUTACION DE CASOS ESPECIFICOS | adm | contexto: núcleo de negocios |
| EVALUACION DE PROYECTOS DE INVERSION | adm | contexto: núcleo de negocios |
| INTERNATIONAL TRADE | adm | contexto: vocabulario disciplinar de negocios y economía |
| ETICA, LIDERAZGO Y NEGOCIACION | adm | contexto: núcleo de negocios |
| DIRECCION ESTRATEGICA | adm | contexto: núcleo de negocios |
| RISK MANAGEMENT | adm | contexto: vocabulario disciplinar de negocios y economía |
| TRIBUTACION INTERNACIONAL | adm | contexto: núcleo de negocios |
| GOBIERNO CORPORATIVO Y AUDITORIA INTERNA | adm | contexto: núcleo de negocios |
| OPTATIVA I AUDITORIA FORENCE | adm | contexto: núcleo de negocios |
| OPTATIVA III AUDITORIA EN INFORMATICA | adm | contexto: núcleo de negocios |
| OPTATIVA I CONTABILIDAD DE INSTITUCIONES FINANCIERAS | adm | contexto: núcleo de negocios |
| OPTATIVA II CONTABILIDAD DE CONSTRUCTORAS | adm | contexto: núcleo de negocios |
| OPTATIVA III CONTABILIDAD ESPECIALES | adm | contexto: núcleo de negocios |
| OPTATIVA I FINANZAS INTERNACIONALES | adm | contexto: núcleo de negocios |
| OPTATIVA II FINANZAS BURSATILES | adm | contexto: núcleo de negocios |
| OPTATIVA III ESTUDIOS DE CASO DE FINANZAS | adm | contexto: núcleo de negocios |
| OPTATIVA I FINANZAS PUBLICAS | adm | contexto: núcleo de negocios |
| OPTATIVA II CONTABILIDAD GUBERNAMENTAL | adm | contexto: núcleo de negocios |
| OPTATIVA III AUDITIO GUBERNAMENTAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA I I MPUESTAS AL COMERCIO EXTERIOR | adm | contexto: núcleo de negocios |
| OPTATIVA II CONTRIBUCIONES AL TRABAJO PERSONAL REMUNERADO | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA III INFORMES DE AUTORIDADES TRIBUTARIAS | adm | contexto: núcleo de negocios |

### 4.9. mapa-curricular-ialimentos-upibi-upiiz-upiiap

Unidades académicas: UPIBI, UPIIZ, UPIIAP. Año del plan: 2006. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-ialimentos-upibi-upiiz-upiiap.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 9 | CALCULO DIFERENCIAL E INTEGRAL; FISICA DEL MOVIMIENTO APLICADA; ALGEBRA VECTORIAL; ESTADÍSTICA; METODOS CUANTITATIVOS; APLICACIONES MATEMATICAS (TALLER) |
| comp: Computación | 1 | PROGRAMACIÓN |
| elec: Electrónica | 1 | INGENIERÍA ELÉCTRICA Y ELECTRÓNICA |
| ctrl: Control y automatización | 1 | DINAMICA Y CONTROL DE BIOPROCESOS |
| bio: Ciencias biológicas | 5 | BIOLOGÍA CELULAR; MICROBIOLOGÍA; LABORATORIO DE BIOINGENIERÍA; BIOTECNOLOGÍA ALIMENTARIA; SINTESIS Y ANALISIS DE BIOPROCESOS |
| quim: Química | 2 | QUIMICA GENERAL APLICADA; QUIMICA ORGANICA APLICADA |
| proc: Ingeniería de procesos | 23 | FISICOQUIMICA DE ALIMENTOS; INOCUIDAD ALIMENTARIA; QUIMICA Y FUNCIONALIDAD DE LOS ALIMENTOS; TERMODINAMICA II; CIENCIA Y TECNOLOGÍA DE ALIMENTOS I; EVALUACION SENSORIAL DE LOS ALIMENTOS |
| integral: Humanidades y gestión | 10 | BIOTECNOLOGÍA Y SOCIEDAD; COMUNICACION Y SISTEMAS DE INFORMACION (TALLER); INGLES I; INGLES II; RELACIONES LABORALES; ETICA (TALLER) |
| prof: Práctica profesional | 1 | ESTANCIA DE TITULACION |
| esp: Especialidad | 4 | OPTATIVA I; OPTATIVA II; ELECTIVA I; ELECTIVA II |
| mec: Mecánica y materiales | 5 | TEMODINAMICA I; ENVASES Y EMBALAJES; ELECTROMECANICA DE PROCESOS; MECANICA DE FLUIDOS Y SOLIDOS; TECNOLOGÍA FRIGORIFICA |
| amb: Ambiente y energía | 2 | BALANCE DE MATERIA Y ENERGÍA; NUEVOS METODOS DE CONSERVACIÓN |
| ind: Operaciones y logística | 2 | FENOMENOS DE TRANSPORTE; INGENIERÍA INDUSTRIAL |
| salud: Ciencias de la salud | 1 | FISIOLOGÍA DE LA NUTRICION |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| INOCUIDAD ALIMENTARIA | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| PLANEACION DEL RIESGO E IMPACTO AMBIENTAL | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO DE PRODUCTOS | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| TRATAMIENTO Y REMEDIACION DE DESECHOS DE LA INDUSTRIA ALIMENTARIA | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| LEGISLACION ALIMENTARIA | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.10. mapa-curricular-iam-upibi-upiiz

Unidades académicas: UPIBI, UPIIZ. Año del plan: 2006. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-iam-upibi-upiiz.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 11 | CÁLCULO DIFERENCIAL E INTEGRAL; FISICA DEL MOVIMIENTO APLICADA; ALGEBRA VECTORIAL; ÁLGEBRA VECTORIAL; ESTADÍSTICA; MÉTODOS CUANTITATIVOS APLICADOS |
| comp: Computación | 3 | PROGRAMACIÓN (TALLER); SISTEMAS DE INFORMACIÓN G |
| ctrl: Control y automatización | 1 | INSTRUMENTACIÓN Y CONTROL |
| bio: Ciencias biológicas | 3 | BIOLOGÍA DE EUCARIOTES; ECOLOGÍA; LABORATORIO DE BIOINGENIERÍA |
| quim: Química | 4 | QUÍMICA GENERAL APLICADA; QUÍMICA ORGÁNICA APLICADA; INGENIERÍA MOLECULAR; MÉTODOS INTRUMENTALES AVANZADOS |
| proc: Ingeniería de procesos | 10 | TERMODINÁMICA; PROCESOS DE TRANSFERENCIA DE CALOR; BIOSEPARACIONES FLUÍDO-FLUÍDO; BIOSEPARACIONES MECÁNICAS; BIOSEPARACIONES SÓLIDO-FLUÍDO; INGENIERÍA DE REACTORES Y BIORREACTORES |
| integral: Humanidades y gestión | 10 | BIOTECNOLOGÍA Y SOCIEDAD; COMUNICACIÓN Y SISTEMAS DE INFORMACIÓN (TALLER); INGLÉS I; INGLÉS II; RELACIONES LABORALES; ÉTICA (TALLER) |
| prof: Práctica profesional | 1 | ESTANCIA DE TITULACIÓN |
| esp: Especialidad | 3 | OPTATIVA I; OPTATIVA II; ELECTIVA |
| mec: Mecánica y materiales | 4 | INGENIERÍA ELECTROMECÁNICA; MECÁNICA DE FLUIDOS Y SÓLIDOS |
| civil: Construcción y tierra | 4 | INGENIERÍA CIVIL E HIDRÁULICA; INGENIERÍA CIVIL E HIDRAULICA; SISTEMAS DE INFORMACIÓN GEOGRÁFICA Y PERCEPCIÓN REMOTA |
| amb: Ambiente y energía | 13 | FÍSICA DE LA ENERGÍA APLICADA; BALANCE DE MATERIA Y ENERGÍA; FISICOQUÍMICA AMBIENTAL; MICROBIOLOGÍA AMBIENTAL; QUÍMICA AMBIENTAL I; QUÍMICA AMBIENTAL II |
| ind: Operaciones y logística | 4 | FENÒMENOS DE TRANSPORTE; SEGURIDAD E HIGIENE INDUSTRIAL; SISTEMAS DE CALIDAD; MANEJO INTEGRAL DE LA CALIDAD DEL AIRE |
| salud: Ciencias de la salud | 1 | TOXICOLOGÍA |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| LEGISLACION Y POLITICA AMBIENTAL | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANIFICACION Y ECONOMIA AMBIENTAL | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.11. mapa-curricular-iarquitecto-esia-utec

Unidades académicas: No indicada. Año del plan: 2023. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-iarquitecto-esia-utec.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 2 | GEOMETRIA Y CONFIGURACION ESPACIAL; Geometría y configuración espacial |
| comp: Computación | 6 | EDICIÓN DIGITAL DE IMÁGENES; PERSPECTIVA A MANO EN COMPUTADORA; NUEVAS HERRAMIENTAS VIRTUALES PARA EL ANALISIS Y DISEÑO DE ESTRUCTURAS ASISTIDAS POR COMPUTADORA; MODELADO TRIDIMENSIONAL AVANZADO; RECORRIDOS VIRTUALES; REALIDAD VIRTUAL |
| elec: Electrónica | 1 | Instalaciones eléctricas e iluminación |
| ctrl: Control y automatización | 1 | INSTALACIONES ELECTRICAS, ILUMINACION Y DOMOTICA |
| integral: Humanidades y gestión | 32 | ARTE, CULTURA Y SOCIEDAD; HERRAMIENTAS PARA EL APRENDIZAJE; INTRODUCCION A LA NORMATIVIDAD, MATERIALES Y HERRAMIENTAS EN LA CONSTRUCCION; ECONOMIA Y ARQUITECTURA; INGLES I; INGLES II |
| prof: Práctica profesional | 7 | PRACTICA PROFESIONAL; TALLER TERMINAL I; TALLER TERMINAL II; Introducción a la metodología de la investigación; Taller terminal I; Taller terminal II |
| esp: Especialidad | 18 | ELECTIVA I; ELECTIVA II; OPTATIVA I; OPTATIVA II; OPTATIVA III; ELECTIVA III |
| mec: Mecánica y materiales | 6 | MECANICA DE SUELOS; ESTATICA; RESISTENCIA DE MATERIALES; Estática; Resistencia de materiales; Mecánica de suelos |
| civil: Construcción y tierra | 99 | CONCEPTOS BASICOS DE LA ARQUITECTURA; GEOLOGIA; TOPOGRAFIA; FUNDAMENTOS DEL DISENO ARQUITECTONICO; INTRODUCCION DE GEOMETRIA EN ARQUITECTURA; INTRODUCCION A LAS INSTALACIONES HIDROSANITARIAS Y SUSTENTABILIDAD |
| amb: Ambiente y energía | 2 | Sustentabilidad en las instalaciones; VIVIENDA SOCIAL SUSTENTABLE |
| soc: Ciencias sociales | 10 | HISTORIA DE LA ARQUITECTURA DE LA ANTIGUEDAD A LA EDAD MEDIA; PSICOLOGIA PARA LA ARQUITECTURA; HISTORIA DE LA ARQUITECTURA DEL RENACIMIENTO AL SIGLO XIX; HISTORIA DE LA ARQUITECTURA A PARTIR DEL SIGLO XX; Filosofía de la arquitectura; Historia de la arquitectura I |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| INTRODUCCION A LA NORMATIVIDAD, MATERIALES Y HERRAMIENTAS EN LA CONSTRUCCION | integral | contexto: formación integral fuera del núcleo de negocios |
| ECONOMIA Y ARQUITECTURA | integral | contexto: formación integral fuera del núcleo de negocios |
| EXPRESION GRAFICA | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| PROCEDIMIENTOS CONSTRUCTIVOS Y COSTOS I | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE EMPRESAS CONSTRUCTORAS | integral | contexto: formación integral fuera del núcleo de negocios |
| PROYECTO EJECUTIVO I | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| PROCEDIMIENTOS CONSTRUCTIVOS Y COSTOS II | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE OBRA | integral | contexto: formación integral fuera del núcleo de negocios |
| INSTALACIONES ESPECIALES, INSTALACIONES BIOCIMATICAS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| PROYECTO EJECUTIVO II | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| PROYECTO EJECUTIVO III | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| LEGISLACION EN LA CONSTRUCCION | integral | contexto: formación integral fuera del núcleo de negocios |
| PROYECTO EJECUTIVO IV | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| LEGISLACION, CONCURSOS Y CONTRATACION DE OBRA | integral | contexto: formación integral fuera del núcleo de negocios |
| ECONOMIA PARA LA ARQUITECTURA | integral | contexto: formación integral fuera del núcleo de negocios |
| COSTOS Y PRESUPUESTO EN LA EDIFICACION | integral | contexto: formación integral fuera del núcleo de negocios |
| INSTALACIONES ESPECIALES Y TECNOLOGIA | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| LEGISLACION, CONCURSOS Y CONTRATACION DE OBRA PUBLICA | integral | contexto: formación integral fuera del núcleo de negocios |
| LEGISLACION DE LA CONSTRUCCION | integral | contexto: formación integral fuera del núcleo de negocios |
| COMPOSICION GRAFICA | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| PLANIFICACION URBANA | integral | contexto: formación integral fuera del núcleo de negocios |
| NORMATIVIDAD DE LA LEY DE OBRA PUBLICA | integral | contexto: formación integral fuera del núcleo de negocios |
| INSTALACIONES DE COMUNICACION Y CLIMATIZACION | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| PRESENTACION DE PROYECTOS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| TECNICAS DE INVESTIGACION PARA LA REPRESENTACION GRAFICA | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION Y GESTION URBANA | integral | contexto: formación integral fuera del núcleo de negocios |
| MANEJO Y GESTION DE AREAS VERDES | integral | contexto: formación integral fuera del núcleo de negocios |
| GERENCIA DE PROYECTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| CONCURSOS DE PROYECTOS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| SOFTWARE APLICADO A PRESUPUESTO EN OBRA | integral | contexto: formación integral fuera del núcleo de negocios |
| VALUACION INMOBILIARIA | civil | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.12. mapa-curricular-ib-upiita

Unidades académicas: UPIITA. Año del plan: 2009. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-ib-upiita.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 10 | ALGEBRA LINEAL; CÁLCULO DIFERENCIAL E INTEGRAL; CÁLCULO VECTORIAL; FUNDAMENTOS DE FÍSICA PARA LA INGENIERÍA; BIOESTADÍSTICA; ECUACIONES DIFERENCIALES |
| comp: Computación | 2 | PROGRAMACIÓN ORIENTADA A OBJETOS; HERRAMIENTAS COMPUTACIONALES |
| datos: Ciencia de datos e IA | 4 | PROCESAMIENTO DE IMÁGENES; RECONOCIMIENTO DE PATRONES; VISIÓN ARTIFICIAL; INTELIGENCIA ARTIFICIAL |
| elec: Electrónica | 10 | FUNDAMENTOS DE TEORÍA ELECTROMAGNÉTICA; ONDAS ELECTROMAGNÉTICAS Y SISTEMAS RADIANTES; TEORÍA DE LOS CIRCUITOS; DISPOSITIVOS ELECTRÓNICOS; ELECTRÓNICA ANALÓGICA Y DE POTENCIA; ELECTRÓNICA DIGITAL |
| ctrl: Control y automatización | 13 | SENSORES Y ACTUADORES; TEORÍA DEL CONTROL; BIOINSTRUMENTACIÓN; CONTROL NEURODIFUSO; MODELADO Y CONTROL DE SISTEMAS BIÓNICOS; BIOROBÓTICA |
| bio: Ciencias biológicas | 4 | BIOLOGÍA CELULAR; BIOQUÍMICA; BIOLOGÍA MOLECULAR; BIÖGNOSIS |
| quim: Química | 2 | QUÍMICA ORGÁNICA; FISICOQUÍMICA |
| integral: Humanidades y gestión | 7 | BIOÉTICA; INGLÉS I; LIDERAZGO Y EMPRENDEDORES; INGLÉS II; INGLÉS III; NORMATIVIDAD Y GESTIÓN TECNOLÓGICA |
| prof: Práctica profesional | 4 | INVESTIGACIÓN Y DESARROLLO DE PROYECTOS; METODOLOGÍA DE LA INVESTIGACIÓN; TRABAJO TERMINAL I; TRABAJO TERMINAL II |
| esp: Especialidad | 7 | ELECTIVA I; ELECTIVA II; OPTATIVA 1; OPTATIVA 2; OPTATIVA 3; ELECTIVA III |
| mec: Mecánica y materiales | 8 | METROLOGÍA; BIOMATERIALES; MECANISMOS BIOMIMÉTICOS; ANÁLISIS DE ESFUERZOS; MANUFACTURA DE ELEMENTOS BIOMIMÉTICOS; BIOMECÁNICA |
| amb: Ambiente y energía | 1 | DESARROLLO SOSTENIBLE |
| ind: Operaciones y logística | 2 | SISTEMAS DE GESTIÓN DE CALIDAD; ERGONOMÍA Y BIODINÁMICA |
| salud: Ciencias de la salud | 5 | ANATOMÍA; FISIOLOGÍA; INSTRUMENTACIÓN BIOMÉDICA; TELEMETRÍA MÉDICA; IMAGENOLOGÍA |
| clin: Práctica clínica | 2 | PRÓTESIS BIOMÍMÉTICAS; INSTRUMENTACIÓN CLÍNICA Y LABORATORIO |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| BIOQUIMICA | bio | excepción: Área biológica del catálogo vigente |
| BIOGNOSIS | bio | excepción: Fundamentos de sistemas biológicos; revisar término en el mapa |
| LIDERAZGO Y EMPRENDEDORES | integral | contexto: formación integral fuera del núcleo de negocios |
| NORMATIVIDAD Y GESTION TECNOLOGICA | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.13. mapa-curricular-ibiotecnologica-upibi-upiip-upiit--283-29--281-29--281-29

Unidades académicas: UPIBI, UPIIP, UPIIIT, UPIIIP, UPIIIG. Año del plan: 2024. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-ibiotecnologica-upibi-upiip-upiit--283-29--281-29--281-29.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 16 | CÁLCULO DIFERENCIAL E INTEGRAL; FISICA DEL MOVIMIENTO; ALGEBRA VECTORIAL; ESTADÍSTICA; APLICACIONES MATEMÁTICAS (TALLER); ECUACIONES DIFERENCIALES |
| comp: Computación | 2 | PROGRAMACIÓN (TALLER); PROGRAMACIÓN ** |
| ctrl: Control y automatización | 2 | DINÁMICA Y CONTROL DE BIOPROCESOS; DINAMICA Y CONTROL DE PROCESOS |
| bio: Ciencias biológicas | 32 | BIOLOGÍA CELULAR; LABORATORIO DE TÉCNICAS MICROBIOLÓGICAS; LABORATORIO DE BIOINGENIERÍA; INGENIERÍA ENZIMÁTICA; LABORATORIO DE BIOTECNOLOGÍA MOLECULAR; BIOTECNOLOGÍA DE LA RESPUESTA INMUNE |
| quim: Química | 8 | QUÍMICA GENERAL; QUÍMICA ORGÁNICA; LABORATORIO DE QUIMICA GENERAL; QUIMICA GENERAL **; QUIMICA ORGANICA **; METODOS ANALÍTICOS E INSTRUMENTALES |
| proc: Ingeniería de procesos | 20 | TERMODINÁMICA I; LABORATORIO DE BIORREACTORES; TERMODINÁMICA II; LABORATORIO DE BIOSEPARACIÓNES; PROCESOS DE TRANSFERENCIA DE CALOR; BIOSEPARACIONES FLUIDO-FLUIDO |
| integral: Humanidades y gestión | 25 | BIOTECNOLOGÍA Y SOCIEDAD; COMUNICACIÓN Y SISTEMAS DE INFORMACIÓN (TALLER); INGLÉS I; PLANEACIÓN; INGLÉS II; RELACIONES LABORALES |
| prof: Práctica profesional | 3 | ESTANCIA DE TITULACIÓN; ESTANCIA PROFESIONAL I; ESTANCIA PROFESIONAL II |
| esp: Especialidad | 10 | OPTATIVA I; OPTATIVA II; ELECTIVA I; ELECTIVA II; ELECTIVA III; ELECTIVA + |
| mec: Mecánica y materiales | 4 | ELECTROMECÁNICA DE PROCESOS; MECÁNICA DE FLUIDOS Y SÓLIDOS; MECANICA DE FLUIDOS Y SOLIDOS; ELECTROMECANICA DE PROCESOS |
| amb: Ambiente y energía | 7 | FISICA DE LA ENERGÍA; BALANCE DE MATERÍA Y ENERGÍA; PROTECCIÓN AMBIENTAL; FÍSICA DE LA ENERGÍA; LABORATORIO DE FISICA DE LA ENERGÍA; BALANCE DE MATERIA Y ENERGÍA |
| ind: Operaciones y logística | 11 | FENÒMENOS DE TRANSPORTE; ADMINISTRACIÓN DE LA PRODUCCIÓN; SISTEMAS DE CALIDAD; TECNOLOGÍAS DE LA PRODUCCIÓN DE BIOMOLÉCULAS; FENOMENOS DE TRANSPORTE; ADMINISTRACION DE LA PRODUCCION |
| salud: Ciencias de la salud | 1 | FISIOLOGÍA CELULAR |
| clin: Práctica clínica | 1 | OPTATIVA I Obtención y producción de sueros, vacunas y reactivos de diagnóstico |
| sin_categoria: Sin categoría | 2 | TÓPICOS SELECTOS DE DISEÑO I; TÓPICOS SELECTOS DE DISEÑO II |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| PLANEACION | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE PROYECTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| BIOQUIMICA | bio | excepción: Área biológica del catálogo vigente |
| PLANEACION ESTRATEGICA | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION, ORGANIZACION Y DIRECCION EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| QUALITY MANAGEMENT SYSTEM * | ind | excepción: Sistemas de gestión de calidad |
| PROJECT MANAGEMENT * | integral | excepción: Gestión de proyectos en ingeniería biotecnológica |
| GESTION DE RECURSOS MATERIALES Y HUMANOS OPTATIVA I FINANZAS PARA INGENIEROS | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA II MERCADOTECNIA | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA IV GESTION DE PROYECTOS DE INVERSION | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA III LEGISLACION INDUSTRIAL | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.14. mapa-curricular-ibiotecnologica-upiig

Unidades académicas: UPIIG, UPIBI, UPIIIT, UPIIIP, UPIIIG, UPIIT, UPIIP. Año del plan: 2023. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-ibiotecnologica-upiig.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 15 | CÁLCULO DIFERENCIAL E INTEGRAL; FISICA DEL MOVIMIENTO; ALGEBRA VECTORIAL; ESTADISTICA; APLICACIONES MATEMATICAS (TALLER); ECUACIONES DIFERENCIALES |
| comp: Computación | 2 | PROGRAMACIÓN (TALLER); PROGRAMACIÓN |
| ctrl: Control y automatización | 2 | DINÁMICA Y CONTROL DE BIOPROCESOS; DINÁMICA Y CONTROL E INSTRUMENTACIÓN |
| bio: Ciencias biológicas | 29 | BIOLOGÍA CELULAR; LABORATORIO DE TÉCNICAS MICROBIOLÓGICAS; LABORATORIO DE BIOINGENIERÍA; INGENIERÍA ENZIMÁTICA; LABORATORIO DE BIOTECNOLOGÍA MOLECULAR; BIOTECNOLOGÍA DE LA RESPUESTA INMUNE |
| quim: Química | 6 | QUÍMICA GENERAL; QUÍMICA ORGÁNICA; METODOS ANALÍTICOS E INSTRUMENTALES; FISICOQUÍMICA |
| proc: Ingeniería de procesos | 21 | TERMODINÁMICA I; LABORATORIO DE BIORREACTORES; TERMODINÁMICA II; LABORATORIO DE BIOSEPARACIÓNES; PROCESOS DE TRANSFERENCIA DE CALOR; BIOTEPARACIONES FLUIDO-FLUIDO |
| integral: Humanidades y gestión | 20 | BIOTECNOLOGÍA Y SOCIEDAD; COMUNICACIÓN Y SISTEMAS DE INFORMACIÓN (TALLER); INGLES I; PLANEACIÓN; INGLÉS II; RELACIONES LABORALES |
| prof: Práctica profesional | 2 | ESTANCIA DE TITULACIÓN; ESTANCIA PROFESIONAL |
| esp: Especialidad | 8 | OPTATIVA I; OPTATIVA II; ELECTIVA I; ELECTIVA II; ELECTIVA III; ELECTIVA ( DEL 1 AL 8) |
| mec: Mecánica y materiales | 4 | ELECTROMECANÍA DE PROCESOS; MECÁNICA DE FLUIDOS Y SOLIDOS; ELECTROMECÁNICA DE PROCESOS |
| amb: Ambiente y energía | 7 | FISICA DE LA ENERGÍA; BALANCE DE MATERIA Y ENERGÍA; PROTECCIÓN AMBIENTAL; PROTECCIÓN AMBIENTAL Y DESARROLLO SOSTENIBLE; BIOTECNOLOGÍA AMBIENTAL |
| ind: Operaciones y logística | 8 | FENÓMENOS DE TRANSPORTE; ADMINISTRACIÓN DE LA PRODUCCIÓN; SISTEMAS DE CALIDAD; TECNOLOGÍAS DE LA PRODUcción DE BIOMOLÉCULAS; FENOMENOS DE TRANSPORTE; SISTEMAS DE GESTIÓN DE CALIDAD (QUALITY MANAGEMENT SYSTEM)* |
| salud: Ciencias de la salud | 1 | FISIOLOGÍA CELULAR |
| sin_categoria: Sin categoría | 2 | TÓPICOS SELECTOS DE DISEÑO I; TÓPICOS SELECTOS DE DISEÑO II |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| PLANEACION | integral | contexto: formación integral fuera del núcleo de negocios |
| ELECTROMECANIA DE PROCESOS | mec | excepción: Lectura OCR de electromecánica; verificar original |
| ADMINISTRACION DE PROYECTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION ESTRATEGICA | integral | contexto: formación integral fuera del núcleo de negocios |
| BIOQUIMICA | bio | excepción: Área biológica del catálogo vigente |
| GESTION, ORGANIZACION Y DIRECCION EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE PROYECTOS (PROJECT MANAGEMENT) * | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.15. mapa-curricular-ibm-upibi

Unidades académicas: UPIBI, TALLER. Año del plan: 2006. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-ibm-upibi.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 7 | CÁLCULO DIFERENCIAL E INTEGRAL; FÍSICA DEL MOVIMIENTO APLICADA; ALGEBRA VECTORIAL; ESTADÍSTICA; APLICACIONES MATEMÁTICAS (TALLER); ECUACIONES DIFERENCIALES |
| comp: Computación | 1 | PROGRAMACIÓN (TALLER) |
| elec: Electrónica | 10 | ANÁLISIS DE CIRCUITOS; INGENIERÍA ELÉCTRICA; SISTEMAS DIGITALES I; ELECTRÓNICA I; SISTEMAS DIGITALES II; ELECTRÓNICA II |
| ctrl: Control y automatización | 10 | INSTRUMENTACIÓN Y CONTROL; SISTEMAS DINÁMICOS I; BIOINSTRUMENTACIÓN I; BIOINSTRUMENTACIÓN II; BIOINSTRUMENTACIÓN III; BIOINSTRUMENTACIÓN IV |
| redes: Telecomunicaciones | 1 | REDES Y TELECOMUNICACIONES |
| bio: Ciencias biológicas | 1 | BIOLOGÍA CELULAR |
| quim: Química | 4 | QUÍMICA GENERAL APLICADA; QUÍMICA ORGÁNICA APLICADA; ELECTROQUÍMICA I; ELECTROQUÍMICA II |
| integral: Humanidades y gestión | 14 | BIOTECNOLOGÍA Y SOCIEDAD; COMUNICACIÓN Y SISTEMAS DE INFORMACIÓN (TALLER); INGLES I; INGLÉS II; RELACIONES LABORALES; ÉTICA (TALLER) |
| prof: Práctica profesional | 3 | PROYECTO TERMINAL I; PROYECTO TERMINAL II; PROYECTO TERMINAL III |
| esp: Especialidad | 5 | OPTATIVA I; OPTATIVA II; ELECTIVA I; OPTATIVA III; ELECTIVA II |
| mec: Mecánica y materiales | 3 | BIOMATERIALES; PROCESOS DE MANUFACTURA; METROLOGÍA |
| civil: Construcción y tierra | 2 | HIDRÁULICA Y NEUMÁTICA; ARQUITECTURA PARA HOSPITALES |
| amb: Ambiente y energía | 1 | FÍSICA DE LA ENERGÍA APLICADA |
| ind: Operaciones y logística | 1 | SISTEMAS DE CALIDAD |
| salud: Ciencias de la salud | 11 | MORFOLOGÍA; FISIOLOGÍA Y BIOFÍSICA I; FISIOLOGÍA Y BIOFÍSICA II; FISIOPATOLOGÍA I; FISIOPATOLOGÍA II; INFORMATÍCA MÉDICA (TALLER) |
| clin: Práctica clínica | 3 | BIOQUÍMICA CLÍNICA; TECNOLOGÍA CLÍNICA; TECNOLOGÍA CLÍNICA AMBIENTAL |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ADMINISTRACION DE TECNOLOGIAS EN SALUD | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE LA CONSERVACION HOSPITALARIA (TALLER) | integral | contexto: formación integral fuera del núcleo de negocios |
| TOPICOS SELECTOS DE MINIMIZACION DE RUIDO | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| ECONOMIA DE LA SALUD | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| MERCADOTECNIA | integral | contexto: formación integral fuera del núcleo de negocios |
| SISTEMAS DE GESTION EN SALUD | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.16. mapa-curricular-ibq-encb

Unidades académicas: ENCB. Año del plan: 2019. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-ibq-encb.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 6 | FISICA GENERAL; CALCULO DIFERENCIAL E INTEGRAL; CALCULO VECTORIAL; BIOESTADISTICA; ECUACIONES DIFERENCIALES *; METODOS NUMERICOS |
| comp: Computación | 1 | BIOINFORMÁTICA* |
| datos: Ciencia de datos e IA | 1 | QUÍMICA ANALITICA |
| ctrl: Control y automatización | 2 | INSTRUMENTACIÓN INDUSTRIAL; CONTROL AUTOMATICO DE PROCESOS |
| bio: Ciencias biológicas | 10 | BIOLOGÍA CELULAR Y ECOSISTEMAS *; FISICA PARA INGENIERÍA BIOQUÍMICA; BIOQUÍMICA; MICROBIOLOGIA; BIOQUÍMICA Y METABOLISMO MICROBIANO; MICROBIOLOGÍA DE BIOPROCESOS |
| quim: Química | 6 | QUÍMICA INORGANICA; PRINCIPIOS DE FISICOQUÍMICA; QUÍMICA ORGÁNICA; FISICOQUÍMICA APLICADA A LA INGENIERÍA; QUÍMICA ORGÁNICA DE BIOCOMPUESTOS *; METODOS DE ANALISIS |
| proc: Ingeniería de procesos | 19 | INGENIERÍA TERMODINAMICA; OPERACIONES DE TRANSFERENCIA DE MOMENTO; QUÍMICA DE ALIMENTOS DE ORIGEN AGRÍCOLA; OPERACIONES DE TRANSFERENCIA DE CALOR; QUÍMICA DE ALIMENTOS DE ORIGEN PECUARIO; INGENIERÍA DE BIORREACCIÓN |
| integral: Humanidades y gestión | 5 | BIOETICA *; PROCESOS DE COMUNICACIÓN *; ENTORNO SOCIOECONOMICO DE MÉXICO; ADMINISTRACIÓN DE LAS OPERACIONES INDUSTRIALES; DESARROLLO ORGANIZACIONAL * |
| prof: Práctica profesional | 2 | PROYECTO DE INVESTIGACIÓN; INGENIERIA DE PROYECTOS |
| esp: Especialidad | 2 | OPTATIVA I; OPTATIVA II |
| mec: Mecánica y materiales | 1 | INGENIERIA ELECTROMECÁNICA |
| amb: Ambiente y energía | 3 | BALANCE DE MATERIA Y ENERGÍA; SISTEMAS SUSTENTABLES; BIOINGENIERIA AMBIENTAL * |
| ind: Operaciones y logística | 2 | SISTEMAS DE GESTIÓN DE CALIDAD EN LA INDUSTRIA ALIMENTARIA; HIGIENE Y SEGURIDAD DE PROCESOS |
| salud: Ciencias de la salud | 2 | TOXICOLOGÍA DE PRODUCTOS BIOLÓGICOS *; NUTRICIÓN E INTEGRACIÓN METABÓLICA * |
| sin_categoria: Sin categoría | 5 | TRAYECTORIA |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| BIOQUIMICA | bio | excepción: Área biológica del catálogo vigente |
| METODOS DE ANALISIS | quim | contexto: título ambiguo interpretado según la disciplina del plan |
| ENTORNO SOCIOECONOMICO DE MEXICO | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE LAS OPERACIONES INDUSTRIALES | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO ORGANIZACIONAL * | integral | contexto: formación integral fuera del núcleo de negocios |
| ADITIVOS EN LA INDUSTRIA ALIMENTARIA* | proc | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.17. mapa-curricular-ic-esime-uc

Unidades académicas: ESIME. Año del plan: 2003. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-ic-esime-uc.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 12 | CÁLCULO DIFERENCIAL E INTEGRAL; FÍSICA CLÁSICA; FUNDAMENTOS DE ÁLGEBRA; ÁLGEBRA LINEAL; CÁLCULO VECTORIAL; ELECTRICIDAD Y MAGNETISMO |
| comp: Computación | 21 | FUNDAMENTOS DE PROGRAMACIÓN; PROGRAMACIÓN ORIENTADA A OBJETOS; ESTRUCTURA DE DATOS; LENGUAJES DE BAJO NIVEL; ANÁLISIS DE ALGORITMOS; COMPILADORES |
| datos: Ciencia de datos e IA | 3 | BASES DE DATOS; INTELIGENCIA ARTIFICIAL; SISTEMAS EXPERTOS |
| elec: Electrónica | 6 | CIRCUITOS DE CA Y CD; CIRCUITOS LÓGICOS I; CIRCUITOS LÓGICOS II; ELECTRÓNICA ANALÓGICA; ANÁLISIS DE SEÑALES ANALÓGICAS; ARQUITECTURA DE COMPUTADORAS |
| ctrl: Control y automatización | 3 | TEORÍA DE AUTÓMATAS; TEORÍA DE CONTROL ANALÓGICO; TEORÍA DE CONTROL DIGITAL |
| redes: Telecomunicaciones | 3 | MODULACIÓN DIGITAL; REDES DE COMPUTADORAS; SISTEMAS DISTRIBUIDOS |
| quim: Química | 1 | QUÍMICA BÁSICA |
| integral: Humanidades y gestión | 8 | HUMANIDADES I: INGENIERÍA, CIENCIA Y SOCIEDAD; HUMANIDADES II: LA COMUNICACIÓN Y LA INGENIERÍA; HUMANIDADES III: DESARROLLO HUMANO; HUMANIDADES IV: DESARROLLO PERSONAL Y PROFESIONAL; HUMANIDADES V: EL HUMANISMO FRENTE A LA GLOBALIZACIÓN; ORGANIZACIÓN DE COMPUTADORAS |
| prof: Práctica profesional | 2 | METODOLOGÍA DE LA INVESTIGACIÓN O TÓPICOS SELECTOS DE INGENIERÍA I; PROYECTO DE INGENIERÍA O TÓPICOS SELECTOS DE INGENIERÍA II |
| esp: Especialidad | 3 | OPTATIVA I; OPTATIVA II; OPTATIVA III |
| civil: Construcción y tierra | 2 | LENGUAJES PARA ARQUITECTURA EN PARALELO |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| ORGANIZACION DE COMPUTADORAS | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION EN LA INGENIERIA | integral | contexto: formación integral fuera del núcleo de negocios |
| PROYECTO DE INGENIERIA O TOPICOS SELECTOS DE INGENIERIA II | prof | contexto: proyecto de integración profesional en ingeniería; confirmar alternativa de tópicos |
| TRANSFERENCIA Y PROCESAMIENTO DE LA INFORMACION I | comp | contexto: título ambiguo interpretado según la disciplina del plan |
| TRANSFERENCIA Y PROCESAMIENTO DE LA INFORMACION II | comp | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.18. mapa-curricular-icivil-esia-uzac-upiip

Unidades académicas: ESIA, UPIIP. Año del plan: 2023. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-icivil-esia-uzac-upiip.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 11 | FÍSICA; MATEMÁTICAS II; FÍSICA 3.0 1.5 4.5 7.5 MATEMÁTICAS II; Fisica; Cálculo diferencial e integral; Algebra lineal |
| comp: Computación | 5 | HERRAMIENTAS COMPUTACIONALES 1.5 3.0 4.5 6.0 QUÍMICA BÁSICA Y APLICADA; Herramientas computacionales en la ingeniería **; Fundamentos de programación estructurada **; DESARROLLO DE APLICACIONES INFORMÁTICAS (1); SISTEMAS DE INFORMACIÓN (1) |
| quim: Química | 1 | Química básica y aplicada ** |
| integral: Humanidades y gestión | 18 | RELACIONES HUMANAS 3.0 0.0 3.0 6.0 TRANSPORTE E INGENIERÍA DE TRÁNSITO; C SEMESTRE IV T P T/H C ECONOMÍA 3.0 0.0 3.0 6.0 ESTRUCTURAS ISOSTÁTICAS; MECÁNICA DE SUELOS II 3.5 1.0 4.5 8.0 ESTRUCTURA Y DESARROLLO DE MÉXICO; C SEMESTRE VIII T P T/H C AGUA POTABLE 4.5 1.5 6.0 10.5 ADMINISTRACIÓN; PLANEACIÓN; Desarrollo humano integral ** |
| prof: Práctica profesional | 3 | METODOLOGÍA DE LA INVESTIGACIÓN 3.0 0.0 3.0 6.0 OPTATIVA III; Metodología de la investigación ** |
| esp: Especialidad | 5 | OPTATIVA I; Optativa I; Optativa II; Optativa III; Electiva |
| mec: Mecánica y materiales | 11 | DINÁMICA DE LA PARTÍCULA; MATEMÁTICAS III 4.5 0.0 4.5 9.0 MECÁNICA DE SUELOS I; RESISTENCIA DE MATERIALES 4.5 0.0 4.5 9.0 INGENIERÍA DE SISTEMAS I; Dinámica **; Estática **; Mecánica de materiales I ** |
| civil: Construcción y tierra | 71 | EXPRESIÓN GRAFICA I; GEOLOGÍA 3.0 1.5 4.5 7.5 PROGRAMACIÓN; ESTÁTICA 4.5 0.0 4.5 9.0 GEOMÁTICA; EXPRESIÓN GRÁFICA II 1.5 3.0 4.5 6.0 HIDRÁULICA BÁSICA; TOPOGRAFÍA 4.5 4.5 9.0 13.5 PROCEDIMIENTOS CONSTRUCTIVOS I; C SEMESTRE VI T P T/H C MATEMÁTICAS V 4.5 0.0 4.5 9.0 CAMINOS Y FERROCARRILES |
| amb: Ambiente y energía | 6 | INGENIERÍA SANITARIA Y AMBIENTAL 3.0 1.5 4.5 7.5 MATEMÁTICAS IV; Ingeniería sanitaria y ambiental; FUNDAMENTOS DE POTABILIZACIÓN Y TRATAMIENTO DE AGUA (4); RESIDUOS PELIGROSOS (4); GENERACIÓN DE ENERGÍA HIDROELÉCTRICA (3); INGENIERÍA DE PLANTAS POTABILIZADORAS (4) |
| ind: Operaciones y logística | 6 | Transporte e ingeniería de tránsito; CALIDAD DEL AGUA Y CONTAMINACIÓN DE CUERPOS DE AGUA (4); CONTROL DE CALIDAD DE MATERIALES NATURALES Y ARTIFICIALES (7); INGENIERÍA DE TRÁNSITO (6); INGENIERÍA DE TRANSPORTE (6) |
| soc: Ciencias sociales | 1 | MATEMÁTICAS I 4.5 0.0 4.5 9.0 SOCIOLOGÍA |
| sin_categoria: Sin categoría | 7 | TOTAL 16.5 9.0 25.5 42.0 T O T A L; TOTAL 21.0 9.0 30.0 51.0 T O T A L; TOTAL 23.0 4.0 27.0 50.0 T O T A L; TOTAL 22.5 6.0 28.5 51.0 T O T A L; TOTAL 22.5 3.0 25.5 48.0 T O T A L; Ingeniería de sistemas |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| EXPRESION GRAFICA I | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| C SEMESTRE IV T P T/H C ECONOMIA 3.0 0.0 3.0 6.0 ESTRUCTURAS ISOSTATICAS | integral | contexto: formación integral fuera del núcleo de negocios |
| EXPRESION GRAFICA II 1.5 3.0 4.5 6.0 HIDRAULICA BASICA | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| C SEMESTRE VIII T P T/H C AGUA POTABLE 4.5 1.5 6.0 10.5 ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION | integral | contexto: formación integral fuera del núcleo de negocios |
| ECONOMIA PARA INGENIEROS ** | integral | contexto: formación integral fuera del núcleo de negocios |
| FUNDAMENTOS DE ADMINISTRACION ** | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE OBRA | integral | contexto: formación integral fuera del núcleo de negocios |
| FORMULACION DE PROYECTOS DE INVERSION (1) | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANIFICACION URBANA (6) | integral | contexto: formación integral fuera del núcleo de negocios |
| NORMATIVIDAD DE LA OBRA PUBLICA Y TIPOS DE LICITACIONES (7) | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE OBRAS CIVILES (1) | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA DE PLANTAS DE TRATAMIENTO (4) | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| OPERACION, MANTENIMIENTO Y ADMINISTRACION DE SERVICIOS MUNICIPALES (4) | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.19. mapa-curricular-icomunicacionesyelectronica-esime-uzac-uc

Unidades académicas: ESIME. Año del plan: 2024. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-icomunicacionesyelectronica-esime-uzac-uc.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 28 | CÁLCULO DIFERENCIAL E INTEGRAL; FUNDAMENTOS DE ÁLGEBRA; FÍSICA CLÁSICA; CÁLCULO VECTORIAL; ECUACIONES DIFERENCIALES; ELECTRICIDAD Y MAGNETISMO |
| comp: Computación | 12 | FUNDAMENTOS DE PROGRAMACIÓN; PROGRAMACIÓN ORIENTADA A OBJETOS; SISTEMAS DE INFORMACIÓN WEB; LENGUAJE DE DESCRIPCIÓN DE HARDWARE; PROGRAMACIÓN DE DISPOSITIVOS INTELIGENTES; CÓMPUTO EN LA NUBE |
| datos: Ciencia de datos e IA | 8 | ESTRUCTURAS Y BASE DE DATOS; ANÁLISIS DE DATOS; SISTEMAS INTELIGENTES; VISIÓN ARTIFICIAL; RECONOCIMIENTO Y SÍNTESIS DE VOZ; PROCESAMIENTO DE GRANDES VOLÚMENES DE DATOS |
| elec: Electrónica | 30 | CAMPOS Y ONDAS ELECTROMAGNÉTICAS; CIRCUITOS DE CA Y CD; ONDAS ELECTROMAGNÉTICAS GUIADAS; TEOREMAS DE CIRCUITOS ELÉCTRICOS; CIRCUITOS DIGITALES; DISPOSITIVOS |
| ctrl: Control y automatización | 30 | MEDICIONES; ESPACIO DE ESTADOS; MICROCONTROLADORES; MEDICIONES ELÉCTRICAS; CONTROL CLÁSICO; CONTROL MODERNO |
| redes: Telecomunicaciones | 31 | COMUNICACIONES DIGITALES; COMUNICACIONES ANALÓGICAS; REDES BÁSICAS; INTRODUCIÓN A LOS SISTEMAS DE COMUNICACIONES; ANTENAS; INGENIERÍA DEL SONIDO |
| quim: Química | 4 | QUÍMICA BÁSICA; QUÍMICA APLICADA; QUÍMICA DE LOS MATERIALES |
| integral: Humanidades y gestión | 20 | HUMANIDADES I: INGENIERÍA, CIENCIA Y SOCIEDAD; HUMANIDADES II: LA COMUNICACIÓN Y LA INGENIERÍA; ECONOMÍA; ADMINISTRACIÓN; GENERACIÓN Y EVALUACIÓN DE PROYECTOS; HUMANIDADES III: DESARROLLO HUMANO |
| prof: Práctica profesional | 2 | DESARROLLO PROSPECTIVO DE PROYECTOS Ô TÓPICOS SELECTOS DE INGENIERÍA I; PROYECTOS DE INGENIERÍA Ô TÓPICOS SELECTOS DE INGENIERÍA II |
| esp: Especialidad | 10 | OPTATIVA; OPTATIVA I; OPTATIVA II; OPTATIVA III; OPTATIVA IV; OPTATIVA V |
| mec: Mecánica y materiales | 6 | ONDAS MECÁNICAS; MECÁNICA CUÁNTICA Y ESTADÍSTICA; MECÁNICA NEWTONIANA; SISTEMAS ELECTROMECÁNICOS; METROLOGÍA ACÚSTICA |
| civil: Construcción y tierra | 2 | ACÚSTICA ARQUITECTÓNICA; ACÚSTICA ARQUITECTURAL |
| amb: Ambiente y energía | 2 | SISTEMAS DE CONVERSIÓN DE LA ENERGÍA ELECTRÓNICA I; SISTEMAS DE CONVERSIÓN DE LA ENERGÍA ELECTRÓNICA II |
| ind: Operaciones y logística | 3 | ANÁLISIS DE TRANSITORIOS; CIRCUITOS ELÉCTRICOS EN ESTADO TRANSITORIO; CALIDAD EN LA INGENIERÍA |
| salud: Ciencias de la salud | 1 | ACÚSTICA DE EQUIPOS MÉDICOS |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| ECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| DISPOSITIVOS | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE EMPRESAS | integral | contexto: formación integral fuera del núcleo de negocios |
| PROYECTOS DE INVERSION | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO PROSPECTIVO DE PROYECTOS O TOPICOS SELECTOS DE INGENIERIA I | prof | contexto: proyecto de integración profesional en ingeniería; confirmar alternativa de tópicos |
| PROYECTOS DE INGENIERIA O TOPICOS SELECTOS DE INGENIERIA II | prof | contexto: proyecto de integración profesional en ingeniería; confirmar alternativa de tópicos |
| SINTETIZADORES MUSICALES | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| CIBERSEGURIDAD EN REDES EMPRESARIALES | integral | contexto: formación integral fuera del núcleo de negocios |
| RUIDO Y VIBRACIONES | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| DISENO Y ADMINISTRACION DE REDES | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.20. mapa-curricular-icontrolyautomatizacion-esime-uzac-upiiap-upiic

Unidades académicas: ESIME, UPIIC, UPIIAP. Año del plan: 2003. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-icontrolyautomatizacion-esime-uzac-upiiap-upiic.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 10 | CÁLCULO DIFERENCIAL E INTEGRAL; FÍSICA CLÁSICA; FUNDAMENTOS DE ÁLGEBRA; CÁLCULO VECTORIAL; ECUACIONES DIFERENCIALES; ELECTRICIDAD Y MAGNETISMO |
| comp: Computación | 3 | FUNDAMENTOS DE PROGRAMACIÓN; PROGRAMACIÓN ORIENTADA A OBJETOS; INTERFASES Y MICROCONTROLADORES |
| elec: Electrónica | 9 | TEORÍA DE LOS CIRCUITOS I; CIRCUITOS LÓGICOS; ELECTRÓNICA I; TEORÍA DE LOS CIRCUITOS II; ELECTRÓNICA OPERACIONAL; MÁQUINAS ELÉCTRICAS I |
| ctrl: Control y automatización | 8 | MODELADO DE SISTEMAS; ELEMENTOS PRIMARIOS DE MEDICIÓN; TEORÍA DE CONTROL I; ELEMENTOS DE TRANSMISIÓN Y CONTROL; TEORÍA DE CONTROL II; INSTRUMENTOS ANALÍTICOS DE MEDICIÓN |
| redes: Telecomunicaciones | 1 | COMUNICACIONES INDUSTRIALES |
| quim: Química | 2 | QUÍMICA BÁSICA; QUÍMICA APLICADA |
| proc: Ingeniería de procesos | 1 | OPERACIONES DE SEPARACIÓN |
| integral: Humanidades y gestión | 9 | HUMANIDADES I: INGENIERÍA, CIENCIA Y SOCIEDAD; HUMANIDADES II: LA COMUNICACIÓN Y LA INGENIERÍA; PRÁCTICAS DE DAC --- ECONOMÍA; HUMANIDADES III: DESARROLLO HUMANO; INGENIERÍA ECONÓMICA; GENERACIÓN Y EVALUACIÓN DE PROYECTOS |
| prof: Práctica profesional | 2 | METODOLOGÍA DE LA INVESTIGACIÓN; PROYECTO DE INGENIERÍA O TÓPICOS SELECTOS DE INGENIERÍA II --- |
| mec: Mecánica y materiales | 1 | TECNOLOGÍA DE MECANISMOS |
| ind: Operaciones y logística | 2 | CALIDAD TOTAL Y PRODUCTIVIDAD; PREPARACIÓN Y TRANSPORTE DE MATERIALES |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| PRACTICAS DE DAC --- ECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION APLICADA | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA II --- PLANEACION E INGENIERIA DE MANTENIMIENTO | integral | contexto: formación integral fuera del núcleo de negocios |
| PROYECTO DE INGENIERIA O TOPICOS SELECTOS DE INGENIERIA II --- | prof | contexto: proyecto de integración profesional en ingeniería; confirmar alternativa de tópicos |

### 4.21. mapa-curricular-ienergia-upiita

Unidades académicas: UPIITA. Año del plan: 2018. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-ienergia-upiita.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 12 | Cálculo diferencial e integral; Álgebra lineal; Diseño de experimentos; Ecuaciones diferenciales; Cálculo vectorial; Electricidad y magnetismo |
| comp: Computación | 2 | Herramientas computacionales; Programación avanzada |
| elec: Electrónica | 4 | Circuitos eléctricos; Teoría electromagnética; Electrónica de potencia; Integración a la red eléctrica y sistemas aislados |
| ctrl: Control y automatización | 1 | Sistemas de control |
| quim: Química | 3 | Química inorgánica; Estructura de la materia; Química orgánica |
| proc: Ingeniería de procesos | 2 | Termodinámica; Transferencia de calor |
| integral: Humanidades y gestión | 7 | Comunicación oral y escrita; Ética y responsabilidad social; Solución de problemas y creatividad; Normatividad y política energética; Economía, recursos y necesidades energéticas de México; Emprendimiento y liderazgo |
| prof: Práctica profesional | 2 | Metodología de la investigación; Trabajo terminal I |
| esp: Especialidad | 2 | Optativa I; Optativa II |
| mec: Mecánica y materiales | 3 | Mecánica; Procesos de manufactura; Mecánica de fluidos |
| civil: Construcción y tierra | 1 | Ingeniería de la energía hidráulica |
| amb: Ambiente y energía | 13 | Energías convencionales y renovables; Balances de materia y energía; Eficiencia energética; Desarrollo sustentable; Ingeniería de la energía nuclear; Generación y co-generación de energía |
| ind: Operaciones y logística | 3 | Conversion y almacenamiento de energía; Fenómenos de transporte; Higiene, seguridad y riesgos industriales |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| NORMATIVIDAD Y POLITICA ENERGETICA | integral | contexto: formación integral fuera del núcleo de negocios |
| ECONOMIA, RECURSOS Y NECESIDADES ENERGETICAS DE MEXICO | integral | contexto: formación integral fuera del núcleo de negocios |
| EMPRENDIMIENTO Y LIDERAZGO | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.22. mapa-curricular-ieninteligenciaartifical-escom-upiic-upiit-upiiz-upiiap

Unidades académicas: ESCOM, UPIIC, UPIIT, UPIIZ, UPIIAP. Año del plan: 2020. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-ieninteligenciaartifical-escom-upiic-upiit-upiiz-upiiap.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 8 | Matemáticas discretas; Cáculo; Mecánica y electromagnetismo; Algebra lineal; Cáculo multivariable; Ecuaciones diferenciales |
| comp: Computación | 10 | Fundamentos de programación; Análisis y diseño de algoritmos; Paradímas de programación; Tecnologías para el desarrollo de aplicaciones web; Análisis y diseño de sistemas; Teoria de la computación |
| datos: Ciencia de datos e IA | 18 | Bases de datos; Fundamentos de inteligencia artificial; Procesamiento digital de imágenes; Aprendizaje de máquina; Visión artificial; Algoritmos bioinspirados |
| elec: Electrónica | 3 | Fundamentos de diseño digital; Diseño de sistemas digitales; Procesamiento de señales |
| ctrl: Control y automatización | 1 | Técnicas de programación para robots móviles |
| integral: Humanidades y gestión | 10 | Fundamentos económicos; Comunicación oral y escrita; Ingeniería, ética y sociedad; Finanzas empresariales; Liderazgo personal; Formulación y evaluación de proyectos informáticos |
| prof: Práctica profesional | 4 | Metodología de la investigación y divulgación científica; Trabajo terminal I; Trabajo terminal II; Estancia profesional |
| esp: Especialidad | 4 | Optativa A; Optativa B; Optativa C; Optativa D |
| civil: Construcción y tierra | 1 | Algoritmos y estructuras de datos |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MECANICA Y ELECTROMAGNETISMO | fm | excepción: Física básica, como en las reglas de ESCOM |
| FUNDAMENTOS ECONOMICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| FINANZAS EMPRESARIALES | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO DE HABILIDADES SOCIALES PARA LA ALTA DIRECCION | integral | contexto: formación integral fuera del núcleo de negocios |
| INNOVACION Y EMPRENDIMIENTO TECNOLOGICO | integral | contexto: formación integral fuera del núcleo de negocios |
| PROPIEDAD INTELECTUAL | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.23. mapa-curricular-if-esime-z

Unidades académicas: No indicada. Año del plan: No indicado en la entrada. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-if-esime-z.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 32 | Algebra lineal; Cáculo de una variable real; Mecánica clásica; Introducción a la fotónica; Ecuaciones diferenciales; Electricidad y magnetismo |
| comp: Computación | 2 | Fundamentos de programación; Programación orientada a objetos |
| elec: Electrónica | 9 | Circuitos de CA y CD; Campos y ondas electromagnéticas; Dispositivos electrónicos; Electrónica I; Optoelectrónica I; Electrónica II |
| redes: Telecomunicaciones | 1 | Teoría de las comunicaciones |
| quim: Química | 3 | Química aplicada; Análisis multivariable aplicado a la espectroscopia |
| proc: Ingeniería de procesos | 1 | Termodinámica y fisica estadística |
| integral: Humanidades y gestión | 10 | Desarrollo humano, social e institucional; Comunicación oral y escrita; Economía y administración; Desarrollo personal y profesional; Gestión tecnológica; Ingeniería económica |
| prof: Práctica profesional | 2 | Trabajo terminal I; Trabajo terminal II |
| esp: Especialidad | 2 | Optativa I; Optativa II |
| mec: Mecánica y materiales | 4 | Estructura de los materiales; Mecánica y estadística cuántica; Introducción a las máquinas herramientas; Optomecánica |
| amb: Ambiente y energía | 2 | Fenómenos y dispositivos fotovoltaicos y fototérmicos |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MECANICA CLASICA | fm | excepción: Física básica |
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| ECONOMIA Y ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION TECNOLOGICA | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| DISENO Y NORMATIVIDAD DE SISTEMAS FOTONICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION Y ADMINISTRACION DE EMPRESAS | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO EMPRENDEDOR Y LIDERAZGO | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.24. mapa-curricular-if-upibi-upiig

Unidades académicas: UPIIIG, UPIBI, TALLER. Año del plan: 2006. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-if-upibi-upiig.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 10 | CÁLCULO DIFERENCIAL E INTEGRAL; FISICA DEL MOVIMIENTO APLICADA; ALGEBRA VECTORIAL; ESTADÍSTICA; APLICACIONES MATEMÁTICAS (TALLER); ECUACIONES DIFERENCIALES |
| comp: Computación | 1 | PROGRAMACIÓN (TALLER) |
| bio: Ciencias biológicas | 5 | BIOLOGÍA CELULAR; BIOTECNOLOGÍA DE CULTIVOS CELULARES; LABORATORIO DE BIOINGENIERÍA; SINTESIS Y ANÁLISIS DE BIOPROCESOS; INGENIERÍA DE PRODUCTOS BIOLÓGICOS |
| quim: Química | 8 | QUIMICA GENERAL APLICADA; QUIMICA BIOORGÁNICA; FISICOQUÍMICA; QUÍMICA HETEROCÍCLICA; MÉTODOS ANALÍTICOS E INSTRUMENTALES; PRODUCTOS NATURALES |
| proc: Ingeniería de procesos | 16 | TERMODINÁMICA; INGENIERÍA DE BIORREACTORES; ELEMENTOS PARA EL DISEÑO I; ELEMENTOS PARA EL DISEÑO II; PROCESOS DE TRANSFERENCIA DE CALOR; BIOSEPARACIONES FLUÍDO-FLUÍDO |
| integral: Humanidades y gestión | 12 | BIOTECNOLOGÍA Y SOCIEDAD; COMUNICACIÓN Y SISTEMAS DE INFORMACIÓN (TALLER); INGLÉS I; INGLÉS II; RELACIONES LABORALES; ÉTICA (TALLER) |
| prof: Práctica profesional | 2 | PROYECTO TERMINAL II; PROYECTO TERMINAL III |
| esp: Especialidad | 4 | OPTATIVA I; ELECTIVA I; ELECTIVA II; OPTATIVA II |
| mec: Mecánica y materiales | 1 | MECÁNICA DE FLUIDOS Y SÓLIDOS |
| amb: Ambiente y energía | 1 | BLANCE DE MATERIA Y ENERGÍA |
| ind: Operaciones y logística | 3 | SISTEMAS DE CALIDAD; FENÔMENOS DE TRANSPORTE; ADMINISTRACIÓN DE LA PRODUCCIÓN |
| salud: Ciencias de la salud | 13 | FISIOLOGÍA; BIOQUÍMICA FARMACÉUTICA; MICROBIOLOGÍA FARMACÉUTICA; FARMACOLOGÍA; DISEÑO DE FÁRMACOS; BIOTECNOLOGÍA FARMACÉUTICA |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELEMENTOS PARA EL DISENO I | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| LEGISLACION FARMACEUTICA | integral | contexto: formación integral fuera del núcleo de negocios |
| ELEMENTOS PARA EL DISENO II | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION DE PROYECTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ESTUDIOS DE MERCADO (TALLER) | integral | contexto: formación integral fuera del núcleo de negocios |
| ELEMENTOS PARA EL DISENO III | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| PRODUCTOS NATURALES | quim | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.25. mapa-curricular-if-upiicsa-upiip

Unidades académicas: UPIICSA, UPIIP. Año del plan: 2020. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-if-upiicsa-upiip.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 8 | Fundamentos matemáticos; Cálculo diferencial e integral; Cálculo vectorial; Probabilidad y estadística; Métodos matemáticos de la ingeniería; Algebra lineal |
| comp: Computación | 3 | Dibujo asistido por computadora; Programación lineal; Programación del servicio ferroviario |
| elec: Electrónica | 3 | Electromagnetismo aplicado; Electricidad y electrónica experimental; Cruceros y señalización inteligentes |
| ctrl: Control y automatización | 1 | Instrumentación mecatrónica ferroviaria |
| redes: Telecomunicaciones | 1 | Informática y telecomunicaciones |
| integral: Humanidades y gestión | 13 | Etica y responsabilidad social; Administración integral; Entorno socioeconómico de México; Planeación del transporte urbano y regional; Introducción a la economía; Contabilidad y finanzas |
| prof: Práctica profesional | 1 | Metodología de la ingeniería |
| esp: Especialidad | 2 | Oplativa I; Optativa II |
| mec: Mecánica y materiales | 6 | Mecánica clásica aplicada; Tecnología y resistencia de materiales; Material rodante; Dinámica tren-vía; Mantenimiento de obras e instalaciones fijas; Mantenimiento de material rodante |
| civil: Construcción y tierra | 3 | Fundamentos de ingeniería civil y arquitectura; Infraestructura en instalaciones fijas; Contratación y ejecución de obras ferroviarias |
| amb: Ambiente y energía | 3 | Ingeniería ambiental y climatología; Química energética y ambiental; Suministro de combustible y energía eléctrica |
| ind: Operaciones y logística | 17 | Ingeniería y sistemas de transporte; Procesos de producción y de manufactura; Transporte ferroviario; Normalización ferroviaria; Estudios para proyectos ferroviarios; Ingeniería básica y proyecto ejecutivo |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ADMINISTRACION INTEGRAL | integral | contexto: formación integral fuera del núcleo de negocios |
| ENTORNO SOCIOECONOMICO DE MEXICO | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION DEL TRANSPORTE URBANO Y REGIONAL | integral | contexto: formación integral fuera del núcleo de negocios |
| INTRODUCCION A LA ECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| ESTUDIOS PARA PROYECTOS FERROVIARIOS | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| CONTABILIDAD Y FINANZAS | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA BASICA Y PROYECTO EJECUTIVO | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| ECONOMIA DE LA INGENIERIA | integral | contexto: formación integral fuera del núcleo de negocios |
| REDES Y SIMULACION | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| MODELOS DE SIMULACION | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| DERECHO FERROVIARIO | integral | contexto: formación integral fuera del núcleo de negocios |
| EMPRESAS Y ECONOMIA DEL TRANSPORTE FERROVIARIO | integral | contexto: formación integral fuera del núcleo de negocios |
| HABILIDADES DIRECTIVAS | integral | contexto: formación integral fuera del núcleo de negocios |
| SEMINARIO DE INGENIERIA FERROVIARIA | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| GESTION DE PROYECTOS TEORIA PRACTICA T/H CREDITOS TEPIC OPTATIVA I FORMULACION Y EVALUACION DE PROYECTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA II DIRECCION DE PROYECTOS | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.26. mapa-curricular-ig-esia-ticoman

Unidades académicas: ESIA. Año del plan: 2009. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-ig-esia-ticoman.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 14 | CÁLCULO DIFERENCIAEL E INTEGRAL; FUNDAMENTOS MATEMÁTICOS; FÍSICA DE ONDAS; MÉTODOS MATEMÁTICOS. ECUACIONES DIFERENCIALES; MÉTODOS MATEMÁTICOS. VECTORES Y TENSORES; MÉTODOS MATEMÁTICOS. SERIES Y TRANSFORMADAS |
| comp: Computación | 1 | SISTEMAS DE INFORMACIÓN GEOGRÁFICA |
| elec: Electrónica | 4 | TEORÍA ELECTROMAGNÉTICA; PROSPECCIÓN ELÉCTRICA; EXPLORACIÓN GEOELÉCTRICA; PROSPECCIÓN ELECTROMAGNÉTICA |
| integral: Humanidades y gestión | 6 | SOLUCIÓN DE PROBLEMAS Y CREATIVIDAD; TRABAJO EN EQUIPO Y LIDERAZGO; DESARROLLO PROFESIONAL Y ÉTICA; INGENIERA ECONÓMICA; MODELADO, INVERSIÓN E INTEGRACIÓN GEOFÍSICA; FORMULACIÓN Y EVALUACIÓN DE PROYECTOS |
| prof: Práctica profesional | 2 | PROYECTO TERMINAL I; PROYECTO TERMINAL II |
| esp: Especialidad | 5 | OPTATIVA A; OPTATIVA B; OPTATIVA C; OPTATIVA D; ELECTIVAS |
| mec: Mecánica y materiales | 3 | MECÁNICA; ELASTODINÁMICA; GEOMECÁNICA |
| civil: Construcción y tierra | 35 | GEOFÍSICA I; GEOLOGÍA FÍSICA; INSTRUMENTAL MÉTODOS POTENCIALES; GEOFÍSICA II; INSTRUMENTAL SÍSMICO Y ELÉCTRICO; DINÁMICA DEL CONTINUUM GEOFÍSICO |
| amb: Ambiente y energía | 8 | OCEANOGRAFÍA FÍSICA; METEOROLOGÍA GENERAL; DESARROLLO SUSTENTABLE; ANÁLISIS Y PRONÓSTICO METEOROLÓGICO; GEOTERMIA Y MÉTODOS DE EXPLORACIÓN; METEOROLOGÍA FÍSICA Y DINÁMICA |
| clin: Práctica clínica | 1 | MÉTODO SÍSMICO DE REFRACCIÓN |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| INSTRUMENTAL METODOS POTENCIALES | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| INGENIERA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| METODO GRAVIMETRICO Y MAGNETICO | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| MODELADO, INVERSION E INTEGRACION GEOFISICA | integral | contexto: formación integral fuera del núcleo de negocios |
| DISENO Y DETERMINACION DE PARAMETROS | civil | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.27. mapa-curricular-igeologica-esia-ticoman

Unidades académicas: ESIA. Año del plan: 2009. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-igeologica-esia-ticoman.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 5 | CÁLCULO VECTORIAL; ECUACIONES DIFERENCIALES; FUNDAMENTOS MATEMÁTICOS; MINERALOGÍA ÓPTICA; METODOS GEOESTADÍSTICOS |
| comp: Computación | 4 | COMPUTACIÓN PARA INGENIEROS; SISTEMAS DE INFORMACIÓN GEOGRÁFICA; MANEJO DE SOFTWARE ESPECIALIZADO; SISTEMAS OPERATIVOS |
| datos: Ciencia de datos e IA | 1 | PROCESAMIENTO DIGITAL DE IMÁGENES |
| elec: Electrónica | 1 | PROSPECCIÓN ELÉCTRICA |
| bio: Ciencias biológicas | 1 | GEOBILOGÍA |
| quim: Química | 1 | QUÍMICA APLICADA A LAS GEOCIENCIAS |
| integral: Humanidades y gestión | 6 | DESARROLLO PROFESIONAL Y ÉTICA; SOLUCIÓN DE PROBLEMAS Y CREATIVIDAD; TRABAJO EN EQUIPO Y LIDERAZGO; ECONOMÍA, RECURSOS Y NECESIDADES DE MÉXICO; FORMULACIÓN Y EVALUACIÓN DE PROYECTOS; FUNDAMENTOS JURÍDICOS DE LA GESTIÓN GEOAMBIENTAL |
| prof: Práctica profesional | 1 | PROYECTO TERMINAL I |
| esp: Especialidad | 5 | OPTATIVA A; OPTATIVA B; OPTATIVA C; OPTATIVA D; ELECTIVAS |
| mec: Mecánica y materiales | 3 | MECÁNICA DE SUELOS; MICROPALEONTOLOGÍA; INTRODUCCIÓN A LA GEOMECÁNICA |
| civil: Construcción y tierra | 46 | GEOLOGÍA FÍSICA I; GEOLOGÍA FÍSICA II; MINERALOGÍA GENERAL; PALEONTOLOGÍA GENERAL; PETROLOGÍA IGNEA Y METAMÓRFICA; PETROLOGÍA SEDIMENTARIA |
| amb: Ambiente y energía | 3 | CARACTERIZACIÓN Y REMEDIACIÓN DE SITIOS CONTAMINADOS; GEOTERMIA Y MÉTODOS DE EXPLORACIÓN; OCEANOGRAFÍA FÍSICA |
| salud: Ciencias de la salud | 1 | GEOMORFOLOGÍA |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| GEOBILOGIA | bio | excepción: Lectura OCR de geobiología; verificar original |
| ECONOMIA, RECURSOS Y NECESIDADES DE MEXICO | integral | contexto: formación integral fuera del núcleo de negocios |
| DISENO ASISTIDO | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| FUNDAMENTOS JURIDICOS DE LA GESTION GEOAMBIENTAL | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.28. mapa-curricular-ii-upiig

Unidades académicas: UPIIG. Año del plan: 2022. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-ii-upiig.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 8 | Cálculo diferencial; Mecánica clásica; Cálculo integral; Probabilidad; Cálculo vectorial; Estadística |
| comp: Computación | 2 | Dibujo Industrial asistido por computadora; Tecnología informática |
| elec: Electrónica | 3 | Electromagnetismo; Electricidad y electrónica; Electricidad aplicada |
| ctrl: Control y automatización | 3 | Instrumentación y control; OPTATIVA I Elementos para el control de procesos; OPTATIVA II Control de procesos |
| quim: Química | 2 | Química aplicada; Química industrial |
| proc: Ingeniería de procesos | 2 | Plantas y procesos industriales; OPTATIVA III Automatización de procesos industriales |
| integral: Humanidades y gestión | 18 | Fundamentos de administración; Responsabilidad social y ética; Administración de capital humano; Legislación industrial; Comunicación profesional; Economía |
| prof: Práctica profesional | 2 | Metodología de la investigación; Proyecto integrador industrial |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| mec: Mecánica y materiales | 8 | Mecánica de materiales; Dinámica de mecanismos; Tecnología de materiales; Conformado de materiales; Manufactura esbelta; Distribución de planta y manejo de materiales |
| civil: Construcción y tierra | 1 | Sistemas neumáticos e hidráulicos |
| amb: Ambiente y energía | 1 | Gestión ambiental |
| ind: Operaciones y logística | 14 | Fundamentos de ingeniería industrial; Normalización y metrología dimensional; Productividad y diseño del trabajo; Control de calidad; Determinación y aplicación de estándares; Pruebas de control de calidad |
| salud: Ciencias de la salud | 1 | Seguridad y salud en el trabajo |
| soc: Ciencias sociales | 1 | Psicología en el trabajo |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| FUNDAMENTOS DE ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| MECANICA CLASICA | fm | excepción: Física básica |
| ADMINISTRACION DE CAPITAL HUMANO | integral | contexto: formación integral fuera del núcleo de negocios |
| LEGISLACION INDUSTRIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| ECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| CONTABILIDAD Y COSTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION FINANCIERA | integral | contexto: formación integral fuera del núcleo de negocios |
| MERCADOTECNIA | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION Y CONTROL DE INVENTARIOS | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION Y CONTROL MAESTRO DE LA PRODUCCION | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION ESTRATEGICA | integral | contexto: formación integral fuera del núcleo de negocios |
| SISTEMAS HIBRIDOS | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| SIMULACION DE SISTEMAS | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| GESTION DE LA INNOVACION | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION DE LA CADENA DE SUMINISTRO | integral | contexto: formación integral fuera del núcleo de negocios |
| EMPRENDIMIENTO | integral | contexto: formación integral fuera del núcleo de negocios |
| SISTEMAS DE GESTION | integral | contexto: formación integral fuera del núcleo de negocios |
| HABILIDADES DIRECTIVAS | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.29. mapa-curricular-im-esfm

Unidades académicas: ESFM. Año del plan: 1997. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-im-esfm.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 48 | CÁLCULO I; ÁLGEBRA I; CÁLCULO II; ÁLGEBRA II; MATEMÁTICAS DISCRETAS; CÁLCULO III |
| comp: Computación | 4 | INFORMÁTICA; PROGRAMACIÓN |
| datos: Ciencia de datos e IA | 2 | GEOMETRÍA ANALÍTICA |
| integral: Humanidades y gestión | 13 | SOCIEDAD Y CONOCIMIENTO; ECONOMÍA; INGENIERÍA ECONÓMICA; FORMULACIÓN Y EVALUACIÓN DE PROYECTOS; FINANZAS; SISTEMAS FINANCIEROS Y COMERCIALES |
| prof: Práctica profesional | 4 | INTRODUCCIÓN A LA INGENIERÍA; SEMINARIO PARA LA TITULACIÓN CURRICULAR OPCIÓN A o B; INTRODUCIÓN A LA INGENIERÍA |
| esp: Especialidad | 1 | ASIGNATURAS OPTATIVAS (Semestre VI) |
| ind: Operaciones y logística | 8 | INVESTIGACIÓN DE OPERACIONES; SISTEMAS DE CALIDAD; INGENIERÍA INDUSTRIAL; ADMINISTRACIÓN DE LA PRODUCCIÓN; INGENIERÍA DE CALIDAD Y REINGENIERÍA; SEMINARIO DE MODELACIÓN INDUSTRIAL |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| FINANZAS | integral | contexto: formación integral fuera del núcleo de negocios |
| ANALISIS DE DECISIONES | fm | contexto: título ambiguo interpretado según la disciplina del plan |
| SISTEMAS FINANCIEROS Y COMERCIALES | integral | contexto: formación integral fuera del núcleo de negocios |
| ECONOMETRIA | integral | contexto: formación integral fuera del núcleo de negocios |
| SIMULACION I | fm | contexto: título ambiguo interpretado según la disciplina del plan |
| SEMINARIO DE MODELACION FINANCIERA | integral | contexto: formación integral fuera del núcleo de negocios |
| SIMULACION II | fm | contexto: título ambiguo interpretado según la disciplina del plan |
| SEMINARIO DE MODELACION INDUSTRIAL | ind | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.30. mapa-curricular-im-upiita-upiih-upiiz

Unidades académicas: UPIITA, UPIIH, UPIIZ. Año del plan: 2009. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-im-upiita-upiih-upiiz.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 7 | ALGEBRA LINEAL Y NUMEROS COMPLEJOS; CÁLCULO DIFERENCIAL E INTEGRAL; CÁLCULO VECTORIAL; ECUACIONES DIFERENCIALES; ELECTRICIDAD Y MAGNETISMO; OSCILACIONES Y OPTICA |
| comp: Computación | 11 | ANALISIS Y DISENO DE PROGRAMAS; DIBUJO ASISTIDO POR COMPUTADORA; HERRAMIENTAS COMPUTACIONALES; INTRODUUCCIÓN A LA PROGRAMACIÓN; PROGRAMACIÓN AVANZADA; INGENIERÍA ASISTIDA POR COMPUTADORA |
| datos: Ciencia de datos e IA | 3 | SISTEMAS NEURODIFUSOS; SISTEMAS DE VISIÓN ARTIFICIAL; VISIÓN ARTIFICIAL APLICADA |
| elec: Electrónica | 16 | CIRCUITOS ELÉCTRICOS; CIRCUITOS ELÉCTRICOS AVANZADOS; FUNDAMENTOS DE ELECTRÓNICA; ANALISIS DE SENALES Y SISTEMAS; CIRCUITOS LÓGICOS; DISPOSITIVOS LÓGICOS PROGRAMABLES |
| ctrl: Control y automatización | 16 | MICROPROCESADORES, MICROCONTROLADORES E INTERFAZ; SENSORES Y ACONDICIONADORES DE SENAL; AUTOMATIZACIÓN INDUSTRIAL; CONTROL CLÁSICO; INSTRUMENTACIÓN VIRTUAL; CONTROL DE SISTEMAS MECATRÓNICOS |
| redes: Telecomunicaciones | 2 | PROTOCOLOS AVANZADOS DE COMUNICACIONES; PROTOCOLOS DE COMUNICACIÓN INDUSTRIAL |
| proc: Ingeniería de procesos | 2 | PROCESOS INDUSTRIales; CONTROL DE PROCESOS INDUSTRIales |
| integral: Humanidades y gestión | 11 | COMUNICACIÓN ORAL Y ESCRITA; INGLES I; INGLES II; ADMINISTRACIÓN ORGANIZACIONAL; INGLES III; LIDERAZGO Y EMPRENDEDORES |
| prof: Práctica profesional | 4 | PROYECTO INTEGRADOR; METODOLOGÍA DE LA INVESTIGACIÓN; TRABAJO TERMINAL I; TRABAJO TERMINAL II |
| esp: Especialidad | 9 | ELECTIVA 1; OPTATIVA 1; OPTATIVA 2; OPTATIVA 3; ELECTIVA 2; OPTATIVA 4 |
| mec: Mecánica y materiales | 18 | ESTRUCTURA Y PROPIEDADES DE LOS MATERIALES; INTRODUCCIÓN A LA MECATRÓNICA; MECANICA DE LA PARTÍCULA; MECANICA DEL CUERPO RIGIDO; PROCESOS DE MANUFACTURA; RESISTENCIA DE MATERIALES |
| civil: Construcción y tierra | 1 | NEUMÁTICA E HIDRÁULICA |
| amb: Ambiente y energía | 1 | INGENIERÍA AMBIENTAL |
| ind: Operaciones y logística | 6 | AUTOMATIZACIÓN DE LÍNEA DE PRODUCCIÓN; ECONOMÍA Y LOGÍSTICA; SEGURIDAD INDUSTRIAL; SISTEMAS DE CALIDAD PARA LA MANUFACTURA; PRODUCCIÓN MÁS LIMPIA; DISEÑO ERGONÓMICO |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| ADMINISTRACION ORGANIZACIONAL | integral | contexto: formación integral fuera del núcleo de negocios |
| LIDERAZGO Y EMPRENDEDORES | integral | contexto: formación integral fuera del núcleo de negocios |
| TERMODINAMICA | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| FINANZAS E INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| PROYECTOS DE INVERSION | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| MERCADOTECNIA | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.31. mapa-curricular-imeteorologia-esia-uticoman

Unidades académicas: No indicada. Año del plan: 2024. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-imeteorologia-esia-uticoman.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 10 | Precálculo; Física básica; Cálculo diferencial e integral; Algebra lineal; Ecuaciones diferenciales; Meteorología sinóptica |
| comp: Computación | 2 | Geografía básica y Sistemas de Información Geográfica (SIG); Laboratorio de programación y procesamiento de datos |
| elec: Electrónica | 1 | Física de ondas y electromagnetismo |
| bio: Ciencias biológicas | 1 | Ecología básica |
| integral: Humanidades y gestión | 7 | Comunicación técnica y cientifica; Trabajo en equipo y liderazgo; Desarrollo profesional y ético; Administración empresarial; Toma de decisiones estratégicas; Legislación meteorológica y ambiental |
| prof: Práctica profesional | 2 | Proyecto terminal I; Proyecto terminal II |
| esp: Especialidad | 4 | Optativa I; Optativa II; Electiva **; Optativa ** |
| mec: Mecánica y materiales | 3 | Mecánica; Dinámica de fluidos; Creación y publicación de material en línea |
| civil: Construcción y tierra | 2 | Ciencias de la tierra; Hidrología básica |
| amb: Ambiente y energía | 33 | Fundamentos de la meteorología I; Laboratorio de instrumentación meteorológica, métodos de observación y códigos meteorológicos; Química ambiental; Fundamentos de la meteorología II; Laboratorio de cartas y análisis; Contexto histórico de la meteorología |
| ind: Operaciones y logística | 1 | OPTATIVA II Calidad del aire y del agua * |
| clin: Práctica clínica | 2 | Laboratorio de observación, análisis y diagnóstico del tiempo |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| LABORATORIO DE CARTAS Y ANALISIS | amb | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| TOMA DE DECISIONES ESTRATEGICAS | integral | contexto: formación integral fuera del núcleo de negocios |
| LEGISLACION METEOROLOGICA Y AMBIENTAL | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I METEOROLOGIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.32. mapa-curricular-imovilidadurbana-upiem

Unidades académicas: UPIEM. Año del plan: 2020. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-imovilidadurbana-upiem.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 8 | Matemáticas superiores; Calculo diferencial; Probabilidad; Calculo integral; Estadística; Algebra lineal |
| comp: Computación | 3 | Dibujo asistido por computadora; Sistemas de información geográfica; Programación lineal |
| datos: Ciencia de datos e IA | 3 | Programación y base de datos; Sistemas inteligentes de transporte; OPTATIVA II Inteligencia artificial |
| integral: Humanidades y gestión | 19 | Gestión de la oferta y la demanda; Comunicación profesional; Etica y responsabilidad social; Administración integral; Administración de capital humano; Microeconomía |
| prof: Práctica profesional | 2 | Metodología de la ingeniería; Metodología de la investigación |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| mec: Mecánica y materiales | 2 | Modelos de reemplazo y mantenimiento; OPTATIVA II Manejo de materiales |
| civil: Construcción y tierra | 4 | Proyecto de vías urbanas; Fundamentos de desarrollo urbano y regional; Construcción de vías urbanas; Sustentabilidad y competitividad urbana |
| ind: Operaciones y logística | 19 | Urbanismo y movilidad; Ingeniería y la movilidad urbana; Sistemas de transporte urbano; Transporte urbano de mercancías; Estudios de movilidad; Cuantificación de impactos del transporte |
| soc: Ciencias sociales | 1 | Sociología de la movilidad urbana |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| GESTION DE LA OFERTA Y LA DEMANDA | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION INTEGRAL | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE CAPITAL HUMANO | integral | contexto: formación integral fuera del núcleo de negocios |
| MICROECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| CONTABILIDAD DE COSTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE EMPRESAS DE TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION DEL TRANSPORTE URBANO Y REGIONAL | integral | contexto: formación integral fuera del núcleo de negocios |
| REDES Y SIMULACION | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| MACROECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| ECONOMIA DE LA INGENIERIA | integral | contexto: formación integral fuera del núcleo de negocios |
| MICROSIMULACION DE SISTEMAS DE TRANSPORTE | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION Y OPERACION DE FLOTAS | integral | contexto: formación integral fuera del núcleo de negocios |
| MACROSIMULACION DE SISTEMAS DE TRANSPORTE | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| BUENAS PRACTICAS EN LA GESTION DE LA MOVILIDAD | integral | contexto: formación integral fuera del núcleo de negocios |
| DIRECCION Y OPERACION DE TERMINALES Y AREAS DE TRANSFERENCIA | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE PROYECTOS DE TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I CREACION DE EMPRESAS | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA II GOBIERNO CORPORATIVO | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA III TOMA DE DECISIONES | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I REDES | ind | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.33. mapa-curricular-imym-esiqie

Unidades académicas: ESIQIE. Año del plan: 2010. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-imym-esiqie.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 8 | CÁLCULO DIFERENCIAL E INTEGRAL; CÁLCULO SUPERIOR; ECUACIONES DIFERENCIALES APLICADAS; ELECTRICIDAD Y MAGNETISMO; MECÁNICA CLÁSICA; MÉTODOS NUMÉRICOS Y HERRAMIENTAS |
| comp: Computación | 1 | INTERFASES Y SUPERFICIES |
| elec: Electrónica | 1 | PROPIEDADES ELECTROMAGNÉTICAS Y TÉRMICAS DE LOS MATERIALES |
| ctrl: Control y automatización | 1 | INSTRUMENTACIÓN DE PROCESOS |
| bio: Ciencias biológicas | 2 | MICROSCOPIA ELECTRÓNICA DE BARRIDO; MICROSCOPIA ELECTRÓNICA DE TRANSMISIÓN |
| quim: Química | 5 | ANALISIS QUÍMICO; ELECTROQUÍMICA; QUÍMICA BÁSICA; QUÍMICA DE SOLUCIONES; ANÁLISIS INSTRUMENTAL |
| proc: Ingeniería de procesos | 4 | TERMODINÁMICA BÁSICA; TERMODINÁMICA METALURGICA; REDUCCIÓN Y REFINACIÓN; DISEÑO DE PLANTAS |
| integral: Humanidades y gestión | 6 | COMUNICACIÓN ORAL Y ESCRITA; INGLÉS I; INGLÉS II; RELACIONES HUMANAS; INGENIERÍA ECONÓNMICA; GESTIÓN DE PROYECTOS |
| prof: Práctica profesional | 8 | TALLER DE PRÁCTICAS Y VISITAS INDUSTRIales I; TALLER DE PRÁCTICAS Y VISITAS INDUSTRIales II; TALLER DE PRÁCTICAS Y VISITAS INDUSTRIales III; ESTANCIA INDUSTRIAL I; ESTANCIA INDUSTRIAL II; ESTANCIA INDUSTRIAL III |
| esp: Especialidad | 12 | ELECTIVA I; ELECTIVA II; ELECTIVA III; ELECTIVA IV; ELECTIVA V; OPTATIVA I |
| mec: Mecánica y materiales | 37 | CIENCIA DE LOS MATERIALES; CONCENTRACIÓN DE MINERALES; CORROSIÓN; INGENIERÍA ELECTROMECANICA; METALURGIA DE METALES BASE; MICROESTRUCTURA Y PROPIEDADES DE LOS MATERIALES |
| civil: Construcción y tierra | 2 | MINERALOGÍA; TECNICAS DE CARACTERIZACIÓN MICROESTRUCTURAL |
| amb: Ambiente y energía | 4 | BALANCE DE MATERIA Y ENERGÍA; INGENIERÍA AMBIENTAL; RECICLAJE; SUSTENTABILIDAD |
| ind: Operaciones y logística | 4 | FENÓMENOS DE TRANSPORTE; ADMINISTRACIÓN DE LA PRODUCCIÓN; SEGURIDAD INDUSTRIAL E HIGIENE; TALLER DE CONTROL DE CALIDAD |
| sin_categoria: Sin categoría | 1 | TOPICOS AVANZADOS |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| MECANICA CLASICA | fm | excepción: Física básica |
| INGENIERIA ECONONMICA | integral | excepción: Lectura OCR de economía en ingeniería |
| GESTION DE PROYECTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| MODELADO Y SIMULACION DE PROCESOS | mec | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.34. mapa-curricular-ingenieria-en-negocios-energeticos-sustentables--281-29

Unidades académicas: UPIEM. Año del plan: 2019. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-ingenieria-en-negocios-energeticos-sustentables--281-29.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 7 | Cálculo diferencial e integral; Probabilidad y estadística; Ecuaciones diferenciales aplicadas; Simulación y modelación estadística; Electricidad y magnetismo; Métodos numéricos |
| comp: Computación | 1 | Herramientas computacionales |
| datos: Ciencia de datos e IA | 1 | Analisis e interpretación de bases de datos |
| elec: Electrónica | 1 | Fundamentos de eléctrica y electrónica |
| quim: Química | 1 | Química general |
| proc: Ingeniería de procesos | 2 | Termodinámica; Balances de materia venería |
| integral: Humanidades y gestión | 4 | Habilidades de expresión oral y escrita; Cultura de la legalidad; Solución de problemas y creatividad; Formulación y evaluación de provectos |
| prof: Práctica profesional | 3 | Trabajo terminal I; Estancia industrial; Trabajo terminal II |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| mec: Mecánica y materiales | 1 | Mecánica |
| amb: Ambiente y energía | 10 | Sistemas y ambiente; Desarrollo sustentable; Combustibles fósiles; Energías alternas; Marco iuridico ambiental y energético; Evaluación ambiental |
| ind: Operaciones y logística | 4 | Conversión y almacenamiento de energía; Fundamentos de fenómenos de transporte; Hiqiene, segunda y riesgos industriales; Producción y consumo repsonsable |
| adm: Administración y negocios | 15 | Economía, recursos y necesidades energéticas de México; Microeconomía; Gestión de ciclo de vida; Desarrollo organizacional; Financiamiento en el sector energético; Administración e innovación en modelos de negocios |
| soc: Ciencias sociales | 2 | Políticas públicas; Cultura energética y educación ambiental |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| ECONOMIA, RECURSOS Y NECESIDADES ENERGETICAS DE MEXICO | adm | contexto: núcleo de negocios |
| MICROECONOMIA | adm | contexto: núcleo de negocios |
| GESTION DE CICLO DE VIDA | adm | contexto: núcleo de negocios |
| DESARROLLO ORGANIZACIONAL | adm | contexto: núcleo de negocios |
| FINANCIAMIENTO EN EL SECTOR ENERGETICO | adm | contexto: núcleo de negocios |
| ADMINISTRACION E INNOVACION EN MODELOS DE NEGOCIOS | adm | contexto: núcleo de negocios |
| HIQIENE, SEGUNDA Y RIESGOS INDUSTRIALES | ind | excepción: Lectura OCR de higiene y seguridad industrial; verificar original |
| INGENIERIA EN ECONOMIA | adm | contexto: núcleo de negocios |
| TECNICAS Y MODELOS PARA LA TOMA DE DECISIONES | adm | contexto: núcleo de negocios |
| GESTION ENERGETICA AMBIENTAL | adm | contexto: núcleo de negocios |
| EMPRENDIMIENTO Y LIDERAZGO | adm | contexto: núcleo de negocios |
| EXPERIENCIAS E INTERVENCION INTERNACIONAL EN LOS NEGOCIOS | adm | contexto: núcleo de negocios |
| FORMULACION Y EVALUACION DE PROVECTOS | integral | excepción: Lectura OCR de proyectos en ingeniería |
| ECONOMIA CIRCULAR | adm | contexto: núcleo de negocios |
| ADMINISTRACION DE PROYECTO ENERGETICOS | adm | contexto: núcleo de negocios |
| NEGOCIACION Y SOLUCION DE CONFLICTOS | adm | contexto: núcleo de negocios |
| HABILIDADES DIRECTIVAS | adm | contexto: núcleo de negocios |

### 4.35. mapa-curricular-ingenieria-en-sistemas-automotrices--281-29

Unidades académicas: ESIME, UPIIG, UPIIH, UPIIIT, UPIIAP. Año del plan: 2006. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-ingenieria-en-sistemas-automotrices--281-29.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 8 | CÁLCULO DIFERENCIAL E INTEGRAL; FISICA CLÁSICA; FUNDAMENTOS DE ÁLGEBRA; CÁLCULO VECTORIAL; ECUACIONES DIFERENCIALES; MÉTODOS NUMÉRICOS |
| comp: Computación | 8 | FUNDAMENTOS DE PROGRAMACIÓN; MODELADO Y SIMULACIÓN ASISTIDOS POR COMPUTADORA; DINÁMICA DE FLUIDOS COMPUTACIONAL (III); INTERFACES Y MICRO CONTROLADORES (III); PROGRAMACIÓN DE SISTEMAS INMERSOS (II); MICROCOMPUTADORAS AUTOMOTRICES I (III) |
| datos: Ciencia de datos e IA | 1 | SISTEMAS INTELIGENTES DEL AUTOMÓVIL (VI) |
| elec: Electrónica | 12 | ANÁLISIS DE CIRCUITOS DE CORRIENTE DIRECTA Y CORRIENTE ALTERNA (CD Y CA); ELECTRÓNICA I; ELECTRICIDAD Y ELECTRÓNICA AUTOMOTRIZ; ELECTRÓNICA OPERACIONAL Y DE POTENCIA II; TECNOLOGÍAS DE LOS VEHÍCULOS HÍBRIDOS Y ELÉCTRICOS; TOPICOS SELECTOS DE INGENIERÍA I INGENIERÍA APLICADA A VEHÍCULOS HÍBRIDOS Y ELÉCTRICOS |
| ctrl: Control y automatización | 14 | TEORÍA DE CONTROL I; TÓPICOS SELECTOS DE INGENIERÍA I: CONTROL DE SISTEMAS TERMODINAMICOS DEL AUTOMÓVIL I; CONTROL EN VEHÍCULOS HÍBRIDOS Y ELÉCTRICOS; SENSORES AUTOMOTRICES Y ACONDICIONADORES DE SEÑAL I (I); TOPICOS SELECTOS DE INGENIERÍA I CONTROL INTELIGENTE I; APLICACIONES CON MICROCONTROLADORES PARA EL AUTOMÓVIL (III) |
| quim: Química | 2 | QUÍMICA BÁSICA; QUÍMICA APLICADA |
| proc: Ingeniería de procesos | 3 | ARQUITECTURAS EMBEBIDAS AUTOMOTRICES (II); PROCESOS INDUSTRIALES AUTOMOTRICES (I); COMUNICACIONES EMBEBIDAS AUTOMOTRICES (IV) |
| integral: Humanidades y gestión | 12 | HUMANIDADES I: INGENIERÍA, CIENCIA Y SOCIEDAD; HUMANIDADES II: LA COMUNICACIÓN Y LA INGENIERÍA; HUMANIDADES III: DESARROLLO HUMANO; SISTEMAS DE SUSPENSIÓN, DIRECCIÓN Y FRENOS; HUMANIDADES IV: DESARROLLO PERSONAL Y PROFESIONAL; TOPICOS SELECTOS DE INGENIERÍA I: GESTIÓN COMERCIAL AUTOMOTIVA I |
| prof: Práctica profesional | 2 | PROYECTO INTEGRADOR; INGENIERÍA DE PROYECTOS (VI) |
| esp: Especialidad | 3 | OPTATIVA I; OPTATIVA II; OPTATIVA III |
| mec: Mecánica y materiales | 47 | DINÁMICA DE FLUIDOS; ESTÁTICA; TERMODINÁMICA I; INTRODUCIÓN A LA CIENCIA DE LOS MATERIALES; DINÁMICA; TERMODINÁMICA II |
| amb: Ambiente y energía | 2 | INGENIERÍA AMBIENTAL AUTOMOTRIZ; ENERGOTÉCNIA (I) |
| ind: Operaciones y logística | 5 | METROLOGÍA Y NORMALIZACIÓN; ERGONOMÍA (II); FUENTES Y ALMACENAMIENTO DE ENERGÍA; LOGÍSTICA DE PRODUCCIÓN AUTOMOTRIZ (II); SISTEMAS DE GESTIÓN DE CALIDAD EN LA PRODUCCIÓN AUTOMOTRIZ (III) |
| sin_categoria: Sin categoría | 3 | TÓPICOS SELECTOS DE INGENIERÍA I; TÓPICOS SELECTOS DE INGENIERÍA I: TECNOLOGÍAS ALTERNATIVAS I; TÓPICOS SELECTOS DE INGENIERÍA II: TECNOLOGÍAS ALTERNATIVAS II |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| TERMODINAMICA I | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| TERMODINAMICA II | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| TRANSFERENCIA DE CALOR | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| SISTEMAS DE SUSPENSION, DIRECCION Y FRENOS | integral | contexto: formación integral fuera del núcleo de negocios |
| TOPICOS SELECTOS DE INGENIERIA I: GESTION COMERCIAL AUTOMOTIVA I | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DEL TALLER AUTOMOTRIZ (II) | integral | contexto: formación integral fuera del núcleo de negocios |
| ORGANIZACION E IMPLEMENTACION DE LA EMPRESA DE PRODUCCION AUTOMOTRIZ Y DE AUTOPARTES (IV) | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE SERVICIOS DE LA AGENCIA DE VENTA Y POSVENTA DE VEHICULOS AUTOMOTORES (V) | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION GERENCIAL AUTOMOTIVA (VI) | integral | contexto: formación integral fuera del núcleo de negocios |
| TOPICOS SELECTOS DE INGENIERIA II: GESTION COMERCIAL AUTOMOTIVA II | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.36. mapa-curricular-ingenieria-industrial--281-29

Unidades académicas: UPIICSA, UPIIT, UPIIIT. Año del plan: 2022. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-ingenieria-industrial--281-29.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 8 | Cáculo vectorial; Cáculo diferencial; Mecánica clásica; Cáculo integral; Probabilidad; Estadística |
| comp: Computación | 2 | Dibujo industrial asistido por computadora; Tecnología informática |
| elec: Electrónica | 4 | Electromagnetismo; Laboratorio de electromagnetismo; Electricidad y electrónica; Electricidad aplicada |
| ctrl: Control y automatización | 1 | Instrumentación y control |
| quim: Química | 4 | Química aplicada; Laboratorio de química aplicada; Química industrial; Laboratorio de química industrial |
| proc: Ingeniería de procesos | 1 | Plantas y procesos industriales |
| integral: Humanidades y gestión | 24 | Fundamentos de administración; Responsabilidad social y ética; Administración de capital humano; Legislación industrial; Comunicación profesional; Economía |
| prof: Práctica profesional | 1 | Metodología de la investigación |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| mec: Mecánica y materiales | 12 | Laboratorio de mecánica clásica; Mecánica de materiales; Dinámica de mecanismos; Tecnología de materiales; Conformado de materiales; Manufactura esbelta |
| civil: Construcción y tierra | 1 | Sistemas neumáticos hidráulicos |
| amb: Ambiente y energía | 1 | Gestión ambiental |
| ind: Operaciones y logística | 20 | Fundamentos de ingeniería industrial; Diseño y evaluación de estaciones de trabajo; Productividad y diseño del trabajo; Normalización y metrología dimensional; Control de calidad; Determinación y aplicación de estándares |
| salud: Ciencias de la salud | 2 | Segundidad y salud en el trabajo; OPTATIVA II Salud en el trabajo |
| soc: Ciencias sociales | 1 | Psicología en el trabajo |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| FUNDAMENTOS DE ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| MECANICA CLASICA | fm | excepción: Física básica |
| ADMINISTRACION DE CAPITAL HUMANO | integral | contexto: formación integral fuera del núcleo de negocios |
| LEGISLACION INDUSTRIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| ECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| CONTABILIDAD Y COSTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION FINANCIERA | integral | contexto: formación integral fuera del núcleo de negocios |
| MERCADOTECNIA | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION Y CONTROL DE INVENTARIOS | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION Y CONTROL MAESTRO DE LA PRODUCCION | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION ESTRATEGICA | integral | contexto: formación integral fuera del núcleo de negocios |
| SISTEMAS HIBRIDOS | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| SIMULACION DE SISTEMAS | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| GESTION DE LA INNOVACION | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION DE LA CADENA DE SUMINISTRO | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION DE PROYECTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| EMPRENDIMIENTO | integral | contexto: formación integral fuera del núcleo de negocios |
| SISTEMAS DE GESTION | integral | contexto: formación integral fuera del núcleo de negocios |
| HABILIDADES DIRECTIVAS | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I DISENO Y VALIDACION DE UN PROTOTIPO | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| OPTATIVA II DESARROLLO DEL PRODUCTO | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| OPTATIVA III GESTION DE RIESGO Y PROTECCION CIVIL | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA II SOLUCION A PROBLEMAS DE LA ALTA DIRECCION | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA III IMPLEMENTACION DE SISTEMAS DE GESTION | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I TECNOLOGIAS INTELIGENTES | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| OPTATIVA II INTEGRACION DE LAS TECNOLOGIAS EN LA INDUSTRIA 5.0 | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| OPTATIVA III COMERCIALIZACION INTERNACIONAL Y DIGITAL (ECONOMIA) | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.37. mapa-curricular-ip-esia-ticoman

Unidades académicas: ESIA. Año del plan: 2009. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-ip-esia-ticoman.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 5 | FUNDAMENTOS MATEMÁTICOS; ECUACIONES DIFERENCIALES; CÁLCULO DIFERENCIA E INTEGRAL; MÉTODOS NUMÉRICOS; GEOESTADÍSTICA |
| elec: Electrónica | 1 | ELECTROMAGNETISMO |
| ctrl: Control y automatización | 3 | SISTEMAS DE CONTROL; INGENIERÍA DE FLUIDOS DE CONTROL; TRANSPORTE Y MEDICIÓN DE HIDROCARBUROS |
| proc: Ingeniería de procesos | 1 | TERMODINÁMICA |
| integral: Humanidades y gestión | 5 | DESARROLLO PROFESIONAL Y ÉTICA; SOLUCIÓN DE PROBLEMAS Y CREATIVIDAD; TRABAJO EN EQUIPO Y LIDERAZGO; FORMULACIÓN Y EVALUACIÓN DE PROYECTOS; INGENIERÍA ECONÓMICA |
| prof: Práctica profesional | 2 | PROYECTO TERMINAL I; PROYECTO TERMINAL II |
| esp: Especialidad | 4 | OPTATIVA A; ELECTIVAS; OPTATIVA B; OPTATIVA C |
| mec: Mecánica y materiales | 8 | MECÁNICA; MECÁNICA DE FLUIDOS; RESISTENCIA DE MATERIALES; CARACTERIZACIÓN ROCA FLUIDOS; CORROSIÓN; YACIMIENTOS NATURALES FRACTURADOS |
| civil: Construcción y tierra | 38 | GEOHIDROLOGÍA; GEOLOGÍA FÍSICA; GEOLOGÍA ESTRUCTURAL; GEOLOGÍA DEL PETRÓLEO; INTRODUCIÓN A LA TOPOGRAFÍA; QUIMICA FUNDAMENTAL PARA INGENIERÍA PETROLERA |
| amb: Ambiente y energía | 2 | DESARROLLO SUSTENTABLE; OCEANOGRAFÍA FÍSICA |
| ind: Operaciones y logística | 1 | SEGURIDAD INDUSTRIAL |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| REGISTROS GEOFISICOS BASICOS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| REGISTROS GEOFISICOS CONVENCIONALES | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| ESTIMULACION DE POZOS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| COMPORTAMIENTO DE POZOS FLUYENTES | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| REGISTROS PROCESADOS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| SISTEMAS ARTIFICIALES DE PRODUCION | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| ANALISIS DE PRUEBAS DE PRESION | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| RECOLECCION Y MANEJO DE LA PRODUCION | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| PLANEACION DE LA PERFORACION Y TERMINACION DE POZOS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| DISENO DE POZOS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| REGISTROS EN AGUJERO ENTUBADO | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| TENDENCIAS TECNOLOGICAS DE REGISTROS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| PIGS (DIABLOS) INSTRUMENTADOS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| REGISTROS GEOFISICOS DE PRODUCCION | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| MANEJO E INTERPRETACION DE MAQUETAS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| NUEVAS TECNICAS DE REGISTRO EN AGUJERO | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| ASENTAMIENTOS DE TRS Y CEMENTACION | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| DESARROLLO DE CAMPOS EN AGUJAS PROFUNDAS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| EXPLOTACION DE AGUJAS SUBTERRANEAS | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| POZOS GEOTERMICOS | civil | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.38. mapa-curricular-iqi-esiqie

Unidades académicas: ESIQIE. Año del plan: 2010. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-iqi-esiqie.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 10 | CÁLCULO DIFERENCIAL E INTEGRAL; CÁLCULO SUPERIOR; ECUACIONES DIFERENCIALES APLICADAS; ELECTRICIDAD Y MAGNETISMO; MECÁNICA CLÁSICA; MÉTODOS NUMÉRICOS |
| comp: Computación | 1 | HERRAMIENTAS COMPUTACIONALES EN INGENIERÍA |
| elec: Electrónica | 1 | INGENIERÍA ELÉCTRICA Y ELECTRÓNICA |
| bio: Ciencias biológicas | 1 | FUNDAMENTOS DE BIOQUÍMICA |
| quim: Química | 13 | QUÍMICA GENERAL; QUÍMICA DE SOLUCIONES; PRINCIPIOS DE ANÁLISIS CUANTITATIVO; QUÍMICA DE GRUPOS FUNCIONALES; QUÍMICA DE LOS HIDROCARBUROS; TERMODINÁMICA DEL EQUILIBRIO QUÍMICO |
| proc: Ingeniería de procesos | 20 | TERMODINÁMICA BÁSICA; TERMODINÁMICA DE LAS SUSTANCIAS PURAS; ELEMENTOS DE DISEÑO; TERMODINÁMICA DEL EQUILIBRIO DE FASES; TRANSFERENCIA DE CALOR; CINÉTICA Y REACTORES HOMOGÉNEOS |
| integral: Humanidades y gestión | 13 | COMUNICACIÓN ORAL Y ESCRITA; MACRO ECONOMÍA Y ADMINISTRACIÓN; INGENIERÍA ECONÓMICA; LEGISLACIÓN INDUSTRIAL; MERCADOTECNIA; PROBLEMAS SOCIOECONÓMICOS DE MÉXICO |
| prof: Práctica profesional | 4 | INTRODUCIÓN A LA INGENIERÍA; VISITA INDUSTRIAL A; VISITA INDUSTRIAL B; PRÁCTICA PROFESIONAL A |
| esp: Especialidad | 3 | OPTATIVA |
| mec: Mecánica y materiales | 7 | FLUJO DE FLUIDOS; FUNDAMENTOS DE NANOTECNOLOGÍA; TÉCNICAS DE POLIMERIZACIÓN Y FORMULACIÓN DE POLÍMEROS; CORROSIÓN; TRANSFORMACIÓN DE POLÍMEROS; METROLOGÍA |
| civil: Construcción y tierra | 1 | EXPANSIÓN Y FLEXIBILIDAD DE TUBERÍAS |
| amb: Ambiente y energía | 7 | BALANCE DE MATERIA Y ENERGÍA; FUENTES ALTERNAS DE ENERGÍA; PREVENCIÓN Y CONTROL DE LA CONTAMINACIÓN DEL AGUA; PREVENCIÓN Y CONTROL DE LA CONTAMINACIÓN DEL AIRE; MANEJO INTEGRAL DE LOS RESIDUOS MUNICIPALES E INDUSTRIES; TÓPICOS DE INGENIERÍA AMBIENTAL |
| ind: Operaciones y logística | 7 | INTRODUCIÓN A LA SEGURIDAD INDUSTRIAL; FUNDAMENTOS DE FENÓMENOS DE TRANSPORTE; HIGIENE Y SEGURIDAD INDUSTRIAL; SISTEMAS DE CALIDAD; CULTURA Y ADMINISTRACIÓN DE LA CALIDAD; INVESTIGACIÓN DE OPERACIONES |
| soc: Ciencias sociales | 1 | HISTORIA Y FILOSOFÍA DE LA CIENCIA |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| MECANICA CLASICA | fm | excepción: Física básica |
| ELEMENTOS DE DISENO | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| MACRO ECONOMIA Y ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| DIESENO DE EQUIPOS INDUSTRIALES | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| LEGISLACION INDUSTRIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| DIESENO BASICO DE PROCESOS | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| INGENIERIA DE VAPOR Y SERVICIOS | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| MERCADOTECNIA | integral | contexto: formación integral fuera del núcleo de negocios |
| PROBLEMAS SOCIOECONOMICOS DE MEXICO | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION FINANCIERA | integral | contexto: formación integral fuera del núcleo de negocios |
| FENOMENOS DE SUPERFICIE | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| NORMAS Y CODIGOS DE DISENO | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| PLANEACION Y CONTROL DE LA PRODUCCION | integral | contexto: formación integral fuera del núcleo de negocios |
| TECNICAS INSTRUMENTALES AVANZADAS | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| COMERCIALIZACION Y CARACTERIZACION DE POLIMEROS | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO DE HABILIDADES GERENCIALES | integral | contexto: formación integral fuera del núcleo de negocios |
| SIMULACION DE PROCESOS | proc | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.39. mapa-curricular-ir-esime-azcapotzalco

Unidades académicas: ESIME. Año del plan: 2003. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-ir-esime-azcapotzalco.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 7 | CÁLCULO DIFERENCIAL E INTEGRAL; FÍSICA CLÁSICA; FUNDAMENTOS DE ÁLGEBRA; CÁLCULO VECTORIAL; ELECTRICIDAD Y MAGNETISMO; MÉTODOS NUMÉRICOS |
| comp: Computación | 4 | FUNDAMENTOS DE PROGRAMACIÓN; DIBUJO ASISTIDO POR COMPUTADORA; INTERFASES. PERIFÉRICOS Y PROGRAMACIÓN I; INTERFASES. PERIFÉRICOS Y PROGRAMACIÓN II |
| elec: Electrónica | 4 | CIRCUITOS ELÉCTRICOS; INGENIERÍA ELÉCTRICA APLICADA; ELECTRÓNICA; ELECTRÓNICA INDUSTRIAL |
| ctrl: Control y automatización | 5 | INSTRUMENTACIÓN; CONTROL NUMÉRICO COMPUTARIZADO; CONTROLADORES LÓGICOS PROGRAMABLES; AUTOMATIZACIÓN DE SISTEMAS INDUSTRIales; PROYECTO DE INGENIERÍA O TÓPICOS SELECTOS DE INGENIERÍA II --- SISTEMAS DE CONTROL |
| quim: Química | 2 | QUÍMICA BÁSICA; QUÍMICA APLICADA |
| integral: Humanidades y gestión | 9 | HUMANIDADES I: INGENIERÍA CIENCIA Y SOCIEDAD; HUMANIDADES II: LA COMUNICACIÓN Y LA INGENIERÍA; HUMANIDADES III: DESARROLLO HUMANO; ANÁLISIS ECONÓMICO; ADMINISTRACIÓN INDUSTRIAL I; HUMANIDADES IV: DESARROLLO PERSONAL Y PROFESIONAL |
| prof: Práctica profesional | 1 | DESARROLLO PROSPECTIVO DE PROYECTOS O TÓPICOS SELECTOS DE INGENIERÍA I |
| esp: Especialidad | 1 | OPTATIVA |
| mec: Mecánica y materiales | 16 | ENSAYE DE MATERIALES; ESTÁTICA; SISTEMAS EXPERIMENTALES; DINÁMICA; INGENIERÍA DE MANUFACTURA APLICADA; METROLOGÍA DIMENSIONAL |
| civil: Construcción y tierra | 1 | OLEOHIDRÁULICA |
| ind: Operaciones y logística | 1 | INGENIERÍA DE CALIDAD |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| SISTEMAS EXPERIMENTALES | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| ANALISIS ECONOMICO | integral | contexto: formación integral fuera del núcleo de negocios |
| DISENO DE CONJUNTOS | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION INDUSTRIAL I | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO PROSPECTIVO DE PROYECTOS O TOPICOS SELECTOS DE INGENIERIA I | prof | contexto: proyecto de integración profesional en ingeniería; confirmar alternativa de tópicos |
| PROYECTO DE INVERSION | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION INDUSTRIAL II | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.40. mapa-curricular-isa-encb

Unidades académicas: ENCB. Año del plan: 2018. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-isa-encb.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 7 | T/H TEPIC SATCA CÁLCULO DIFERENCIAL E INTEGRAL; ESTADÍSTICA; CÁLCULO VECTORIAL; FÍSICA I; TEORÍA PRÁCTICA T/H TEPIC SATCA ECUACIONES DIFERENCIALES; FÍSICA II |
| datos: Ciencia de datos e IA | 1 | QUÍMICA ANALÍTICA |
| ctrl: Control y automatización | 3 | INSTRUMENTACIÓN Y CONTROL; CONTROL DE GASES; CONTROL DE PARTÍCULAS |
| bio: Ciencias biológicas | 3 | TEORÍA PRÁCTICA T/H TEPIC SATCA ECOLOGÍA; BIOQUÍMICA; PROCESOS BIOLÓGICOS |
| quim: Química | 9 | QUÍMICA INORGÁNICA; FISICOQUÍMICA I; QUÍMICA ORGÁNICA; TEORÍA PRÁCTICA T/H TEPIC SATCA FISICOQUÍMICA II; FISICOQUÍMICA DE MATERIALES PELIGROSOS; INGENIERÍA DE LAS REACCIONES QUÍMICAS |
| proc: Ingeniería de procesos | 1 | TEORÍA PRÁCTICA T/H TEPIC SATCA INGENIERÍA TERMODINAMICA |
| integral: Humanidades y gestión | 8 | DESARROLLO HUMANO; PROCESOS DE COMUNICACIÓN; PSICOSOCIOLOGÍA DE RELACIONES HUMANAS; ADMINISTRACIÓN Y HABILIDADES GERENCIALES; FORMULACIÓN DE PROGRAMAS Y PROYECTOS; TEORÍA PRÁCTICA T/H TEPIC SATCA AUDITORIA AMBIENTAL |
| prof: Práctica profesional | 3 | TEORÍA PRÁCTICA T/H TEPIC SATCA METODOLOGÍAS DE LA INVESTIGACIÓN; TEORÍA PRÁCTICA T/H TEPIC SATCA INGENIERÍA DE PROYECTOS; PROYECTO INTEGRAL DE LA TRAYECTORIA |
| esp: Especialidad | 2 | OPTATIVA |
| mec: Mecánica y materiales | 3 | DIBUJO TÉCNICO Y SIG PARA INGENIEROS; FLUJO DE FLUIDOS; INGENIERIA ELECTROMECÁNICA |
| civil: Construcción y tierra | 2 | PROYECTOS DE INFRAESTRUCTURA Y PROCESOS PRODUCTIVOS; GEOLOGÍA E HIDROLOGÍA |
| amb: Ambiente y energía | 23 | RECURSOS NATURALES Y AMBIENTE; SISTEMAS Y AMBIENTE; BALANCE DE MASA Y ENERGÍA; METEREOLOGÍA Y CLIMATOLOGÍA; MICROBIOLOGÍA AMBIENTAL; INGENIERÍA EN SISTEMAS AMBIENTALES |
| ind: Operaciones y logística | 8 | TEORÍA PRÁCTICA T/H TEPIC SATCA FENÔMENOS DE TRANSPORTE; GESTIÓN DE LA CALIDAD DEL AGUA; GESTIÓN DE LA CALIDAD DEL AIRE; GESTIÓN DE LA CALIDAD DE SUELOS Y RESIDUOS; SISTEMAS DE CALIDAD; HIGIENE Y SEGURIDAD INDUSTRIAL |
| salud: Ciencias de la salud | 1 | TOXICOLOGÍA AMBIENTAL |
| clin: Práctica clínica | 1 | DIAGNOSTICO AMBIENTAL |
| sin_categoria: Sin categoría | 5 | TRAYECTORIA |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ADMINISTRACION Y HABILIDADES GERENCIALES | integral | contexto: formación integral fuera del núcleo de negocios |
| BIOQUIMICA | bio | excepción: Área biológica del catálogo vigente |
| TEORIA PRACTICA T/H TEPIC SATCA AUDITORIA AMBIENTAL | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION DE RESIDUOS | integral | contexto: formación integral fuera del núcleo de negocios |
| MODELACION DE CONTAMINANTES EN SUELOS Y AGUAS | amb | contexto: título ambiguo interpretado según la disciplina del plan |
| T.H GESTION DE RESIDUOS | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.41. mapa-curricular-isc-escom-upiiz

Unidades académicas: ESCOM, UPIIZ. Año del plan: 2020. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-isc-escom-upiiz.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 9 | Matemáticas discreta; Cálculo; Análisis vectorial; Algebra lineal; Cálculo aplicado; Mecánica y electromagnetismo |
| comp: Computación | 23 | Fundamentos de programación; Algoritmos y estructura de datos; Análisis y diseño de algoritmos; Paradigmas de programación; Teoria de la computación; Tecnologías para el desarrollo de aplicaciones web |
| datos: Ciencia de datos e IA | 10 | Bases de datos; Inteligencia artificial; Non-relational databases; Big data; Statistical tools for data analytics; Data mining |
| elec: Electrónica | 8 | Fundamentos de diseño digital; Circuitos eléctricos; Diseño de sistemas digitales; Electrónica analógica; Procesamiento digital de señales; Arquitectura de computadoras |
| ctrl: Control y automatización | 4 | Instrumentación y control; Virtual instrumentation; Virtual instrumentation applications; SISTEMAS COMPLEJOS TEORIA PRÁCTICA T/H CRÉDITOS TEPIC Cellular automata |
| redes: Telecomunicaciones | 3 | Redes de computadoras; Aplicaciones para comunicaciones en red; Sistemas distribuidos |
| bio: Ciencias biológicas | 1 | Genetic algorithms |
| integral: Humanidades y gestión | 13 | Comunicación oral y escrita; Ingeniería ética y sociedad; Fundamentos económicos; Finanzas empresariales; Formulación y evaluación de proyectos informáticos; Métodos cuantitativos para la toma de decisiones |
| prof: Práctica profesional | 3 | Trabajo terminal I; Trabajo terminal II; Estancia profesional |
| esp: Especialidad | 4 | Optativa A1; Optativa B1; Optativa A2; Optativa B2 |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MECANICA Y ELECTROMAGNETISMO | fm | excepción: Física básica, como en las reglas de ESCOM |
| FUNDAMENTOS ECONOMICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| FINANZAS EMPRESARIALES | integral | contexto: formación integral fuera del núcleo de negocios |
| METODOS CUANTITATIVOS PARA LA TOMA DE DECISIONES | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE SERVICIOS EN RED | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO DE HABILIDADES SOCIALES PARA LA ALTA DIRECCION | integral | contexto: formación integral fuera del núcleo de negocios |
| IT GOVERNANCE | integral | excepción: Gobierno de TI en ingeniería |
| COMPLEX SYSTEMS | comp | contexto: título ambiguo interpretado según la disciplina del plan |
| GESTION DE EMPRESAS DE ALTA TECNOLOGIA TEORIA PRACTICA T/H CREDITOS TEPIC HIGH TECHNOLOGY ENTERPRISE MANAGEMENT | integral | contexto: formación integral fuera del núcleo de negocios |
| ECONOMIC ENGINEERING | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.42. mapa-curricular-isistemascomputacionales-upiiz

Unidades académicas: UPIIZ. Año del plan: 2020. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-isistemascomputacionales-upiiz.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 9 | Matemáticas discreta; Cálculo; Algebra lineal; Análisis vectorial; Mecánica y electromagnetismo; Cálculo aplicado |
| comp: Computación | 24 | Fundamentos de programación; Alqoritmos y estructura de datos; Análisis y diseño de algoritmos; Paradíomas de programación; Teoría de la computación; Tecnologías para el desarrollo de aplicaciones web |
| datos: Ciencia de datos e IA | 10 | Bases de datos; Inteligencia artificial; Non-relational databases; Big data; Statistical tools for data analytics; Data mining |
| elec: Electrónica | 8 | Fundamentos de diseño digital; Circuitos eléctricos; Diseño de sistemas digitales; Electrónica analógica; Procesamiento digital de señales; Arquitectura de computadoras |
| ctrl: Control y automatización | 4 | Instrumentación y control; Virtual instrumentation; Virtual instrumentation applications; Cellular automata |
| redes: Telecomunicaciones | 3 | Redes de computadoras; Aplicaciones para comunicación en red; Sistemas distribuidos |
| bio: Ciencias biológicas | 1 | Genetic algorithms |
| integral: Humanidades y gestión | 12 | Comunicación oral y escrita; Ingeniería ética y sociedad; Fundamentos económicos; Finanzas empresariales; Métodos cuantitativos para la toma de decisiones; Administración de servicios en red |
| prof: Práctica profesional | 3 | Trabajo terminal I; Trabajo terminal II; Estancia profesional ** |
| esp: Especialidad | 4 | Optativa A1; Optativa B1; Optativa A2; Optativa B2 |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MECANICA Y ELECTROMAGNETISMO | fm | excepción: Física básica, como en las reglas de ESCOM |
| FUNDAMENTOS ECONOMICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| FINANZAS EMPRESARIALES | integral | contexto: formación integral fuera del núcleo de negocios |
| METODOS CUANTITATIVOS PARA LA TOMA DE DECISIONES | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE SERVICIOS EN RED | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO DE HABILIDADES SOCIALES PARA LA ALTA DIRECCION | integral | contexto: formación integral fuera del núcleo de negocios |
| IT GOVERNANCE | integral | excepción: Gobierno de TI en ingeniería |
| COMPLEX SYSTEMS | comp | contexto: título ambiguo interpretado según la disciplina del plan |
| HIGH TECHNOLOGY ENTERPRISE MANAGEMENT | integral | excepción: Gestión empresarial en ingeniería |
| ECONOMIC ENGINEERING | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.43. mapa-curricular-it-upiit-upiicsa

Unidades académicas: UPIICSA. Año del plan: 2021. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-it-upiit-upiicsa.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 10 | Fiundamentos matemáticos; Elementos del cálculo vectorial; Cálculo diferencial; Mecanica clásica; Cálculo integral; Probabilidad |
| comp: Computación | 2 | Dibujo asistido por computadora; Sistemas de información geográfica |
| datos: Ciencia de datos e IA | 1 | Programación y bases de datos |
| elec: Electrónica | 2 | Electromagnetismo; Laboratorio de electromagnetismo |
| integral: Humanidades y gestión | 27 | Responsabilidad social y ética; Comunicación profesional interdisciplinaria; Fundamentos de administración; Costos y presupuestos; Legislación para el transporte; Microeconomía |
| prof: Práctica profesional | 3 | Metodología de la ingeniería; Metodología de la investigación; Proyecto de titulación |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| mec: Mecánica y materiales | 3 | Laboratorio de mecanica clásica; Tecnología de vehículos y laboratorio; Modelos de reemplazo y mantenimiento |
| civil: Construcción y tierra | 1 | Proyecto de vías terrestres |
| amb: Ambiente y energía | 2 | Química energética y ambiental; Laboratorio de química energética y ambiental |
| ind: Operaciones y logística | 23 | Sistemas y la ingeniería en transporte; Sistema de transporte carretero; Sistema de transporte ferroviario; Sistema de transporte marítimo; Sistema de transporte aéreo; Sistema de transporte multimodal |
| soc: Ciencias sociales | 1 | Psicología del trabajo |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MECANICA CLASICA | fm | excepción: Física básica |
| FUNDAMENTOS DE ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| COSTOS Y PRESUPUESTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| LEGISLACION PARA EL TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| MICROECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION ESTRATEGICA PARA EL TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION Y SEGURIDAD DE PASAJEROS Y CARGA | integral | contexto: formación integral fuera del núcleo de negocios |
| MACROECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| CAPITAL HUMANO EN EMPRESAS DE TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANEACION DEL TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| CADENA DE SUMINISTRO, ALMACENES E INVENTARIOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ECONOMIA DE LA INGENIERIA | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION INTEGRAL DE PROYECTOS DE TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| DIRECCION Y OPERACION DE TERMINALES | integral | contexto: formación integral fuera del núcleo de negocios |
| DIRECCION Y OPERACION DE FLOTAS | integral | contexto: formación integral fuera del núcleo de negocios |
| MERCADOS INTERNACIONALES | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA II IMPLEMENTACION DE SISTEMAS DE GESTION PARA EL TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA III GOBIERNO CORPORATIVO | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I TRANSPORTE Y REGIONALIZACION ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA II ECONOMIA SOCIAL Y SU IMPACTO EN EL TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA III ECONOMIA DEL TRANSPORTE Y SUSTENTABILIDAD | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I DERECHO CORPORATIVO EN EL TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA II DERECHO DEL TRABAJO EN EL TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA III LEGISLACION ESPECIFICA PARA EL TRANSPORTE | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA II ADMINISTRACION DE LA DEMANDA | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA III SIMULACION DE SISTEMAS PARA LA DEMANDA | ind | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.44. mapa-curricular-it-upiita

Unidades académicas: UPIITA. Año del plan: 2009. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-it-upiita.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 11 | FUNDAMENTOS DE FÍSICA; ECUACIONES DIFERENCIALES; PROBABILIDAD; CÁLCULO DIFERENCIAL E INTEGRAL; VARIABLE COMPLEJA; ÁLGBERA LINEAL |
| comp: Computación | 10 | PROGRAMACIÓN; ANÁLISIS Y DISEÑO DE SISTEMAS; ESTRUCTURA DE DATOS; INGENIERÍA WEB; PROGRAMACIÓN AVANZADA; MULTIMEDIA |
| datos: Ciencia de datos e IA | 3 | BASES DE DATOS; BASES DE DATOS DISTRIBUIDAS; PROCESAMIENTO DE IMÁGENES |
| elec: Electrónica | 10 | DISEÑO DIGITAL; ARQUITECTURA DE COMPUTADORAS; ELECTROMAGNETISMO; SEÑALES Y SISTEMAS; ELECTRÓNICA; TEORÍA DE LOS CIRCUITOS |
| redes: Telecomunicaciones | 12 | TEORÍA DE LAS COMUNICACIONES; COMUNICACIONES DIGITALES; TELEFONÍA; SISTEMAS CELULARES; PROTOCOLOS DE INTERNET; SISTEMAS DISTRIBUIDOS |
| integral: Humanidades y gestión | 14 | ADMINISTRACIÓN DE SISTEMAS OPERATIVOS; ADMINISTRACIÓN ORGANIZACIONAL; ÉTICA, PROFESIÓN Y SOCIEDAD; COMUNICACIÓN ORAL Y ESCRITA; INGLÉS I; INGLÉS II |
| prof: Práctica profesional | 3 | METODOLOGÍA DE LA INVESTIGACIÓN; PROYECTO TERMINAL I; PROYECTO TERMINAL II |
| esp: Especialidad | 6 | OPTATIVA I; OPTATIVA II; ELECTIVA I; ELECTIVA II; ELECTIVA III; ELECTIVA IV |
| mec: Mecánica y materiales | 1 | PROPAGACIÓN DE ONDAS ELECTROMAGNÉTICAS |
| amb: Ambiente y energía | 1 | DESARROLLO SUSTENTABLE |
| ind: Operaciones y logística | 6 | REDES INTELIGENTES; SEGURIDAD EN REDES; REDES DE TELECOMUNICACIONES; REDES INALÁMBRICAS; REDES NEURONALES; SISTEMAS DE CALIDAD |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ADMINISTRACION DE SISTEMAS OPERATIVOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ALGBERA LINEAL | fm | excepción: Lectura OCR de álgebra; verificar original |
| ADMINISTRACION ORGANIZACIONAL | integral | contexto: formación integral fuera del núcleo de negocios |
| TELEFONIA | redes | contexto: título ambiguo interpretado según la disciplina del plan |
| SISTEMAS CELULARES | redes | contexto: título ambiguo interpretado según la disciplina del plan |
| PROTOCOLOS DE INTERNET | redes | contexto: título ambiguo interpretado según la disciplina del plan |
| INFORMACION FINANCIERA E INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| REDES INTELIGENTES | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| SEGURIDAD EN REDES | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION DE PROYECTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| LIDERAZGO Y EMPRENDEDORES | integral | contexto: formación integral fuera del núcleo de negocios |
| REDES DE TELECOMUNICACIONES | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| APLICACIONES DISTRIBUIDAS | redes | contexto: título ambiguo interpretado según la disciplina del plan |
| REDES INALAMBRICAS | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| REDES NEURONALES | ind | contexto: título ambiguo interpretado según la disciplina del plan |
| NORMATIVIDAD EN TELECOMUNICACIONES E INFORMATICA | integral | contexto: formación integral fuera del núcleo de negocios |
| PROCESAMIENTO DE VOZ | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| FILTRADO AVANZADO | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| ECONOMIA PARA INGENIEROS | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.45. mapa-curricular-ityf-esia-ticoman

Unidades académicas: ESIA. Año del plan: 2009. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-ityf-esia-ticoman.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 11 | FUNDAMENTOS MATEMÁTICOS; COSMOGRAFÍA Y ASTRONOMÍA DE POSICIÓN; GEOMETRÍA DESCRIPTIVA; ÓPTICA GEOMÉTRICA; CÁLCULO DE PROBABILIDADES Y TEORÍA DE LOS ERRORES; CÁLCULO DIFERENCIAL E INTEGRAL |
| comp: Computación | 3 | HERRAMIENTAS COMPUTACIONALES; SISTEMAS DE INFORMACIÓN GEOGRÁFICA; SISTEMAS DE INFORMACIÓN GEOGRÁFICA APLICADOS |
| datos: Ciencia de datos e IA | 2 | PROCESAMIENTO DIGITAL DE IMÁGENES; ANÁLISIS DE DATOS GEOGRÁFICOS |
| elec: Electrónica | 1 | MANEJO E INTERPRETACIÓN DE MAQUETAS ELECTRÓNICAS |
| bio: Ciencias biológicas | 1 | ECOLOGÍA |
| integral: Humanidades y gestión | 10 | DESARROLLO PROFESIONAL Y ÉTICO; LEGISLACIÓN TOPOGRÁFICA; SOLUCIÓN DE PROBLEMAS Y CREATIVIDAD; TRABAJO EN EQUIPO Y LIDERAZGO; INGENIERÍA ECONÓMICA; FORMULACIÓN Y EVALUACIÓN DE PROYECTOS |
| prof: Práctica profesional | 3 | INTRODUCCIÓN A LA INGENIERÍA TOPOGRÁFICA; PROYECTO TERMINAL 1; PROYECTO TERMINAL 2 |
| esp: Especialidad | 4 | OPTATIVA A; OPTATIVA B; OPTATIVA C; OPTATIVA D |
| civil: Construcción y tierra | 34 | DISENO ASISTIDO; HIDRÁULICA; PLANIMETRÍA Y ALTIMETRÍA; AGRODESIA Y DISTRITOS DE RIEGO; CARTOGRAFÍA; FUNDAMENTOS DE PERCEPCIÓN REMOTA |
| amb: Ambiente y energía | 2 | DESARROLLO SUSTENTABLE; METEOROLOGÍA FÍSICA |
| ind: Operaciones y logística | 2 | SEGURIDAD INDUSTRIAL; NORMAS Y ESTÁNDARES DE CALIDAD |
| salud: Ciencias de la salud | 1 | GEOLOGÍA Y GEOMORFOLOGÍA |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| DISENO ASISTIDO | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| LEGISLACION TOPOGRAFICA | integral | contexto: formación integral fuera del núcleo de negocios |
| HIDROMENSURA | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| LOCALIZACION Y TRAZO DE VIAS DE COMUNICACION | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| VIAS DE COMUNICACION TERRESTRE | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| HIDROGRAFIA | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| PLANIFICACION URBANA Y REGIONAL | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| RECURSOS ECONOMICOS DE MEXICO | integral | contexto: formación integral fuera del núcleo de negocios |
| ORDENAMIENTO DEL TERRITORIO | civil | contexto: título ambiguo interpretado según la disciplina del plan |
| COSTOS Y PRESUPUESTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ANALISIS DE RIESGO | civil | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.46. mapa-curricular-la-enba

Unidades académicas: ENBA. Año del plan: 2019. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-la-enba.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 1 | Métodos estadísticos |
| integral: Humanidades y gestión | 17 | Derechos humanos; Proceso administrativo; Administración pública; Trabajo en equipo y liderazgo; Marco jurídico para la administración de archivos; Administración de recursos en los archivos |
| prof: Práctica profesional | 1 | Seminario de investigación |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| amb: Ambiente y energía | 1 | Taller de preservación y conservación de documentos |
| soc: Ciencias sociales | 4 | Metodología de las ciencias sociales; Historia de las instituciones en México siglos del XVI al XVIII; Historia de las instituciones en México siglos XIX y XX; Sistemas institucionales de archivo |
| info: Información y documentación | 21 | Fundamentos de archivonomía; Soportes de la información; Desarrollo de sistemas de clasificación; Gestión documental y archivo de trámite; Investigación documental; Archivo de concentración |
| sin_categoria: Sin categoría | 1 | Teoría general de sistemas |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| DERECHOS HUMANOS | integral | contexto: formación integral fuera del núcleo de negocios |
| PROCESO ADMINISTRATIVO | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION PUBLICA | integral | contexto: formación integral fuera del núcleo de negocios |
| SOPORTES DE LA INFORMACION | info | contexto: título ambiguo interpretado según la disciplina del plan |
| DESARROLLO DE SISTEMAS DE CLASIFICACION | info | contexto: título ambiguo interpretado según la disciplina del plan |
| MARCO JURIDICO PARA LA ADMINISTRACION DE ARCHIVOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE RECURSOS EN LOS ARCHIVOS | integral | contexto: formación integral fuera del núcleo de negocios |
| CULTURA ORGANIZACIONAL Y COMUNICACION | integral | contexto: formación integral fuera del núcleo de negocios |
| INVESTIGACION DE CAMPO | info | contexto: título ambiguo interpretado según la disciplina del plan |
| DESCRIPCION DE ARCHIVOS ADMINISTRATIVOS | integral | contexto: formación integral fuera del núcleo de negocios |
| USUARIOS DE LA INFORMACION | info | contexto: título ambiguo interpretado según la disciplina del plan |
| POLITICAS NACIONALES E INTERNACIONALES PARA LA ADMINISTRACION DE | integral | contexto: formación integral fuera del núcleo de negocios |
| TRANSPARENCIA Y ACCESO A LA INFORMACION | info | contexto: título ambiguo interpretado según la disciplina del plan |
| DIAGNOSTICO Y AUDITORIA ARCHIVISTICA | integral | contexto: formación integral fuera del núcleo de negocios |
| ORGANIZACION DE ARCHIVOS | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION DE DOCUMENTOS ELECTRONICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| MERCADOLECNIA DE LOS SERVICIOS ARCHIVISTICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| SISTEMAS INFORMATICOS PARA LA GESTION DE LOS ARCHIVOS | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION DE PROYECTOS ARCHIVISTICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| TECNICAS DE MIGRACION Y PRESERVACION DIGITAL | info | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.47. mapa-curricular-ladministracionydesarrolloempresarial-esca-ust

Unidades académicas: ESCA. Año del plan: 2024. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-ladministracionydesarrolloempresarial-esca-ust.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 1 | ESTADÍSTICA APLICADA |
| comp: Computación | 2 | TECNOLOGÍAS DE INFORMACIÓN Y COMUNICACIÓN; Herramientas digitales básicas |
| datos: Ciencia de datos e IA | 1 | Taller de análisis de datos |
| ctrl: Control y automatización | 1 | Evaluación y control estratégico |
| integral: Humanidades y gestión | 7 | COMUNICACIÓN ORAL Y ESCRITA; SOLUCIÓN DE PROBLEMAS Y CREATIVIDAD; LIDERAZGO EN EQUIPOS DE ALTO DESEMPEÑO; Habilidades para la comunicación; Comportamiento humano en el trabajo; Communication impact in organizations * |
| prof: Práctica profesional | 5 | SEMINARIO DE INVESTIGACIÓN; SEMINARIO DE INVESTIGACIÓN APLICADA; Habilidades para la investigación; Seminario de investigación; Seminario de investigación aplicada |
| esp: Especialidad | 8 | OPTATIVA A; OPTATIVA B; OPTATIVA C; ELECTIVA; Optativa I; Optativa II |
| amb: Ambiente y energía | 2 | DESARROLLO SUSTENTABLE; Desarrollo sustentable |
| ind: Operaciones y logística | 6 | NORMAS DE ESTANDARIZACIÓN; ADMINISTRACIÓN DE LA PRODUCCIÓN**; INVESTIGACIÓN DE OPERACIONES**; Normalización y evaluación de la conformidad; Investigación de operaciones; Administración de operaciones |
| adm: Administración y negocios | 90 | FUNDAMENTOS DE ECONOMÍA; FUNDAMENTOS DE ADMINISTRACIÓN; FUNDAMENTOS DE CONTABILIDAD; FUNDAMENTOS DE MERCADOTECNIA; FUNDAMENTOS DE DERECHO; MATEMÁTICAS PARA NEGOCIOS |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| FUNDAMENTOS DE ECONOMIA | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE ADMINISTRACION | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE CONTABILIDAD | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE MERCADOTECNIA | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE DERECHO | adm | contexto: núcleo de negocios |
| MATEMATICAS PARA NEGOCIOS | adm | contexto: núcleo de negocios |
| DERECHO MERCANTIL | adm | contexto: núcleo de negocios |
| THE MEXICAN ECONOMY IN THE GLOBAL CONTEXT* ** | adm | contexto: núcleo de negocios |
| SISTEMAS DE INFORMACION ADMINISTRATIVOS | adm | contexto: núcleo de negocios |
| RESPONSABILIDAD SOCIAL Y ETICA EN LOS NEGOCIOS | adm | contexto: núcleo de negocios |
| MATEMATICAS FINANCIERAS | adm | contexto: núcleo de negocios |
| COSTOS | adm | contexto: núcleo de negocios |
| PLAN DE VIDA Y CARRERA DEL EMPRENDEDOR | adm | contexto: núcleo de negocios |
| ADMINISTRACION DEL CAPITAL HUMANO | adm | contexto: vocabulario disciplinar de negocios y economía |
| TECNICAS DE ORGANIZACION | adm | contexto: núcleo de negocios |
| ADMINISTRACION DE VENTAS | adm | contexto: núcleo de negocios |
| DERECHO LABORAL | adm | contexto: núcleo de negocios |
| EMPRENDIMIENTO | adm | contexto: núcleo de negocios |
| ADMINISTRACION FINANCIERA DE EMPRESAS ** | adm | contexto: núcleo de negocios |
| STRATEGIC MANAGEMENT* ** | adm | contexto: vocabulario disciplinar de negocios y economía |
| MAIN INTERNATIONAL ECONOMIES* | adm | contexto: núcleo de negocios |
| EMPRESAS FAMILIARES | adm | contexto: núcleo de negocios |
| ADMINISTRACION DE PROYECTOS DE INVERSION | adm | contexto: núcleo de negocios |
| FISCAL | adm | contexto: núcleo de negocios |
| ANALYSIS OF MANAGEMENT MEGATRENDS* | adm | contexto: vocabulario disciplinar de negocios y economía |
| ADMINISTRACION DE LAS REMUNERACIONES | adm | contexto: vocabulario disciplinar de negocios y economía |
| STRATEGIC MARKETING MANAGEMENT* ** | adm | contexto: vocabulario disciplinar de negocios y economía |
| DECISION MAKING AND NEGOTIATION* | adm | contexto: vocabulario disciplinar de negocios y economía |
| BUSINESS ENGLISH* | adm | contexto: vocabulario disciplinar de negocios y economía |
| ADMINISTRACION DE PYMES | adm | contexto: núcleo de negocios |
| AUDITORIA ADMINISTRATVA | adm | contexto: núcleo de negocios |
| PLAN DE NEGOCIOS | adm | contexto: núcleo de negocios |
| ECONOMIA DE LA EMPRESA | adm | contexto: núcleo de negocios |
| PENSAMIENTO INNOVADOR Y TOMA DE DECISIONES | adm | contexto: núcleo de negocios |
| INTRODUCCION A LA ADMINISTRACION | adm | contexto: núcleo de negocios |
| DERECHO DE LAS ORGANIZACIONES | adm | contexto: núcleo de negocios |
| MACROECONOMIA | adm | contexto: núcleo de negocios |
| TECNICAS Y HABILIDADES COMERCIALES | adm | contexto: núcleo de negocios |
| DERECHO APLICADO A LAS ORGANIZACIONES | adm | contexto: núcleo de negocios |
| INTRODUCCION A LAS FINANZAS | adm | contexto: núcleo de negocios |
| ADMINISTRACION FINANCIERA | adm | contexto: núcleo de negocios |
| BUSINESS ENGLISH * | adm | contexto: vocabulario disciplinar de negocios y economía |
| ESTADISTICA APLICADA A LOS NEGOCIOS | adm | contexto: núcleo de negocios |
| ADMINISTRACION ESTRATEGICA | adm | contexto: núcleo de negocios |
| MERCADOTECNIA ESTRATEGICA | adm | contexto: núcleo de negocios |
| ADMINISTRACION DE REMUNERACIONES | adm | contexto: vocabulario disciplinar de negocios y economía |
| EVALUACION DE PROYECTOS DE INVERSION | adm | contexto: núcleo de negocios |
| ADMINISTRACION COMERCIAL | adm | contexto: núcleo de negocios |
| AUDITORIA ADMINISTRATIVA | adm | contexto: núcleo de negocios |
| DATA MANAGEMENT ANALYSYS * | adm | contexto: vocabulario disciplinar de negocios y economía |
| THE MEXICAN ECONOMY IN THE GLOBAL CONTEXT * | adm | contexto: núcleo de negocios |
| DISENJO DE LA INTERVENCION EMPRESARIAL | adm | contexto: núcleo de negocios |
| DECISION MAKING AND NEGOTIATION * | adm | contexto: vocabulario disciplinar de negocios y economía |
| TALLER DE FORMACION EJECUTIVA DEL EMPRENDEDOR | adm | contexto: núcleo de negocios |
| GLOBAL ENTREPRENEURSHIP * | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA I MERCADOTECNIA ECOLOGICA | adm | contexto: núcleo de negocios |
| OPTATIVA II MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| OPTATIVA III POLITICAL MARKETING * | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA I TENDENCIAS EN LA GESTION DE RECURSOS HUMANOS | adm | contexto: núcleo de negocios |
| OPTATIVA II TALLER DE RECLUTAMIENTO Y SELECCION | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA III PERFORMANCE ASSESSMENT AND JOB EVALUATION WORKSHOP * | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA I ANALISIS DE MERCADOS FINANCIEROS | adm | contexto: núcleo de negocios |
| OPTATIVA II ADMINISTRACION DE RIESGOS | adm | contexto: núcleo de negocios |
| OPTATIVA III GREEN FINANCE * | adm | contexto: núcleo de negocios |
| OPTATIVA I TALLER DE EMPRENDIMIENTO DIGITAL | adm | contexto: núcleo de negocios |
| OPTATIVA II TALLER DE INNOVACION EMPRESARIAL | adm | contexto: núcleo de negocios |
| OPTATIVA III BUSINESS GLOBALIZATION * | adm | contexto: vocabulario disciplinar de negocios y economía |
| CULTURA FINANCIERA EN LAS ORGANIZACIONES | adm | contexto: núcleo de negocios |
| ADMINISTRACION SUSTENTABLE | adm | contexto: núcleo de negocios |
| ESTUDIO DE BLOQUES ECONOMICOS | adm | contexto: núcleo de negocios |
| ADMINISTRACION PUBLICA Y SEGURIDAD DE LA INFORMACION | adm | contexto: núcleo de negocios |
| ANALISIS DE MERCADOS DE CAPITALES | adm | contexto: vocabulario disciplinar de negocios y economía |
| PLANEACION, INNOVACION E INICIATIVAS SUSTENTABLES | adm | contexto: núcleo de negocios |
| EXPORTACION E IMPORTACION | adm | contexto: vocabulario disciplinar de negocios y economía |
| FINANZAS PUBLICAS | adm | contexto: núcleo de negocios |
| ADMINISTRACION DEL CAPITAL DE TRABAJO EN LAS PYMES | adm | contexto: vocabulario disciplinar de negocios y economía |
| DIRECCION ESTRATEGICA | adm | contexto: núcleo de negocios |
| MERCADOTECNIA INTERNACIONAL EN LOS NEGOCIOS | adm | contexto: núcleo de negocios |
| ADQUISICIONES GUBERNAMENTALES | adm | contexto: vocabulario disciplinar de negocios y economía |

### 4.48. mapa-curricular-lai-upiicsa

Unidades académicas: UPIICSA. Año del plan: 2021. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-lai-upiicsa.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 4 | Cálculo diferencial; Probabilidad; Estadística; Álgebra lineal |
| comp: Computación | 1 | Tecnologías de información |
| ctrl: Control y automatización | 1 | Control de los procesos |
| proc: Ingeniería de procesos | 4 | Procesos industriales; Laboratorio de procesos industriales; Aplicación de procesos industriales; Laboratorio de aplicación de procesos industriales |
| integral: Humanidades y gestión | 3 | Habilidades del pensamiento; Comunicación profesional interdisciplinaria; Responsabilidad social y ética |
| prof: Práctica profesional | 1 | Metodología de la investigación |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| mec: Mecánica y materiales | 2 | Sistemas de fabricación; Procesos de manufactura |
| ind: Operaciones y logística | 2 | Modelos determinísticos de investigación de operaciones; Modelos estocásticos de investigación de operaciones |
| salud: Ciencias de la salud | 1 | Seguridad y salud en el trabajo y sistemas ambientales |
| adm: Administración y negocios | 48 | Fundamentos de administración; Bases de la información financiera; Derecho mercantil; Sistema de recursos humanos; Sistemas y estructuras organizacionales; Costos aplicados a la industria |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| FUNDAMENTOS DE ADMINISTRACION | adm | contexto: núcleo de negocios |
| BASES DE LA INFORMACION FINANCIERA | adm | contexto: núcleo de negocios |
| DERECHO MERCANTIL | adm | contexto: núcleo de negocios |
| SISTEMA DE RECURSOS HUMANOS | adm | contexto: núcleo de negocios |
| SISTEMAS Y ESTRUCTURAS ORGANIZACIONALES | adm | contexto: núcleo de negocios |
| COSTOS APLICADOS A LA INDUSTRIA | adm | contexto: núcleo de negocios |
| INTEGRACION Y MATEMATICAS FINANCIERAS | adm | contexto: núcleo de negocios |
| DERECHO DEL TRABAJO Y DE LA SEGURIDAD SOCIAL | adm | contexto: núcleo de negocios |
| MARKETING | adm | contexto: vocabulario disciplinar de negocios y economía |
| MICROECONOMIA APLICADA | adm | contexto: núcleo de negocios |
| COMPORTAMIENTO ORGANIZACIONAL | adm | contexto: núcleo de negocios |
| CONTABILIDAD ADMINISTRATIVA | adm | contexto: núcleo de negocios |
| DERECHO FISCAL | adm | contexto: núcleo de negocios |
| ENTORNO MACROECONOMICO Y APLICACIONES A LA EMPRESA | adm | contexto: núcleo de negocios |
| CONTROL ADMINISTRATIVO | adm | contexto: núcleo de negocios |
| PRESUPUESTOS | adm | contexto: núcleo de negocios |
| INFORMATICA ADMINISTRATIVA | adm | contexto: núcleo de negocios |
| RECURSOS HUMANOS E INNOVACION | adm | contexto: núcleo de negocios |
| PLANEACION ESTRATEGICA | adm | contexto: núcleo de negocios |
| ESTUDIO Y APLICACION DE LOS IMPUESTOS | adm | contexto: vocabulario disciplinar de negocios y economía |
| ESTRUCTURA ECONOMICA DE LA PRODUCCION | adm | contexto: núcleo de negocios |
| DESARROLLO DEL TALENTO HUMANO | adm | contexto: vocabulario disciplinar de negocios y economía |
| GENERACION E INNOVACION DE NEGOCIOS | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE FINANZAS CORPORATIVAS | adm | contexto: núcleo de negocios |
| PLANEACION Y CONTROL DE INVENTARIOS | adm | contexto: núcleo de negocios |
| SISTEMAS DE GESTION | adm | contexto: núcleo de negocios |
| GESTION DE TECNOLOGIA E INNOVACION | adm | contexto: núcleo de negocios |
| DIRECCION DE MARKETING | adm | contexto: vocabulario disciplinar de negocios y economía |
| PLANEACION Y CONTROL MAESTRO DE PRODUCCION | adm | contexto: núcleo de negocios |
| EVALUACION FINANCIERA | adm | contexto: núcleo de negocios |
| INVESTIGACION Y ANALISIS DE MERCADO | adm | contexto: núcleo de negocios |
| DISENO Y DOCUMENTACION DE SISTEMAS DE GESTION | adm | contexto: núcleo de negocios |
| DISENO DE SISTEMAS DE REMUNERACIONES | adm | contexto: vocabulario disciplinar de negocios y economía |
| PRINCIPIOS Y APLICACIONES DE LOS NEGOCIOS INTERNACIONALES | adm | contexto: núcleo de negocios |
| DIRECCION ESTRATEGICA | adm | contexto: núcleo de negocios |
| EMPRENDIMIENTO DE EMPRESAS ECONOMICAMENTE PRODUCTIVAS | adm | contexto: núcleo de negocios |
| MODELOS DE GESTION DE CAPITAL INTELECTUAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| AUDITORIA A SISTEMAS DE GESTION | adm | contexto: núcleo de negocios |
| CONSULORIA | adm | contexto: vocabulario disciplinar de negocios y economía |
| ADMINISTRACION TEORIA PRACTICA T/H CREDITOS OPTATIVA I LIDERAZGO EMPRESARIAL Y RESPONSABILIDAD SOCIAL | adm | contexto: núcleo de negocios |
| OPTATIVA II ADMINISTRACION DE PYMES | adm | contexto: núcleo de negocios |
| OPTATIVA III MARKETING CORPORATIVO | adm | contexto: vocabulario disciplinar de negocios y economía |
| CONTABILIDAD Y FINANZAS TEORIA PRACTICA T/H CREDITOS OPTATIVA I GESTION DE RIESGOS | adm | contexto: núcleo de negocios |
| OPTATIVA II FINANZAS BURSATILES | adm | contexto: núcleo de negocios |
| OPTATIVA III FINANCIAMIENTO EMPRESARIAL | adm | contexto: núcleo de negocios |
| RECURSOS HUMANOS TEORIA PRACTICA T/H CREDITOS OPTATIVA I PLANEACION INTEGRAL DE RECURSOS HUMANOS | adm | contexto: núcleo de negocios |
| OPTATIVA II MEDICION DEL CAPITAL HUMANO | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA III GESTION DE CAPITAL HUMANO EN ORGANIZACIONES COMPLEJAS | adm | contexto: vocabulario disciplinar de negocios y economía |

### 4.49. mapa-curricular-lb-enba

Unidades académicas: ENBA. Año del plan: 2019. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-lb-enba.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 1 | Métodos estadísticos |
| datos: Ciencia de datos e IA | 2 | Big data |
| integral: Humanidades y gestión | 13 | Introducción a la organización de la información; Introducción a la administración; Trabajo en equipo y liderazgo; Introducción a la biblioteconomía; Administración del factor humano; Cultura organizacional y comunicación |
| prof: Práctica profesional | 2 | Metodología de la investigación; Seminario de investigación |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| mec: Mecánica y materiales | 2 | Materiales audiovisuales |
| soc: Ciencias sociales | 2 | Historia de la cultura escrita; Alfabetización informacional |
| info: Información y documentación | 41 | Servicios bibliotecarios y de información; Catalogación descriptiva; Fuentes de información; Historia del libro y las bibliotecas; Investigación documental; Bibliografía |
| sin_categoria: Sin categoría | 1 | Teoria general de sistemas |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| INTRODUCCION A LA ORGANIZACION DE LA INFORMACION | integral | contexto: formación integral fuera del núcleo de negocios |
| INTRODUCCION A LA ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| INTRODUCCION A LA BIBLIOTECONOMIA | integral | contexto: formación integral fuera del núcleo de negocios |
| FUENTES DE INFORMACION | info | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION DEL FACTOR HUMANO | integral | contexto: formación integral fuera del núcleo de negocios |
| CULTURA ORGANIZACIONAL Y COMUNICACION | integral | contexto: formación integral fuera del núcleo de negocios |
| LENGUAJES DE ACCESO A LA INFORMACION | info | contexto: título ambiguo interpretado según la disciplina del plan |
| SERVICIO DE CONSULTA Y RECUPERACION DE INFORMACION | info | contexto: título ambiguo interpretado según la disciplina del plan |
| INDUSTRIA DE LA INFORMACION | info | contexto: título ambiguo interpretado según la disciplina del plan |
| INVESTIGACION DE CAMPO | info | contexto: título ambiguo interpretado según la disciplina del plan |
| SISTEMA DE CLASIFICACION L C | info | contexto: título ambiguo interpretado según la disciplina del plan |
| ESTUDIOS DE USUARIOS | info | contexto: título ambiguo interpretado según la disciplina del plan |
| PLANEACION ESTRATEGICA DE LAS UNIDADES DE INFORMACION | integral | contexto: formación integral fuera del núcleo de negocios |
| DERECHOS HUMANOS | integral | contexto: formación integral fuera del núcleo de negocios |
| SISTEMA DE CLASIFICACION DECIMAL DEWEY | info | contexto: título ambiguo interpretado según la disciplina del plan |
| SERVICIOS ESPECIALIZADOS Y TIC | info | contexto: título ambiguo interpretado según la disciplina del plan |
| SELECCION Y ADQUISICION | info | contexto: título ambiguo interpretado según la disciplina del plan |
| MERCADOTECNIA DE LOS SERVICIOS DE INFORMACION | integral | contexto: formación integral fuera del núcleo de negocios |
| TENDENCIAS EN LA ORGANIZACION DE LA INFORMACION | integral | contexto: formación integral fuera del núcleo de negocios |
| DISENO DE PROYECTOS | info | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.50. mapa-curricular-lb-encb

Unidades académicas: ENCB. Año del plan: 2020. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-lb-encb.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 2 | MATEMÁTICAS; FISICA |
| comp: Computación | 1 | SISTEMAS DE INFORMACIÓN GEOGRÁFICA APLICADOS A LA BIOLOGÍA |
| bio: Ciencias biológicas | 53 | INTRODUCIÓN A LA BIOLOGÍA; TAXONOMÍA BIOLÓGICA; FUNDAMENTOS DE BIOQUÍMICA; BIOLOGÍA CELULAR; BIOQUÍMICA; MICROBIOLOGÍA GENERAL |
| quim: Química | 4 | QUÍMICA INORGÁNICA; QUÍMICA ORGÁNICA; MODELOS FISICOQUÍMICOS; ANÁLISIS QUÍMICO DE SUELOS Y AGUAS |
| integral: Humanidades y gestión | 6 | BIOÉTICA; ESTRATEGIAS DE APRENDIZAJE Y DESARROLLO HUMANO; COMUNICACIÓN ORAL Y ESCRITA EN BIOLOGÍA; LEGISLACIÓN Y PROTECCIÓN AMBIENTAL; GESTIÓN DE PROYECTO; ECOLOGÍA E IMPACTO ECONÓMICO DEL FITOPLANCTON |
| prof: Práctica profesional | 3 | PROYECTO DE TITULACIÓN I; PROYECTO DE TITULACIÓN II; PROYECTO DE TITULACIÓN III |
| esp: Especialidad | 6 | OPTATIVA I; OPTATIVA II; OPTATIVA III; OPTATIVA IV; OPTATIVA V; OPTATIVA VI |
| civil: Construcción y tierra | 4 | CIENCIAS DE LA TIERRA; BIOGEOGRAFÍA; GEOLOGÍA; PALEONTOLOGÍA |
| amb: Ambiente y energía | 3 | RECURSOS NATURALES; DESARROLLO SUSTENTABLE; METEOROLOGÍA Y CLIMATOLOGÍA |
| salud: Ciencias de la salud | 9 | HISTOLOGÍA Y ORGANOGRAFÍA DE LAS PLANTAS; HISTOLOGÍA ANIMAL; FÍSIOLOGÍA GENERAL; FISIOLOGÍA VEGETAL; FISIOLOGÍA ANIMAL COMPARADA; ANATOMÍA DE MADERAS |
| info: Información y documentación | 1 | MANEJO DE COLECCIONES BIOLÓGICAS |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| BIOQUIMICA | bio | excepción: Área biológica del catálogo vigente |
| LEGISLACION Y PROTECCION AMBIENTAL | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION DE PROYECTO | integral | contexto: formación integral fuera del núcleo de negocios |
| ECOLOGIA E IMPACTO ECONOMICO DEL FITOPLANCTON | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.51. mapa-curricular-lcd-escom-upiig-upiit-upiic

Unidades académicas: No indicada. Año del plan: No indicado en la entrada. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-lcd-escom-upiig-upiit-upiic.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 9 | Matemáticas discretas; Cáliculo; Algebra lineal; Cáliculo multivariable; Probabilidad; Métodos numéricos |
| comp: Computación | 8 | Fundamentos de programación; Análisis y diseño de algoritmos; Desarrollo de aplicaciones web; Cómputo de alto desempeño; Bioinformática básica; Bioinformática avanzada |
| datos: Ciencia de datos e IA | 20 | Introducción a la ciencia de datos; Programación para ciencia de datos; Bases de datos; Desarrollo de aplicaciones para análisis de datos; Bases de datos avanzadas; Aprendizaje de máquina e inteligencia artificial |
| integral: Humanidades y gestión | 11 | Comunicación oral y escrita; Etica y legalidad; Fundamentos económicos; Finanzas empresariales; Liderazgo personal; Modelos econométicos |
| prof: Práctica profesional | 4 | Metodología de la investigación y divulgación científica; Trabajo terminal I; Trabajo terminal II; Estancia profesional |
| esp: Especialidad | 4 | Optativa A; Optativa B; Optativa C; Optativa D |
| civil: Construcción y tierra | 1 | Algoritmos y estructuras de datos |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| FUNDAMENTOS ECONOMICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| FINANZAS EMPRESARIALES | integral | contexto: formación integral fuera del núcleo de negocios |
| MODELOS ECONOMETICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE PROYECTOS DE TI | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO DE HABILIDADES SOCIALES PARA LA ALTA DIRECCION | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| INNOVACION Y EMPRENDIMIENTO TECNOLOGICO | integral | contexto: formación integral fuera del núcleo de negocios |
| PROPIEDAD INTELECTUAL | integral | contexto: formación integral fuera del núcleo de negocios |
| SIMULACION BASICA | datos | contexto: título ambiguo interpretado según la disciplina del plan |
| SIMULACION AVANZADA | datos | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.52. mapa-curricular-lcfp-esca-ut

Unidades académicas: ESCA. Año del plan: 2017. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/no-escolarizado/mapa-curricular-lcfp-esca-ut.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| integral: Humanidades y gestión | 1 | Progreso social y desarrollo humano |
| prof: Práctica profesional | 1 | Seminario de investigación aplicada |
| esp: Especialidad | 1 | Optativa |
| adm: Administración y negocios | 26 | Planeación y educación financiera personal; Planeación financiera en las entidades económicas; Planeación y gestión gubernamental; Administración pública y participación urbana; El servidor público en la gestión gubernamental; Naturaleza de las finanzas públicas |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| PLANEACION Y EDUCACION FINANCIERA PERSONAL | adm | contexto: núcleo de negocios |
| PLANEACION FINANCIERA EN LAS ENTIDADES ECONOMICAS | adm | contexto: núcleo de negocios |
| PLANEACION Y GESTION GUBERNAMENTAL | adm | contexto: núcleo de negocios |
| ADMINISTRACION PUBLICA Y PARTICIPACION URBANA | adm | contexto: núcleo de negocios |
| EL SERVIDOR PUBLICO EN LA GESTION GUBERNAMENTAL | adm | contexto: núcleo de negocios |
| NATURALEZA DE LAS FINANZAS PUBLICAS | adm | contexto: núcleo de negocios |
| PLANEACION, PROGRAMACION, Y PRESUPUESTO FEDERAL, ESTATAL Y MUNICIPIO | adm | contexto: núcleo de negocios |
| CONTABILIDAD GUBERNAMENTAL | adm | contexto: núcleo de negocios |
| INSTRUMENTOS PARA EL REGISTRO CONTABLE DE LAS ENTIDADES GUBERNAME | adm | contexto: núcleo de negocios |
| RECONOCIMIENTO CONTABLE EN LAS ENTIDADES GUBERNAMENTALES | adm | contexto: núcleo de negocios |
| EJERCICIO PRESUPUESTAL, FEDERAL, ESTATAL Y MUNICIPAL | adm | contexto: núcleo de negocios |
| ADMINISTRACION DE RIESGOS | adm | contexto: núcleo de negocios |
| INTEGRACION DE LA CUOTA ANUAL DE LA HACIENDA PUBLICA | adm | contexto: vocabulario disciplinar de negocios y economía |
| INDICADORES DE DESEMPENO Y EVALUACION DE LA GESTION GUBERNAMEN | adm | contexto: núcleo de negocios |
| ASIGNACION DE RECURSOS FEDERALES A LOS ESTADOS Y MUNICIPIOS | adm | contexto: vocabulario disciplinar de negocios y economía |
| TRANSPARTENCIA Y RENDICION DE CUENTAS | adm | contexto: vocabulario disciplinar de negocios y economía |
| AUDITORIA GUBERNAMENTAL | adm | contexto: núcleo de negocios |
| CONTRIBUCIONES FISCALES | adm | contexto: vocabulario disciplinar de negocios y economía |
| DIRECCION ESTRATEGICA | adm | contexto: núcleo de negocios |
| GESTION DE RECURSOS Y ALTERNATIVAS DE FINANCIAMIENTO | adm | contexto: núcleo de negocios |
| TECNICAS CUANTITATIVAS PARA EL ANALISIS FINANCIERO | adm | contexto: núcleo de negocios |
| TECNICAS CUALITATIVAS PARA EL ANALISIS FINANCIERO | adm | contexto: núcleo de negocios |

### 4.53. mapa-curricular-lcienciasdelainformatica-upiicsa

Unidades académicas: UPIICSA. Año del plan: 2021. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-lcienciasdelainformatica-upiicsa.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 5 | Matemáticas discretas; Cálculo diferencial e integral; Probabilidad; Algebra lineal; Estadística |
| comp: Computación | 19 | Lóqica de programación; Teoria informática; Programación orientada a objetos; Herramientas multimedia; Buenas prácticas de software; Algoritmos computacionales |
| datos: Ciencia de datos e IA | 7 | Abstracción y uso de datos; Diseño de bases de datos; Sistemas manejadores de bases de datos; Analítica de datos; OPTATIVA I BIG DATA; OPTATIVA II Bases de datos no SQL |
| elec: Electrónica | 1 | Sistemas digitales |
| redes: Telecomunicaciones | 3 | Comunicación de datos; Redes y conectividad; Redes y simulación |
| integral: Humanidades y gestión | 24 | Arquitectura y organización de las computadoras; Responsabilidad social y ética; Comunicación profesional interdisciplinaria; Fundamentos de administración; Aplicaciones de la ciencia económica; Contabilidad y costos |
| prof: Práctica profesional | 2 | Metodología de la investigación; Proyecto terminal |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| civil: Construcción y tierra | 1 | Construcción de software |
| amb: Ambiente y energía | 1 | Diseño de ambientes ubicos |
| ind: Operaciones y logística | 1 | Modelos determinísticos de investigación de operaciones |
| soc: Ciencias sociales | 1 | Psicológia en el trabajo |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ARQUITECTURA Y ORGANIZACION DE LAS COMPUTADORAS | integral | contexto: formación integral fuera del núcleo de negocios |
| FUNDAMENTOS DE ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| APLICACIONES DE LA CIENCIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| CONTABILIDAD Y COSTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| REDES Y SIMULACION | redes | contexto: título ambiguo interpretado según la disciplina del plan |
| FINANZAS | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION ESTRATEGICA | integral | contexto: formación integral fuera del núcleo de negocios |
| MARKETING DIGITAL | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION INFORMATICA | integral | contexto: formación integral fuera del núcleo de negocios |
| LEGISLACION INFORMATICA | integral | contexto: formación integral fuera del núcleo de negocios |
| LIDERAZGO Y DESARROLLO DIRECTIVO | integral | contexto: formación integral fuera del núcleo de negocios |
| AUDITORIA DE TI | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION DE SERVICIOS DE TI | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO EMPRENDEDOR | integral | contexto: formación integral fuera del núcleo de negocios |
| ARQUITECTURA DE LAS ORGANIZACIONES | integral | contexto: formación integral fuera del núcleo de negocios |
| AUDITORIA DE SEGURIDAD | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION DE PROVECTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| MODELOS DE GESTION INFORMATICA | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I RECURSOS HUMANOS Y CAPITAL INTELECTUAL | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA III 4A REVOLUCION INDUSTRIAL Y LA ECONOMIA DIGITAL | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.54. mapa-curricular-le-ese

Unidades académicas: ESE. Año del plan: 2011. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-le-ese.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 5 | ALGEBRA LINEAL; ESTADISTICA Y PROBABILIDAD; ESTADISTICA INFERENCIAL; OPTIMIZACIÓN DINÁMICA; TEORÍA DE JUEGOS |
| datos: Ciencia de datos e IA | 1 | SERIES DE TIEMPO |
| ctrl: Control y automatización | 1 | SISTEMAS DINÁMICOS |
| integral: Humanidades y gestión | 4 | ESTADO Y SOCIEDAD; INGLES PARA ECONOMÍA II; INGLES PARA ECONOMÍA I; FORMULACIÓN Y EVALUACIÓN DE PROYECTOS |
| prof: Práctica profesional | 4 | METODOLOGÍA DE LA CIENCIA ECONOMÍCA; INVESTIGACIÓN APLICADA; PROYECTO DE INVESTIGACIÓN Y DESARROLLO; PRESENTACIÓN DE RESULTADOS DEL PROYECTO DE INVESTIGACIÓN |
| esp: Especialidad | 6 | ELECTIVA I; OPTATIVA I; OPTATIVA II; ELECTIVA II; ELECTIVA III; OPTATIVA III |
| amb: Ambiente y energía | 3 | PLANIFICACIÓN Y GESTIÓN AMBIENTAL; DESARROLLO SUSTENTABLE: DIVERSIDAD NATURAL Y CULTURAL DE MÉXICO; ORDENAMIENTO Y EVALUACIÓN DEL IMPACTO AMBIENTAL EN MÉXICO |
| ind: Operaciones y logística | 2 | MODELOS DEL TRANSPORTE; LOGISTICA Y TRANSPORTE |
| adm: Administración y negocios | 52 | CALCULO PARA EL ANALISIS ECONOMÍCO; FUNDAMENTOS DE MICROECONOMÍA; HISTORIA DE LOS HECHOS Y DEL PENSAMIENTO ECONOMÍCO HASTA EL SIGLO XIX; HISTORIA DE LOS HECHOS Y DEL PENSAMIENTO ECONOMÍCO, SIGLOS XX Y XXI; SALARIO Y ACUMULACIÓN DEL CAPITAL; TEORÍA DE LA COMPETENCIA PERFECTA E IMPERFECTA |
| soc: Ciencias sociales | 1 | EPISTEMOLOGÍA DE LAS CIENCIAS SOCIALES |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| CALCULO PARA EL ANALISIS ECONOMICO | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE MICROECONOMIA | adm | contexto: núcleo de negocios |
| HISTORIA DE LOS HECHOS Y DEL PENSAMIENTO ECONOMICO HASTA EL SIGLO XIX | adm | contexto: núcleo de negocios |
| HISTORIA DE LOS HECHOS Y DEL PENSAMIENTO ECONOMICO, SIGLOS XX Y XXI | adm | contexto: núcleo de negocios |
| SALARIO Y ACUMULACION DEL CAPITAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| TEORIA DE LA COMPETENCIA PERFECTA E IMPERFECTA | adm | contexto: vocabulario disciplinar de negocios y economía |
| TEORIA DEL VALOR Y DEL CAPITAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| ANALISIS E INTERPRETACION DE LOS ESTADOS FINANCIEROS | adm | contexto: núcleo de negocios |
| CONTABILIDAD GENERAL Y DE COSTOS | adm | contexto: núcleo de negocios |
| CRISIS Y DESARROLLO DEL CAPITALISMO | adm | contexto: vocabulario disciplinar de negocios y economía |
| DESARROLLO DEL CAPITALISMO EN AMERICA Y ASIA DEL SIGLO XIX AL XXI | adm | contexto: vocabulario disciplinar de negocios y economía |
| DESARROLLO DEL CAPITALISMO EN AMERICA Y ASIA DEL SIGLO XVI AL XVIII | adm | contexto: vocabulario disciplinar de negocios y economía |
| ECONOMETRIA | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE MACROECONOMIA | adm | contexto: núcleo de negocios |
| REPRODUCCION Y CIRCULACION DEL CAPITAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| SISTEMA INTEGRAL DE CUENTAS NACIONALES | adm | contexto: vocabulario disciplinar de negocios y economía |
| TEORIA DEL EQUILIBRIO GENERAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| CAPITAL COMERCIAL, FINANCIERO Y RENTA DE LA TIERRA | adm | contexto: vocabulario disciplinar de negocios y economía |
| ECONOMIA ESPACIAL | adm | contexto: núcleo de negocios |
| ECONOMIA Y ECOLOGIA | adm | contexto: núcleo de negocios |
| HISTORIA ECONOMIICA DE MEXICO HASTA EL SIGLO XIX | adm | contexto: núcleo de negocios |
| INVESTIGACION DE MERCADOS | adm | contexto: núcleo de negocios |
| MACROECONOMIA DE LA ECONOMIA ABIERTA | adm | contexto: núcleo de negocios |
| MACROECONOMIA INTERMEDIA | adm | contexto: núcleo de negocios |
| MERCADO MUNDIAL Y SUBDESARROLLO | adm | contexto: núcleo de negocios |
| MODELOS ECONOMETRICOS | adm | contexto: núcleo de negocios |
| TEORIA DE LA ORGANIZACION INDUSTRIAL | adm | contexto: núcleo de negocios |
| TEORIA Y POLITICA MONETARIA | adm | contexto: vocabulario disciplinar de negocios y economía |
| HISTORIA ECONOMIICA DE MEXICO, SIGLOS XX Y XXI | adm | contexto: núcleo de negocios |
| CAMBIO TECNOLOGICO MUNDIAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| CRITICA DE LAS TEORIAS ECONOMICAS CONTEMPORANEAS | adm | contexto: núcleo de negocios |
| ECONOMIA AGRICOLA | adm | contexto: núcleo de negocios |
| ECONOMIA INTERNACIONAL | adm | contexto: núcleo de negocios |
| FINANZAS PUBLICAS | adm | contexto: núcleo de negocios |
| PLAN DE NEGOCIOS | adm | contexto: núcleo de negocios |
| POLITICA DEL COMERCIO INTERNACIONAL | adm | contexto: núcleo de negocios |
| SISTEMA FINANCIERO Y MONETARIO | adm | contexto: núcleo de negocios |
| FINANZAS INTERNACIONALES | adm | contexto: núcleo de negocios |
| POLITICA ECONOMIICA | adm | contexto: núcleo de negocios |
| ECONOMETRIA FINANCIERA | adm | contexto: núcleo de negocios |
| FINANZAS CORPORATIVAS | adm | contexto: núcleo de negocios |
| MERCADO DE DERIVADOS | adm | contexto: núcleo de negocios |
| ECONOMIA DEL TRANSPORTE | adm | contexto: núcleo de negocios |
| TEORIAS Y POLITICAS DE DESARROLLO | adm | contexto: vocabulario disciplinar de negocios y economía |
| TECNICAS PARA EL ANALISIS ECONOMICICO REGIONAL Y URBANO | adm | contexto: núcleo de negocios |
| PLANEACION REGIONAL Y URBANA | adm | contexto: núcleo de negocios |
| DEBATE CONTEMPORANEO EN TORNO AL DESARROLLO | adm | contexto: vocabulario disciplinar de negocios y economía |
| POBREZA Y DESARROLLO | adm | contexto: vocabulario disciplinar de negocios y economía |
| POLITICAS DEL DESARROLLO Y SOBERANIA NACIONAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| METODOS DE OPTIMIZACION EN ECONOMIA | adm | contexto: núcleo de negocios |
| MATEMATICAS PARA EL ANALISIS MICROECONOMICIO | adm | contexto: núcleo de negocios |
| MATEMATICAS PARA EL ANALISIS MACROECONOMICIO | adm | contexto: núcleo de negocios |

### 4.55. mapa-curricular-lencienciasdedatos-escom-upiit-upiic-upiiap

Unidades académicas: ESCOM, UPIIT, UPIIC, UPIIAP. Año del plan: 2020. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-lencienciasdedatos-escom-upiit-upiic-upiiap.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 8 | Matemáticas discreta; Cálculo; Álgebra lineal; Cálculo multivariable; Probabilidad; Métodos numéricos |
| comp: Computación | 4 | Fundamentos de programación; Análisis y diseño de algoritmos; Desarrollo de aplicaciones web; Computo de alto desempeño |
| datos: Ciencia de datos e IA | 14 | Introducción a la ciencia de datos; Programación para ciencia de datos; Bases de datos; Desarrollo de aplicaciones para análisis de datos; Bases de datos avanzadas; Aprendizaje de máquina e inteligencia artificial |
| integral: Humanidades y gestión | 10 | Comunicación oral y escrita; Ética y legalidad; Fundamentos económicos; Finanzas empresariales; Liderazgo personal; Modelos econométicos |
| prof: Práctica profesional | 4 | Metodología de la investigación y divulgación científica; Trabajo terminal I; Trabajo terminal II; Estancia profesional |
| esp: Especialidad | 4 | Optativa A; Optativa B; Optativa C; Optativa D |
| civil: Construcción y tierra | 1 | Algoritmos y estructuras de datos |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| FUNDAMENTOS ECONOMICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| FINANZAS EMPRESARIALES | integral | contexto: formación integral fuera del núcleo de negocios |
| MODELOS ECONOMETICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE PROYECTOS DE TI | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO DE HABILIDADES SOCIALES PARA LA ALTA DIRECCION | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| ESTADISTICA AVANZADA TEMAS SELECTOS DE INTELIGENCIA ARTIFICIAL TEMAS SELECTOS DE APRENDIZAJE PROFUNDO TEMAS SELECTOS DE PROCESAMIENTO DE LENGUAJE NATURAL BIOINFORMATICA BASICA BIOINFORMATICA AVANZADA SISTEMAS DE INFORMACION GEOGRAFICA CIBERSEGURIDAD PROTECCION DE DATOS INNOVACION Y EMPRENDIMIENTO TECNOLOGICO PROPIEDAD INTELECTUAL SIMULACION BASICA SIMULACION AVANZADA | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.56. mapa-curricular-lenfermeria-cics-uma

Unidades académicas: CICS. Año del plan: 2024. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-lenfermeria-cics-uma.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 1 | ANALISIS ESTADISTICO |
| comp: Computación | 1 | TECNOLOGÍAS DE LA INFORMACIÓN Y LA COMUNICACIÓN |
| bio: Ciencias biológicas | 2 | BIOQUIMICA GENERAL; INMUNOLOGÍA BÁSICA |
| integral: Humanidades y gestión | 21 | COMUNICACIÓN ORAL Y ESCRITA; ETIMOLOGÍAS GRECOLATINAS; BIOÉTICA Y TANATOLOGÍA; DESARROLLO HUMANO, SOCIAL E INSTITUCIONAL; ETICA PROFESIONAL; LEGISLACIÓN EN ENFERMERÍA |
| prof: Práctica profesional | 4 | PROTOCOLO DE INVESTIGACIÓN; METODOLOGÍA DE LA INVESTIGACIÓN EN ENFERMERÍA 3.0 1.0 4.0 7.0 ENFERMERÍA EN REHABILITACIÓN; OPTATIVA III 2.0 0.0 2.0 4.0 INVESTIGACIÓN APLICADA EN LA ENFERMERÍA |
| esp: Especialidad | 8 | OPTATIVA I; OPTATIVA II; OPTATIVA III; OPTATIVA IV; ELECTIVA I; ELECTIVA II |
| ind: Operaciones y logística | 1 | INDICADORES DE CALIDAD DE LA ATENCIÓN |
| salud: Ciencias de la salud | 26 | ANATOMÍA; FISIOLOGÍA; MICROBIOLOGÍA Y PARASITOLOGÍA GENERAL; HISTOLOGÍA BÁSICA; SALUD PUBLICA; NUTRICIÓN EN EL CICLO DE LA VIDA |
| clin: Práctica clínica | 50 | HISTORIA Y FILOSOFÍA DEL CUIDADO; SOCIOLOGÍA Y ANTROPOLOGÍA DEL CUIDADO; FARMACOLOGÍA CLINICA; PSICOLOGÍA DEL CUIDADO; ENFERMERÍA COMUNITARÍA; ENFERMERÍA DEL ADULTO Y ADULTO MAYOR |
| soc: Ciencias sociales | 8 | PSICOLOGÍA DEL DESARROLLO; NUTRICIÓN EN EL CICLO DE LA VIDA 2.0 0.0 2.0 4.0 EDUCACIÓN PARA LA SALUD; OPTATIVA I PREVENCIÓN Y MANEJO DE ADICCIONES; OPTATIVA II INTELIGENCIA EMOCIONAL Y ASERTIVIDAD; OPTATIVA III GÉNERO Y SALUD; PREVENCIÓN Y MANEJO DE ADICCIONES |
| sin_categoria: Sin categoría | 5 | SUBTOTAL 25.0 5.0 30.0 55.0 SUBTOTAL; SUBTOTAL 19.0 11.0 30.0 49.0 SUBTOTAL; SUBTOTAL 15.0 15.0 30.0 45.0 SUBTOTAL; SUBTOTAL 13.0 17.0 30.0 43.0 SUBTOTAL |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| FUNDAMENTOS DE ENFERMERIA | salud | contexto: fundamentos de enfermería; distinguir de práctica clínica |
| TEORIAS Y METODO DE ENFERMERIA | salud | contexto: fundamentos de enfermería; distinguir de práctica clínica |
| LEGISLACION EN ENFERMERIA | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION Y GESTION DE LOS SERVICIOS DE ENFERMERIA | integral | contexto: formación integral fuera del núcleo de negocios |
| PRACTICA HOSPITALARIA DE ADMINISTRACION Y GESTION | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| DISENO Y GESTION DE PROGRAMAS DE SALUD COMUNITARIA | integral | contexto: formación integral fuera del núcleo de negocios |
| DISENO Y GESTION DE PROTOCOLOS DE ENFERMERIA HOSPITALARIA | integral | contexto: formación integral fuera del núcleo de negocios |
| BIOLOGIA CELULAR 3.0 1.0 4.0 7.0 HISTORIA Y FILOSOFIA DE LA ENFERMERIA | salud | contexto: fundamentos de enfermería; distinguir de práctica clínica |
| EMBRIOLOGIA BASICA 2.0 0.0 2.0 4.0 TEORIAS Y MODELOS DE ENFERMERIA | salud | contexto: fundamentos de enfermería; distinguir de práctica clínica |
| C SEMESTRE VI T P T/H C LEGISLACION EN ENFERMERIA 2.0 0.0 2.0 4.0 RECURSOS DIGITALES EN SALUD | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION Y GESTION DE LOS SERVICIOS DE ENFERMERIA 5.0 0.0 5.0 10.0 TOMA DE DESICIONES BASADAS EN LA EVIDENCIA | integral | contexto: formación integral fuera del núcleo de negocios |
| PRACTICA HOSPITALARIA DE ADMINISTRACION 0.0 12.0 12.0 12.0 ESTADISTICA EN ENFERMERIA | integral | contexto: formación integral fuera del núcleo de negocios |
| ENFERMERIA EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.57. mapa-curricular-lenfermeria-eseo

Unidades académicas: No indicada. Año del plan: 2022. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-lenfermeria-eseo.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 1 | Bioestadística |
| comp: Computación | 1 | Tecnologías de la información y comunicación |
| bio: Ciencias biológicas | 2 | Procesos celulares; Inmunología |
| integral: Humanidades y gestión | 10 | Ética profesional; Comunicación científica: oral y escrita; Desarrollo humano e identidad institucional **; Bioética y tanatología **; Legislación en enfermería + **; Administración y gestión de los servicios de enfermeria |
| prof: Práctica profesional | 2 | Protocolo de investigación * ++; Servicio social |
| esp: Especialidad | 4 | Optativa I ++; Optativa II ++; Optativa III ++; Electiva |
| amb: Ambiente y energía | 1 | Desarrollo sustentable |
| salud: Ciencias de la salud | 17 | Bases teóricas de enfermeria; Fundamentos de enfermeria; Filosofía y enfermeria; Fisioanatomía I; Salud pública **; Fisioanatomía II |
| clin: Práctica clínica | 24 | Práctica de fundamentos de enfermeria; Enfermeria comunitaria; Práctica de enfermeria comunitaria; Enfermeria del adulto I ±; Práctica de enfermeria del adulto I; Enfermeria del adulto II ± |
| soc: Ciencias sociales | 8 | Psicología del desarrollo; Psicología de la salud; Sociología de la salud; Antropología de la salud; Didáctica y educación para la salud *; OPTATIVA III Psicoprofilaxis ++ |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| BASES TEORICAS DE ENFERMERIA | salud | contexto: fundamentos de enfermería; distinguir de práctica clínica |
| FUNDAMENTOS DE ENFERMERIA | salud | contexto: fundamentos de enfermería; distinguir de práctica clínica |
| FILOSOFIA Y ENFERMERIA | salud | contexto: fundamentos de enfermería; distinguir de práctica clínica |
| LEGISLACION EN ENFERMERIA + ** | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION Y GESTION DE LOS SERVICIOS DE ENFERMERIA | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| PRACTICA DE ADMINISTRACION Y GESTION DE LOS SERVICIOS DE ENFERMERIA | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.58. mapa-curricular-lenfermeriayobstetricia-eseo

Unidades académicas: ESEO. Año del plan: 2023. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-lenfermeriayobstetricia-eseo.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 1 | Bioestadística |
| comp: Computación | 1 | Tecnoloqias de la información y comunicación |
| bio: Ciencias biológicas | 3 | Procesos celulares **; Microbiología **; Inmunología * ** |
| integral: Humanidades y gestión | 7 | Comunicación científica: oral y escrita; Desarrollo humano e identidad institucional **; Bioética y tanatoloqia; Administración y gestión de los servicios de enfermería **; Gestión empresarial **; Desarrollo de habilidades gerenciales ** |
| prof: Práctica profesional | 1 | Servicio social |
| esp: Especialidad | 4 | Optativa I; Optativa II; Optativa III; Electiva |
| amb: Ambiente y energía | 1 | Desarrollo sustentable |
| salud: Ciencias de la salud | 22 | Bases teórico, metodológicas de enfermería **; Fundamentos de enfermería; Ética y filosofía de enfermería; Fisioanatomía I; Salud pública y epidemiología **; Fisioanatomía II |
| clin: Práctica clínica | 27 | Práctica de fundamentos de enfermería; Enfermería comunitaria; Práctica de enfermería comunitaria; Enfermería del adulto I; Práctica de enfermería del adulto I; Enfermería del adulto II |
| soc: Ciencias sociales | 7 | Psicoloqia del desarrollo; Ciencias sociales aplicadas a la salud; Psicoloqia de la salud; Antropología de la salud; Educación perinatal ** +; Didáctica y educación para la salud * |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| BASES TEORICO, METODOLOGICAS DE ENFERMERIA ** | salud | contexto: fundamentos de enfermería; distinguir de práctica clínica |
| FUNDAMENTOS DE ENFERMERIA | salud | contexto: fundamentos de enfermería; distinguir de práctica clínica |
| ETICA Y FILOSOFIA DE ENFERMERIA | salud | contexto: fundamentos de enfermería; distinguir de práctica clínica |
| PSICOLOQIA DEL DESARROLLO | soc | excepción: Lectura OCR de psicología; verificar original |
| TECNOLOQIAS DE LA INFORMACION Y COMUNICACION | comp | excepción: Lectura OCR de tecnologías; verificar original |
| GINECOLOQIA | salud | excepción: Lectura OCR de ginecología; verificar original |
| ADMINISTRACION Y GESTION DE LOS SERVICIOS DE ENFERMERIA ** | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION EMPRESARIAL ** | integral | contexto: formación integral fuera del núcleo de negocios |
| DESARROLLO DE HABILIDADES GERENCIALES ** | integral | contexto: formación integral fuera del núcleo de negocios |
| PRACTICA DE ADMINISTRACION Y GESTION DE LOS SERVICIOS DE ENFERMERIA | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.59. mapa-curricular-lennutricion-cics-uma

Unidades académicas: No indicada. Año del plan: 2025. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-lennutricion-cics-uma.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 3 | ESTADISTICA INFERENCIAL; BIOESTADÍSTICA; GASTRONOMIA REGIONAL, NACIONAL E INTERNACIONAL |
| ctrl: Control y automatización | 1 | INSTRUMENTACIÓN Y EQUIPO ESPECIALIZADO DE ANTROPOMETRIA |
| bio: Ciencias biológicas | 8 | BIOQUÍMICA; INMUNOLOGÍA BASICA; MICROBIOLOGÍA SANITARIA; BIOQUÍMICA BÁSICA; BIOLOGÍA CELULAR Y MOLECULAR; INMUNOLOGÍA BÁSICA |
| proc: Ingeniería de procesos | 9 | QUÍMICA DE LOS ALIMENTOS; CONSERVACIÓN DE ALIMENTOS; CONSERVACIÓN DE LOS ALIMENTOS; OPTATIVA I ALIMENTOS FUNCIONALES; OPTATIVA II DESARROLLO DE PRODUCTOS INNOVADORES; ETIQUETADO DE ALIMENTOS |
| integral: Humanidades y gestión | 23 | DESARROLLO DE HABILIDADES DE PENSAMIENTO Y APRENDIZAJE; COMUNICACIÓN ORAL Y ESCRITA; TRABAJO EN EQUIPO Y LIDERAZGO; INGLES; SOCIEDAD Y SALUD; ESTRUCTURA SOCIOECONÓMICA DE MÉXICO Y NUTRICIÓN |
| prof: Práctica profesional | 1 | METODOLOGÍA DE LA INVESTIGACIÓN |
| esp: Especialidad | 10 | OPTATIVA I; OPTATIVA II; OPTATIVA III; OPTATIVA IV; ELECTIVA I; ELECTIVA II |
| amb: Ambiente y energía | 2 | OPTATIVA III PROYECTOS PRODUCTIVOS SUSTENTABLES EN COMUNIDAD; DESARROLLO SUSTENTABLE |
| ind: Operaciones y logística | 3 | SISTEMAS DE PRODUCCIÓN AGROPECUARIA; SISTEMAS DE PRODUCCIÓN ALIMENTARIA; HIGIENE Y SEGURIDAD INDUSTRIAL |
| salud: Ciencias de la salud | 56 | ANATOMÍA GENERAL; FISIOLOGÍA GENERAL; MICROBIOLOGÍA Y PARASITOLOGÍA; MANEJO DE TIC'S PARA LA SALUD; HISTOLOGÍA BASICA; SALUD PÚBLICA |
| clin: Práctica clínica | 25 | PRACTICA COMUNITARIA DE SALUD PÚBLICA; NUTRICIÓN CLÍNICA POR ESPECIALIDAD; FUNDAMENTOS DE NUTRICIÓN CLÍNICA I; NUTRICIÓN CLÍNICA POR APARATOS Y SISTEMAS I; FUNDAMENTOS DE NUTRICIÓN CLÍNICA II; NUTRICIÓN CLÍNICA POR APARATOS Y SISTEMAS II |
| soc: Ciencias sociales | 10 | FILOSOFÍA INSTITUCIONAL; DIDÁCTICA APLICADA A LA NUTRICIÓN; PSICOLOGÍA EN EL CICLO DE LA VIDA; EDUCACIÓN NUTRICIONAL; HISTORIA DE LA NUTRILOGÍA EN MÉXICO; ANTROPOLOGÍA DE LA ALIMENTACIÓN |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| BIOQUIMICA | bio | excepción: Área biológica del catálogo vigente |
| ESTRUCTURA SOCIOECONOMICA DE MEXICO Y NUTRICION | integral | contexto: formación integral fuera del núcleo de negocios |
| FORMACION DE EMPRENDEDORES Y PROYECTOS INNOVADORES | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION APLICADA A INDUSTRIAS, CENDIS Y HOSPITALES | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION Y MERCADOTECNIA EN SERVICIOS | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION DE SERVICIOS DE ALIMENTACION | integral | contexto: formación integral fuera del núcleo de negocios |
| PRACTICA DE SERVICIOS DE ALIMENTACION EN EMPRESAS | integral | contexto: formación integral fuera del núcleo de negocios |
| EMPRENDIMIENTO EN NUTRICION | integral | contexto: formación integral fuera del núcleo de negocios |
| DISENO Y MERCADOTECNIA DE PRODUCTOS Y SERVICIOS | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I GESTION DEL TALENTO HUMANO | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA II DESARROLLO DE PRODUCTOS INNOVADORES | proc | contexto: título ambiguo interpretado según la disciplina del plan |
| OPTATIVA I MARKETING Y COMUNICACION EN SALUD EN SALUD Y NUTRICION | integral | contexto: formación integral fuera del núcleo de negocios |
| ESTRATEGIAS ADMINISTRATIVAS DE RECURSOS HUMANOS | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.60. mapa-curricular-lm-esfm

Unidades académicas: ESFM. Año del plan: 2020. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-lm-esfm.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 25 | Introducción al cálculo; Álgebra superior; Pensamiento matemático; Geometría; Cálculo; Álgebra lineal |
| comp: Computación | 13 | Fundamentos de programación; Paradigmas de programación; Análisis de algoritmos; Teoría computacional; Topología algorítmica; Criptología |
| datos: Ciencia de datos e IA | 3 | Fundamentos de inteligencia artificial; Aprendizaje de máquina estadístico; Aprendizaje profundo |
| ctrl: Control y automatización | 1 | Teoría de control discreto |
| integral: Humanidades y gestión | 8 | Comunicación asertiva; Resolución de problemas complejos; Toma de decisiones basadas en datos; Ética y responsabilidad social; Teoría de la medida en finanzas; Negociación de activos financieros |
| prof: Práctica profesional | 3 | Trabajo terminal I; Trabajo terminal II; Práctica profesional |
| esp: Especialidad | 4 | Optativa A; Optativa B; Optativa C; Optativa D |
| mec: Mecánica y materiales | 1 | Ecuaciones dinámicas |
| civil: Construcción y tierra | 1 | Construcción matemática |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| TOMA DE DECISIONES BASADAS EN DATOS | integral | contexto: formación integral fuera del núcleo de negocios |
| TEORIA DE LA MEDIDA EN FINANZAS | integral | contexto: formación integral fuera del núcleo de negocios |
| NEGOCIACION DE ACTIVOS FINANCIEROS | integral | contexto: formación integral fuera del núcleo de negocios |
| EMPRENDIMIENTO | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE RIESGOS FINANCIEROS | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.61. mapa-curricular-lmd-esca-ust

Unidades académicas: ESCA. Año del plan: 2021. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-lmd-esca-ust.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| comp: Computación | 5 | Programática de plataforma y medios digitales; Laboratorio: Herramientas y aplicaciones de e-commerce; OPTATIVA I Criptografía y monedas digitales; OPTATIVA I Seguridad en redes sociales y aplicaciones en línea; OPTATIVA III Seguridad en entornos móviles y virtualización |
| datos: Ciencia de datos e IA | 1 | Minería de datos y Big Data |
| elec: Electrónica | 1 | Laboratorio: Diseño digital |
| integral: Humanidades y gestión | 5 | Solución de problemas y creatividad; Trabajo en equipo y liderazgo; Habilidades de expresión oral y escrita; Desarrollo de habilidades de pensamiento; Ética y responsabilidad social |
| prof: Práctica profesional | 1 | Formulación de proyecto de investigación |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| amb: Ambiente y energía | 2 | Desarrollo sostenible; Análisis y evaluación del impacto ambiental |
| ind: Operaciones y logística | 1 | OPTATIVA II Seguridad en la base de datos y almacenamiento en la nube |
| adm: Administración y negocios | 39 | Matemáticas en las empresas; Administración de negocios; Laboratorio: Herramientas tecnológicas e informáticas en mercadotecnia digital; Economía de negocios; Mercadotecnia e innovación empresarial; Marco legal empresarial |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MATEMATICAS EN LAS EMPRESAS | adm | contexto: núcleo de negocios |
| ADMINISTRACION DE NEGOCIOS | adm | contexto: núcleo de negocios |
| LABORATORIO: HERRAMIENTAS TECNOLOGICAS E INFORMATICAS EN MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| ECONOMIA DE NEGOCIOS | adm | contexto: núcleo de negocios |
| MERCADOTECNIA E INNOVACION EMPRESARIAL | adm | contexto: núcleo de negocios |
| MARCO LEGAL EMPRESARIAL | adm | contexto: núcleo de negocios |
| ESTADISTICA APLICADA A LOS NEGOCIOS | adm | contexto: núcleo de negocios |
| FINANZAS PARA LA MERCADOTECNIA | adm | contexto: núcleo de negocios |
| LABORATORIO: SISTEMAS DE INFORMACION EN LOS NEGOCIOS | adm | contexto: núcleo de negocios |
| ECONOMIA GLOBAL | adm | contexto: núcleo de negocios |
| COSTOS EN LA MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| DIRECCION Y LIDERAZGO GLOBAL | adm | contexto: núcleo de negocios |
| MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| INVESTIGACION Y ANALISIS DE MERCADOS DIGITALES | adm | contexto: núcleo de negocios |
| LABORATORIO: GESTION DE DATOS, COMPORTAMIENTO Y PERFILES DEL CONSUMIDOR DIGITAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| MODELO DE NEGOCIOS DIGITALES | adm | contexto: núcleo de negocios |
| ESTRATEGIAS DE MERCADOTECNIA DIGITAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| CAPTACION DE CLIENTES | adm | contexto: vocabulario disciplinar de negocios y economía |
| GESTION DE CAMPANAS DIGITALES | adm | contexto: núcleo de negocios |
| LABORATORIO: ADMINISTRACION DE REDES SOCIALES PARA LA MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| BRANDING IN DIGITAL MARKETING | adm | contexto: vocabulario disciplinar de negocios y economía |
| PLANEACION DE MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| POSICIONAMIENTO SEO Y SEM | adm | contexto: vocabulario disciplinar de negocios y economía |
| DESARROLLO DE CONTENIDOS DIGITALES | adm | contexto: vocabulario disciplinar de negocios y economía |
| METRICAS DE LA MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| INTELIGENCIA ARTIFICIAL Y ALGORITMOS EN LA MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| CUSTOMER CENTRICITY AND VALUE CREATION | adm | contexto: vocabulario disciplinar de negocios y economía |
| LABORATORIO: ANALITICA DE DATOS EN LA MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| DESING THINKING AND INNOVATION | adm | excepción: Innovación en mercadotecnia; grafía de entrada |
| COMERCIO ELECTRONICO Y DISPOSITIVOS MOVILES | adm | contexto: núcleo de negocios |
| EMPRENDIMIENTO EN LA MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| GESTION DE PROYECTOS DE MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| LEGISLACION Y PROTECCION DE DATOS EN EL AMBITO DIGITAL | adm | contexto: núcleo de negocios |
| CRM AND LOYALTY | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA II TIENDA ONLINE | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA III DROPSHIPPING | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA I KPI, SITIO WEB Y FOROS | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA II KPI PARA SOCIAL MEDIA DIGITAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA III KPI BRANDING, CONTENIDOS Y CAMPANAS DE PUBLICIDAD | adm | contexto: vocabulario disciplinar de negocios y economía |

### 4.62. mapa-curricular-lnd-esca-ust

Unidades académicas: ESCA. Año del plan: 2020. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-lnd-esca-ust.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| integral: Humanidades y gestión | 4 | Solución de problemas y creatividad; Trabajo en equipo y liderazgo; Habilidades de expresión oral y escrita; Desarrollo de habilidades de pensamiento |
| prof: Práctica profesional | 2 | Investigación aplicada; Formulación de proyecto de investigación |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| amb: Ambiente y energía | 3 | Gestión ambiental; Clean and renewable energies; Analysis and evaluation of the environmental impact |
| ind: Operaciones y logística | 2 | Administración de operaciones; OPTATIVA III Evaluación y certificación ambiental |
| adm: Administración y negocios | 44 | Matemáticas en las empresas; Organización en las empresas; Laboratorio empresarial. Herramientas tecnológicas e informáticas para los negocios; Macroeconomía; Comportamiento organizacional; Derecho mercantil |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MATEMATICAS EN LAS EMPRESAS | adm | contexto: núcleo de negocios |
| ORGANIZACION EN LAS EMPRESAS | adm | contexto: núcleo de negocios |
| LABORATORIO EMPRESARIAL. HERRAMIENTAS TECNOLOGICAS E INFORMATICAS PARA LOS NEGOCIOS | adm | contexto: núcleo de negocios |
| MACROECONOMIA | adm | contexto: núcleo de negocios |
| COMPORTAMIENTO ORGANIZACIONAL | adm | contexto: núcleo de negocios |
| DERECHO MERCANTIL | adm | contexto: núcleo de negocios |
| ESTADISTICA APLICADA A LOS NEGOCIOS | adm | contexto: núcleo de negocios |
| ANALISIS Y GESTION FINANCIERA | adm | contexto: núcleo de negocios |
| DESARROLLO SUSTENTABLE Y NEGOCIOS | adm | contexto: núcleo de negocios |
| LABORATORIO EMPRESARIAL. SISTEMAS DE INFORMACION DE GESTION EMPRESARIAL | adm | contexto: núcleo de negocios |
| MICROECONOMIA | adm | contexto: núcleo de negocios |
| ANALISIS Y ESTRATEGIA DE COSTOS | adm | contexto: núcleo de negocios |
| GESTION DEL TALENTO HUMANO | adm | contexto: vocabulario disciplinar de negocios y economía |
| LABORATORIO EMPRESARIAL. PROGRAMACION PARA NEGOCIOS | adm | contexto: núcleo de negocios |
| GLOBALIZACION DE LA ECONOMIA DIGITAL | adm | contexto: núcleo de negocios |
| DIRECCION ESTRATEGICA DE ORGANIZACIONES | adm | contexto: núcleo de negocios |
| FORMULACION Y EVALUACION DE PROYECTOS DE INVERSION | adm | contexto: núcleo de negocios |
| MARKETING ESTRATEGICO | adm | contexto: vocabulario disciplinar de negocios y economía |
| DIRECCION Y LIDERAZGO GLOBAL | adm | contexto: núcleo de negocios |
| LABORATORIO EMPRESARIAL. GESTION DE DATOS | adm | contexto: núcleo de negocios |
| ANALISIS PARA LA TOMA DE DECISIONES | adm | contexto: núcleo de negocios |
| DESARROLLO Y EVALUACION DE ESTRATEGIAS | adm | contexto: vocabulario disciplinar de negocios y economía |
| GESTION DE VENTAS | adm | contexto: núcleo de negocios |
| LEGISLACION AMBIENTAL | adm | contexto: núcleo de negocios |
| MODELOS DE NEGOCIOS EN ECONOMIAS DIGITALES | adm | contexto: núcleo de negocios |
| LABORATORIO EMPRESARIAL. ANALITICA DE DATOS (BIG DATA Y BUSINESS INTELLIGENT) | adm | contexto: vocabulario disciplinar de negocios y economía |
| MARKETING DIGITAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| METICAS EMPRESARIALES | adm | contexto: núcleo de negocios |
| GESTION DE REDES SOCIALES | adm | contexto: núcleo de negocios |
| RESPONSABILIDAD Y ETICA EMPRESARIAL | adm | contexto: núcleo de negocios |
| LABORATORIO EMPRESARIAL. E-COMMERCE | adm | contexto: núcleo de negocios |
| DIGITAL BUSINESS ENTREPRENEURSHIP | adm | contexto: vocabulario disciplinar de negocios y economía |
| CLEAN AND RENEWABLE ENERGIES | amb | excepción: Energías limpias y renovables |
| LABORATORIO EMPRESARIAL. SIMULADOR | adm | contexto: núcleo de negocios |
| COMPETITIVE DIGITAL BUSINESS STRATEGIES | adm | contexto: vocabulario disciplinar de negocios y economía |
| DESARROLLO DEL PROYECTO DE NEGOCIO DIGITAL SUSTENTABLE | adm | contexto: núcleo de negocios |
| LEGISLACION PARA PROTECCION DE DATOS | adm | contexto: núcleo de negocios |
| ANALYSIS AND EVALUATION OF THE ENVIRONMENTAL IMPACT | amb | excepción: Evaluación del impacto ambiental |
| OPTATIVA I ANALISIS DE MERCADO DE CAPITALES | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA II ADMINISTRACION DE RIESGOS EN LOS NEGOCIOS DIGITALES | adm | contexto: núcleo de negocios |
| OPTATIVA I INNOVACION EN LA EMPRESA DIGITAL | adm | contexto: núcleo de negocios |
| OPTATIVA II ESTRATEGIAS Y GESTION DE LA INNOVACION | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA III GOBIERNO CORPORATIVO | adm | contexto: núcleo de negocios |
| OPTATIVA I AUDITORIA DE SISTEMAS DE INFORMACION | adm | contexto: núcleo de negocios |
| OPTATIVA II AUDITORIA AMBIENTAL | adm | contexto: núcleo de negocios |
| OPTATIVA III ESTANDARES EN AUDITORIA DE NEGOCIOS DIGITALES | adm | contexto: núcleo de negocios |

### 4.63. mapa-curricular-lnegociosinternacionales-esca-ust-utepepan

Unidades académicas: ESCA. Año del plan: 2022. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-lnegociosinternacionales-esca-ust-utepepan.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 2 | Estadística |
| comp: Computación | 1 | Herramientas digitales básicas |
| datos: Ciencia de datos e IA | 1 | Taller de análisis de datos |
| integral: Humanidades y gestión | 6 | Habilidades para la comunicación; Habilidades de pensamiento para la toma de desiciones; Comportamiento humano en el ámbito laboral |
| prof: Práctica profesional | 3 | Metodología de la investigación; Seminario de investigación aplicada; OPTATIVA III Estancia empresarial |
| esp: Especialidad | 6 | Optativa I; Electiva*; Optativa II; Optativa III |
| civil: Construcción y tierra | 3 | Crédito y cobranza internacional; Crédito v cobranza internacional |
| amb: Ambiente y energía | 1 | Desarrollo sustentable |
| ind: Operaciones y logística | 9 | Calidad y teoría general de sistemas; Investigación de operaciones; Transportación v tráfico internacional; Transportación y tráfico internacional; Logística sustentable; Dirección de operaciones logísticas |
| adm: Administración y negocios | 67 | Matemáticas para negocios; Fundamentos de derecho; Fundamentos de administración; Derecho empresarial; Comercialización internacional; Matemáticas financieras |
| soc: Ciencias sociales | 1 | OPTATIVA I Estudio de las relaciones internacionales |
| info: Información y documentación | 1 | OPTATIVA II Relaciones diplomáticas y consulares |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MATEMATICAS PARA NEGOCIOS | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE DERECHO | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE ADMINISTRACION | adm | contexto: núcleo de negocios |
| DERECHO EMPRESARIAL | adm | contexto: núcleo de negocios |
| COMERCIALIZACION INTERNACIONAL | adm | contexto: núcleo de negocios |
| MATEMATICAS FINANCIERAS | adm | contexto: núcleo de negocios |
| MACROECONOMIA | adm | contexto: núcleo de negocios |
| GEOORAFIA E HISTORIA ECONOMICA DE MEXICO | adm | contexto: núcleo de negocios |
| REGIMEN IURIDICO DE COMERCIO EXTERIOR | adm | contexto: núcleo de negocios |
| ESTRUCTURA ECONOMICA INTERNACIONAL | adm | contexto: núcleo de negocios |
| OPERACIONES DE COMERCIO EXTERIOR | adm | contexto: núcleo de negocios |
| ESTUDIOS REGIONALES DE AMERICA DEL NORTE | adm | contexto: vocabulario disciplinar de negocios y economía |
| ESTUDIOS REGIONALES DE AMERICA LATINA Y EL CARIBE | adm | contexto: vocabulario disciplinar de negocios y economía |
| DERECHO INTERNACIONAL | adm | contexto: núcleo de negocios |
| ANALISIS DE LOS MERCADOS INTERNACIONALES | adm | contexto: núcleo de negocios |
| ADMINISTRACION FINANCIERA | adm | contexto: núcleo de negocios |
| CLASIFICACION ARANCELARIA | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPERACIONES DE COMERCIO INTERNACIONAL | adm | contexto: núcleo de negocios |
| ESTUDIOS REGIONALES DE EUROPA | adm | contexto: vocabulario disciplinar de negocios y economía |
| ESTUDIOS REGIONALES DE ASIA Y EL PACIFICO | adm | contexto: vocabulario disciplinar de negocios y economía |
| HERRAMIENTAS DIGITALES EN LOS NEGOCIOS | adm | contexto: núcleo de negocios |
| MARKETING AND INTERNATIONAL PROMOTION | adm | contexto: vocabulario disciplinar de negocios y economía |
| FINANZAS CORPORATIVAS PARA NEGOCIOS | adm | contexto: núcleo de negocios |
| FOREIGN INVESTMENT | adm | contexto: vocabulario disciplinar de negocios y economía |
| ESTUDIOS REGIONALES DE MEDIO ORIENTE Y AFRICA | adm | contexto: vocabulario disciplinar de negocios y economía |
| PROPIEDAD INTELECTUAL, FRANQUIAS Y LICENCIAS | adm | contexto: vocabulario disciplinar de negocios y economía |
| INTERNATIONAL NEGOTIATION STRATEGIES | adm | contexto: vocabulario disciplinar de negocios y economía |
| ESTRATEQIA FINANCIERA INTERNACIONAL | adm | contexto: núcleo de negocios |
| ADMINISTRACION DE LAS CADENAS DE SUMINISTRO | adm | contexto: núcleo de negocios |
| BUSINESS ANALYSIS AND GEOPOLITICS | adm | contexto: vocabulario disciplinar de negocios y economía |
| TALLER DE LICITACIONES INTERNACIONALES | adm | contexto: vocabulario disciplinar de negocios y economía |
| BUSINESS INTELLIGENCE | adm | contexto: vocabulario disciplinar de negocios y economía |
| ADMINISTRACION V OPERACION ADUANERA INTERNACIONAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| DESARROLLO DE HABILIDADES DIRECTIVAS | adm | contexto: núcleo de negocios |
| ADMINISTRACION DE INVERSION SUSTENTABLES Y SOSTENIBLES PARA NEGOCIOS INTERNACIONALES | adm | contexto: núcleo de negocios |
| DIRECCION ECONOMICA INTERNACIONAL | adm | contexto: núcleo de negocios |
| CONTRATOS INTERNACIONALES | adm | contexto: vocabulario disciplinar de negocios y economía |
| DIRECCION ESTRATEGICA INTERNACIONAL | adm | contexto: núcleo de negocios |
| PROVECTOS DE INVERSION SUSTENTABLES Y SOSTENIBLES PARA NEGOCIOS INTERNACIONALES | adm | contexto: núcleo de negocios |
| OPTATIVA III POLITICA EXTERIOR DE MEXICO | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA I COMPRA VENTA INTERNACIONAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA II TALLER DE EMPRENDEDORES Y PROVETO DE NEGOCIOS | adm | contexto: núcleo de negocios |
| OPTATIVA I ADMINISTRACION DE RIESGOS PARA NEGOCIOS | adm | contexto: núcleo de negocios |
| OPTATIVA II COSTOS PARA EL COMERCIO EXTERIOR | adm | contexto: núcleo de negocios |
| OPTATIVA III SISTEMA FINANCIERO MEXICANO Y SISTEMA MONETARIO INTERNACIONAL | adm | contexto: núcleo de negocios |
| OPTATIVA I MANEJO DE CONTROVERSIAS EN MATERIA ADUANERA | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA II PROGRAMAS DE FOMENTO AL COMERCIO EXTERIOR | adm | contexto: núcleo de negocios |
| OPTATIVA I REGIMEN JURIDICO EN LA COMPRA VENTA INTERNACIONAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA II ANALISIS DEL DERECHO ADUANERO MEXICOANO | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA III ESTRUCTURA JURIDICA DE LAS FRANQUICIAS INTERNACIONALES | adm | contexto: vocabulario disciplinar de negocios y economía |

### 4.64. mapa-curricular-lodontologia-cics-uma

Unidades académicas: CICS. Año del plan: 2025. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-lodontologia-cics-uma.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| ctrl: Control y automatización | 1 | BIOSEGURIDAD Y CONTROL DE INFECCIONES |
| bio: Ciencias biológicas | 4 | BIOQUIMICA; ECOLOGÍA; BIOQUÍMICA; INMUNOLOGÍA |
| integral: Humanidades y gestión | 15 | DESARROLLO DE HABILIDADES DEL PENSAMIENTO; BIOETICA; COMUNICACIÓN ORAL Y ESCRITA; TRABAJO EN EQUIPO Y LIDERAZGO; INGLES BÁSICO; INGLES APLICADO |
| prof: Práctica profesional | 3 | METODOLOGÍA DE LA INVESTIGACION; PROYECTO TERMINAL; METODOLOGÍA DE LA INVESTIGACIÓN |
| esp: Especialidad | 8 | OPTATIVA I; OPTATIVA II; ELECTIVA; ELECTIVA I; ELECTIVA II |
| mec: Mecánica y materiales | 2 | MATERIALES DENTALES; BIOMATERIALES Y MATERIALES DENTALES |
| amb: Ambiente y energía | 1 | DESARROLLO SUSTENTABLE ** |
| salud: Ciencias de la salud | 36 | EMBRIOLOGIA; HISTOLOGIA; ANATOMIA HUMANA; ANATOMIA DENTAL; MICROBILOGÍA Y PARASITOLOGÍA; FISIOLOGIA |
| clin: Práctica clínica | 57 | TECNICAS QUIRURGICAS; ANESTESIA BUCODENTAL; PROPEDEUTICA; RADIOLOGIA DENTAL; OPERATORIA DENTAL; OCLUSION |
| soc: Ciencias sociales | 3 | FILOSOFÍA INSTITUCIONAL; PSICOLOGÍA Y SALUD; PSICOLOGÍA Y SALUD * |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| BIOQUIMICA | bio | excepción: Área biológica del catálogo vigente |
| PARMACOLOGIA | salud | excepción: Lectura OCR de farmacología; verificar original |
| ADMINISTRACION Y GESTION DE LA CLINICA DENTAL | integral | contexto: formación integral fuera del núcleo de negocios |
| EMPRENDIMIENTO E INNOVACION EN ODONTOLOGIA | integral | contexto: formación integral fuera del núcleo de negocios |
| TRAYECTORIA LABORATORIO DENTAL DISTRIBUCION DE HORAS T/H CREDITOS TEPIC OPTATIVA I DISENO Y PLANEACION DE PROVISIONALES FIJOS Y REMOVIBLES | integral | contexto: formación integral fuera del núcleo de negocios |
| TRAYECTORIALEGISLACION ODONTOLOGICA E IDENTIFICACION HUMANA TEORIA PRACTICA T/H CREDITOS TEPIC OPTATIVA IODONTOLOGIA LEGAL | integral | contexto: formación integral fuera del núcleo de negocios |
| FORMACION DE EMPRENDEDORES | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.65. mapa-curricular-lodontologia-cics-ust-um

Unidades académicas: No indicada. Año del plan: 2009. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-lodontologia-cics-ust-um.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| bio: Ciencias biológicas | 2 | BIOQUÍMICA; ECOLOGÍA |
| integral: Humanidades y gestión | 8 | DESARROLO DE HABILIDADES DEL PENSAMIENTO; BIOÉTICA; COMUNICACIÓN ORAL Y ESCRITA; TRABAJO EN EQUIPO Y LIDERAZGO; INGLES BÁSICO; INGLÉS APLICADO |
| prof: Práctica profesional | 2 | METODOLOGÍA DE LA INVESTIGACIÓN; PROYECTO TERMINAL |
| esp: Especialidad | 3 | OPTATIVA I; OPTATIVA II; ELECTIVA |
| mec: Mecánica y materiales | 1 | MATERIALES DENTALES |
| salud: Ciencias de la salud | 15 | EMBRIOLOGÍA; HISTOLOGÍA; ANATOMÍA HUMANA; ANATOMÍA DENTAL; MICROBILOGÍA Y PARASITOLOGÍA; FISIOLOGÍA |
| clin: Práctica clínica | 29 | TÉCNICAS QUIRURGICAS; CLÍNICA DE ODONTOLOGÍA PREVENTIVA; ANESTESIA BUCODENTAL; PROPEDEUTICA; RADIOLOGÍA DENTAL; OPERATORIA DENTAL |
| soc: Ciencias sociales | 2 | FILOSOFÍA INSTITUCIONAL; PSICOLOGÍA Y SALUD |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| BIOQUIMICA | bio | excepción: Área biológica del catálogo vigente |
| ADMINISTRACION Y GESTION DE LA CLINICA DENTAL | integral | contexto: formación integral fuera del núcleo de negocios |
| FORMACION DE EMPRENDEDORES | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.66. mapa-curricular-loptometria-cics-uma-ust

Unidades académicas: No indicada. Año del plan: 2011. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-loptometria-cics-uma-ust.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 7 | BIOESTADÍSTICA; ÓPTICA GEOMÉTRICA E INSTRUMENTAL; ÓPTICA FÍSICA; ÓPTICA FISIOLÓGICA; ÓPTICA OFTALMICA; TECNOLOGÍA ÓPTICA |
| comp: Computación | 1 | MANEJO DE LAS TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIÓN |
| bio: Ciencias biológicas | 4 | BIOQUÍMICA BÁSICA; GENÉTICA BÁSICA; INMUNOLOGÍA BÁSICA |
| integral: Humanidades y gestión | 12 | BIOÉTICA; COMUNICACIÓN ORAL Y ESCRITA; INGLÉS; SOLUCIÓN DE PROBLEMAS Y CREATIVIDAD; TÉCNICAS Y HÁBITOS DE ESTUDIO; TRABAJO EN EQUIPO Y LIDERAZGO |
| prof: Práctica profesional | 1 | METODOLOGÍA DE LA INVESTIGACIÓN |
| esp: Especialidad | 4 | OPTATIVA I; OPTATIVA II; OPTATIVA III; ELECTIVA |
| amb: Ambiente y energía | 2 | VISIÓN AMBIENTAL |
| salud: Ciencias de la salud | 24 | ANATOMÍA HUMANA; EMBRIOLOGÍA BÁSICA; FARMACOLOGÍA GENERAL; FISIOLOGÍA HUMANA; HISTOLOGÍA HUMANA; MICROBIOLOGÍA Y PARASITOLOGÍA |
| clin: Práctica clínica | 35 | CLÍNICA BÁSICA DE REFRACCIÓN; CLÍNICA DE DETECCIÓN VISUAL; LENTES DE CONTACTO; MÉTODOS CLÍNICOS OPTOMÉTRICOS; PROPEDÉUTICA CLÍNICA; REFRACCIÓN OCULAR |
| soc: Ciencias sociales | 4 | FILOSOFÍA INSTITUCIONAL; HISTORIA DE LA OPTOMETRÍA; PSICOLOGÍA APLICADA A LA OPTOMETRÍA |
| sin_categoria: Sin categoría | 1 | OPTATIVA II TEORÍA PRÁCTICA T/H CRÉDITOS TEPIC CRÉDITOS SATCA |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| PERCEPCION VISUAL | clin | contexto: título ambiguo interpretado según la disciplina del plan |
| TALLER DE PLAN DE NEGOCIOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE EMPRESAS | integral | contexto: formación integral fuera del núcleo de negocios |
| CONTABILIDAD Y FINANZAS | integral | contexto: formación integral fuera del núcleo de negocios |
| COMUNICACION COMERCIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| FUERZA DE VENTAS | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.67. mapa-curricular-loptometria-cics-uma

Unidades académicas: CICS. Año del plan: 2025. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-loptometria-cics-uma.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 12 | BIOESTADÍSTICA; OPTICA GEOMETRICA E INSTRUMENTAL; OPTICA FÍSICA; OPTICA FISIOLOGICA; OPTICA OFTALMICA; TECNOLOGÍA OPTICA |
| comp: Computación | 1 | MANEJO DE LAS TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIÓN |
| ctrl: Control y automatización | 1 | CONTROL Y MANEJO DE MIOPIA |
| bio: Ciencias biológicas | 8 | BIOQUÍMICA BÁSICA; GENETICA BÁSICA; GENETICA BASICA; INMUNOLOGÍA BASICA; BIOQUIMICA BASICA; BIOLOGÍA CELULAR |
| integral: Humanidades y gestión | 21 | BIOETICA; COMUNICACIÓN ORAL Y ESCRITA; INGLES; INGLÉS; SOLUCIÓN DE PROBLEMAS Y CREATIVIDAD; TECNICAS Y HABITOS DE ESTUDIO |
| prof: Práctica profesional | 1 | METODOLOGÍA DE LA INVESTIGACIÓN |
| esp: Especialidad | 9 | OPTATIVA I; OPTATIVA II; OPTATIVA III; ELECTIVA; OPTATIVA 1; OPTATIVA 2 |
| amb: Ambiente y energía | 3 | VISIÓN AMBIENTAL; DESARROLLO SOSTENIBLE Y SUSTENTABLE ** |
| salud: Ciencias de la salud | 37 | ANATOMÍA HUMANA; EMBRILOGÍA BÁSICA; FARMACOLOGÍA GENERAL; FISIOLOGÍA HUMANA; HISTOLOGÍA HUMANA; MICROBIOLOGÍA Y PARASITOLOGÍA |
| clin: Práctica clínica | 66 | CLÍNICA BASICA DE REFRACCIÓN; CLÍNICA DE DETECCIÓN VISUAL; LENTES DE CONTACTO; METODOS CLÍNICOS OPTOMETRICOS; PROPEDEUTICA CLÍNICA; REFRACCIÓN OCULAR |
| soc: Ciencias sociales | 7 | FILOSOFÍA INSTITUCIONAL; HISTORIA DE LA OPTOMETRÍA; PSICOLOGÍA APLICADA A LA OPTOMETRÍA; INVESTIGACIÓN COMUNITARIA DE DETECCIÓN OPTOMETRICA; INVESTIGACIÓN COMUNITARIA DE EDUCACIÓN EN SALUD VISUAL |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| EMBRILOGIA BASICA | salud | excepción: Lectura OCR de embriología; verificar original |
| PERCEPCION VISUAL | clin | contexto: título ambiguo interpretado según la disciplina del plan |
| TALLER DE PLAN DE NEGOCIOS | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION EMOCIONAL | integral | contexto: formación integral fuera del núcleo de negocios |
| LEGISLACION EN OPTOMETRIA | integral | contexto: formación integral fuera del núcleo de negocios |
| EMPRENDIMIENTO * | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA 1 INTERVENCION TEMPRANA | clin | contexto: título ambiguo interpretado según la disciplina del plan |
| OPTATIVA 1 VISION Y APRENDIZAJE | clin | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION DE EMPRESAS | integral | contexto: formación integral fuera del núcleo de negocios |
| CONTABILIDAD Y FINANZAS | integral | contexto: formación integral fuera del núcleo de negocios |
| COMUNICACION COMERCIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| FUERZA DE VENTAS | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.68. mapa-curricular-lp-cics-ust

Unidades académicas: No indicada. Año del plan: 2010. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-lp-cics-ust.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 1 | PSYHOLOGICAL TEXTS READING COMPREHENSION TEORÍAS DE LA PERSONALIDAD |
| bio: Ciencias biológicas | 1 | BASES BIOLÓGICAS DE LA CONDUCTA |
| integral: Humanidades y gestión | 11 | IDENTIDAD POLITECNICA; TÉCNICAS DE APRENDIZAJE AUTOREGULADO; DESARROLLO DE HABILIDADES DEL PENSAMIENTO; DISCURSO Y SOCIEDAD; PSICOÉTICA; INTRODUCCIÓN A LAS ORGANIZACIONES |
| prof: Práctica profesional | 5 | MÉTODOS Y TÉCNICAS DE INVESTIGACIÓN CUALITATIVA EN CIENCIAS DE LA SALUD; MÉTODOS Y TÉCNICAS DE INVESTIGACIÓN CUANTITATIVA EN CIENCIAS DE LA SALUD; PROYECTOS DE INVESTIGACIÓN CUANTITATIVA; PROYECTOS DE INVESTIGACIÓN CUALITATIVA; SEMINARIO DE INVESTIGACIÓN |
| esp: Especialidad | 5 | OPTATIVA I; OPTATIVA II; OPTATIVA III; ELECTIVA I; ELECTIVA II |
| amb: Ambiente y energía | 1 | DISEÑO DE AMBIENTES VIRTUALES PARA EL APRENDIZAJE (1) |
| salud: Ciencias de la salud | 2 | SEXUALIDAD HUMANA; PROGRAMACIÓN DE AMBIENTES SALUDABLES |
| clin: Práctica clínica | 4 | INTERVENCIÓN CONDUCTUAL Y COGNITIVO CONDUCTUAL EN PSICOLÓGÍA CLÍNICA; INTERVENCIÓN SISTÉMICA Y PSICODINAMICA EN PSICOLÓGÍA CLÍNICA; INTERVENCIÓN CLÍNICA EN FAMILIAS (2); INTERVENCIÓN CLÍNICA EN NIÑOS, ADOLESCENTES Y ADULTOS (2) |
| soc: Ciencias sociales | 40 | FILOSOFÍA Y EPISTEMOLOGÍA DE LA CIENCIA; MODELOS TEÓRICOS DE LA PSICOLOGÍA CONTEMPORÁNEA; PROCESOS PSICOLÓGICOS BÁSICOS; DESARROLLO PSICOLÓGICO DE LA INFANCIA Y LA ADOLESCENCIA; DESARROLLO PSICOLÓGICO DE LA ADULTEZ Y LA SENECTUD; PROCESOS PSICOLÓGICOS SUPERIORES |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| PSICOETICA | integral | excepción: Ética aplicada a psicología; distinguir de genética |
| DISENO DE INSTRUMENTOS PARA LA EVALUACION | soc | contexto: título ambiguo interpretado según la disciplina del plan |
| INTRODUCCION A LAS ORGANIZACIONES | integral | contexto: formación integral fuera del núcleo de negocios |
| COMPORTAMIENTO ORGANIZACIONAL | integral | contexto: formación integral fuera del núcleo de negocios |
| DIAGNOSTICO ORGANIZACIONAL | integral | contexto: formación integral fuera del núcleo de negocios |
| INTERVENCION EN DESARROLLO ORGANIZACIONAL | integral | contexto: formación integral fuera del núcleo de negocios |
| PRACTICA SUPERVISADA | soc | contexto: título ambiguo interpretado según la disciplina del plan |
| PRACTICA INTEGRATIVA | soc | contexto: título ambiguo interpretado según la disciplina del plan |
| INTRODUCCION A LA FORENSE | soc | contexto: título ambiguo interpretado según la disciplina del plan |
| INTERVENCION EN DIFICULTADES ESPECIFICAS EN EL APRENDIZAJE (1) | soc | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION DE EMPRESAS (3) | integral | contexto: formación integral fuera del núcleo de negocios |
| CONSULTORIA PROFESIONAL (3) | soc | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.69. mapa-curricular-lrelacionescomerciales-esca-ust-utepepan

Unidades académicas: ESCA. Año del plan: 2022. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-lrelacionescomerciales-esca-ust-utepepan.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 2 | Estadística descriptiva; Estadística inferencial |
| comp: Computación | 1 | Herramientas digitales básicas |
| datos: Ciencia de datos e IA | 2 | Taller de análisis de datos; OPTATIVA III Analítica de datos y tomas de decisiones |
| integral: Humanidades y gestión | 3 | Habilidades para la comunicación; Desarrollo humano; Comportamiento humano en el trabajo |
| prof: Práctica profesional | 1 | Seminario de investigación aplicada |
| esp: Especialidad | 4 | Optativa I; Optativa II; Electiva *; Optativa III |
| amb: Ambiente y energía | 1 | Desarrollo sustentable |
| ind: Operaciones y logística | 3 | Planeación de operaciones logísticas; Suply chain management; Taller de producción gráfica y audiovisual |
| adm: Administración y negocios | 50 | Técnicas y habilidades de ventas; Introducción a la mercadotecnia; Matemáticas para negocios; Economía de la empresa; Fundamentos de administración; Venta especializada |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| TECNICAS Y HABILIDADES DE VENTAS | adm | contexto: núcleo de negocios |
| INTRODUCCION A LA MERCADOTECNIA | adm | contexto: núcleo de negocios |
| MATEMATICAS PARA NEGOCIOS | adm | contexto: núcleo de negocios |
| ECONOMIA DE LA EMPRESA | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE ADMINISTRACION | adm | contexto: núcleo de negocios |
| VENTA ESPECIALIZADA | adm | contexto: núcleo de negocios |
| COMPORTAMIENTO DEL CONSUMIDOR | adm | contexto: vocabulario disciplinar de negocios y economía |
| INVESTIGACION DE MERCADOS CUALITATIVA | adm | contexto: núcleo de negocios |
| PENSAMIENTO INNOVADOR Y TOMA DE DECISIONES | adm | contexto: núcleo de negocios |
| MANEJO Y SEQUIMIENTO DE CLIENTES | adm | contexto: vocabulario disciplinar de negocios y economía |
| COMUNICACION COMERCIAL INTEORADA | adm | contexto: núcleo de negocios |
| INVESTIGACION DE MERCADOS CUANTITATIVA | adm | contexto: núcleo de negocios |
| MACROECONOMIA | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE DERECHO | adm | contexto: núcleo de negocios |
| APLICACIONES DE INFORMATICA COMERCIAL | adm | contexto: núcleo de negocios |
| MERCADOTECNIA ANALITICA | adm | contexto: núcleo de negocios |
| PUBLIC RELATIONS | adm | contexto: vocabulario disciplinar de negocios y economía |
| SISTEMAS DE INFORMACION COMERCIAL | adm | contexto: núcleo de negocios |
| DERECHO COMERCIAL | adm | contexto: núcleo de negocios |
| ADMINISTRACION ESTRATEGICA | adm | contexto: núcleo de negocios |
| SUPLY CHAIN MANAGEMENT | ind | excepción: Cadena de suministro; grafía OCR |
| MERCADOTECNIA ESTRATEGICA | adm | contexto: núcleo de negocios |
| PUBLICIDAD | adm | contexto: vocabulario disciplinar de negocios y economía |
| MARKET ANALYSIS AND MEASUREMENT | adm | contexto: vocabulario disciplinar de negocios y economía |
| MERCADOTECNIA DIGITAL | adm | contexto: núcleo de negocios |
| CONTABILIDAD DE NEGOCIOS Y COSTOS | adm | contexto: núcleo de negocios |
| PROPIEDAD INTELECTUAL | adm | contexto: núcleo de negocios |
| COMPRAS ESTRATEGICAS | adm | contexto: vocabulario disciplinar de negocios y economía |
| MERCADOTECNIA DIRECTA E INTERACTIVA | adm | contexto: núcleo de negocios |
| MEDIOS PUBLICITARIOS | adm | contexto: vocabulario disciplinar de negocios y economía |
| CREDITO, COBRANZAS Y PRESUPUESTOS | adm | contexto: núcleo de negocios |
| TENDENCIAS ECONOMICAS GLOBALES | adm | contexto: núcleo de negocios |
| ADMINISTRACION DE VENTAS | adm | contexto: núcleo de negocios |
| MARKETING ADVANCED TOPICS | adm | contexto: vocabulario disciplinar de negocios y economía |
| PROMOCION DE VENTAS | adm | contexto: núcleo de negocios |
| GESTION DIRECTIVA | adm | contexto: núcleo de negocios |
| ANALISIS FINANCIERO | adm | contexto: núcleo de negocios |
| DIRECCION COMERCIAL ESTRATEGICA | adm | contexto: núcleo de negocios |
| BRAND, PRODUCTS AND SERVICES | adm | contexto: vocabulario disciplinar de negocios y economía |
| DESARROLLO DE NEGOCIOS | adm | contexto: núcleo de negocios |
| OPTATIVA I MERCADOTECNIA DE SERVICIOS Y NEGOCIOS DIGITALES | adm | contexto: núcleo de negocios |
| OPTATIVA II MERCADOTECNIA SOCIAL | adm | contexto: núcleo de negocios |
| OPTATIVA III MERCADOTECNIA INTERNACIONAL EN NEGOCIOS DIGITALES | adm | contexto: núcleo de negocios |
| OPTATIVA I COMUNICACION DIGITAL EN SOCIAL MEDIA | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA II MERCHANDISING | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA III PROVECTOS DE COMUNICACION INTELIGENTE | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA I DIAGNOSTICO DE PROBLEMAS MERCADOLOGICOS | adm | contexto: núcleo de negocios |
| OPTATIVA II MODELOS DE INVESTIGACION E INTELIGENCIA DE MERCADOS | adm | contexto: núcleo de negocios |
| OPTATIVA I ADMINISTRACION RETAIL | adm | contexto: núcleo de negocios |
| OPTATIVA II E- BUSINESS | adm | contexto: vocabulario disciplinar de negocios y economía |
| OPTATIVA III GESTION DE CUENTAS CLAVE | adm | contexto: núcleo de negocios |

### 4.70. mapa-curricular-ltrabajosocial-cics-uma

Unidades académicas: CICS. Año del plan: 2025. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-ltrabajosocial-cics-uma.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 2 | ESTADISTICA INFERENCIAL; ESTADÍSTICA INFERENCIAL |
| comp: Computación | 2 | MANEJO DE LAS TIC BÁSICO; MANEJO DE LAS TIC AVANZADA |
| bio: Ciencias biológicas | 5 | BIOQUÍMICA BÁSICA; INMUNOLOGÍA BÁSICA; BIOLOGÍA CELULAR; INMUNOLOGÍA |
| integral: Humanidades y gestión | 24 | SOCIEDAD Y SALUD; COMUNICACIÓN ORAL Y ESCRITA BÁSICA; TRABAJO EN EQUIPO Y LIDERAZGO; ETICA PROFESIONAL DEL TRABAJADOR SOCIAL; ADMINISTRACIÓN; PLANIFICACIÓN EN TRABAJO SOCIAL |
| prof: Práctica profesional | 1 | METODOLOGÍA DE LA INVESTIGACIÓN SOCIAL |
| esp: Especialidad | 10 | ELECTIVA 1; OPTATIVA I; OPTATIVA II; OPTATIVA III; ELECTIVA 2; ELECTIVA I |
| salud: Ciencias de la salud | 17 | EMBRIOLOGÍA BÁSICA; HISTOLOGÍA; ANATOMÍA GENERAL; FISIOLOGÍA GENERAL; SALUD PÚBLICA; MICROBIOLOGÍA Y PARASITOLOGÍA |
| clin: Práctica clínica | 8 | PRÁCTICA COMUNITARIA DE SALUD PÚBLICA; DIAGNOSTICO INSTITUCIONAL; DIAGNOSTICO COMUNITARIO; SISTEMATIZACIÓN DE LA PRÁCTICA COMUNITARIA; OPTATIVA I TRABAJO SOCIAL CLINICO; REHABILITACIÓN |
| soc: Ciencias sociales | 59 | FILOSOFÍA INSTITUCIONAL; PEDAGOGÍA; ANTROPOLOGÍA SOCIAL; SOCIOLOGÍA; PSICOLOGÍA; LEGISLACIÓN SOCIAL |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| LEGISLACION SOCIAL | soc | contexto: formación social |
| ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| PLANIFICACION EN TRABAJO SOCIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION ESTRATEGICA E INNOVACION | integral | contexto: formación integral fuera del núcleo de negocios |
| EMPRENDIMIENTO EN TRABAJO SOCIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA III GESTION Y LIDERAZGO EN LOS SERVICIOS DE SALUD | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I POLITICA SOCIAL Y DERECHOS HUMANOS DE LOS GRUPOS PRIORITARIOS | soc | contexto: formación social |
| OPTATIVA III GESTION DE PROYECTOS CON GRUPOS PRIORITARIOS | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA II FORMAS DE COMUNICACION INCLUSIVA PARA LA ATENCION DE PERSONAS CON DISCAPACIDAD | soc | contexto: título ambiguo interpretado según la disciplina del plan |
| INVESTIGADOR SOCIAL | soc | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.71. mapa-curricular-lturismosustentable-upiip

Unidades académicas: UPIIP. Año del plan: 2020. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-lturismosustentable-upiip.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| integral: Humanidades y gestión | 5 | T/H C. TEPIC C. SATCA Desarrollo humano; Civilizaciones originarias de México; T/H C. TEPIC C. SATCA Desarrollo de habilidades del pensamiento y aprendizaje; Comunicación oral y escrita; Sociedad y cultura de México moderno |
| prof: Práctica profesional | 4 | Métodos y técnicas de investigación; Seminario de investigación turística sustentable I; Seminario de investigación turística sustentable II; C. TEPIC C. TEPIC Métodos cualitativos investigación |
| esp: Especialidad | 7 | Optativa I; Optativa II; Optativa III; Optativa IV; Optativa V; Optativa VI |
| amb: Ambiente y energía | 1 | T/H C. TEPIC C. SATCA Marco jurídico nacional e internacional de la sustentabilidad |
| ind: Operaciones y logística | 1 | Cultura organizacional y gestión de la calidad |
| adm: Administración y negocios | 48 | TIC aplicadas para el turismo; Matemáticas para la administración; Fundamentos del turismo; Administración; Estadística y probabilidad para el turismo; Turismo y medio ambiente |
| soc: Ciencias sociales | 2 | Sociología y turismo; Educación ambiental comunitaria |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| TIC APLICADAS PARA EL TURISMO | adm | contexto: núcleo de negocios |
| MATEMATICAS PARA LA ADMINISTRACION | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DEL TURISMO | adm | contexto: núcleo de negocios |
| ADMINISTRACION | adm | contexto: núcleo de negocios |
| ESTADISTICA Y PROBABILIDAD PARA EL TURISMO | adm | contexto: núcleo de negocios |
| TURISMO Y MEDIO AMBIENTE | adm | contexto: núcleo de negocios |
| POLITICAS PUBLICAS Y TURISMO | adm | contexto: núcleo de negocios |
| FUNDAMENTOS DE MERCADOTECNIA | adm | contexto: núcleo de negocios |
| T/H C. TEPIC C. SATCA TEMAS SELECTOS DE HISTORIA ECONOMICA DE MEXICO | adm | contexto: núcleo de negocios |
| ANALITICA DE DATOS PARA LA ACTIVIDAD TURISTICA | adm | contexto: vocabulario disciplinar de negocios y economía |
| DESTINOS TURISTICOS DE MEXICO | adm | contexto: vocabulario disciplinar de negocios y economía |
| TURISMO RURAL Y BIOCULTURALIDAD | adm | contexto: núcleo de negocios |
| CAPITAL HUMANO | adm | contexto: vocabulario disciplinar de negocios y economía |
| T/H C. TEPIC C. SATCA MICROECONOMIA | adm | contexto: núcleo de negocios |
| CONTABILIDAD FINANCIERA | adm | contexto: núcleo de negocios |
| REGIONES TURISTICAS DEL MUNDO | adm | contexto: vocabulario disciplinar de negocios y economía |
| GESTION DE EMPRESAS TURISTICAS DEL SECTOR SOCIAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| T/H C. TEPIC C. SATCA MACROECONOMIA | adm | contexto: núcleo de negocios |
| ANALISIS E INTERPRETACION DE LOS ESTADOS FINANCIEROS | adm | contexto: núcleo de negocios |
| DESTINOS TURISTICOS DEL MUNDO | adm | contexto: vocabulario disciplinar de negocios y economía |
| DISENO DE PRODUCTOS TURISTICOS ALTERNATIVOS | adm | contexto: vocabulario disciplinar de negocios y economía |
| PLANEACION Y ADMINISTRACION ESTRATEGICA | adm | contexto: núcleo de negocios |
| T/H C. TEPIC C. SATCA ECONOMIA REGIONAL Y SUSTENTABILIDAD | adm | contexto: núcleo de negocios |
| ADMINISTRACION FINANCIERA | adm | contexto: núcleo de negocios |
| MODELOS DE DESARROLLO TURISTICO SUSTENTABLE | adm | contexto: vocabulario disciplinar de negocios y economía |
| SISTEMAS DE GESTION AMBIENTAL PARA EMPRESAS TURISTICAS | adm | contexto: vocabulario disciplinar de negocios y economía |
| AUDITORIA ADMINISTRATIVA | adm | contexto: núcleo de negocios |
| GESTION DEL TURISMO SUSTENTABLE | adm | contexto: núcleo de negocios |
| RETOS ECONOMICO-SOCIALES Y AMBIENTALES DE MEXICO | adm | contexto: núcleo de negocios |
| NEGOCIACION COMUNITARIA | adm | contexto: núcleo de negocios |
| PLANIFICACION TURISTICA SUSTENTABLE | adm | contexto: vocabulario disciplinar de negocios y economía |
| PLANES DE NEGOCIOS TURISTICOS SUSTENTABLES | adm | contexto: vocabulario disciplinar de negocios y economía |
| T/H C. TEPIC C. SATCA LEGISLACION APICABLE AL TURISMO SUSTENTABLE | adm | contexto: núcleo de negocios |
| INNOVACION EN LAS EMPRESAS TURISTICAS | adm | contexto: vocabulario disciplinar de negocios y economía |
| DESARROLLO TURISTICO COMUNITARIO | adm | contexto: vocabulario disciplinar de negocios y economía |
| GESTION DE PROYECTOS TURISTICOS SUSTENTABLES | adm | contexto: vocabulario disciplinar de negocios y economía |
| DISENO DE ACTIVIDADES TURISTICAS SUSTENTABLES | adm | contexto: vocabulario disciplinar de negocios y economía |
| C. TEPIC C. SATCA ADMINISTRACION DEL TIEMPO LIBRE Y RECREACION | adm | contexto: núcleo de negocios |
| DISENO Y ADMINISTRACION DE PROCESOS DE NEGOCIOS | adm | contexto: núcleo de negocios |
| C. TEPIC C. SATCA TEORIA DEL TURISMO | adm | contexto: núcleo de negocios |
| INTERNET DE LAS COSAS PARA EL TURISMO | adm | contexto: núcleo de negocios |
| C. TEPIC C. SATCA TURISMO ALTERNATIVO | adm | contexto: núcleo de negocios |
| DIRECCION Y ADMINISTRACION DE VENTAS | adm | contexto: núcleo de negocios |
| GESTION DE DATOS PARA LA TOMA DE DECISIONES | adm | contexto: núcleo de negocios |
| C. TEPIC C. SATCA NORMATIVIDAD Y CERTIFICACION DE COMPETENCIAS LABORALES Y EMPRESAS TURISTICAS | adm | contexto: vocabulario disciplinar de negocios y economía |
| C. TEPIC C. SATCA PLANIFICACION Y GESTION DEL DESARROLLO TURISTICO MUNICIPAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| C. TEPIC C. SATCA FORMACION DIRECTIVA EMPRESARIAL | adm | contexto: vocabulario disciplinar de negocios y economía |
| C. TEPIC C. SATCA OPERACION Y RETOS DE LAS EMPRESAS TURISTICAS | adm | contexto: vocabulario disciplinar de negocios y economía |

### 4.72. mapa-curricular-mch-enmh

Unidades académicas: ENMH. Año del plan: 2003. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-mch-enmh.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| elec: Electrónica | 1 | BÚSQUEDA ELECTRÓNICA DE INFORMACIÓN |
| bio: Ciencias biológicas | 2 | GENÉTICA |
| integral: Humanidades y gestión | 8 | COMPRENSIÓN DE LECTURA DE INGLÉS TÉCNICO; BIOÉTICA; BIOÉTICA CLÍNICA; ESTRATEGIAS DE COMPRENSIÓN DE LECTURA Y COMUNICACIÓN; LIDERAZGO; PRINCIPIOS DE ADMINISTRACIÓN |
| prof: Práctica profesional | 5 | METODOLOGÍA DE LA INVESTIGACIÓN Y ESTADÍSTICA I; METODOLOGÍA DE LA INVESTIGACIÓN Y ESTADÍSTICA II; ANÁLISIS DE LA INFORMACIÓN |
| ind: Operaciones y logística | 1 | CULTURA DE LA CALIDAD |
| salud: Ciencias de la salud | 88 | ANATOMÍA HUMANA I; EMBRIOLOGÍA HUMANA; BIOQUÍMICA MÉDICA I; HISTOLOGÍA HUMANA; INFORMÁTICA MÉDICA; ANATOMÍA HUMANA II |
| clin: Práctica clínica | 26 | INTRODUCCIÓN A LA CIRUGÍA; INTRODUUCCIÓN A LA CLÍNICA; FARMACOLOGÍA CLÍNICA; INTRODUUCCION A LA CLINICA TERAPEUTICA HOMEOPATÍA; INMUNOLOGÍA CLÍNICA; CLÍNICA TERAPEUTICA HOMEOPATÍA I |
| soc: Ciencias sociales | 8 | HISTORIA DE LA MEDICINA Y DE LA HOMEOPATÍA; SOCIOLOGÍA MÉDICA; ANTROPOLOGÍA MÉDICA; PSICOLOGÍA MÉDICA; EDUCACIÓN PARA LA CULTURA Y LA SALUD |
| sin_categoria: Sin categoría | 1 | II/SEMANA INTERVALO H/SEMANA INTERVALO CRÉDITOS |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ANALISIS DE LA INFORMACION | prof | contexto: título ambiguo interpretado según la disciplina del plan |
| PRINCIPIOS DE ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.73. mapa-curricular-mcp-enmyh

Unidades académicas: No indicada. Año del plan: 2003. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-mcp-enmyh.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| elec: Electrónica | 1 | BUSQUEDA ELECTRÓNICA DE INFORMACIÓN |
| bio: Ciencias biológicas | 1 | GENÉTICA |
| integral: Humanidades y gestión | 5 | BIOÉTICA; BIOÉTICA CLÍNICA; ESTRATEGIAS DE COMPRENSIÓN DE LECTURA Y COMUNICACIÓN; PRINCIPIOS DE ADMINISTRACIÓN; LIDERAZGO |
| prof: Práctica profesional | 3 | METODOLOGÍA DE LA INVESTIGACIÓN Y ESTADÍSTICA I; METODOLOGÍA DE LA INVESTIGACIÓN Y ESTADÍSTICA II; ANÁLISIS DE LA INFORMACIÓN |
| ind: Operaciones y logística | 1 | CULTURA DE LA CALIDAD |
| salud: Ciencias de la salud | 45 | ANATOMÍA HUMANA I; EMBRIOLOGÍA HUMANA; BIOQUÍMICA MÉDICA I; HISTOLOGÍA HUMANA; ANATOMÍA HUMANA II; FISIOLOGÍA HUMANA I |
| clin: Práctica clínica | 11 | INTRODUCIÓN A LA CIRUGÍA; INTRODUCIÓN A LA CLÍNICA; FARMACOLOGÍA CLÍNICA; INMUNOLOGÍA CLÍNICA; CIRUGÍA Y ANESTESIOLOGÍA; URGENCIAS MÉDICO QUIRURGICAS |
| soc: Ciencias sociales | 5 | HISTORIA Y FILOSOFÍA DE LA MEDICINA COMPENSIÓN DE LECTORA DE INOLES TÉCNICO; SOCIOLOGÍA MÉDICA; ANTROPOLOGÍA MÉDICA; PSICOLOGÍA MÉDICA; EDUCACIÓN PARA LA CULTURA Y LA SALUD |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| PRINCIPIOS DE ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| ANALISIS DE LA INFORMACION | prof | contexto: título ambiguo interpretado según la disciplina del plan |

### 4.74. mapa-curricular-medicocirujanoypartero-esm

Unidades académicas: No indicada. Año del plan: No indicado en la entrada. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapa-curricular-medicocirujanoypartero-esm.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| bio: Ciencias biológicas | 1 | GENETICA TyP |
| integral: Humanidades y gestión | 2 | BIOETICA T; INGLÉS MÉDICO TyP |
| prof: Práctica profesional | 2 | METODOLOGÍA DE INVESTIGACIÓN I TyP; METODOLOGÍA DE LA INVESTIGACIÓN II TyP |
| salud: Ciencias de la salud | 44 | ANATOMÍA HUMANA TyP; EMBRIOLOGÍA TyP; INTRODUCCIÓN A LA SALUD PÚBLICA TyP; BIOQUÍMICA MÉDICA I TyP; HISTOLOGÍA HUMANA TyP; NEUROANATOMÍA TyP |
| clin: Práctica clínica | 7 | INTRODUCCIÓN A LA CLINICA TyP; TERAPEUTICA MEDICA TyP; INTRODUCCIÓN A LA CIRUGÍA TyP; SEMESTRAL CIRUGÍA TyP; URGENCIAS MÉDICO QUIRÜRGICAS TyP; SEMESTRES XI Y XII (INTERNADO ROTATORIO DE PREGRADO BIMESTRAL POR UNIDAD DE APRENDIZAJE) MEDICINA INTERNA TyP |
| soc: Ciencias sociales | 3 | ANTROPOLOGÍA MEDICA TyP; PSICOLOGÍA MEDICA T; MEDICINA FAMILIAR Y/O COMUNITARIA TyP |

Materias dudosas por excepción o contexto:

Ninguna decisión por excepción o contexto.

### 4.75. mapa-curricular-qbp-encb

Unidades académicas: ENCB. Año del plan: 2018. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-qbp-encb.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 2 | MATEMÁTICAS BÁSICAS; BIOESTADÍSTICA |
| comp: Computación | 1 | BIOINFORMÁTICA |
| datos: Ciencia de datos e IA | 1 | QUÍMICA ANALÍTICA |
| bio: Ciencias biológicas | 17 | BIOLOGÍA CELULAR DE EUCARIOTES; MICROBIOLOGÍA GENERAL; BIOQUÍMICA GENERAL; BIOTECNOLOGÍA VEGETAL; ECOLOGÍA MICROBIANA; GENÉTICA MICROBIANA |
| quim: Química | 6 | QUÍMICA INORGÁNICA; FISICOQUÍMICA; QUÍMICA ORGÁNICA; QUÍMICA BIOORGÁNICA; MÉTODOS DE ANÁLISIS; MÉTODOS ESPECTROSCÓPICOS |
| proc: Ingeniería de procesos | 1 | MICROBIOLOGÍA Y TOXICOLOGÍA DE LOS ALIMENTOS |
| integral: Humanidades y gestión | 1 | BIOÉTICA |
| prof: Práctica profesional | 1 | METODOLOGÍA DE LA INVESTIGACIÓN |
| esp: Especialidad | 3 | OPTATIVA 1; OPTATIVA 2; OPTATIVA 3 |
| amb: Ambiente y energía | 1 | DESARROLLO SUSTENTABLE |
| ind: Operaciones y logística | 1 | GESTIÓN DE LA CALIDAD |
| salud: Ciencias de la salud | 10 | HISTOLOGÍA Y ORGANOGRAFÍA MICROSCÓPICA; FISIOLOGÍA HUMANA; FISIOLOGÍA Y BIOQUÍMICA MICROBIANA; MICROLOGÍA MÉDICA; PATOLOGÍA; BACTERIOLOGÍA MÉDICA |
| clin: Práctica clínica | 2 | BIOQUÍMICA CLÍNICA; SISTEMAS DE CONTROL DE CALIDAD EN EL LABORATORIO CLÍNICO |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| METODOS DE ANALISIS | quim | contexto: título ambiguo interpretado según la disciplina del plan |
| FITOPANOLOGIA | bio | excepción: Lectura OCR de fitopatología; verificar original |

### 4.76. mapa-curricular-qfi-encb

Unidades académicas: ENCB. Año del plan: 2015. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-qfi-encb.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 2 | CÁLCULO DIFERENCIAL E INTEGRAL; BIOESTADÍSTICA |
| datos: Ciencia de datos e IA | 2 | QUÍMICA ANALÍTICA; MÉTODOS DE SEPARACIÓN E INSTRUMENTACIÓN ANALÍTICA |
| bio: Ciencias biológicas | 3 | BIOQUÍMICA GENERAL; INMUNOLOGÍA GENERAL*; MICROBIOLOGÍA GENERAL |
| quim: Química | 5 | QUÍMICA INORGÁNICA; QUÍMICA ORGÁNICA I*; TÓPICOS SELECTOS DE FISICOQUÍMICA; QUÍMICA ORGÁNICA II*; FITOQUÍMICA |
| integral: Humanidades y gestión | 6 | COMUNICACIÓN ORAL Y ESCRITA; PROBLEMAS SOCIALES Y LA PROFESIÓN; PSICOSOCIOLOGÍA DE LAS RELACIONES HUMANAS; ANÁLISIS DE LA LECTURA; LEGISLACIÓN FARMACÉUTICA; ADMINISTRACIÓN FARMACÉUTICA |
| prof: Práctica profesional | 5 | INTRODUCIÓN A LA INGENIERÍA FARMACÉUTICA; PERSPECTIVAS DEL ÁREA PROFESIONAL; PROYECTO DE TITULACIÓN I; PROYECTO DE TITULACIÓN II; PROYECTO DE TITULACIÓN III |
| esp: Especialidad | 2 | ELECTIVA; OPTATIVA |
| ind: Operaciones y logística | 2 | SISTEMAS DE CALIDAD; ASEGURAMIENTO DE LA CALIDAD |
| salud: Ciencias de la salud | 18 | ANATOMÍA HUMANA; FÍSICA FARMACÉUTICA; BOTÁNICA APLICADA A LA FARMACIA; FISICOQUÍMICA FARMACÉUTICA; FISIOLOGÍA CELULAR*; FISIOLOGÍA HUMANA* |
| clin: Práctica clínica | 1 | BASES FARMACOLÓGICAS DE LA TERAPÉUTICA* |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| LEGISLACION FARMACEUTICA | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION FARMACEUTICA | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.77. mapa-curricular-upiicsa-ing-inf

Unidades académicas: UPIICSA. Año del plan: 2021. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/mapa-curricular-upiicsa-ing-inf.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 8 | Matemáticas discretas; Fundamentos de física; Física general experimental; Cálculo diferencial e integral; Probabilidad; Estadística |
| comp: Computación | 21 | Lógica de programación; Fundamentos de ingeniería de software; Estructura de datos; Programación de bajo nivel; Algoritmos computacionales; Ingeniería de requerimientos |
| datos: Ciencia de datos e IA | 4 | Construcción de bases de datos; Fundamentos de inteligencia artificial; Ingeniería del conocimiento; Fundamentos de analitica de datos |
| elec: Electrónica | 3 | Sistemas digitales; Aplicación de sistemas digitales; Dispositivos programables |
| ctrl: Control y automatización | 2 | Adquisición de datos; TI PARA LA INDUSTRIA COMPUTARIZADA TEORIA PRÁCTICA T/H CRÉDITOS TEPIC OPTATIVA I Sistemas embebidos (Laboratorio de electricidad y control) |
| redes: Telecomunicaciones | 3 | Comunicación de datos; Redes conectividad; Redes y modelos de simulación |
| integral: Humanidades y gestión | 18 | Comunicación profesional interdisciplinaria; Fundamentos de administración; Responsabilidad social y ética; Arquitectura y organización de las computadoras; Administración de bases de datos; Contabilidad financiera y costos |
| prof: Práctica profesional | 2 | Metodología de la investigación; Proyecto de titulación |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| amb: Ambiente y energía | 2 | SIMULACIÓN DE AMBIENTES VIRTUALES TEORIA PRÁCTICA T/H CRÉDITOS TEPIC OPTATIVA I Esenarios virtuales (Computación); OPTATIVA II Ambientes virtuales inmersivos (Computación) |
| ind: Operaciones y logística | 3 | Modelos determinísticos de investigación de operaciones; Calidad y normalización de software; OPTATIVA II Informática en ambientes productivos (Producción) |
| soc: Ciencias sociales | 1 | Psicología en el trabajo |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| FUNDAMENTOS DE ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| ARQUITECTURA Y ORGANIZACION DE LAS COMPUTADORAS | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA DE DISENO | comp | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION DE BASES DE DATOS | integral | contexto: formación integral fuera del núcleo de negocios |
| CONTABILIDAD FINANCIERA Y COSTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| APLICACION DE LA CIENCIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| INGENIERIA ECONOMICA | integral | contexto: formación integral fuera del núcleo de negocios |
| PRESUPUESTO Y FINANCIAS | integral | contexto: formación integral fuera del núcleo de negocios |
| REDES Y MODELOS DE SIMULACION | redes | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION ESTRATEGICA | integral | contexto: formación integral fuera del núcleo de negocios |
| LEGISLACION INFORMATICA | integral | contexto: formación integral fuera del núcleo de negocios |
| HABILIDADES DIRECTIVAS | integral | contexto: formación integral fuera del núcleo de negocios |
| INFORMATICA EMPRESARIAL | integral | contexto: formación integral fuera del núcleo de negocios |
| GESTION DE PROYECTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION DE TECNOLOGIAS | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA III MONITOREO Y ADMINISTRACION DE REDES (COMPUTACION) | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA III BIG DATA Y TOMA DE DECISIONES (INFORMATICA) | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.78. mapacurricular-iaeronautica-esimetic-upiig

Unidades académicas: ESIME, UPIIG. Año del plan: 2003. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapacurricular-iaeronautica-esimetic-upiig.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 20 | CÁLCULO DIFERENCIAL E INTEGRAL; FÍSICA CLÁSICA; FUNDAMENTOS DE ÁLGEBRA; CÁLCULO VECTORIAL; ECUACIONES DIFERENCIALES; ELECTRICIDAD Y MAGNETISMO |
| comp: Computación | 8 | FUNDAMENTOS DE PROGRAMACIÓN; PROGRAMACIÓN ORIENTADA A OBJETOS; DISEÑO POR COMPUTADORA; DINÁMICA DE FLUIDOS COMPUTACIONALES; APLICACIONES DE SOFTWARE EN INGENIERÍA |
| datos: Ciencia de datos e IA | 1 | DISEÑO DE BASES DE DATOS --- FUNDAMENTOS DE MOTORES DE COMBUSTIÓN INTERNA |
| elec: Electrónica | 8 | FUNDAMENTOS DE CIRCUITOS ELÉCTRICOS; SISTEMA ELÉCTRICO EN AERONAVES; DISPOSITIVOS ANALÓGICOS Y DIGITALES; SISTEMAS ELECTRÓNICOS DIGITALES; AVIÓNICA; MANTENIMIENTO AVIÓNICO (6) 3.0 1.5 4.5 RENDIMIENTOS Y PRUEBAS DE SISTEMAS PROPULSIVOS (6) |
| ctrl: Control y automatización | 2 | SISTEMAS DE CONTROL EN AERONAVES; ANÁLISIS DE SISTEMAS DINÁMICOS |
| redes: Telecomunicaciones | 1 | COMUNICACIONES AERONÁUTICAS |
| quim: Química | 4 | QUÍMICA BÁSICA; QUÍMICA APLICADA |
| proc: Ingeniería de procesos | 1 | DISEÑO DE ELEMENTOS DE MOTORES AERORREACTORES |
| integral: Humanidades y gestión | 14 | HUMANIDADES I: INGENIERÍA, CIENCIA Y SOCIEDAD; HUMANIDADES II: LA COMUNICACIÓN Y LA INGENIERÍA; HUMANIDADES III: DESARROLLO HUMANO; HUMANIDADES IV: DESARROLLO PERSONAL Y PROFESIONAL; HUMANIDADES V: EL HUMANISMO FRENTE A LA GLOBALIZACIÓN; PLANEACIÓN Y EVALUACIÓN DE PROYECTOS |
| prof: Práctica profesional | 2 | METODOLOGÍA DE LA INVESTIGACIÓN O TÓPICOS SELECTOS DE INGENIERÍA I (1 a 4) MATERIALES COMPUESTOS; METODOLOGÍA DE LA INVESTIGACIÓN O TÓPICOS SELECTOS DE INGENIERÍA (5 o 6) |
| esp: Especialidad | 1 | OPTATIVA I |
| mec: Mecánica y materiales | 47 | INGENIERÍA DE MATERIALES; MECÁNICA DE SÓLIDOS; TERMODINÁMICA Y PRINCIPIOS DE TRANSFERENCIA DE CALOR; DINÁMICA DE FLUIDOS; FLEXIÓN; METROLOGÍA |
| civil: Construcción y tierra | 6 | DINÁMICA ESTRUCTURAL; CONSTRUCCIONES AERONÁUTICAS; MECÁNICA ESTRUCTURAL DE MATERIALES COMPUESTOS; INGENIERÍA DE CONSTRUCCIÓN DE MOTORES; AEROPUERTOS; INGENIERÍA DE AEROPUERTOS (5) |
| amb: Ambiente y energía | 1 | METEOROLOGÍA |
| ind: Operaciones y logística | 2 | INGENIERÍA DE OPERACIONES; PROYECTO DE INGENIERÍA O TÓPICOS SELECTOS DE INGENIERÍA II (5 o 6) --- SISTEMAS DE CALIDAD |
| sin_categoria: Sin categoría | 4 | OPTATIVA TECNOLOGÍA (4); OPTATIVA II (5 o 6); OPTATIVA IV (5 o 6); TÓPICOS SELECTOS DE INGENIERÍA II |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| TERMODINAMICA Y PRINCIPIOS DE TRANSFERENCIA DE CALOR | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| ANALISIS MATRICIAL DE ESTRUCTURAS | mec | contexto: estructuras aeronáuticas |
| ESTRUCTURAS DE PARED DELGADA | mec | contexto: estructuras aeronáuticas |
| OPTATIVA ESTRUCTURAS I | mec | contexto: estructuras aeronáuticas |
| PLANEACION Y EVALUACION DE PROYECTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA ESTRUCTURAS II (1) | mec | contexto: estructuras aeronáuticas |
| LEGISLACION AERONAUTICA | integral | contexto: formación integral fuera del núcleo de negocios |
| TEORIA DE LA ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.79. mapacurricular-imecanica-esimeazc

Unidades académicas: No indicada. Año del plan: No indicado en la entrada. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/mapacurricular-imecanica-esimeazc.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 10 | CÁLCULO DIFERENCIAL E INTEGRAL; FÍSICA CLÁSICA; FUNDAMENTOS DE ÁLGEBRA; CÁLCULO VECTORIAL; ELECTRICIDAD Y MAGNETISMO; MÉTODOS NUMÉRICOS |
| comp: Computación | 6 | FUNDAMENTOS DE PROGRAMACIÓN; DIBUJO ASISTIDO POR COMPUTADORA; MANUFACTURA ASISTIDA POR COMPUTADORA; DISEÑO ASISTIDO POR COMPUTADORA |
| elec: Electrónica | 6 | CIRCUITOS ELÉCTRICOS; ELECTRÓNICA DE POTENCIA APLICADA; ELECTRÓNICA DIGITAL APLICADA; INSTALACIONES ELÉCTRICAS |
| ctrl: Control y automatización | 4 | INTRODUCCIÓN A SISTEMAS AUTOMÁTICOS; CONTROL NUMÉRICO COMPUTARIZADO |
| quim: Química | 5 | QUÍMICA BÁSICA; QUÍMICA APLICADA; INGENIERÍA QUÍMICA |
| proc: Ingeniería de procesos | 4 | AUTOMATIZACIÓN DE PROCESOS INDUSTRIales; INSTRUMENTACIÓN Y CONTROL DE PROCESOS INDUSTRIales |
| integral: Humanidades y gestión | 5 | HUMANIDADES I: INGENIERÍA, CIENCIA Y SOCIEDAD; HUMANIDADES II: LA COMUNICACIÓN Y LA INGENIERÍA; ADMINISTRACIÓN; ANÁLISIS ECONÓMICO; HUMANIDADES V: EL HUMANISMO FRENTE A LA GLOBALIZACIÓN |
| prof: Práctica profesional | 1 | PROYECTO DE INGENIERÍA O TÓPICOS SELECTOS DE INGENIERÍA II |
| esp: Especialidad | 3 | OPTATIVA |
| mec: Mecánica y materiales | 44 | CIENCIA DE LOS MATERIALES I; ESTÁTICA; METROLOGÍA DIMENSIONAL; DINÁMICA DEL CUERPO RÍGIDO; MECÁNICA DE FLUIDOS I; MECÁNICA DE MATERIALES II |
| civil: Construcción y tierra | 6 | MÁQUINAS HIDRÁULICAS; BOMBAS HIDRÁULICAS; TURBINAS Y PLANTAS HIDRÁULICAS |
| amb: Ambiente y energía | 4 | FUENTES ALTERNAS DE ENERGÍA; INGENIERÍA AMBIENTAL |
| ind: Operaciones y logística | 6 | SISTEMAS DE CALIDAD; DISEÑO DE SISTEMAS DE PRODUCCIÓN; SISTEMAS MODERNOS DE PRODUCCIÓN |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| ELECTRICIDAD Y MAGNETISMO | fm | excepción: Fundamentos físicos; distinguir de ingeniería eléctrica |
| ADMINISTRACION | integral | contexto: formación integral fuera del núcleo de negocios |
| TERMODINAMICA II | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| TRANSFERENCIA DE CALOR | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| ANALISIS ECONOMICO | integral | contexto: formación integral fuera del núcleo de negocios |
| PROYECTO DE INGENIERIA O TOPICOS SELECTOS DE INGENIERIA II | prof | contexto: proyecto de integración profesional en ingeniería; confirmar alternativa de tópicos |

### 4.80. portada-medico-cirujano-y-partero-cics-uma

Unidades académicas: CICS. Año del plan: 2025. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/portada-medico-cirujano-y-partero-cics-uma.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 2 | BIOESTADISTICA; (OPTATIVA 1) BASES DE LA TERAPIA FÍSICA |
| bio: Ciencias biológicas | 11 | BIOQUIMICA BASICA; BIOLOGIA CELULAR; INMUNOLOGIA BASICA; BIOQUIMICA DEL SISTEMA VISCERAL; INMUNOLOGIA DEL SISTEMA VISCERAL; BIOQUIMICA DEL SISTEMA CIRCULATORIO |
| integral: Humanidades y gestión | 8 | TRABAJO EN EQUIPO Y LIDERAZGO; COMUNICACION ASERTIVA; EMPRENDEDURISMO; INGLES BASICO; BIOETICA MEDICA; INGLES MEDICO |
| prof: Práctica profesional | 3 | METODOLOGIA DE LA INVESTIGACIÓN; (OPTATIVA 1) BASES DE LA EVIDENCIA CIENTÍFICA; (OPTATIVA 2) REVISIÓN SISTEMÁTICA Y METAANÁLISIS |
| esp: Especialidad | 4 | OPTATIVA 1; ELECTIVA I; OPTATIVA 2; ELECTIVA II |
| civil: Construcción y tierra | 1 | PATOLOGIA ESTRUCTURAL |
| salud: Ciencias de la salud | 45 | FISIOLOGIA CELULAR; EMBRIOLOGIA BASICA; HISTOLOGIA BASICA; ANATOMIA GENERAL; MICROBIOLOGIA Y PARASITOLOGIA; FARMACOLOGIA GENERAL |
| clin: Práctica clínica | 32 | PRACTICA COMUNITARIA DE PROMOCIÓN DE LA SALUD; PROPEDEUTICA MEDICA; TECNICAS BASICAS CLINICO-QUIRURGICAS; METODOS DE APOYO DIAGNOSTICO; TERAPEUTICA MEDICA; CLINICA DE GASTROENTEROLOGIA |
| soc: Ciencias sociales | 12 | FILOSOFIA INSTITUCIONAL; ECOLOGÍA Y EDUCACION AMBIENTAL PARA LA SUSTENTABILIDAD; PSICOLOGIA MEDICA; HISTORIA Y FILOSOFIA DE LA MEDICINA; ANTROPOLOGIA MEDICA; INVESTIGACION COMUNITARIA DEL SISTEMA VISCERAL |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| EMPRENDEDURISMO | integral | contexto: formación integral fuera del núcleo de negocios |
| UNIDAD INTEGRATIVA DEL SISTEMA VISCERAL | salud | contexto: título ambiguo interpretado según la disciplina del plan |
| UNIDAD INTEGRATIVA DEL SISTEMA CIRCULATORIO | salud | contexto: título ambiguo interpretado según la disciplina del plan |
| UNIDAD INTEGRATIVA DEL SISTEMA SOMATICO | salud | contexto: título ambiguo interpretado según la disciplina del plan |
| UNIDAD INTEGRATIVA DEL SISTEMA NEUROENDOCRINO | salud | contexto: título ambiguo interpretado según la disciplina del plan |
| ADMINISTRACION DE INSTITUCIONES DE SALUD | integral | contexto: formación integral fuera del núcleo de negocios |
| MERCADOTECNIA APLICADA A CIENCIAS DE LA SALUD | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.81. upiem-mapa-curricular-ing-sistemas-energeticos-y-redes-inteligentes-2019-1

Unidades académicas: UPIEM. Año del plan: 2019. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizado/upiem-mapa-curricular-ing-sistemas-energeticos-y-redes-inteligentes-2019-1.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 11 | Algebra lineal; Cálculo diferencial e integral; Fundamentos de física clásica; Análisis vectorial; Ecuaciones diferenciales; Variable compleja |
| comp: Computación | 4 | Programación básica; Programación avanzada; Sistemas de información; Seguridad informática |
| datos: Ciencia de datos e IA | 2 | Bases de datos; Inteligencia artificial |
| elec: Electrónica | 11 | Electromagnetismo; Teoria de redes; Teoria de circuitos eléctricos (régimen permanente); Fundamentos de electrónica; Teoria de circuitos eléctricos (régimen dinámico); Señales y sistemas |
| ctrl: Control y automatización | 5 | Instrumentación; Microcomputadoras y microcontroladores; Modelado y simulación; Máquinas eléctricas y controladores electrónicos; Control y automatización |
| redes: Telecomunicaciones | 3 | Sistemas de comunicaciones; Redes de telecomunicaciones; Interfaces y protocolos de comunicación |
| quim: Química | 2 | Química inorganica; Química aplicada |
| proc: Ingeniería de procesos | 2 | Termodinámica; Ingeniería de procesos |
| integral: Humanidades y gestión | 9 | Comunicación asertiva; Tecnología y sociedad; Solución de problemas; Liderazgo; Gestión del capital humano y administración financiera; Administración y control de sistemas |
| prof: Práctica profesional | 2 | Seminario de investigación; Proyecto terminal |
| esp: Especialidad | 3 | Optativa I; Optativa II; Optativa III |
| mec: Mecánica y materiales | 1 | Tecnología de materiales |
| civil: Construcción y tierra | 1 | Diseño, construcción yuesta en marcha de sistemas energéticos |
| amb: Ambiente y energía | 6 | Desarrollo sustentable; Fuentes de energía; Conversión de energía; Eficiencia energética; OPTATIVA I Generalización centralizada; OPTATIVA II Generación distribuida |
| ind: Operaciones y logística | 3 | Almacenamiento de energía; Calidad de la energía; Normalización y estandares |
| salud: Ciencias de la salud | 1 | OPTATIVA II Sistemas de alimentación de vehículos hibridos y eléctricos |
| soc: Ciencias sociales | 1 | Politicas públicas |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| TEORIA DE REDES | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| MODELADO Y SIMULACION | ctrl | contexto: título ambiguo interpretado según la disciplina del plan |
| REDES Y MICROREDES INTELIGENTES | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| GESTION DEL CAPITAL HUMANO Y ADMINISTRACION FINANCIERA | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION Y CONTROL DE SISTEMAS | integral | contexto: formación integral fuera del núcleo de negocios |
| NEGOCIACION | integral | contexto: formación integral fuera del núcleo de negocios |
| MERCADOS ENERGETICOS | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I GENERALIZACION CENTRALIZADA | amb | excepción: Posible OCR de generación centralizada; confirmar tema |
| OPTATIVA III SISTEMAS AISLADOS | elec | contexto: título ambiguo interpretado según la disciplina del plan |
| OPTATIVA III GESTION DE REDES Y MICRORREDES | integral | contexto: formación integral fuera del núcleo de negocios |

### 4.82. upiiz--metalurgica--plan-2026--281-29

Unidades académicas: UPIIZ. Año del plan: 2026. Fuente: [mapa curricular](https://www.ipn.mx/assets/files/ofertaEducativa/mapa-curricular/superior/escolarizada/upiiz--metalurgica--plan-2026--281-29.pdf).

| Categoría | Materias (n) | Ejemplos (hasta 6) |
|---|---:|---|
| fm: Ciencias básicas | 8 | APLICACIONES DE CÁLCULO; PROBABILIDAD Y ESTADÍSTICA; APLICACIONES MATEMÁTICAS; Cálculo diferencial e integral; Probabilidad y estadística; Algebra vectorial |
| comp: Computación | 4 | INTERFASES Y SUPERFICIES; MÉTODOS NUMÉRICOS Y HERRAMIENTAS COMPUTACIONALES; Métodos numéricos y herramientas computacionales; Interfases y superficies |
| elec: Electrónica | 2 | APLICACIONES DE ELECTRICIDAD Y MAGNETISMO; Aplicaciones de electricidad y magnetismo |
| ctrl: Control y automatización | 2 | INSTRUMENTACIÓN DE PROCESOS METALURGICOS *; Instrumentación de procesos metalúrgicos |
| quim: Química | 4 | QUÍMICA METALURGICA; ELECTROQUÍMICA Y CORROSIÓN; Química metalúrgica; Electroquímica y corrosión |
| proc: Ingeniería de procesos | 6 | TERMODINÁMICA METALURGICA; REDUCCIÓN Y REFINACIÓN; DISEÑO DE PLANTAS METALÚRGICAS *; Termodinámica metalúrgica; Reducción y refinación; Diseno de plantas metalurgicas |
| integral: Humanidades y gestión | 16 | Fundamentos y análisis económico en la metalúrgica; Habilidades comunicativas; Relaciones laborales; Ingeniería, ética y sociedad- Ciudadania digital; Emprendimiento e innovación en ingeniería metalúrgica; Habilidades para la alta dirección |
| prof: Práctica profesional | 7 | PROYECTO TERMINAL; Módulo dual con alternancia I *; Módulo dual con alternancia II *; Módulo dual con alternancia III *; Modulo dual con alternancia IV *; Proyecto terminal I |
| esp: Especialidad | 7 | OPTATIVA 1; OPTATIVA 2; OPTATIVA 3; Optativa I; Optativa II; Optativa III |
| mec: Mecánica y materiales | 45 | APLICACIONES DE MECÁNICA; ANÁLISIS QUÍMICO DE MINERALES, METALES Y ALEACIONES; PREPARACIÓN DE MINERALES *; MICROESTRUCTURA Y PROPIEDADES DE METALES Y ALEACIONES; DIAGRAMAS DE FASÉS EN METALURGIA; CONCENTRACIÓN DE MINERALES * |
| civil: Construcción y tierra | 2 | MINERALOGÍA; Mineralogía |
| amb: Ambiente y energía | 15 | BALANCE DE MATERIA Y ENERGÍA; TRATAMIENTOS DE EFLUENTES; RECICLADO; Balance de materia y energía; Tratamiento de efluentes; Reciclado de materiales |
| ind: Operaciones y logística | 5 | FENÓMENOS DE TRANSPORTE EN LA METALURGIA; Fenómenos de transporte en la metalurgia; Administración de la calidad; OPTATIVA III Cadena y lógistica de suministros; OPTATIVA 1 ADMINISTRACIÓN DE LA CALIDAD |

Materias dudosas por excepción o contexto:

| Materia normalizada | Categoría | Decisión que requiere revisión |
|---|---|---|
| MODELADO Y SIMULACION DE PROCESOS METALURGICOS * | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| FUNDAMENTOS Y ANALISIS ECONOMICO EN LA METALURGICA | integral | contexto: formación integral fuera del núcleo de negocios |
| EMPRENDIMIENTO E INNOVACION EN INGENIERIA METALURGICA | integral | contexto: formación integral fuera del núcleo de negocios |
| MODELADO Y SIMULACION DE PROCESOS METALURGICOS | mec | contexto: título ambiguo interpretado según la disciplina del plan |
| HABILIDADES PARA LA ALTA DIRECCION | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA I PLANEACION ESTRETEGICA | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTITIVA II ADMINISTRACION FINANCIERA | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA 1 COMERCIALIZACION | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTITIVA 2 DESARROLLO ORGANIZACIONAL | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA 3 DESARROLLO DE EMPRESAS | integral | contexto: formación integral fuera del núcleo de negocios |
| TOMA DE DECISIONES | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTITIVA 2 PLANEACION ESTRATEGICA | integral | contexto: formación integral fuera del núcleo de negocios |
| OPTATIVA 3 INGENIERIA DE COSTOS | integral | contexto: formación integral fuera del núcleo de negocios |
| ADMINISTRACION FINANCIERA DE EMPRESAS | integral | contexto: formación integral fuera del núcleo de negocios |
