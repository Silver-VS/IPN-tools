# Encuesta de satisfacción (fase de pruebas)

La encuesta aparece en Horarios (todas las unidades) para medir si la herramienta sirvió en la planeación de la
reinscripción. Código: `tools/encuesta.py` (página) y `tools/encuesta_appscript.gs` (receptor). Configuración:
`data/encuesta.json`.

## Cuándo aparece

- Al exportar un horario, cuando el alumno generó horarios y siguió revisándolos 3 minutos de uso activo, o tras media
  hora de uso activo acumulado. Nunca encima de otro diálogo y como máximo una vez por visita.
- «Ahora no» la pospone 1 día (las dos primeras veces) y después 3 días. Desde la segunda vez se ofrece «No volver a
  preguntar».
- Al responder ya no vuelve a aparecer. Si el alumno contestó «Todavía no» me inscribo, después del cierre de la
  reinscripción (`cierre`) o `seguimientoDias` días después se le hace solo la pregunta de seguimiento.
- El botón «Opinar» del encabezado (y el enlace del pie) la abre en cualquier momento: la encuesta si no se ha
  contestado, el seguimiento si está pendiente o, después, un comentario libre (error, sugerencia u otro; `tipo=comentario`,
  columna `tema`), que se puede enviar las veces que se quiera.
- El estado vive en `localStorage['ipnt.encuesta']` (no se sincroniza con la cuenta).

## Qué se envía

Respuestas a las preguntas y contexto anónimo: unidad, carrera, modo demostración, si cargó datos del SAES, número de
materias elegidas, si es teléfono, minutos de uso, sesiones, exportaciones y generaciones, y un identificador aleatorio
del navegador (relaciona la respuesta con su seguimiento). No se envían nombre, boleta, correo ni calificaciones.

## Instalación (una vez)

1. Crea una hoja de cálculo en Google Drive (p. ej. «IPN-tools · Encuesta fase de pruebas»).
2. Extensiones › Apps Script. Borra el contenido de `Código.gs` y pega `tools/encuesta_appscript.gs`. Guarda.
3. Prueba: elige la función `probar` y pulsa Ejecutar. Autoriza (la primera vez Google advierte que la app no está
   verificada: Configuración avanzada › Ir a…; es tu propio script). Debe aparecer la hoja «Respuestas» con un renglón.
   Bórralo después.
4. Implementar › Nueva implementación › tipo «Aplicación web». Ejecutar como: **Yo**. Quién tiene acceso:
   **Cualquier usuario**. Implementar y copia la URL que termina en `/exec`.
5. Abre esa URL en el navegador: debe mostrar `{"ok":true,"servicio":"encuesta IPN-tools"}`.
6. Pega la URL en `data/encuesta.json` → `"endpoint"`, define `"cierre"` (AAAA-MM-DD) si ya se conoce, compila y publica.

Si cambias el script después, usa Implementar › Administrar implementaciones › editar › Nueva versión: así la URL no
cambia. Una implementación nueva crea otra URL y habría que volver a publicar.

## Apagarla

`"activa": false` en `data/encuesta.json`, compilar y publicar. El enlace del pie desaparece.

## Implementación actual (fase de pruebas, octubre de 2026)

- Hoja: «IPN-tools» en el Drive del responsable (pestaña «Respuestas»).
- Proyecto de Apps Script vinculado: «IPN-tools · Encuesta» (`1MPpinMVMi6md5AcCQWLUzctxp_bFYCAfHrYrw_2XnLQ86Q4f8MBgapMY`).
- Implementación web (versión 2: comentarios): `AKfycbyk3lyUjzBE7W6HVyLn_BZqw-euTpjZpR4nVFM97j-2-ejy4_4vGTKDulfmYgrwPlfP`.
- Se gestiona con clasp: `clasp push` y `clasp deploy -i <id de implementación>` conserva la URL.
