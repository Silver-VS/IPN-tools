# Temarios (propuesta de nueva IPN-tool)

Objetivo: consultar el temario (programa de estudio) de cualquier materia desde un buscador propio y desde Horarios
(«Ver temario» en el recuadro de la materia), sin abrir PDFs escaneados.

## 1. Diagnóstico del corpus de Ingeniería Biónica (UPIITA)

Fuentes revisadas: `Downloads/upiita_bionica_syllabi` (74 PDF originales, escaneados, sin texto) y
`Downloads/upiita_bionica_syllabi_project_corpus` (73 incluidos en 7 paquetes por nivel con capa OCR; 1 excluido por
ser requisitos de clase y no temario).

| Hallazgo | Detalle |
|---|---|
| Escaneos | Legibles para una persona (300 dpi aprox.); el problema es la capa de texto, no la imagen |
| OCR actual | Mediana de 376 palabras por temario; solo 17 de 73 dejan reconocibles las cuatro secciones (objetivo, contenidos, evaluación, bibliografía). Errores típicos: «|.» y «Il.» por «I.» y «II.», palabras unidas, acentos rotos |
| Dos formatos del IPN | **Programa sintético** (objetivo general, contenidos, orientación didáctica, evaluación, bibliografía) y **programa de estudio extenso** (intención educativa, propósito, tiempos asignados, unidades temáticas, plan de evaluación, bibliografía) |
| Datos útiles en la portada | Créditos TEPIC y SATCA, horas de teoría y práctica, tipo (obligatoria/optativa), vigencia, materias precedentes y consecuentes |

## 2. Modelo de datos (un JSON por materia)

```json
{"unidad":"upiita","carrera":"B","plan":"09","clave":"B…","nombre":"Instrumentación Biotecnológica","nivel":4,
 "tipo":"Optativa","creditos":{"tepic":6.0,"satca":4.56},"horas":{"teoria":1.5,"practica":3.0},"vigencia":"2013-08",
 "proposito":"…","intencion":"…","precedentes":["…"],"consecuentes":["…"],
 "unidades":[{"n":1,"titulo":"…","temas":["…"]}],"evaluacion":"…","bibliografia":["…"],
 "fuente":{"url":"<PDF oficial>","paginas":[1,2]},"revision":{"estado":"pendiente|verificado","fecha":"…"}}
```

## 3. Proceso de extracción

1. **Fuente:** el PDF oficial (sitio de la unidad o el repositorio que ya tienes); se guarda la URL de origen.
2. **Texto:** volver a pasar OCR a 300 dpi con diccionario en español (OCRmyPDF/Tesseract). Si no aparecen las
   secciones esperadas, transcribir la página con un modelo de visión siguiendo el esquema anterior.
3. **Estructura:** separar secciones por sus títulos institucionales (los dos formatos) y las unidades temáticas por
   numeración romana; corregir errores comunes de OCR («Il.» → «II.»).
4. **Validación cruzada:** comparar nombre, créditos y horas con el mapa curricular del SAES que ya tenemos; marcar
   las diferencias para revisión.
5. **Revisión humana:** cada temario queda «pendiente» hasta que alguien lo verifica contra la imagen original
   (alumnos de prueba o academias). Se muestra la fecha y el enlace al PDF oficial.

## 4. Interfaz

- **IPN-tool «Temarios»** (`temarios.html`): buscador por unidad, carrera, nivel y tema; ficha de la materia con
  propósito, unidades temáticas desplegables, horas y créditos, precedentes y consecuentes como enlaces, bibliografía y
  «Ver PDF oficial».
- **Búsqueda por tema:** «¿En qué materia se ve procesamiento de imágenes?» → materias cuyo temario lo menciona.
- **En Horarios:** botón «Ver temario» en el recuadro de la materia → ventana con propósito y unidades, y enlace a la
  ficha completa.

## 5. Etapas sugeridas

1. Biónica (73 temarios ya reunidos): extracción, validación con el SAES y ventana en Horarios.
2. Resto de carreras de la UPIITA, después ESCOM y UPIBI (localizar sus PDF oficiales).
3. Buscador por tema y página «Temarios».

Notas: los programas de estudio son documentos institucionales públicos; se enlaza siempre la fuente oficial y se
indica que la versión de IPN-tools es una transcripción de apoyo. Confirmar con la unidad si se pueden alojar copias.
