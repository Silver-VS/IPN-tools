// Integración con el DOM en memoria del repositorio. Sin navegador ni red.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {crearEntorno} from './dom_minimo.mjs';

const leer=r=>readFileSync(r,'utf8'), fuente=leer('web/sate/guia.js');
const {document,Elemento,Evento}=crearEntorno();
Elemento.prototype.append=function(...nodos){for(const n of nodos)if(n)this.appendChild(n);};
document.createElementNS=(_,tag)=>document.createElement(tag);
const caja=document.createElement('div');caja.setAttribute('id','sate-guia');document.body.appendChild(caja);
const config=JSON.parse(leer('data/sate.json'));
config.unidades.upiita.guiaDatos=true;
const avisos=[],eventos=new Map();
let pestana,lecturas=0,escrituras=0;
const clave='hu.upiita.investigaciones';
const local={version:2,activa:0,proyectos:[{formato:'sate-investigacion',version:2,nombre:'Local ficticia intacta',proposito:'estudio',autor:'',etiquetas:[],peticion:'Local',marcadores:[]}]};
const almacen=new Map([[clave,JSON.stringify(local)]]),antes=almacen.get(clave);
const archivoEnlace='_encargo/consejos-consultivos.enlace.txt';
const location={href:'https://example.invalid/',hash:existsSync(archivoEnlace)?'#'+leer(archivoEnlace).trim().split('#')[1]:'#/upiita/guia/reglamentos/lo'};
const contexto=vm.createContext({document,crypto:webcrypto,TextEncoder,Uint8Array,URLSearchParams,Response,Blob,CompressionStream,DecompressionStream,btoa,atob,Event:Evento,
  localStorage:{getItem:k=>{lecturas++;return almacen.get(k)||null;}},IPNT:{set:(k,v)=>{escrituras++;almacen.set(k,v);}},
  location,history:{pushState:(_,__,ruta)=>{location.hash=ruta;},replaceState:(_,__,ruta)=>{location.hash=ruta;}},
  console:{...console,warn:(...args)=>avisos.push(args)},setTimeout,clearTimeout,
  requestAnimationFrame:()=>1,cancelAnimationFrame(){},matchMedia:()=>({matches:false}),scrollTo(){},
  addEventListener:(k,fn)=>eventos.set(k,fn),removeEventListener:k=>eventos.delete(k),dispatchEvent:e=>eventos.get(e.type)?.(e),
  SATE_UNIDAD:'upiita',SATE_CONFIG:config,
  SATE:{texto:(k,v={})=>k+' '+Object.values(v).join(' · '),pestana:(_,p)=>{pestana=p;},error:e=>{throw e;},json:async ruta=>JSON.parse(leer('web/dist/sate/'+ruta))}
});
vm.runInContext(leer('web/sate/componentes.js'),contexto);
vm.runInContext(fuente,contexto);
const G=contexto.SateGuia;
// El enlace del encargo es local e ignorado por git; la QA también funciona en otros worktrees.
if(!existsSync(archivoEnlace)){
  const reg=JSON.parse(leer('web/dist/sate/datos/reglamentos/lo.json'));
  const p={formato:'sate-investigacion',version:2,nombre:'Investigación ficticia',autor:'Autor ficticio',proposito:'estudio',etiquetas:['Prueba'],peticion:'Petición ficticia',marcadores:[]};
  for(const a of reg.articulos.slice(0,10))p.marcadores.push({doc:'lo',n:String(a.n),fr:'',inciso:'',huella:await G.huellaCita(a.texto),nota:'Nota ficticia '+a.n,tipo:'hecho',anotaciones:[]});
  location.hash+='?inv='+await G.codificarInv(p);
}
const inv=location.hash.split('?inv=')[1];
const compartida=await G.decodificarInv(inv);
assert.equal(compartida.marcadores.length,10);
const revisada=await G.revisarInvestigacion(compartida,async doc=>JSON.parse(leer('web/dist/sate/datos/reglamentos/'+doc+'.json')));
assert.ok(revisada.marcadores.every(m=>m.huella&&!m.cambio),'las 10 citas coinciden con el dato oficial compilado');
const esperar=async()=>{for(let i=0;i<20;i++)await new Promise(resolve=>setTimeout(resolve,5));};
const boton=k=>Array.from(caja.querySelectorAll('button')).find(b=>b.textContent.trim()==='sate.guia.inv_'+k);
const comprobarLectura=()=>{
  assert.equal(avisos.length,0,JSON.stringify(avisos));
  assert.equal(lecturas,0,'mostrar la compartida no lee localStorage');
  assert.equal(escrituras,0,'mostrar la compartida no escribe localStorage');
  assert.equal(caja.querySelectorAll('textarea').length,0,'sin editores');
  assert.equal(caja.querySelectorAll('.inv-selector').length,0,'sin selector local');
  assert.equal(caja.querySelectorAll('.inv-quitar').length,0,'sin eliminar citas');
  assert.ok(caja.textContent.includes(compartida.nombre));
  assert.ok(caja.textContent.includes(compartida.autor));
};
await pestana.mostrar({partes:['reglamentos','lo']});await esperar();
comprobarLectura();
assert.equal(caja.querySelectorAll('.rgl-investigacion__item').length,10);
assert.ok(caja.querySelector('.rgl-investigacion__contexto').textContent.includes('(10)'));
for(const estado of caja.querySelectorAll('[data-resumen-articulo]')){
  const citas=compartida.marcadores.filter(m=>m.doc===estado.getAttribute('data-resumen-doc')&&m.n===estado.getAttribute('data-resumen-articulo'));
  assert.equal(!!estado.textContent,!!citas.length,'las marcas corresponden a la compartida');
}
const abrir=caja.querySelector('.inv-abrir');assert.ok(abrir.getAttribute('href').endsWith('?inv='+inv));
abrir.click();location.hash=abrir.getAttribute('href');
await pestana.mostrar({partes:['investigacion']});
comprobarLectura();
assert.equal(caja.querySelectorAll('.inv-cita').length,10);
assert.equal(caja.querySelectorAll('.pc-oficial[data-oficial]').length,10);
assert.equal(caja.querySelector('.inv-peticion').textContent,compartida.peticion);
assert.ok(caja.querySelector('.guia-cab a').getAttribute('href').includes('?inv='+inv));
for(const m of compartida.marcadores){assert.ok(caja.textContent.includes(m.nota));assert.ok(caja.textContent.includes('sate.guia.inv_'+m.tipo));}
const enlaceCita=caja.querySelector('.inv-oficial a').getAttribute('href');
assert.ok(enlaceCita.includes('?inv='+inv));
location.hash=enlaceCita;
await pestana.mostrar({partes:['reglamentos',compartida.marcadores[0].doc]});await esperar();comprobarLectura();
assert.equal(caja.querySelectorAll('.rgl-investigacion__item').length,10,'volver al lector conserva la compartida');
location.hash='#/upiita/guia/investigacion?inv='+inv;
await pestana.mostrar({partes:['investigacion']});
await boton('salir')._ev.click[0]();await esperar();
assert.ok(!location.hash.includes('inv='));assert.equal(almacen.get(clave),antes);
assert.ok(caja.textContent.includes(local.proyectos[0].nombre));
// Abrir directamente la vista dedicada no depende de haber montado antes el lector.
location.hash='#/upiita/guia/investigacion?inv='+inv;lecturas=0;escrituras=0;
await pestana.mostrar({partes:['investigacion']});comprobarLectura();
await boton('copia')._ev.click[0]();await esperar();
const guardadas=JSON.parse(almacen.get(clave));
assert.equal(escrituras,1);assert.equal(guardadas.proyectos.length,2);assert.equal(guardadas.activa,1);
assert.deepEqual(guardadas.proyectos[0],local.proyectos[0]);
assert.equal(guardadas.proyectos[1].nombre,compartida.nombre);
assert.ok(guardadas.proyectos[1].marcadores.every(m=>!m.cambio));assert.ok(!location.hash.includes('inv='));
// Una huella discordante se señala sin repararla ni persistir el intercambio.
compartida.marcadores[0].huella='0'.repeat(64);
location.hash='#/upiita/guia/investigacion?inv='+await G.codificarInv(compartida);lecturas=0;escrituras=0;
await pestana.mostrar({partes:['investigacion']});
assert.equal(caja.querySelectorAll('.inv-cambio').length,1);assert.equal(lecturas,0);assert.equal(escrituras,0);
// La migración no debe establecer ni persistir huellas mientras se consulta un enlace.
compartida.marcadores[0].huella='';compartida.marcadores[0].pendienteHuella=true;
location.hash='#/upiita/guia/investigacion?inv='+await G.codificarInv(compartida);
await pestana.mostrar({partes:['investigacion']});
assert.equal(caja.querySelectorAll('.inv-cambio').length,1);assert.equal(lecturas,0);assert.equal(escrituras,0);
location.hash='#/upiita/guia/investigacion';await pestana.mostrar({partes:['investigacion']});
assert.equal(caja.querySelectorAll('.inv-selector').length,1,'quitar el parámetro restaura las propias');
assert.equal(almacen.get(clave),JSON.stringify(guardadas));
assert.equal(avisos.length,0,JSON.stringify(avisos));
console.log('R18-COMP: 10 huellas oficiales, lector/vista de solo lectura sin almacenamiento, rutas, copia independiente, salida y texto cambiado.');
