# Regla para la plantilla común del orquestador

## Texto oficial

Regla del dueño (2026-10-23): «todo lo que sea exacto por documento no se cambia». Conserva literalmente reglamentos, temarios oficiales, funciones y nombres de áreas/departamentos de los manuales; redacta solo nuestros bloques. Una explicación con cita sigue siendo texto propio.

El inventario `data/texto_oficial.json` declara archivos, campos y procedencia; consulta `docs/TEXTO-OFICIAL.md`. Los textos oficiales viven en datos, nunca en `contenido/textos/es.toml`. Al renderizarlos, marca su contenido con `data-oficial="<documento>"`, sin efecto visual; no marques orientación ni controles propios. No cambies mayúsculas, puntuación o palabras de una transcripción por estilo.

El candado es `tests/texto_oficial.sha256.json`; verifica con `python tools/huellas_oficiales.py` y pytest. Solo tras revisar una nueva fuente se actualiza A PROPÓSITO mediante `python tools/huellas_oficiales.py --actualizar --motivo "documento nuevo, edición y páginas"`. El motivo queda registrado; nunca regeneres huellas para ocultar una reescritura. Al agregar texto documental, registra su campo y documento/página/artículo antes de compilar.
