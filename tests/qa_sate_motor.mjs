// Ejecuta los módulos reales y las invariantes académicas en vm. El DOM es un
// doble mínimo para registrar eventos: aquí no se verifica renderizado ni accesibilidad.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const leer = f => readFileSync(f,'utf8');
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const textos=config.textos;
const texto=(k,v={})=>(textos[k]||k).replace(/\{(\w+),\s*plural,\s*((?:[^{}]*\{[^{}]*\})+)\s*\}/g,(m,k,c)=>{
  const n=Number(v[k]),op={};c.replace(/(=?\w+)\s*\{([^{}]*)\}/g,(_,k,t)=>{op[k]=t});
  return (op['='+n]??op[new Intl.PluralRules('es-MX').select(n)]??op.other??'').replace(/#/g,new Intl.NumberFormat('es-MX').format(n));
}).replace(/\{(\w+)\}/g,(_,k)=>v[k]??'{'+k+'}');
const N = Number(process.env.FUZZ_N || 33);
function almacen() {
  const m = new Map();
  return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i],get length(){return m.size}};
}
for (const unidad of ['upiita','escom','upibi']) {
  const datos = Object.assign({},...['nucleo','oferta','tramites'].map(b=>JSON.parse(leer('web/dist/sate/datos/'+unidad+'/'+b+'.json'))));
  let resolver;
  const resultado = new Promise(r=>resolver=r);
  const nodos = new Map();
  function nodo(id='') {
    return {id,value:'',innerHTML:'',textContent:'',hidden:true,dataset:{},options:[],style:{setProperty(){},getPropertyValue(){return ''}},
      classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},setAttribute(){},removeAttribute(){},getAttribute(){return null},
      appendChild(n){if(n.id==='fuzz-resultado')resolver(JSON.parse(n.textContent));return n},insertAdjacentHTML(){},querySelector(){return nodo()},querySelectorAll(){return []},
      contains(){return false},closest(){return null},close(){},showModal(){},focus(){},getBoundingClientRect(){return {top:0,left:0,width:1280,height:800,bottom:800}},
      offsetWidth:1280,offsetHeight:800,clientWidth:1280,scrollLeft:0};
  }
  const document = {readyState:'loading',addEventListener(){},querySelector(s){if(!nodos.has(s))nodos.set(s,nodo(s));return nodos.get(s)},
    getElementById(id){return this.querySelector('#'+id)},
    querySelectorAll(){return []},createElement:()=>nodo(),body:nodo(),head:nodo(),documentElement:nodo()};
  const SATE = {texto,modulos:{},actual:{pestana:'mapa'},pestana(id,m){this.modulos[id]=m},error:e=>{throw e},nucleoListo:async a=>a.renderTop(),repintar(){},ir(){}};
  const c = vm.createContext({console,URL,URLSearchParams,Blob,TextEncoder,structuredClone,performance,document,SATE,SATE_CONFIG:config,SATE_DATA:datos,SATE_UNIDAD:unidad,
    FUZZ_SIN_DOM:true,localStorage:almacen(),sessionStorage:almacen(),setTimeout,clearTimeout,
    location:{hash:'#/'+unidad+'/mapa',search:'?n='+N+'&semilla=1',pathname:'/sate/index.html',origin:'http://local'},history:{replaceState(){}},
    navigator:{userAgent:'Node',maxTouchPoints:0},matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},
    requestAnimationFrame:fn=>setTimeout(fn,0),getComputedStyle:()=>({getPropertyValue:()=>''}),innerWidth:1280,innerHeight:800,
    MutationObserver:class {observe(){}},
    fetch(){throw new Error('La prueba prohíbe red')},CSS:{escape:s=>s}});
  vm.runInContext('window=globalThis',c);
  for (const archivo of ['nucleo.js','mapa.js','horarios.js']) vm.runInContext(leer('web/dist/sate/'+archivo),c,{filename:archivo});
  vm.runInContext(leer('tests/fuzz/fuzz_perfiles.js'),c,{filename:'fuzz_perfiles.js'});
  const r = await resultado;
  assert.equal(r.casos,N);
  assert.equal(r.cobertura.personal,N);
  assert.ok(r.cobertura.horariosGenerados>0);
  assert.deepEqual(r.fallas,[],JSON.stringify(r.fallas.slice(0,5)));
  console.log(unidad+': '+r.casos+' perfiles; invariantes sin DOM; '+r.cobertura.horariosGenerados+' generaciones con resultados.');
}
