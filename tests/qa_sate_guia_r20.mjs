// Regresión de la ruta compartida al saltar a fracciones y visor. Sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {crearEntorno} from './dom_minimo.mjs';

const leer=p=>readFileSync(p,'utf8'),{document,Elemento,Evento}=crearEntorno();
Elemento.prototype.append=function(...nodos){for(const n of nodos)if(n)this.appendChild(n);};
document.createElementNS=(_,tag)=>document.createElement(tag);
const caja=document.createElement('div');caja.setAttribute('id','sate-guia');document.body.appendChild(caja);
const config=JSON.parse(leer('data/sate.json'));
config.unidades.ficticia={guiaDatos:true};
const reg=doc=>JSON.parse(leer('data/reglamentos/'+doc+'.json'));
const local={version:2,activa:0,proyectos:[{formato:'sate-investigacion',version:2,nombre:'Otra local ficticia',autor:'',proposito:'estudio',etiquetas:[],peticion:'',marcadores:[]}]};
const location={href:'https://example.invalid/sate/',hash:''},avisos=[],eventos=new Map();
let pestana,lecturas=0,escrituras=0,impresiones=0,guardado;
const c=vm.createContext({document,crypto:webcrypto,TextEncoder,Uint8Array,URLSearchParams,Response,Blob,CompressionStream,DecompressionStream,btoa,atob,Event:Evento,
  location,history:{replaceState:(_,__,ruta)=>{location.hash=ruta;},pushState:(_,__,ruta)=>{location.hash=ruta;}},
  localStorage:{getItem:()=>{lecturas++;return guardado||JSON.stringify(local);}},IPNT:{set:(_,v)=>{escrituras++;guardado=v;}},
  console:{...console,warn:(...args)=>avisos.push(args)},setTimeout,clearTimeout,requestAnimationFrame:()=>1,cancelAnimationFrame(){},
  matchMedia:()=>({matches:false}),getComputedStyle:()=>({getPropertyValue:()=> '64'}),scrollTo(){},print:()=>{impresiones++;},
  addEventListener:(k,fn)=>eventos.set(k,fn),removeEventListener:k=>eventos.delete(k),
  SATE_UNIDAD:'ficticia',SATE_CONFIG:config,
  SATE:{texto:(k,v={})=>k+' '+Object.values(v).join(' · '),pestana:(_,p)=>{pestana=p;},error:e=>{throw e;},
    json:async ruta=>ruta.includes('/reglamentos/')?reg(ruta.split('/').at(-1).replace('.json','')):JSON.parse(leer('data/guia/comun.json'))}
});
vm.runInContext(leer('web/sate/componentes.js'),c);
vm.runInContext(leer('web/sate/guia.js'),c);
const G=c.SateGuia,lo=reg('lo');
const p={formato:'sate-investigacion',version:2,nombre:'Compartida ficticia con diez notas',autor:'Autor ficticio',proposito:'estudio',etiquetas:[],peticion:'Petición ficticia íntegra',marcadores:[]};
for(const a of lo.articulos.slice(0,10))p.marcadores.push({doc:'lo',n:String(a.n),fr:'',inciso:'',huella:await G.huellaCita(a.texto),nota:'Nota ficticia completa '+a.n+'\nSegundo párrafo & <texto propio>.',tipo:'hecho',anotaciones:[]});
const inv=await G.codificarInv(p);
location.hash='#/ficticia/guia/reglamentos/lo/art-25.IX?inv='+inv+'&frpos=9';
await pestana.mostrar({partes:['reglamentos','lo','art-25.IX']});
await new Promise(resolve=>setTimeout(resolve,150));
assert.equal(avisos.length,0,JSON.stringify(avisos));
assert.ok(location.hash.includes('inv='+inv),'el salto preciso no borra la compartida');
assert.ok(location.hash.endsWith('&frpos=9'));
assert.equal(document.scrolled.getAttribute('data-fraccion-pos'),'9');
assert.equal(document.scrolled.style.scrollMarginTop,'80px','la fracción reserva la barra global más el margen');
assert.equal(document.scrolled.querySelector('p').textContent,lo.articulos.find(a=>a.n==='25').fracciones[8].texto);
assert.equal(caja.querySelectorAll('.rgl-investigacion__item').length,10);
assert.equal(caja.querySelector('.inv-titulo').getAttribute('title'),p.nombre);
for(const n of caja.querySelectorAll('.inv-item__nota'))assert.ok(n.textContent.includes('Segundo párrafo'),'el DOM conserva la nota íntegra');
const abrir=caja.querySelector('.inv-abrir');abrir.click();location.hash=abrir.getAttribute('href');
await pestana.mostrar({partes:['investigacion']});
assert.equal(caja.querySelectorAll('.inv-cita').length,10);
assert.ok(!caja.textContent.includes(local.proyectos[0].nombre));
for(const m of p.marcadores)assert.ok(caja.textContent.includes(m.nota));
const boton=k=>Array.from(caja.querySelectorAll('button')).find(b=>b.textContent.trim()==='sate.guia.inv_'+k);
boton('leer_documento').click();
const doc=caja.querySelector('.inv-documento');assert.ok(doc);
assert.equal(doc.querySelectorAll('button,input,textarea,select,summary').length,0,'el documento carece de controles');
assert.equal(doc.querySelectorAll('[data-oficial]').length,10);
for(const [i,n] of Array.from(doc.querySelectorAll('[data-oficial]')).entries()){
  assert.equal(n.textContent,lo.articulos[i].texto,'texto literal sin cortes ni cambios');
  assert.equal(n.getAttribute('data-oficial'),'lo');
  assert.ok(doc.textContent.includes(p.marcadores[i].nota));
}
assert.ok(doc.textContent.includes(p.peticion));
assert.equal(doc.querySelectorAll('.inv-cambio').length,0,'huellas coincidentes sin avisos falsos');
boton('imprimir_documento').click();assert.equal(impresiones,1);
await boton('volver_investigacion')._ev.click[0]();
assert.equal(caja.querySelectorAll('.inv-cita').length,10);
assert.equal(lecturas,0,'compartida y visor no consultan la investigación local');
assert.equal(escrituras,0,'lectura sin persistencia');
assert.equal(avisos.length,0,JSON.stringify(avisos));
// El numeral repetido también conserva la compartida cuando se sigue su propio enlace.
location.hash='#/ficticia/guia/reglamentos/honor/art-21.I?inv='+inv+'&frpos=14';
await pestana.mostrar({partes:['reglamentos','honor','art-21.I']});
const numeral=document.scrolled.querySelector('a');
assert.ok(numeral.getAttribute('href').includes('?inv='+inv+'&frpos=14'));
// Investigación propia: leer la nota completa, editar en contexto y ordenar con acciones accesibles.
local.proyectos[0]={...p,nombre:'Local ficticia',marcadores:p.marcadores.slice(0,2)};
location.hash='#/ficticia/guia/investigacion';
await pestana.mostrar({partes:['investigacion']});
assert.equal(caja.querySelectorAll('.inv-cita').length,2);
const fila=caja.querySelector('.inv-cita'),editor=fila.querySelector('.inv-nota__editor');
assert.ok(!editor.open);
assert.ok(fila.querySelector('.inv-nota__texto').textContent.includes('Segundo párrafo'));
const entrada=editor.querySelector('textarea');entrada.value='Nota propia editada\nSegunda línea';entrada.dispatchEvent(new Evento('input'));
assert.equal(fila.querySelector('.inv-nota__texto').textContent,entrada.value);
assert.equal(JSON.parse(guardado).proyectos[0].marcadores[0].nota,entrada.value);
const bajar=Array.from(fila.querySelectorAll('.inv-orden button')).find(b=>b.getAttribute('aria-label').trim()==='sate.guia.inv_bajar');
await bajar._ev.click[0]();
await new Promise(resolve=>setTimeout(resolve,100));
assert.deepEqual(JSON.parse(guardado).proyectos[0].marcadores.map(m=>m.n),['2','1']);
boton('leer_documento').click();
assert.equal(caja.querySelector('.inv-documento').querySelectorAll('button,input,textarea,select').length,0);
assert.ok(caja.querySelector('.inv-documento').textContent.includes('Nota propia editada\nSegunda línea'));
pestana.ocultar();
const css=leer('web/sate/guia.css'),comun=leer('web/sate/componentes.css');
assert.match(css,/\.rgl-encabezado\{position:static/,'capítulos en el flujo, sin superposición');
assert.match(css,/\.rgl-fr,\.rgl-inc,\.rgl-renglon\{scroll-margin-top:calc\(var\(--sate-barra-alto\) \+ var\(--ipn-esp-4\)\)/);
assert.match(css,/\.rgl-mapa__etiqueta\{[^}]*white-space:normal/);
assert.match(comun,/@media print\{[\s\S]*body:has\(\.inv-documento\)/);
assert.ok(comun.includes('.inv-documento,.inv-documento *{visibility:visible}'),'el visor revierte la ocultación global de impresión de trámites');
console.log('R20: frpos conserva inv, destino preciso y margen, 10 citas/notas, visor literal sin controles, impresión y regreso sin almacenamiento.');
