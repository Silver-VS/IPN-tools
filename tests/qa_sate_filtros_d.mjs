// Contrato DOM en memoria. No simula mediciones de un navegador.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const src=readFileSync('web/sate/horarios.js','utf8');
const anterior=execFileSync('git',['show','HEAD:web/sate/horarios.js'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
const filtrosAnteriores=anterior.slice(anterior.indexOf('function base()'),anterior.indexOf('function suggest('));
const head=src.slice(0,src.indexOf("if(typeof CUPOS"));
const legacy=src.slice(src.indexOf('function base()'),src.indexOf('function suggest('));
const fila=['C','M',1,'G',0,[0],[[0,480,540]],4,'K'];
for(const width of [1300,768,375])for(const tema of ['claro','oscuro'])for(const modo of ['apagado','hash','local','denegado']){
  let mutations=0;
  class Nodo{
    constructor(){this.children=[];this.classList={contains:()=>this.montado,add:()=>{this.montado=true;mutations++}};this.lastChild={};this.dataset={};this.parentElement={appendChild:()=>{mutations++}}}
    prepend(...n){this.children.unshift(...n);mutations++} append(...n){this.children.push(...n);mutations++}
    insertBefore(n){this.children.push(n);mutations++} closest(){return this} addEventListener(){}
    after(n){this.children.push(n);mutations++}
    appendChild(n){this.children.push(n);mutations++}setAttribute(){}
    set innerHTML(v){this.html=v;mutations++} get innerHTML(){return this.html||''}
  }
  const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,new Nodo());return nodes.get(id)};
  const S={car:'C',tur:'*',niv:'*',q:'',chips:[],gavoid:[],onlyWant:false,hide:false,hideDone:false,fit:false,soloCupo:false};
  const ctx=vm.createContext({location:{hash:modo==='hash'?'#filtros-d':''},localStorage:{getItem(){if(modo==='denegado')throw Error('denegado');return modo==='local'?'1':null}},
    SATE:{texto:(k,v)=>k+JSON.stringify(v||{})},S,GT:{a:'',b:''},document:{createElement:()=>new Nodo(),documentElement:{clientWidth:width,dataset:{tema}}},$,
    esc:String,classes:()=>[fila],keyOf:c=>c[3]+'|'+c[8],ws:()=>({marks:{}}),tr:()=>({want:[],done:[]}),selected:()=>[],ownAsClasses:()=>[],isPersonal:()=>false,
    plan:()=>({sel:[]}),norm:s=>s.toLowerCase(),outWin:()=>false,isExcl:()=>false,name:()=> 'Materia',profs:()=> 'Docente',overlaps:()=>false,DATA:{asig:['Materia'],prof:['Docente']},TURNOS:{M:'Matutino'}});
  vm.runInContext(head+legacy,ctx);
  const before=JSON.stringify(S),original=JSON.stringify(vm.runInContext('filtered()',ctx));
  vm.runInContext('renderFiltrosD()',ctx);
  assert.equal(JSON.stringify(S),before,'Montar no altera el estado: '+modo);
  assert.equal(JSON.stringify(vm.runInContext('filtered()',ctx)),original);
  if(modo==='apagado'||modo==='denegado')assert.equal(mutations,0,'Sin interruptor: ningún cambio DOM a '+width+' '+tema);
  else{
    assert.ok(mutations>0);assert.match($('#d-cuenta').textContent,/d_cuenta/);
    assert.ok($('#filters').children.length);assert.match($('#d-reglas').innerHTML,/d_sin_filtros/);
    S.q='materia';S.tur='M';S.gavoid=['Docente'];
    vm.runInContext('renderFiltrosD()',ctx);
    assert.match($('#d-reglas').innerHTML,/d_busqueda/);assert.match($('#d-reglas').innerHTML,/d_sin_profesor/);
    assert.match($('#d-activos').innerHTML,/data-d-quitar="q"/);
    S.fit=true;S.q='inexistente';
    const ocultos=vm.runInContext('ocultosFiltrosD([])',ctx);
    assert.match(ocultos,/d_busqueda/);
    assert.doesNotMatch(ocultos,/d_sin_choques/,'No atribuye a compatibilidad una exclusión causada por búsqueda');
  }
  if(modo==='apagado'){
    for(const cambios of [{onlyWant:true},{onlyWant:false,q:'inexistente'},{q:'',tur:'V'},{tur:'*',niv:2},{niv:'*',fit:true},{fit:false,hide:true},{hide:false,soloCupo:true}]){
      Object.assign(S,cambios);
      const resultado=JSON.stringify(vm.runInContext('filtered()',ctx));
      vm.runInContext(filtrosAnteriores,ctx);
      assert.equal(JSON.stringify(vm.runInContext('filtered()',ctx)),resultado,'Oferta idéntica a HEAD sin interruptor');
      vm.runInContext(legacy,ctx);
    }
  }
}
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
console.log('R14-FIL: DOM con/sin interruptor, almacenamiento denegado, estado y oferta intactos sin interruptor; matriz 1300/768/375 claro/oscuro. Sin medición visual.');
