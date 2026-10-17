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
const c=vm.createContext({SateUI:{modal(titulo,contenido,op){dialogo={titulo,contenido,...op}},tarjetaNav(o){const a=new Nodo('a');a.href=o.href;a.className='sate-tarjeta-nav';return a}},console,setTimeout:(fn,ms)=>{const h=setTimeout(fn,ms);if(ms>=30000)h.unref();return h},clearTimeout,Blob,Date,
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
const filasLista=()=>box.todos().filter(n=>n.tagName==='li'&&n.className==='tramite-fila');
const rotulos=()=>box.todos().filter(n=>n.tagName==='h3').map(n=>n.textContent);
assert.equal(filasLista().length,4,'Los trámites aparecen una sola vez en la portada');
assert.deepEqual(rotulos(),['Revisar mi situación escolar','Solicitar una baja','Acreditar actividades electivas']);
assert.equal(box.todos().filter(n=>n.tagName==='button').length,4,'Cada trámite abre su resumen');
assert.ok(box.todos().some(n=>n.textContent==='Te aplica · Causal ficticia'));
assert.ok(!box.todos().some(n=>n.tagName==='h3'&&n.textContent==='En curso y terminados'),'La portada no repite la lista por estado');
almacen.set('hu.tramite.dictamen',JSON.stringify({paso:1,total:4,actualizado:Date.now()-300000}));
almacen.set('hu.tramite.electivas',JSON.stringify({listo:true}));t.mostrarLista(box);
assert.equal(box.todos().filter(n=>n.tagName==='button').length,4);
assert.ok(box.todos().some(n=>n.textContent.includes('Paso 2 de 4 · guardado hace 5 min')));
assert.deepEqual(rotulos(),['Revisar mi situación escolar','Solicitar una baja','Acreditar actividades electivas']);
assert.ok(box.todos().some(n=>n.textContent==='En progreso'));
assert.ok(box.todos().some(n=>n.textContent==='Listo para imprimir'));
assert.ok(box.todos().filter(n=>n.tagName==='button'&&n.attrs['aria-label']).every(n=>n.attrs['aria-label'].includes('. ')),'Cada botón identifica el trámite y su propósito');
aplicacion={aplica:false,motivo:'Motivo ficticio'};t.mostrarLista(box);
assert.equal(filasLista().length,4);assert.equal(box.todos().filter(n=>n.tagName==='button').length,4,'El resumen sigue disponible aunque el trámite no aplique');
assert.ok(box.todos().some(n=>n.textContent==='No aplica'));
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
box.todos().find(n=>n.textContent==='Continuar trámite'&&n.tagName==='button').click();
assert.equal(a.modelo.paso,1);const secreto=box.querySelector('input');secreto.value='SENSIBLE-FICTICIO';secreto.oninput();secreto.onblur();
assert.ok(!almacen.get('hu.tramite.ejemplo-prueba').includes('SENSIBLE'));assert.ok(!almacen.get('hu.tramite.ejemplo-prueba').includes('secreto'));
box.todos().find(n=>n.textContent==='Continuar trámite'&&n.tagName==='button').click();
assert.equal(a.modelo.paso,2);assert.ok(box.querySelector('dl'));
box.todos().find(n=>n.textContent==='Cambiar'&&n.tagName==='button').click();assert.equal(a.modelo.paso,0);
assert.equal(t.modelo(def).datos.secreto,'','Los sensibles no reaparecen después de recargar');
await new Promise(r=>setTimeout(r,350));assert.equal(box.querySelector('iframe'),null,'Sin vista previa ni «Ver formato» antes del último paso');
assert.ok(!box.todos().some(n=>n.textContent==='Ver formato'));
a.destruir();assert.equal(a.modelo.datos.secreto,'');
almacen.delete('hu.tramite.ejemplo-prueba');
const defListo={id:'listo-prueba',titulo:'Listo',pasos:[{titulo:'Pregunta',campos:[{id:'dato',texto:'Dato',requerido:true}]}],generar:async()=>new Uint8Array([37,80,68,70])};
const listo=t.asistente(box,defListo);box.querySelector('input').value='Ficticio';box.querySelector('input').oninput();box.todos().find(n=>n.textContent==='Continuar trámite').click();await cancelar(()=>listo.descargar());assert.equal(JSON.parse(almacen.get('hu.tramite.listo-prueba')).listo,false);await aceptar(()=>listo.descargar());
assert.equal(JSON.parse(almacen.get('hu.tramite.listo-prueba')).listo,true,'Listo solo tras generación correcta');listo.destruir();
let generadoDesdeLista=0;t.registrar({...defListo,id:'electivas',generar:async()=>{generadoDesdeLista++;return new Uint8Array([37,80,68,70])}});
almacen.set('hu.tramite.electivas',JSON.stringify({listo:true,paso:1,total:2,datos:{dato:'Ficticio'}}));t.mostrarLista(box);
dialogo=null;box.todos().find(n=>n.tagName==='button'&&n.attrs['aria-label']?.startsWith('Electivas. ')).click();
assert.ok(dialogo.contenido.todos().some(n=>n.tagName==='ol'&&n.children.length===2));assert.equal(dialogo.acciones[0].texto,'Empezar');dialogo.acciones[0].onclick();
assert.equal(ir,'tramites/electivas');assert.equal(generadoDesdeLista,0,'La portada abre el proceso; no genera el PDF desde la lista');
const invalido=t.asistente(box,{...defListo,id:'preview-invalida',datos:{dato:'Ficticio'}});
await new Promise(r=>setTimeout(r,350));assert.equal(box.querySelector('iframe'),null,'Sin vista previa en un paso de captura');
invalido.destruir();
const errorDef={id:'error-prueba',titulo:'Error',pasos:[{titulo:'Pregunta',campos:[{id:'dato',texto:'Dato',requerido:true}]}]};
const b=t.asistente(box,errorDef);box.todos().find(n=>n.textContent==='Continuar trámite').click();assert.equal(b.modelo.paso,0);assert.equal(foco,box.querySelector('input'));b.destruir();
const css=readFileSync('web/sate/componentes.css','utf8');assert.match(css,/@media\(min-width:1025px\)/);assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
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
// Este ensayo monta directamente el detalle, después de la carga que realiza el router.
for(const tramite of ['dictamen','bajas'])c.SATE_DATA[tramite].pdfs=JSON.parse(readFileSync('web/dist/sate/datos/upiita/'+tramite+'-pdf.json','utf8'));
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
aplicacion=null;t.mostrarLista(box);
const botonDictamen=box.todos().find(n=>n.tagName==='button'&&n.className.includes('tramite-fila-boton')&&n.attrs['aria-label']?.startsWith('Dictamen. '));
assert.ok(botonDictamen,'La portada agrupa los trámites por intención');
botonDictamen.click();
assert.equal(dialogo.titulo,'Dictamen');
assert.ok(dialogo.contenido.todos().some(n=>n.tagName==='ol'&&n.children.length===5),'El resumen muestra los pasos numerados del trámite');
assert.ok(dialogo.contenido.todos().some(n=>n.textContent.includes('Entrega original y copia')),'El resumen incluye los documentos existentes');
assert.equal(dialogo.acciones[0].texto,'Empezar');dialogo.acciones[0].onclick();assert.equal(ir,'tramites/dictamen');
dialogo=null;
c.SATE.repintar=()=>modulo.mostrar({tramite:'dictamen'});
modulo.mostrar({tramite:'dictamen'});
const volverVentanilla=box.todos().find(n=>n.tagName==='button'&&n.textContent==='Volver a la Ventanilla');
assert.ok(volverVentanilla,'El proceso conserva un botón de regreso arriba');volverVentanilla.click();assert.equal(ir,'tramites');
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
for(let i=0;i<4;i++)box.todos().find(n=>n.tagName==='button'&&n.textContent==='Continuar trámite').click();
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
dialogo=null;box.todos().find(n=>n.tagName==='button'&&n.attrs['aria-label']?.startsWith('Dictamen. ')).click();
assert.equal(dialogo.titulo,'Dictamen');dialogo.acciones[0].onclick();assert.equal(ir,'tramites/dictamen');
assert.equal(t.modelo(dd).datos.motivos,'Motivo ficticio para la prueba.','Listo conserva sensibles únicamente en memoria de esta página');
const campoFilas=dd.pasos[1].campos[0],candidatas=Object.entries(c.SATE_DATA.dictamen.materias).filter(([k])=>k.startsWith('B|09|')).slice(0,9).map(([k,[nombre,nivel]])=>({clave:k.split('|')[2],nombre,nivel,cursada:'',recursada:''}));
const contMaterias=new Nodo('div'),ctxMaterias={datos:{filas:candidatas.slice(0,8)},cambiar(v){this.datos.filas=v}};
campoFilas.pintar(contMaterias,ctxMaterias);
const buscarNovena=contMaterias.todos().find(n=>n.type==='search');buscarNovena.value=candidatas[8].clave;buscarNovena.oninput();
const novena=contMaterias.todos().find(n=>n.tagName==='input'&&n.type==='checkbox'&&!n.checked);novena.checked=true;novena.onchange();
assert.equal(ctxMaterias.datos.filas.length,8);assert.equal(novena.checked,false);
assert.ok(contMaterias.todos().some(n=>n.textContent.includes('Quita una materia')));
const pasoMotivos=dd.pasos[3],ctxGuia={datos:{...dd.datos,motivos:'Texto ficticio propio'}},contGuia=new Nodo('div');
pasoMotivos.campos.find(f=>f.id==='motivos').pintar(contGuia,{datos:ctxGuia.datos,cambiar(v){ctxGuia.datos.motivos=v}});
assert.ok(contGuia.todos().some(n=>n.tagName==='summary'&&n.textContent==='Ayúdame a redactarla'));
assert.equal(contGuia.todos().filter(n=>n.tagName==='textarea').length,1,'Solo el editor está siempre visible');
contGuia.todos().find(n=>n.tagName==='button').click();assert.equal(ctxGuia.datos.motivos,'Texto ficticio propio','Sin respuestas se conserva la carta');
Object.assign(dm.datos,{carta_respuestas:{causas:['salud'],acciones:'ACCIONES-SENSIBLES-FICTICIAS'}});dm.guardar();
assert.equal(pasoMotivos.campos.find(f=>f.id==='carta_respuestas').sensible,true);
assert.ok(!almacen.get('hu.tramite.dictamen').includes('ACCIONES-SENSIBLES'));
assert.equal(t.modelo({...dd,id:'dictamen-carta-recarga'},JSON.parse(almacen.get('hu.tramite.dictamen'))).datos.carta_respuestas,'','Las respuestas no se recuperan del almacenamiento');
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

// DIC2: elección guiada, formato nunca en blanco, motivo de la petición, anexos en un solo PDF y regreso a la lista.
{
  const dd3=dic.definir(),pasoTipo=dd3.pasos[0].campos.find(f=>f.id==='tipo');
  const cajaTipo=new Nodo('div');pasoTipo.pintar(cajaTipo,{datos:{tipo:'interno'},cambiar(){}});
  const enlaces=cajaTipo.todos().filter(n=>n.tagName==='a');
  assert.equal(enlaces.length,c.SATE_DATA.dictamen.motivos.interno.length+c.SATE_DATA.dictamen.motivos.externo.length,'Cada situación enlaza su fundamento');
  assert.ok(enlaces.every(a=>/^https:\/\/www\.ipn\.mx\/assets\/files\/normatividad\/docs\/reglamentos\/.+\.pdf$/.test(a.href)&&a.target==='_blank'&&a.rel==='noopener'));
  for(const m of [...c.SATE_DATA.dictamen.motivos.interno,...c.SATE_DATA.dictamen.motivos.externo]){
    assert.ok(c.SATE_DATA.dictamen.textos['dictamen.motivo_'+m.id],m.id);assert.ok(c.SATE_DATA.dictamen.textos['dictamen.fund_'+m.id],m.id);
  }
  assert.ok(cajaTipo.todos().some(n=>n.textContent.includes('art. 98')),'El fundamento aparece junto a la situación');
  assert.ok(cajaTipo.todos().filter(n=>n.tagName==='li').length>=5);

  // Sin tipo: no se puede ver ni generar; el motivo se explica y nunca se arma una hoja vacía.
  const sinTipo={...dd3,id:'dictamen-sin-tipo',datos:{...dd3.datos,tipo:''}};
  const a1=t.asistente(box,sinTipo);
  assert.equal(!box.querySelector('[data-ver-formato]')||box.querySelector('[data-ver-formato]').disabled,true);
  assert.match(box.querySelector('[data-pdf-falta]').textContent,/elegir el tipo de dictamen/);
  assert.match(dd3.faltante({...dd3.datos,tipo:''}),/elegir el tipo/);
  assert.equal(dd3.faltante({...dd3.datos,tipo:'interno'}),'','Con tipo, datos, materia y periodo ya se puede ver el formato');
  assert.match(dd3.faltante({...dd3.datos,tipo:'interno',peticion:''},true),/tu petición/);
  assert.match(dd3.faltante({...dd3.datos,tipo:'interno',filas:[]}),/al menos una materia/);
  assert.match(dd3.faltante({...dd3.datos,tipo:'interno',periodo:''}),/periodo/);
  await assert.rejects(()=>dd3.generar({...dd3.datos,tipo:''}));
  await assert.rejects(()=>dd3.previsualizar({...dd3.datos,tipo:''}));
  a1.modelo.datos.tipo='interno';await new Promise(r=>setTimeout(r,450));
  assert.equal(box.querySelector('[data-ver-formato]'),null,'«Ver formato» solo aparece en el último paso');
  a1.destruir();

  // Motivo de la petición: lo detectado en el kárdex o un motivo propio.
  const d={...dd3.datos,tipo:'interno',periodo:'27/1',peticion:'',propuesta:'',peticion_origen:''};
  dd3.preparar(d,3);
  assert.equal(d.peticion_origen,'detectado');assert.match(d.peticion,/BIOLOGIA CELULAR \(cursada en 25\/1; recursada en 26\/2\)/,'Usa materias y periodos reales');
  assert.ok(!/Expongo mis motivos/.test(d.peticion));
  const cajaPet=new Nodo('div'),ctxPet={datos:d,cambiar(v){if(arguments.length)d.peticion=v}};
  const campoPet=dd3.pasos[3].campos.find(f=>f.id==='peticion');
  campoPet.pintar(cajaPet,ctxPet);
  const radios=cajaPet.todos().filter(n=>n.type==='radio');assert.deepEqual(radios.map(r=>r.value),['detectado','otro']);
  assert.deepEqual(cajaPet.todos().filter(n=>n.tagName==='span').map(n=>n.textContent).slice(0,2),['Por lo que SATE detectó en tu kárdex','Otro motivo']);
  assert.ok(cajaPet.todos().some(n=>n.textContent==='Proponer ampliación de tiempo'));
  radios[1].checked=true;radios[1].onchange();assert.equal(d.peticion_origen,'otro');assert.equal(d.peticion,'','Otro motivo parte de un texto libre vacío');
  dd3.preparar(d,3);assert.equal(d.peticion,'','En otro motivo no se autocompleta');
  const cajaOtro=new Nodo('div');campoPet.pintar(cajaOtro,ctxPet);
  assert.ok(!cajaOtro.todos().some(n=>n.textContent==='Proponer ampliación de tiempo'));assert.ok(cajaOtro.todos().some(n=>/renglones/.test(n.textContent)),'Medidor de renglones disponible');
  radios[0].checked=true;radios[0].onchange();assert.match(d.peticion,/BIOLOGIA CELULAR/);
  assert.equal(dic.plantilla('interno','27/1',[]),'','Sin materias no hay texto de relleno');

  // Anexos: un PDF de 2 páginas y una imagen se unen con formato y carta (1 + 1 + 2 + 1 páginas).
  const paginasDe=b=>+(/PAGES=(\d+)/.exec(String.fromCharCode(...b))?.[1]||1);
  let ultimaImagen;
  const crear=()=>{let n=0;const doc={
    embedJpg:async()=>({width:2000,height:1000}),embedPng:async()=>({width:100,height:300}),
    embedFont:async()=>({widthOfTextAtSize:(s,size)=>s.length*size*.5}),
    addPage(arg){n++;return arg&&arg.indice!==undefined?arg:{drawImage:(img,o)=>{ultimaImagen={a:arg,o}}}},
    getPageIndices:()=>Array.from({length:n},(_,i)=>i),copyPages:async(src,idx)=>idx.map(indice=>({indice})),
    save:async()=>new TextEncoder().encode('%PDF PAGES='+n),fijar(v){n=v}};return doc};
  c.PDFLib={PDFDocument:{create:async()=>crear(),load:async b=>{const doc=crear();doc.fijar(paginasDe(b));return doc}},StandardFonts:{Helvetica:'Helvetica'}};
  vm.runInContext(readFileSync('web/tramites/pdf-comun.js','utf8'),c);
  const pdfFicticio=new TextEncoder().encode('%PDF-1.4 PAGES=2'),jpgFicticio=Uint8Array.from([0xFF,0xD8,0xFF,0xE0,0,0,0,0]),pngFicticio=Uint8Array.from([0x89,0x50,0x4E,0x47,13,10,26,10,0]),txtFicticio=new TextEncoder().encode('no soy un anexo');
  const archivo=(name,bytes)=>({name,size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length)});
  const dAnexo={...dd3.datos,tipo:'interno',periodo:'27/1',peticion:'Solicito regularizar mi situación.',motivos:'Motivos ficticios.',peticion_origen:'otro',adjuntos:''};
  const cajaAnexos=new Nodo('div'),campoAnexos=dd3.pasos[3].campos.find(f=>f.id==='adjuntos');
  campoAnexos.pintar(cajaAnexos,{datos:dAnexo,cambiar(v){dAnexo.adjuntos=v}});
  assert.ok(cajaAnexos.todos().some(n=>n.textContent==='Tus documentos se procesan en tu navegador; no se suben ni se guardan en ningún servidor.'));
  assert.ok(cajaAnexos.todos().some(n=>n.textContent==='Anexos (opcional)'));
  const entrada=cajaAnexos.todos().find(n=>n.type==='file');assert.equal(entrada.multiple,true);
  entrada.files=[archivo('constancia.pdf',pdfFicticio),archivo('credencial.jpg',jpgFicticio),archivo('nota.txt',txtFicticio)];
  await entrada.onchange();
  assert.deepEqual(Array.from(dAnexo.adjuntos,a=>a.nombre),['constancia.pdf','credencial.jpg'],'El .txt se rechaza');
  assert.equal(dAnexo.adjuntos[0].paginas,2);
  assert.match(cajaAnexos.todos().find(n=>n.attrs.role==='status').textContent,/nota\.txt: solo se admiten PDF, JPG y PNG/);
  const boton=(texto,etiqueta)=>cajaAnexos.todos().find(n=>n.tagName==='button'&&n.attrs['aria-label']===texto+': '+etiqueta);
  assert.equal(boton('Subir','constancia.pdf').disabled,true,'El primero no sube');
  boton('Subir','credencial.jpg').onclick();assert.deepEqual(Array.from(dAnexo.adjuntos,a=>a.nombre),['credencial.jpg','constancia.pdf'],'Las flechas reordenan');
  const filasAnexo=cajaAnexos.todos().filter(n=>n.tagName==='li');filasAnexo[1].ondragstart({dataTransfer:{setData(){}}});filasAnexo[0].ondrop({preventDefault(){}});
  assert.deepEqual(Array.from(dAnexo.adjuntos,a=>a.nombre),['constancia.pdf','credencial.jpg'],'Arrastrar reordena');
  entrada.files=[archivo('foto.png',pngFicticio)];await entrada.onchange();assert.equal(dAnexo.adjuntos.length,3);
  boton('Quitar','foto.png').onclick();assert.equal(dAnexo.adjuntos.length,2);
  const pdfFinal=await dd3.generar(dAnexo);
  assert.equal(paginasDe(pdfFinal),5,'Formato 1 + carta 1 + PDF de 2 + imagen de 1 = 5 páginas');
  assert.deepEqual(Array.from(ultimaImagen.a),[612,792],'La imagen va en una hoja carta');
  assert.ok(ultimaImagen.o.width<=540&&ultimaImagen.o.height<=720&&ultimaImagen.o.x>=36,'La imagen cabe dentro de los márgenes');
  assert.equal(paginasDe(await dd3.generar({...dAnexo,adjuntos:[]})),2,'Sin anexos solo formato y carta');
  assert.equal(paginasDe(await dd3.previsualizar(dAnexo)),2,'La vista previa no incluye anexos');
  await assert.rejects(()=>dd3.generar({...dAnexo,adjuntos:[{id:'inexistente',nombre:'x.pdf',tipo:'pdf',paginas:1,peso:1}]}),'Un anexo perdido no se omite en silencio');
  for(const [k,v] of almacen)assert.ok(!v.includes('constancia.pdf')&&!v.includes('credencial.jpg'),'Ningún anexo en el almacenamiento: '+k);

  // Regreso a Ventanilla arriba, junto al título del proceso.
  const a2=t.asistente(box,dd3);
  const regresos=box.todos().filter(n=>n.tagName==='button'&&n.textContent==='Volver a la Ventanilla');
  assert.equal(regresos.length,1);
  assert.equal(box.todos().find(n=>n.className.includes('tramite-guia'))?.href,'#/upiita/guia/situacion/que-es-dictamen','El dictamen enlaza a su respuesta de la Guía');
  assert.ok(regresos.every(n=>n.className.includes('sate-volver')),'«Volver» es un botón del sistema');
  assert.equal(box.children[0].className,'tramite-encabezado');assert.equal(box.children[0].children[0].textContent,'Solicitud de dictamen');
  assert.ok(box.children[0].children.includes(regresos[0]),'Arriba, a la altura del título');
  assert.equal(box.children.at(-1).className,'tramite-proceso');
  ir=null;regresos[0].click();assert.equal(ir,'tramites');
  a2.destruir();
  const css2=readFileSync('web/sate/componentes.css','utf8');
  assert.match(css2,/\.tramite-proceso\{[^}]*grid-template-columns/);assert.match(css2,/\.tramite-encabezado\{[^}]*justify-content:space-between/);
  console.log('Dictamen DIC2: fundamento por situación, formato nunca en blanco, motivo detectado u otro, anexos unidos en un PDF y regreso arriba y abajo correctos.');
}

// VEN1: bajas con el mismo asistente, portada por grupos y pasos navegables.
{
  const bajasEstampadas=[];
  c.PdfBajas={generar:async d=>{bajasEstampadas.push(d);return new Uint8Array([37,80,68,70])}};
  vm.runInContext(readFileSync('web/sate/bajas.js','utf8'),c);
  const B=c.SateBajas,codigoBajas=readFileSync('web/sate/bajas.js','utf8');
  almacen.set('saes.alumno',JSON.stringify({upiita_saes:1,unidad:'upiita',periodo_actual:'27/1'}));
  almacen.set('hu.tramite.datos',JSON.stringify({confirmado:true,datos:{paterno:'PRUEBA',materno:'FICTICIA',nombres:'ALUMNA',boleta:'2099000000',carrera:'Ingeniería Biónica',plan:'2009',correo:'ficticio@example.test'}}));
  for(const id of ['baja_temporal','baja_definitiva'])almacen.delete('hu.tramite.'+id);
  assert.equal(B.urlFormato('temporal'),'https://www.upiita.ipn.mx/adjuntos/gestion_escolar/2026/BAJA%20TEMPORAL%2026-2_2.pdf','La URL sale de data/gestion_escolar/bajas.json');
  assert.equal(B.urlFormato('definitiva'),'https://www.upiita.ipn.mx/adjuntos/gestion_escolar/2026/BAJA%20DEFINITIVA_2.pdf');
  assert.deepEqual(plano(B.periodos()),['27/1','27/2','28/1']);
  assert.equal(B.validarIdentidad(),'');
  // Todo texto visible de bajas.js existe en es.toml (claves estáticas y las que se arman con id).
  const claves=new Set([...codigoBajas.matchAll(/tx\('([a-z0-9_]+)'(?!\s*\+)/g)].map(m=>m[1]));
  for(const tipo of ['temporal','definitiva']){
    for(const k of ['titulo_','lead_','paso_motivo_ayuda_','periodo_texto_'])claves.add(k+tipo);
    for(const n of [1,2,3])claves.add('aviso_'+tipo+'_'+n);
    for(const m of B.MOTIVOS[tipo]){claves.add('motivo_'+m);claves.add('motivo_'+m+'_ayuda')}
  }
  for(const k of claves)assert.ok(config.textos['sate.baja.'+k],'Falta la clave sate.baja.'+k);
  for(const id of ['baja_temporal','baja_definitiva'])assert.ok(config.textos['sate.tramite.'+id+'.titulo']&&config.textos['sate.ventanilla.'+id+'_para']);
  assert.ok(config.unidades.upiita.tramites.includes('baja_temporal')&&config.unidades.upiita.tramites.includes('baja_definitiva'));
  assert.equal(config.unidades.upiita.scriptsTramite.baja_temporal,'bajas.js');
  assert.deepEqual(config.unidades.escom.tramites,[],'Las bajas son una capacidad de datos de la unidad, no de todas');

  // Baja temporal paso a paso.
  modulo.mostrar({tramite:'baja_temporal'});
  assert.equal(box.children[0].className,'tramite-encabezado');assert.equal(box.children[0].children[0].textContent,'Baja temporal');
  assert.ok(box.todos().some(n=>n.className==='tramite-lead'),'Frase breve de qué es el trámite');
  const pasosLi=()=>box.todos().filter(n=>n.tagName==='li'&&n.className.startsWith('tramite-paso'));
  assert.equal(pasosLi().length,3);assert.equal(pasosLi()[0].attrs['aria-current'],'step');
  assert.equal(box.todos().filter(n=>n.tagName==='button'&&n.className==='tramite-paso-ir').length,0,'Ningún paso hecho todavía: nada navegable');
  assert.ok(box.querySelector('form'),'Los datos de contacto se piden dentro del primer paso');
  assert.ok(box.todos().some(n=>n.name==='celular'));
  box.querySelector('form').onsubmit({preventDefault(){}});
  assert.equal(box.querySelector('form'),null);
  assert.equal(box.todos().filter(n=>n.className.includes('sate-btn--primario')).length,1,'Un solo botón primario por paso');
  box.todos().find(n=>n.tagName==='button'&&n.textContent==='Continuar trámite').click();
  assert.ok(box.todos().some(n=>n.tagName==='h3'&&n.textContent==='Motivo y periodo'));
  const bloques=box.todos().filter(n=>n.className==='tramite-bloque');assert.equal(bloques.length,3,'Aviso, motivo y periodo: una tarjeta por tema');
  assert.deepEqual(bloques.slice(1).map(n=>n.children[0].textContent),['Motivo','Periodo']);
  assert.ok(box.todos().some(n=>n.tagName==='aside'&&n.className==='tramite-aviso'));
  const radios=box.todos().filter(n=>n.type==='radio');assert.deepEqual(radios.map(r=>r.value),plano(B.MOTIVOS.temporal));
  assert.equal(box.todos().filter(n=>n.tagName==='select').length,2,'Periodo de inicio y periodos solicitados');
  assert.deepEqual(box.todos().filter(n=>n.tagName==='select')[1].children.map(n=>n.value),['1','2'],'Ambas duraciones disponibles');
  assert.deepEqual(box.todos().filter(n=>n.tagName==='option').slice(0,3).map(n=>n.value),['27/1','27/2','28/1']);
  box.todos().find(n=>n.tagName==='button'&&n.textContent==='Continuar trámite').click();
  assert.match(box.querySelector('[data-pdf-estado]').textContent,/Elige el motivo/,'No avanza sin motivo y lo explica');
  radios[0].checked=true;radios[0].onchange();
  box.todos().find(n=>n.tagName==='textarea').value='Texto ficticio sensible';box.todos().find(n=>n.tagName==='textarea').onblur();
  box.todos().find(n=>n.tagName==='button'&&n.textContent==='Continuar trámite').click();
  assert.ok(box.todos().some(n=>n.tagName==='h3'&&n.textContent==='Revisa y descarga el PDF'));
  const guardado=almacen.get('hu.tramite.baja_temporal');
  assert.ok(!guardado.includes('salud')&&!guardado.includes('sensible'),'Motivo y explicación solo viven en memoria');
  assert.ok(guardado.includes('27/1'),'El periodo sí se guarda');
  assert.ok(box.todos().some(n=>n.tagName==='dd'&&n.textContent==='Salud'),'El resumen muestra el motivo');
  assert.ok(box.todos().some(n=>n.tagName==='dd'&&n.textContent==='2099000000'));
  assert.ok(box.querySelector('iframe'),'Vista previa del formato oficial');
  assert.ok(box.querySelector('[data-ver-formato]'));
  assert.equal(box.todos().find(n=>n.className.includes('tramite-imprimible')),undefined,'El resumen no es la salida del trámite');
  const enlace=box.todos().find(n=>n.tagName==='a'&&n.target==='_blank');
  assert.equal(box.todos().find(n=>n.className.includes('tramite-guia'))?.href,'#/upiita/guia/tramites/baja-temporal','La baja temporal enlaza a su respuesta de la Guía');
  assert.equal(enlace.href,B.urlFormato('temporal'));assert.equal(enlace.target,'_blank');assert.equal(enlace.rel,'noopener');assert.ok(!enlace.download,'Solo enlaza el formato; no lo descarga');
  assert.equal(box.todos().filter(n=>n.className.includes('sate-btn--primario')).length,1);
  // Pasos hechos navegables y «Cambiar» lleva al paso de ese dato.
  const hechos=()=>box.todos().filter(n=>n.tagName==='button'&&n.className==='tramite-paso-ir');
  assert.equal(hechos().length,2);assert.ok(hechos()[0].attrs['aria-label'].startsWith('Ir al paso 1'));
  box.todos().find(n=>n.tagName==='button'&&n.attrs['aria-label']==='Cambiar Motivo').click();
  assert.ok(box.todos().some(n=>n.tagName==='h3'&&n.textContent==='Motivo y periodo'));
  assert.equal(hechos().length,1);
  hechos()[0].click();assert.ok(box.todos().some(n=>n.tagName==='h3'&&n.textContent==='Tus datos'));assert.equal(hechos().length,0);
  box.todos().find(n=>n.tagName==='button'&&n.textContent==='Continuar trámite').click();
  assert.equal(box.todos().find(n=>n.type==='radio'&&n.checked)?.value,'salud','Dentro de la sesión se conserva');
  assert.equal(t.modelo(B.definir('temporal')).datos.motivo,'','Al recargar, el motivo sensible se vuelve a preguntar');
  // La descarga marca el trámite como listo y la portada conserva su estado.
  const radiosOtra=box.todos().filter(n=>n.type==='radio');radiosOtra[1].checked=true;radiosOtra[1].onchange();
  box.todos().find(n=>n.tagName==='button'&&n.textContent==='Continuar trámite').click();
  const descargar=box.todos().find(n=>n.tagName==='button'&&n.textContent==='Descargar PDF');
  assert.ok(descargar);await aceptar(()=>descargar.onclick());
  assert.equal(bajasEstampadas.at(-1).tipo,'temporal');
  assert.equal(bajasEstampadas.at(-1).valores.periodos,'27/1');
  const temporal=B.definir('temporal');
  await temporal.generar({motivo:'salud',periodo:'27/2',periodos:'2'});
  assert.equal(bajasEstampadas.at(-1).valores.periodos,'27/2, 28/1','Dos periodos cruzando año');
  await assert.rejects(()=>temporal.generar({motivo:'salud',periodo:'27/2',periodos:'3'}));
  modulo.ocultar();t.mostrarLista(box);
  assert.ok(box.todos().some(n=>n.tagName==='button'&&n.attrs['aria-label']?.startsWith('Baja temporal. ')),'El resumen de baja sigue disponible en la portada');
  assert.ok(box.todos().some(n=>n.textContent==='Listo para imprimir'));
  assert.deepEqual(box.todos().filter(n=>n.tagName==='h3').map(n=>n.textContent),['Revisar mi situación escolar','Solicitar una baja','Acreditar actividades electivas']);

  // Baja definitiva: mismo asistente, motivo propio y enlace a su formato.
  modulo.mostrar({tramite:'baja_definitiva'});
  box.todos().find(n=>n.tagName==='button'&&n.textContent==='Continuar trámite').click();
  assert.deepEqual(box.todos().filter(n=>n.type==='radio').map(r=>r.value),plano(B.MOTIVOS.definitiva));
  assert.equal(box.todos().filter(n=>n.tagName==='select').length,1,'La definitiva no pide periodos solicitados');
  assert.ok(box.todos().some(n=>n.tagName==='li'&&/baja temporal conserva tu lugar/.test(n.textContent)),'Sugiere la baja temporal en tono informativo');
  box.todos().filter(n=>n.type==='radio')[0].checked=true;box.todos().filter(n=>n.type==='radio')[0].onchange();
  box.todos().find(n=>n.tagName==='button'&&n.textContent==='Continuar trámite').click();
  assert.equal(box.todos().find(n=>n.tagName==='a'&&n.target==='_blank').href,B.urlFormato('definitiva'));
  modulo.ocultar();
  // Sin enlace en los datos, se explica en vez de mostrar un botón roto.
  const datosBajas=c.SATE_DATA.bajas;c.SATE_DATA.bajas=undefined;
  modulo.mostrar({tramite:'baja_temporal'});
  assert.ok(box.todos().some(n=>n.tagName==='h3'&&n.textContent==='Revisa y descarga el PDF'),'Reanuda en el último paso con lo capturado en esta sesión');
  assert.equal(box.todos().find(n=>n.tagName==='a'&&n.target==='_blank'),undefined);assert.ok(box.todos().some(n=>/No está disponible el formato/.test(n.textContent)));
  assert.ok(box.querySelector('[data-descargar]').disabled,'Sin original no permite generar una hoja vacía');
  c.SATE_DATA.bajas=datosBajas;modulo.ocultar();
  const definitiva=B.definir('definitiva');
  await definitiva.generar({motivo:'personal',periodo:'27/1',explicacion:'Caso ficticio'});
  assert.match(bajasEstampadas.at(-1).valores.motivos,/Periodo solicitado: 27\/1/,'La definitiva conserva el periodo en motivos');
  const pantallaError=new Nodo('section');definitiva.revisar(pantallaError);
  const bibliotecaBajas=c.PdfBajas;
  c.PdfBajas={generar:async()=>{throw new Error(texto('sate.baja.exceso'))}};
  await assert.rejects(()=>definitiva.generar({motivo:'personal',periodo:'27/1'}));
  assert.equal(pantallaError.children[0].textContent,texto('sate.baja.exceso'),'El usuario ve la causa concreta del fallo');
  c.PdfBajas=bibliotecaBajas;
  // CSS: pasos, tarjetas, impresión y foco con tokens.
  const cssV=readFileSync('web/sate/componentes.css','utf8');
  for(const regla of [/\.tramite-bloque\{/,/\.tramite-rejilla\{/,/\.tramite-fila\{/,/\.tramite-paso-ir\{/,/@media print\{/,/\.tramite-solo-impresion\{display:none\}/,/\.tramite-guardado\{/])assert.match(cssV,regla);
  console.log('Ventanilla BAJ2: bajas oficiales en PDF, uno o dos periodos, pasos, privacidad y descarga correctos.');
}
