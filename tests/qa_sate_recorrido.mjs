// Lógica real y perfiles ficticios, sin navegador ni datos personales.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const leer=p=>readFileSync(p,'utf8');
const c=vm.createContext({console,document:{addEventListener(){}},addEventListener(){}});
vm.runInContext(leer('web/sate/componentes.js'),c);
vm.runInContext(leer('web/sate/recorrido.js'),c);
const r=c.SateRecorrido,ui=c.SateUI;
const a=JSON.parse(leer('data/perfiles-prueba/regular-mecatronica.json'));
const pasos=JSON.parse(leer('data/recorrido.json'));
const toml=leer('contenido/textos/es.toml').split('[sate.recorrido]')[1].split('\n[')[0];
const textos=Object.fromEntries([...toml.matchAll(/^(\w+) = "(.*)"$/gm)].map(m=>[m[1],m[2]]));
const tx=(k,v={})=>textos[k].replace(/\{(\w+)\}/g,(_,p)=>v[p]);
const avance=Math.round(a.avance.obtenidos/(a.carga.total||a.avance.obtenidos+a.avance.faltan)*100)+' %';
assert.ok(r.contenido(pasos[0],a,tx).includes(avance));
assert.ok(r.contenido(pasos[1],a,tx).includes(String(r.variables(a).n)));
assert.equal(r.contenido(pasos[0],null,tx),textos.trayectoria);
assert.equal(r.contenido(pasos[0],{},tx),textos.trayectoria);
assert.equal(r.cumple({condicion:'personal'},null),false);
assert.equal(r.cumple({condicion:'personal'},a),true);
assert.equal(r.cumple({condicion:'desconocida'},a),false);
assert.equal(pasos.filter(p=>r.cumple(p,null)).length,6);
assert.deepEqual([...new Set(pasos.map(p=>p.pestana))],['trayectoria','mapa','horarios','tramites','calendario','guia']);
assert.ok(pasos.every(p=>['barra','flotante',undefined].includes(p.control)));
assert.equal(r.control(), 'flotante');
assert.equal(r.control({control:'barra'}), 'flotante');
assert.equal(r.siguiente(pasos,0,1,p=>p.pestana==='horarios'),3);
assert.equal(r.siguiente(pasos,6,-1,p=>p.pestana==='horarios'),3);
assert.equal(r.siguiente(pasos,0,1,()=>false),-1);
for(const acepta of [true,false]){
  const almacen=new Map(),get=k=>almacen.get(k)??null;
  assert.ok(ui.recorridoOfrecer(get));ui.recorridoDecidir((k,v)=>almacen.set(k,v),acepta);
  assert.equal(ui.recorridoOfrecer(get),false);
}
const inicio=leer('web/sate/inicio.js');
assert.match(inicio,/await script\('recorrido.js'\)/);
assert.doesNotMatch(leer('web/sate/cascaron.html'),/src="recorrido.js"/);
for(const p of pasos){assert.ok(textos[p.texto]);if(p.personal)assert.ok(textos[p.personal])}

// La bienvenida muestra las pestañas y el paso conserva el control declarado.
const eventos=new Map(),vistas=[],creados=[];let cerrada=false,dialogo;
function nodo(tag='div'){
  const n={tag,children:[],dataset:{},style:{},hidden:false,textContent:'',className:'',offsetWidth:320,offsetHeight:120,
    classList:{add(){},remove(){}},append(...xs){this.children.push(...xs)},appendChild(x){this.children.push(x)},
    insertBefore(x){this.children.unshift(x)},setAttribute(k,v){this[k]=v},addEventListener(k,f){this['on'+k]=f},
    querySelector(sel){return sel==='button'?this.children.find(x=>x.tag==='button'):null},querySelectorAll(){return this.children.filter(x=>x.tag==='button')},
    closest(){return null},getClientRects(){return [{}]},getBoundingClientRect(){return {top:120,left:12,right:308,bottom:300,height:180}},
    scrollIntoView(){},focus(){}};
  if(tag==='button')n.type='button';creados.push(n);return n;
}
let cajaObjetivo={top:120,left:12,right:308,bottom:300,height:180};
const objetivo={closest:()=>null,getClientRects:()=>[{}],scrollIntoView(){},getBoundingClientRect:()=>cajaObjetivo};
const documento={activeElement:{isConnected:true,focus(){}},querySelector:()=>objetivo,createElement:nodo};
const entorno={console,document:documento,innerWidth:375,innerHeight:700,matchMedia:()=>({matches:false}),requestAnimationFrame:f=>f(),
  fetch:async()=>({ok:true,json:async()=>pasos}),addEventListener:(k,f)=>eventos.set(k,f),removeEventListener:k=>eventos.delete(k),
  SATE_CONFIG:{unidades:{ficticia:{pestanas:[...new Set(pasos.map(p=>p.pestana))]}}},SATE_UNIDAD:'ficticia',
  SATE:{alumno:()=>a,texto:(k,v)=>k.startsWith('sate.pestana.')?({trayectoria:'Tu perfil',mapa:'Mapa curricular',horarios:'Horarios de clase',tramites:'Ventanilla digital',calendario:'Calendario escolar',guia:'Guía politécnica'})[k.split('.')[2]]:k==='sate.recorrido.paso'?`${v.n}/${v.total}`:k==='sate.recorrido.bienvenida'?'Qué puedes hacer en SATE':k==='sate.recorrido.muestrame'?'Muéstrame':k==='sate.recorrido.terminar'?'Terminar':k==='sate.recorrido.siguiente'?'Siguiente':k==='sate.recorrido.anterior'?'Anterior':k==='sate.recorrido.salir'?'Salir':tx(k.replace('sate.recorrido.',''),v),visitar:async id=>{vistas.push(id)}},
  SateUI:{recorridoTarjeta(salir){
    dialogo={elemento:{open:false,dataset:{},showModal(){this.open=true},remove(){cerrada=true},querySelectorAll(){return []},addEventListener(){}},
      tarjeta:Object.assign(nodo(),{getBoundingClientRect:()=>({top:360,height:120})}),titulo:nodo(),texto:nodo(),acciones:nodo(),marco:nodo(),escape:salir};return dialogo;
  },modal(){}},scrollBy(){}};
entorno.window=entorno;
vm.runInNewContext(leer('web/sate/recorrido.js'),entorno);
await entorno.SateRecorrido.iniciar();
assert.equal(dialogo.elemento.open,true);
assert.equal(dialogo.lista.children.length,6);
assert.deepEqual(dialogo.lista.children.map(x=>x.children[0].textContent),['Tu perfil','Mapa curricular','Horarios de clase','Ventanilla digital','Calendario escolar','Guía politécnica']);
dialogo.lista.children.find(x=>x.children[0].textContent==='Mapa curricular').children[2].onclick();
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(dialogo.tarjeta.dataset.control,'flotante');
assert.equal(dialogo.tarjeta.style.top,'312px');
assert.equal(dialogo.tarjeta.style.left,'12px');
assert.equal(vistas.at(-1),'mapa');
assert.equal(dialogo.acciones.children.length,3);
cajaObjetivo={top:180,left:28,right:324,bottom:360,height:180};eventos.get('resize')();
assert.equal(dialogo.tarjeta.style.top,'48px');assert.equal(dialogo.tarjeta.style.left,'28px');
for(const ancho of [1440,768,528,375]){
  entorno.innerWidth=ancho;cajaObjetivo={top:Math.max(120,entorno.innerHeight-220),left:Math.min(24,ancho-320),right:Math.min(320,ancho-16),bottom:entorno.innerHeight-40,height:180};
  eventos.get('resize')();
  const x=parseFloat(dialogo.tarjeta.style.left),y=parseFloat(dialogo.tarjeta.style.top),w=dialogo.tarjeta.offsetWidth,h=dialogo.tarjeta.offsetHeight;
  assert.ok(x>=8&&x+w<=ancho-8&&y>=8&&y+h<=entorno.innerHeight-8,`Tarjeta dentro de pantalla a ${ancho}px`);
  assert.ok(x+w<=cajaObjetivo.left||x>=cajaObjetivo.right||y+h<=cajaObjetivo.top||y>=cajaObjetivo.bottom,`Tarjeta no tapa el resaltado a ${ancho}px`);
}
const css=leer('web/sate/componentes.css');
assert.match(css,/\.sate-recorrido\{[^}]*font-family:var\(--ipn-fuente-texto\)[^}]*font-size:var\(--ipn-tamano-m\)/,'El diálogo define tipografía fuera de body');
assert.match(css,/\.sate-recorrido__acciones\{position:fixed;[^}]*right:var\(--ipn-esp-3\);[^}]*bottom:max\(var\(--ipn-esp-3\),env\(safe-area-inset-bottom\)\)/);
assert.doesNotMatch(css,/\.sate-recorrido__tarjeta\[data-control=barra\]/);
dialogo.escape();assert.ok(cerrada);assert.equal(eventos.size,0);
console.log('OK recorrido: bienvenida, control flotante fijo, ayuda anclada y reposicionada al cambiar tamaño, Escape.');
