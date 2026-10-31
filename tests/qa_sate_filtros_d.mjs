// Filtros de Horarios (R25): lógica en memoria, sin navegador. Los grupos que chocan con el horario no se muestran,
// el motivo se explica aparte, los filtros activos son chips removibles y «Limpiar filtros» los reinicia.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const src=readFileSync('web/sate/horarios.js','utf8');
const shell=readFileSync('web/sate/cascaron.html','utf8');
// Estructura: todo a la vista, sin panel ni details que se encime.
assert.ok(!shell.includes('id="f-more"'),'Sin «Más filtros» desplegable');
for(const id of ['f-turno','f-nivel','f-dia','f-cupo','f-curs','g-from','g-to','d-traslapes','d-traslape-lista','d-activos'])assert.ok(shell.includes('id="'+id+'"'),id+' a la vista');
assert.ok(!/id="f-turno"[^>]*class="chips"/.test(shell)&&/class="seg" id="f-turno"/.test(shell),'Turno es un segmentado');
assert.ok(!src.includes("createElement('dialog')"),'Sin diálogo de filtros');
class Nodo{
  constructor(){this.children=[];this.hidden=false;this.dataset={};this.value='';this.checked=false}
  addEventListener(){} setAttribute(k,v){this['_'+k]=v} closest(){return this}
  set innerHTML(v){this.html=v} get innerHTML(){return this.html||''}
}
const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,new Nodo());return nodes.get(id)};
const trad=(k,v)=>k+(v?JSON.stringify(v):'');
// c = [carrera, turno, nivel, grupo, materia, profes, bloques, créditos, clave]
const A=['C','M',1,'1AM1',10,[0],[[0,480,540]],4,'KA'];
const B=['C','M',1,'1BM1',11,[0],[[0,510,600]],4,'KB'];           // choca con A el lunes 8:30–9:00
const A2=['C','M',1,'1AM2',10,[0],[[0,500,560]],4,'KA'];          // otra opción de la misma materia que A: no cuenta
const D=['C','V',2,'2DV1',12,[0],[[1,780,840]],4,'KD'];           // martes, sin choque
const G=['C','M',1,'1GM1',13,[0],[[2,480,540]],4,'KG'];           // choca con la actividad propia
let sel=[A],own=[],marks={},personal=true;
const S={car:'C',tur:'*',niv:'*',q:'',chips:[],gavoid:[],onlyWant:false,hide:false,hideDone:false,fit:false,gap:null,soloCupo:false,cursables:false,dias:[]};
const GT={a:'',b:''},guardado=new Map();
const ctx=vm.createContext({SATE:{texto:trad},S,GT,$,esc:String,classes:()=>[A,B,A2,D,G],keyOf:c=>c[3],ws:()=>({marks}),tr:()=>({want:[],done:[]}),
  selected:()=>sel,ownAsClasses:()=>own,isPersonal:()=>personal,plan:()=>({sel:sel.map(c=>c[3])}),norm:s=>String(s).toLowerCase(),outWin:()=>false,isExcl:()=>false,
  name:c=>'Materia '+c[8],profs:()=>'Docente',overlaps:(a,b)=>{for(const x of (a.own?a.h:a[6]))for(const y of (b.own?b.h:b[6]))if(x[0]===y[0]&&x[1]<y[2]&&y[1]<x[2])return true;return false},
  slots:x=>x.own?x.h:x[6],hm:m=>Math.floor(m/60)+':'+String(m%60).padStart(2,'0'),DAYS:['Lun','Mar','Mié','Jue','Vie'],DATA:{asig:[],prof:['Docente']},
  TURNOS:{M:'Matutino',V:'Vespertino'},available:k=>k!=='KD',store:{set:(k,v)=>guardado.set(k,v)},save(){},gtSave(){},renderHFilters(){},renderGTime(){},renderOffer(){},document:{}});
const corte=src.indexOf("$('#offer').addEventListener('click',e=>{");
vm.runInContext(src.slice(0,corte)+src.slice(src.indexOf('function base()'),src.indexOf('function suggest(')),ctx);
const claves=l=>Array.from(l,c=>c[3]);
// 1. Los grupos que chocan no se muestran; el de la misma materia que uno agregado sí.
assert.deepEqual(claves(vm.runInContext('filtered()',ctx)),['1AM1','1AM2','2DV1','1GM1']);
// 2. El motivo: materia, día y hora exacta de la coincidencia.
const choques=Array.from(vm.runInContext("choquesDe(classes()[1])",ctx));
assert.equal(choques.length,1);assert.deepEqual([choques[0].con,choques[0].d,choques[0].a,choques[0].b],['Materia KA',0,510,540]);
vm.runInContext('ocultosFiltrosD(filtered())',ctx);
assert.equal($('#d-traslapes').hidden,false);
assert.match($('#d-traslapes').textContent,/d_traslapes_n\{"n":1\}/);
assert.match($('#d-traslape-lista').innerHTML,/1BM1/);assert.match($('#d-traslape-lista').innerHTML,/d_traslape_motivo/);assert.match($('#d-traslape-lista').innerHTML,/8:30/);assert.match($('#d-traslape-lista').innerHTML,/9:00/);
// 3. Actividades propias también cuentan.
own=[{own:true,i:0,n:'Gimnasio',h:[[2,500,520]]}];
assert.deepEqual(claves(vm.runInContext('filtered()',ctx)),['1AM1','1AM2','2DV1']);
vm.runInContext('ocultosFiltrosD(filtered())',ctx);
assert.match($('#d-traslape-lista').innerHTML,/Gimnasio/);assert.match($('#d-traslapes').textContent,/"n":2/);
own=[];
// 4. Un grupo ya agregado nunca se oculta por choque.
sel=[A,B];assert.ok(claves(vm.runInContext('filtered()',ctx)).includes('1BM1'));sel=[A];
// 5. Filtros nuevos: día y cursables (solo con SAES).
S.dias=[1];assert.deepEqual(claves(vm.runInContext('filtered()',ctx)),['1AM1','2DV1']);   // A se conserva por estar agregado
S.dias=[];S.cursables=true;assert.ok(!claves(vm.runInContext('filtered()',ctx)).includes('2DV1'));
personal=false;assert.ok(claves(vm.runInContext('filtered()',ctx)).includes('2DV1'),'Sin SAES no hay cursables');personal=true;S.cursables=false;
// 6. Chips activos con ✕ y «Limpiar filtros».
S.tur='M';S.dias=[0,1];S.cursables=true;S.soloCupo=true;
vm.runInContext('renderFiltrosD()',ctx);
const activos=$('#d-activos').innerHTML;
for(const k of ['tur','dias','cursables','soloCupo'])assert.match(activos,new RegExp('data-d-quitar="'+k+'"'));
assert.match(activos,/data-d-limpiar/);assert.match(activos,/d_limpiar_filtros/);
vm.runInContext("quitarFiltroD('dias')",ctx);assert.equal(JSON.stringify(S.dias),'[]');assert.equal(JSON.stringify(guardado.get('dias')),'[]');
vm.runInContext('limpiarFiltrosD()',ctx);
assert.deepEqual([S.tur,S.niv,S.q,S.soloCupo,S.cursables,S.dias.length,S.chips.length],['*','*','',false,false,0,0]);
vm.runInContext('renderFiltrosD()',ctx);assert.doesNotMatch($('#d-activos').innerHTML,/data-d-limpiar/,'Sin filtros no hay «Limpiar filtros»');
// 7. Ocultar con contador reversible.
marks={'2DV1':{s:'no'}};vm.runInContext('ocultosFiltrosD(filtered())',ctx);
assert.equal($('#d-no-ocultos').hidden,false);assert.match($('#d-no-ocultos').textContent,/d_no_ocultos\{"n":1\}/);
console.log('R25-FIL: choque oculto con motivo, día, cursables, chips, limpiar y ocultos reversibles.');

// Integración con el motor real: base única, turno preferido antiguo ignorado,
// grupos fijos conservados y ninguna recuperación de opciones fuera de filtros.
const fijo=['C','V',1,'FIJO',0,[],[[0,480,540]],4,'K'];
const alternativa=['C','M',1,'OTRO',0,[],[[0,600,660]],4,'K'];
const visible=['C','M',1,'VISIBLE',1,[],[[1,600,660]],4,'L'];
const gen=vm.createContext({FILTROS_D:true,performance,S:{car:'C',fit:true,chips:[],onlyWant:false,gpref:[],gavoid:[],gt:'V'},GT:{src:'todo',n:'auto',a:'',b:''},
  classes:()=>[fijo,alternativa,visible],filtered:()=>[visible],selected:()=>[fijo],plan:()=>({sel:['FIJO']}),
  tr:()=>({want:['K','L'],oblig:[],done:[],curso:[]}),ws:()=>({marks:{}}),ownAsClasses:()=>[],norm:String,keyOf:c=>c[3],DATA:{prof:[]},
  tmin:()=>null,overlaps:()=>false,cur:()=>({K:[],L:[]}),optCupo:()=>({}),optExceso:()=>({}),CUPOS:{excluir:()=>true,fila:()=>null}});
vm.runInContext('function* generateBank(s){return s}',gen);
vm.runInContext(src.slice(src.indexOf('function* pasoGen('),src.indexOf('function* generateBank(')),gen);
const opciones=gen.generate();
assert.equal(opciones.find(s=>s.k==='K').must,true);
assert.deepEqual(Array.from(opciones.find(s=>s.k==='K').opts,c=>c[3]),['FIJO']);
assert.deepEqual(Array.from(opciones.find(s=>s.k==='L').opts,c=>c[3]),['VISIBLE']);
console.log('R25-FIL: generador conserva grupos fijos y respeta los filtros visibles.');
