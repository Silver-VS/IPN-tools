// Temarios: adaptador, lector de PoliCORE, planeación del mapa, panel, explorador y rutas.
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
    location: {href: 'https://sitio.test/sate/index.html#/upiita/guia/programas', pathname: '/sate/index.html', search: ''},
    history: {replaceState(a, b, u) { estado.urls.push(u); }},
    CSS: {escape: s => s}, Event: Evento, dispatchEvent: e => { if (e.type === 'resize') estado.resize++; },
    scrollTo: (x, y) => estado.scroll.push([x, y]),
    fetch: async url => {
      estado.fetches.push(url);
      const m = url.match(/^datos\/([^/]+)\/(temarios|recursos)\/([\w-]+)\.json$/), f = m && `web/dist/sate/datos/${m[1]}/${m[2]}/${m[3]}.json`;
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
  igual(doc.metadatos.map(m => m.etiqueta), ['Nivel', 'Tipo', 'Créditos TEPIC', 'Horas por semana'], 'créditos y horas faltantes se completan con el plan del SAES; no hay chips vacíos');
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
  assert.equal(T.enlace('u1', 'bionica', 'B103', 'objetivo'), '#/u1/guia/programas/bionica/B103/objetivo');
  assert.equal(T.enlace('u1'), '#/u1/guia/programas');
  const recurso = {titulo:'Vectores ficticios',url:'https://example.org/vectores',fuente:'Academia ficticia',idioma:'es',tipo:'Vídeo',licencia:'CC0',unidades:[1,2]};
  assert.equal(T.recursosValidos({B101:[recurso]}), true);
  for(const url of ['javascript:alert(1)','data:text/html,test','file:///test','//example.org']) assert.equal(T.recursosValidos({B101:[{...recurso,url}]}), false);
  assert.equal(T.recursosValidos({B101:[{...recurso,licencia:null}]}), false);
  assert.equal(T.recursosValidos({B101:[{...recurso,unidades:[0]}]}), false);
  assert.equal(T.tituloTema('ÁLGEBRA LINEAL.'),'Álgebra lineal');
  assert.equal(T.tituloTema('Replicación del ADN.'), 'Replicación del ADN');
  assert.equal(T.tituloTema('REPLICACIÓN DEL ADN.', config.siglasTemarios), 'Replicación del ADN');
  assert.equal(T.tituloTema('PCR, ARN Y ADN.', config.siglasTemarios), 'PCR, ARN y ADN');
  assert.equal(T.tituloTema('Uso de SQL y TCP/IP.'), 'Uso de SQL y TCP/IP');
  assert.equal(T.tituloTema('ESTUDIO DEL SOL.' , config.siglasTemarios), 'Estudio del sol');
  const piloto = JSON.parse(leer('data/recursos/upiita/bionica.json'));
  assert.ok(T.recursosValidos(piloto));
  igual(JSON.parse(leer('web/dist/sate/datos/upiita/recursos/bionica.json')), piloto);
  assert.equal(Object.keys(piloto).length, 63);   // piloto (niveles 1–2) + REC2 (niveles 3–5)
  assert.equal(Object.values(piloto).flat().length, 109);
  for (const carrera of ['mecatronica', 'telematica']) {
    const datos = JSON.parse(leer(`data/recursos/upiita/${carrera}.json`));
    assert.ok(T.recursosValidos(datos), carrera);
    igual(JSON.parse(leer(`web/dist/sate/datos/upiita/recursos/${carrera}.json`)), datos);
  }
  for (const clave of ['B213', 'B211', 'B215']) assert.equal(piloto[clave], undefined);
  assert.ok(piloto.B103.some(r => r.url.endsWith('_(Kuttler)')), 'conserva el paréntesis de LibreTexts');
}

/* ---------- 1b. Descripciones redactadas (DESC1) ---------- */
{
  for (const carrera of ['bionica', 'mecatronica', 'telematica']) {
    const desc = JSON.parse(leer(`data/temarios/upiita/descripciones/${carrera}.json`));
    const compilado = registros(carrera), claves = new Set(compilado.map(r => r.clave.toUpperCase()));
    for (const [clave, d] of Object.entries(desc)) {
      assert.ok(claves.has(clave), `${carrera}: la descripción ${clave} no tiene temario`);
      const n = d.descripcion.trim().split(/\s+/).length;
      assert.ok(n >= 25 && n <= 45, `${clave}: ${n} palabras`);
      assert.doesNotMatch(d.descripcion, /aprender[aá]s|te ayudar[aá]|necesarios para/i, clave);
      assert.equal(typeof d.revisada, 'boolean'); assert.ok(d.base);
      assert.equal(compilado.find(r => r.clave === clave).descripcion, d.descripcion, `${clave}: no llegó a la ficha`);
    }
    assert.ok(Object.keys(desc).length > 60, carrera + ': descripciones incompletas');
  }
  // Créditos y horas de respaldo desde el plan del SAES
  const b101 = bionica.find(r => r.clave === 'B101');
  assert.equal(b101.creditos.tepic, 7.5); assert.equal(b101.horas.teoria_semana, 3); assert.equal(b101.horas.practica_semana, 1.5);
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

/* ---------- 3. Mapa: planeación, enlace al programa, panel y explorador ---------- */
{
  const {c, document, Evento, estado} = contexto();
  const modulos = {};
  const toggles = [], almacen = {mmodo: {B: 'explorar'}};
  const tr = {want: ['B106']};
  Object.assign(c, {
    SATE: {texto, pestana: (id, m) => { modulos[id] = m; }, error: e => { throw e; }, cargarTemarios: async () => {}},
    SATE_CONFIG: {unidades: {upiita: {vistas: [{id: 'temarios', padre: 'guia'}]}}}, SATE_UNIDAD: 'upiita',
    S: {car: 'B', mapHover: null, mapFocus: false, reqHover: null, lfocus: null},
    store: {get: (k, d) => { assert.notEqual(k, 'mmodo', 'el modo antiguo no se consulta'); return almacen[k] ?? d; }, set: (k, v) => { almacen[k] = v; }},
    toggleBox: k => { toggles.push(k); tr.want.push(k); }, conSim: (a, f) => f(), conPlan: f => f(), usaSim: () => false, renderList() {}, tr: () => tr,
    resaltarMapa() {}, $: s => document.querySelector(s), pick() {}, tactil: () => false
  });
  c.renderTray = () => {};
  vm.runInContext(leer('web/policore/lector.js'), c);
  vm.runInContext(leer('web/sate/temarios.js'), c);
  const nucleo = leer('web/sate/nucleo.js');
  const finClick = nucleo.indexOf("document.addEventListener('keydown',e=>{const bx=");
  const click = nucleo.slice(nucleo.lastIndexOf("document.addEventListener('click',e=>{", finClick), finClick);
  const tecla = nucleo.slice(nucleo.indexOf("document.addEventListener('keydown',e=>{const bx="), nucleo.indexOf("document.addEventListener('change',e=>{if(e.target.dataset.note)"));
  assert.ok(click.length > 200 && tecla.length > 100, 'no se encontraron los manejadores reales de nucleo.js');
  vm.runInContext(click + tecla, c);

  const caja1 = el(document, 'div', {'class': 'box pend', 'data-box': 'B101', role: 'button', 'aria-pressed': 'false', 'aria-label': 'B101 · original', title: 'B101 · original'});
  const sinTem = el(document, 'div', {'class': 'box pend', 'data-box': 'B102', role: 'button', 'aria-pressed': 'false', 'aria-label': 'B102 · original'});
  const fila = el(document, 'div', {'class': 'tl-row'}, [el(document, 'button', {'class': 'tl-name', 'data-lfocus': 'B101', 'aria-expanded': 'false'}, [el(document, 'small')]), el(document, 'button', {'class': 'tl-want', 'data-lwant': 'B101'})]);
  const filaSin = el(document, 'div', {'class': 'tl-row'}, [el(document, 'button', {'class': 'tl-name', 'data-lfocus': 'B102', 'aria-expanded': 'false'}, [el(document, 'small')])]);
  const vista = el(document, 'section', {id: 'v-tray'}, [el(document, 'div', {id: 'map'}, [caja1, sinTem]), el(document, 'div', {id: 'tlist'}, [fila, filaSin]), el(document, 'div', {id: 'plan-panel'})]);
  document.body.appendChild(vista);
  document.body.appendChild(el(document, 'section', {id: 'sate-temarios'}));

  const T = c.SATE.temarios, T_ = c.SateTemarios;
  c.SATE_CONFIG.guia = config.guia;
  const portada = document.body.appendChild(el(document,'section',{id:'sate-guia'}));
  c.SATE_CONFIG.bibliotecas = config.bibliotecas;
  await modulos.guia.mostrar();
  // Dos caminos de primera clase, sin tarjetas genéricas
  assert.equal(portada.querySelectorAll('.guia-tarjeta').length, 0, 'la portada ya no son tarjetas genéricas');
  igual(portada.querySelectorAll('.gd-camino h3').map(x => x.textContent), ['Consultar un temario', 'Explorar mi carrera']);
  igual(portada.querySelectorAll('.gd-camino--dos .gd-puntos li').map(x => x.textContent).length, 3);
  assert.equal(portada.querySelector('.gd-todos').getAttribute('href'), '#/upiita/guia/programas');
  // Camino 1: búsqueda directa
  const q = portada.querySelector('.gd-buscar');
  q.value = 'algebra'; q.dispatchEvent(new Evento('input', {target: q}));
  const resultados = portada.querySelectorAll('.gd-res-item');
  assert.ok(resultados.length >= 1 && resultados.length <= 8);
  assert.equal(resultados[0].getAttribute('href').startsWith('#/upiita/guia/programas/bionica/B'), true);
  assert.ok(resultados.some(a => a.getAttribute('href') === '#/upiita/guia/programas/bionica/B103'));
  assert.equal(portada.querySelector('.gd-res').hidden, false);
  q.dispatchEvent(new Evento('keydown', {key: 'Enter', target: q}));
  assert.equal(c.location.hash, resultados[0].getAttribute('href'), 'Enter abre el primer resultado');
  q.value = 'zzzxyz'; q.dispatchEvent(new Evento('input', {target: q}));
  assert.equal(portada.querySelectorAll('.gd-res-item').length, 0);
  assert.match(portada.querySelector('.gd-res').textContent, /No hay una materia con ese nombre/);
  q.value = ''; q.dispatchEvent(new Evento('input', {target: q}));
  assert.equal(portada.querySelector('.gd-res').hidden, true);
  // Camino 2: explorador por líneas de aprendizaje y niveles; la carrera del mapa (Biónica) viene elegida
  const exp = portada.querySelector('#gd-explorar');
  assert.ok(exp, 'sección del explorador');
  assert.equal(exp.querySelector('#gd-carrera').value, 'bionica');
  assert.equal(portada.querySelectorAll('.gd-chip').length, 72, 'todas las materias de la carrera, una vez');
  const filas = T_.lineasDeAprendizaje(indice.materias, 'bionica', indice.carreras.bionica.areas);
  assert.equal(portada.querySelectorAll('.gd-fila').length, filas.length + 1, 'una fila por línea más el encabezado de niveles');
  assert.ok(filas.at(-1).nombre === null && filas.at(-1).items.length > 0, 'las optativas van al final, en su propia fila');
  assert.ok(filas.every(f => f.items.every((i, k) => k === 0 || f.items[k - 1].v <= i.v)), 'cada línea ordenada por nivel');
  assert.match(portada.querySelector('.gd-inspector').textContent, /Elige una materia/);
  const chipAlgebra = portada.querySelector('.gd-chip[data-clave=B103]');
  assert.match(chipAlgebra.getAttribute('class'), /gd-n1\b/, 'el chip va en la columna de su nivel');
  chipAlgebra.click();
  const insp = portada.querySelector('.gd-inspector');
  assert.equal(insp.querySelector('h4').textContent, 'Álgebra lineal');
  assert.equal(insp.querySelector('.btn').getAttribute('href'), '#/upiita/guia/programas/bionica/B103');
  const rel = T_.relaciones(indice.materias, 'B103');
  igual(insp.querySelectorAll('.gd-mini').length, 1, 'B103 es una base: solo desbloquea');
  assert.match(insp.textContent, /Ninguna: es una base de la carrera/);
  const chipsRel = insp.querySelectorAll('.gd-mini button').map(b => b.getAttribute('data-clave'));
  igual(chipsRel, [...rel.despues, ...rel.antes]);
  assert.ok(rel.despues.length > 0, 'B103 desbloquea otras materias por la seriación real');
  assert.equal(portada.querySelector('.gd-chip[data-clave=B103]').getAttribute('aria-pressed'), 'true');
  assert.ok(portada.querySelectorAll('.gd-rel').length >= rel.despues.length, 'las relacionadas se marcan en el mapa');
  await dormir(20);
  assert.equal(insp.querySelector('.gd-quees').hidden, false);
  assert.equal(insp.querySelector('.gd-quees').textContent, bionica.find(r => r.clave === 'B103').descripcion, 'qué es: la descripción de la ficha');
  assert.doesNotMatch(insp.textContent, /Para qué sirve|trabajo/i, 'sin dato no se inventa');
  // elegir una materia desbloqueada desde el inspector
  insp.querySelector('.gd-mini button').click();
  assert.equal(portada.querySelector('.gd-inspector h4').textContent, indice.materias[rel.despues[0]].n);
  // otra carrera
  const selC = portada.querySelector('#gd-carrera');
  selC.value = 'telematica'; selC.dispatchEvent(new Evento('change', {target: selC}));
  assert.equal(portada.querySelectorAll('.gd-chip').length, 71);
  assert.match(portada.querySelector('.gd-inspector').textContent, /Elige una materia/, 'al cambiar de carrera se limpia la selección');
  selC.value = 'bionica'; selC.dispatchEvent(new Evento('change', {target: selC}));
  // especializaciones (líneas de data/especialidades.json)
  const modos = portada.querySelectorAll('.gd-seg button');
  assert.equal(modos.length, 2);
  modos[1].click();
  assert.equal(portada.querySelector('.gd-esp').hidden, false); assert.equal(portada.querySelector('.gd-mapa').hidden, true);
  assert.equal(portada.querySelectorAll('.gd-esp-linea').length, 6);
  assert.equal(portada.querySelectorAll('.gd-esp-area').length, 3);
  assert.ok(portada.querySelector('.gd-esp-linea a').getAttribute('href').startsWith('#/upiita/guia/programas/bionica/B'));
  modos[0].click();
  assert.equal(portada.querySelector('.gd-mapa').hidden, false);
  // «¿No sabes por dónde empezar?»: bibliotecas del IPN desde datos
  assert.match(portada.querySelector('.gd-ayuda h3').textContent, /¿No sabes por dónde empezar\?/);
  const bib = portada.querySelectorAll('.gd-biblio a');
  igual(bib.map(a => a.getAttribute('href')), ['https://www.busqueda.dirbibliotecas.ipn.mx/F/?func=find-b-0', 'https://www.ipn.mx/bibliotecas-publicaciones/recursos-digitales/biblioteca-digital.html']);
  for (const a of bib) { assert.equal(a.getAttribute('target'), '_blank'); assert.equal(a.getAttribute('rel'), 'noopener noreferrer'); }
  assert.equal(portada.querySelectorAll('.gd-pasos li').length, 4);
  // Lo demás, discreto y marcado como próximamente
  igual(portada.querySelectorAll('.gd-pronto li strong').map(x => x.textContent), ['Normativa', 'Tu unidad académica', 'Historia y organización del IPN']);
  assert.equal(portada.querySelectorAll('.guia-icono').length, 3);
  const fetchOriginal = c.fetch;
  c.fetch = async url => url.endsWith('/recursos/bionica.json') ? {ok:true,json:async()=>({B101:[{titulo:'Vectores de prueba',url:'https://example.org/estudio',fuente:'Academia ficticia',idioma:'es',tipo:'Curso',licencia:'CC0'}]})} : fetchOriginal(url);
  await T.preparar();
  T.estado.indice.recursos = ['bionica']; // El catálogo ficticio habilita el cargador sin solicitudes 404.
  // Incluso con la preferencia antigua guardada, clic y teclado solo planean.
  caja1.dispatchEvent(new Evento('click', {target: caja1}));
  sinTem.dispatchEvent(new Evento('click', {target: sinTem}));
  const optativa = el(document, 'div', {'data-obox': 'B106'});
  vista.appendChild(optativa);
  optativa.dispatchEvent(new Evento('click', {target: optativa}));
  for (const key of ['Enter', ' ']) caja1.dispatchEvent(new Evento('keydown', {key, target: caja1}));
  fila.querySelector('.tl-name').dispatchEvent(new Evento('click', {target: fila.querySelector('.tl-name')}));
  assert.equal(c.S.lfocus, 'B101', 'el nombre expande la ficha de la lista');
  fila.querySelector('.tl-want').dispatchEvent(new Evento('click', {target: fila.querySelector('.tl-want')}));
  igual(toggles, ['B101', 'B102', 'B106', 'B101', 'B101', 'B101']);
  assert.equal(T.estado.panel, null, 'el mapa no abre el lector');
  igual(almacen, {mmodo: {B: 'explorar'}}, 'no se lee ni se escribe el modo antiguo');
  assert.equal(caja1.getAttribute('aria-label'), 'B101 · original');
  assert.equal(caja1.getAttribute('aria-pressed'), 'false');
  assert.equal(sinTem.classList.contains('sin-temario'), false);
  assert.equal(filaSin.querySelector('[data-tm-tag]'), null);
  for (const f of ['web/sate/cascaron.html', 'web/sate/nucleo.js', 'web/sate/mapa.js', 'web/sate/temarios.js', 'web/sate/temarios.css']) {
    assert.doesNotMatch(leer(f), /mmodo|mapa-modo|modo-explorar|pintarModo|explorando/, f);
  }
  const html = leer('web/sate/cascaron.html');
  assert.match(html, /#map-primera-visita:not\(\[hidden\]\)\{margin-bottom:var\(--ipn-esp-4\)\}/);
  assert.match(html, /#v-tray \.map-plan\{margin-top:var\(--ipn-esp-4\)\}/);
  assert.match(html, /\.maptools>\.seg\{flex-shrink:0;max-width:100%\}/);
  // El panel conserva su API, independiente de los clics del mapa.
  const antes = JSON.stringify(tr);
  await T.abrir('B101', caja1);
  assert.equal(JSON.stringify(tr), antes);
  const panel = T.estado.panel;
  assert.equal(panel.hidden, false);
  assert.equal(panel.getAttribute('aria-label'), 'Temario de ' + indice.materias.B101.n);
  assert.equal(panel.parentNode, document.documentElement, 'el panel cuelga de <html>, fuera del zoom del <body>');
  assert.equal(panel.querySelector('.tmr-ficha-enc h2').textContent, indice.materias.B101.n);
  assert.equal(panel.querySelector('.pc-lector'), null, 'la ficha breve no monta el lector oficial');
  assert.equal(panel.querySelectorAll('.tmr-cifras strong').length, 3);
  assert.equal(panel.querySelector('.tmr-ficha-enc .tmr-descripcion').textContent, bionica.find(r => r.clave === 'B101').descripcion);
  assert.ok(!/Comprender, a través/.test(panel.textContent.split('Ver programa')[0]), 'la ficha no muestra el objetivo en bruto');
  assert.equal(c.SATE_DATA, undefined, 'abre desde la Guía sin cargar los datos del mapa');
  assert.ok(bionica.find(r => r.clave === 'B101').area?.color, 'el compilador proporciona el acento');
  const estilos = {};
  panel.style.setProperty = (k, v) => { estilos[k] = v; };
  await T.abrir('B101', caja1);
  assert.equal(estilos['--tmr-area'], bionica.find(r => r.clave === 'B101').area.color);
  assert.equal(panel.querySelector('.tmr-recurso').getAttribute('href'),'https://example.org/estudio');
  assert.match(panel.querySelector('.tmr-recurso').textContent,/Academia ficticia/);
  assert.equal(panel.querySelector('.tmr-recurso').getAttribute('rel'), 'noopener noreferrer');
  assert.equal(panel.querySelector('.tmr-oficial').getAttribute('href'), '#/upiita/guia/programas/bionica/B101/objetivo');
  const pdf = panel.querySelector('.tmr-pdf'), regB101 = bionica.find(r => r.clave === 'B101');
  assert.equal(pdf.textContent, 'Ver programa original (PDF)');
  assert.equal(pdf.getAttribute('href'), regB101.pdf);
  assert.match(pdf.getAttribute('href'), /^https:\/\/cloud\.upiita\.ipn\.mx\/public\.php\/dav\/files\/73kqMKWfwDNAd2r\/NIVEL_I\/BIOLOG%C3%8DA%20CELULAR\.pdf$/);
  assert.equal(pdf.getAttribute('target'), '_blank'); assert.equal(pdf.getAttribute('rel'), 'noopener noreferrer');
  assert.ok(panel.querySelector('.tmr-biblio li'), 'la ficha trae la bibliografía del programa');
  assert.ok(panel.querySelector('.tmr-catalogo').getAttribute('href').includes('dirbibliotecas.ipn.mx'));
  assert.match(panel.textContent, /pendiente de revisión por la academia/);
  assert.match(panel.querySelector('.tmr-rel-enlace').getAttribute('href'), /^#\/upiita\/guia\/programas\/bionica\/B\d+$/, 'antes y después enlazan a sus fichas');
  assert.equal(document.activeElement, panel);
  assert.equal(document.body.inert, true, 'el fondo queda inerte');
  assert.equal(estado.resize, 0, 'el modal no cambia el ancho del mapa');
  assert.equal(panel.getAttribute('aria-modal'), 'true');
  const cierre = panel.querySelector('.tmr-panel-x'), oficial = [...panel.querySelectorAll('button,a[href]')].at(-1);
  oficial.focus(); panel.dispatchEvent(new Evento('keydown',{key:'Tab'})); assert.equal(document.activeElement,cierre);
  cierre.focus(); panel.dispatchEvent(new Evento('keydown',{key:'Tab',shiftKey:true})); assert.equal(document.activeElement,oficial);
  // Otra llamada cambia el contenido sin abrir un segundo panel; una caja sin temario no abre nada
  const otra = el(document, 'div', {'class': 'box', 'data-box': 'B106', role: 'button'});
  document.querySelector('#map').appendChild(otra);
  await T.abrir('B106', otra);
  await dormir(20);
  assert.equal(panel.querySelector('.tmr-ficha-enc h2').textContent, indice.materias.B106.n);
  assert.equal(c.PoliCORE.lector.activos(), 0);
  await T.abrir('B102', sinTem);
  await dormir(10);
  assert.equal(panel.querySelector('.tmr-ficha-enc h2').textContent, indice.materias.B106.n, 'B102 no cambia el panel');
  assert.equal(JSON.stringify(tr), antes);
  // Esc cierra el panel y devuelve el foco
  caja1.focus();
  await T.abrir('B101', caja1);
  assert.equal(panel.querySelector('.tmr-ficha-enc h2').textContent, indice.materias.B101.n);
  assert.equal(JSON.stringify(tr), antes);
  document.dispatchEvent(new Evento('keydown', {key: 'Escape', target: document.body}));
  assert.equal(panel.hidden, true);
  assert.equal(document.activeElement, caja1, 'el foco vuelve a la materia');
  assert.equal(c.PoliCORE.lector.activos(), 0);
  assert.equal(document.body.inert, false);
  assert.equal(estado.resize, 0);
  // Teléfono: hoja con velo, modal y sin desplazamiento del fondo
  estado.lateral = false;
  await T.abrir('B101', caja1);
  assert.equal(panel.getAttribute('aria-modal'), 'true');
  assert.equal(T.estado.velo.hidden, false);
  assert.equal(document.documentElement.classList.contains('sate-sin-scroll'), true);
  T.estado.velo.dispatchEvent(new Evento('click', {target: T.estado.velo}));
  assert.equal(panel.hidden, true); assert.equal(T.estado.velo.hidden, true);
  assert.equal(document.documentElement.classList.contains('sate-sin-scroll'), false);
  estado.lateral = true;
  // Enlace desde la ficha de la materia (inspector)
  assert.match(T.enlaceHtml('B101'), /href="#\/upiita\/guia\/programas\/bionica\/B101"[^>]*>Ver programa</);
  assert.equal(T.enlaceHtml('B102'), '');
  assert.equal(T.enlaceHtml('XXX'), '');

  /* ----- Explorador independiente ----- */
  const caja2 = document.getElementById('sate-temarios');
  const m = modulos.temarios; assert.ok(m, 'registra la vista temarios');
  await m.mostrar({partes: []});
  assert.equal(caja2.querySelector('.tmr').getAttribute('data-vista'), 'lista');
  assert.equal(caja2.querySelector('h2').textContent, 'Programas de estudio de unidades de aprendizaje');
  assert.equal(caja2.querySelector('.tmr-elegir').textContent, 'Elige una unidad de aprendizaje de la lista para leer su temario.');
  const items = () => caja2.querySelectorAll('.tmr-item');
  assert.equal(items().length, 72, 'la carrera del mapa (Biónica) viene seleccionada');
  assert.equal(caja2.querySelector('.tmr-resumen').textContent, '72 unidades de aprendizaje');
  igual(caja2.querySelectorAll('.tmr-grupo h3').map(h => h.textContent), ['Nivel 1', 'Nivel 2', 'Nivel 3', 'Nivel 4', 'Nivel 5']);
  assert.equal(items()[0].getAttribute('href').startsWith('#/upiita/guia/programas/bionica/B'), true);
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
  assert.equal(estado.copiados.at(-1), 'https://sitio.test/sate/index.html#/upiita/guia/programas/bionica/B103/objetivo');
  caja2.querySelector('.pc-indice-a[data-id=bibliografia]').dispatchEvent(new Evento('click'));
  assert.equal(estado.urls.at(-1), '/sate/index.html#/upiita/guia/programas/bionica/B103/bibliografia', 'la sección abierta actualiza la dirección sin recargar');
  assert.equal(caja2.querySelector('.tmr-volver').getAttribute('href'), '#/upiita/guia/programas/bionica/B103', 'desde el programa completo se vuelve a la ficha');
  // Ficha en el panel grande (no es modal): mismo componente, datos grandes, recursos, bibliografía y PDF
  const modalAntes = T.estado.panel.hidden;
  await m.mostrar({partes: ['bionica', 'B103']});
  assert.equal(caja2.querySelector('.tmr').getAttribute('data-vista'), 'lector');
  const fichaPanel = caja2.querySelector('.tmr-lector .tmr-ficha');
  assert.ok(fichaPanel, 'la ficha va en el panel de la derecha');
  assert.equal(T.estado.panel.hidden, modalAntes, 'no se abre el modal');
  assert.equal(fichaPanel.querySelector('h2').textContent, indice.materias.B103.n);
  assert.equal(fichaPanel.querySelectorAll('.tmr-cifras strong').length, 3);
  assert.equal(fichaPanel.querySelector('.tmr-descripcion').textContent, bionica.find(r => r.clave === 'B103').descripcion);
  assert.equal(fichaPanel.querySelectorAll('.tmr-pasos li').length, bionica.find(r => r.clave === 'B103').contenidos.length);
  assert.equal(fichaPanel.querySelector('.tmr-pdf').getAttribute('href'), bionica.find(r => r.clave === 'B103').pdf);
  assert.equal(fichaPanel.querySelector('.tmr-oficial').getAttribute('href'), '#/upiita/guia/programas/bionica/B103/objetivo');
  assert.equal(caja2.querySelector('.tmr-item[aria-current=page]').dataset.clave, 'B103');
  assert.equal(caja2.querySelector('.tmr-volver').getAttribute('href'), '#/upiita/guia/programas');
  assert.equal(c.PoliCORE.lector.activos(), 0, 'la ficha breve no monta el lector oficial');
  // Las tres carreras tienen recurso compartido
  assert.ok(Object.values(indice.carreras).length === 3 && registros('mecatronica').every(r => r.pdf) && registros('telematica').every(r => r.pdf) && bionica.every(r => r.pdf), 'las tres carreras tienen enlace al PDF');
  await m.mostrar({partes: ['bionica', 'B999']});
  assert.equal(caja2.querySelector('.tmr-lector').textContent, 'No encontramos ese temario. Puede que la clave haya cambiado.');
  await m.mostrar({partes: ['telematica', 'B103']});
  assert.match(caja2.querySelector('.tmr-lector').textContent, /No encontramos ese temario/);
  await m.mostrar({partes: []});
  assert.equal(caja2.querySelector('.tmr').getAttribute('data-vista'), 'lista');
  assert.equal(c.PoliCORE.lector.activos(), 0);
  // Enlaces de lista abren la misma ficha y no montan el texto oficial.
  const primero = items()[0], clic = new Evento('click',{target:primero}); primero.dispatchEvent(clic);
  assert.equal(clic.defaultPrevented, false, 'el enlace de la lista navega; la ficha se muestra en el panel grande');
  assert.match(primero.getAttribute('href'), /^#\/upiita\/guia\/programas\/[a-z]+\/[BMT]\d+$/);
  // Sin datos en la unidad: mensaje, sin errores
  const sin = contexto();
  const sinModulos = {};
  Object.assign(sin.c, {SATE: {texto, pestana: (id, m2) => { sinModulos[id] = m2; }, error: e => { throw e; }}, SATE_CONFIG: {unidades: {},guia:config.guia}, SATE_UNIDAD: 'otra'});
  vm.runInContext(leer('web/policore/lector.js'), sin.c); vm.runInContext(leer('web/sate/temarios.js'), sin.c);
  const cajaSin = sin.document.body.appendChild(el(sin.document, 'section', {id: 'sate-temarios'}));
  await sinModulos.temarios.mostrar({partes: []});
  assert.equal(cajaSin.textContent, 'Aún no hay programas de estudio de esta unidad');
  const portadaSin = sin.document.body.appendChild(el(sin.document,'section',{id:'sate-guia'}));
  await sinModulos.guia.mostrar();
  assert.equal(portadaSin.querySelectorAll('.gd-camino').length,0);
  assert.equal(portadaSin.querySelectorAll('.gd-pronto li').length,3);
  assert.match(portadaSin.textContent,/Aún no hay programas de estudio de esta unidad/);
  assert.equal(sin.estado.fetches.length,0,'la Guía sin programas no solicita datos inexistentes');
}

/* Catálogo real del piloto: carga y tarjetas en la ficha sin montar el mapa. */
{
  const {c, document} = contexto();
  Object.assign(c, {
    SATE_CONFIG: config, SATE_UNIDAD: 'upiita',
    SATE: {texto, pestana() {}, cargarTemarios: async () => {}}
  });
  vm.runInContext(leer('web/policore/lector.js'), c);
  vm.runInContext(leer('web/sate/temarios.js'), c);
  await c.SATE.temarios.preparar();
  await c.SATE.temarios.abrir('B103');
  const tarjetas = document.querySelectorAll('.tmr-recurso');
  assert.equal(tarjetas.length, 3);
  assert.ok(tarjetas.some(a => a.getAttribute('href').endsWith('_(Kuttler)')));
  for (const a of tarjetas) {
    assert.equal(a.getAttribute('target'), '_blank');
    assert.equal(a.getAttribute('rel'), 'noopener noreferrer');
    assert.ok(a.querySelector('small').textContent);
  }
  assert.equal(c.SATE_DATA, undefined);
}

/* Hoja Más: navegación, cierre por Esc (cancel nativo) y foco de regreso. */
{
  const {c,document,Evento} = contexto();
  c.addEventListener = () => {};
  document.contains = n => document.documentElement.contains(n);
  const crear = document.createElement.bind(document);
  document.createElement = tag => { const n=crear(tag); if(tag==='dialog') {n.showModal=()=>{n.open=true};n.close=()=>{n.open=false};} return n; };
  vm.runInContext(leer('web/sate/componentes.js'),c);
  c.SateUI.usarTextos(texto);
  let elegida;
  const items = config.unidades.upiita.pestanas.map(id=>({id,texto:texto('sate.pestana.'+id+'.corto'),titulo:texto('sate.pestana.'+id+'.titulo')}));
  const nav = c.SateUI.barraInferior({items,activa:'mapa',alElegir:id=>elegida=id});document.body.appendChild(nav);
  const mas = nav.querySelector('[data-id=mas]');mas.click();
  const dlg = document.querySelector('dialog');
  assert.equal(dlg.open,true);assert.equal(mas.getAttribute('aria-expanded'),'true');
  assert.equal(dlg.querySelectorAll('.sate-mas-lista button').length,2);
  assert.match(dlg.textContent,/Guía politécnica/);
  dlg.dispatchEvent(new Evento('cancel'));
  assert.equal(dlg.open,false);assert.equal(document.activeElement,mas);
  mas.click();dlg.querySelector('[data-id=guia]').click();
  assert.equal(elegida,'guia');assert.equal(dlg.open,false);assert.equal(mas.getAttribute('aria-current'),'page');
  mas.click();
  assert.equal(dlg.querySelector('[data-id=guia]').getAttribute('aria-current'), 'page');
  assert.equal(dlg.querySelector('[data-id=calendario]').getAttribute('aria-current'), null);
  dlg.dispatchEvent(new Evento('cancel'));
}

/* ---------- 4. Rutas, datos y compilación ---------- */
{
  const c = vm.createContext({});
  vm.runInContext(leer('web/sate/rutas.js'), c);
  const R = c.SateRutas, cfg = config.unidades;
  const r = R.ruta('#/upiita/guia/programas/bionica/B103/objetivo', 'upiita', cfg);
  assert.equal(r.pestana, 'temarios'); assert.equal(r.vista, true); assert.equal(r.padre, 'guia');
  igual(r.partes, ['bionica', 'B103', 'objetivo']);
  assert.equal(r.hash, '#/upiita/guia/programas/bionica/B103/objetivo');
  igual(R.ruta('#/upiita/guia/programas', 'upiita', cfg).partes, []);
  assert.equal(R.ruta('#/upiita/temarios/bionica/B103/contenidos', 'upiita', cfg).hash, '#/upiita/guia/programas/bionica/B103/contenidos');
  assert.equal(R.ruta('#/upiita/guia/programas/a/b/c/d/e', 'upiita', cfg), null, 'demasiadas partes');
  assert.equal(R.ruta('#/upiita/guia/programas/a b', 'upiita', cfg), null);
  assert.equal(R.ruta('#/upiita/guia/programas/..%2f', 'upiita', cfg), null);
  assert.equal(R.ruta('#/upiita/mapa/algo', 'upiita', cfg), null, 'las pestañas normales no aceptan partes');
  for (const u of Object.keys(cfg).filter(u => u !== 'upiita')) {
    assert.equal(R.ruta('#/' + u + '/guia', u, cfg).pestana, 'guia');
    assert.equal(R.ruta('#/' + u + '/temarios', u, cfg).hash, '#/' + u + '/guia/programas');
    igual(cfg[u].vistas, [], u);
    assert.equal(existsSync('web/dist/sate/datos/' + u + '/temarios'), false, u + ': no se copian temarios');
  }
  igual(cfg.upiita.vistas, [{id: 'temarios', padre: 'guia'}]);
  assert.equal(R.redireccion('upiita', '', '#/temarios/bionica'), 'sate/index.html#/upiita/guia/programas/bionica');
  // Datos compilados
  assert.equal(Object.keys(indice.materias).length, 240);
  for (const [id, car] of Object.entries(indice.carreras)) assert.equal(registros(id).length, car.total);
  assert.ok(Object.keys(indice.materias).every(k => k === k.toUpperCase()), 'claves en mayúsculas (B307)');
  const crudo = readFileSync(dist + 'bionica.json', 'utf8');
  assert.doesNotMatch(crudo, /"fuente":"(?:bionica|mecatronica|telematica)\//, 'la ruta local del PDF no viaja en el sitio');
  for (const id of Object.keys(indice.carreras)) for (const r of registros(id)) {
    assert.match(r.pdf, /^https:\/\/cloud\.upiita\.ipn\.mx\/public\.php\/dav\/files\/[A-Za-z0-9]{15}\/[^?&#\s]+\.pdf$/i, r.clave + ': enlace al PDF original');
  }
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
console.log('OK temarios: adaptador, lector de PoliCORE reutilizable, mapa dedicado a planear, panel/hoja, explorador, enlaces profundos y unidades sin temarios.');
