/* Lector UPIITA (marcador / bookmarklet).
   Se ejecuta dentro del SAES de la UPIITA con la sesión del alumno ya iniciada.
   Solo LEE dos páginas (GET): Kárdex y Cita de reinscripción. No envía datos a ningún servidor:
   arma un resumen, lo muestra en pantalla y lo copia al portapapeles cuando el alumno lo pide,
   para pegarlo en Horarios UPIITA o Electivas UPIITA.
   tools/saes.py lo convierte en un enlace javascript: y sustituye __TOOL_URL__. */
(async function () {
  var TOOL = '__TOOL_URL__';
  if (!/saes\.upiita\.ipn\.mx$/i.test(location.hostname)) {
    alert('Abre este marcador dentro del SAES de la UPIITA (saes.upiita.ipn.mx), con tu sesión iniciada.');
    return;
  }
  var old = document.getElementById('upiita-lector');
  if (old) old.remove();
  var clean = function (s) { return String(s || '').replace(/\s+/g, ' ').trim(); };
  var num = function (s) { var m = clean(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? +m[0] : null; };
  var getRaw = async function (path) {
    var r = await fetch(path, { credentials: 'same-origin' });
    return new DOMParser().parseFromString(await r.text(), 'text/html');
  };
  var get = async function (path) {
    var d = await getRaw(path);
    if (!d.getElementById('ctl00_mainCopy_Lbl_Nombre') && !d.querySelector('[id*="Lbl_Kardex"]')) throw new Error('sesion');
    return d;
  };
  /* tablas de la cita: renglón de encabezados seguido de renglón de valores */
  var pairs = function (d) {
    var out = {};
    d.querySelectorAll('table').forEach(function (t) {
      var rows = Array.prototype.slice.call(t.rows);
      for (var i = 0; i < rows.length - 1; i++) {
        var h = Array.prototype.map.call(rows[i].cells, function (c) { return clean(c.textContent); });
        var v = Array.prototype.map.call(rows[i + 1].cells, function (c) { return clean(c.textContent); });
        if (h.length > 1 && h.length === v.length && h.every(function (x) { return /[a-z]/i.test(x) && !/^\d/.test(x); })) {
          h.forEach(function (k, j) { if (!(k in out)) out[k] = v[j]; });
        }
      }
    });
    return out;
  };
  var pick = function (o, re) { for (var k in o) if (re.test(k)) return o[k]; return null; };
  /* renglones "ETIQUETA: | valor" (boleta, nombre) */
  var label = function (d, re) {
    var cells = d.querySelectorAll('td');
    for (var i = 0; i < cells.length - 1; i++) if (re.test(clean(cells[i].textContent))) return clean(cells[i + 1].textContent) || null;
    return null;
  };

  var box = document.createElement('div');
  box.id = 'upiita-lector';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Lector UPIITA');
  box.style.cssText = 'position:fixed;z-index:2147483647;right:16px;top:16px;width:min(420px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#18181b;border:1px solid #d9d9de;border-radius:12px;box-shadow:0 18px 50px -12px rgba(0,0,0,.35);font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;padding:16px';
  box.innerHTML = '<b style="font-size:16px">Lector UPIITA</b><p style="margin:6px 0 0;color:#52525b">Leyendo tu Kárdex y tu Cita de reinscripción (solo lectura)…</p>';
  document.body.appendChild(box);

  try {
    var cita = await get('/Alumnos/Reinscripciones/fichas_reinscripcion.aspx');
    var kx = await get('/Alumnos/boleta/kardex.aspx');
    var gen = clean((cita.getElementById('ctl00_mainCopy_Lbl_General') || {}).textContent);
    var p = pairs(cita);
    var acred = [];
    kx.querySelectorAll('[id*="Lbl_Kardex"] table tr').forEach(function (tr) {
      var c = Array.prototype.map.call(tr.cells, function (x) { return clean(x.textContent); });
      if (c.length >= 6 && /^[A-Z]\d{3}$/i.test(c[0])) {
        var cal = num(c[5]);
        if (cal !== null && cal >= 6) acred.push([c[0].toUpperCase(), cal, c[3], c[4]]);
      }
    });
    /* materias reprobadas listadas en la cita (Descripción | créditos) */
    var repro = [];
    cita.querySelectorAll('table').forEach(function (t) {
      var rows = Array.prototype.slice.call(t.rows), on = false;
      rows.forEach(function (r) {
        var c = Array.prototype.map.call(r.cells, function (x) { return clean(x.textContent); });
        if (/^descripci/i.test(c[0] || '')) { on = true; return; }
        if (on && c.length >= 2 && !/total/i.test(c[0]) && num(c[1]) !== null) repro.push([c[0], num(c[1])]);
      });
    });
    /* opcionales: Estado General (reprobadas con periodo y veces cursada) e Inscripción actual (materias en curso) */
    var estado = [], curso = [], horario = [];
    try {
      var est = await getRaw('/Alumnos/boleta/Estado_Alumno.aspx');
      var gv = est.getElementById('ctl00_mainCopy_GV_Reprobadas');
      if (gv) Array.prototype.slice.call(gv.rows, 1).forEach(function (r) {
        var c = Array.prototype.map.call(r.cells, function (x) { return clean(x.textContent); });
        if (/^[A-Z]\d{3}$/i.test(c[1] || '')) estado.push([c[1].toUpperCase(), c[3], num(c[4])]);
      });
    } catch (e) { estado = null; }
    try {
      var hor = await getRaw('/Alumnos/Informacion_semestral/Horario_Alumno.aspx');
      hor.querySelectorAll('[id*="GV_Horario"] [id$="Lbl_Materia"]').forEach(function (s) {
        var m = clean(s.textContent).match(/^([A-Z]\d{3})\b/i);
        if (m) curso.push(m[1].toUpperCase());
      });
      /* horario inscrito completo: [grupo, clave, materia, profesores, [[día, inicio, fin], ...]] (minutos desde 0:00) */
      var gvh = hor.getElementById('ctl00_mainCopy_GV_Horario');
      if (gvh && gvh.rows.length > 1) {
        var DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        var hdr = Array.prototype.map.call(gvh.rows[0].cells, function (c) { return clean(c.textContent).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); });
        var mins = function (t) { var x = t.split(':'); return +x[0] * 60 + +x[1]; };
        Array.prototype.slice.call(gvh.rows, 1).forEach(function (r) {
          var c = Array.prototype.map.call(r.cells, function (x) { return clean(x.textContent); });
          var m = (c[1] || '').match(/^([A-Z]\d{3})\s*-\s*(.*)$/i);
          if (!m) return;
          var ses = [];
          hdr.forEach(function (h, i) {
            var d = DIAS.indexOf(h), t = (c[i] || '').match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
            if (d >= 0 && t) ses.push([d, mins(t[1]), mins(t[2])]);
          });
          horario.push([c[0], m[1].toUpperCase(), m[2], c[2] || '', ses]);
        });
      }
    } catch (e) { curso = null; horario = null; }
    var claveCar = acred.length ? acred[0][0][0] : null;
    var data = {
      upiita_saes: 1,
      leido: new Date().toISOString(),
      boleta: (gen.match(/BOLETA:\s*(\d{10})/i) || [])[1] || ((label(cita, /^BOLETA:?$/i) || '').match(/\d{10}/) || [])[0] || null,
      nombre: (gen.match(/NOMBRE:\s*(.+?)\s*(CARRERA|PLAN|$)/i) || [])[1] || label(cita, /^NOMBRE:?$/i) || clean((cita.getElementById('ctl00_mainCopy_Lbl_Nombre') || {}).textContent),
      carrera: claveCar,
      carrera_nombre: clean((cita.querySelector('#ctl00_mainCopy_DpdCarrera option:checked') || {}).textContent),
      plan: (cita.querySelector('#ctl00_mainCopy_dpdPlanEstudios option:checked') || {}).value || null,
      promedio: num(pick(p, /^promedio/i)),
      reprobadas_num: num(pick(p, /reprobadas$/i)),
      cita: { inicio: pick(p, /fecha inscrip/i), fin: pick(p, /caducidad/i) },
      carga: {
        total: num(pick(p, /^total de creditos$/i)), max: num(pick(p, /m.xima de creditos/i)),
        media: num(pick(p, /media de creditos/i)), min: num(pick(p, /m.nima de creditos/i)),
        duracion: num(pick(p, /duraci.n de la carrera en/i)), duracion_max: num(pick(p, /duraci.n m.xima/i))
      },
      avance: {
        obtenidos: num(pick(p, /has obtenido/i)), faltan: num(pick(p, /te faltan/i)),
        cursados: num(pick(p, /que cursaste/i)), disponibles: num(pick(p, /disponibles/i)),
        autorizada: pick(p, /carga autorizada/i)
      },
      reprobadas: repro,
      desfase_saes: pick(p, /reprobadas de \d/i),
      reprobadas_periodo: estado,
      en_curso: curso,
      horario_inscrito: horario,
      acreditadas: acred
    };
    var json = JSON.stringify(data);
    var row = function (k, v) { return '<tr><td style="color:#52525b;padding:2px 12px 2px 0">' + k + '</td><td style="font-weight:600">' + (v == null || v === '' ? '—' : v) + '</td></tr>'; };
    box.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b style="font-size:16px">Lector UPIITA</b><button id="ul-x" style="border:0;background:none;font-size:20px;cursor:pointer" aria-label="Cerrar">×</button></div>' +
      '<p style="margin:4px 0 10px;color:#52525b">Resumen de la información consultada en el SAES. No se envió a ningún servidor.</p>' +
      '<table style="border-collapse:collapse;font-size:13px">' +
      row('Boleta', data.boleta) + row('Carrera', data.carrera_nombre + (data.plan ? ' (plan ' + data.plan + ')' : '')) +
      row('Promedio', data.promedio) + row('Materias acreditadas', acred.length) + row('Materias en curso', curso ? curso.length : null) +
      row('Créditos obtenidos', data.avance.obtenidos) + row('Periodos cursados', data.avance.cursados) +
      row('Carga autorizada', data.avance.autorizada) + row('Reprobadas', repro.length ? repro.map(function (r) { return r[0].toLowerCase(); }).join(', ') : 'ninguna') +
      row('Cita de reinscripción', data.cita.inicio) + '</table>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' +
      '<button id="ul-copy" style="background:#750946;color:#fff;border:0;border-radius:999px;padding:8px 16px;font-weight:600;cursor:pointer">Copiar mis datos</button>' +
      (TOOL ? '<a id="ul-open" href="' + TOOL + '" target="_blank" rel="noopener" style="border:1px solid #d9d9de;border-radius:999px;padding:8px 16px;color:#18181b;text-decoration:none;font-weight:500">Abrir Horarios UPIITA</a>' : '') + '</div>' +
      '<p id="ul-msg" style="margin:10px 0 0;color:#52525b;font-size:13px">Después, en la herramienta, pulsa <b>Usar mis datos del SAES</b> y pega con Ctrl+V.</p>' +
      '<textarea id="ul-txt" readonly style="position:absolute;left:-9999px;width:1px;height:1px"></textarea>';
    document.getElementById('ul-x').onclick = function () { box.remove(); };
    document.getElementById('ul-copy').onclick = async function () {
      var msg = document.getElementById('ul-msg');
      try { await navigator.clipboard.writeText(json); }
      catch (e) { var t = document.getElementById('ul-txt'); t.value = json; t.select(); document.execCommand('copy'); }
      msg.innerHTML = '<b style="color:#15803d">Copiado.</b> Ahora abre la herramienta, pulsa <b>Usar mis datos del SAES</b> y pega con Ctrl+V.';
    };
  } catch (e) {
    box.innerHTML = '<b style="font-size:16px">Lector UPIITA</b><p style="margin:6px 0 0">' +
      (e.message === 'sesion' ? 'No se detectó una sesión activa del SAES. Inicia sesión y ejecuta nuevamente el marcador.' : 'No fue posible leer la información: ' + e.message) +
      '</p><button onclick="this.parentNode.remove()" style="margin-top:10px;border:1px solid #d9d9de;background:#fff;border-radius:999px;padding:6px 14px;cursor:pointer">Cerrar</button>';
  }
})();
