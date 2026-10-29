// R19-VEL: cargadores reales, DOM en memoria y SW con red ficticia. Sin sockets.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync, statSync, existsSync} from 'node:fs';
import {webcrypto, createHash} from 'node:crypto';
import path from 'node:path';
import {crearEntorno} from './dom_minimo.mjs';
const leer=p=>readFileSync(p,'utf8'), base='web/dist/sate/', html=leer(base+'index.html');
const config=JSON.parse(html.match(/window.SATE_CONFIG=(.*?);<\/script>/s)[1]);
const manifiesto=JSON.parse(leer('web/dist/sw-manifest.json'));
assert.match(manifiesto.version,/^[0-9a-f]{20}$/);
for(const [ruta, hash] of Object.entries(manifiesto.archivos)) {
  assert.ok(!ruta.includes('://')&&!ruta.startsWith('/')&&!ruta.includes('..'));
  assert.equal(createHash('sha256').update(readFileSync('web/dist/'+ruta)).digest('hex'),hash,ruta);
}
for(const ruta of manifiesto.precache) {
  assert.ok(Object.hasOwn(manifiesto.archivos,ruta));
  assert.ok(!/oferta|horarios|tramites|desempeno|nucleo|https?:/.test(ruta),'Sin pestañas académicas en la instalación: '+ruta);
}
assert.match(html,/serviceWorker\.register\('\.\.\/sw.js',\{scope:'\.\.\/'/);
assert.ok(html.indexOf('rel="preload"')<html.indexOf('window.SATE_CONFIG='),'Precarga antes de la configuración y el cuerpo');
const registro=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('serviceWorker.register'))[1];
for(const controller of [null,{}]){
  const eventos={};let recargas=0;
  const contexto=vm.createContext({console,navigator:{serviceWorker:{controller,
    addEventListener:(k,f)=>eventos[k]=f,register:()=>Promise.resolve()}},
    addEventListener:(k,f)=>eventos[k]=f,location:{reload(){recargas++}}});
  vm.runInContext(registro,contexto);eventos.load();eventos.controllerchange();
  assert.equal(recargas,1,'Primer control y relevo recargan el documento completo');
}

const casos=Object.entries(config.unidades).flatMap(([u,c])=>[
  ...['','reglamentos','actividades','acudir'].map(s=>[u,s]),
  ...(c.vistas?.some(v=>v.id==='temarios')?[[u,'programas']]:[])
]);
for(const [unidad,seccion] of casos) {
  const {document,Elemento}=crearEntorno();
  Elemento.prototype.append=function(...ns){for(const n of ns)if(n)this.appendChild(typeof n==='string'?document.createTextNode(n):n)};
  document.createElementNS=(_,t)=>document.createElement(t);
  document.readyState='loading';
  const ids=['b-unidad','b-plataforma','sate-titulo','sate-logo-unidad','sate-leyenda','sate-tabs','sate-carga','sate-ayuda-recorrido','saes-open','sate-oferta-periodo','notice','mobnote',
    'v-tray','sate-trayectoria','sate-calendario','v-hor','sate-tramites','sate-temarios','sate-guia'];
  for(const id of ids){const n=document.createElement('div');n.setAttribute('id',id);document.body.appendChild(n)}
  const pedidos=new Map([['index.html',0]]), pendientes=[], errores=[], eventos={}, timers=[];
  let escalon=1, c;
  const normal=url=>url.startsWith('https:')?path.posix.relative('/prueba/sate',new URL(url).pathname):url.replace(/^\.\.\/sate\//,'');
  function pedir(url, tarea) {
    url=normal(url);
    if(!pedidos.has(url))pedidos.set(url,escalon);
    if(tarea)pendientes.push({nivel:pedidos.get(url),tarea});
  }
  // El parser descubre enlaces y scripts; el preload de datos elige la unidad de la URL.
  for(const m of html.matchAll(/<link[^>]*rel="(?:preload|stylesheet)"[^>]*href="([^"?]+)"/g))if(!m[1].includes('://'))pedir(m[1]);
  let parser=1;
  for(const m of html.matchAll(/<script src="([^"]+)"/g)){
    escalon=parser;pedir(m[1]);parser=Math.max(parser,pedidos.get(m[1])+1);
  }
  escalon=1;
  for(const m of html.matchAll(/<img\b[^>]*src="([^"]+)"/g))if(!/^(?:https?:|data:)/.test(m[1]))pedir(m[1]);
  const crear=document.createElement.bind(document);
  document.createElement=tag=>{
    const n=crear(tag);
    if(tag==='img')Object.defineProperty(n,'src',{get(){return n.getAttribute('src')},set(v){n.setAttribute('src',v);pedir(v)}});
    return n;
  };
  const append=document.head.appendChild.bind(document.head);
  document.head.appendChild=n=>{
    if(n.tagName==='SCRIPT'&&n.src)pedir(n.src,()=>{
      const anterior=document.currentScript;document.currentScript={src:'https://sitio.invalid/prueba/sate/'+n.src};
      try{vm.runInContext(leer(base+n.src),c,{filename:n.src});n.onload?.()}catch(e){errores.push(e)}
      document.currentScript=anterior;
    });
    else if(n.tagName==='LINK')pedir(n.href||n.getAttribute('href'));
    return append(n);
  };
  const location={hash:'#/'+unidad+'/guia'+(seccion?'/'+seccion:''),search:'?sateGuia=1',pathname:'/prueba/sate/index.html',reload(){eventos.recargas=(eventos.recargas||0)+1}};
  c=vm.createContext({console,document,location,URL,URLSearchParams,performance,TextEncoder,
    SATE_CONFIG:structuredClone(config),navigator:{connection:{saveData:false}},
    localStorage:{getItem:()=>null},sessionStorage:{getItem:()=>null},IPNT:{set(){}},
    matchMedia:()=>({matches:false,addEventListener(){}}),MutationObserver:class{observe(){}},
    requestAnimationFrame:f=>{f();return 1},setTimeout:f=>{timers.push(f);return timers.length},clearTimeout(){},
    addEventListener:(k,f)=>eventos[k]=f,scrollTo(){},history:{replaceState(){}},
    fetch:url=>new Promise(resolve=>pedir(url,()=>resolve({ok:true,json:async()=>JSON.parse(leer(base+url))})))
  });
  vm.runInContext('window=globalThis',c);
  for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].includes('const rutaGuiaInicial='))vm.runInContext(m[1],c);
  for(const f of ['componentes.js','rutas.js'])vm.runInContext(leer(base+f),c,{filename:f});
  // Navegación sin geometría: se ejecuta la vista real y sus componentes.
  c.SateUI.pestanas=({items})=>{const n=document.createElement('nav');n.seleccionar=()=>{};for(const item of items){const b=document.createElement('button');b.setAttribute('data-id',item.id);b.setAttribute('id','tab-'+item.id);n.appendChild(b)}return n};
  c.SateUI.barraInferior=()=>{const n=document.createElement('nav');n.marcar=()=>{};return n};
  escalon=pedidos.get('inicio.js')+1;
  vm.runInContext(leer(base+'inicio.js'),c,{filename:'inicio.js'});
  async function vaciar(){
    for(let i=0;i<40;i++){
      while(timers.length)timers.shift()();
      const lote=pendientes.splice(0);
      for(const p of lote){escalon=p.nivel+1;p.tarea()}
      await new Promise(setImmediate);
    }
    assert.deepEqual(errores,[]);
  }
  await vaciar();
  assert.equal(c.SATE.actual?.pestana,seccion==='programas'?'temarios':'guia');
  assert.equal(document.getElementById('sate-guia').querySelector('[role="alert"]'),null);
  if(!seccion)assert.equal(document.getElementById('sate-guia').querySelectorAll('[data-ruta]').length,4);
  if(seccion==='reglamentos')assert.ok(![...pedidos.keys()].some(r=>/datos\/reglamentos\/(?!indice\.json)/.test(r)),'La biblioteca no descarga articulados sin interacción');
  for(const url of pedidos.keys())assert.ok(!/(?:oferta|horarios|tramites|desempeno|nucleo|situacion|calendario)\.(?:js|json)$/.test(url),url);
  assert.ok(Math.max(...pedidos.values())<=3,'Cascada de más de tres escalones');
  const faltantes=[...pedidos.keys()].filter(r=>!existsSync(path.resolve(base,r)));
  for(const r of faltantes)assert.match(r,/^\.\.\/assets\/logos\/unidades\/[a-z-]+\.webp$/,'Solo se tolera la ausencia previa de logos de catálogo en este checkout');
  const bytes=[...pedidos.keys()].filter(r=>!faltantes.includes(r)).reduce((n,r)=>n+statSync(path.resolve(base,r)).size,0);
  if(!seccion)for(const r of pedidos.keys())if(!faltantes.includes(r))assert.ok(manifiesto.precache.includes(path.posix.normalize('sate/'+r)),'Recurso de portada disponible en la segunda visita sin conexión: '+r);
  console.log(JSON.stringify({unidad,seccion:seccion||'portada',peticiones:pedidos.size,KB:+(bytes/1024).toFixed(1),escalones:Math.max(...pedidos.values()),faltantes,recursos:[...pedidos]}));
  if(seccion)continue;
  if(unidad==='upiita'){
    location.hash='#/'+unidad+'/guia?q=baja';eventos.hashchange();await vaciar();
    assert.ok(pedidos.has('datos/'+unidad+'/busqueda/indice.json'),'El índice global se pide al buscar');
    assert.ok(pedidos.has('datos/'+unidad+'/guia/preguntas.json'),'La respuesta directa pide preguntas completas al buscar');
  }
  const antes=new Set(pedidos.keys());
  location.hash='#/'+unidad+'/guia/acudir';eventos.hashchange();await vaciar();
  assert.ok(pedidos.has('datos/'+unidad+'/guia/acudir.json'));
  assert.ok(pedidos.has('datos/'+unidad+'/guia/organigrama.json'));
  assert.ok(!antes.has('datos/'+unidad+'/guia/acudir.json'));
  location.hash='#/'+unidad+'/mapa';eventos.hashchange();await vaciar();
  assert.equal(eventos.recargas,1,'Cruzar a SATE inicia su núcleo en un documento nuevo');
}

// SW: dos alcances, instalación íntegra, caché caliente sin conexión y límites de origen.
for(const prefijo of ['/', '/prueba/']) {
  const listeners={}, stores=new Map();let online=true, llamadas=0, claimed=0, saltos=0;
  const origen='https://sitio.invalid', raiz=origen+prefijo;
  const caches={
    async open(k){if(!stores.has(k))stores.set(k,new Map());const m=stores.get(k);return {put:async(k,v)=>m.set(k,v),match:async k=>m.get(k)?.clone()}},
    keys:async()=>[...stores.keys()],delete:async k=>stores.delete(k)
  };
  stores.set('ipnt-'+prefijo+'-viejo',new Map());stores.set('otra-app',new Map());
  stores.set('ipnt-/otra-carpeta/-version',new Map());
  const worker=vm.createContext({URL,Response,Uint8Array,crypto:webcrypto,caches,console,
    self:{location:{href:raiz+'sw.js'},addEventListener:(k,f)=>listeners[k]=f,skipWaiting:async()=>{saltos++},clients:{claim:async()=>{claimed++}}},
    fetch:async url=>{llamadas++;if(!online)throw Error('Sin conexión ficticia');return new Response(readFileSync('web/dist/'+new URL(url).pathname.slice(prefijo.length)))}
  });
  vm.runInContext(leer('web/dist/sw.js'),worker);
  async function ciclo(nombre){const esperas=[];listeners[nombre]({waitUntil:p=>esperas.push(p)});await Promise.all(esperas)}
  await ciclo('install');assert.equal(saltos,0,'El relevo espera a que terminen las pestañas del build anterior');
  await ciclo('activate');assert.equal(claimed,0,'No reclamar documentos abiertos de versión desconocida; controlar la próxima navegación');
  assert.ok(stores.has('otra-app'));assert.ok(!stores.has('ipnt-'+prefijo+'-viejo'));
  assert.ok(stores.has('ipnt-/otra-carpeta/-version'),'La limpieza respeta otros alcances');
  async function pedir(url,method='GET'){
    let respuesta;const esperas=[];
    listeners.fetch({request:{url,method},respondWith:p=>respuesta=p,waitUntil:p=>esperas.push(p)});
    const r=respuesta?await respuesta:undefined;await Promise.all(esperas);return r;
  }
  const n=llamadas;
  for(const url of ['https://fonts.googleapis.com/x','https://graph.microsoft.com/x','https://catalogo.ipn.mx/x',origen+'/otra-app/sate/index.html',raiz+'auth.html',raiz+'sate/index.html?code=privado'])assert.equal(await pedir(url),undefined);
  assert.equal(await pedir(raiz+'sate/index.html','POST'),undefined);
  assert.equal(llamadas,n);
  online=false;
  for(const ruta of manifiesto.precache)assert.ok((await pedir(raiz+ruta)).ok,'Armazón completo sin conexión: '+ruta);
  assert.ok((await pedir(raiz+'sate/index.html?sateGuia=1')).ok);
  assert.ok((await pedir(raiz+'sate/datos/upiita/guia/indice.json')).ok);
  online=true;
  const data='sate/datos/upiita/guia/acudir.json';await pedir(raiz+data);
  online=false;assert.ok((await pedir(raiz+data)).ok,'Sección visitada disponible sin conexión');
  worker.fetch=async()=>new Response('otro build');
  assert.ok((await pedir(raiz+data)).ok,'SWR conserva el build vigente ante una publicación parcial');
  await assert.rejects(()=>pedir(raiz+'sate/datos/upiita/guia/preguntas.json'),/build distinto/);
  // Una publicación incompleta no instala el nuevo shell ni activa la limpieza.
  stores.set('ipnt-'+prefijo+'-anterior',new Map());
  await assert.rejects(()=>ciclo('install'),/build distinto/);
  assert.ok(stores.has('ipnt-'+prefijo+'-anterior'));
}
console.log('OK R19-VEL: portada real sin núcleo académico, fragmentos, precarga y SW versionado sin orígenes ajenos.');
