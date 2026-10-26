// GUIA7: DOM en memoria, sin navegador ni red; fixtures ficticios.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync, readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {crearEntorno} from './dom_minimo.mjs';
const leer = p => readFileSync(p, 'utf8');
const fixture = n => JSON.parse(leer('tests/fixtures/guia/' + n + '.json'));
const fusion = JSON.parse(execFileSync('python', ['tests/test_guia7.py', '--fusion'], {encoding:'utf8'}));
assert.equal(fusion.preguntas.length, 1);
assert.equal(fusion.preguntas[0].respuesta, 'Respuesta local');
assert.deepEqual(Object.keys(fusion.documentos), ['demo', 'manual']);
execFileSync('python', ['tests/test_guia7.py'], {stdio:'pipe'});
const {document, Evento, Elemento} = crearEntorno();
Elemento.prototype.append = function (...nodos) { for (const n of nodos) if (n) this.appendChild(n); };
Elemento.prototype.prepend = function (n) { this.insertBefore(n, this.firstChild); };
document.createElementNS = (_, tag) => document.createElement(tag);
const datos = fixture('comun'), reg = fixture('demo'), solicitudes = [], scripts = [], desplazamientos = [];
datos.actividades = {categorias:['idiomas','deporte'],elementos:[
  {categoria:'idiomas',nombre:'Centro de Lenguas oficial',ofrece:'Clases',donde:'En línea',requisitos:'Requisito extenso',inscripcion:'Registro',url:'https://example.org/idiomas',consulta:'2026-01-01'},
  {categoria:'deporte',nombre:'Coordinación Deportiva',ofrece:'Torneos',donde:'Unidad deportiva',url:'https://example.org/deporte',consulta:'2026-01-01'}
]};
datos.acudir = datos.acudir.map(a => ({...a, ambito:'ipn'})); // Contrato de la compilación.
datos.acudir[0].para = 'Consulta [[a:demo:1|art. 1]]. Conserva [[g:credito|crédito]] y el texto normativo.';
const config = JSON.parse(leer('data/sate.json'));
config.unidades.ficticia = {guiaDatos:true, actividadesDatos:true, siglas:'Unidad ficticia', pestanas:['guia']};
let pestana, movil = false;
const c = vm.createContext({document, console, setTimeout, clearTimeout,
  addEventListener(){}, removeEventListener(){}, requestAnimationFrame:fn=>setTimeout(fn,0), cancelAnimationFrame:clearTimeout,
  matchMedia: () => ({matches:movil}), innerWidth:1200, innerHeight:900,
  scrollTo:(...p) => desplazamientos.push(p),
  location:{hash:'#/ficticia/guia', pathname:'/', search:'', href:'https://example.org/'},
  history:{replaceState(){}}, SATE_UNIDAD:'ficticia', SATE_CONFIG:config,
  SATE:{texto:(k,v={}) => k + ' ' + Object.values(v).join(' · '), pestana:(_, p) => pestana=p, error:e=>{throw e;}},
  fetch:async url => { solicitudes.push(url); return {ok:true, json:async()=>url.includes('/reglamentos/') ? url.endsWith('indice.json') ? [{id:'demo',articulos:1}] : url.endsWith('sin.json') ? {sin_texto:true,...reg,articulos:[]} : reg : datos}; }
});
vm.runInContext(leer('web/sate/componentes.js'), c);
c.SATE.script = async src => { scripts.push(src); vm.runInContext(leer('web/policore/lector.js'), c); };
vm.runInContext(leer('web/sate/rutas.js'), c);
vm.runInContext(leer('web/sate/guia.js'), c);
const caja = document.createElement('div'); caja.setAttribute('id','sate-guia'); document.body.appendChild(caja);
await pestana.mostrar({partes:['situacion','consulta']});
// La respuesta enlazada se abre dentro de la lista en teléfono.
assert.ok(caja.querySelector('.guia-detalle'));
datos.preguntas[0].ventanilla = 'dictamen';
async function comprobarVentanilla(tramites, visible) {
  config.unidades.ficticia.tramites = tramites;
  await pestana.mostrar({partes:['situacion','consulta']});
  assert.equal(!!caja.querySelector('a[href="#/ficticia/tramites/dictamen"]'), visible);
}
await comprobarVentanilla([], false);
await comprobarVentanilla(['dictamen'], true);
await comprobarVentanilla([], false);
assert.ok(caja.textContent.includes('<img src=x>'));
assert.equal(caja.querySelector('img'), null);
assert.ok(caja.querySelectorAll('.sate-enlace-reglamento').length >= 3);
assert.equal(solicitudes.filter(s=>s.includes('reglamentos')).length, 0, 'carga bajo demanda');
assert.deepEqual(scripts, [], 'lector bajo demanda');
await c.SATE.articulo('demo','1');
assert.ok(document.querySelector('.sate-modal__titulo').textContent.includes('1 · Reglamento ficticio'));
assert.equal(document.querySelector('.guia-articulo .pc-lector').textContent.replace(/\s+/g,' ').trim(), reg.articulos[0].texto.replace(/\s+/g,' ').trim());
assert.equal(document.querySelector('.guia-articulo').querySelectorAll('a')[0].getAttribute('href'), '#/ficticia/guia/reglamentos/demo/art-1');
await c.SATE.articulo('demo','999');
assert.ok(document.querySelectorAll('.guia-articulo').at(-1).textContent.includes('sate.guia.sin_articulo'));
await c.SATE.articulo('sin','1');
assert.ok(document.querySelectorAll('.guia-articulo').at(-1).querySelector('a[target="_blank"]'));
assert.equal(solicitudes.filter(s=>s.endsWith('/demo.json')).length, 1, 'caché en memoria');
c.SateUI.cerrarModal();
const termino = caja.querySelector('.sate-termino'); termino.click();
assert.ok(!document.getElementById(termino.getAttribute('aria-describedby')).hidden);
assert.equal(document.getElementById(termino.getAttribute('aria-describedby')).textContent, 'Unidad ficticia <segura>.');
document.dispatchEvent(new Evento('keydown',{key:'Escape'}));
assert.ok(caja.querySelector('.sate-globo').hidden);
movil = true; termino.click();
assert.ok(document.querySelectorAll('.sate-modal').at(-1).classList.contains('sate-modal--pequeno'));
movil = false; c.SateUI.cerrarModal();
const ruta = c.SateRutas.ruta('#/ficticia/guia/reglamentos/demo/art-1','ficticia',config.unidades);
assert.deepEqual(Array.from(ruta.partes), ['reglamentos','demo','art-1']);
assert.equal(c.SateRutas.ruta('#/ficticia/guia/reglamentos/demo/art-1%20Bis','ficticia',config.unidades).partes[2], 'art-1 Bis');
assert.equal(c.SateRutas.ruta('#/ficticia/guia/reglamentos/demo/art-%ZZ','ficticia',config.unidades), null);
desplazamientos.length = 0;
await pestana.mostrar(ruta);
assert.deepEqual(scripts, [], 'el lector de reglamentos ya no carga PoliCORE');
assert.ok(caja.querySelector('.rgl'), 'tres paneles');
assert.equal(caja.querySelector('.rgl-art[aria-current]').getAttribute('data-ancla'), 'art-1');
assert.ok(caja.textContent.includes('Texto literal <seguro>'));
assert.ok(caja.querySelector('.rgl-art--ancho'), 'transitorios en el índice');
await pestana.mostrar({partes:['acudir']});
assert.ok(caja.textContent.includes('sate.guia.acudir_ipn'));
assert.ok(caja.textContent.includes('sate.guia.fuente_pagina'));
const instancia = caja.querySelector('.guia-ficha');
assert.ok(instancia.textContent.includes('Consulta art. 1. Conserva crédito y el texto normativo.'));
assert.ok(instancia.querySelector('a[href="https://example.org/demo.pdf"]'));
assert.ok(instancia.querySelector('.sate-enlace-reglamento'));
assert.ok(instancia.querySelector('.sate-termino'));
await pestana.mostrar({partes:['reglamentos']});
assert.ok(caja.querySelector('a[href="#/ficticia/guia/reglamentos/demo"]'));
assert.ok(caja.textContent.includes('sate.guia.numero_articulos 1'));
await pestana.mostrar({partes:['glosario']});
assert.ok(caja.textContent.includes('Crédito'));
const buscar = caja.querySelector('input'); buscar.value='no-existe'; buscar.dispatchEvent(new Evento('input'));
assert.equal(caja.querySelector('dl').textContent, '');
const actividadCfg = config.guia.find(a => a.datos === 'actividades');
assert.equal(actividadCfg.titulo, 'sate.guia.actividades');
await pestana.mostrar({partes:['actividades']});
assert.equal(caja.querySelectorAll('.guia-actividad-categoria').length, 2, 'entrada muestra categorías');
assert.equal(caja.querySelectorAll('.guia-actividad-detalle[open]').length, 0, 'ningún detalle inicia desplegado');
assert.equal(caja.querySelectorAll('.guia-actividad').length, 0, 'entrada no muestra opciones individuales');
await pestana.mostrar({partes:['actividades','deporte']});
assert.equal(caja.querySelectorAll('.guia-actividad').length, 1, 'la ruta profunda abre esa categoría');
assert.ok(caja.textContent.includes('Coordinación Deportiva'));
const buscarActividades = caja.querySelector('input'); buscarActividades.value='Centro de Lenguas'; buscarActividades.dispatchEvent(new Evento('input'));
assert.ok(caja.textContent.includes('Centro de Lenguas oficial'), 'el filtro busca en otra categoría');
assert.equal(caja.querySelectorAll('.guia-actividad').length, 1);
for (const n of readdirSync('data/reglamentos').filter(n=>n.endsWith('.json'))) {
  assert.equal(leer('web/dist/sate/datos/reglamentos/'+n), leer('data/reglamentos/'+n), n+': copia publicada');
}
console.log('OK GUIA7: fusión, capacidades, marcas seguras, artículo, caché, glosario, lector y copia a dist');
