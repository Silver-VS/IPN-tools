// Integración DOM local: portada, filtros y enlaces; sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer = p => readFileSync(p, 'utf8');
const datos = JSON.parse(leer('web/dist/sate/datos/upiita/guia.json'));
const config = JSON.parse(leer('data/sate.json'));
assert.match(leer('contenido/textos/es.toml'),/actividades = "Actividades y servicios"/,'título de actividades');
config.unidades.upiita.guiaDatos = true; // Capacidad que agrega la compilación.
const css = leer('web/sate/guia.css');
const componentes = leer('web/sate/componentes.css');
assert.match(css,/\.guia-actividades-categorias\{[^}]*repeat\(auto-fit,minmax/,'categorías fluyen sin huecos fijos');
assert.match(css,/\.guia-actividad-detalle summary[^}]*min-height:var\(--ipn-control-alto\)/,'detalle táctil desplegable');
assert.match(componentes, /body:has\(\.sate-barra\)\{padding-bottom:calc\(var\(--ipn-barra-alto\)/, 'reserva común para la barra móvil');
assert.deepEqual(datos.actividades, JSON.parse(leer('data/guia/actividades-upiita.json')), 'compilación conserva la fuente única');
for (const ancho of [1300, 1024, 768, 375]) for (const tema of ['claro', 'oscuro']) {
  const {document, Elemento, Evento} = crearEntorno();
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
  assert.ok(caja.querySelector('a[href="#/upiita/guia/ruta/aprovecha"]'), `${ancho}/${tema}: actividades dentro de su ruta`);
  await pestana.mostrar({partes:['actividades']});
  const categorias=[...new Set(datos.actividades.elementos.map(a=>a.categoria))];
  assert.equal(caja.querySelectorAll('.guia-actividad-categoria').length,categorias.length,`${ancho}/${tema}: categorías`);
  assert.equal(caja.querySelectorAll('.guia-actividad').length,0,`${ancho}/${tema}: sin opciones expuestas`);
  assert.equal(caja.querySelectorAll('.guia-actividad-detalle[open]').length,0,`${ancho}/${tema}: detalles cerrados`);
  caja.querySelector('[data-categoria="'+categorias[0]+'"]').click();
  const esperados=datos.actividades.elementos.filter(a=>a.categoria===categorias[0]);
  assert.equal(caja.querySelectorAll('.guia-actividad').length,esperados.length,`${ancho}/${tema}: selección`);
  for (const enlace of caja.querySelectorAll('.guia-actividad-enlace')) assert.ok(enlace.getAttribute('href').startsWith('https://'));
  const objetivo=datos.actividades.elementos.find(a=>a.categoria!==categorias[0]);
  const buscador=caja.querySelector('input'); buscador.value=objetivo.nombre.split(' ')[0]; buscador.dispatchEvent(new Evento('input'));
  assert.ok(caja.textContent.includes(objetivo.nombre),`${ancho}/${tema}: filtro de otra categoría`);
}
console.log('OK actividades: fuente compilada, portada, filtros y enlaces en DOM a 1300/768/375, claro/oscuro. El DOM mínimo no mide geometría CSS.');
