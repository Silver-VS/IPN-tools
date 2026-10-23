# R14-VOZ: revisión editorial

## 1. Alcance y criterio

Se revisaron las 85 propuestas de Gemini: 52 aplicadas y 33 rechazadas. Se hicieron 16 ajustes propios (incluidas alternativas a propuestas rechazadas). Cada clave modificada aparece una sola vez en la tabla de cambios.

Se consultaron R8-COMUN, R4-COMUN, R5-COMUN, VOZ.md y glosario.toml dentro de `_encargo/`. La guía prohíbe personificar el software; la primera persona de una elección del usuario sí es válida. «Explorar» y «dispositivo» no figuran entre las palabras vetadas. Las enumeraciones de funciones, requisitos y criterios del generador se conservan cuando aportan información.

Se buscaron las claves completas y sus sufijos en `web/` y `tools/`, incluidos los consumidores dinámicos (`tx`, `data-t` y marcadores `%%migracion.*%%`). Una clave sin consumidor actual no se conectó ni se eliminó: este encargo modifica solo redacción. Se conservaron claves, HTML, variables y sintaxis ICU. La versión del catálogo pasa a 2026.10.29.

## 2. Aplicadas

| Clave | Antes | Después |
|---|---|---|
| `dictamen.agregar` | Añadir unidad de aprendizaje | Agregar unidad de aprendizaje |
| `dictamen.anexos` | Documentación que efectivamente anexas | Documentación que anexas |
| `dictamen.biblioteca` | No se cargó pdf-lib. Revisa tu conexión y vuelve a abrir la página. | No se pudo cargar el generador de PDF. Revisa tu conexión y vuelve a abrir la página. |
| `dictamen.caracteres` | El texto contiene caracteres que la fuente del formato no admite. Sustituye símbolos especiales o emoji; los acentos en español sí se admiten. | El texto contiene caracteres que la fuente del formato no admite. Sustituye símbolos especiales o emojis; los acentos en español sí se admiten. |
| `dictamen.motivo_e1` | Agotaste las oportunidades para concluir tu plan de estudio y quieres que se revise tu caso. | Agotaste las oportunidades para concluir tu plan de estudios y quieres que se revise tu caso. |
| `dictamen.motivo_e2` | El plazo máximo para concluir tu plan (su duración más 50 %) terminó o está por terminar y necesitas más tiempo. | El plazo máximo para concluir tu plan (su duración más el 50 %) terminó o está por terminar y necesitas más tiempo. |
| `dictamen.motivos` | Exposición de motivos (texto editable) | Exposición de motivos |
| `dictamen.ua_cursada` | Periodo cursada | Periodo cursado |
| `dictamen.ua_recursada` | Periodo recursada | Periodo recursado |
| `dictamen.ultimo` | Último semestre o nivel en que estuvo inscrito (confirmar) | Último semestre o nivel en que estuviste inscrito (confirmar) |
| `sate.calendario.leyenda_mes` | Las barras continúan a lo largo de los días de cada semana; las píldoras redondeadas indican fechas puntuales. El círculo marca hoy. Selecciona +N más para consultar todos los procesos de ese día. Usa las flechas del teclado para recorrer las fechas. | Las barras continúan a lo largo de los días de cada semana; las píldoras redondeadas indican fechas puntuales. El círculo marca hoy. Selecciona «+N más» para consultar todos los procesos de ese día. Usa las flechas del teclado para recorrer las fechas. |
| `sate.encabezado.actualizar` | Actualizar datos SAES | Actualizar datos del SAES |
| `sate.encabezado.cargar` | Traer datos SAES | Traer datos del SAES |
| `sate.entrada.sin_resultados` | No encontramos esa unidad. Prueba con las siglas o parte del nombre. | No se encontró esa unidad. Prueba con las siglas o parte del nombre. |
| `sate.situacion.lo_que_sigue` | Lo que sigue para ti | Lo que sigue |
| `sate.situacion.ver_detalles` | Ver detalles de la situación | Ver detalles |
| `sate.cupos.ayuda` | Instala el marcador «SATE», abre el SAES con sesión y pulsa «Consultar cupos» en la ventana del marcador. | Instala el marcador «SATE», inicia sesión en el SAES y pulsa «Consultar cupos» en la ventana del marcador. |
| `sate.cupos.permiso_panel` | Las notificaciones no están permitidas o no están disponibles. Los cambios seguirán apareciendo aquí; el sonido depende de tu casilla Sonido y de que la pestaña esté visible. | Las notificaciones no están permitidas o no están disponibles. Los cambios seguirán apareciendo aquí; el sonido depende de tu casilla «Sonido» y de que la pestaña esté visible. |
| `sate.cupos.sin_opciones` | No encontramos un horario completo sin grupos llenos con tus preferencias actuales. Puedes revisar la oferta o ajustar las preferencias en SATE completo. | No se encontró un horario completo sin grupos llenos con tus preferencias actuales. Puedes revisar la oferta o ajustar las preferencias en SATE completo. |
| `sate.desempeno.sim_aviso` | Simulación: no modifica tus datos del SAES | Simulación: no modifica tus datos del SAES. |
| `sate.planeacion.requisitos_sin_pendientes` | Tus materias elegidas no tienen requisitos pendientes | Tus materias elegidas no tienen requisitos pendientes. |
| `sate.baja.periodos_ayuda` | Elige uno o dos periodos. Puedes darte de baja temporal hasta dos periodos semestrales completos en toda tu trayectoria; no tienen que ser seguidos, según el artículo 55 del RGE. Si ya utilizaste alguno, consulta tu saldo con Gestión Escolar. | Elige uno o dos periodos. Si ya utilizaste alguno en tu trayectoria, consulta tu saldo con Gestión Escolar. |
| `sate.baja.revision_ayuda` | Revisa la vista previa del formato oficial llenado. Descarga el PDF, imprímelo y fírmalo para entregarlo en Gestión Escolar. Las firmas se completan a mano. | Revisa la vista previa del formato oficial con tus datos. Descarga el PDF, imprímelo y fírmalo para entregarlo en Gestión Escolar. |
| `sate.horarios.carga_mayor` | Mayor a la máxima | Mayor que la máxima |
| `sate.horarios.carga_menor` | Menor a la mínima | Menor que la mínima |
| `sate.horarios.nuevo` | + Nuevo horario | + Agregar horario |
| `sate.horarios.oferta_sin_resultados` | No hay grupos que cumplan los filtros. Cambia el turno o el nivel, retira algún filtro de búsqueda o desactiva «Solo las elegidas en el mapa». | No hay grupos que cumplan los filtros. Cambia el turno o el nivel, retira algún filtro de búsqueda o desactiva «Solo las elegidas en el Mapa curricular». |
| `sate.horarios.previa_cursor` | Al colocar el cursor sobre un grupo se muestra su vista previa. | Pasa el cursor sobre un grupo para ver su vista previa. |
| `sate.horarios.semana_conflicto` | Revisa el horario elegido: no cumple alguna preferencia de Extras o el traslado choca con un bloque fijo. | Revisa el horario elegido: no cumple alguna preferencia de Otras actividades o el traslado choca con un bloque fijo. |
| `sate.horarios.semana_horas_invalidas` | Indica horas entre 0 y 168, o elige días y horario | Indica horas entre 0 y 168, o elige días y horario. |
| `sate.ventanilla.volver` | Volver a la Ventanilla | Volver a Ventanilla digital |
| `cuenta.migracion.aviso_sesion` | Tu navegador recuerda una sesión de Google. Ya no sincronizamos con Google: pasa tus datos a Microsoft para seguir guardándolos en tu nube. | Tu navegador recuerda una sesión de Google. SATE ya no sincroniza con Google; pasa tus datos a Microsoft para seguir guardándolos en tu nube. |
| `cuenta.migracion.borrar_archivo` | No borramos nada de tu Google Drive. Si quieres eliminar el archivo: en drive.google.com abre Configuración, luego Administrar aplicaciones, busca la aplicación y elige «Eliminar datos ocultos de la app». | No se borra nada de tu Google Drive. Para eliminar el archivo, entra a drive.google.com, abre Configuración, luego Administrar aplicaciones, busca la aplicación y elige «Eliminar datos ocultos de la app». |
| `cuenta.migracion.listo` | Listo: tus datos están en tu OneDrive. Ya no usaremos Google. | Tus datos están en tu OneDrive. Ya no se usará Google. |
| `cuenta.migracion.paso1_boton` | Traer mis datos de Google | Importar datos de Google |
| `cuenta.migracion.paso3_boton_sync` | Sincronizar con mi OneDrive | Sincronizar con OneDrive |
| `cuenta.migracion.sin_perfil` | No encontramos un perfil guardado con esa cuenta de Google. | No se encontró un perfil guardado con esa cuenta de Google. |
| `cuenta.migracion.traidos` | Listo: tus datos están guardados en este navegador. Falta el paso 3. | Tus datos están guardados en este navegador. Falta el paso 3. |
| `sate.guia.antes_ninguna` | Ninguna: es una base de la carrera. | Sin requisitos previos. |
| `sate.guia.aviso_ocr` | Este reglamento es un PDF escaneado: su texto es una transcripción automática y puede tener errores. Antes de usarlo en un trámite, compáralo con el PDF oficial. | Transcripción automática de un PDF escaneado; puede tener errores. Antes de usarlo en un trámite, compáralo con el PDF oficial. |
| `sate.guia.buscar_sin_resultados` | No hay una materia con ese nombre. Prueba con otra palabra. | No hay una materia con ese nombre o clave. Prueba con otro término. |
| `sate.guia.despues` | Te desbloquea | Habilita |
| `sate.guia.historia_descripcion` | Conoce el origen y la organización del Instituto | Origen y organización del Instituto |
| `sate.guia.metro_leyenda_correspondencia` | Anillo doble: la unidad pertenece a más de una especialización o aparece en otra línea | Anillo doble: la unidad pertenece a más de una especialización o aparece en otra línea. |
| `sate.guia.no_encontrada` | No encontramos esa pregunta. Puede que haya cambiado; búscala en la lista. | No se encontró esa pregunta. Puede que haya cambiado; búscala en la lista. |
| `sate.guia.reglamentos_descripcion` | Los documentos oficiales, para leerlos completos | Documentos oficiales completos |
| `sate.guia.sin_programas` | Aún no hay programas de estudio de esta unidad | Aún no hay programas de estudio de esta unidad académica. |
| `sate.guia.sin_resultados_preguntas` | No encontramos esa duda. Prueba con otra palabra o revisa los apartados. | No se encontraron preguntas. Prueba con otra palabra o revisa los apartados. |
| `sate.guia.veras` | Qué vas a ver | Contenido del programa |
| `sate.guia.vista_zoom` | Zoom de las vistas | Zoom |
| `temarios.explorador.no_encontrado` | No encontramos ese programa. Puede que la clave haya cambiado; búscalo de nuevo desde Programas de estudio. | No se encontró ese programa. Puede que la clave haya cambiado; búscalo de nuevo desde Programas de estudio. |
| `temarios.selector.abrir` | Elegir de mi trayectoria | Elegir de la trayectoria |
| `dictamen.peticion_detectado_ayuda` (propia) | Armamos este texto con las materias y los periodos de tu kárdex. Puedes editarlo. | Texto generado con las materias y los periodos de tu kárdex. Puedes editarlo. |
| `dictamen.nombre_ayuda` (propia) | El marcador SATE entrega el nombre completo sin separar apellidos. Lo conservamos en Nombre(s): distribúyelo en los tres campos como corresponda. Los periodos ausentes quedan vacíos. | El marcador SATE entrega el nombre completo sin separar apellidos. Aparece en «Nombre(s)»; distribúyelo en los tres campos como corresponda. Los periodos ausentes quedan vacíos. |
| `sate.desempeno.reiniciar_ayuda` (propia) | Regresa todas las materias a su valor inicial (en curso aprobadas con 8 y reprobadas pendientes) y todos los bloques a mostrar la simulación | Restablece las materias en curso como aprobadas con 8 y las reprobadas como pendientes. Todos los bloques vuelven a mostrar la simulación. |
| `sate.planeacion.flechas` (propia) | Trayectoria recomendada: las flechas indican la seriación recomendada. | Las flechas indican la seriación recomendada. |
| `sate.planeacion.niveles` (propia) | En este plan las materias se organizan por niveles (1, 2, 3…), no por semestres: el nivel indica el orden recomendado y en un mismo periodo puedes inscribir materias de distintos niveles si cumples sus requisitos y las reglas de inscripción de tu unidad académica. | Los niveles indican el orden recomendado de las materias, no semestres. En un mismo periodo puedes inscribir materias de distintos niveles si cumples sus requisitos y las reglas de inscripción de tu unidad académica. |
| `sate.planeacion.oferta_vacia` (propia) | Aún no eliges materias en el Mapa curricular. Elígelas allá o consulta toda la oferta. | Aún no eliges materias en el Mapa curricular. |
| `sate.horarios.generador_auto` (propia) | Selección automática entre tus <b>{n}</b> materias: busca cerca de <b>{meta} créditos nuevos</b> (carga media{tope}) con un horario saludable: hasta 8 h en la escuela (idealmente 6.5 h o menos), no más de 3 clases seguidas, al menos 1 h para comer entre 12:00 y 16:30, pocas horas libres y clases repartidas entre los días. | La selección automática entre tus <b>{n}</b> materias busca cerca de <b>{meta} créditos nuevos</b> (carga media{tope}). Prioriza hasta 8 h en la escuela (idealmente 6.5 h o menos), no más de 3 clases seguidas, al menos 1 h para comer entre 12:00 y 16:30, pocas horas libres y clases repartidas entre los días. |
| `sate.horarios.generador_limite_modesto` (propia) | Para mantener ágil tu dispositivo, se recortó la búsqueda. Se muestran las opciones encontradas. Reduce las materias o ajusta los filtros para explorar otras opciones. | Se limitó la búsqueda para reducir el uso de recursos de tu equipo. Se muestran las opciones encontradas. Reduce las materias o ajusta los filtros para buscar otras opciones. |
| `sate.cupos.ventana_copiar_detalle` (propia) | Lleva tus datos a SATE con un pegado. | Copia tus datos para pegarlos en SATE. |
| `sate.cupos.ventana_copiado` (propia) | Datos copiados. En SATE pulsa «Traer datos SAES» y pega. | Datos copiados. En SATE pulsa «Traer datos del SAES» y pégalos. |
| `sate.guia.explorar_intro` (propia) | Mírala por semestre o por línea de aprendizaje. Elige una unidad de aprendizaje para abrir su ficha. | Elige una unidad de aprendizaje para abrir su ficha. |
| `sate.guia.rgl_temas` (propia) | Explora por tema | Por tema |
| `sate.baja.paso_datos_ayuda` (propia) | Revisa los datos que trajimos del SAES y confírmalos. Se usarán para llenar el formato oficial. | Revisa los datos importados del SAES y confírmalos. Se usarán para llenar el formato oficial. |
| `cuenta.migracion.paso1_detalle` (propia) | Iniciarás sesión con Google solo para leer tu perfil guardado. No escribimos nada en tu Drive. | Iniciarás sesión con Google solo para leer tu perfil guardado. No se escriben datos en tu Drive. |
| `sate.guia.rgl_directo` (propia) | Te aplica directo | Te aplica directamente |
| `sate.guia.rgl_directos` (propia) | Te tocan directo | Te aplican directamente |

## 3. Rechazadas

| Clave | Motivo |
|---|---|
| `sate.guia.biblio_catalogo_texto` | Elimina la atribución a la Dirección de Publicaciones y Bibliotecas. Identificar quién ofrece el catálogo aporta información, no es un colon dramático. |
| `dictamen.anexos_imagen` | Es un descriptor tras «nombre de archivo ·», junto a «{n} pág.» (dictamen.js); se conserva en minúscula. |
| `dictamen.anexos_vacio` | «Todavía no agregaste» es válido en México; el tiempo compuesto alarga sin corregir un error. |
| `dictamen.generar` | «Llenado» distingue la descarga con datos del formato oficial vacío; VOZ §5 pide precisar qué se descarga. |
| `dictamen.peticion_detectado_ayuda` | Conviene evitar «Armamos», pero la propuesta alarga la ayuda. Se aplica una alternativa propia más corta. |
| `dictamen.situacion` | Eliminar «selección manual» borra la distinción con los datos detectados. La vista actual usa un rótulo literal y esta clave no tiene consumidor directo. |
| `dictamen.tipo_duda` | «Si dudas» es tuteo natural y más corto; no es una incorrección del español de México. |
| `sate.calendario.fuente_saes` | Identifica la fuente de una cita personal en nucleo.js; «alumnado» cambia una cuenta individual por un colectivo. |
| `sate.creditos.rotulo` | Se concatena después de la cifra en nucleo.js: «7.5 créditos». No inicia un enunciado. |
| `sate.electivas.acreditacion_breve` | Completa «Electiva: se acredita…» en el title del mapa. La mayúscula rompe la continuidad. |
| `sate.cupos.horario_vacio_vista` | «Explorar» nombra la consulta de alternativas y no figura entre las palabras vetadas; cambiarlo por «ver» no corrige un problema. |
| `sate.cupos.paso_datos` | tools/saes.py también lo concatena tras «Entra al SAES, »; debe conservar la minúscula. |
| `sate.cupos.ventana_copiar_detalle` | «Lleva… y pégalos» no explica mejor el botón Copiar; se usa una alternativa propia que indica el destino. |
| `sate.desempeno.recursar` | Es un estado junto a la calificación dentro de la fila simulada, no un botón ni un inicio de oración. |
| `sate.desempeno.reiniciar_ayuda` | Omite la calificación inicial de 8 y el estado pendiente de las reprobadas; se redacta una alternativa propia que los conserva. |
| `sate.desempeno.sin_datos` | Las metas son una función distinta, no relleno de una tríada. Suprimirlas pierde información. |
| `sate.planeacion.flechas` | Se acepta quitar la repetición, pero una alternativa propia conserva «seriación recomendada» sin el prefacio. |
| `sate.planeacion.niveles` | Omite que el nivel indica un orden recomendado y que se pueden mezclar niveles en un mismo periodo; se conserva en una alternativa propia. |
| `sate.planeacion.oferta_vacia` | «Allá» es válido; los dos botones ya ofrecen las acciones. Se elimina la segunda oración mediante una alternativa propia. |
| `sate.planeacion.primera_visita` | «Ármalo» queda sin antecedente masculino singular: la propuesta elimina «horario». |
| `sate.trayectoria.explorar` | «Explorar» describe navegar por el mapa sin datos personales y no está vetado por el glosario. |
| `sate.trayectoria.sin_datos` | El cambio de «explorar» por «consultar» no corrige un error ni acorta; no es una palabra vetada. |
| `sate.trayectoria.y_si_resumen` | Es un subtítulo breve dentro de summary, coherente sin punto con los demás rótulos. |
| `sate.horarios.generador_auto` | Suprime criterios concretos que explican los resultados del generador. Se retira «saludable» con una alternativa propia sin perder límites. |
| `sate.horarios.generador_limite_modesto` | Omite que se muestran resultados parciales. Se adopta «equipo» y se quita el adjetivo vacío con una alternativa propia. |
| `sate.ventanilla.revisar` | Es el nombre de un paso, no un botón; «Revisa y descarga» mantiene el tuteo de «Revisa y descarga el PDF» en bajas. |
| `cuenta.migracion.paso1_detalle` | «No se modifica nada» amplía la garantía: el código sí revoca el permiso de lectura. Se precisa que no se escriben datos en Drive. |
| `sate.guia.explorar_intro` | Reduce «unidad de aprendizaje» a «unidad», ambiguo con unidad académica, y repite los controles visibles. Se propone una ayuda más corta. |
| `sate.guia.explorar_modo` | «Explorar» no está vetado y cambiar a «Modo de vista» confunde este selector de organización con el selector contiguo de vista. |
| `sate.guia.explorar_nota` | «Sale del plan» es comprensible y más corto que «proviene del plan»; no hay corrección necesaria. |
| `sate.guia.rgl_temas` | Es un encabezado de temas en guia.js, no un botón de búsqueda; se sustituye por «Por tema» como alternativa propia. |
| `dictamen.nombre_ayuda` | La dirección es correcta, pero se ajusta además «Nombre(s)» con comillas angulares y se evita el colon entre instrucciones. |
| `sate.guia.rgl_directos` | La dirección es correcta, pero se ajusta además «directo» a «directamente», coherente con la forma singular. |

## 4. Contexto de cada propuesta

| Clave | Uso encontrado en web/ y tools/ |
|---|---|
| `dictamen.agregar` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `dictamen.anexos` | `web/sate/dictamen.js:117`, `web/sate/dictamen.js:238`, `web/sate/dictamen.js:258` |
| `dictamen.anexos_imagen` | `web/sate/dictamen.js:213` |
| `dictamen.anexos_vacio` | `web/sate/dictamen.js:208` |
| `dictamen.biblioteca` | `web/tramites/pdf-dictamen.js:10`, `web/sate/dictamen.js:78`, `web/sate/dictamen.js:222` |
| `dictamen.caracteres` | `web/tramites/pdf-dictamen.js:18` |
| `dictamen.generar` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `dictamen.motivo_e1` | `web/sate/dictamen.js:130 (tx dinámico motivo_ + id)` |
| `dictamen.motivo_e2` | `web/sate/dictamen.js:130 (tx dinámico motivo_ + id)` |
| `dictamen.motivos` | `tools/build_sate.py:1128`, `web/sate/dictamen.js:175` |
| `dictamen.nombre_ayuda` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `dictamen.peticion_detectado_ayuda` | `web/sate/dictamen.js:168` |
| `dictamen.situacion` | `web/sate/dictamen.js:113`, `web/sate/dictamen.js:238` |
| `dictamen.tipo_duda` | `web/sate/dictamen.js:122` |
| `dictamen.ua_cursada` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `dictamen.ua_recursada` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `dictamen.ultimo` | `web/sate/dictamen.js:111` |
| `sate.calendario.fuente_saes` | `web/sate/nucleo.js:267` |
| `sate.calendario.leyenda_mes` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `sate.creditos.rotulo` | `web/sate/nucleo.js:28` |
| `sate.electivas.acreditacion_breve` | `web/sate/mapa.js:157` |
| `sate.encabezado.actualizar` | `web/sate/desempeno.js:298`, `web/sate/generico.js:114` |
| `sate.encabezado.cargar` | `web/sate/desempeno.js:298`, `web/sate/generico.js:114` |
| `sate.entrada.sin_resultados` | `web/sate/inicio.js:235` |
| `sate.situacion.lo_que_sigue` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `sate.situacion.ver_detalles` | `web/sate/situacion.js:69` |
| `sate.cupos.ayuda` | `web/sate/cupos.js:24` |
| `sate.cupos.horario_vacio_vista` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `sate.cupos.paso_datos` | `tools/saes.py:219`, `tools/saes.py:248` |
| `sate.cupos.permiso_panel` | `web/sate/cupos-receptor.js:83`, `web/sate/cupos-receptor.js:86`, `tools/cupos_saes.js:255` |
| `sate.cupos.sin_opciones` | `web/sate/cupos-vista.js:110` |
| `sate.cupos.ventana_copiar_detalle` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `sate.desempeno.recursar` | `web/sate/desempeno.js:162` |
| `sate.desempeno.reiniciar_ayuda` | `web/sate/desempeno.js:157` |
| `sate.desempeno.sim_aviso` | `web/sate/desempeno.js:157` |
| `sate.desempeno.sin_datos` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `sate.planeacion.flechas` | `web/sate/mapa.js:169` |
| `sate.planeacion.niveles` | `web/sate/mapa.js:121`, `web/sate/mapa.js:172`, `web/sate/nucleo.js:575` |
| `sate.planeacion.oferta_vacia` | `web/sate/horarios.js:638` |
| `sate.planeacion.primera_visita` | `web/sate/mapa.js:204` |
| `sate.planeacion.requisitos_sin_pendientes` | `web/sate/nucleo.js:705` |
| `sate.trayectoria.explorar` | `web/sate/desempeno.js:292` |
| `sate.trayectoria.sin_datos` | `web/sate/desempeno.js:300` |
| `sate.trayectoria.y_si_resumen` | `web/sate/desempeno.js:191` |
| `sate.baja.periodos_ayuda` | `web/sate/bajas.js:96` |
| `sate.baja.revision_ayuda` | `web/sate/bajas.js:114`, `web/sate/tramites.js:166` |
| `sate.horarios.carga_mayor` | `web/sate/horarios.js:721` |
| `sate.horarios.carga_menor` | `web/sate/horarios.js:721` |
| `sate.horarios.generador_auto` | `web/sate/horarios.js:607` |
| `sate.horarios.generador_limite_modesto` | `web/sate/horarios.js:462` |
| `sate.horarios.nuevo` | `web/sate/horarios.js:689` |
| `sate.horarios.oferta_sin_resultados` | `web/sate/horarios.js:664` |
| `sate.horarios.previa_cursor` | `web/sate/horarios.js:717` |
| `sate.horarios.semana_conflicto` | `web/sate/horarios.js:390` |
| `sate.horarios.semana_horas_invalidas` | `web/sate/horarios.js:89`, `web/sate/horarios.js:304` |
| `sate.ventanilla.revisar` | `web/sate/tramites.js:149`, `web/sate/tramites.js:322` |
| `sate.ventanilla.volver` | `web/sate/tramites.js:145` |
| `cuenta.migracion.aviso_sesion` | `tools/cuenta.py:610` |
| `cuenta.migracion.borrar_archivo` | `tools/cuenta.py:621` |
| `cuenta.migracion.listo` | `tools/cuenta.py:619` |
| `cuenta.migracion.paso1_boton` | `tools/cuenta.py:613` |
| `cuenta.migracion.paso1_detalle` | `tools/cuenta.py:612` |
| `cuenta.migracion.paso3_boton_sync` | `tools/cuenta.py:456` |
| `cuenta.migracion.sin_perfil` | `tools/cuenta.py:383` |
| `cuenta.migracion.traidos` | `tools/cuenta.py:388` |
| `sate.guia.antes_ninguna` | `web/sate/temarios.js:242` |
| `sate.guia.aviso_ocr` | `web/sate/guia.js:220`, `web/sate/guia.js:394` |
| `sate.guia.biblio_catalogo_texto` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `sate.guia.buscar_sin_resultados` | `web/sate/temarios.js:477` |
| `sate.guia.despues` | `web/sate/temarios.js:242` |
| `sate.guia.explorar_intro` | `web/sate/temarios.js:724` |
| `sate.guia.explorar_modo` | `web/sate/temarios.js:637` |
| `sate.guia.explorar_nota` | `web/sate/temarios.js:726` |
| `sate.guia.historia_descripcion` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `sate.guia.metro_leyenda_correspondencia` | `web/sate/temarios.js:595` |
| `sate.guia.no_encontrada` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `sate.guia.reglamentos_descripcion` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `sate.guia.rgl_directos` | Sin referencia literal actual; se revisó también la carga del catálogo en tools/build_sate.py y los prefijos dinámicos del módulo. |
| `sate.guia.rgl_temas` | `web/sate/guia.js:737` |
| `sate.guia.sin_programas` | `web/sate/temarios.js:747` |
| `sate.guia.sin_resultados_preguntas` | `web/sate/guia.js:267`, `web/sate/guia.js:369`, `web/sate/guia.js:875` |
| `sate.guia.veras` | `web/sate/temarios.js:248`, `web/sate/temarios.js:256` |
| `sate.guia.vista_zoom` | `web/sate/temarios.js:639` |
| `temarios.explorador.no_encontrado` | `web/sate/temarios.js:767` |
| `temarios.selector.abrir` | `web/sate/temarios.js:480` |

## 5. Validación y pendientes

| Comprobación | Resultado |
|---|---|
| `python tools/contenido.py` | 1722 textos válidos. |
| Compilación de UPIITA, ESCOM y UPIBI | Sin errores con `UPIITA_SITE=https://guinda-labs.github.io/prueba/`; compilación final solo UPIITA. |
| Todos los `tests/qa_sate*.mjs` con `D:/Tools/nodejs/node.exe` | 46/47 aprobados; única falla: `qa_sate_diseno.mjs`. |
| QA de scripts generados, glosario y seguridad | Aprobados; bloques clásicos y módulos generados parseados. |
| `python -m pytest -q -p no:cacheprovider tests --ignore=tests/test_fuzz_perfiles.py --basetemp=_encargo/pytest-r14-local` | 172 passed, 1 skipped, 764 subtests passed (26.11 s); incluye las pruebas de contenido. |
| Claves, variables y sintaxis ICU | Mismas claves que HEAD; marcadores de cada texto modificado comparados antes/después. No se modificaron mensajes ICU. |
| `git diff --check` | Sin errores. |

Se actualizaron únicamente los literales esperados de siete QA existentes: cargas, encabezado, Google, marcador, primera visita, temarios y ventanilla. En encabezado se mantiene la comprobación del límite y carácter no consecutivo de las bajas en `lead_temporal` y `aviso_temporal_1`; la ayuda del selector conserva la elección de uno o dos periodos y la consulta del saldo. No se modificaron componentes ni lógica del encabezado.

La revisión adicional de todo el catálogo no encontró «no solo… sino…», guiones largos ni los adjetivos «sencillo», «rápido», «fácil» o «potente». Se quitaron «saludable» y «ágil», el prefacio repetido de las flechas, la ayuda que repetía los botones de oferta y la explicación de los modos que ya muestra el selector. Se conservaron enumeraciones de funciones y condiciones que permiten entender cálculos y resultados; los dos puntos que introducen datos, fuentes o leyendas tampoco se trataron como relleno.

### 5.1. Fallo ajeno al cambio

`qa_sate_diseno.mjs` falla en la línea 338: para `.box .plan-marca`, `font-size:.72em` necesita el comentario exacto `/* escala del mapa */` dentro de la declaración en `web/sate/cascaron.html`. Se verificó con `git diff --quiet HEAD -- web/sate/cascaron.html tests/qa_sate_diseno.mjs` que ambas fuentes coinciden con HEAD. Se deja sin corregir por pertenecer al diseño, fuera del encargo de voz.

La primera ejecución de pytest no pudo crear su temporal predeterminado por permisos del entorno. La ejecución final usó `--basetemp` dentro de este proyecto y pasó. Registros locales en `_encargo/R14-validacion.log`, `_encargo/R14-resultados.json`, `_encargo/R14-pytest.log` y `_encargo/R14-compilacion-final.log`; las repeticiones de QA afectados están en `_encargo/R14-encabezado.log`, `_encargo/R14-google.log` y `_encargo/R14-temarios.log`.

### 5.2. Limitaciones

No se abrió navegador; los contratos responsivos, de temas y de perfiles ficticios se comprobaron mediante los QA existentes con DOM en memoria, sin revisión visual. No se ejecutaron `qa_componentes.mjs`, `qa_dictamen.mjs` ni fuzz. Las referencias a la skill de diseño y al feedback fuera de esta carpeta no se abrieron, conforme a la restricción de acceso; se aplicaron las reglas y la guía de voz disponibles en `_encargo/`. No se hizo commit ni push.
