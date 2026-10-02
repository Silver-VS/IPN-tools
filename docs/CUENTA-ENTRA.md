# Registro de la aplicación en Microsoft Entra ID

El inicio de sesión necesita un registro de aplicación. El identificador que resulta (Application ID) es
público: va en `data/cuenta.json` y no es una contraseña. No se crea ningún secreto.

## 1. Dónde registrarla

1. **En el directorio del IPN (preferente).** Entra a https://entra.microsoft.com con tu cuenta
   `@alumno.ipn.mx` y ve a **Aplicaciones › Registros de aplicaciones › Nuevo registro**.
   Una aplicación registrada dentro del IPN suele poder usarse sin que TI dé un consentimiento adicional.
2. **Si el IPN no permite registrar aplicaciones** (aparece un aviso de falta de permisos): regístrala con una
   cuenta personal de Microsoft, como multiinquilino. En ese caso es probable que TI del IPN tenga que dar el
   consentimiento de administrador para el permiso `Files.ReadWrite.AppFolder`.

## 2. Datos del registro

| Campo | Valor |
|---|---|
| Nombre | `IPN-tools` (es también el nombre de la carpeta que verá el alumno en su OneDrive) |
| Tipos de cuenta | En el directorio del IPN: **Solo las cuentas de este directorio organizativo**. Con cuenta personal: **Cuentas de cualquier directorio organizativo (multiinquilino)** |
| URI de redirección | Plataforma **Aplicación de página única (SPA)** |

URI de redirección de tipo SPA, todas:

```
https://silver-vs.github.io/upiita/auth.html
https://silver-vs.github.io/upiita/horarios.html
https://silver-vs.github.io/upiita/electivas.html
http://localhost:8080/dist/auth.html
http://localhost:8080/dist/horarios.html
http://localhost:8080/dist/electivas.html
```

`auth.html` recibe el inicio de sesión en ventana emergente (computadora). Las páginas reciben el inicio de
sesión en la misma pestaña, que se usa en el teléfono cuando el navegador bloquea las ventanas emergentes.

## 3. Permisos

En **Permisos de API › Agregar un permiso › Microsoft Graph › Permisos delegados**, agrega
`Files.ReadWrite.AppFolder`. Puedes quitar `User.Read`, porque el nombre y el correo vienen en el propio inicio de sesión.

No agregues certificados ni secretos: es una aplicación pública que corre en el navegador.

## 4. Configurar la herramienta

Copia el **Id. de aplicación (cliente)** de la página de información general a `data/cuenta.json`:

```json
{ "clientId": "00000000-0000-0000-0000-000000000000", "tenant": "f94bf4d9-8097-4794-adf6-a5466ca28563", "unidad": "upiita" }
```

Compila y publica. Quien hospede su propia copia debe agregar sus propias direcciones como URI de redirección
o registrar su propia aplicación.

## Si aparece «Se necesita la aprobación del administrador»

El IPN restringe que los alumnos autoricen aplicaciones por su cuenta. Hay que solicitar a TI el
consentimiento de administrador para la aplicación `IPN-tools` con el permiso `Files.ReadWrite.AppFolder`.
Ese permiso solo da acceso a la carpeta de la aplicación en el OneDrive de cada alumno, no al resto de sus
archivos, ni al correo, ni a otros datos. Mientras se resuelve, el respaldo en archivo funciona igual.
