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
const tx=(k,v)=>textos[k].replace(/\{(\w+)\}/g,(_,p)=>v[p]);
const avance=Math.round(a.avance.obtenidos/(a.carga.total||a.avance.obtenidos+a.avance.faltan)*100)+' %';
assert.ok(r.contenido(pasos[0],a,tx).includes(avance));
assert.ok(r.contenido(pasos[1],a,tx).includes(String(r.variables(a).n)));
assert.equal(r.contenido(pasos[0],null,tx),textos.trayectoria);
assert.equal(r.contenido(pasos[0],{},tx),textos.trayectoria);
assert.equal(r.cumple({condicion:'personal'},null),false);
assert.equal(r.cumple({condicion:'personal'},a),true);
assert.equal(r.cumple({condicion:'desconocida'},a),false);
assert.equal(pasos.filter(p=>r.cumple(p,null)).length,5);
assert.equal(r.siguiente(pasos,0,1,p=>p.selector==='#b-horario'),3);
assert.equal(r.siguiente(pasos,5,-1,p=>p.selector==='#b-horario'),3);
assert.equal(r.siguiente(pasos,0,1,()=>false),-1);
for(const acepta of [true,false]){
  const almacen=new Map(),get=k=>almacen.get(k)??null;
  assert.ok(ui.recorridoOfrecer(get));
  ui.recorridoDecidir((k,v)=>almacen.set(k,v),acepta);
  assert.equal(ui.recorridoOfrecer(get),false);
  assert.equal(ui.recorridoOfrecer(get),false);
}
// Los recursos se sirven localmente y el módulo no forma parte de la carga inicial.
const inicio=leer('web/sate/inicio.js');
assert.match(inicio,/await script\('recorrido.js'\)/);
assert.doesNotMatch(leer('web/sate/cascaron.html'),/src="recorrido.js"/);
for(const p of pasos){assert.ok(textos[p.texto]);if(p.personal)assert.ok(textos[p.personal])}
// Integración del controlador real: pestañas asíncronas, elemento ausente y Escape.
const eventos=new Map(),botones=[],vistas=[];
let cerrada=false,dialogo;
const objetivo={closest:()=>null,getClientRects:()=>[{}],scrollIntoView(){},getBoundingClientRect:()=>({top:96,left:12,right:308,bottom:600})};
const documento={activeElement:{isConnected:true,focus(){}},querySelector:s=>s===pasos[1].selector?null:objetivo,
  createElement(){const b={focus(){}};botones.push(b);return b}};
const entorno={console,document:documento,innerWidth:320,
  fetch:async()=>({ok:true,json:async()=>pasos}),
  addEventListener:(k,f)=>eventos.set(k,f),removeEventListener:k=>eventos.delete(k),
  SATE_CONFIG:{unidades:{ficticia:{pestanas:[...new Set(pasos.map(p=>p.pestana))]}}},SATE_UNIDAD:'ficticia',
  SATE:{alumno:()=>a,texto:(k,v)=>k==='sate.recorrido.paso'?`${v.n}/${v.total}`:tx(k.replace('sate.recorrido.',''),v),visitar:async id=>{vistas.push(id)}},
  SateUI:{recorridoTarjeta(salir){
    dialogo={elemento:{open:false,showModal(){this.open=true},remove(){cerrada=true}},
      tarjeta:{getBoundingClientRect:()=>({top:360})},titulo:{},texto:{},acciones:{appendChild(){}},marco:{style:{}},escape:salir};return dialogo;
  }},scrollBy(){}};
entorno.window=entorno;
vm.runInNewContext(leer('web/sate/recorrido.js'),entorno);
await entorno.SateRecorrido.iniciar();
assert.equal(dialogo.elemento.open,true);
assert.ok(dialogo.texto.textContent.includes(avance));
await botones[1].onclick();
assert.equal(vistas.at(-1),'mapa');
assert.equal(vistas.length,3,'Se visitó y saltó el elemento ausente');
assert.ok(parseFloat(dialogo.marco.style.height)+parseFloat(dialogo.marco.style.top)<360,'La tarjeta no cubre el resalte');
for(const ancho of [320,375]){
  entorno.innerWidth=ancho;eventos.get('resize')();
  assert.ok(parseFloat(dialogo.marco.style.left)+parseFloat(dialogo.marco.style.width)<=ancho-8);
}
await botones[0].onclick();
assert.equal(vistas.at(-1),'trayectoria');
dialogo.escape();
assert.ok(cerrada);
assert.equal(eventos.size,0);
console.log('OK recorrido');
