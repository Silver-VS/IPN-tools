// Contratos de rendimiento y precarga sin navegador, red ni datos personales.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const leer=p=>readFileSync(p,'utf8');
const c=vm.createContext({console}), enlaces=[], json=[], idle=[], frames=[], timers=[];
Object.assign(c,{navigator:{connection:{saveData:false}},document:{createElement:()=>({}),head:{appendChild:n=>enlaces.push(n)}},
  requestIdleCallback:f=>idle.push(f),requestAnimationFrame:f=>frames.push(f),setTimeout:f=>timers.push(f)});
vm.runInContext(leer('web/sate/rutas.js'),c);
const cfg={pestanas:['mapa','horarios','guia'],tramites:[],guiaDatos:true};
const p=c.SateRutas.precargador(cfg,'ficticia',async url=>json.push(url));
p.reposo(['mapa','horarios','guia']);
assert.equal(enlaces.length+json.length,0,'No hay precarga antes de la primera pintura');
frames.shift()();timers.shift()();assert.equal(idle.length,1,'La precarga usa requestIdleCallback');
idle.shift()();await new Promise(setImmediate);
assert.deepEqual(json,['datos/ficticia/oferta.json']);
assert.ok(enlaces.some(n=>n.href==='mapa.js'&&n.rel==='preload'&&n.as==='script'),'Script descargado sin ejecutarlo');
await p.precargar('mapa');assert.equal(json.length,1,'Hover/foco reutiliza solicitudes');
await p.precargar('guia');assert.ok(json.includes('datos/ficticia/guia.json'));
assert.ok(enlaces.some(n=>n.href==='guia.css'&&n.as==='style'));
const pedidos=json.length+enlaces.length;c.navigator.connection.saveData=true;
await p.precargar('horarios');p.reposo(['horarios']);
assert.equal(json.length+enlaces.length,pedidos,'saveData impide precarga tanto en reposo como por intención');
// Fallback sin requestIdleCallback y posibilidad de reintento tras un fallo de JSON.
delete c.requestIdleCallback;c.navigator.connection.saveData=false;
let intentos=0;
const fallback=c.SateRutas.precargador(cfg,'ficticia',async()=>{if(++intentos===1)throw new Error('fallo ficticio')});
await fallback.precargar('mapa');await fallback.precargar('mapa');assert.equal(intentos,2);
fallback.reposo(['guia']);frames.shift()();timers.shift()();assert.ok(timers.length);
const inicio=leer('web/sate/inicio.js'), activar=inicio.split('  async function activar(r) {')[1].split('  function repintar()')[0];
assert.ok(activar.indexOf('tabs.seleccionar(marca)')<activar.indexOf('await '),'La selección antecede al primer await');
assert.ok(activar.indexOf('espera.hidden = false')<activar.indexOf('await '),'Título y espacio reservado antes de esperar');
assert.match(activar,/requestAnimationFrame\(\(\) => setTimeout\(ok, 0\)\)/,'Se permite pintar antes del cómputo');
assert.match(inicio,/datosCache\.has\(url\)[\s\S]*datosCache\.delete\(url\)/,'Caché JSON con reintento');
for(const archivo of ['guia.js','temarios.js'])assert.match(leer('web/sate/'+archivo),/SATE\.json \? SATE\.json/,'La vista reutiliza JSON precargado');
for(const nombre of ['tramites','electivas']){
  const d=JSON.parse(leer('web/dist/sate/datos/upiita/'+nombre+'.json'));
  assert.ok(!JSON.stringify(d).includes('JVBERi0'),'Los PDF no viajan al abrir la pestaña');
  assert.ok(!d.pdfs&&!d.dictamen?.pdfs&&!d.bajas?.pdfs);
}
for(const nombre of ['dictamen','bajas','electivas']){
  const d=JSON.parse(leer('web/dist/sate/datos/upiita/'+nombre+'-pdf.json'));
  assert.ok(Object.values(d).every(pdf=>pdf.startsWith('JVBERi0')),'PDF conservados en archivo bajo demanda');
}
assert.match(leer('web/sate/electivas.js'),/async function generar\(d\)[\s\S]*electivas-pdf\.json/,'Electivas descarga PDF solo al generar');
assert.match(leer('web/sate/tramites.js'),/await SATE\.prepararTramite\?\.\(id\)/,'Descarga desde la lista también carga plantillas');
// Ejecutar el encabezado real: ni reescribir opciones ni recorrer grupos al cambiar de pestaña.
const core=leer('web/sate/nucleo.js');let opciones=0, recorridos=0;
let oferta=[['B',null,null,'1BV1']];const selector={set innerHTML(v){opciones++}};
oferta.filter=new Proxy(oferta.filter,{apply(fn,self,args){recorridos++;return Reflect.apply(fn,self,args)}});
const n=vm.createContext({S:{per:'proximo',car:'B',tab:'tray'},DATA:{carreras:{B:'Ingeniería ficticia'},mapas:{B:{}},capturado:'2026-10-17'},
  document:{querySelectorAll:()=>[]},$ :s=>s==='#f-carrera'?selector:{},renderSimGlobal(){},hasOffer:()=>true,classes:()=>oferta,
  ajustarCarrera(){},esc:s=>s,SATE:{texto:k=>k}});
vm.runInContext(core.slice(core.indexOf('let TOP_CARRERAS='),core.indexOf('const notaValida=' )).split('/*')[0],n);
vm.runInContext('renderTop();S.tab="hor";renderTop()',n);
assert.equal(opciones,1);assert.equal(recorridos,1);
oferta=[...oferta,['B',null,null,'2BV1']];
vm.runInContext('renderTop()',n);
assert.equal(vm.runInContext('TOP_GRUPOS.get(classes()).get(S.car)',n),2,'Reemplazar la oferta invalida el conteo');
console.log('OK: precarga, saveData, caché, respuesta inmediata, partición PDF y encabezado sin recomputar.');
