# Estado del proyecto UPIITA_DEV (2026-10-01)

Herramientas web para la inscripción y la gestión escolar de la UPIITA, desarrolladas con el
Departamento de Gestión Escolar. Sin servidor propio: páginas estáticas generadas con Python.

## Páginas

| Página | Fuente | Salida compartida (sin logos) | Salida institucional (con logos) | Artefacto |
|---|---|---|---|---|
| Horarios UPIITA (mapa curricular + armador de horario) | `web/horarios.template.html` | `web/horarios.html` | `web/dist/horarios.html` | https://claude.ai/artifact/2ujcEF2YK8FZrYjoyPbKEk |
| Ventanilla (Dictamen y Electivas) | `web/sate/`, `web/tramites/` | SATE | `web/dist/sate/index.html` | Rutas `#/upiita/tramites/dictamen` y `#/upiita/tramites/electivas` |

Construir: `python tools/build_horarios.py`.
Sitio de prueba en vivo (versión con logos, autorizado por el equipo y TI): repositorio
`Silver-VS/Silver-VS.github.io`, carpeta `upiita/` → https://silver-vs.github.io/upiita/ (índice, `horarios.html`,
`sate/index.html`, `revision.html`, `assets/logos/`). La **Guía de revisión** (fuente: `web/revision.html`)
incluye instructivo, perfil de demostración (alumno ficticio de Biónica) y 32 casos de prueba con exportación a CSV. Para que el marcador abra el sitio, construir con
`UPIITA_SITE=https://silver-vs.github.io/upiita/` y copiar `web/dist/*` a `upiita/`.
Vista local: servidor `web` en `.claude/launch.json` (python http.server 8080 sobre `web/`).
Contraste: `python tools/contraste.py` (debe dar "pares bajo el mínimo: 0").

## Datos (data/)

- `horarios_upiita.json`: captura del SAES (Académica › Horarios) de periodo actual y próximo, 2026-10-01.
  Se obtiene recorriendo los postbacks ASP.NET de `/Academica/horarios.aspx` con sesión iniciada
  (carrera → plan → turno → lsNoPeriodos; radio optActual/optProximo; grid `ctl00_mainCopy_dbgHorarios`).
- `mapa_curricular_saes.json`: `/Academica/mapa_curricular.aspx` (GridView1: clave, tipo, créditos, horas).
- `trayectoria_{B,M,T}.json`: cajas y flechas extraídas de los PDF vectoriales (`tools/extract_mapa.py`).
- `seriacion_tutorias.json` + `seriacion.json` + `seriacion_reporte.md`: seriación de io.upiita.ipn.mx/tutorias
  cruzada con las flechas del PDF (`tools/analiza_seriacion.py`); el reporte lista incoherencias.
- `energia_areas.json`: áreas y seriación PROPUESTAS por nosotros para Energía (sin validar por academia).
- `especialidades.json`: líneas de optativas y reglas de seriación por nivel.
- `gestion_escolar/`: instructivo de electivas (2014), formatos DIE-01/02/03 y formulario 25-2 (PDF oficiales).
  El DIE-03 admite **una sola modalidad** de aprendizaje: Electivas genera un DIE-03 por modalidad (cada uno con sus horas
  y créditos) y un solo formulario.
- `identidad/originales/`: logos oficiales originales (IPN, plecas SEP/IPN, UPIITA).

## Decisiones tomadas

- **Desarrollo = versión con conexión al SAES** (decisión del 2026-10-01). La versión sin SAES (v1: Horarios
  hasta la versión 11 del artefacto, Electivas hasta la 6) queda como **legacy**: no se le agregan funciones.
  Todo cambio se hace sobre las plantillas actuales (`web/*.template.html`), donde el SAES es opcional.
- Botón **Usar mis datos del SAES** arriba, junto a carrera y periodo (Electivas: en el encabezado y en el paso 1).
  Abre un `<dialog>` con instrucciones, qué es un marcador, cómo mostrar la barra de marcadores y la alternativa
  de copiar el código (incluido el celular). Al ser un diálogo no mueve el mapa.
- **Desfase oficial vs. orden recomendado.** Regla del SAES: una reprobada se desfasa cuando pasan más de 2
  periodos sin acreditarla (Cita: "No tienes materias reprobadas de más de 2 periodos anteriores"). Se calcula
  con `Estado_Alumno.aspx` › `GV_Reprobadas` (periodo "20252", veces cursada) para el periodo que se planea
  (`perMeta`: el de la cita vigente o el siguiente al que se cursa). Estados: desfasada / riesgo (acreditar
  este periodo) / reciente (fecha límite). Los planes 2009 (B, M, T) van por niveles: **no** se marca atraso
  por semestre propuesto; solo Energía (`DESFASE_SEM`) lo muestra, como "atrasada según el semestre propuesto".
  La seriación por nivel se presenta como "se recomienda", no como falta.
- Con datos del SAES, el panel **Estado general** (mismo nombre que en el SAES) va arriba del mapa a todo lo ancho:
  6 cifras (promedio, créditos, periodo que planeas, carga autorizada, desfase oficial, cita), una línea por
  reprobada y una nota. Aparece solo al cargar datos, no al pasar el cursor, así que el mapa no se mueve al usarlo.
  La simbología muestra solo los estados presentes.
- Selector **claro/oscuro** junto al título (`tools/skins.py`, `THEME_BTN`; guarda `theme` en localStorage y se
  aplica antes de pintar). En `dist`, los logos cambian a su versión calada/blanca según el tema.
- Mapa personal: **verde** = la puede cursar el siguiente periodo (requisitos cumplidos, no acreditada ni en curso);
  **contorno verde** = sugerida para su carga; **gris con punto** = en curso; lo que falta para cursarla se lee en el inspector al pasar el cursor ("Te falta: …"); rojo =
  reprobada/desfasada. Ya no se marca "propuesta para tu semestre".
- **Simulación de fin de semestre** (Estado general, solo si hay materias en curso): interruptor que da por
  aprobadas las materias en curso; cada una es una pastilla Aprobada/Reprobada. Recalcula créditos ("Créditos al
  terminar"), mapa, sugerencias y desfase (la reprobada cuenta desde el periodo actual). Etiqueta "Simulación";
  se guarda en `hu.sim`; nunca toca los datos del SAES.
- Interruptor **Ver sugeridas** junto a la simbología: oculta/muestra solo el anillo de sugeridas (`hu.verSug`);
  el verde de "puedes cursarla" y los demás colores se quedan siempre como guía del orden.
- **Periodo escolar que se planea** = "Periodos escolares que cursaste" (Cita) + 1; se muestra junto a la duración
  de la carrera y la máxima (Cita). No se deduce del semestre de las materias (los planes 2009 van por niveles).
- Generador de horarios: **En la escuela de … a …** (descarta grupos fuera del rango) y **Descansos** (uno o
  varios: al menos 30 min–2 h libres entre dos horas, todos los días con clases o solo los días elegidos). Se guardan en `hu.gtime`.
- Generador: **Días a la semana** (sin límite, 3, 4, 5) y aviso del mínimo de días posible con todas las materias
  ("lo mínimo es ir N días"); cada opción muestra sus días. Se guarda en `hu.gtime.days`.
- **Desfasada = obligatoria**: la materia con desfase oficial se agrega sola a "quiero cursar" (etiqueta
  "obligatoria", no se puede quitar), el generador no la omite (avisa si los filtros la dejan sin grupos) y
  "Mi horario" avisa si falta. Sin ella el SAES no permite la reinscripción.
- Filtros **globales** de la oferta: "En la escuela de … a …" (`hu.gtime.a/b`, también lo usa el generador) y
  **Excluir profesores** (`hu.excl`; sus grupos cuentan como "No" y se ocultan con "Ocultar las marcadas como No";
  el generador los descarta). "Priorizar profesor" queda solo en el generador.
- **Exportar** imagen/PDF en dos estilos (`hu.expStyle`): *Colorido* (rango real de la semana, sin horas vacías
  antes/después) y *Minimalista* (tabla como el formato del equipo: renglones por cada cambio de hora, celdas
  unidas por día, huecos contiguos en gris, actividades propias en azul y unidas a lo ancho si se repiten,
  + lista de profesores por materia; PDF vertical). El encabezado indica el periodo y el periodo escolar.
- **Llenar huecos** (Armar horario): clic en un bloque vacío del calendario → la oferta muestra, de toda la carrera,
  los grupos con clase en ese bloque que no chocan con el horario (sin lo ya elegido ni acreditado); casilla
  "Solo lo que cabe en mi horario" para lo mismo sin elegir bloque. Con datos del SAES se marca "puedes cursarla".
  Al agregar un grupo desde un hueco, su materia pasa a las elegidas y el hueco se suelta.
- **Tildes**: el SAES publica los nombres sin acentos; `tools/acentos.py` (diccionario de palabras completas en
  mayúsculas) los restituye al construir ambas páginas. Si aparece una materia nueva sin tilde, agregar la palabra ahí.
- Exportación minimalista con bordes como el formato del equipo (gruesos: contorno, bajo el título, bajo los días y
  a la derecha de la hora; delgados el resto) y PDF en una sola hoja (horario + lista de profesores).
- Módulo **Exportar horario** (botón en "Mi horario" → ventana): estilo colorido/minimalista, incluir grupo y
  profesor en cada clase (`hu.expShow`), color de extracurriculares, y formatos Imagen (PNG), PDF (una hoja),
  **Excel** (.xlsx con ExcelJS 4.4.0 desde cdnjs: hojas "Horario" y "Profesores", celdas unidas, bordes
  gruesos/delgados, rellenos; se abre en Google Sheets) y copiar texto.
- **Horario inscrito**: el Lector guarda `horario_inscrito` ([grupo, clave, materia, profesores, [[día, ini, fin]]])
  de `Informacion_semestral/Horario_Alumno.aspx`. "Traer horario inscrito (SAES)" lo carga en la versión
  seleccionada: grupos que coinciden con la oferta capturada entran como materias; los que no, con las horas del SAES.
- **ISISA**: en la UPIITA solo existe la opción terminal (7.º–9.º, línea S del plan 08; no mencionar en la página que está en extinción). El mapa
  muestra solo esas 13 materias (`ISISA` en `tools/build_horarios.py`); S742/S846 (Tópicos selectos I/II) se muestran
  como Control inteligente I/II. Para ISISA, ante nombres repetidos se prefiere la clave S.
- **Escala automática** en pantallas anchas (`tools/skins.py`, `EARLY`): `--ui-zoom = clamp(1, ancho/1550, 1.35)`
  aplicado como `body{zoom}`; con zoom manual del navegador vuelve a 1 (no se acumula). Las medidas en `vh`
  se dividen entre `--ui-zoom`.
- Perfil de **otra carrera**: al explorar una carrera distinta se muestra un aviso (`SAES.mismatch`) con
  "Volver a…", "Usar datos de otra sesión" y ×; ocultarlo dura hasta cargar datos nuevos. Nada del perfil se
  aplica ni se modifica (Horarios: `isPersonal()`; Electivas: `liberadas()` compara la carrera).
- Materias **en curso** (`Informacion_semestral/Horario_Alumno.aspx`): no se sugieren y cuentan como requisito
  cumplido para planear el siguiente periodo.

- v1 (sin SAES): exploración; solo "la quiero cursar"; requisitos sugeridos con tinte suave.
- v2 (con SAES): marcador "Lector UPIITA" (`tools/lector_saes.js` → `tools/saes.py`) que en el SAES lee
  en modo solo lectura el Kárdex y la Cita de reinscripción, muestra un resumen y copia un JSON
  (`upiita_saes: 1`); el alumno lo pega en la página (Ctrl+V). Nada se envía a servidores; se guarda
  en localStorage (`saes.alumno`). Activa: acreditadas difuminadas, desfasadas/reprobadas, sugerencias
  hasta la carga autorizada, cita, promedio; en Electivas llena nombre/boleta/carrera y descuenta
  electivas ya liberadas (claves cuyo nombre es ELECTIVA).
- Nada de lo que cambia de tamaño va arriba del mapa (el mapa no debe moverse); `scrollbar-gutter: stable`.
- Si el SAES no publica aún el próximo periodo, se usa el actual y se avisa.
- Estilo visual "Aurora" por defecto (`tools/skins.py`); variantes con `#estilos`.
- Paleta web IPN #750946 + Noto Sans; WCAG 2.2 AA (`docs/IDENTIDAD.md`).
- Los artefactos públicos NO llevan logos IPN/UPIITA; la versión con logos es `web/dist/` para el
  servidor de la UPIITA, con visto bueno de la Coordinación de Imagen Institucional.
- Exportar horario: texto, imagen PNG (×3, ~4200 px) y PDF carta horizontal (pdf-lib bajo demanda).

## Pendientes

1. (Hecho 2026-10-01) Lector probado con una sesión real: boleta/nombre vienen de celdas "ETIQUETA: | valor"
   (no de Lbl_General); tablas `grvEstatus_alumno`, `CREDITOSCARRERA`, `alumno` y `MENSAJE` (reprobadas)
   leídas bien; el Kárdex también lista reprobadas (calificación < 6, se excluyen). La cita publicada puede
   ser la del periodo pasado: la página lo avisa (`citaPasada`).
2. (Hecho) Horarios publicado con la capacidad `downloads` para exportar PNG/PDF.
3. URL definitiva en el servidor de la UPIITA para el botón "Abrir Horarios" del marcador (dist).
4. Volver a capturar la oferta del próximo periodo antes de la inscripción.
5. Validar con academias: `data/seriacion_reporte.md` y las áreas de Energía.
6. Oficio de visto bueno a la CII (correspondenciacii@ipn.mx) para la versión con logos.
7. Límites de carga solo confirmados para Biónica (27/40/80); los demás llegan con los datos del SAES.

## Presentaciones (correo a directivos)

`docs/presentacion/`: `horarios.html` y `electivas.html` (estilos en `deck.css`), exportadas a PDF con Chrome headless y a PPTX
(imagen por diapositiva + notas de `data-notes`). Son dos propuestas independientes; capturas de la versión con logos.

## Carga en créditos (RGE 2011, art. 52)

- Las reprobadas pendientes **retienen sus créditos** hasta acreditarse: cuentan en la carga aunque no se inscriban, e
  inscribirlas (recursar) no suma de nuevo. Carga total = retenidos + créditos de materias nuevas.
- Regular: entre carga mínima y máxima (fr. I). Con adeudos: al menos la mínima y sin rebasar la media (fr. II).
- La "carga autorizada" del SAES se interpreta como **tope total que ya incluye los retenidos**: créditos nuevos
  permitidos = autorizada − retenidos (sin dato del SAES, el tope es la media con adeudos o la máxima si es regular). Implementado en `cargaInfo()`/`retenidos()`
  de `web/horarios.template.html`; las sugerencias no descuentan créditos de las reprobadas.
- Pendiente de confirmar con Gestión Escolar (`docs/consulta-carga.md`): cómo se calcula "TRANSITORIO (49.00 CREDITOS)" y si incluye las reprobadas.

## Dispositivos móviles (fase 1, 2026-10-02)

- Táctil (sin hover): el primer toque enfoca una materia (cadena de requisitos + inspector con «Quiero cursarla»
  y «Cerrar»); el segundo la selecciona. Tocar un grupo de la oferta muestra su vista previa. El hover solo
  aplica con ratón (`pointerover` con `pointerType === 'mouse'`).
- Teléfono vertical (≤ 720 px): aviso descartable que recomienda computadora o girar a horizontal; trayectoria
  en **lista por semestre** (`renderList`) y horario como **agenda por día**; ambas vistas se pueden cambiar
  (`hu.mview`, `hu.cview`). Filtros plegados tras «Filtros»; tarjetas de la oferta en una columna.
- Teléfono horizontal / pantallas bajas: encabezado compacto; filtros plegados; filtros y panel del horario dejan
  de ser *sticky* (≤ 980 px de ancho o ≤ 760 px de alto).
- Encabezado institucional en una fila en teléfono (escudo IPN a 76 px ≈ 2 cm; UPIITA a 44 px).
- Zoom del mapa con pellizco: durante el gesto solo `transform: scale` (instantáneo) y al soltar un único
  `renderMap` a la escala final, centrado en el gesto. Respuesta amplificada (`GAIN` 1.8, máximo 2.5×; mínimo =
  «mapa completo»). `touchcancel` conserva el zoom alcanzado. También trackpad / Ctrl + rueda.
- Pendiente: investigación UI/UX móvil completa y rediseño de flujos (ver respuesta del 2026-10-02).

## Disponibilidad y sugeridas (2026-10-02)

- Una materia está disponible si sus **requisitos directos** están acreditados (o en curso), sin importar el semestre:
  el plan es flexible y la oferta varía. La **seriación recomendada por nivel** (`especialidades.json › reglas_nivel`)
  ya no bloquea; se muestra como nota en el inspector y en la tarjeta «Seriación recomendada por nivel».
- Orden de sugeridas: desfasadas, reprobadas, atrasadas; después todo lo disponible de cualquier semestre, primero lo
  que desbloquea más materias (dependientes transitivas) y luego por semestre propuesto.
- La desfasada se describe como inscripción **obligatoria** («el SAES no permite reinscribirse sin ella»), no prioritaria.
- Electivas (`isElec`: nombre «ELECTIVA…»): se acreditan por horas de actividades (Electivas UPIITA), nunca con un
  grupo. No se eligen, no suman créditos a la selección, no se sugieren ni cuentan como «puedes cursarla»; en la lista
  aparecen como «Por actividades» con enlace a Electivas UPIITA; en el mapa son espacios punteados con esa explicación.

## Banco de materias en el generador (2026-10-02)

- «Elegir todas las que puedes cursar» (tarjeta Sugeridas) llena el banco con lo disponible y ofertado.
- «Materias por horario» (Todas | 3–8, `GT.n` en `hu.gtime`): con un número, `generateBank` recorre subconjuntos de ese
  tamaño en orden de prioridad (obligatoria por desfase siempre incluida; reprobadas, atrasadas, sugeridas), descarta los
  que rebasan la carga permitida (`cargaInfo`, contando retenidos), busca la mejor combinación de grupos por subconjunto
  (≤ 4000 nodos) y muestra hasta 6 opciones con materias distintas. Límite: 400 subconjuntos (se avisa).

## Salones (2026-10-02)

- Fuente: PDF de horarios por aula de la unidad (https://www.upiita.ipn.mx/estudiantes/horariosnuevo, incrustado como
  `/adjuntos/Horarios/<periodo>/HORARIOS ….pdf`; una página por aula, cuadrícula Lun–Vie × bloques de 1:30).
- `tools/salones.py <PDF o URL> --periodo 26/2` → `data/salones_26-2.json` (aula, día, grupo, materia, profesor).
  2026/2 v4: 71 aulas, 2105 clases.
- `build_horarios.py` toma el `salones_*.json` más reciente y lo cruza con el periodo **actual** del SAES por
  grupo + día + materia (`salones.asignar`); solo lo aplica si la cobertura es ≥ 70 % (evita salones de otro periodo).
  2026/2: 95.8 %. Se guarda como índice 10 de cada clase (salón por bloque) y `DATA.salones`.
- En la página: salón en la oferta, el calendario y la agenda; aviso «Salones según el horario por aula de la unidad».
  El periodo próximo muestra «Salones aún sin asignar».
- **Actualizar cada semestre:** (1) recapturar la oferta del SAES; (2) correr `tools/salones.py` con el PDF nuevo;
  (3) reconstruir y publicar.
- Optativas: en el encabezado de cada materia de la oferta se muestran sus líneas de especialización (`lineasDe`).

## Modo «Automático» del generador y colapso por «Sí» (2026-10-02)

- «Materias por horario › Automático» (`GT.n='auto'`): el generador decide cuántas y cuáles materias (3–8), apuntando a la
  carga media en créditos nuevos (con adeudos: media − retenidos, sin rebasar la autorizada). Desfasada y reprobadas son
  fijas. Criterios de horario saludable (`qualityOf`): permanencia ≤ 8 h (ideal ≤ 6.5 h), ≤ 3 clases seguidas, ≥ 1 h para
  comer entre 12:00 y 16:30 si el día cruza el mediodía, penaliza huecos > 1:30, entrar 7:00 y salir ≥ 19:00, y días
  desbalanceados. Si lo saludable no alcanza la meta, se avisa. Base: sueño y clases tempranas (Yeo et al., Nature Human
  Behaviour 2023), caída de atención en sesiones largas y recomendación de 2–3 h de estudio por hora de clase.
- Oferta por materia: si una opción está marcada «Sí», la materia muestra solo esa(s) opción(es) (y la que esté en el
  horario) con «Ver N opciones más» (`S.expand`).
- CELEX UPIITA solo imparte inglés (curricular), por lo que no aplica como electiva; «celex» no se agregó a la búsqueda.

## Generador con filtros, pestañas y tema (2026-10-02)

- El generador usa la misma lista que muestra la oferta (`filtered()`, sin «Solo lo que cabe» ni el hueco): turno, nivel,
  búsqueda, filtros de materia/profesor/grupo, «solo las elegidas», horario en la escuela, excluidos y marcas «No».
  La desfasada obligatoria siempre se considera.
- Pestañas sin números: «Mi trayectoria» (o «Mapa curricular» sin datos del SAES) y «Planeación de horario».
- Tema: sigue siempre al navegador (`prefers-color-scheme`, en vivo). El botón cambia el tema solo durante la visita
  (`sessionStorage`); si coincide con el del sistema o el sistema cambia, vuelve a automático. Se borra el `theme`
  permanente de versiones anteriores.

## Horarios ilimitados, base para generar y restablecer filtros (2026-10-02)

- Versiones de horario dinámicas: se empieza con A; «+ Nuevo» agrega la letra siguiente a la última (… Z, AA, AB…),
  «Duplicar X» copia el horario actual a uno nuevo (antes «Copiar C a la siguiente» daba la vuelta y sobrescribía A),
  «×» elimina con confirmación. Los B/C vacíos heredados se descartan al cargar. El generador ofrece «Usar en X» (actual)
  y «Usar en un horario nuevo».
- «Base para generar»: «Filtros de la oferta» (por defecto) o «Todas las elegidas» (sin filtros de la oferta; respeta
  marcas «No» y profesores excluidos). `GT.src`.
- «Restablecer filtros»: regresa filtros de la oferta, excluidos, horario en la escuela y preferencias del generador a su
  valor inicial; no toca horarios ni marcas.
- Exportación: «Tema de la imagen y el PDF» Claro | Oscuro (`hu.expDark`) en ambos estilos; el PDF oscurece la hoja completa;
  el Excel se mantiene claro. La columna «Salón» del estilo minimalista muestra los salones del periodo actual.
- «Restablecer filtros» también borra las marcas «Sí / Quizá / No» (y sus notas) del periodo consultado.
- «PDF con todos los horarios (n)» (visible con 2 o más horarios con contenido): un solo PDF con una hoja por horario,
  en orden A, B, C…, con el estilo y tema elegidos (`exportPdfAll`); «Dos por hoja» (por defecto: carta horizontal, dos
  columnas lado a lado, como «2 páginas por hoja») o «Uno por hoja» (`hu.expPer`); restaura el horario abierto.

## Lector UPIITA en teléfono (2026-10-02)

- Chrome para Android corta los marcadores largos (~11.7 KB). Solución: `web/dist/lector.js` (publicado en el sitio) y un
  **marcador corto** de 161 caracteres que lo descarga (`saes.loader`). El diálogo muestra el código corto en un recuadro
  con botón «Copiar» (portapapeles → execCommand → selección manual) y la «Versión de la página» (fecha de compilación).
  El botón para arrastrar en computadora conserva la versión completa. El artefacto de claude.ai no usa la versión corta.
- Uso: Firefox (Android e iOS, confirmado) desde marcadores; Safari (iOS) confirmado (Compartir › Agregar marcador, editar la dirección; se ejecuta desde la barra de direcciones,
  sección de marcadores); Chrome (Android) escribiendo «Lector UPIITA» en la barra de
  direcciones (confirmado por el usuario el 2026-10-02 con la versión corta); Chrome (iOS) también funciona (confirmado: marcador editado y ejecutado con el SAES abierto). Con la versión corta, lo que corre en el SAES es el lector.js publicado.

## Integración local UPIBI (2026-10-02, codex/upibi)

Pendiente 1 implementado para revisión local: captura académica, seis mapas por categorías, cinco carreras con Biotecnológica separada por planes 2006 y 2024; `UNIDAD=upibi` genera `web/horarios-upibi.html` y `web/dist/horarios-upibi.html`. Detalles y discrepancias en `docs/UPIBI.md`. Siete pruebas automatizadas y regresión visual de UPIITA/ESCOM. Sin publicación. Quedan la aclaración de diferencias PDF/SAES y la validación académica de categorías y seriación.
