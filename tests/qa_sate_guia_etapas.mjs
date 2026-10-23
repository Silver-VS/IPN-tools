// Integración de la Guía con datos reales y DOM local, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer = p => readFileSync(p, 'utf8');
const datos = JSON.parse(leer('web/dist/sate/datos/upiita/guia.json'));
const config = JSON.parse(leer('data/sate.json'));
config.unidades.upiita.guiaDatos = true;
const {document, Elemento, Evento} = crearEntorno();
Elemento.prototype.append = function (...ns) { for (const n of ns) if (n) this.appendChild(n); };
document.createElementNS = (_, tag) => document.createElement(tag);
let ancho = 1440, pestana;
const cambios = new Set();
const c = vm.createContext({document, console, setTimeout, clearTimeout,
  addEventListener(){}, removeEventListener(){}, scrollTo(){},
  matchMedia:q=>({matches:q.includes('min-width') ? ancho>=900 : ancho<900,
    addEventListener:(_,f)=>cambios.add(f), removeEventListener:(_,f)=>cambios.delete(f)}),
  location:{hash:'#/upiita/guia',pathname:'/',search:'',href:'https://example.org/'},
  history:{replaceState(){}}, SATE_UNIDAD:'upiita', SATE_CONFIG:config,
  SATE:{texto:(k,v={})=>k+' '+Object.values(v).join(' '),pestana:(_,p)=>pestana=p,error:e=>{throw e;}},
  fetch:async()=>({ok:true,json:async()=>datos})});
vm.runInContext(leer('web/sate/componentes.js'),c);
vm.runInContext(leer('web/sate/guia.js'),c);
const caja=document.createElement('div'); caja.setAttribute('id','sate-guia'); document.body.appendChild(caja);
const abrir=async(...partes)=>{await pestana.mostrar({partes});assert.equal(caja.querySelector('[role="alert"]'),null);};
const clickTexto=(sel,clave)=>{const b=[...caja.querySelectorAll(sel)].find(b=>b.textContent.trim()===clave); assert.ok(b,clave); b.click();};
assert.equal(datos.etapas.length,7);
for (const p of datos.preguntas) assert.ok(datos.etapas.some(e=>e.id===p.etapa),p.id+' tiene etapa');
for (const apartado of ['situacion','tramites']) {
  await abrir(apartado);
  for (const e of datos.etapas.filter(e=>datos.preguntas.some(p=>p.apartado===apartado&&p.etapa===e.id))) {
    const etapa = [...caja.querySelectorAll('.guia-etapas button')].find(b=>b.getAttribute('title')?.trim()===e.titulo);
    assert.ok(etapa, JSON.stringify([...caja.querySelectorAll('.guia-etapas button')].map(b=>b.getAttribute('title'))));
    etapa.click();
    assert.equal(document.activeElement, caja.querySelector('.guia-etapas [aria-current]'));
    assert.deepEqual([...caja.querySelectorAll('[data-pregunta]')].map(b=>b.getAttribute('data-pregunta')),datos.preguntas.filter(p=>p.apartado===apartado&&p.etapa===e.id).map(p=>p.id));
  }
}
for (ancho of [1440,768,375,320]) {
  await abrir('situacion','que-es-dictamen');
  const respuesta=caja.querySelector('#respuesta-que-es-dictamen');
  assert.ok(respuesta.querySelector('.sate-termino'),'glosario');
  assert.ok(respuesta.querySelector('.guia-enlace'),'citas');
  assert.equal(respuesta.parentNode.tagName==='LI',ancho<900,'respuesta bajo su pregunta en teléfono');
  const buscador=caja.querySelector('#guia-qa'); buscador.value='ETS'; buscador.dispatchEvent(new Evento('input'));
  assert.deepEqual([...caja.querySelectorAll('[data-pregunta]')].map(b=>b.getAttribute('data-pregunta')),Array.from(c.SateGuia.buscarPreguntas(datos.preguntas,'ETS','situacion'),p=>p.id));
}
ancho=1440;
await abrir('acudir','gestion_escolar');
assert.ok(caja.querySelector('.guia-ficha .sate-termino'));
for (const ambito of ['unidad','ipn']) {
  clickTexto('.guia-controles button','sate.guia.acudir_'+ambito);
  for (const b of caja.querySelectorAll('.guia-directorio-lista [data-instancia]')) assert.equal([...datos.acudir,...datos.estructuraCentral].find(a=>a.id===b.getAttribute('data-instancia')).ambito,ambito);
}
clickTexto('.guia-controles button','sate.guia.r10.todo');
const necesidad=caja.querySelector('#guia-necesidad');
for (const [consulta,id] of [['queja de un profesor','subdireccion_academica'],['comisión de honor','sseis'],['denuncia anónima','denuncias']]) {
  necesidad.value=consulta; necesidad.dispatchEvent(new Evento('input'));
  const b=caja.querySelector('[data-instancia="'+id+'"]'); assert.ok(b,consulta); b.click();
  assert.ok(caja.querySelector('.guia-ficha').textContent.includes('sate.guia.r10.confirmar'));
}
necesidad.value=''; necesidad.dispatchEvent(new Evento('input'));
clickTexto('.guia-controles button','sate.guia.r10.jerarquia');
const nombres=[datos.organigrama.raiz.nombre,...datos.organigrama.raiz.colegiados,...datos.organigrama.raiz.apoyo];
for (const a of datos.organigrama.raiz.areas) nombres.push(a.nombre,...a.dependencias,...a.colegiados||[]);
for (const nombre of nombres) assert.ok([...caja.querySelectorAll('.guia-arbol [data-instancia]')].some(b=>b.textContent===nombre),nombre);
for (const a of datos.acudir.filter(a=>a.ambito==='ipn')) assert.ok(caja.querySelector('.guia-arbol [data-instancia="'+a.id+'"]'),a.id);
caja.querySelector('.guia-arbol [data-instancia="gestion_escolar"]').click();
assert.ok(caja.querySelector('.guia-ficha').textContent.includes('Subdirección de Servicios Educativos'));
ancho=375;
await abrir('acudir');
caja.querySelector('[data-instancia="gestion_escolar"]').click();
assert.ok(document.querySelector('.sate-modal .guia-ficha'));
c.SateUI.cerrarModal();
pestana.ocultar(); assert.equal(cambios.size,0);
console.log('Guía: etapas, búsqueda, marcado, directorio, organigrama completo y ficha móvil OK');
