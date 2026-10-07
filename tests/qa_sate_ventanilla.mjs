// Lista, identidad y asistente con DOM local. Sin navegador, CDP ni servicios.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync('web/dist/sate/index.html','utf8').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const texto=(k,v={})=>(config.textos[k]||k).replace(/\{(\w+)\}/g,(_,n)=>v[n]??'{'+n+'}');
class Nodo{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.value='';this.textContent='';this.className=''}
  appendChild(n){this.children.push(n);return n}replaceChildren(){this.children=[]}
  setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]??null}
  removeAttribute(k){delete this.attrs[k];if(k==='src')delete this.src}
  querySelector(s){return this.todos().find(n=>s.startsWith('#')?n.id===s.slice(1):s.startsWith('[')?(()=>{const m=s.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);return m&&(m[2]==null?n.attrs[m[1]]!=null:n.attrs[m[1]]===m[2])})():n.tagName===s)||null}
  todos(){return this.children.flatMap(n=>[n,...n.todos()])}focus(){foco=this}click(){this.onclick?.()}
}
let foco,aplicacion=null,ir,modulo;const almacen=new Map(),urls=new Set(),revocados=[],abiertos=[],box=new Nodo('section');
const c=vm.createContext({console,setTimeout:(fn,ms)=>{const h=setTimeout(fn,ms);if(ms>=30000)h.unref();return h},clearTimeout,Blob,Date,
  document:{createElement:t=>new Nodo(t),getElementById:()=>box},
  localStorage:{getItem:k=>almacen.get(k)||null},IPNT:{set:(k,v)=>almacen.set(k,v)},
  URL:{createObjectURL(){const u='blob:'+urls.size;urls.add(u);return u},revokeObjectURL(u){revocados.push(u)}},
  location:{assign:u=>abiertos.push(u),replace:u=>abiertos.push(u)},SATE_UNIDAD:'upiita',SATE_CONFIG:config,
  SATE:{texto,pestana:(id,m)=>modulo=m,presente:{aplicaTramite:()=>aplicacion},ir:r=>ir=r}});
vm.runInContext('window=globalThis;window.open=(u)=>location.assign(u)',c);
vm.runInContext(readFileSync('web/sate/tramites.js','utf8'),c);
const t=c.SateTramites,plano=v=>JSON.parse(JSON.stringify(v));
assert.equal(t.estado(null,null).id,'no_iniciado');
assert.deepEqual(plano(t.estado({paso:1,total:4,actualizado:0},null,300000)),{id:'progreso',accion:'continuar',paso:2,total:4,min:5});
assert.equal(t.estado({listo:true},null).accion,'descargar');
assert.equal(t.estado(null,{aplica:false,motivo:'Motivo ficticio'}).motivo,'Motivo ficticio');
assert.equal(t.estado(null,{aplica:false}).accion,null);
assert.deepEqual(plano(t.separarNombre('DE LA CRUZ DEL RÍO ANA MARÍA',6,3)),{paterno:'DE LA CRUZ',materno:'DEL RÍO ANA',nombres:'MARÍA'});
assert.deepEqual(plano(t.separarNombre('DE LA CRUZ DEL RÍO ANA MARÍA',5,3)),{paterno:'DE LA CRUZ',materno:'DEL RÍO',nombres:'ANA MARÍA'});
assert.deepEqual(plano(t.separarNombre('DE LA CRUZ DEL RÍO ANA MARÍA',4,3,true)),{paterno:'DE LA CRUZ',materno:'DEL RÍO',nombres:'ANA MARÍA'});
assert.equal(t.separarNombre('ANA',0),null);
assert.equal(t.validarDatos('boleta','2099000000'),'');assert.ok(t.validarDatos('boleta','2099'));
assert.equal(t.validarDatos('correo','ficticio@example.test'),'');assert.ok(t.validarDatos('correo','invalido'));
assert.equal(Object.keys(t.prellenar({upiita_saes:1,unidad:'escom',boleta:'2099000000'})).length,0);
aplicacion={aplica:true,motivo:'Causal ficticia'};t.mostrarLista(box);
assert.equal(box.todos().filter(n=>n.tagName==='section').length,2);
assert.equal(box.todos().filter(n=>n.tagName==='button'&&n.textContent==='Empezar').length,2);
assert.ok(box.todos().some(n=>n.textContent==='Te aplica · Causal ficticia'));
box.todos().find(n=>n.textContent==='Empezar').click();assert.equal(ir,'tramites/dictamen');
almacen.set('hu.tramite.dictamen',JSON.stringify({paso:1,total:4,actualizado:Date.now()-300000}));
almacen.set('hu.tramite.electivas',JSON.stringify({listo:true}));t.mostrarLista(box);
assert.equal(box.todos().filter(n=>n.tagName==='button'&&n.textContent==='Continuar').length,1);
assert.equal(box.todos().filter(n=>n.tagName==='button'&&n.textContent==='Descargar').length,1);
assert.ok(box.todos().some(n=>n.textContent.includes('Paso 2 de 4 · guardado hace 5 min')));
aplicacion={aplica:false,motivo:'Motivo ficticio'};t.mostrarLista(box);
assert.equal(box.todos().filter(n=>n.tagName==='section').length,2);assert.equal(box.todos().filter(n=>n.tagName==='button').length,1,'Solo Mis datos: ningún botón para un trámite que no aplica');
aplicacion=null;
modulo.mostrar({tramite:'dictamen'});assert.equal(abiertos.at(-1),'../dictamen.html');
almacen.set('saes.alumno',JSON.stringify({upiita_saes:1,unidad:'upiita',nombre:'DE LA CRUZ DEL RÍO ANA MARÍA',boleta:'2099000000',carrera_nombre:'Ingeniería Biónica',plan:'2009',correo:'ficticio@example.test'}));
t.misDatos(box);
box.todos().find(n=>n.tagName==='button'&&n.textContent==='ANA').click();
box.todos().find(n=>n.tagName==='button'&&n.textContent==='DEL').click();
assert.equal(box.todos().find(n=>n.name==='paterno').value,'DE LA CRUZ');
assert.equal(box.todos().find(n=>n.name==='materno').value,'DEL RÍO');
assert.equal(box.todos().find(n=>n.name==='nombres').value,'ANA MARÍA');
assert.ok(!almacen.has('hu.tramite.datos'),'Prellenar no confirma ni persiste');
box.querySelector('form').onsubmit({preventDefault(){}});
assert.equal(JSON.parse(almacen.get('hu.tramite.datos')).confirmado,true);
const def={id:'ejemplo-prueba',titulo:'Prueba invisible',pasos:[{titulo:'Pregunta',campos:[{id:'dato',texto:'Dato',requerido:true}]},{titulo:'Situación',campos:[{id:'secreto',texto:'Sensible',sensible:true}]}],generar:async()=>new Uint8Array([37,80,68,70])};
const a=t.asistente(box,def),input=box.querySelector('input');
input.value='Valor ficticio';input.oninput();assert.equal(input.getAttribute('aria-invalid'),null,'Sin validación al escribir');
input.onblur();assert.equal(JSON.parse(almacen.get('hu.tramite.ejemplo-prueba')).datos.dato,'Valor ficticio');
box.todos().find(n=>n.textContent==='Continuar'&&n.tagName==='button').click();
assert.equal(a.modelo.paso,1);const secreto=box.querySelector('input');secreto.value='SENSIBLE-FICTICIO';secreto.oninput();secreto.onblur();
assert.ok(!almacen.get('hu.tramite.ejemplo-prueba').includes('SENSIBLE'));assert.ok(!almacen.get('hu.tramite.ejemplo-prueba').includes('secreto'));
box.todos().find(n=>n.textContent==='Continuar'&&n.tagName==='button').click();
assert.equal(a.modelo.paso,2);assert.ok(box.querySelector('dl'));
box.todos().find(n=>n.textContent==='Cambiar'&&n.tagName==='button').click();assert.equal(a.modelo.paso,0);
assert.equal(t.modelo(def).datos.secreto,'','Los sensibles no reaparecen después de recargar');
await new Promise(r=>setTimeout(r,350));assert.ok(box.querySelector('iframe').src.startsWith('blob:'));
box.todos().find(n=>n.textContent==='Ver formato').click();assert.ok(abiertos.at(-1).startsWith('blob:'));
a.destruir();assert.equal(a.modelo.datos.secreto,'');assert.ok(revocados.length);
almacen.delete('hu.tramite.ejemplo-prueba');
const defListo={id:'listo-prueba',titulo:'Listo',pasos:[{titulo:'Pregunta',campos:[{id:'dato',texto:'Dato',requerido:true}]}],generar:async()=>new Uint8Array([37,80,68,70])};
const listo=t.asistente(box,defListo);box.querySelector('input').value='Ficticio';box.querySelector('input').oninput();box.todos().find(n=>n.textContent==='Continuar').click();await listo.descargar();
assert.equal(JSON.parse(almacen.get('hu.tramite.listo-prueba')).listo,true,'Listo solo tras generación correcta');listo.destruir();
let generadoDesdeLista=0;t.registrar({...defListo,id:'electivas',generar:async()=>{generadoDesdeLista++;return new Uint8Array([37,80,68,70])}});
almacen.set('hu.tramite.electivas',JSON.stringify({listo:true,paso:1,total:2,datos:{dato:'Ficticio'}}));t.mostrarLista(box);
await box.todos().find(n=>n.tagName==='button'&&n.textContent==='Descargar').onclick();assert.equal(generadoDesdeLista,1,'Descargar en la lista genera el PDF directamente');
const invalido=t.asistente(box,{...defListo,id:'preview-invalida',datos:{dato:'Ficticio'}});
await new Promise(r=>setTimeout(r,350));assert.ok(box.querySelector('iframe').src);
box.querySelector('input').value='';box.querySelector('input').oninput();await new Promise(r=>setTimeout(r,350));assert.equal(box.querySelector('iframe').src,undefined);assert.equal(box.querySelector('[data-ver-formato]').disabled,true);invalido.destruir();
const errorDef={id:'error-prueba',titulo:'Error',pasos:[{titulo:'Pregunta',campos:[{id:'dato',texto:'Dato',requerido:true}]}]};
const b=t.asistente(box,errorDef);box.todos().find(n=>n.textContent==='Continuar').click();assert.equal(b.modelo.paso,0);assert.equal(foco,box.querySelector('input'));b.destruir();
const css=readFileSync('web/sate/componentes.css','utf8');assert.match(css,/@media\(min-width:1024px\)/);assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
const cssVentanilla=css.slice(css.indexOf('.tramite-lista'),css.indexOf('.sate-recorte-calendario'));
assert.ok(!/var\(--(?!ipn-)[\w-]+/.test(cssVentanilla));
console.log('Ventanilla: estados, rutas, confirmación, apellidos compuestos, pasos, revisión, validación, memoria sensible y vista previa correctos.');
