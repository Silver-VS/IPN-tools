// Lector de reglamentos (opción B): estructura, anclas, relaciones y fuente. Sin navegador.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer = f => readFileSync(f, 'utf8');
const c = vm.createContext({});
vm.runInContext(leer('web/sate/guia.js'), c);
const G = c.SateGuia;
const reg = id => JSON.parse(leer('data/reglamentos/' + id + '.json'));

// anclas
assert.equal(G.anclaArticulo('4', 'III', 'b'), 'art-4.III.b');
assert.deepEqual({...G.leerAncla('art-1 Bis.II')}, {n: '1 Bis', fr: 'II', inciso: null});
assert.deepEqual({...G.leerAncla('art-33.III.b')}, {n: '33', fr: 'III', inciso: 'b'});
assert.equal(G.leerAncla('transitorios'), null);

// todos los reglamentos: cada fracción se encuentra en el texto y ningún artículo se pierde
for (const f of readdirSync('data/reglamentos').filter(n => n.endsWith('.json') && n !== 'indice.json')) {
  const r = reg(f.replace('.json', '')), arbol = G.arbolReglamento(r);
  const compilado = 'web/dist/sate/datos/reglamentos/' + f;
  if (existsSync(compilado)) {
    const datos = JSON.parse(leer(compilado));
    assert.deepEqual(datos.estructura, r.estructura, f + ': clasificación y estructura llegan al compilado');
    assert.deepEqual(Array.from(G.mapaReglamento(datos), n => n.aplicacion), Array.from(G.mapaReglamento(r), n => n.aplicacion));
  }
  const cuenta = n => n.articulos.length + n.hijos.reduce((s, h) => s + cuenta(h), 0);
  assert.equal(cuenta(arbol), r.articulos.length, f + ': árbol completo');
  // Una regeneración o un compilado antiguo puede perder las anotaciones editoriales.
  const sinClasificacion = {...r, estructura:r.estructura.map(({aplicacion, ...n}) => n)};
  for (const datos of [r, sinClasificacion]) {
    const mapa = G.mapaReglamento(datos);
    if (datos.estructura.some(n => /\b(alumnos|alumnado|estudiantes)\b/.test(G.norm(n.titulo))))
      assert.ok(mapa.some(n => n.aplicacion === 'directo'), f + ': título del alumnado sin artículos directos');
  }
  for (const a of r.articulos) {
    const p = G.partesArticulo(a);
    if (a.fracciones?.length) assert.equal(p.fracciones.length, a.fracciones.length, f + ' art. ' + a.n + ': fracciones');
  }
}
// definiciones: regla conservadora
const rge3 = reg('rge').articulos.find(a => a.n === '3'), p3 = G.partesArticulo(rge3);
assert.equal(p3.definiciones.length, 37);
assert.equal(p3.definiciones[0].termino, 'Academia');
assert.equal(G.dividirDefiniciones('Texto normal sin lista. Otra oración: con dos puntos.'), null);
assert.equal(G.partesArticulo(reg('cambio_carrera').articulos.find(a => a.n === '5')).definiciones, null, 'OCR con viñetas no se parte');
// incisos
const h33 = G.partesArticulo(reg('honor').articulos.find(a => a.n === '33'));
assert.deepEqual(Array.from(h33.fracciones.find(f => f.fr === 'III').incisos, x => x.inciso), ['a', 'b', 'c']);
assert.ok(!h33.fracciones.find(f => f.fr === 'III').texto.includes(' a) '));
// fracciones con «I.-» (Ley Orgánica)
assert.ok(G.partesArticulo(reg('lo').articulos.find(a => a.n === '3')).fracciones.length >= 9);
// búsqueda
const ri = reg('ri');
assert.equal(G.buscarArticulos(ri, '12')[0].n, '12');
assert.ok(G.buscarArticulos(ri, 'dictamen').length > 0);
assert.equal(G.buscarArticulos(ri, ''). length, 0);
// relaciones reales
const d = {preguntas: [{id: 'a', apartado: 'situacion', pregunta: 'A', respuesta: 'Ver [[a:rge:52|art. 52]]', pasos: [], ventanilla: 'dictamen', fuentes: [{doc: 'rge', arts: ['60']}]}]};
let rel = G.relacionesArticulo(d, 'rge', '52', ['dictamen']);
assert.equal(rel.preguntas.length, 1); assert.deepEqual(Array.from(rel.tramites), ['dictamen']);
assert.equal(G.relacionesArticulo(d, 'rge', '60', []).tramites.length, 0, 'trámite que la unidad no tiene');
assert.equal(G.relacionesArticulo(d, 'rge', '1', ['dictamen']).preguntas.length, 0);

// fuente: Noto Sans, no la serif de PoliCORE
const css = leer('web/sate/guia.css');
assert.match(css, /\.rgl \.pc-lector\.pc-oficial[^{]*\{font-family:var\(--ipn-fuente-texto\)\}/);
assert.ok(!/\.rgl[^{]*\{[^}]*(serif|Noto Serif)/.test(css), 'sin serif en el lector de reglamentos');
assert.match(leer('web/sate/componentes.css'), /\.sate-modal__cuerpo\{[^}]*min-height:0;[^}]*overflow:auto/,'el cuerpo del modal puede encogerse y desplazarse');
assert.match(leer('web/sate/componentes.css'), /\.sate-modal\{[^}]*width:min\(36rem,calc\(100vw - var\(--ipn-esp-5\)\)\);max-height:calc\(100dvh - var\(--ipn-esp-6\)\)/,'el modal cabe en el ancho y alto del viewport');
assert.match(css, /\.rgl-fracciones[^\{]*\{[^}]*list-style:none/,'la fracción conserva solo su numeración literal');
assert.match(leer('web/sate/guia.js'), /fila\('rgl-fr', f\.fr \+ '\.'/,'cada fracción muestra su número romano literal una sola vez');
const mapa = G.mapaReglamento(ri);
assert.equal(mapa.length, 12);
assert.equal(mapa.reduce((s, n) => s + n.articulos.length, 0), 295, 'mapa proporcional al articulado completo');
assert.equal(mapa.filter(n => n.aplicacion === 'directo').reduce((s, n) => s + n.articulos.length, 0), 45);
assert.equal(mapa[1].aplicacion, 'parcial');
assert.equal(mapa[5].aplicacion, 'parcial');
assert.equal(mapa[2].etiqueta, 'De los alumnos');
for (const titulo of ['TÍTULO TERCERO DE LOS ALUMNOS', 'Título Tercero De los alumnos', 'TITULO III DE LOS ALUMNOS']) {
  assert.equal(G.mapaReglamento({estructura:[{titulo}], articulos:[{n:'1',ubicacion:[titulo]}]})[0].aplicacion, 'directo');
}
const mapaRge = G.mapaReglamento(reg('rge'));
assert.equal(mapaRge[5].aplicacion, 'directo', 'trayectoria escolar del RGE');
assert.equal(mapaRge[8].aplicacion, 'directo', 'reconsideración del RGE');
for (const n of mapa) assert.ok(['directo','parcial','organizacion'].includes(n.aplicacion));
assert.equal(G.mapaReglamento({estructura:[{titulo:'TÍTULO DE PRUEBA',aplicacion:'directo'}],articulos:[
  {n:'1',ubicacion:['TÍTULO DE PRUEBA']},{n:'1 Bis',ubicacion:['TÍTULO DE PRUEBA']}
]})[0].articulos.length, 2, 'el mapa no supone números consecutivos');
console.log('OK reglamentos: árbol, fracciones, incisos, definiciones, anclas, búsqueda, relaciones y fuente');

// Integración del explorador y del lienzo en el DOM del repositorio, sin abrir un navegador.
const {document, Elemento, Evento} = crearEntorno();
Elemento.prototype.append = function (...nodos) { for (const n of nodos) if (n) this.appendChild(n); };
document.createElementNS = (_, tag) => document.createElement(tag);
const config = JSON.parse(leer('data/sate.json'));
config.unidades.ficticia = {guiaDatos:true, siglas:'Unidad ficticia', tramites:['dictamen']};
const guia = JSON.parse(leer('data/guia/comun.json'));
const eventos = new Map(), cuadros = [];
let pestana, movil = false;
const avisos = [];
const contexto = vm.createContext({document, setTimeout, clearTimeout,
  console:{...console,warn:(...p)=>avisos.push(p)},
  addEventListener:(tipo, fn)=>eventos.set(tipo,fn), removeEventListener:tipo=>eventos.delete(tipo),
  requestAnimationFrame:fn=>{cuadros.push(fn);return cuadros.length;}, cancelAnimationFrame(){},
  matchMedia:()=>({matches:movil}), scrollTo(){},
  location:{href:'https://example.org/',hash:'#/ficticia/guia/reglamentos'}, history:{pushState(){},replaceState(){}},
  SATE_UNIDAD:'ficticia', SATE_CONFIG:config,
  SATE:{texto:(k,v={})=>k==='sate.guia.rgl_sugerencia_baja' ? 'baja temporal' : k + ' ' + Object.values(v).join(' · '), pestana:(_,p)=>pestana=p,error:e=>{throw e;}},
  fetch:async url=>({ok:true,json:async()=>url.includes('/reglamentos/') ? reg(url.split('/').pop().replace('.json','')) : guia})
});
vm.runInContext(leer('web/sate/componentes.js'), contexto);
vm.runInContext(leer('web/sate/guia.js'), contexto);
const caja = document.createElement('div'); caja.setAttribute('id','sate-guia'); document.body.appendChild(caja);
await pestana.mostrar({partes:['reglamentos']});
assert.equal(avisos.length,0, JSON.stringify(avisos));
assert.equal(caja.querySelectorAll('.rgl-libro').length,reg('indice').length);
const cgc = Array.from(caja.querySelectorAll('.rgl-libro')).find(n => n.getAttribute('href') === reg('cgc').url);
assert.ok(cgc, 'CGC enlaza al PDF oficial porque no tiene articulado fiable');
assert.ok(cgc.textContent.includes('sate.guia.rgl_solo_pdf'), 'sin conteo engañoso de cero artículos');
assert.ok(Array.from(caja.querySelectorAll('.rgl-libro')).find(n => n.getAttribute('href') === '#/ficticia/guia/reglamentos/etica').textContent.includes('sate.guia.rgl_texto_completo'), 'se conserva el lector del código sin articulado');
assert.equal(caja.querySelectorAll('.rgl-temas__opciones button').length,6);
assert.ok(caja.querySelectorAll('.rgl-temas__articulos a').length>0,'temas con citas reales');
caja.querySelector('.rgl-sugerencias button').click();
assert.equal(caja.querySelector('.guia-resultados').hidden,false);
assert.ok(caja.querySelectorAll('.guia-resultados a').length>0,'sugerencias buscan artículos');
await pestana.mostrar({partes:['reglamentos','ri']});
assert.equal(avisos.length,0, JSON.stringify(avisos));
assert.equal(caja.querySelectorAll('.rgl-articulo').length,ri.articulos.length+1,'todos los artículos y transitorios en el lienzo');
assert.equal(caja.querySelectorAll('.rgl-mapa__tramo').length,12);
assert.equal(caja.querySelectorAll('.rgl-mapa__etiqueta')[2].textContent, 'De los alumnos');
assert.equal(caja.querySelectorAll('.rgl-mapa__titulos').length,0,'cada etiqueta pertenece a su segmento');
assert.notEqual(caja.querySelector('.rgl-riel').hidden,true,'el riel no se oculta: la rejilla no salta al desplazarse');
assert.ok(caja.querySelector('.rgl-riel-vacio'),'aviso discreto cuando el artículo no tiene citas');
const rutas = new Set(ri.articulos.flatMap(a=>a.ubicacion.map((_,i)=>a.ubicacion.slice(0,i+1).join(' / '))));
assert.equal(caja.querySelectorAll('.rgl-encabezado').length,rutas.size,'encabezados de todos los títulos, capítulos y secciones');
const tramo = caja.querySelectorAll('.rgl-mapa__tramo')[2];
tramo.click();
assert.equal(caja.querySelector('.rgl-art[aria-current]').getAttribute('data-ancla'),'art-77');
assert.equal(document.scrolled.getAttribute('data-articulo'),'77','mapa salta al inicio del título');
const articulosDOM = caja.querySelectorAll('.rgl-articulo');
for (const nodo of articulosDOM) nodo.getBoundingClientRect=()=>({top:1000});
articulosDOM[0].getBoundingClientRect=()=>({top:-300});
articulosDOM[1].getBoundingClientRect=()=>({top:0});
eventos.get('scroll')(); cuadros.shift()();
assert.equal(caja.querySelector('.rgl-art[aria-current]').getAttribute('data-ancla'),'art-2','scroll-spy actualiza el índice');
assert.match(document.title,/^Art\. 2 · RI/,'título actualizado al desplazarse');
assert.match(caja.querySelector('.rgl-contexto__actual').textContent,/2/);
assert.equal(caja.querySelectorAll('.rgl-articulo').length,296,'navegar no reemplaza el articulado');
movil=true;
await pestana.mostrar({partes:['reglamentos','ri','art-106.III']});
assert.equal(caja.querySelector('.rgl-indice').open,false,'índice plegado en teléfono');
assert.equal(caja.querySelectorAll('.rgl-activa').length,1,'ancla a una fracción');
assert.equal(caja.querySelector('.rgl-activa').getAttribute('data-ancla'),'art-106.III');
movil=false;
await pestana.mostrar({partes:['reglamentos','rge','art-55']});
assert.match(document.title,/^Art\. 55 · RGE/,'título concreto por ruta');
assert.ok(caja.querySelector('.rgl-contexto').textContent.includes('Reglamento General de Estudios'));
assert.equal(caja.querySelector('.rgl-riel').hidden,false,'panel con preguntas reales para baja temporal');
assert.ok(caja.querySelectorAll('.rgl-riel a').length>0);
assert.ok(!caja.querySelector('.rgl').classList.contains('rgl--sin-riel'));
await pestana.mostrar({partes:['reglamentos','rge','art-1']});
assert.notEqual(caja.querySelector('.rgl-riel').hidden,true,'la rejilla se conserva al cambiar a un artículo sin citas (sin saltos)');
assert.ok(!caja.querySelector('.rgl').classList.contains('rgl--sin-riel'),'sin cambio de columnas');
for (const lector of caja.querySelectorAll('.rgl-cuerpo')) {
  assert.equal(lector.getAttribute('data-oficial'), 'rge');
  for (const n of lector.querySelectorAll('*')) assert.equal(n.getAttribute('data-oficial'), 'rge', 'R14: cada elemento documental conserva el origen');
}
assert.equal(caja.querySelector('.rgl-riel').getAttribute('data-oficial'), null, 'orientación fuera del texto literal');
contexto.location.hash='#/ficticia/guia/reglamentos/honor/art-21.I?frpos=14';
await pestana.mostrar({partes:['reglamentos','honor','art-21.I']});
assert.equal(document.scrolled.getAttribute('data-fraccion-pos'),'14','numeración repetida conserva el destino exacto');
assert.equal(document.scrolled.querySelector('p').textContent,reg('honor').articulos.find(a=>a.n==='21').fracciones[13].texto);
pestana.ocultar();
assert.equal(eventos.has('scroll'),false,'se retira el seguimiento al salir');
assert.equal(eventos.has('resize'),false,'se retira el ajuste al salir');
assert.equal(avisos.length,0, JSON.stringify(avisos));
console.log('OK explorador y lienzo: biblioteca, temas, sugerencias, 295 artículos, transitorios, mapa, saltos, scroll-spy y teléfono.');
