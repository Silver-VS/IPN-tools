// Integración DOM local: portada, filtros y enlaces; sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer = p => readFileSync(p, 'utf8');
const datos = JSON.parse(leer('web/dist/sate/datos/upiita/guia.json'));
const config = JSON.parse(leer('data/sate.json'));
config.unidades.upiita.guiaDatos = true; // Capacidad que agrega la compilación.
const css = leer('web/sate/componentes.css');
assert.match(css,/\.sate-rejilla-recursos\{[^}]*repeat\(3,minmax\(0,1fr\)\)/,'rejilla de 3 columnas en escritorio');assert.match(css,/\.sate-rejilla-recursos>:last-child:nth-child\(3n\+2\)\{grid-column:span 2\}/,'la última tarjeta ocupa lo que sobra de su fila (sin celdas vacías)');
assert.match(css, /\.sate-recurso\{[^}]*min-width:0[^}]*overflow-wrap:anywhere/);
assert.match(css, /\.sate-filtro-recursos \.sate-chip\{[^}]*min-height:var\(--ipn-control-alto\)/);
assert.match(css, /body:has\(\.sate-barra\)\{padding-bottom:calc\(var\(--ipn-barra-alto\)/, 'reserva común para la barra móvil');
assert.deepEqual(datos.actividades, JSON.parse(leer('data/guia/actividades-upiita.json')), 'compilación conserva la fuente única');
for (const ancho of [1300, 768, 375]) for (const tema of ['claro', 'oscuro']) {
  const {document, Elemento} = crearEntorno();
  Elemento.prototype.append = function (...ns) { for (const n of ns) if (n) this.appendChild(n); };
  document.createElementNS = (_, tag) => document.createElement(tag);
  document.documentElement.setAttribute('data-tema', tema);
  let pestana;
  const c = vm.createContext({document, console, setTimeout, clearTimeout, innerWidth:ancho,
    addEventListener(){}, removeEventListener(){}, scrollTo(){},
    matchMedia:()=>({matches:ancho<900}),
    location:{hash:'#/upiita/guia', pathname:'/', search:'', href:'https://example.org/'},
    history:{replaceState(){}}, SATE_UNIDAD:'upiita', SATE_CONFIG:config,
    SATE:{texto:(k,v={})=>k+' '+Object.values(v).join(' '), pestana:(_,p)=>pestana=p, error:e=>{throw e;}},
    fetch:async()=>({ok:true,json:async()=>datos})});
  vm.runInContext(leer('web/sate/componentes.js'),c);
  vm.runInContext(leer('web/sate/guia.js'),c);
  for (const unidad of Object.values(config.unidades)) {
    assert.equal(Array.from(c.SateGuia.apartadosDisponibles(config.guia, {...unidad, guiaDatos:true})).some(a=>a.id==='actividades'), !!unidad.actividadesDatos, 'entrada por capacidad');
  }
  const caja=document.createElement('div'); caja.setAttribute('id','sate-guia'); document.body.appendChild(caja);
  await pestana.mostrar({partes:[]});
  assert.ok(caja.querySelector('a[href="#/upiita/guia/actividades"]'), `${ancho}/${tema}: portada`);
  await pestana.mostrar({partes:['actividades']});
  assert.equal(caja.querySelectorAll('.sate-recurso').length,datos.actividades.elementos.length);
  for (const categoria of ['', ...datos.actividades.categorias]) {
    caja.querySelector('[data-categoria="'+categoria+'"]').click();
    const esperados=datos.actividades.elementos.filter(a=>!categoria||a.categoria===categoria);
    assert.deepEqual(caja.querySelectorAll('.sate-recurso h3').map(n=>n.textContent),esperados.map(a=>a.nombre), `${ancho}/${tema}/${categoria}`);
    assert.equal(caja.querySelectorAll('[aria-pressed="true"]').length,1);
    assert.ok(caja.querySelector('[role="status"]').textContent.includes(String(esperados.length)));
    for (const enlace of caja.querySelectorAll('.sate-recurso__enlace')) {
      assert.ok(enlace.getAttribute('href').startsWith('https://'));
      assert.equal(enlace.getAttribute('target'),'_blank');
      assert.ok(enlace.getAttribute('rel').includes('noopener'));
    }
  }
}
console.log('OK actividades: fuente compilada, portada, filtros y enlaces en DOM a 1300/768/375, claro/oscuro. El DOM mínimo no mide geometría CSS.');
