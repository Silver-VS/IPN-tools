/**
 * IPN-tools · Receptor de la encuesta de satisfacción (fase de pruebas).
 *
 * Recibe las respuestas que envía la página de Horarios (tools/encuesta.py) y las agrega como renglones en la hoja
 * «Respuestas» de la hoja de cálculo a la que está vinculado este script. Guía de instalación: docs/ENCUESTA.md.
 *
 * Implementar como aplicación web:  Ejecutar como «Yo» · Quién tiene acceso «Cualquier usuario».
 * La URL que termina en /exec va en data/encuesta.json → "endpoint".
 *
 * Las respuestas son anónimas: no se reciben nombres, boletas, correos ni calificaciones. El «id» es un número aleatorio
 * generado en el navegador para relacionar la respuesta inicial con su seguimiento.
 */

const HOJA = 'Respuestas';
const COLUMNAS = [
  'fecha', 'tipo', 'motivo', 'id',
  'unidad', 'carrera', 'demo', 'con_datos_saes', 'materias_elegidas', 'movil', 'minutos_uso', 'sesiones', 'exportaciones', 'generaciones',
  'satisfaccion', 'util_horario', 'funciones', 'tiempo', 'inscrito', 'recomendacion', 'util_cita',
  'errores', 'mejoras', 'comentario', 'fase', 'tema', 'materias_horario'
];
// valores permitidos de cada pregunta cerrada (lo demás se descarta)
const PERMITIDOS = {
  tipo: ['completa', 'seguimiento', 'comentario'],
  tema: ['error', 'sugerencia', 'otro'],
  motivo: ['', 'exp', 'gen', 'tiempo', 'visita', 'manual'],
  satisfaccion: ['1', '2', '3', '4', '5'],
  util_horario: ['1', '2', '3', '4', '5', 'na'],
  util_cita: ['1', '2', '3', '4', '5'],
  tiempo: ['mucho_menor', 'menor', 'igual', 'mayor', 'primera'],
  inscrito: ['igual', 'parecido', 'distinto', 'aun', 'no'],
  recomendacion: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};
const FUNCIONES = ['mapa', 'manual', 'generador', 'exportar', 'estado', 'metas', 'estadisticas', 'equivalencias'];
const MAX_TEXTO = 1000;

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.web) return json_({ ok: true });                       // trampa para robots: se ignora sin avisar
    const tipo = elegir_(d.tipo, 'tipo');
    const id = String(d.id || '').replace(/[^\w-]/g, '').slice(0, 64);
    if (!tipo || !id) return json_({ ok: false, error: 'Respuesta inválida' });

    // límite por navegador: evita envíos repetidos (6 por hora)
    const cache = CacheService.getScriptCache(), clave = 'n_' + id, n = Number(cache.get(clave) || 0);
    if (n >= 6) return json_({ ok: false, error: 'Demasiados envíos' });
    cache.put(clave, String(n + 1), 3600);

    const r = d.respuestas || {}, c = d.contexto || {};
    if (tipo === 'completa' && !(elegir_(r.satisfaccion, 'satisfaccion') && elegir_(r.inscrito, 'inscrito')))
      return json_({ ok: false, error: 'Respuesta inválida' });
    if (tipo === 'seguimiento' && !elegir_(r.inscrito, 'inscrito'))
      return json_({ ok: false, error: 'Respuesta inválida' });
    if (tipo === 'comentario' && !(elegir_(r.tema, 'tema') && texto_(r.comentario)))
      return json_({ ok: false, error: 'Respuesta inválida' });

    const fila = {
      fecha: new Date(), tipo, motivo: elegir_(d.motivo, 'motivo') || '', id,
      unidad: corto_(c.unidad, 12), carrera: corto_(c.carrera, 12), demo: si_(c.demo), con_datos_saes: si_(c.conDatos),
      materias_elegidas: numero_(c.elegidas), movil: si_(c.movil), minutos_uso: numero_(c.minutos),
      sesiones: numero_(c.sesiones), exportaciones: numero_(c.exportaciones), generaciones: numero_(c.generaciones),
      satisfaccion: numero_(elegir_(r.satisfaccion, 'satisfaccion')),
      util_horario: valor_(elegir_(r.util_horario, 'util_horario')),
      funciones: String(r.funciones || '').split(',').filter(f => FUNCIONES.indexOf(f) >= 0).join(', '),
      tiempo: elegir_(r.tiempo, 'tiempo') || '', inscrito: elegir_(r.inscrito, 'inscrito') || '',
      recomendacion: numero_(elegir_(r.recomendacion, 'recomendacion')),
      util_cita: numero_(elegir_(r.util_cita, 'util_cita')),
      errores: texto_(r.errores), mejoras: texto_(r.mejoras), comentario: texto_(r.comentario),
      fase: corto_(c.fase, 40), tema: elegir_(r.tema, 'tema') || '', materias_horario: numero_(c.enHorario),
    };

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      hoja_().appendRow(COLUMNAS.map(k => fila[k] === undefined ? '' : fila[k]));
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Error al registrar' });
  }
}

// Comprobación rápida desde el navegador: abrir la URL /exec debe mostrar {"ok":true,"servicio":"encuesta IPN-tools"}
function doGet() {
  return json_({ ok: true, servicio: 'encuesta IPN-tools' });
}

/* ---------- utilidades ---------- */
function hoja_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let h = libro.getSheetByName(HOJA);
  if (!h) h = libro.insertSheet(HOJA);
  // encabezados: se escriben si la hoja está vacía o si se agregaron columnas nuevas al final
  if (h.getLastRow() === 0 || h.getLastColumn() < COLUMNAS.length) {
    h.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold');
    h.setFrozenRows(1);
  }
  return h;
}
function elegir_(v, campo) {
  v = v === undefined || v === null ? '' : String(v);
  return PERMITIDOS[campo].indexOf(v) >= 0 ? v : null;
}
function numero_(v) { const n = Number(v); return v === null || v === '' || v === undefined || !isFinite(n) ? '' : n; }
function valor_(v) { return v === null ? '' : (isFinite(Number(v)) ? Number(v) : v); }
function si_(v) { return v === true || v === 'true' ? 'sí' : 'no'; }
function corto_(v, n) { return String(v || '').replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ .-]/g, '').slice(0, n); }
// texto libre: sin fórmulas (una celda que empieza con = + - @ se ejecutaría en la hoja) y con longitud máxima
function texto_(v) {
  let t = String(v || '').replace(/[\u0000-\u0008\u000B-\u001F]/g, '').trim().slice(0, MAX_TEXTO);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Prueba manual desde el editor (Ejecutar › probar): agrega un renglón ficticio y muestra el resultado. */
function probar() {
  const r = doPost({ postData: { contents: JSON.stringify({
    tipo: 'completa', motivo: 'manual', id: 'prueba-' + Date.now(),
    respuestas: { satisfaccion: '5', util_horario: '4', funciones: 'mapa,generador', tiempo: 'menor', inscrito: 'aun', recomendacion: '9', mejoras: 'Renglón de prueba' },
    contexto: { unidad: 'upiita', carrera: 'B', demo: true, conDatos: false, elegidas: 6, movil: false, minutos: 3, sesiones: 1, exportaciones: 1, generaciones: 1, fase: 'prueba' },
  }) } });
  console.log(r.getContent());
}
