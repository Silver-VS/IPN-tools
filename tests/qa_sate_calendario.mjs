// Datos y vista real con DOM en memoria; no abre navegador ni utiliza red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=p=>readFileSync(p,'utf8'), data=JSON.parse(leer('data/calendario.json'));
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const categorias=['academico','gestion','becas','servicios','tt','feriado'];
let checks=0;
for(const [u,c] of Object.entries(data).filter(([k])=>!k.startsWith('_'))){
  const eventos=[...c.actividades,...c.eventos];
  for(const e of eventos){
    for(const f of [e.desde,e.hasta]){assert.match(f,/^\d{4}-\d{2}-\d{2}$/);assert.equal(new Date(f+'T00:00:00Z').toISOString().slice(0,10),f)}
    assert.ok(e.desde<=e.hasta);assert.ok(categorias.includes(e.categoria));assert.ok(e.fuente?.trim());assert.ok(e.titulo?.trim());checks++;
  }
  assert.equal(JSON.stringify(JSON.parse(leer('web/dist/sate/datos/'+u+'/nucleo.json')).calendario),JSON.stringify(c));
  assert.equal(new Set(eventos.map(e=>[e.desde,e.hasta,e.titulo].join('|'))).size,eventos.length);
}
assert.equal(data.upiita.eventos.length,22);
assert.ok(!data.upiita.eventos.some(e=>/ETS|evaluacion/i.test(e.titulo)));
class Nodo{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={}}
  appendChild(n){this.children.push(n);return n}
  replaceChildren(){this.children=[];this.text=''}
  set textContent(t){this.text=String(t)}get textContent(){return (this.text||'')+this.children.map(n=>n.textContent).join(' ')}
  setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]}
  focus(){document.activeElement=this}
  all(){return this.children.flatMap(n=>[n,...n.all()])}
}
const box=new Nodo('section'), document={createElement:t=>new Nodo(t),getElementById:id=>id==='sate-calendario'?box:box.all().find(n=>n.id===id)};
const SATE={modulos:{},texto:(k,v={})=>(config.textos[k]||k).replace(/\{(\w+)\}/g,(_,k)=>v[k]??'{'+k+'}'),pestana(id,m){this.modulos[id]=m}};
let modal;
const c=vm.createContext({SATE,DATA:{calendario:data.upiita},document,console,SateUI:{modal:(titulo,cuerpo)=>modal={titulo,cuerpo},cerrarModal(){}},perMeta:()=>0,perName:i=>i===0?'27/1':'26/2',perIdx:()=>0});
const nucleo=leer('web/dist/sate/nucleo.js');
vm.runInContext(nucleo.slice(nucleo.indexOf('SATE.calendario={'),nucleo.indexOf('let CALAP=')),c);
SATE.calendario.hoy=()=> '2026-10-20';
assert.equal(SATE.calendario.eventos().length,34);
assert.equal(SATE.calendario.proximos(0).length,0);
assert.equal(SATE.calendario.proximos(2,['becas']).length,2);
assert.equal(SATE.calendario.proximos(1,['becas'])[0].desde,'2026-10-26');
assert.ok(SATE.calendario.proximos(99).some(e=>e.desde==='2026-10-19'),'Incluye eventos en curso');
assert.ok(SATE.calendario.proximos(99).every(e=>e.hasta>='2026-10-20'));
assert.equal(SATE.calendario.proximos(5,[]).length,0);
vm.runInContext(leer('web/dist/sate/calendario.js'),c);
const mostrar=()=>SATE.modulos.calendario.mostrar();mostrar();
const dias=()=>box.all().filter(n=>n.getAttribute('data-fecha'));
assert.equal(dias().length,31);assert.equal(box.all().filter(n=>n.tagName==='th').length,7);
assert.equal(dias().filter(n=>n.tabIndex===0).length,1);assert.equal(dias().find(n=>n.getAttribute('aria-current')==='date').getAttribute('data-fecha'),'2026-10-20');
assert.ok(!box.textContent.includes('sate.calendario.'));
const dia19=dias()[18];dia19.onclick();assert.match(modal.cuerpo.textContent,/registro de protocolo/);assert.match(modal.cuerpo.textContent,/Trabajo Terminal, UPIITA/);
assert.ok(dia19.children.some(n=>n.getAttribute('data-continua')==='true'));
document.getElementById('cal-filtro-tt').onclick();assert.equal(document.getElementById('cal-filtro-tt').getAttribute('aria-pressed'),'false');assert.ok(!box.textContent.includes('Entrega de constancias'));
const dia=dias()[19];dia.onkeydown({key:'ArrowRight',preventDefault(){}});assert.equal(document.activeElement.getAttribute('data-fecha'),'2026-10-21');
document.activeElement.onkeydown({key:'ArrowDown',preventDefault(){}});assert.equal(document.activeElement.getAttribute('data-fecha'),'2026-10-28');
document.getElementById('cal-proximo').onclick();assert.equal(dias().length,30);assert.ok(box.all().some(n=>n.className==='calendario-feriado'));
// El horizonte cambia con el periodo planeado; ambos meses de reinscripción 27/2 quedan accesibles.
c.perName=i=>i===0?'27/2':'27/1';mostrar();
while(document.getElementById('cal-proximo').disabled!==true)document.getElementById('cal-proximo').onclick();
assert.equal(dias()[0].getAttribute('data-fecha'),'2027-07-01');
c.DATA.calendario=null;mostrar();assert.equal(dias().length,0);assert.match(box.textContent,/Sin eventos confirmados/);assert.equal(SATE.calendario.proximos(5).length,0);
c.DATA.calendario=data.upiita;
SATE.calendario.hoy=()=> '2099-01-01';assert.equal(SATE.calendario.proximos(5).length,0);
assert.ok(!config.unidades.escom.pestanas.includes('calendario'));assert.ok(!config.unidades.upibi.pestanas.includes('calendario'));
console.log(`Calendario: ${checks} eventos válidos, fuente única, próximos/en curso/filtros, mes de 31/30 días, hoy, teclado, continuidad, detalle y feriados. OK.`);
