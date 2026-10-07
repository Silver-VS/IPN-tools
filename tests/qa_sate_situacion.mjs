// Integración de núcleo, Situación y componentes reales con DOM en memoria, sin red.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const leer=f=>readFileSync(f,'utf8');
const html=leer('web/dist/sate/index.html');
const config=JSON.parse(html.match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const textos=config.textos;
const texto=(k,v={})=>(textos[k]||k).replace(/\{(\w+)\}/g,(_,k)=>v[k]??'{'+k+'}');
let document;
class Nodo {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.attrs={};this.eventos={};this.style={setProperty(){}};this.dataset={};this.value='';this.options=[];this.hidden=false;this.open=false;this.offsetParent={};this.clientWidth=375;this.offsetWidth=375;this.offsetHeight=80;
    this.classList={contains:k=>this.className.split(' ').includes(k),add:k=>{this.className+=' '+k},remove:k=>{this.className=this.className.split(' ').filter(x=>x!==k).join(' ')},toggle:(k,on)=>on?this.classList.add(k):this.classList.remove(k)};this.className='';}
  set textContent(v){this.children=[];this.text=String(v??'')}
  get textContent(){return (this.text||'')+this.children.map(x=>x.textContent).join(' ')}
  set innerHTML(v){this.children=[];this.html=String(v)}get innerHTML(){return this.html||''}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='open')this.open=true;if(k==='id')this.id=v}
  getAttribute(k){return this.attrs[k]??null}removeAttribute(k){delete this.attrs[k]}
  appendChild(n){this.children.push(n);n.parent=this;return n}replaceChildren(...ns){this.text='';this.children=[];ns.forEach(n=>this.appendChild(n))}
  addEventListener(k,fn){(this.eventos[k]??=[]).push(fn)}
  dispatchEvent(e){e.target??=this;(this.eventos[e.type]||[]).forEach(fn=>fn(e));return true}
  click(){this.focus();if(this.onclick)this.onclick();this.dispatchEvent({type:'click',target:this})}
  focus(){document.activeElement=this}
  showModal(){this.open=true}close(){this.open=false}
  insertAdjacentHTML(){}getBoundingClientRect(){return {left:10,top:100,bottom:130,width:30,height:30}}
  contains(n){return this===n||this.children.some(c=>c.contains(n))}
  all(){return this.children.flatMap(c=>[c,...c.all()])}
  querySelectorAll(s){return this.all().filter(n=>s.split(',').some(q=>{q=q.trim().split(' ').at(-1);return q.startsWith('.')?n.classList.contains(q.slice(1)):q.startsWith('#')?n.id===q.slice(1):q==='button'?n.tagName==='button':q==='a[href]'?n.tagName==='a'&&n.getAttribute('href'):q===n.tagName}))}
  querySelector(s){return this.querySelectorAll(s)[0]||null}
  closest(){return null}
}
const nodos=new Map(),body=new Nodo('body');
document={body,head:new Nodo(),documentElement:new Nodo(),readyState:'loading',activeElement:null,
  createElement:tag=>new Nodo(tag),createTextNode:s=>{const n=new Nodo('text');n.textContent=s;return n},
  querySelector(s){if(s.startsWith('#'))return this.getElementById(s.slice(1));if(!nodos.has(s)){nodos.set(s,new Nodo());body.appendChild(nodos.get(s))}return nodos.get(s)},
  getElementById(id){if(!nodos.has('#'+id)){const n=new Nodo();n.id=id;nodos.set('#'+id,n);body.appendChild(n)}return nodos.get('#'+id)},
  querySelectorAll:s=>body.querySelectorAll(s),contains:n=>body.contains(n),addEventListener(){}};
const almacen=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i],get length(){return m.size}}};
let c;
const datos=JSON.parse(leer('web/dist/sate/datos/upiita/nucleo.json'));
const SATE={texto,modulos:{},actual:{pestana:'situacion'},pestana(id,m){this.modulos[id]=m},error:e=>{throw e},nucleoListo:async()=>{},repintar(){},ir(){},identidadSaes(){},script(){throw new Error('Situación no debe cargar otros módulos')}};
c=vm.createContext({console,document,SATE,SATE_CONFIG:config,SATE_DATA:{...datos,periodos:{actual:[],proximo:[]},asig:[],prof:[]},SATE_UNIDAD:'upiita',URL,URLSearchParams,Blob,performance,
  localStorage:almacen(),sessionStorage:almacen(),location:{hash:'#/upiita/situacion',search:'',pathname:'/sate/index.html'},history:{replaceState(){}},
  navigator:{userAgent:'Node',maxTouchPoints:0},matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},setTimeout,clearTimeout,
  requestAnimationFrame:fn=>fn(),getComputedStyle:()=>({getPropertyValue:()=>''}),MutationObserver:class{observe(){}},CSS:{escape:s=>s},innerWidth:375,innerHeight:800,
  Event:class{constructor(type){this.type=type}},fetch(){throw new Error('Red prohibida')}});
vm.runInContext('window=globalThis',c);
for(const clase of ['sate-texto-largo','sate-texto-corto']){const n=new Nodo('span');n.className=clase;document.getElementById('saes-open').appendChild(n)}
const who=new Nodo('span');who.id='saes-who';document.getElementById('saes-status').appendChild(who);
for(const n of ['componentes.js','nucleo.js','situacion.js'])vm.runInContext(leer('web/dist/sate/'+n),c,{filename:n});
c.SateUI.usarTextos(texto);
const mostrar=()=>{SATE.presente.avisos();SATE.presente.mostrar()},box=document.getElementById('sate-presente');
mostrar();assert.equal(box.hidden,true);assert.equal(document.getElementById('sate-avisos-globales').hidden,true);
assert.equal(box.querySelector('.trayectoria-minimapa'),null,'Sin SAES no hay minimapa');
vm.runInContext('ALUMNO=perfilDemo();for(const k in T)delete T[k]',c);
SATE.actual.pestana='trayectoria';mostrar();
assert.equal(document.getElementById('sate-avisos-globales').hidden,true,'Trayectoria evita los chips duplicados');
assert.equal(box.hidden,false,'Los avisos del cuerpo de Trayectoria permanecen');
for(const pestana of ['mapa','horarios','calendario']){
  SATE.actual.pestana=pestana;SATE.presente.avisos();
  assert.equal(document.getElementById('sate-avisos-globales').hidden,false,'Avisos globales en '+pestana);
}
SATE.actual.pestana='situacion';
// Calendario ficticio vigente, que pertenece exactamente al periodo planeado.
vm.runInContext(`DATA.calendario={periodo:perName(perMeta()),actividades:[{titulo:'Actividad de ejemplo',texto:'Detalle de ejemplo',para:'todos',desde:new Date().toISOString().slice(0,10),hasta:'2099-12-31',donde:'saes'}],fuente:'Fuente ficticia'};`,c);
mostrar();
let destino;
SATE.ir=id=>destino=id;
const mini=box.querySelector('.trayectoria-minimapa'),abrir=mini.querySelector('button');
assert.equal(abrir.type,'button','Botón nativo: clic y Enter activan la misma acción');
assert.equal(abrir.getAttribute('aria-label'),texto('sate.minimapa.abrir'));
assert.match(abrir.innerHTML,/<circle/,'Puntos con el perfil ficticio real');
assert.match(mini.querySelector('.mm-leg').innerHTML,/reprobadas/);
abrir.click();assert.equal(destino,'mapa','El minimapa abre la ruta existente');
const miniReal=abrir.innerHTML;
assert.equal(box.querySelectorAll('.sate-aviso').length,1,'Una sola tarjeta destacada');
const avisos=box.querySelectorAll('.sate-aviso');
assert.ok(box.textContent.includes(texto('sate.trayectoria.siguiente_paso')));
assert.ok(box.querySelectorAll('.sate-chip').every(n=>n.querySelector('.sate-sr').textContent.length>0));
assert.ok(!box.textContent.includes('sate.situacion.'));
assert.ok(!box.textContent.includes('sate.trayectoria.'));
const ventanilla=new Nodo();SATE.presente.tramite(ventanilla,'ets');
assert.match(ventanilla.textContent,/ETS/);
const real=vm.runInContext('JSON.stringify(situacionDatos())',c);
vm.runInContext("SIM.on=true;for(const k in T)delete T[k]",c);
assert.equal(vm.runInContext('JSON.stringify(situacionDatos())',c),real);
assert.equal(vm.runInContext('SIM.on',c),true);
mostrar();assert.equal(box.querySelector('.trayectoria-minimapa').querySelector('button').innerHTML,miniReal,'El presente no simula sus puntos');
vm.runInContext('PLAN_PASO=1',c);mostrar();
assert.equal(box.querySelector('.trayectoria-minimapa').querySelector('button').innerHTML,miniReal,'El presente no usa el periodo N+1');
assert.equal(vm.runInContext('PLAN_PASO',c),1,'Se conserva el pincel');
vm.runInContext('PLAN_PASO=0',c);
assert.equal(vm.runInContext('conPlan(()=>JSON.stringify(situacionDatos()),1)',c),real,'Situación conserva datos reales incluso desde el escenario N+1');
assert.ok(box.textContent.includes(texto('sate.planeacion.titulo')),'A: Situación enlaza al mapa');
const accion=box.querySelector('.sate-chip');accion.click();
const dlg=body.querySelector('.sate-modal');assert.equal(dlg.open,true);
const focos=dlg.querySelectorAll('button'),primero=focos[0],ultimo=focos.at(-1);
ultimo.focus();let atrapado=false;
dlg.dispatchEvent({type:'keydown',key:'Tab',preventDefault(){atrapado=true}});
assert.equal(atrapado,true);assert.equal(document.activeElement,primero);
primero.focus();dlg.dispatchEvent({type:'keydown',key:'Tab',shiftKey:true,preventDefault(){}});assert.equal(document.activeElement,ultimo);
dlg.dispatchEvent({type:'cancel',preventDefault(){}});assert.equal(dlg.open,false);assert.equal(document.activeElement,accion);
c.SateUI.cerrarModal();assert.equal(dlg.open,false);
vm.runInContext("SATE.calendario.proximos=()=>[{titulo:'Aviso próximo ficticio',desde:'2099-01-01'}]",c);mostrar();
assert.match(box.textContent,/Aviso próximo ficticio/);
// La tarjeta más grave debe ser la que requiere revisar dictamen, aun con simulación activa.
vm.runInContext(`{
  const m=perMeta(),k=tr().fail[0]||Object.keys(cur())[0];
  ALUMNO.reprobadas_periodo=[[k,perName(m-4),2]];ALUMNO.reprobadas=[];ALUMNO.en_curso=[];
  ALUMNO.acreditadas=ALUMNO.acreditadas.filter(a=>a[0]!==k);ALUMNO.desfasadas_saes=[];
  DATA.calendario.periodo=perName(m);DATA.calendario.transitorio={maxDesfasadas:2,periodosAtras:3,fecha:new Date().toISOString().slice(0,10)};
  for(const x in T)delete T[x];
}`,c);
mostrar();
assert.equal(box.querySelector('.sate-aviso').getAttribute('data-estado'),'error');
assert.match(box.querySelector('.sate-aviso').textContent,/Desfase y dictamen/);
assert.equal(vm.runInContext('CALAP.dictamen',c),true);
assert.ok(!config.unidades.escom.pestanas.includes('situacion'));assert.ok(!config.unidades.upibi.pestanas.includes('situacion'));
assert.ok(document.getElementById('sate-avisos-globales').querySelectorAll('.sate-chip').length>0);
const items=config.unidades.upiita.pestanas.map(id=>({id,texto:id,grupo:config.unidades.upiita.grupos.findIndex(g=>g.includes(id))}));
const tabs=c.SateUI.pestanas({items,activa:'trayectoria'}),barra=c.SateUI.barraInferior({items,activa:'trayectoria'});
assert.equal(tabs.querySelectorAll('.sate-grupo-inicio').length,1);
assert.equal(barra.querySelectorAll('.sate-grupo-inicio').length,1);
assert.match(tabs.querySelector('.sate-grupo-inicio').textContent,/mapa/);
tabs.children[1].dispatchEvent({type:'keydown',key:'ArrowRight',preventDefault(){}});
assert.equal(document.activeElement,tabs.children[2],'Flechas atraviesan grupos');
console.log('Presente: sin datos/DEMO, una tarjeta, chips globales y pendientes accesibles, Ventanilla, próximos, datos reales con simulación y foco Tab/Shift+Tab/Esc. Sin red.');
