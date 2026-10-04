# Encuesta de satisfacción (fase de pruebas)

La encuesta aparece en Horarios (todas las unidades) para medir si la herramienta sirvió en la planeación de la
reinscripción. Código: `tools/encuesta.py` (página) y `tools/encuesta_appscript.gs` (receptor). Configuración:
`data/encuesta.json`.

## Cuándo aparece

- Después de exportar un horario, de generar horarios con 2 minutos de uso, de 5 minutos de uso activo o en una segunda
  visita con 2 minutos. Nunca encima de otro diálogo y como máximo una vez por visita.
- «Ahora no» la pospone 1 día (las dos primeras veces) y después 3 días. Desde la segunda vez se ofrece «No volver a
  preguntar».
- Al responder ya no vuelve a aparecer. Si el alumno contestó «Todavía no» me inscribo, después del cierre de la
  reinscripción (`cierre`) o `seguimientoDias` días después se le hace solo la pregunta de seguimiento.
- Siempre puede responderse desde el enlace del pie de página mientras haya algo pendiente.
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
