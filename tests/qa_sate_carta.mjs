// Prueba local sin navegador ni dependencias: plantillas reales y eventos del editor.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync('web/sate/dictamen.js','utf8');
const toml=readFileSync('contenido/textos/es.toml','utf8').split('[dictamen]')[1].split(/\n\[/)[0];
const textos=Object.fromEntries([...toml.matchAll(/^(\w+) = (".*")$/gm)].map(([,k,v])=>['dictamen.'+k,JSON.parse(v)]));
class Nodo{
  constructor(tag){this.tag=tag;this.children=[];this.value=''}
  appendChild(n){this.children.push(n);return n}
  setAttribute(k,v){this[k]=v}
  focus(){this.enfocado=true}
}
const c=vm.createContext({SATE_DATA:{dictamen:{textos,materias:{}},carreras:{}},SATE_CONFIG:{unidadPredeterminada:'demo',unidades:{demo:{siglas:'DEMO'}}},SATE_UNIDAD:'demo',SateTramites:{registrar(){}},window:{},localStorage:{getItem:()=>null},document:{createElement:t=>new Nodo(t)}});
c.SATE={texto:k=>k};
vm.runInContext(src,c);
const api=c.SateDictamen;
const d={tipo:'interno',peticion:'Solicito recursar Álgebra.',filas:[{nombre:'Álgebra',cursada:'25/1',recursada:'25/2'}],motivos:'Mi texto original'};
const r={causas:['salud','trabajo'],periodos:'25/1, 25/2',acciones:'solicitado asesorías',peticion:d.peticion,planes:['tutorias'],documentos:'constancia médica'};
const borrador=api.carta(d,r);
for(const t of ['Consejo Técnico Consultivo Escolar de la DEMO:','durante los periodos 25/1 y 25/2','problemas de salud y responsabilidades de trabajo','tutorías','constancia médica'])assert.ok(borrador.includes(t),t);
assert.ok(borrador.endsWith('Solicito recursar Álgebra.'));assert.ok(!borrador.includes('considere mi petición'));
assert.ok(!borrador.includes('unidades de aprendizaje involucradas'));
const respuestas={...r,planes:[],acciones:'Pedí asesoría?! ;  ',peticion:'Solicito recursar Álgebra..?! ;  ',plan:'retomar tutorías?; ',documentos:'constancia médica! ; '};
const cartaNormalizada=api.carta(d,respuestas);
assert.ok(cartaNormalizada.includes('he realizado las siguientes acciones: Pedí asesoría.'));
assert.ok(cartaNormalizada.endsWith('Solicito recursar Álgebra.'));
assert.ok(cartaNormalizada.includes('durante los periodos 25/1 y 25/2'));
assert.ok(cartaNormalizada.includes('Me comprometo a retomar tutorías.'));
assert.ok(cartaNormalizada.includes('anexo los siguientes documentos: constancia médica.'));
assert.ok(!cartaNormalizada.includes('..')&&!cartaNormalizada.includes('?!')&&!cartaNormalizada.includes(';'));
assert.ok(!cartaNormalizada.includes('trayectoria académica'));
assert.ok(api.carta(d,{...r,peticion:'   '}).endsWith('Por lo anterior, solicito a la Comisión que considere mi petición.'));
assert.ok(api.carta(d,{...r,peticion:''}).endsWith('Por lo anterior, solicito a la Comisión que considere mi petición.'));
assert.ok(api.carta({...d,tipo:'externo'},r).startsWith(textos['dictamen.destino_externo']+':'));
assert.ok(api.carta(d,{...r,periodos:'25/1'}).includes('durante el periodo 25/1,'));
assert.ok(api.carta(d,{...r,periodos:'24/2, 25/1, 25/2'}).includes('los periodos 24/2, 25/1 y 25/2'));
assert.ok(api.carta(d,{...r,periodos:''}).includes('durante los periodos que detallo'));
const materias={...d,filas:[{nombre:'ONDAS Y FISICA DE LA LUZ'},{nombre:'APLICACIONES DEL IPN EN LA INGENIERIA'}]};
const copia=JSON.stringify(materias);
const exposicion=api.carta(materias,{...r,peticion:'Solicito autorización.'});
assert.ok(exposicion.includes('Ondas y Fisica de la Luz y Aplicaciones del IPN en la Ingenieria'));
assert.equal(JSON.stringify(materias),copia);
const conPeticion=api.carta(materias,{...r,peticion:'Solicito inscribir ONDAS Y FISICA DE LA LUZ y APLICACIONES DEL IPN EN LA INGENIERIA.'});
assert.ok(!conPeticion.includes('unidades de aprendizaje involucradas'));
let confirmaciones=0;
assert.equal(api.aplicarCarta(d,{periodos:'25/1'},()=>{confirmaciones++;return true}),false);
assert.equal(d.motivos,'Mi texto original');assert.equal(confirmaciones,0);
assert.equal(api.aplicarCarta(d,r,()=>false),false);assert.equal(d.motivos,'Mi texto original');
assert.equal(api.aplicarCarta(d,r,()=>true),true);assert.equal(d.motivos,borrador);
const campo=api.definir().pasos.at(-1).campos.find(x=>x.id==='motivos');
const box=new Nodo('div'),datos={...d,motivos:'Texto manual'};
campo.pintar(box,{datos,cambiar:v=>datos.motivos=v});
const todos=n=>[n,...n.children.flatMap(todos)];
const nodos=todos(box),details=nodos.find(n=>n.tag==='details');assert.ok(details);assert.equal(details.open,undefined);
for(const etiqueta of ['Problemas de salud','Responsabilidades de trabajo','Acudir a tutorías'])assert.ok(nodos.some(n=>n.tag==='span'&&n.textContent===etiqueta),etiqueta);
assert.equal(nodos.filter(n=>n.tag==='legend').length,3);
assert.equal(datos.carta_respuestas.periodos,'25/1, 25/2');
const boton=nodos.find(n=>n.tag==='button');boton.onclick();assert.equal(datos.motivos,'Texto manual');
const accion=nodos.find(n=>n.tag==='input'&&n.maxLength===800&&n.value==='');accion.value='buscado apoyo';accion.oninput();
c.window.confirm=()=>false;boton.onclick();assert.equal(datos.motivos,'Texto manual');
c.window.confirm=()=>true;boton.onclick();assert.ok(datos.motivos.includes('buscado apoyo'));assert.ok(nodos.find(n=>n.id==='dictamen-motivos').enfocado);
assert.ok(src.includes("SATE.script('../assets/vendor/pdf-lib.min.js')"));assert.ok(!src.includes('cdnjs'));
console.log('OK carta: plantillas, CTCE/COSIE, materias, petición, periodos, editor opcional y protección del texto');
