# Formato del perfil IPN-tools (`ipnt` 1)

Es el documento con el que las herramientas guardan y recuperan lo que el alumno genera: planes de horario,
marcas, materias elegidas, preferencias y, si el alumno lo autoriza, los datos que leyó del SAES. El mismo
documento sirve para:

- la **sincronización** con la cuenta institucional (OneDrive del alumno, carpeta de la aplicación);
- el **respaldo en archivo** (`*.ipnt.json`) que se descarga y se restaura sin iniciar sesión.

No hay servidor propio: el documento vive en el navegador (localStorage) y, opcionalmente, en el OneDrive
del propio alumno. Implementación: `tools/cuenta.py`.

## Documento

```json
{
  "ipnt": 1,
  "tipo": "perfil",
  "app": "IPN-tools",
  "version": "1.1.0",
  "unidad": "upiita",
  "guardado": "2026-10-02T23:10:00.000Z",
  "claves": {
    "hu.w.proximo": { "t": 1759446600000, "v": { "plan": "A", "plans": { "A": { "sel": [], "own": [] } }, "marks": {} } },
    "hu.t.B":       { "t": 1759446500000, "v": { "want": ["B101", "B102"] } },
    "ue.s":         { "t": 1759440000000, "v": { "...": "estado de Electivas" } }
  },
  "borrados": { "saes.alumno": 1759446000000 }
}
```

| Campo | Significado |
|---|---|
| `ipnt` | Versión del formato. Un lector rechaza versiones mayores a la que conoce. |
| `tipo` | `perfil` (documento completo). Reservado: `plan` para compartir un solo horario. |
| `app`, `version` | Herramienta y versión que escribió el documento (informativo). |
| `unidad` | Unidad académica de los datos (`upiita`, `escom`…). |
| `guardado` | Fecha ISO 8601 de escritura. |
| `claves` | Mapa `clave → {t, v}`: `v` es el valor tal como lo guarda la página; `t`, la marca de tiempo (ms desde 1970) de su último cambio. `t: 0` = valor anterior a la sincronización. |
| `borrados` | Mapa `clave → t` de valores eliminados, para que el borrado también se propague. |

## Claves

El nombre de la clave es la llave de localStorage. El prefijo indica la herramienta.

| Prefijo / clave | Herramienta | Contenido | Se sincroniza |
|---|---|---|---|
| `hu.w.<periodo>` | Horarios | Planes A, B… (grupos elegidos y horarios propios), marcas Sí/Quizá/No | Sí |
| `hu.t.<carrera>` | Horarios | Materias que quieres cursar (mapa) | Sí |
| `hu.car`, `hu.excl`, `hu.hide`, `hu.onlyWant`, `hu.weekend`, `hu.gtime`, `hu.verSug`, `hu.sim` | Horarios | Carrera, profesores excluidos, filtros, criterios del generador, perfil de demostración | Sí |
| `hu.exp*` | Horarios | Preferencias de exportación (estilo, tema, horarios por hoja) | Sí |
| `hu.tab`, `hu.per`, `hu.tur`, `hu.niv`, `hu.view`, `hu.mview`, `hu.cview`, `hu.mobnote` | Horarios | Estado de la pantalla de cada dispositivo | No |
| `ue.s` | Electivas | Actividades registradas, datos del formato | Sí |
| `saes.alumno` | Ambas | Datos leídos del SAES (kárdex, estado general, cita) | Solo si el alumno lo activa |
| `saes.aviso`, `ipnt.*` | — | Avisos vistos y control interno de la sincronización | No |

Una clave nueva con prefijo `hu.` o `ue.` se sincroniza sin cambiar el formato; las de pantalla se agregan
a la lista de exclusión en `tools/cuenta.py`.

## Fusión

Se combina clave por clave: gana el valor con la `t` más reciente (último en escribir). Un borrado gana si
su `t` es mayor que la del valor. Así, dos dispositivos que editan claves distintas no se pisan.

- **Al iniciar sesión o abrir la página con sesión:** se descarga el perfil, se fusiona con el navegador y,
  si hubo cambios, la página se recarga para mostrarlos.
- **Al guardar un valor distinto:** después de 3 s sin más cambios se sube el perfil. La escritura usa la
  etiqueta `eTag` de OneDrive (`If-Match`); si otro dispositivo escribió antes, se vuelve a descargar,
  fusionar y subir.
- **Restaurar un respaldo:** reemplaza los valores del navegador por los del archivo (con la hora actual), y
  después se sincronizan como cualquier cambio.

## Almacenamiento en la cuenta institucional

- Inicio de sesión con Microsoft Entra ID (MSAL.js), solo cuentas del tenant del IPN
  (`f94bf4d9-8097-4794-adf6-a5466ca28563`: `@alumno.ipn.mx`, `@ipn.mx`).
- Permiso único: `Files.ReadWrite.AppFolder`. La aplicación solo ve su propia carpeta
  (`OneDrive › Aplicaciones › IPN-tools`), no el resto de los archivos del alumno.
- Archivo: `perfil.ipnt.json` en esa carpeta (Graph: `/me/drive/special/approot:/perfil.ipnt.json`).
- La sesión (caché de MSAL) se guarda en el navegador (localStorage) para no pedir el inicio de sesión en cada visita; el token va directo a Microsoft Graph y no pasa por ningún servidor nuestro. «Cerrar sesión y borrar mis datos de este navegador» sirve para las computadoras compartidas.
- Registro de la aplicación: `docs/CUENTA-ENTRA.md`.
