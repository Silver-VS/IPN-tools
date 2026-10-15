// Temarios: adaptador, lector de PoliCORE, modo «Explorar unidades de aprendizaje» del mapa, panel, explorador y rutas.
// DOM en memoria (tests/dom_minimo.mjs): sin navegador ni red. Requiere haber compilado: python tools/build_horarios.py
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {crearEntorno} from './dom_minimo.mjs';
const leer = f => readFileSync(f, 'utf8');
// Los objetos creados dentro de vm tienen otros prototipos: se comparan como datos planos.
const plano = x => JSON.parse(JSON.stringify(x));
const igual = (a, b, m) => assert.deepStrictEqual(plano(a), plano(b), m);
const dormir = ms => new Promise(r => setTimeout(r, ms));
const config = JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const textos = config.textos;

// Formateador de textos igual al de inicio.js; una clave inexistente es un error de la prueba.
const reglaPlural = new Intl.PluralRules('es-MX'), numeroFmt = new Intl.NumberFormat('es-MX');
const plurales = (s, vars) => s.replace(/\{(\w+),\s*plural,\s*((?:[^{}]*\{[^{}]*\})+)\s*\}/g, (m, k, cuerpo) => {
  const n = Number(vars[k]); if (Number.isNaN(n)) return m;
  const op = {}; cuerpo.replace(/(=?\w+)\s*\{([^{}]*)\}/g, (_, c, t) => { op[c] = t; });
  return (op['=' + n] ?? op[reglaPlural.select(n)] ?? op.other ?? '').replace(/#/g, numeroFmt.format(n));
});
const claves = new Set();
const texto = (clave, vars = {}) => {
  assert.ok(clave in textos, 'Falta la clave de texto ' + clave);
  claves.add(clave);
  return plurales(textos[clave], vars).replace(/\{(\w+)\}/g, (_, k) => { assert.ok(k in vars, clave + ': falta la variable ' + k); return vars[k]; });
};

const dist = 'web/dist/sate/datos/upiita/temarios/';
assert.ok(existsSync(dist + 'indice.json'), 'Compila antes: python tools/build_horarios.py');
const indice = JSON.parse(leer(dist + 'indice.json'));
const registros = id => JSON.parse(leer(dist + id + '.json')).materias;
const bionica = registros('bionica');

function contexto(extra = {}) {
  const {document, Evento} = crearEntorno();
  const estado = {lateral: true, resize: 0, urls: [], fetches: [], copiados: [], guardado: {}, scroll: []};
  const c = vm.createContext({console, setTimeout, clearTimeout, Intl, document, Evento,
    matchMedia: q => ({matches: /min-width:1024px/.test(q) ? estado.lateral : false, addEventListener() {}}),
    navigator: {clipboard: {writeText: async u => { estado.copiados.push(u); }}},
    location: {href: 'https://sitio.test/sate/index.html#/upiita/temarios', pathname: '/sate/index.html', search: ''},
    history: {replaceState(a, b, u) { estado.urls.push(u); }},
    CSS: {escape: s => s}, Event: Evento, dispatchEvent: e => { if (e.type === 'resize') estado.resize++; },
    scrollTo: (x, y) => estado.scroll.push([x, y]),
    fetch: async url => {
      estado.fetches.push(url);
      const m = url.match(/^datos\/([^/]+)\/temarios\/([\w-]+)\.json$/), f = m && `web/dist/sate/datos/${m[1]}/temarios/${m[2]}.json`;
      if (!f || !existsSync(f)) return {ok: false, status: 404};
      return {ok: true, json: async () => JSON.parse(leer(f))};
    }, ...extra});
  vm.runInContext('window=globalThis', c);
  return {c, document, Evento, estado};
}
function el(document, tag, attrs = {}, hijos = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'texto') n.textContent = v; else n.setAttribute(k, v); }
  hijos.forEach(h => n.appendChild(h)); return n;
}

/* ---------- 1. Adaptador y funciones puras ---------- */
{
  const {c} = contexto();
  vm.runInContext(leer('web/sate/temarios.js'), c);
  const T = c.SateTemarios;
  assert.ok(T, 'sin SATE, el archivo expone solo las funciones puras');
  assert.equal(T.claveNorm(' b307 '), 'B307');
  const reg = bionica.find(r => r.clave === 'B107');   // sin horas, créditos, vigencia ni academia en el OCR
  const doc = T.documento(reg, {t: texto, carrera: indice.carreras.bionica.nombre, plan: '09'});
  assert.equal(doc.titulo, reg.nombre);
  assert.equal(doc.subtitulo, 'B107 · ' + indice.carreras.bionica.nombre);
  igual(doc.secciones.map(s => s.id), ['objetivo', 'contenidos', 'orientacion', 'evaluacion', 'bibliografia']);
  igual(doc.secciones.map(s => s.tipo), ['texto', 'unidades', 'texto', 'texto', 'bibliografia']);
  assert.equal(doc.secciones[1].rotulo, 'Unidad');
  igual(doc.metadatos.map(m => m.etiqueta), ['Nivel', 'Tipo'], 'sin horas ni créditos en el OCR no hay chips vacíos');
  assert.equal(doc.metadatos[1].valor, 'Obligatoria');
  assert.equal(doc.avisos[0].tipo, 'ocr');
  assert.match(doc.avisos[0].texto, /Transcripción automática del programa sintético/);
  assert.equal(doc.avisos.length, 1);
  assert.equal(doc.fuente.texto, 'Programa sintético de la unidad de aprendizaje, plan 2009.');
  const b103 = T.documento(bionica.find(r => r.clave === 'B103'), {t: texto, carrera: 'X', plan: '09'});
  assert.equal(b103.metadatos.find(m => m.etiqueta === 'Academia').valor, 'Ciencias Básicas', 'sin el «de» inicial del OCR');
  assert.equal(b103.metadatos.find(m => m.etiqueta === 'Créditos TEPIC').valor, '7.5');
  assert.equal(b103.metadatos.find(m => m.etiqueta === 'Horas por semana').valor, '3 de teoría · 1.5 de práctica');
  // Créditos y horas completos, aviso de coincidencia aproximada y tipo de bibliografía legible.
  const mecatronica = registros('mecatronica');
  const completo = mecatronica.find(r => r.creditos.tepic && r.vigencia && r.academia);
  const d2 = T.documento({...completo, confianza: 0.9, bibliografia: [{texto: 'Autor, Libro', tipo: 'B'}, {texto: 'Otro', tipo: 'c'}]}, {t: texto, carrera: 'X', plan: '09'});
  const et = d2.metadatos.map(m => m.etiqueta);
  for (const e of ['Nivel', 'Tipo', 'Créditos TEPIC', 'Créditos SATCA', 'Horas por semana', 'Horas por semestre', 'Vigencia', 'Academia']) assert.ok(et.includes(e), e);
  assert.match(d2.metadatos.find(m => m.etiqueta === 'Horas por semana').valor, /de teoría · .* de práctica/);
  assert.equal(d2.avisos.length, 2);
  igual(d2.secciones.find(s => s.id === 'bibliografia').contenido.map(b => b.tipo), ['Básica', 'Complementaria']);
  // Un registro sin objetivo ni contenidos no inventa secciones.
  const d3 = T.documento({clave: 'x1', nombre: 'Vacía', nivel: null, tipo: '', contenidos: [], bibliografia: []}, {t: texto, carrera: 'X', plan: '09'});
  igual(d3.secciones, []); igual(d3.metadatos, []);
  // Búsqueda: sin acentos ni mayúsculas; todas las palabras; dice dónde coincide.
  const algebra = indice.materias.B103;
  const lista = T.filtrar(indice.materias, {q: 'ALGEBRA LINEAL', carrera: '*', nivel: '*', tipo: '*'}, null);
  assert.ok(lista.some(x => x.clave === 'B103'));
  assert.ok(lista.every(x => x.donde.join() === 'nombre'));
  assert.equal(algebra.n, 'Álgebra lineal');
  const mapa = id => ({bionica: new Map(bionica.map(r => [r.clave.toUpperCase(), r]))})[id];
  const termino = 'gauss';
  const dentro = T.filtrar(indice.materias, {q: termino, carrera: 'bionica', nivel: '*', tipo: '*'}, mapa);
  assert.ok(dentro.length >= 1 && dentro.every(x => x.c === 'bionica' && x.donde.length));
  assert.ok(dentro.find(x => x.clave === 'B103').donde.includes('objetivo'));
  assert.equal(T.filtrar(indice.materias, {q: 'zzzxyz', carrera: '*', nivel: '*', tipo: '*'}, mapa).length, 0);
  assert.equal(T.filtrar(indice.materias, {q: '', carrera: 'telematica', nivel: 2, tipo: '*'}, null).every(x => x.c === 'telematica' && x.v === 2), true);
  const g = T.agrupar(T.filtrar(indice.materias, {q: '', carrera: 'bionica'}, null));
  igual(g.map(x => x.nivel), [1, 2, 3, 4, 5]);
  for (const x of g) igual(x.items.map(i => i.n), x.items.map(i => i.n).sort((a, b) => a.localeCompare(b, 'es')));
  assert.equal(T.enlace('u1', 'bionica', 'B103', 'objetivo'), '#/u1/temarios/bionica/B103/objetivo');
  assert.equal(T.enlace('u1'), '#/u1/temarios');
}

/* ---------- 2. Lector de PoliCORE con un documento que no es temario ---------- */
{
  const {c, document, Evento, estado} = contexto();
  vm.runInContext(leer('web/policore/lector.js'), c);
  const L = c.PoliCORE.lector;
  igual(L.coincidencias('Educación y evaluación', 'EVALUACION'), [[12, 22]]);
  const regla = {
    titulo: 'Reglamento de ejemplo', subtitulo: 'Documento ficticio de prueba',
    metadatos: [{etiqueta: 'Vigencia', valor: '2026'}, {etiqueta: 'Vacío', valor: ''}, {etiqueta: 'Tipo', valor: 'Reglamento'}],
    secciones: [
      {id: 'objeto', titulo: 'Objeto', tipo: 'texto', contenido: 'La evaluación de la educación.\nSegundo párrafo con evaluación y otra evaluación.'},
      {id: 'derechos', titulo: 'Derechos', tipo: 'lista', contenido: ['Recibir educación', {texto: 'Ser evaluado con equidad'}]},
      {id: 'titulos', titulo: 'Títulos', tipo: 'unidades', rotulo: 'Título', contenido: [{numero: 'I', titulo: 'Disposiciones', subtemas: ['Alcance']}, {numero: 'II', titulo: 'Sanciones', subtemas: []}]},
      {id: 'fuentes', titulo: 'Fuentes', tipo: 'bibliografia', contenido: [{texto: 'Gaceta uno', tipo: 'Básica'}, {texto: 'Gaceta dos', tipo: 'Complementaria'}]},
      {id: 'vacia', titulo: 'Sin contenido', tipo: 'texto', contenido: '  '}
    ],
    fuente: {texto: 'Gaceta Politécnica.', url: 'https://www.ipn.mx/reglamento.pdf'},
    avisos: ['Texto de prueba', {tipo: 'ocr', texto: 'Transcripción automática'}]
  };
  const cont = el(document, 'div'); cont.clientWidth = 900; document.body.appendChild(cont);
  const navegadas = [];
  const inst = L.montar(cont, regla, {texto, enlace: id => '#/doc/' + id, alNavegar: id => navegadas.push(id), nivelTitulo: 2});
  assert.equal(L.activos(), 1);
  assert.equal(cont.querySelector('.pc-titulo').tagName, 'H2');
  assert.equal(cont.querySelector('.pc-titulo').textContent, 'Reglamento de ejemplo');
  assert.equal(cont.querySelectorAll('.pc-chip').length, 2, 'los metadatos vacíos no son chips');
  assert.equal(cont.querySelectorAll('.pc-aviso').length, 2);
  assert.equal(cont.querySelector('.pc-aviso[data-tipo=ocr]').textContent, 'Transcripción automática');
  igual(inst.secciones, ['objeto', 'derechos', 'titulos', 'fuentes'], 'la sección vacía se omite');
  assert.equal(cont.querySelectorAll('.pc-indice-a').length, 4);
  assert.equal(cont.querySelector('.pc-lector').getAttribute('data-pc-indice'), 'lateral');
  assert.equal(cont.querySelector('.pc-indice-det').open, true);
  assert.equal(cont.querySelector('.pc-indice-a').getAttribute('href'), '#/doc/objeto');
  assert.equal(cont.querySelectorAll('.pc-oficial').length > 6, true);
  assert.equal(cont.querySelector('.pc-unidad-num').textContent, 'Título I');
  assert.equal(cont.querySelectorAll('.pc-grupo').length, 2);
  const enlaceFuente = cont.querySelector('.pc-fuente');
  assert.equal(enlaceFuente.getAttribute('href'), 'https://www.ipn.mx/reglamento.pdf');
  assert.equal(enlaceFuente.getAttribute('rel'), 'noopener noreferrer');
  // Navegación por el índice
  cont.querySelector('.pc-indice-a[data-id=derechos]').dispatchEvent(new Evento('click'));
  assert.equal(document.scrolled.getAttribute('data-pc-seccion'), 'derechos');
  igual(navegadas, ['derechos']);
  assert.equal(cont.querySelector('.pc-indice-a[data-id=derechos]').getAttribute('aria-current'), 'location');
  // Búsqueda con resaltado, conteos por sección, siguiente/anterior y limpiar
  const original = cont.querySelector('.pc-texto').textContent;
  const campo = cont.querySelector('.pc-buscar');
  assert.equal(inst.buscar('EVALUACION'), 3, 'tres menciones; «evaluado» no coincide');
  assert.equal(cont.querySelectorAll('mark.pc-resalte').length, 3);
  assert.equal(cont.querySelector('mark.pc-resalte').textContent, 'evaluación');
  assert.equal(cont.querySelectorAll('.pc-resalte.pc-actual').length, 1);
  assert.equal(cont.querySelector('.pc-indice-a[data-id=objeto] .pc-n').textContent, '3');
  assert.equal(cont.querySelector('.pc-indice-a[data-id=derechos] .pc-n'), null);
  assert.equal(cont.querySelector('.pc-estado').textContent, 'Coincidencia 1 de 3');
  campo.value = 'EVALUACION';
  campo.dispatchEvent(new Evento('keydown', {key: 'Enter'}));
  assert.equal(cont.querySelector('.pc-estado').textContent, 'Coincidencia 2 de 3');
  campo.dispatchEvent(new Evento('keydown', {key: 'Enter', shiftKey: true}));
  campo.dispatchEvent(new Evento('keydown', {key: 'Enter', shiftKey: true}));
  assert.equal(cont.querySelector('.pc-estado').textContent, 'Coincidencia 3 de 3', 'da la vuelta');
  assert.equal(document.scrolled.getAttribute('class').includes('pc-actual'), true);
  assert.equal(inst.buscar('no existe'), 0);
  assert.equal(cont.querySelector('.pc-estado').textContent, 'Sin coincidencias');
  campo.dispatchEvent(new Evento('keydown', {key: 'Escape'}));
  assert.equal(cont.querySelectorAll('mark').length, 0);
  assert.equal(cont.querySelector('.pc-texto').textContent, original, 'al quitar el resalte el texto queda igual');
  assert.equal(campo.value, '');
  // Copiar el enlace de una sección
  await (async () => {
    cont.querySelector('.pc-copiar[data-id=titulos]').dispatchEvent(new Evento('click'));
    await dormir(5);
    igual(estado.copiados, ['https://sitio.test/sate/index.html#/doc/titulos']);
    assert.equal(cont.querySelector('.pc-copiar[data-id=titulos]').textContent, 'Enlace copiado');
  })();
  // Reutilización: otro documento en un panel angosto (índice desplegable) y desmontar
  const panel = el(document, 'div'); panel.clientWidth = 380; document.body.appendChild(panel);
  const otro = L.montar(panel, {titulo: 'Convocatoria', secciones: [{id: 'a', titulo: 'Requisitos', tipo: 'lista', contenido: ['Uno', 'Dos']}], fuente: {texto: 'x', url: 'javascript:alert(1)'}}, {texto, modo: 'panel'});
  assert.equal(L.activos(), 2);
  assert.equal(panel.querySelector('.pc-lector').getAttribute('data-pc-indice'), 'desplegable');
  assert.equal(panel.querySelector('.pc-indice-det').open, false);
  assert.equal(panel.querySelector('.pc-lector').getAttribute('data-pc-modo'), 'panel');
  assert.equal(panel.querySelector('.pc-fuente'), null, 'solo enlaces http(s)');
  panel.querySelector('.pc-indice-det').open = true;
  panel.querySelector('.pc-indice-a').dispatchEvent(new Evento('click'));
  assert.equal(panel.querySelector('.pc-indice-det').open, false, 'al elegir una sección el índice se pliega');
  otro.desmontar();
  assert.equal(L.activos(), 1); assert.equal(panel.childNodes.length, 0);
  L.montar(cont, {titulo: 'Sin secciones', secciones: []}, {texto});
  assert.equal(L.activos(), 1, 'montar sobre el mismo contenedor reemplaza');
  assert.equal(cont.querySelector('.pc-vacio').textContent, 'Este documento no tiene secciones para mostrar.');
  assert.equal(cont.querySelector('.pc-buscar'), null);
  L.desmontar();
  assert.equal(L.activos(), 0);
}

/* ---------- 3. Mapa: modo Explorar, panel y explorador ---------- */
{
  const {c, document, Evento, estado} = contexto();
  const modulos = {};
  const toggles = [], almacen = {};
  const tr = {want: ['B106']};
  Object.assign(c, {
    SATE: {texto, pestana: (id, m) => { modulos[id] = m; }, error: e => { throw e; }, cargarTemarios: async () => {}},
    SATE_CONFIG: {unidades: {upiita: {vistas: [{id: 'temarios', padre: 'mapa'}]}}}, SATE_UNIDAD: 'upiita',
    S: {car: 'B', mapHover: null, mapFocus: false, reqHover: null, lfocus: null},
    store: {get: (k, d) => almacen[k] ?? d, set: (k, v) => { almacen[k] = v; }},
    toggleBox: k => { toggles.push(k); tr.want.push(k); }, conSim: (a, f) => f(), conPlan: f => f(), usaSim: () => false, renderList() {}, tr: () => tr,
    resaltarMapa() {}, $: s => document.querySelector(s), pick() {}, tactil: () => false
  });
  c.renderTray = () => c.SATE.temarios.pintarModo();
  vm.runInContext(leer('web/policore/lector.js'), c);
  vm.runInContext(leer('web/sate/temarios.js'), c);
  const nucleo = leer('web/sate/nucleo.js');
  const finClick = nucleo.indexOf("document.addEventListener('keydown',e=>{const bx=");
  const click = nucleo.slice(nucleo.lastIndexOf("document.addEventListener('click',e=>{", finClick), finClick);
  const tecla = nucleo.slice(nucleo.indexOf("document.addEventListener('keydown',e=>{const bx="), nucleo.indexOf("document.addEventListener('change',e=>{if(e.target.dataset.note)"));
  assert.ok(click.length > 200 && tecla.length > 100, 'no se encontraron los manejadores reales de nucleo.js');
  vm.runInContext(click + tecla, c);

  const caja = el(document, 'div', {id: 'mapa-modo-caja'}); caja.hidden = true;
  const botonPlan = el(document, 'button', {'data-mmodo': 'planear', 'aria-pressed': 'true'}), botonExp = el(document, 'button', {'data-mmodo': 'explorar', 'aria-pressed': 'false'});
  caja.appendChild(el(document, 'div', {id: 'mapa-modo'}, [botonPlan, botonExp])); caja.appendChild(el(document, 'a', {id: 'mapa-modo-enlace', href: '#'}));
  const leyenda = el(document, 'p', {id: 'mapa-modo-leyenda'}); leyenda.hidden = true;
  const caja1 = el(document, 'div', {'class': 'box pend', 'data-box': 'B101', role: 'button', 'aria-pressed': 'false', 'aria-label': 'B101 · original', title: 'B101 · original'});
  const sinTem = el(document, 'div', {'class': 'box pend', 'data-box': 'B102', role: 'button', 'aria-pressed': 'false', 'aria-label': 'B102 · original'});
  const fila = el(document, 'div', {'class': 'tl-row'}, [el(document, 'button', {'class': 'tl-name', 'data-lfocus': 'B101', 'aria-expanded': 'false'}, [el(document, 'small')]), el(document, 'button', {'class': 'tl-want', 'data-lwant': 'B101'})]);
  const filaSin = el(document, 'div', {'class': 'tl-row'}, [el(document, 'button', {'class': 'tl-name', 'data-lfocus': 'B102', 'aria-expanded': 'false'}, [el(document, 'small')])]);
  const vista = el(document, 'section', {id: 'v-tray'}, [caja, leyenda, el(document, 'div', {id: 'map'}, [caja1, sinTem]), el(document, 'div', {id: 'tlist'}, [fila, filaSin]), el(document, 'div', {id: 'plan-panel'})]);
  document.body.appendChild(vista);
  document.body.appendChild(el(document, 'section', {id: 'sate-temarios'}));

  const T = c.SATE.temarios;
  T.pintarModo();
  assert.equal(caja.hidden, true, 'antes de saber si hay temarios el selector no aparece');
  await T.preparar();
  assert.equal(caja.hidden, false, 'Biónica tiene temarios');
  assert.equal(T.modo(), 'planear');
  assert.equal(vista.classList.contains('modo-explorar'), false);
  assert.equal(botonPlan.getAttribute('aria-pressed'), 'true');
  assert.equal(botonPlan.querySelector('.tmr-largo').textContent, 'Planear horario');
  assert.equal(botonExp.querySelector('.tmr-largo').textContent, 'Explorar unidades de aprendizaje');
  assert.equal(botonExp.getAttribute('aria-label'), 'Explorar unidades de aprendizaje');
  assert.equal(caja.querySelector('#mapa-modo-enlace').getAttribute('href'), '#/upiita/temarios');
  assert.equal(caja1.getAttribute('aria-pressed'), 'false');

  // Planear: el clic elige la materia para el horario
  caja1.dispatchEvent(new Evento('click', {target: caja1}));
  igual(toggles, ['B101']); assert.equal(T.estado.panel, null);

  // Explorar: el clic abre el temario y no toca la selección
  const antes = JSON.stringify(tr);
  botonExp.dispatchEvent(new Evento('click', {target: botonExp}));
  igual(almacen.mmodo, {B: 'explorar'}, 'recordado por carrera');
  assert.equal(T.modo(), 'explorar');
  assert.equal(vista.classList.contains('modo-explorar'), true);
  assert.equal(leyenda.hidden, false);
  assert.match(leyenda.textContent, /En este modo no se elige nada para tu horario/);
  assert.equal(botonExp.getAttribute('aria-pressed'), 'true');
  assert.equal(caja1.hasAttribute('aria-pressed'), false);
  assert.equal(caja1.getAttribute('aria-label'), 'Leer el temario de ' + indice.materias.B101.n);
  assert.equal(caja1.classList.contains('sin-temario'), false);
  assert.equal(sinTem.classList.contains('sin-temario'), true, 'B102 no tiene temario');
  assert.match(sinTem.getAttribute('aria-label'), /B102 · original · Sin temario disponible/);
  assert.equal(filaSin.classList.contains('sin-temario'), true);
  assert.equal(filaSin.querySelector('[data-tm-tag]').textContent, 'Sin temario disponible');
  assert.equal(fila.querySelector('[data-tm-tag]'), null);
  assert.equal(fila.querySelector('.tl-name').hasAttribute('aria-expanded'), false);
  caja1.dispatchEvent(new Evento('click', {target: caja1}));
  await dormir(20);
  igual(toggles, ['B101'], 'el modo Explorar no selecciona nada para el horario');
  assert.equal(JSON.stringify(tr), antes);
  const panel = T.estado.panel;
  assert.equal(panel.hidden, false);
  assert.equal(panel.getAttribute('aria-label'), 'Temario de ' + indice.materias.B101.n);
  assert.equal(panel.parentNode, document.documentElement, 'el panel cuelga de <html>, fuera del zoom del <body>');
  assert.equal(panel.querySelector('.pc-titulo').textContent, indice.materias.B101.n);
  assert.equal(panel.querySelector('.pc-lector').getAttribute('data-pc-modo'), 'panel');
  assert.equal(panel.querySelector('.tmr-panel-abrir').getAttribute('href'), '#/upiita/temarios/bionica/B101');
  assert.equal(document.activeElement, panel);
  assert.equal(document.body.classList.contains('tmr-lateral'), true, 'escritorio: panel al lado');
  assert.equal(estado.resize, 1, 'el mapa se reajusta una sola vez');
  assert.equal(panel.getAttribute('aria-modal'), 'false');
  // Otro clic cambia el contenido sin abrir un segundo panel; una caja sin temario no abre nada
  const otra = el(document, 'div', {'class': 'box', 'data-box': 'B106', role: 'button'});
  document.querySelector('#map').appendChild(otra);
  otra.dispatchEvent(new Evento('click', {target: otra}));
  await dormir(20);
  assert.equal(panel.querySelector('.pc-titulo').textContent, indice.materias.B106.n);
  assert.equal(c.PoliCORE.lector.activos(), 1);
  sinTem.dispatchEvent(new Evento('click', {target: sinTem}));
  await dormir(10);
  assert.equal(panel.querySelector('.pc-titulo').textContent, indice.materias.B106.n, 'B102 no cambia el panel');
  igual(toggles, ['B101']);
  // Teclado: Enter abre en explorar; Esc cierra y devuelve el foco
  caja1.focus();
  caja1.dispatchEvent(new Evento('keydown', {key: 'Enter', target: caja1}));
  await dormir(20);
  assert.equal(panel.querySelector('.pc-titulo').textContent, indice.materias.B101.n);
  igual(toggles, ['B101']);
  document.dispatchEvent(new Evento('keydown', {key: 'Escape', target: document.body}));
  assert.equal(panel.hidden, true);
  assert.equal(document.activeElement, caja1, 'el foco vuelve a la materia');
  assert.equal(c.PoliCORE.lector.activos(), 0);
  assert.equal(document.body.classList.contains('tmr-lateral'), false);
  assert.equal(estado.resize, 2);
  // Vista de lista: abrir desde el nombre, sin controles de selección
  fila.querySelector('.tl-name').dispatchEvent(new Evento('click', {target: fila.querySelector('.tl-name')}));
  await dormir(20);
  assert.equal(panel.hidden, false);
  assert.equal(c.S.lfocus, null, 'no se expande la fila de la lista');
  fila.querySelector('.tl-want').dispatchEvent(new Evento('click', {target: fila.querySelector('.tl-want')}));
  igual(toggles, ['B101'], 'el botón de agregar no actúa en este modo');
  T.cerrar();
  // Teléfono: hoja con velo, modal y sin desplazamiento del fondo
  estado.lateral = false;
  caja1.dispatchEvent(new Evento('click', {target: caja1}));
  await dormir(20);
  assert.equal(panel.getAttribute('aria-modal'), 'true');
  assert.equal(T.estado.velo.hidden, false);
  assert.equal(document.documentElement.classList.contains('sate-sin-scroll'), true);
  T.estado.velo.dispatchEvent(new Evento('click', {target: T.estado.velo}));
  assert.equal(panel.hidden, true); assert.equal(T.estado.velo.hidden, true);
  assert.equal(document.documentElement.classList.contains('sate-sin-scroll'), false);
  estado.lateral = true;
  // Otra carrera con temarios conserva su propio modo; una sin temarios oculta el selector
  c.S.car = 'M'; T.pintarModo();
  assert.equal(caja.hidden, false); assert.equal(T.modo(), 'planear'); assert.equal(vista.classList.contains('modo-explorar'), false);
  assert.equal(sinTem.classList.contains('sin-temario'), false, 'al volver a Planear se retiran las marcas');
  assert.equal(caja1.getAttribute('aria-label'), 'B101 · original');
  c.S.car = 'E'; T.pintarModo();
  assert.equal(caja.hidden, true, 'una carrera sin temarios no ofrece el modo');
  assert.equal(T.explorando(), false);
  c.S.car = 'B'; T.pintarModo();
  assert.equal(T.modo(), 'explorar'); assert.equal(vista.classList.contains('modo-explorar'), true);
  // Volver a Planear cierra el panel y restaura las etiquetas
  caja1.dispatchEvent(new Evento('click', {target: caja1})); await dormir(20);
  botonPlan.dispatchEvent(new Evento('click', {target: botonPlan}));
  assert.equal(panel.hidden, true); assert.equal(vista.classList.contains('modo-explorar'), false);
  assert.equal(caja1.getAttribute('aria-label'), 'B101 · original');
  igual(almacen.mmodo, {B: 'planear'});
  // Enlace desde la ficha de la materia (inspector)
  assert.match(T.enlaceHtml('B101'), /href="#\/upiita\/temarios\/bionica\/B101"[^>]*>Ver temario</);
  assert.equal(T.enlaceHtml('B102'), '');
  assert.equal(T.enlaceHtml('XXX'), '');

  /* ----- Explorador independiente ----- */
  const caja2 = document.getElementById('sate-temarios');
  const m = modulos.temarios; assert.ok(m, 'registra la vista temarios');
  await m.mostrar({partes: []});
  assert.equal(caja2.querySelector('.tmr').getAttribute('data-vista'), 'lista');
  assert.equal(caja2.querySelector('h2').textContent, 'Temarios de unidades de aprendizaje');
  assert.equal(caja2.querySelector('.tmr-elegir').textContent, 'Elige una unidad de aprendizaje de la lista para leer su temario.');
  const items = () => caja2.querySelectorAll('.tmr-item');
  assert.equal(items().length, 72, 'la carrera del mapa (Biónica) viene seleccionada');
  assert.equal(caja2.querySelector('.tmr-resumen').textContent, '72 unidades de aprendizaje');
  igual(caja2.querySelectorAll('.tmr-grupo h3').map(h => h.textContent), ['Nivel 1', 'Nivel 2', 'Nivel 3', 'Nivel 4', 'Nivel 5']);
  assert.equal(items()[0].getAttribute('href').startsWith('#/upiita/temarios/bionica/B'), true);
  const selCarrera = caja2.querySelectorAll('select')[0];
  assert.equal(selCarrera.querySelectorAll('option').length, 4, 'Todas + 3 carreras');
  // Filtros
  selCarrera.value = '*'; selCarrera.dispatchEvent(new Evento('change', {target: selCarrera}));
  assert.equal(items().length, 240);
  assert.equal(almacen.tmFiltros.carrera, '*');
  selCarrera.value = 'telematica'; selCarrera.dispatchEvent(new Evento('change', {target: selCarrera}));
  assert.equal(items().length, 71); assert.ok(items().every(a => a.dataset.clave.startsWith('T')));
  const selTipo = caja2.querySelectorAll('select')[2];
  selTipo.value = 'elegible'; selTipo.dispatchEvent(new Evento('change', {target: selTipo}));
  assert.equal(items().length, 8);
  selTipo.value = '*'; selTipo.dispatchEvent(new Evento('change', {target: selTipo}));
  const selNivel = caja2.querySelectorAll('select')[1];
  selNivel.value = '4'; selNivel.dispatchEvent(new Evento('change', {target: selNivel}));
  assert.equal(items().length, 5); selNivel.value = '*'; selNivel.dispatchEvent(new Evento('change', {target: selNivel}));
  selCarrera.value = 'bionica'; selCarrera.dispatchEvent(new Evento('change', {target: selCarrera}));
  // Búsqueda: nombre al instante, contenido después de cargar los temarios
  const buscar = caja2.querySelector('.tmr-buscar');
  buscar.value = 'algebra'; buscar.dispatchEvent(new Evento('input', {target: buscar}));
  await dormir(400);
  assert.ok(items().length >= 1 && items().length < 72);
  assert.ok(items().some(a => a.dataset.clave === 'B103'));
  assert.match(caja2.querySelector('.tmr-resumen').textContent, /unidad(es)? de aprendizaje$/);
  assert.equal(caja2.querySelector('mark.tmr-marca').textContent.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), 'algebra', 'resalta sin acentos');
  buscar.value = 'gauss'; buscar.dispatchEvent(new Evento('input', {target: buscar}));
  await dormir(400);
  const gauss = items().find(a => a.dataset.clave === 'B103');
  assert.ok(gauss, 'busca también en el objetivo');
  assert.match(gauss.textContent, /Coincide en: objetivo/);
  assert.ok(estado.fetches.some(u => u.endsWith('telematica.json')), 'la búsqueda de contenido descargó todas las carreras');
  buscar.value = 'zzzxyz'; buscar.dispatchEvent(new Evento('input', {target: buscar}));
  await dormir(200);
  assert.equal(items().length, 0);
  assert.equal(caja2.querySelector('.tmr-resumen').textContent, 'Ninguna unidad de aprendizaje coincide');
  assert.equal(caja2.querySelector('.tmr-vacio').textContent, 'Prueba con otro nombre o quita algún filtro.');
  buscar.value = ''; buscar.dispatchEvent(new Evento('input', {target: buscar})); await dormir(200);
  assert.equal(items().length, 72);
  // Enlaces profundos
  await m.mostrar({partes: ['bionica', 'B103', 'contenidos']});
  assert.equal(caja2.querySelector('.tmr').getAttribute('data-vista'), 'lector');
  assert.equal(caja2.querySelector('.tmr-lector .pc-titulo').textContent, indice.materias.B103.n);
  assert.equal(document.scrolled.getAttribute('data-pc-seccion'), 'contenidos');
  assert.equal(caja2.querySelector('.tmr-item[aria-current=page]').dataset.clave, 'B103');
  assert.equal(caja2.querySelector('.pc-lector').getAttribute('data-pc-modo'), 'pagina');
  const hijos = caja2.querySelector('.tmr-lector');
  const montaje = hijos.querySelector('.pc-lector');
  await m.mostrar({partes: ['bionica', 'B103', 'evaluacion']});
  assert.equal(hijos.querySelector('.pc-lector'), montaje, 'misma materia: no se vuelve a montar');
  assert.equal(document.scrolled.getAttribute('data-pc-seccion'), 'evaluacion');
  caja2.querySelector('.pc-copiar[data-id=objetivo]').dispatchEvent(new Evento('click'));
  await dormir(5);
  assert.equal(estado.copiados.at(-1), 'https://sitio.test/sate/index.html#/upiita/temarios/bionica/B103/objetivo');
  caja2.querySelector('.pc-indice-a[data-id=bibliografia]').dispatchEvent(new Evento('click'));
  assert.equal(estado.urls.at(-1), '/sate/index.html#/upiita/temarios/bionica/B103/bibliografia', 'la sección abierta actualiza la dirección sin recargar');
  assert.equal(caja2.querySelector('.tmr-volver').getAttribute('href'), '#/upiita/temarios');
  await m.mostrar({partes: ['bionica', 'B999']});
  assert.equal(caja2.querySelector('.tmr-lector').textContent, 'No encontramos ese temario. Puede que la clave haya cambiado.');
  await m.mostrar({partes: ['telematica', 'B103']});
  assert.match(caja2.querySelector('.tmr-lector').textContent, /No encontramos ese temario/);
  await m.mostrar({partes: []});
  assert.equal(caja2.querySelector('.tmr').getAttribute('data-vista'), 'lista');
  assert.equal(c.PoliCORE.lector.activos(), 0);
  // Sin datos en la unidad: mensaje, sin errores
  const sin = contexto();
  Object.assign(sin.c, {SATE: {texto, pestana: (id, m2) => { modulos.sin = m2; }, error: e => { throw e; }}, SATE_CONFIG: {unidades: {}}, SATE_UNIDAD: 'otra'});
  vm.runInContext(leer('web/policore/lector.js'), sin.c); vm.runInContext(leer('web/sate/temarios.js'), sin.c);
  const cajaSin = sin.document.body.appendChild(el(sin.document, 'section', {id: 'sate-temarios'}));
  await modulos.sin.mostrar({partes: []});
  assert.equal(cajaSin.textContent, 'Esta unidad académica aún no tiene temarios en SATE.');
}

/* ---------- 4. Rutas, datos y compilación ---------- */
{
  const c = vm.createContext({});
  vm.runInContext(leer('web/sate/rutas.js'), c);
  const R = c.SateRutas, cfg = config.unidades;
  const r = R.ruta('#/upiita/temarios/bionica/B103/objetivo', 'upiita', cfg);
  assert.equal(r.pestana, 'temarios'); assert.equal(r.vista, true); assert.equal(r.padre, 'mapa');
  igual(r.partes, ['bionica', 'B103', 'objetivo']);
  assert.equal(r.hash, '#/upiita/temarios/bionica/B103/objetivo');
  igual(R.ruta('#/upiita/temarios', 'upiita', cfg).partes, []);
  assert.equal(R.ruta('#/upiita/temarios/a/b/c/d/e', 'upiita', cfg), null, 'demasiadas partes');
  assert.equal(R.ruta('#/upiita/temarios/a b', 'upiita', cfg), null);
  assert.equal(R.ruta('#/upiita/temarios/..%2f', 'upiita', cfg), null);
  assert.equal(R.ruta('#/upiita/mapa/algo', 'upiita', cfg), null, 'las pestañas normales no aceptan partes');
  for (const u of Object.keys(cfg).filter(u => u !== 'upiita')) {
    assert.equal(R.ruta('#/' + u + '/temarios', u, cfg), null, u + ': sin temarios la ruta no existe');
    igual(cfg[u].vistas, [], u);
    assert.equal(existsSync('web/dist/sate/datos/' + u + '/temarios'), false, u + ': no se copian temarios');
  }
  igual(cfg.upiita.vistas, [{id: 'temarios', padre: 'mapa'}]);
  assert.equal(R.redireccion('upiita', '', '#/temarios/bionica'), 'sate/index.html#/upiita/temarios/bionica');
  // Datos compilados
  assert.equal(Object.keys(indice.materias).length, 240);
  for (const [id, car] of Object.entries(indice.carreras)) assert.equal(registros(id).length, car.total);
  assert.ok(Object.keys(indice.materias).every(k => k === k.toUpperCase()), 'claves en mayúsculas (B307)');
  const crudo = readFileSync(dist + 'bionica.json', 'utf8');
  assert.equal(crudo.includes('NIVEL_I'), false, 'sin rutas de PDF en el sitio');
  for (const f of ['web/dist/policore/lector.js', 'web/dist/policore/lector.css', 'web/dist/sate/temarios.js', 'web/dist/sate/temarios.css']) assert.ok(existsSync(f), f);
  assert.ok(config.textos['temarios.aviso.ocr'] && config.textos['policore.lector.buscar.marcador']);
  // Ningún texto visible se escribe en el código: todas las claves usadas en esta prueba existen (texto() lo comprueba)
  assert.ok(claves.size > 40, 'la prueba ejercitó ' + claves.size + ' claves de texto');
}
/* ---------- 5. Página de revisión local ---------- */
{
  execFileSync('python', ['tools/build_qa_temarios.py'], {stdio: 'pipe'});
  const html = leer('web/qa-temarios.html');
  const bloques = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(bloques.length, 5);
  for (const b of bloques) assert.doesNotThrow(() => new Function(b));
  for (const marca of ['/*__', 'null, REGLAMENTO']) assert.equal(html.includes(marca), false, 'marca sin sustituir ' + marca);
  const {c, document} = contexto({Texto: undefined});
  Object.assign(c, {location: {search: '?tema=oscuro&q=gauss', href: 'https://sitio.test/qa-temarios.html'}});
  document.body.appendChild(el(document, 'span', {'data-t': 'qa.temarios.titulo'}));
  document.body.appendChild(el(document, 'button', {'data-ancho': '375'}));
  const marco = document.body.appendChild(el(document, 'div', {id: 'marco'})); marco.clientWidth = 1000;
  for (const id of ['temario', 'panel', 'otro']) { const n = el(document, 'div', {id}); n.clientWidth = id === 'panel' ? 380 : 900; document.body.appendChild(n); }
  document.documentElement.clientWidth = 1440;
  for (const b of bloques) vm.runInContext(b, c);
  assert.equal(document.getElementById('temario').querySelectorAll('.pc-lector').length, 1);
  assert.equal(document.documentElement.getAttribute('data-tema'), 'oscuro');
  assert.equal(document.getElementById('panel').querySelector('.pc-lector').getAttribute('data-pc-modo'), 'panel');
  assert.equal(document.getElementById('otro').querySelector('.pc-titulo').textContent, 'Reglamento de ejemplo');
  assert.ok(document.getElementById('temario').querySelectorAll('mark.pc-resalte').length > 0, 'q= resalta desde el enlace');
  assert.equal(c.PoliCORE.lector.activos(), 3);
}
console.log('OK temarios: adaptador, lector de PoliCORE reutilizable, modo Explorar sin tocar el horario, panel/hoja, explorador, enlaces profundos y unidades sin temarios.');
