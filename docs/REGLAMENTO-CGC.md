# Reglamento del Consejo General Consultivo: estado de extracción

El lector conserva `data/reglamentos/cgc.json` como solo PDF. El archivo contiene una extracción plana de 25 371 caracteres, pero no tiene artículos, transitorios ni estructura; `sin_articulado` está activo. `tools/reglamentos.extraer([texto])` devuelve cero artículos al procesar esa extracción. Sus saltos de página no están disponibles.

En esta revisión no existe `.cache/reglamentos/cgc.pdf` ni `data/reglamentos/ocr/cgc.txt`. Por eso no se puede verificar que el texto plano corresponda al PDF identificado por SHA-256 `c3ef8fa36253fae37e487dc37691188fcee1e601a2cf20a5d863ba35fc20c8a6`, cotejar las páginas o recuperar el articulado con el flujo oficial. No se generaron artículos a partir de una fuente que perdió sus páginas y no pasó el extractor.

Para retomar la extracción se necesita el PDF local con ese mismo SHA-256. Si es escaneado, se necesita además `data/reglamentos/ocr/cgc.txt`, con primera línea `sha256: c3ef8fa36253fae37e487dc37691188fcee1e601a2cf20a5d863ba35fc20c8a6` y páginas separadas por `\f`, revisado contra el PDF. Después se puede ejecutar `python tools/reglamentos.py` y revisar las huellas antes de integrar los nuevos artículos.
