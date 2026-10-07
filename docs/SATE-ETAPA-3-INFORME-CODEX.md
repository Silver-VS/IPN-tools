1. **Entrega:** nuevos `build_sate.py`, `compilar_sate.py`, cascarón y cinco scripts en `web/sate/`; nuevas pruebas Node/Python. Actualizados la envoltura, configuración, TOML y pruebas existentes. Documentación: [SATE-ETAPA-3.md](/D:/Documents/Development/UPIITA_DEV/ipn-tools-wt/sate-3/docs/SATE-ETAPA-3.md).
2. **Validación:** compilaron las tres unidades, Electivas y Dictamen; pasaron 35 pruebas Python, 72 comprobaciones de rutas, parseo de 31 scripts y 99 perfiles ficticios en Node.

3. **Peso inicial sin comprimir**, incluyendo dependencias:

| Unidad | Cascarón + núcleo | Vista inicial completa |
|---|---:|---:|
| UPIITA | 457,037 B | 633,781 B |
| ESCOM | 439,237 B | 559,470 B |
| UPIBI | 496,654 B | 609,195 B |

**No cumple ≤160 KB.** Falta reducir el núcleo, cargar diálogos bajo demanda y separar un índice mínimo de oferta.
4. **Conservado:** lógica académica, datos, almacenamiento, tema y Electivas. **Cambió:** entrada única, módulos, JSON separados, rutas, pestañas configurables y redirecciones.
5. **Riesgos:** oferta necesaria antes de mostrar el mapa; Situación/Desempeño reutilizan la trayectoria; Ventanilla tiene accesos provisionales. Sin verificación visual.
6. **Orquestador:** revisar `#/upiita/{mapa,horarios,situacion,desempeno,tramites/reinscripcion}` y Mapa/Horarios en ESCOM/UPIBI; DEMO/sin datos, 375/1280 px, temas, teclado, foco, atrás/adelante, generador y exportación. Probar enlaces antiguos con search, `#demo` y retorno OAuth.
7. **Duda pendiente:** ¿está registrada `sate/index.html` como URI de retorno institucional? No hice commits, push, publicación ni abrí navegadores.