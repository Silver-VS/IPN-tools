// Integración sin navegador: render inicial real y módulos diferidos con dobles de DOM.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const leer = f => readFileSync(f,'utf8');
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const almacen = () => { const m=new Map(); return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i],get length(){return m.size}}; };
for (const unidad of ['upiita','escom','upibi']) {
  const datos=Object.assign({},...['nucleo','oferta'].map(n=>JSON.parse(leer(`web/dist/sate/datos/${unidad}/${n}.json`))));
  const nodos=new Map(), cargados=[], pendientes=new Map(); let api, contexto;
  const horariosIDs=new Set([...leer('web/sate/cascaron.html').split('<section id="v-hor"')[1].split('<!-- módulo')[0].matchAll(/id="([^"]+)"/g)].map(m=>'#'+m[1]));
  function nodo(id='') { return {id,hidden:true,value:'',dataset:{},innerHTML:'',textContent:'',options:[],children:[],style:{setProperty(){},getPropertyValue(){return ''}},
    classList:{add(){},remove(){},toggle(){},contains(){return false}},eventos:{},addEventListener(n,fn){this.eventos[n]=fn},setAttribute(){},removeAttribute(){},getAttribute(){return null},
    appendChild(){},insertAdjacentHTML(){},querySelector:()=>nodo(),querySelectorAll:()=>[],closest:()=>null,contains:()=>false,
    offsetWidth:1280,offsetHeight:800,clientWidth:1280,scrollLeft:0,getBoundingClientRect:()=>({top:0,left:0,bottom:800,width:1280,height:800}),showModal(){this.hidden=false},close(){this.hidden=true}}; }
  const document={readyState:'loading',addEventListener(){},querySelector(s){
    assert.ok(!horariosIDs.has(s)||cargados.includes('horarios.js'),'Dependencia de Horarios en el primer pintado: '+s);
    if(!nodos.has(s))nodos.set(s,nodo(s));return nodos.get(s);
  },getElementById(id){return this.querySelector('#'+id)},querySelectorAll:()=>[],createElement:()=>nodo(),body:nodo(),head:nodo(),documentElement:nodo()};
  const SATE={texto:k=>config.textos[k]||k,modulos:{},actual:{pestana:'mapa'},pestana(id,m){this.modulos[id]=m},error:e=>{throw e},nucleoListo:async a=>{api=a},repintar(){},ir(){},identidadSaes(){},
    script(n){if(!pendientes.has(n)){cargados.push(n);vm.runInContext(leer('web/dist/sate/'+n),contexto,{filename:n});pendientes.set(n,Promise.resolve())}return pendientes.get(n)}};
  contexto=vm.createContext({console,document,SATE,SATE_DATA:datos,SATE_UNIDAD:unidad,URL,URLSearchParams,Blob,performance,
    localStorage:almacen(),sessionStorage:almacen(),location:{hash:'#/'+unidad+'/mapa',search:'',pathname:'/sate/index.html'},history:{replaceState(){}},
    navigator:{userAgent:'Node',maxTouchPoints:0},matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},setTimeout,clearTimeout,
    requestAnimationFrame:fn=>fn(),getComputedStyle:()=>({getPropertyValue:()=>''}),MutationObserver:class{observe(){}},CSS:{escape:s=>s},innerWidth:1280,innerHeight:800,
    fetch(){throw new Error('Red prohibida en QA de cargas')}});
  vm.runInContext('window=globalThis',contexto);
  vm.runInContext(leer('web/dist/sate/nucleo.js'),contexto,{filename:'nucleo.js'});
  await SATE.script('mapa.js');
  api.renderTop(); api.renderTray(); await vm.runInContext('renderStats()',contexto);
  vm.runInContext('ALUMNO=perfilDemo();for(const k in T)delete T[k]',contexto);
  api.renderTray(); await vm.runInContext('renderStats()',contexto);
  assert.deepEqual(cargados,['mapa.js'],'Mapa con/sin perfil no descarga Horarios ni Desempeño');
  await vm.runInContext('SAES.open()',contexto);
  await vm.runInContext('SAES.open()',contexto);
  assert.equal(cargados.filter(n=>n==='saes-dialogo.js').length,1);
  await SATE.script('horarios.js'); SATE.modulos.horarios.montar(); SATE.modulos.horarios.mostrar();
  assert.ok(!cargados.includes('exportacion.js'));
  await document.querySelector('#b-export').eventos.click();
  await document.querySelector('#b-export').eventos.click();
  assert.equal(cargados.filter(n=>n==='exportacion.js').length,1);
  console.log(unidad+': Mapa con/sin perfil; SAES y exportación cargados una vez; Horarios independiente.');
}
