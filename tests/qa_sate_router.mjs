// Integración del cargador/enrutador con dobles de DOM y almacenamiento en Node.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const config = JSON.parse(readFileSync('data/sate.json','utf8')).unidades;
for (const hashInicial of ['#/upiita/mapa','#/upiita/situacion','#code=abc','#demo','#error=denied','']) {
 for(const personal of (hashInicial? [false]:[false,true])) {
  const eventos = {}, archivos = [], fetches = [], guardado = {}, nodos = new Map(), vistos = [];
  let cambioUnidad = 0;
  function nodo(id='') { return {id,hidden:false,textContent:'',setAttribute(){},appendChild(){},addEventListener(){},replaceChildren(){},querySelector:sel=>nodo(sel)}; }
  const location = {hash:hashInicial,pathname:'/sate/index.html',search:'?x=1',reload(){cambioUnidad++}};
  let c;
  const api = {store:{get:(k,d)=>guardado[k]??d,set:(k,v)=>guardado[k]=v},personal:()=>personal,estado:{car:'B'},
    renderTop(){},renderAviso(){},renderTray(){vistos.push('tray')},renderHor(){vistos.push('hor')},ofertaLista(){}};
  const document = {getElementById(id){if(!nodos.has(id))nodos.set(id,nodo(id));return nodos.get(id)},
    addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>nodo(),body:nodo(),head:{appendChild(s){
      archivos.push(s.src);
      setImmediate(()=>{
        if(s.src==='nucleo.js') c.SATE.nucleoListo(api).catch(e=>{throw e});
        if(s.src==='mapa.js') c.SATE.pestana('mapa',{montar(){vistos.push('montar-mapa')},mostrar(){vistos.push('mapa')},ocultar(){vistos.push('ocultar-mapa')}});
        if(s.src==='situacion.js') c.SATE.presente={avisos(){vistos.push('avisos')},tramite(){vistos.push('procedimiento')}};
        if(s.src==='calendario.js') c.SATE.pestana('calendario',{montar(){vistos.push('montar-calendario')},mostrar(){vistos.push('mes')},ocultar(){vistos.push('ocultar-calendario')}});
        if(s.src==='desempeno.js') c.SATE.pestana('trayectoria',{montar(){vistos.push('montar-desempeno')},mostrar(){vistos.push('desempeno')},ocultar(){vistos.push('ocultar-desempeno')}});
        if(s.src==='horarios.js') c.SATE.pestana('horarios',{montar(){vistos.push('montar-hor')},mostrar(){vistos.push('hor')}});
        s.onload();
      });
    }}};
  c = vm.createContext({console,URLSearchParams,document,location,setTimeout,clearTimeout,
    navigator:{connection:{saveData:true}},localStorage:{getItem:()=>null},IPNT:{set:(k,v)=>guardado[k]=v},
    SATE_CONFIG:{unidades:config,textos:{}},history:{replaceState(a,b,url){location.hash=url.slice(url.indexOf('#'))}},
    addEventListener:(n,f)=>eventos[n]=f,
    situacionDatos(){return null},renderCalendario(){vistos.push('calendario')},
    fetch:async url=>{fetches.push(url);return {ok:true,json:async()=>url.includes('nucleo')?{mapas:{B:{}},unidad:'upiita'}:{}}},
    SateUI:{usarTextos(){},usarAlmacen(){},modal(){},cerrarModal(){},ayuda(){return nodo()},
      pestanas(o){const n=nodo();n.seleccionar=id=>o.alCambiar(id);return n},barraInferior(){return {marcar(){}}}}
  });
  vm.runInContext('window=globalThis',c);
  vm.runInContext(readFileSync('web/sate/rutas.js','utf8'),c);
  vm.runInContext(readFileSync('web/sate/inicio.js','utf8'),c);
  const vaciar = async()=>{for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r))};
  await vaciar();
  const trayectoria=hashInicial.endsWith('/situacion')||!hashInicial&&personal;
  assert.equal(c.SATE.actual.pestana,trayectoria?'trayectoria':'mapa');
  assert.equal(location.hash,hashInicial.endsWith('/situacion')?'#/upiita/trayectoria':hashInicial||'#/upiita/'+(personal?'trayectoria':'mapa'));
  assert.equal(archivos.filter(a=>a==='mapa.js').length,trayectoria?0:1);
  if(hashInicial.endsWith('/situacion'))assert.equal(fetches.some(u=>u.endsWith('oferta.json')),false);
  assert.equal(archivos.includes('horarios.js'),false,'saveData impide precarga');
  const antes=fetches.length,mapas=archivos.filter(a=>a==='mapa.js').length;
  location.hash='#/upiita/calendario';eventos.hashchange();await vaciar();
  assert.equal(c.SATE.actual.pestana,'calendario');
  assert.equal(fetches.length,antes,'Calendario no descarga oferta ni trámites');
  assert.equal(document.getElementById('sate-calendario').hidden,false);
  assert.equal(document.getElementById('sate-trayectoria').hidden,true);
  location.hash='#/upiita/calendario';eventos.hashchange();await vaciar();
  assert.equal(archivos.filter(a=>a==='calendario.js').length,1);
  assert.equal(vistos.filter(v=>v==='montar-calendario').length,1);
  location.hash='#/upiita/desempeno'; eventos.hashchange(); await vaciar();
  assert.equal(c.SATE.actual.pestana,'trayectoria');assert.equal(location.hash,'#/upiita/trayectoria');
  assert.equal(fetches.length,antes,'Desempeño no descarga oferta');
  assert.equal(archivos.filter(a=>a==='mapa.js').length,mapas,'Desempeño no descarga Mapa');
  assert.equal(document.getElementById('v-tray').hidden,true);
  assert.equal(document.getElementById('sate-trayectoria').hidden,false);
  location.hash='#/upiita/horarios'; eventos.hashchange(); await vaciar();
  assert.equal(c.SATE.actual.pestana,'horarios');
  assert.equal(guardado.ruta,'#/upiita/horarios');
  location.hash='#/upiita/mapa'; eventos.hashchange(); await vaciar();
  assert.equal(c.SATE.actual.pestana,'mapa');
  assert.equal(vistos.filter(v=>v==='montar-mapa').length,1);
  assert.equal(fetches.filter(u=>u.endsWith('oferta.json')).length,1);
  location.hash='#/upiita/tramites/reinscripcion';eventos.hashchange();await vaciar();
  assert.equal(c.SATE.actual.tramite,'reinscripcion');
  assert.ok(vistos.includes('calendario'));
  assert.equal(fetches.filter(u=>u.endsWith('tramites.json')).length,1);
  location.hash='#/upiita/mapa';eventos.hashchange();await vaciar();
  location.hash='#error=oauth';eventos.hashchange();await vaciar();
  assert.equal(c.SATE.actual.pestana,'mapa');
  assert.equal(location.hash,'#error=oauth');
  location.hash='#/escom/horarios';eventos.hashchange();await vaciar();
  assert.equal(cambioUnidad,1);assert.equal(guardado['ipnt.unidad'],'escom');
  assert.ok(vistos.filter(v=>v==='avisos').length>=8,'Los avisos se actualizan en todas las vistas');
  assert.ok(vistos.includes('procedimiento'),'Los procedimientos se muestran en Ventanilla');
 }
}
console.log('Enrutador: carga única, ciclo montar/mostrar/ocultar, atrás/adelante, hashes ajenos y cambio de unidad correctos.');

// La identidad se decide antes de descargar datos, también en unidades sin logo.
const unidades = JSON.parse(readFileSync('data/cuenta.json','utf8')).unidades;
for (const unidad of unidades) {
  const nombre={textContent:''}, cabecera={children:[],appendChild(n){this.children.push(n)}};
  const cfg=structuredClone(config);
  for(const u of unidades) Object.assign(cfg[u.id],{nombre:u.nombre,siglas:u.siglas});
  const c=vm.createContext({URLSearchParams,console,SATE_CONFIG:{unidades:cfg,textos:{}},
    location:{hash:'#/'+unidad.id+'/mapa',search:''},localStorage:{getItem:()=>null},
    document:{getElementById:()=>({appendChild(){},addEventListener(){}}),addEventListener(){},querySelector:s=>s==='.inst-name'?nombre:s==='.inst-in'?cabecera:null,
      createElement:()=>({children:[],appendChild(n){this.children.push(n)}})},
    SateUI:{usarTextos(){},ayuda(){return {querySelector:()=>({setAttribute(){}})}}},fetch:()=>new Promise(()=>{})});
  vm.runInContext('window=globalThis',c);
  vm.runInContext(readFileSync('web/sate/rutas.js','utf8'),c);
  vm.runInContext(readFileSync('web/sate/inicio.js','utf8'),c);
  assert.equal(nombre.textContent,unidad.nombre);
  assert.equal(cabecera.children.length,cfg[unidad.id].logo?1:0);
  if(cfg[unidad.id].logo){
    const a=cabecera.children[0];assert.equal(a.href,cfg[unidad.id].logo.enlace);
    assert.equal(a.children[0].src,'../assets/logos/upiita-oro.webp');
    assert.equal(a.children[1].src,'../assets/logos/upiita-blanco.webp');
    assert.equal(a.children[0].alt,cfg[unidad.id].logo.alt);
  }
}
console.log('Identidad: nombre por unidad, dos temas y rutas a dist/assets; sin logo no se crea enlace.');
