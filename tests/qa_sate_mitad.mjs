// Interacción del mapa sin navegador, red ni datos personales.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const fuente=readFileSync('web/sate/mapa.js','utf8');
const css=readFileSync('web/sate/componentes.css','utf8');
const html=readFileSync('web/sate/cascaron.html','utf8');
const datos=new Map(), eventos={}, controles=[], notas=[];
function nodo(dataset={}){
  const clases=new Set();
  return {dataset,hidden:false,attrs:{},children:[],classList:{toggle(k,on){on?clases.add(k):clases.delete(k)},contains:k=>clases.has(k)},
    setAttribute(k,v){this.attrs[k]=v},querySelector(s){return this.children.find(n=>'mapaCurso' in n.dataset)||null},
    prepend(n){this.children.unshift(n)},appendChild(n){this.children.push(n)},insertAdjacentHTML(pos,html){this.innerHTML=html},remove(){notas.splice(notas.indexOf(this),1)}};
}
const seg=nodo(), actions=nodo(), supuesto=nodo(), note=nodo(), insp=nodo();
note.appendChild=n=>notas.push(n);note.querySelectorAll=()=>[...notas];
controles.push(nodo({planPaso:'0'}),nodo({planPaso:'1'}));seg.children.push(...controles);
const cajas=[nodo({box:'A'}),nodo({box:'B'})], columnas=[nodo()], filas=[nodo()];
const dibujo={cajas,columnas,filas};
let hay=true,elegidas=[],repintados=0,consultas=0;
const c=vm.createContext({console,S:{car:'DEMO',planPaso:0},ALUMNO:{periodo_actual:'27/1',horario_inscrito:[['DEMO','A','Materia ficticia','Docente ficticio',[[0,420,510]]]]},
  DATA:{periodos:{actual:[['DEMO',0,0,'DEMO',0,0,[],0,'A',0,['SALÓN DEMO']]]}},DAYN:['Lunes'],hm:n=>`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`,esc:String,
  PLAN_DOS_PERIODOS:true,planPasos:()=>[0,1],planClave:()=> '27/2',planInicio:()=>55,perIdx:p=>p==='27/1'?54:null,perName:p=>p===54?'27/1':'27/2',
  store:{get:(k,d)=>datos.get(k)??d,set:(k,v)=>datos.set(k,v)},isPersonal:()=>true,conSim:(s,f)=>f(),conPlan:f=>f(),tr:()=>({enCurso:hay?['A']:[],want:elegidas}),
  cur:()=>({A:['Materia ficticia']}),renderSide0(){},renderInsp(){},renderSide(){c.renderSide0()},renderTray(){repintados++;c.renderSide()},resaltarMapa(){consultas++},
  SATE:{pestana(){},texto:(k,v)=>v?`${v.periodo} en curso`:k},
  document:{createElement:()=>nodo(),addEventListener:(k,f)=>eventos[k]=f,querySelectorAll:s=>s.includes('data-plan-paso')?controles:s.includes('actions')?[actions]:[seg]},
  $:s=>s==='#plan-supuesto'?supuesto:s==='#mapnote'?note:insp});
vm.runInContext(fuente,c);
c.resaltarMapa=()=>{consultas++};
for(const [hay,guardado,n,esperado] of [[true,null,0,'curso'],[true,null,1,'plan'],[false,{modo:'curso'},0,'plan'],[true,{modo:'plan'},0,'plan'],[true,{modo:'curso'},1,'curso']]){
  assert.equal(c.mapaModoInicial(hay,guardado,n),esperado);
}
c.montarModoMapa();c.renderSide();
assert.equal(c.mapaEnCurso(),true);assert.equal(seg.children[0].textContent,'27/1 en curso');
assert.equal(actions.inert,true);assert.equal(actions.classList.contains('mapa-solo-consulta'),true);
c.S.mapHover='A';
const ambitos=[];
c.conSim=(on,f)=>{ambitos.push(['sim',on]);return f()};
c.conPlan=(f,paso)=>{ambitos.push(['plan',paso]);return f()};
c.renderInsp();
assert.ok(ambitos.some(([k,v])=>k==='sim'&&v===false),'la ficha consulta datos reales');
assert.ok(ambitos.some(([k,v])=>k==='plan'&&v===0),'la ficha no supone acreditado el primer plan');
function click(target){
  let detenido=false;
  eventos.click({target,preventDefault(){},stopImmediatePropagation(){detenido=true}});
  // El manejador histórico solo recibe eventos que no fueron interceptados.
  if(!detenido&&target===cajas[0])elegidas=elegidas.length?[]:['A'];
}
cajas[0].closest=s=>s==='#v-tray'?{}:null;
const materia={closest:s=>s.startsWith('[data-box]')?cajas[0]:null};
click(materia);assert.deepEqual(elegidas,[]);assert.equal(c.S.mapHover,'A');assert.equal(consultas,1);
eventos.keydown({target:{closest:()=>cajas[0]},key:'Enter',preventDefault(){},stopImmediatePropagation(){}});
assert.deepEqual(elegidas,[]);assert.equal(consultas,2);
const plan={closest:s=>s==='[data-plan-paso]'?controles[0]:null};
click(plan);assert.equal(c.mapaEnCurso(),false);assert.equal(actions.inert,false);
cajas[0].closest=s=>s.startsWith('[data-box]')?cajas[0]:s==='#v-tray'?{}:null;
click(cajas[0]);assert.deepEqual(elegidas,['A']);
assert.equal(datos.get('mapModo.DEMO.27/2').modo,'plan');
assert.equal(repintados,0,'alternar entre curso y el primer periodo conserva el dibujo');
assert.strictEqual(dibujo.cajas,cajas);assert.strictEqual(dibujo.columnas,columnas);assert.strictEqual(dibujo.filas,filas);
assert.match(c.mapaHorarioConsulta('A'),/DEMO · Docente ficticio · Lunes 7:00–8:30 · SALÓN DEMO/);
click({closest:s=>s==='[data-plan-paso]'?controles[1]:null});
assert.equal(c.S.planPaso,1);assert.equal(datos.get('mapModo.DEMO.27/2').paso,1);assert.equal(repintados,1);
hay=false;c.renderSide();assert.equal(seg.children[0].hidden,true);assert.equal(c.mapaEnCurso(),false);
assert.match(css,/\.mapa-solo-consulta\{visibility:hidden;pointer-events:none\}/,'las acciones conservan sus dimensiones y no reciben clics');
assert.doesNotMatch(css.match(/\.mapa-solo-consulta\{([^}]+)\}/)[1],/display|height|padding|margin/);
assert.match(html,/\.plan-bandeja\{position:sticky/);
console.log('qa_sate_mitad: ok (inicio, persistencia, consulta, teclado, retorno al plan, dibujo conservado y reserva CSS)');
