// Primera visita: código generado y callbacks reales, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=f=>readFileSync(f,'utf8');
const html=leer('web/dist/sate/index.html');
const config=JSON.parse(html.match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const texto=k=>{assert.ok(config.textos[k],k);return config.textos[k]};
const vacio=html.slice(html.indexOf('id="desempeno-vacio"'),html.indexOf('<details class="sate-desp" id="desempeno-simulacion"'));
assert.equal((vacio.match(/<button/g)||[]).length,2);
assert.match(vacio,/class="btn primary"[^>]*id="desempeno-lector"/);
assert.match(vacio,/id="desempeno-explorar"/);
assert.doesNotMatch(vacio,/onclick=/);
assert.equal(texto('sate.planeacion.oferta_vacia'),'Aún no eliges materias en el Mapa curricular. Elígelas allá o consulta toda la oferta.');
assert.match(texto('sate.trayectoria.sin_datos'),/SATE.*sin datos puedes explorar el mapa y armar tu horario/);
const nodos=new Map();
const nodo=id=>{if(!nodos.has(id))nodos.set(id,{eventos:{},addEventListener(k,f){this.eventos[k]=f}});return nodos.get(id)};
const desempe=leer('web/dist/sate/desempeno.js');
const montar=desempe.slice(desempe.indexOf('  montar(){')+11,desempe.indexOf('\n  },',desempe.indexOf('  montar(){')));
let destino,abierto=false;
vm.runInNewContext(montar,{$:nodo,prepararSeccion(){},SAES:{open(){abierto=true}},SATE:{texto,ir:id=>destino=id}});
assert.equal(nodo('#desempeno-lector').textContent,'Cargar datos del SAES');
assert.equal(nodo('#desempeno-explorar').textContent,'Explorar el mapa');
nodo('#desempeno-lector').eventos.click();assert.equal(abierto,true);
nodo('#desempeno-explorar').eventos.click();assert.equal(destino,'mapa');
const fuenteMapa=leer('web/dist/sate/mapa.js');
const ayuda=fuenteMapa.slice(fuenteMapa.indexOf('function renderAyudaPrimeraVisita'),fuenteMapa.indexOf("SATE.pestana('mapa'"));
const box={replaceChildren(){this.aviso=null},appendChild(n){this.aviso=n}};
const guardado=new Map();let aviso;
const c=vm.createContext({$:()=>box,ALUMNO:null,SATE:{texto},SateUI:{aviso(o){aviso=o;return o}},
  store:{get:(k,d)=>guardado.get(k)??d,set:(k,v)=>guardado.set(k,v)}});
vm.runInContext(ayuda,c);
c.renderAyudaPrimeraVisita();assert.equal(box.hidden,false);assert.equal(aviso.descartable,true);
assert.equal(aviso.titulo,'Toca o haz clic en las materias que quieres cursar; luego arma tu horario en Horarios de clase.');
aviso.alDescartar();assert.equal(box.hidden,true);c.renderAyudaPrimeraVisita();assert.equal(box.aviso,null);
guardado.clear();c.ALUMNO={leido:'2026-10-07'};c.renderAyudaPrimeraVisita();assert.equal(box.hidden,true);
c.ALUMNO=null;c.renderAyudaPrimeraVisita();assert.equal(box.hidden,false);
const saes=leer('web/dist/sate/nucleo.js').match(/const SAES=\{[\s\S]*?\n\};/)[0];
assert.match(leer('web/dist/sate/saes-dialogo.js'),/id=\\"saes-paste-clip\\"/);
assert.match(html,/@media\(hover:none\)\{\.saes-arrastre\{display:none\}\.saes-tactil\{display:block\}/);
for(const modo of ['ok','ausente','denegado','invalido','sin-contrato','otra-unidad']){
  const elementos=new Map();let cargado,guardadoSaes,cierres=0;
  const n=id=>{if(!elementos.has(id))elementos.set(id,{value:'',dataset:{fallback:texto('sate.lector.pegado_manual')},eventos:{},addEventListener(k,f){this.eventos[k]=f},focus(){this.enfocado=true}});return elementos.get(id)};
  const dl={querySelector:n,addEventListener(){}};
  const datos={upiita_saes:1,acreditadas:[],unidad:modo==='otra-unidad'?'escom':'upiita',leido:'2026-10-07'};
  const clipboard=modo==='ausente'?undefined:{readText:async()=>{if(modo==='denegado')throw new Error('NotAllowedError');return modo==='invalido'?'invalido':modo==='sin-contrato'?'{}':JSON.stringify(datos)}};
  const ctx=vm.createContext({document:{getElementById:()=>dl,addEventListener(){}},navigator:{clipboard},matchMedia:()=>({matches:true}),setTimeout(f){cierres++}});
  vm.runInContext(saes+'\nglobalThis.saes=SAES;',ctx);
  ctx.saes.U=()=> 'upiita';
  ctx.saes.save=d=>guardadoSaes=d;ctx.saes.status=()=>{};
  ctx.saes.wire(d=>cargado=d);
  assert.equal(n('#saes-manual').open,true);
  await n('#saes-paste-clip').eventos.click({currentTarget:n('#saes-paste-clip')});
  if(modo==='ok'){assert.equal(cargado.unidad,'upiita');assert.equal(guardadoSaes,cargado);assert.equal(cierres,1)}
  else {assert.equal(cargado,undefined);assert.equal(guardadoSaes,undefined)}
  if(modo==='ausente'||modo==='denegado'){
    assert.equal(n('#saes-paste').enfocado,true);assert.equal(n('#saes-msg').textContent,texto('sate.lector.pegado_manual'));
    n('#saes-paste').eventos.paste({preventDefault(){},clipboardData:{getData:()=>JSON.stringify(datos)}});
    assert.equal(cargado.unidad,'upiita');
  }
}
console.log('Primera visita: salidas, ayuda persistente y portapapeles con respaldo OK');
