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
let dialogo, foco,aplicacion=null,ir,modulo;const almacen=new Map(),urls=new Set(),revocados=[],abiertos=[],box=new Nodo('section');
const c=vm.createContext({SateUI:{modal(titulo,contenido,op){dialogo={titulo,contenido,...op}}},console,setTimeout:(fn,ms)=>{const h=setTimeout(fn,ms);if(ms>=30000)h.unref();return h},clearTimeout,Blob,Date,
  document:{createElement:t=>new Nodo(t),getElementById:()=>box},
  localStorage:{getItem:k=>almacen.get(k)||null},IPNT:{set:(k,v)=>almacen.set(k,v)},
  URL:{createObjectURL(){const u='blob:'+urls.size;urls.add(u);return u},revokeObjectURL(u){revocados.push(u)}},
  location:{assign:u=>abiertos.push(u),replace:u=>abiertos.push(u)},SATE_UNIDAD:'upiita',SATE_CONFIG:config,
  SATE:{texto,pestana:(id,m)=>modulo=m,presente:{aplicaTramite:()=>aplicacion},ir:r=>ir=r}});
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
vm.runInContext('window=globalThis;window.open=(u)=>location.assign(u)',c);
vm.runInContext(readFileSync('web/sate/tramites.js','utf8'),c);
const t=c.SateTramites,plano=v=>JSON.parse(JSON.stringify(v));
assert.equal(t.estado(null,null).id,'no_iniciado');
assert.deepEqual(plano(t.estado({paso:1,total:4,actualizado:0},null,300000)),{id:'progreso',accion:'continuar',paso:2,total:4,min:5});
assert.equal(t.estado({listo:true},null).accion,'descargar');
assert.equal(t.estado(null,{aplica:false,motivo:'Motivo ficticio'}).motivo,'Motivo ficticio');
assert.equal(t.estado(null,{aplica:false}).accion,null);
for(const [nombre,esperado] of [
 ['JUAN CARLOS PEREZ LOPEZ',{paterno:'PEREZ',materno:'LOPEZ',nombres:'JUAN CARLOS'}],
 ['JUAN MORENO DE LA PAZ',{paterno:'MORENO',materno:'DE LA PAZ',nombres:'JUAN'}],
 ['ANA SOFIA DEL VALLE RUIZ',{paterno:'DEL VALLE',materno:'RUIZ',nombres:'ANA SOFIA'}],
 ['LUIS GARCIA',{paterno:'GARCIA',materno:'',nombres:'LUIS'}],
 ['MARIA DE LOS ANGELES LOPEZ DIAZ',{paterno:'LOPEZ',materno:'DIAZ',nombres:'MARIA DE LOS ANGELES'}],
 ['Ana van valle von ruiz',{paterno:'van valle',materno:'von ruiz',nombres:'Ana'}],
 ['ANA PEREZ PEREZ',{paterno:'PEREZ',materno:'PEREZ',nombres:'ANA'}],
 ['ANA',{paterno:'',materno:'',nombres:'ANA'}]
])assert.deepEqual(plano(t.separarNombre(nombre)),esperado);
for(const particula of 'de del la las los y da das do dos van von mc mac'.split(' '))assert.deepEqual(plano(t.separarNombre('ANA '+particula+' PEREZ RUIZ')),{paterno:particula+' PEREZ',materno:'RUIZ',nombres:'ANA'});
assert.equal(t.validarDatos('boleta','2099000000'),'');assert.ok(t.validarDatos('boleta','2099'));
assert.equal(t.validarDatos('correo','ficticio@example.test'),'');assert.ok(t.validarDatos('correo','invalido'));
assert.equal(t.prellenar({upiita_saes:1,unidad:'escom',boleta:'2099000000'}).boleta,'2099000000');
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
assert.equal(box.todos().filter(n=>n.tagName==='section').length,2);assert.equal(box.todos().filter(n=>n.tagName==='button').length,0,'Ningún botón para un trámite que no aplica');
aplicacion=null;
modulo.mostrar({tramite:'dictamen'});assert.equal(abiertos.length,0,'Sin definición se muestra la lista; no hay página antigua');
const ficticio={upiita_saes:1,unidad:'upiita',nombre:'ANA SOFIA DEL VALLE RUIZ',boleta:'2099000000',carrera_nombre:'Ingeniería Biónica',plan:'2009',correo:'ficticio@example.test'};
almacen.set('saes.alumno',JSON.stringify(ficticio));
let aceptadas=0;
assert.equal(t.confirmarSaes(ficticio,box,()=>aceptadas++),true);
assert.equal(aceptadas,0,'La carga espera la confirmación');
assert.equal(box.todos().find(n=>n.name==='paterno').value,'DEL VALLE');
assert.equal(box.todos().find(n=>n.name==='materno').value,'RUIZ');
assert.equal(box.todos().find(n=>n.name==='nombres').value,'ANA SOFIA');
assert.equal(box.todos().find(n=>n.name==='paterno').readOnly,true);
box.todos().find(n=>n.textContent==='Corregir').click();
assert.equal(box.todos().find(n=>n.name==='paterno').readOnly,false);
box.todos().find(n=>n.name==='nombres').value='ANA SOFÍA';
assert.ok(!almacen.has('hu.tramite.datos'),'Prellenar no confirma ni persiste');
box.querySelector('form').onsubmit({preventDefault(){}});
assert.equal(aceptadas,1);assert.equal(JSON.parse(almacen.get('hu.tramite.datos')).confirmado,true);
box.replaceChildren();
assert.equal(t.confirmarSaes({...ficticio,nombre:'NOMBRE NUEVO DISTINTO',boleta:'2099000001',correo:'nuevo@example.test'},box,()=>aceptadas++),false);
assert.equal(aceptadas,2);assert.equal(box.querySelector('form'),null,'La segunda carga no pregunta');
const actualizado=JSON.parse(almacen.get('hu.tramite.datos')).datos;
assert.equal(actualizado.nombres,'ANA SOFÍA');assert.equal(actualizado.boleta,'2099000001');assert.equal(actualizado.correo,'nuevo@example.test');assert.ok(!('celular' in actualizado));
t.datosInline(box);assert.ok(box.todos().some(n=>n.textContent==='Editar'));assert.equal(box.querySelector('form'),null);
box.todos().find(n=>n.textContent==='Editar').click();assert.ok(box.querySelector('form'));
box.querySelector('form').onsubmit({preventDefault(){}});assert.equal(box.querySelector('form'),null);
almacen.delete('hu.tramite.datos');box.replaceChildren();t.datosInline(box);
assert.ok(box.querySelector('form'),'Sin confirmación, campos en el propio paso');
box.querySelector('form').onsubmit({preventDefault(){}});
assert.ok(!box.todos().some(n=>/Mis datos para trámites|Toca la primera palabra|Prefiero marcar/.test(n.textContent)));
// Integración del pegado y aceptación con SAES.wire real, en las tres unidades.
const identidadAnterior=almacen.get('hu.tramite.datos');
const saesReal=readFileSync('web/dist/sate/nucleo.js','utf8').match(/const SAES=\{[\s\S]*?\n\};/)[0];
for(const unidad of ['upiita','escom','upibi']){
  almacen.delete('hu.tramite.datos');let cargadas=0,cerradas=0,guardado;
  const nodos=new Map(),n=id=>{if(!nodos.has(id)){const e=new Nodo('div');e.eventos={};e.addEventListener=(k,f)=>e.eventos[k]=f;nodos.set(id,e)}return nodos.get(id)};
  const dl={querySelector:n,addEventListener(){}};
  const contexto=vm.createContext({console,document:{getElementById:()=>dl,addEventListener(){}},SATE:{script:async archivo=>assert.equal(archivo,'tramites.js')},SateTramites:t,setTimeout:f=>f()});
  vm.runInContext(saesReal+'\nglobalThis.saes=SAES;',contexto);
  const s=contexto.saes;s.U=()=>unidad;s.close=()=>cerradas++;s.save=d=>guardado=d;s.wire(()=>cargadas++);
  const pegar=datos=>n('#saes-paste').eventos.paste({preventDefault(){},clipboardData:{getData:()=>JSON.stringify(datos)}});
  await pegar({...ficticio,unidad,acreditadas:[]});
  assert.equal(cargadas,0);assert.equal(guardado,undefined);assert.equal(cerradas,0);
  n('#saes-msg').querySelector('form').onsubmit({preventDefault(){}});
  assert.equal(cargadas,1);assert.equal(guardado.unidad,unidad);assert.equal(cerradas,1);
  await pegar({...ficticio,unidad,acreditadas:[],boleta:'2099000002',nombre:'OTRO NOMBRE DISTINTO'});
  assert.equal(cargadas,2);assert.equal(cerradas,2);assert.equal(guardado.boleta,'2099000002');
  assert.equal(JSON.parse(almacen.get('hu.tramite.datos')).datos.nombres,'ANA SOFIA');
}
almacen.set('hu.tramite.datos',identidadAnterior);
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
const listo=t.asistente(box,defListo);box.querySelector('input').value='Ficticio';box.querySelector('input').oninput();box.todos().find(n=>n.textContent==='Continuar').click();await cancelar(()=>listo.descargar());assert.equal(JSON.parse(almacen.get('hu.tramite.listo-prueba')).listo,false);await aceptar(()=>listo.descargar());
assert.equal(JSON.parse(almacen.get('hu.tramite.listo-prueba')).listo,true,'Listo solo tras generación correcta');listo.destruir();
let generadoDesdeLista=0;t.registrar({...defListo,id:'electivas',generar:async()=>{generadoDesdeLista++;return new Uint8Array([37,80,68,70])}});
almacen.set('hu.tramite.electivas',JSON.stringify({listo:true,paso:1,total:2,datos:{dato:'Ficticio'}}));t.mostrarLista(box);
await cancelar(()=>box.todos().find(n=>n.tagName==='button'&&n.textContent==='Descargar').onclick());assert.equal(generadoDesdeLista,0);await aceptar(()=>box.todos().find(n=>n.tagName==='button'&&n.textContent==='Descargar').onclick());assert.equal(generadoDesdeLista,1,'Descargar en la lista genera el PDF directamente');
const invalido=t.asistente(box,{...defListo,id:'preview-invalida',datos:{dato:'Ficticio'}});
await new Promise(r=>setTimeout(r,350));assert.ok(box.querySelector('iframe').src);
box.querySelector('input').value='';box.querySelector('input').oninput();await new Promise(r=>setTimeout(r,350));assert.equal(box.querySelector('iframe').src,undefined);assert.equal(box.querySelector('[data-ver-formato]').disabled,true);invalido.destruir();
const errorDef={id:'error-prueba',titulo:'Error',pasos:[{titulo:'Pregunta',campos:[{id:'dato',texto:'Dato',requerido:true}]}]};
const b=t.asistente(box,errorDef);box.todos().find(n=>n.textContent==='Continuar').click();assert.equal(b.modelo.paso,0);assert.equal(foco,box.querySelector('input'));b.destruir();
const css=readFileSync('web/sate/componentes.css','utf8');assert.match(css,/@media\(min-width:1024px\)/);assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
const cssVentanilla=css.slice(css.indexOf('.tramite-lista'),css.indexOf('.sate-recorte-calendario'));
assert.ok(!/var\(--(?!ipn-|sate-realce\)|sate-sobre-realce\))[^),]+/.test(cssVentanilla));
for(const regla of cssVentanilla.matchAll(/([^{}]+)\{([^{}]+)\}/g))if(regla[2].includes('--sate-realce')){
  assert.ok(regla[1].includes(':focus-visible'),'Realce reservado al foco');
  assert.match(regla[2],/outline:2px solid var\(--sate-realce\)/);
}
assert.match(cssVentanilla,/#sate-tramites button\{[^}]*max-width:100%[^}]*white-space:normal[^}]*overflow-wrap:anywhere/);
assert.match(cssVentanilla,/\.tramite-acciones\{[^}]*position:sticky[^}]*safe-area-inset-bottom/);
assert.match(cssVentanilla,/\.tramite-acciones button\{[^}]*min-width:0/);
assert.match(cssVentanilla,/\.electivas-actividad\{[^}]*box-sizing:border-box[^}]*max-width:100%[^}]*overflow-wrap:anywhere/);
console.log('Ventanilla: estados, rutas, confirmación, apellidos compuestos, pasos, revisión, validación, memoria sensible y vista previa correctos.');

// V2: captura académica contra los contratos compartidos, con perfil ficticio.
c.SATE_DATA={...JSON.parse(readFileSync('web/dist/sate/datos/upiita/tramites.json','utf8')),carreras:{B:'Ingeniería Biónica'}};
c.SATE.script=async()=>{};
const estampados=[],uniones=[];
c.PDFLib={StandardFonts:{Helvetica:'Helvetica'},PDFDocument:{create:async()=>({embedFont:async()=>({widthOfTextAtSize:(s,size)=>s.length*size*.5})})}};
vm.runInContext(readFileSync('web/tramites/pdf-comun.js','utf8'),c);
c.PdfTramites.unir=async(pdfs,op)=>{uniones.push({pdfs,op});return new Uint8Array([37,80,68,70])};
c.PdfDictamen={generar:async d=>{estampados.push(d);return new Uint8Array([d.tipo==='carta'?2:1])}};
c.situacionDatos=()=>({nDes:2});
almacen.set('saes.alumno',JSON.stringify({upiita_saes:1,unidad:'upiita',carrera:'B',plan:'09',periodo_actual:'27/1',ultimo_semestre:'4',acreditadas:[['B102',8,'24/2']],reprobadas_periodo:[['B101','26/2',2],['B102','26/2']],kardex_reprobadas:[['B101',5,'20251'],['B101',5,'26/2']]}));
almacen.set('hu.tramite.datos',JSON.stringify({confirmado:true,datos:{paterno:'PRUEBA',materno:'FICTICIA',nombres:'ALUMNA',boleta:'2099000000',carrera:'Ingeniería Biónica',plan:'2009',correo:'ficticio@example.test'}}));
almacen.delete('hu.tramite.dictamen');
vm.runInContext(readFileSync('web/sate/dictamen.js','utf8'),c);
const dic=c.SateDictamen;await dic.cargar();
c.SATE.repintar=()=>modulo.mostrar({tramite:'dictamen'});
modulo.mostrar({tramite:'dictamen'});
assert.ok(box.querySelector('form'),'Dictamen pide el contacto dentro del paso');
assert.ok(box.todos().some(n=>n.name==='celular'));assert.ok(box.todos().some(n=>n.name==='telefono'));
box.querySelector('form').onsubmit({preventDefault(){}});
assert.ok(box.todos().some(n=>n.tagName==='h3'&&n.textContent==='¿Qué necesitas?'),'Guardar conserva el asistente de dictamen en la misma ruta');
assert.equal(box.querySelector('form'),null,'El contacto guardado no vuelve a preguntarse');
modulo.ocultar();
assert.equal(dic.sugerir({nDes:1}).tipo,'interno');
assert.equal(dic.sugerir({nDes:1,riesgoBajaDefinitiva:true}).tipo,'externo');
assert.equal(dic.sugerir({revocacion:true}).tipo,'externo');assert.equal(dic.sugerir(null).tipo,'');
const dd=dic.definir();assert.equal(dd.pasos.length+1,5);assert.equal(dd.datos.tipo,'interno');
assert.equal(dd.datos.filas.length,1);assert.equal(dd.datos.filas[0].nivel,'1');
assert.equal(dd.datos.filas[0].cursada,'25/1');assert.equal(dd.datos.filas[0].recursada,'26/2');
assert.equal(dd.datos.ingreso,'24/2');
const demo={upiita_saes:1,unidad:'upiita',carrera:'B',plan:'2009',reprobadas:[],reprobadas_periodo:[['B211','26/1',1]],acreditadas:[['B101',8,'24/1']]};
c.SATE.alumno=()=>demo;
c.situacionDatos=()=>({adeudos:['B211'],fis:[{k:'B211',veces:1}],nDes:0});
const demoDef=dic.definir();assert.equal(demoDef.datos.filas[0].clave,'B211');assert.equal(demoDef.datos.filas[0].cursada,'26/1');assert.equal(demoDef.datos.filas[0].recursada,'','No se inventa un recursamiento si solo se cursó una vez');assert.equal(demoDef.datos.ingreso,'24/1');
await demoDef.generar({...demoDef.datos,tipo:'interno',peticion:'Solicito regularizar mi situación escolar.',motivos:'Motivos ficticios.'});
assert.equal(estampados.at(-2).valores.filas[0].cursada,'26/1','El periodo llega al estampado PDF');assert.equal(estampados.at(-2).valores.ingreso,'24/1');
assert.equal(dic.pendientes({...demo,reprobadas_periodo:[['B211','26/2',2]],kardex_reprobadas:[['B211',5,'25/2']]},c.SATE_DATA.dictamen.materias)[0].recursada,'26/2');
assert.equal(dic.pendientes({...demo,reprobadas_periodo:[],desfasadas_saes:[['B211','25/1',1]]},c.SATE_DATA.dictamen.materias)[0].cursada,'25/1');
const demoBox=new Nodo('div'),demoCtx={datos:{filas:plano(demoDef.datos.filas)},cambiar(v){this.datos.filas=v}};
demoDef.pasos[1].campos[0].pintar(demoBox,demoCtx);
assert.equal(demoBox.todos().filter(n=>n.type==='checkbox').length,1,'Solo el adeudo, no las 79 materias');
assert.ok(demoBox.todos().find(n=>n.type==='checkbox').checked);
const demoBuscar=demoBox.todos().find(n=>n.type==='search');demoBuscar.value='B';demoBuscar.oninput();
assert.ok(demoBox.todos().filter(n=>n.type==='checkbox').length<=9,'Hasta ocho resultados más la pendiente');
const agregarDemo=demoBox.todos().find(n=>n.type==='checkbox'&&!n.checked);agregarDemo.checked=true;agregarDemo.onchange();assert.equal(demoCtx.datos.filas.length,2);assert.equal(demoBuscar.value,'');
assert.equal(demoBox.todos().filter(n=>n.type==='checkbox').length,2);
assert.ok(demoCtx.datos.filas.every(r=>demoBox.todos().some(n=>n.textContent.startsWith(r.nombre))));
assert.equal(dic.pendientes(demo,c.SATE_DATA.dictamen.materias,{adeudos:[]}).length,0,'El núcleo prevalece');
const repNombre={...demo,reprobadas_periodo:[],reprobadas:[[demoDef.datos.filas[0].nombre,5]]};
assert.equal(dic.pendientes(repNombre,c.SATE_DATA.dictamen.materias)[0].clave,'B211');
delete c.SATE.alumno;c.situacionDatos=()=>({nDes:2});
for(const tipo of ['interno','externo'])for(const op of ['inscribir','tiempo']){
 assert.match(dic.plantilla(tipo,'27/1',[{nombre:'X'}],op),/la unidad de aprendizaje X/);
 assert.match(dic.plantilla(tipo,'27/1',[{nombre:'X'},{nombre:'Y'},{nombre:'Z'}],op),/las unidades de aprendizaje X, Y y Z/);
}
assert.match(dic.plantilla('interno','27/1',dd.datos.filas),/BIOLOGIA CELULAR/);
assert.match(dic.plantilla('externo','27/1',dd.datos.filas),/Consejo General Consultivo/);
assert.match(dic.plantilla('interno','27/1',dd.datos.filas,'tiempo'),/ampliación/);
const dm=t.modelo(dd,null);dm.datos.filas=Array.from({length:9},()=>dd.datos.filas[0]);
assert.ok(dm.validar(dm.campos.find(f=>f.id==='filas')));dm.datos.filas=dd.datos.filas;
for(const f of dd.pasos[2].campos.filter(f=>f.visible?.({tipo:'externo'})))assert.equal(f.sensible,true,f.id);
dm.datos.tipo='externo';dm.datos.domicilio='DOMICILIO-SENSIBLE-FICTICIO';dm.datos.causas=['salud'];dm.guardar();
assert.ok(!almacen.get('hu.tramite.dictamen').includes('SENSIBLE'));assert.ok(!almacen.get('hu.tramite.dictamen').includes('salud'));
assert.equal(t.modelo(dd).datos.domicilio,'');
const pet=dm.campos.find(f=>f.id==='peticion');dm.datos.peticion='a\nb\nc\nd\ne';
assert.ok(dm.validar(pet));dm.datos.tipo='interno';assert.equal(dm.validar(pet),'');
assert.equal(dic.medir('a\nb\nc\nd\ne','interno').renglones.length,5);
assert.equal(dic.medir('W'.repeat(300),'interno').ok,false);
almacen.delete('hu.tramite.dictamen');
const asist=t.asistente(box,dd),ad=asist.modelo.datos;
ad.anteriores='No';ad.ingreso='24/1';ad.peticion=dic.plantilla('interno','27/1',ad.filas);ad.motivos='Motivo ficticio para la prueba.';
// Abrir revisión mediante los botones del asistente.
for(let i=0;i<4;i++)box.todos().find(n=>n.tagName==='button'&&n.textContent==='Continuar').click();
assert.equal(asist.modelo.paso,4);
assert.equal(box.querySelector('[data-descargar]').textContent,'Descargar mi solicitud (PDF)');
const antesDescarga=estampados.length;await asist.descargar();assert.equal(estampados.length,antesDescarga,'La confirmación es obligatoria');
const confirmar=box.todos().find(n=>n.tagName==='input'&&n.type==='checkbox');confirmar.checked=true;confirmar.onchange();
await cancelar(()=>asist.descargar());assert.equal(estampados.length,antesDescarga);
await aceptar(()=>asist.descargar());
assert.equal(estampados.at(-2).tipo,'interno');assert.equal(estampados.at(-1).tipo,'carta');
assert.equal(uniones.at(-1).pdfs.length,2);assert.equal(uniones.at(-1).op,undefined,'La unión no agrega instrucciones');
assert.equal(dd.archivo(ad),'dictamen-interno-2099000000.pdf');
assert.ok(!almacen.get('hu.tramite.dictamen').includes('Motivo ficticio'));
asist.destruir();t.mostrarLista(box);assert.ok(box.todos().some(n=>n.textContent==='Listo para imprimir'));
const antesLista=estampados.length;
await aceptar(()=>box.todos().find(n=>n.tagName==='button'&&n.textContent==='Descargar').onclick());
assert.equal(estampados.length,antesLista+2,'Descargar desde la lista genera formato y carta otra vez');
assert.equal(estampados.at(-1).valores.motivos,'Motivo ficticio para la prueba.','Descarga desde lista conserva sensibles en memoria');
assert.equal(t.modelo(dd).datos.motivos,'Motivo ficticio para la prueba.','Listo conserva sensibles únicamente en memoria de esta página');
const campoFilas=dd.pasos[1].campos[0],candidatas=Object.entries(c.SATE_DATA.dictamen.materias).filter(([k])=>k.startsWith('B|09|')).slice(0,9).map(([k,[nombre,nivel]])=>({clave:k.split('|')[2],nombre,nivel,cursada:'',recursada:''}));
const contMaterias=new Nodo('div'),ctxMaterias={datos:{filas:candidatas.slice(0,8)},cambiar(v){this.datos.filas=v}};
campoFilas.pintar(contMaterias,ctxMaterias);
const buscarNovena=contMaterias.todos().find(n=>n.type==='search');buscarNovena.value=candidatas[8].clave;buscarNovena.oninput();
const novena=contMaterias.todos().find(n=>n.tagName==='input'&&n.type==='checkbox'&&!n.checked);novena.checked=true;novena.onchange();
assert.equal(ctxMaterias.datos.filas.length,8);assert.equal(novena.checked,false);
assert.ok(contMaterias.todos().some(n=>n.textContent.includes('Quita una materia')));
const pasoMotivos=dd.pasos[3],ctxGuia={datos:{paso:'',acciones:'',compromiso:'',motivos:''}},contGuia=new Nodo('div');
for(const id of ['paso','acciones','compromiso','motivos']){
 const f=pasoMotivos.campos.find(c=>c.id===id);f.pintar(contGuia,{datos:ctxGuia.datos,cambiar(v){ctxGuia.datos[id]=v}});
}
contGuia.todos().find(n=>n.tagName==='textarea').value='Situación ficticia';contGuia.todos().find(n=>n.tagName==='textarea').oninput();
assert.equal(contGuia.querySelector('#dictamen-motivos').value,'Por medio de la presente expongo los motivos de mi solicitud de dictamen.\n\nSituación ficticia');
assert.deepEqual(contGuia.todos().filter(n=>n.tagName==='textarea').slice(0,3).map(n=>n.placeholder),['Durante el periodo … ','Para regularizarme, he … ','Me comprometo a … ']);
ctxGuia.datos.compromiso='estudiar cada día';contGuia.todos().find(n=>n.textContent==='Armar la carta con mis respuestas').click();
assert.match(ctxGuia.datos.motivos,/Me comprometo a estudiar cada día$/);
ctxGuia.datos.compromiso='Me comprometo a cumplir';contGuia.todos().find(n=>n.textContent==='Armar la carta con mis respuestas').click();assert.ok(!ctxGuia.datos.motivos.includes('Me comprometo a Me comprometo'));
const ex=t.modelo({...dd,id:'dictamen-externo-prueba'},null);Object.assign(ex.datos,{tipo:'externo',filas:dd.datos.filas,periodo:'27/1',peticion:'Solicito revisión de mi situación escolar.',motivos:'Motivos ficticios.',organo:'cgc',dependientes:'no_contestar',embarazo:'no_contestar',situacion:['s5'],causas:['salud'],anexos:['carta_anexo']});
await dd.generar(ex.datos);assert.equal(estampados.at(-2).tipo,'externo');assert.equal(estampados.at(-2).valores.organo[0],'cgc');
assert.equal(uniones.at(-1).op,undefined);assert.equal(uniones.at(-1).pdfs.length,2);
ex.guardar();assert.ok(!almacen.get('hu.tramite.dictamen-externo-prueba').includes('salud'));
assert.ok(!almacen.get('hu.tramite.dictamen-externo-prueba').includes('Motivos ficticios'));
// Una recarga real crea otro contexto: no recupera la carta ni las respuestas sensibles.
const recarga=vm.createContext({console,Date,document:{},localStorage:c.localStorage,IPNT:c.IPNT,SATE:{texto,pestana(){}}});
vm.runInContext(readFileSync('web/sate/tramites.js','utf8'),recarga);
assert.equal(recarga.SateTramites.modelo(dd).datos.motivos,'');
console.log('Dictamen V2: sugerencia, catálogo, periodos, límite 8, privacidad, plantillas, medidor, confirmación y PDF único correctos.');
