// Cálculo, interacción y contratos PDF con datos ficticios y DOM en memoria.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=p=>readFileSync(p,'utf8'),plano=v=>JSON.parse(JSON.stringify(v));
const ref=vm.createContext({});
vm.runInContext(leer('tests/fixtures/ventanilla/electivas-calculo.js')+';globalThis.reglas={REQ,MOD,EJE,CAT,CATK,hoursOf,credOf,warnOf,valid,search,hourOpt,totals}',ref);
class Nodo{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.value='';this.textContent='';this.className=''}
  appendChild(n){this.children.push(n);return n}replaceChildren(){this.children=[]}
  setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]??null}
  removeAttribute(k){delete this.attrs[k];if(k==='src')delete this.src}
  querySelector(s){return this.todos().find(n=>s.startsWith('#')?n.id===s.slice(1):s.startsWith('[')?(()=>{const m=s.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);return m&&(m[2]==null?n.attrs[m[1]]!=null:n.attrs[m[1]]===m[2])})():n.tagName===s)||null}
  todos(){return this.children.flatMap(n=>[n,...n.todos()])}focus(){foco=this}click(){return this.onclick?.()}
}
let dialogo, foco,modulo,urlN=0;const box=new Nodo('section'),almacen=new Map(),descargas=[],estampados=[],uniones=[],scripts=[];
const recursos={pdfs:{die03:'FICTICIO',form:'FICTICIO',die01:'FICTICIO',die02:'FICTICIO'},oferta:[['B','M','F01','Materia ficticia','Profesor ficticio',4.5,'F','P']],curric:{'B|BE01':['ELECTIVA I']}};
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const timers=new Set();
const c=vm.createContext({SateUI:{modal(titulo,contenido,op){dialogo={titulo,contenido,...op}}},console,Blob,Date,Uint8Array,
  setTimeout(fn,ms){const h=setTimeout(()=>{timers.delete(h);fn()},ms);h.unref();timers.add(h);return h},clearTimeout,
  localStorage:{getItem:k=>almacen.get(k)||null},IPNT:{set:(k,v)=>almacen.set(k,v)},
  document:{createElement(t){const n=new Nodo(t);if(t==='a')n.click=()=>descargas.push(n.download);return n},getElementById:()=>box},
  URL:{createObjectURL:()=>`blob:${++urlN}`,revokeObjectURL(){}},
  location:{replace(){throw new Error('El asistente no debe redirigir a la página antigua')}},
  SATE_UNIDAD:'upiita',SATE_CONFIG:config,SATE_DATA:{calendario:{periodo:'27/1'}},
  SATE:{texto:(k,v={})=>(config.textos[k]||k).replace(/\{(\w+)\}/g,(_,id)=>v[id]??''),pestana:(id,m)=>modulo=m,presente:{aplicaTramite:()=>null},ir(){},repintar(){modulo.mostrar({tramite:'electivas'})},script:async s=>scripts.push(s)},
  fetch:async()=>({ok:true,json:async()=>recursos}),
  PDFLib:{PDFDocument:{create:async()=>({embedFont:async()=>({widthOfTextAtSize:(s,z)=>String(s).length*z/2,encodeText:s=>{if(s.includes('😀'))throw new Error('Unsupported')}})})},StandardFonts:{Helvetica:'Helvetica'}},
  PdfElectivas:{generar:async d=>{estampados.push(plano(d));return new Uint8Array([estampados.length])}}
});
async function aceptar(accion){
  dialogo=null;const pendiente=accion();
  assert.ok(dialogo,'La descarga primero abre el modal');
  assert.equal(dialogo.contenido,'Entrega tus formatos firmados en las ventanillas de Gestión Escolar.');
  assert.deepEqual(Array.from(dialogo.acciones,a=>a.texto),['Generar PDF','Cancelar']);
  dialogo.acciones[0].onclick();dialogo.alCerrar();await pendiente;
}
async function cancelar(accion){
  const pendiente=accion();assert.ok(dialogo);dialogo.alCerrar();await pendiente;
}
vm.runInContext('window=globalThis;window.open=()=>{}',c);
for(const p of ['web/tramites/electivas-reglas.js','web/tramites/pdf-comun.js','web/sate/tramites.js','web/sate/electivas.js'])vm.runInContext(leer(p),c);
c.PdfTramites.unir=async(pdfs,op)=>{uniones.push({pdfs:plano(pdfs),op});return new Uint8Array([37,80,68,70])};
const R=c.ElectivasReglas,E=c.SateElectivas,T=c.SateTramites;
assert.equal(R.CARN.B,'Ingeniería Biónica');assert.equal(R.CARN.M,'Ingeniería Mecatrónica');
assert.deepEqual(plano(R.CAT),plano(ref.reglas.CAT));
for(const cat of R.CAT)for(const h of [0,0.01,15.999,16,20,40,40.01,50,100,123.45]){
  const a={k:cat.k,h,ht:h/3,hp:h/7,desc:cat.f.noIngles?'Curso de inglés':'Actividad ficticia'};
  for(const f of ['hoursOf','credOf','warnOf','valid'])assert.deepEqual(plano(R[f](a)),plano(ref.reglas[f](a)),f+' '+cat.k+' '+h);
}
for(const car of ['B','M','T'])for(const lib of [0,1,3,8]){
  const s={car,acts:R.CAT.map(a=>({k:a.k,h:65.3,ht:2,hp:1,desc:'Ficticia'})),f:{q1:'si',sob:'2.57'}};
  assert.deepEqual(plano(R.totals(s,()=>lib)),plano(ref.reglas.totals(s,()=>lib)));
}
assert.equal(R.search('investigación')[0].k,R.search('investigacion')[0].k);
assert.equal(R.search('II.3.2')[0].k,'II.3.2');assert.equal(R.credOf({k:'II.3.2',h:80}),2);
assert.match(leer('web/sate/electivas.js'),/R.totals\(/);
await E.preparar();assert.ok(scripts.includes('../tramites/pdf-electivas.js'));
assert.match(E.validarActividades([]),/Mis datos/);
assert.equal(E.inscrito(null),'');assert.equal(E.inscrito({en_curso:['F']},'27/1'),'si');
assert.equal(E.inscrito({acreditadas:[['F',8,'26/2']]},'27/1'),'si');assert.equal(E.inscrito({acreditadas:[['F',8,'25/2']]},'27/1'),'');
const datos={paterno:'ALUMNO',materno:'FICTICIO',nombres:'ANA',boleta:'2099000000',carrera:'Ingeniería Biónica',plan:'2009',correo:'ficticio@example.test'};
almacen.set('hu.tramite.datos',JSON.stringify({confirmado:true,datos}));
almacen.set('saes.alumno',JSON.stringify({upiita_saes:1,carrera:'B',unidad:'upiita',en_curso:['F'],acreditadas:[['BE01',8,'26/2']]}));
const actividad={k:'II.3.2',desc:'Congreso ficticio',h:'80',inst:'Institución ficticia',folio:'F',fecha:'2026-10-07',firma:'Firmante ficticio',ev:'constancia'};
const viejo={acts:[actividad],f:{q1:'no',q2:'no',q3:'no',q4:'no',q5:'si',obs:''}};
almacen.set('ue.s',JSON.stringify(viejo));const intacto=almacen.get('ue.s');
modulo.mostrar({tramite:'electivas'});
const texto=s=>box.todos().find(n=>n.textContent===s&&n.tagName==='button');
texto('Importar lo que llenaste en Electivas').click();
assert.equal(almacen.get('ue.s'),intacto);assert.ok(almacen.has('hu.tramite.electivas.importacion'));
assert.ok(!texto('Importar lo que llenaste en Electivas'));
assert.ok(box.todos().some(n=>n.textContent==='40 h = 2 créditos · tope de congresos: 40 h'));
assert.ok(box.todos().some(n=>n.textContent.startsWith('2 de 15 créditos')));
const chip=texto('Oficio');chip.click();assert.equal(chip.getAttribute('aria-pressed'),'true');assert.equal(texto('Constancia').getAttribute('aria-pressed'),'false');
assert.equal(JSON.parse(almacen.get('hu.tramite.electivas')).datos.actividades[0].ev,'oficio');
const horas=box.todos().find(n=>n.tagName==='label'&&n.children[0]?.textContent==='¿Cuántas horas dice tu constancia?').children[1];
horas.value='0';horas.oninput();assert.equal(horas.getAttribute('aria-invalid'),null);horas.onblur();assert.equal(horas.getAttribute('aria-invalid'),'true');
horas.value='40';horas.oninput();horas.onblur();texto('Continuar').click();
assert.ok(box.todos().some(n=>n.textContent==='¿Estuviste inscrito este semestre o el anterior?'));
const primera=box.todos().find(n=>n.tagName==='section'&&n.children[0]?.textContent==='¿Te quedaron créditos sobrantes de un trámite anterior?');
primera.todos().find(n=>n.textContent==='Sí').click();
assert.ok(box.todos().some(n=>n.textContent==='¿Cuántos créditos te quedaron?'));
const antesAtajo=T.modelo(E.def).datos.formulario;
texto('Ninguna de las primeras cuatro me aplica').click();
const despuesAtajo=T.modelo(E.def).datos.formulario;
assert.deepEqual(['q1','q2','q3','q4'].map(k=>despuesAtajo[k]),['no','no','no','no']);
assert.equal(despuesAtajo.q5,antesAtajo.q5);assert.equal(despuesAtajo.confirmada,antesAtajo.confirmada);
assert.ok(texto('Confirmar mi respuesta'),'El atajo no confirma la quinta');
box.todos().find(n=>n.tagName==='section'&&n.children[0]?.textContent==='¿Te quedaron créditos sobrantes de un trámite anterior?').todos().find(n=>n.textContent==='Sí').click();
assert.equal(T.modelo(E.def).datos.formulario.q1,'si','Puede corregir una respuesta después del atajo');
const form=T.modelo(E.def).datos.formulario;
assert.ok(E.validarFormulario(form));form.sob='2';form.confirmada=true;assert.equal(E.validarFormulario(form),'');
form.q3='si';assert.ok(E.validarFormulario(form));Object.assign(form,{q3n:'2',q3a:'1',q3r:'0',q3p:'26/2'});assert.match(E.validarFormulario(form),/sumar/);form.q3r='1';assert.equal(E.validarFormulario(form),'');
form.obs='x'.repeat(113);assert.equal(E.medir(form).ok,false);form.obs='texto '.repeat(80);assert.ok(E.medir(form).renglones.length>4);form.obs='Observación ficticia';
form.q5='no';assert.equal(E.validarFormulario(form),'');
const d={actividades:[{...actividad,h:40}],formulario:form};
const opt=(k,car,grupo,h)=>({k,desc:'Materia ficticia',h,ev:'boleta',o:{car,grupo,profesor:'Profesor ficticio',pmail:'docente@example.test',horario:h===54?3:6,per:'27/1',dep:'TA'}});
d.actividades.push(opt('II.1.1.2','B','F01',54),opt('I.1.1.1','M','F02',108));
assert.equal(E.validarActividades(d.actividades),'');await E.generar(d);
assert.equal(estampados.length,3);assert.equal(estampados[0].tipo,'die03');assert.equal(estampados[0].actividades.length,3);
assert.equal(estampados[1].estado.o.car,'B');assert.equal(estampados[2].estado.o.car,'M');assert.equal(uniones[0].pdfs.length,3);assert.equal(uniones[0].op,undefined,'Unión sin hoja de instrucciones');
const migrada=E.importar({acts:[opt('II.1.1.2','B','F01',81)],f:viejo.f,o:{car:'B',cls:'B|F01|Materia ficticia',pmail:'docente@example.test',dep:'TA',per:'26/2'}});
assert.equal(migrada.actividades[0].o.horario,4.5);assert.equal(migrada.actividades[0].h,81);assert.equal(migrada.formulario.confirmada,false);
const independiente=E.importar({car:'B',acts:[],o:{car:'B',cls:'B|F01|Materia ficticia',pmail:'docente@example.test',dep:'TA',per:'26/2'}});
assert.equal(independiente.actividades.length,1);assert.equal(independiente.actividades[0].k,'II.1.1.2');assert.equal(independiente.actividades[0].h,81);
const asistente=T.asistente(box,{...E.def,datos:()=>d});
asistente.modelo.datos.actividades=d.actividades;asistente.modelo.datos.formulario=d.formulario;
asistente.modelo.paso=2;asistente.modelo.guardar();asistente.destruir();modulo.mostrar({tramite:'electivas'});
assert.ok(box.querySelector('dl'));assert.ok(texto('Cambiar'));assert.ok(texto('Descargar mi solicitud (PDF)'));
await cancelar(()=>texto('Descargar mi solicitud (PDF)').onclick());assert.equal(descargas.length,0);
await aceptar(()=>texto('Descargar mi solicitud (PDF)').onclick());assert.equal(descargas.at(-1),'electivas-2099000000.pdf');
assert.equal(JSON.parse(almacen.get('hu.tramite.electivas')).listo,true);
await new Promise(r=>setTimeout(r,360));assert.match(box.querySelector('iframe').src,/^blob:/);
modulo.ocultar();
let preparadoDesdeLista=0;T.registrar({...E.def,preparar:async()=>{preparadoDesdeLista++;await E.preparar()}});
T.mostrarLista(box);await cancelar(()=>texto('Descargar').onclick());assert.equal(preparadoDesdeLista,0);await aceptar(()=>texto('Descargar').onclick());assert.equal(preparadoDesdeLista,1);assert.equal(descargas.at(-1),'electivas-2099000000.pdf');
modulo.mostrar({tramite:'electivas'});texto('Cambiar').click();assert.ok(box.querySelector('form'));
box.querySelector('form').onsubmit({preventDefault(){}});assert.ok(box.todos().some(n=>n.textContent==='Tus electivas'),'Volver desde Mis datos recupera el asistente en la misma ruta');
modulo.ocultar();for(const h of timers)clearTimeout(h);
for(const p of ['web/dist/horarios-upiita.html','web/dist/horarios-escom.html','web/dist/horarios-upibi.html','web/dist/sate/index.html'])for(const m of leer(p).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new Function(m[1]);
for(const p of ['web/dist/sate/electivas.js','web/dist/tramites/electivas-reglas.js'])new Function(leer(p));
console.log('Electivas: igualdad de catálogo/créditos/topes, SAES, chips, validación, condicionales, importación conservadora, revisión, PDF único y vista previa correctos.');
