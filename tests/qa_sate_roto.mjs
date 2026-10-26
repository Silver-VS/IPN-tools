// R17: regresiones DOM y contratos de geometría, sin motor de render ni navegador.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer=p=>readFileSync(p,'utf8');
const css=leer('web/sate/componentes.css'),guia=leer('web/sate/guia.css');
const regla=(fuente,selector)=>{
  const inicio=fuente.lastIndexOf(selector+'{');
  assert.ok(inicio>=0,selector);
  return fuente.slice(inicio+selector.length+1).split('}')[0];
};
// La causa original era la dirección horizontal del li, no las columnas de su botón.
assert.match(regla(css,'.tramite-rejilla .tramite-fila'),/flex-direction:column/);
assert.match(regla(css,'.tramite-rejilla .sate-btn.tramite-fila-boton'),/flex-direction:column/);
assert.match(regla(css,'.tramite-fila>.sate-vinculos-fila'),/flex-basis:auto/);
assert.match(regla(css,'.tramite-rejilla .tramite-fila-titulo'),/min-width:var\(--ipn-tarjeta-titulo-min\);align-self:stretch/);
const minimo=Number(css.match(/--ipn-tarjeta-titulo-min:([\d.]+)ch/)[1]);
assert.ok(minimo>=12,'El título nunca puede reducirse por debajo de 12ch');
// Verifica el límite inferior a los anchos pedidos y entre ellos. Es un contrato CSS,
// no una medición visual: el título ocupa la tarjeta y sus vínculos no compiten por ancho.
for(let ancho=375;ancho<=2560;ancho++){
  const columnas=ancho<=639?1:2,contenido=ancho-64;
  const tarjeta=(contenido-columnas-1)/columnas-32;
  assert.ok(tarjeta>=12*8,`Título <12ch a ${ancho}px`);
}
for(const ancho of [2560,1440,1024,768,375]){
  const matchMedia=()=>({matches:ancho>=768});
  const bar={hidden:true,getBoundingClientRect:()=>({height:44,bottom:bar.hidden?0:44})};
  let bottom=20,tope;
  const ctx=vm.createContext({bar,mq:matchMedia(),nav:{getBoundingClientRect:()=>({bottom})},
    document:{documentElement:{style:{setProperty:(k,v)=>tope=v}}}});
  const encabezado=leer('web/sate/encabezado.js');
  const sync=encabezado.slice(encabezado.indexOf('  const sync=()=>{'),encabezado.indexOf('  let pendiente=false;'))+'sync();';
  const alturas=[];
  for(const y of [20,0,-1,-200,0,20]){bottom=y;vm.runInContext('(()=>{'+sync+'})()',ctx);alturas.push(tope)}
  assert.equal(new Set(alturas).size,1,`Sin salto de sticky a ${ancho}px`);
}
const comunes=regla(css,'.seg,.sate-segmentado,.sate-pestanas--seg');
assert.match(comunes,/padding:var\(--ipn-esp-1\)/);
assert.match(comunes,/overflow:visible/);
assert.match(css,/--ipn-radio-interior:max\(0px,calc\(var\(--ipn-radio\) - var\(--ipn-esp-1\)\)\)/);
assert.match(regla(css,'.seg button,.seg.sm button,.sate-segmentado button,.sate-pestanas--seg .sate-pestana'),/min-height:var\(--ipn-control-alto\);height:auto;margin:0;border-radius:var\(--ipn-radio-interior\)/);
assert.match(regla(css,'.sate-pestanas--seg .sate-pestana[aria-selected=true]'),/box-shadow:inset/);
for(const selector of ['.rgl-grupo>summary','.rgl-indice-titulo']){
  const reglas=[...guia.matchAll(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]+)\\}','g'))].map(m=>m[1]).join(';');
  assert.match(reglas,/overflow-wrap:normal/);
  assert.match(reglas,/word-break:normal/);
  assert.doesNotMatch(reglas,/break-all|anywhere/);
}
assert.ok(Number(css.match(/--ipn-indice-ancho:([\d.]+)rem/)[1])>=16);
for(const [,columnas] of guia.matchAll(/\.rgl(?:,\.rgl--sin-riel)?\{[^}]*grid-template-columns:([^;}]+)/g))
  assert.ok(columnas==='minmax(0,1fr)'||columnas.includes('var(--ipn-indice-ancho)'),columnas);
assert.match(guia,/@container\(max-width:42rem\)[^\n]*\.rgl-resumen\{display:flex\}/,'Índice plegable cuando no caben dos columnas');
assert.match(regla(css,'.tramite-miniatura--ampliada .tramite-miniatura-hoja'),/width:100%;height:auto;min-height:100%;transform:none/);
assert.match(regla(css,'.tramite-miniatura--ampliada'),/--ipn-superficie:var\(--ipn-papel\)/);

// Integración real del asistente: éxito, fallo, reintento y URL obsoleta para cualquier trámite.
for(const id of ['dictamen','baja_temporal','baja_definitiva','electivas','futuro']){
  const {document}=crearEntorno(),box=document.createElement('section'),tareas=new Map(),errores=[];
  let seq=0,dialogo,fallar=false,pendiente=null;
  const c=vm.createContext({document,console:{error:(...e)=>errores.push(e)},Blob,
    SATE_UNIDAD:'ficticia',SATE_CONFIG:{unidades:{ficticia:{siglas:'FICTICIA'}}},
    SATE:{texto:k=>k,pestana(){}},SateUI:{modal:(titulo,contenido)=>dialogo=contenido},
    localStorage:{getItem:()=>null},
    URL:{createObjectURL:()=> 'blob:ficticio',revokeObjectURL(){}},
    setTimeout:fn=>{tareas.set(++seq,fn);return seq},clearTimeout:id=>tareas.delete(id)});
  vm.runInContext('window=globalThis;',c);vm.runInContext(leer('web/sate/tramites.js'),c);
  const generar=async()=>{if(pendiente)return pendiente;if(fallar)throw Error('Fallo ficticio');return new Uint8Array([37,80,68,70])};
  const def={id,titulo:'Trámite ficticio',pasos:[],generar};
  const ejecutar=async()=>{for(const [i,fn] of [...tareas]){tareas.delete(i);await fn()}};
  let asistente=c.SateTramites.asistente(box,def);
  assert.equal(box.querySelector('.tramite-miniatura').hidden,false,'Ejemplo antes de generar');
  assert.equal(box.querySelector('.tramite-preview').hidden,true);
  box.querySelector('.tramite-miniatura').onclick();
  assert.ok(dialogo.className.includes('tramite-miniatura--ampliada'));
  await ejecutar();
  assert.equal(box.querySelector('.tramite-miniatura').hidden,true,id+': no hay duplicado');
  assert.equal(box.querySelector('.tramite-preview').hidden,false);
  box.querySelector('[data-ver-formato]').onclick();
  assert.equal(dialogo.tagName,'IFRAME','La lectura abre el mismo PDF oficial');
  assert.match(dialogo.src,/#view=FitH$/);
  asistente.destruir();
  fallar=true;asistente=c.SateTramites.asistente(box,def);await ejecutar();
  assert.equal(box.querySelector('.tramite-miniatura').hidden,false,'El error conserva el ejemplo');
  assert.equal(box.querySelector('.tramite-preview').hidden,true,'Nunca una vista oficial vacía');
  assert.equal(errores.length,1);assert.equal(errores[0][1].tramite,id);
  asistente.destruir();
  fallar=false;let resolver;pendiente=new Promise(r=>resolver=r);
  asistente=c.SateTramites.asistente(box,def);const trabajo=ejecutar();asistente.destruir();resolver(new Uint8Array([37,80,68,70]));await trabajo;
  assert.equal(box.querySelector('.tramite-miniatura').hidden,false,'Una respuesta obsoleta no sustituye el ejemplo');
}
console.log('R17: tarjetas ≥12ch, PDF único y legible, sticky estable, geometría común e índice sin cortes; contratos 375–2560px OK.');
