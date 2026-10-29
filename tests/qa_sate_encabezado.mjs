// Contratos e interacción del encabezado generado, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync, readdirSync} from 'node:fs';
const leer = f => readFileSync(f, 'utf8');
const html = leer('web/dist/sate/index.html');
const config = JSON.parse(html.match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const texto = (k,v={}) => config.textos[k].replace(/\{(\w+)\}/g,(_,n)=>v[n]??'{'+n+'}');
const encabezado = html.slice(html.indexOf('<header class="top sate-encabezado">'), html.indexOf('</header>', html.indexOf('<header class="top sate-encabezado">')));
// Marca «SATE | UPIITA-IPN»: siglas, separador decorativo y la unidad como botón (dueño, 2026-10-17).
assert.match(encabezado, /<h1 id="sate-titulo"><span class="sate-siglas">SATE<\/span><span class="sate-sep" aria-hidden="true"><\/span><button class="sate-unidad-btn" id="b-unidad"[^>]*aria-label="Cambiar unidad académica"[^>]*><\/button><\/h1>/);
assert.match(encabezado, /<p id="sate-nombre">Sistema de Apoyo a la Trayectoria Escolar<\/p>/);
assert.ok(!encabezado.includes('unit-switch'), 'sin selector de unidad aparte');
assert.match(encabezado, /<span id="sate-leyenda"><\/span>/);
assert.match(encabezado, /class="sate-controles"[\s\S]*class="sate-navegacion"[\s\S]*id="sate-tabs"/);
assert.match(encabezado, /<label class="field"><span class="sate-sr">Carrera<\/span><select id="f-carrera">/);
assert.equal((html.match(/id="f-carrera"/g) || []).length, 1);
assert.equal((html.match(/id="saes-open"/g) || []).length, 1);
assert.match(encabezado, /class="enc-btn sate-ayuda-recorrido" id="sate-ayuda-recorrido" type="button" aria-label="Ayuda: recorrido guiado de SATE" title="Ayuda: recorrido guiado de SATE"/);
assert.match(encabezado, /id="sate-ayuda-recorrido"[^>]*>[\s\S]*?<svg[^>]*aria-hidden="true"/);
assert.match(leer('web/sate/inicio.js'), /getElementById\('sate-ayuda-recorrido'\)\.onclick=\(\)=>iniciarRecorrido\(\)/);
assert.doesNotMatch(leer('web/sate/inicio.js'), /sate-recorrido-invitacion|sate\.recorrido\.boton/);
assert.doesNotMatch(html, /sate-recorrido-invitacion|sate\.recorrido\.boton/);
const acciones = encabezado.slice(encabezado.indexOf('class="header-actions"'), encabezado.indexOf('class="enc-btn sate-opinar"'));
// De derecha a izquierda: tema, sesión, SAES (en el HTML, de izquierda a derecha).
assert.ok(acciones.indexOf('id="saes-open"') < acciones.indexOf('id="ipnt-open"') && acciones.indexOf('id="ipnt-open"') < acciones.indexOf('id="theme-btn"'), 'orden: SAES, sesión, tema');
assert.match(acciones, /id="saes-open"[^>]*data-saes-open[\s\S]*id="sate-saes-indicador"[^>]*role="img"[^>]*aria-label="Sin datos del SAES: consulta el mapa o arma tu horario"[\s\S]*Traer datos del SAES/);
assert.match(encabezado, /class="enc-btn sate-opinar" type="button" data-encuesta hidden/, 'DIS5: Opinar conserva el gancho dentro de las acciones');
assert.ok(encabezado.indexOf('sate-logo-ipn') < encabezado.indexOf('class="brand"') && encabezado.indexOf('class="brand"') < encabezado.indexOf('class="sate-lado"'));
assert.ok(encabezado.indexOf('class="sate-contexto"') < encabezado.indexOf('id="sate-leyenda"'), 'La fase de prueba pertenece al contexto');
assert.ok(encabezado.indexOf('class="header-actions"') < encabezado.indexOf('id="sate-logo-unidad"'), 'El logo pertenece a las acciones');
assert.ok(!encabezado.slice(encabezado.indexOf('class="sate-navegacion"')).includes('saes-open'));
// Ruta del logo del IPN: un solo lugar (data/identidad/logo_ipn.json)
const logo = JSON.parse(leer('data/identidad/logo_ipn.json'));
assert.ok(encabezado.includes('src="../' + logo.claro + '"') && encabezado.includes('src="../' + logo.oscuro + '"'));
assert.ok(!leer('tools/institucional.py').includes(logo.claro), 'la ruta del logo del IPN no se repite en el código');
assert.ok(!html.includes('sate-datos-menu'));
for (const archivo of ['index.html','nucleo.js','inicio.js','mapa.js','situacion.js','desempeno.js','saes-dialogo.js']) {
  const fuente=leer('web/dist/sate/'+archivo);
  assert.ok(!/Probar con datos de ejemplo|prueba con datos de ejemplo|data-demo-open|desempeno-demo/.test(fuente),archivo+' sin acceso visible a demo');
}
assert.ok(!Object.keys(config.textos).some(k=>/sate\.(encabezado\.(datos|datos_movil|datos_acciones|demo|datos_cargados|datos_opcionales)|situacion\.probar_demo|desempeno\.demo)$/.test(k)));
assert.ok(!encabezado.includes('Tu avance (opcional)'));
assert.ok(!encabezado.includes('<hr'));
assert.ok(!html.includes('/*__SATE_'));
assert.match(leer('web/sate/encabezado.js'),/bar\.className='sate-barra-flotante'/,'el módulo crea la barra flotante para escritorio');
assert.match(leer('web/sate/encabezado.css'),/prefers-reduced-motion:reduce/,'la transición respeta movimiento reducido');
assert.match(leer('web/sate/encabezado.css'),/scroll-padding-top/,'las anclas reservan espacio bajo la barra');
const inicio = leer('web/sate/inicio.js');
// Identidad publicada y comportamiento real del arranque, con DOM local en memoria.
assert.deepEqual(config.identidadUnidades, JSON.parse(leer('data/unidades_identidad.json')).unidades);
assert.equal(config.identidadUnidades.escom.logo,'escom-saes');
assert.equal(config.identidadUnidades.upibi.logo,'upibi-saes');
assert.equal(config.textos['sate.pestana.trayectoria.titulo'],'Tu perfil');
assert.equal(config.textos['sate.pestana.trayectoria.corto'],'Perfil');
assert.match(leer('web/sate/componentes.js'),/trayectoria: '<circle cx="12" cy="8" r="4"\/>/);
for (const [unidad,generica,sinLogo] of [['upiita'],['upiita',false,true],['escom'],['upibi'],['encb'],['esimez'],['desconocida'],['enba'],['escom',true]]) {
  const valores={}, atributos={}, titulo={replaceChildren(...n){this.children=n}}, ranura={children:[],appendChild(n){this.children.push(n)}};
  const botonUnidad={setAttribute(k,v){this[k]=v}};
  const halos=[];
  const documento={querySelector:()=>null,getElementById:id=>id==='b-unidad'?botonUnidad:id==='sate-logo-unidad'?ranura:titulo,
    querySelectorAll:()=>halos,
    documentElement:{getAttribute:k=>atributos[k],style:{setProperty(k,v){valores[k]=v}}},
    createElement:tag=>{const n={tag,dataset:{},style:{setProperty(k,v){this[k]=v}},children:[],prepend(n){this.children.unshift(n)},appendChild(n){this.children.push(n)}};if(tag==='span')halos.push(n);return n}};
  let selector;
  const configuracion=structuredClone(config);
  if(generica)delete configuracion.unidades[unidad];
  if(sinLogo)delete configuracion.unidades[unidad].logo;
  const c=vm.createContext({SATE_CONFIG:configuracion,SateRutas:{ruta:()=>({unidad})},
    URLSearchParams,localStorage:{getItem:()=>null},location:{hash:'#/'+unidad+'/mapa',search:''},window:{},
    document:documento,texto,SateUI:{modal(t,n){selector=n}}});
  vm.runInContext(inicio.slice(0,inicio.indexOf('  // plurales ICU'))+'\nglobalThis.aplicarRealce=aplicarRealce;globalThis.colorHalo=colorHalo;})();',c);
  vm.runInContext('const config=SATE_CONFIG.unidades,u=window.SATE_UNIDAD,cfg=config[u];let api;',c);
  vm.runInContext(inicio.slice(inicio.indexOf('  function logoUnidad('),inicio.indexOf('  async function activar(')),c);
  vm.runInContext(inicio.slice(inicio.indexOf('  // «SATE {unidad}»'),inicio.indexOf('  if (cfg.leyenda)')),c);
  const siglas=c.SATE_CONFIG.unidades[unidad].siglas;
  assert.equal(botonUnidad.textContent,siglas+'-IPN');assert.equal(botonUnidad.hidden,false);
  assert.equal(botonUnidad['aria-label'],siglas+'. Cambiar unidad académica');
  // Marca «SATE | UPIITA-IPN»: siglas, separador y la unidad como botón.
  assert.equal(titulo.children[0].className,'sate-siglas');assert.equal(titulo.children[0].textContent,'SATE');
  assert.equal(titulo.children[1].className,'sate-sep');
  assert.equal(titulo.children[2],botonUnidad,unidad+': la unidad es el botón del título');
  vm.runInContext(inicio.slice(inicio.indexOf('  // Logo de la unidad, hasta la derecha'),inicio.indexOf('  function identidadSaes()')),c);
  if(c.SATE_CONFIG.unidades[unidad].logo){
    const enlace=ranura.children[0];assert.equal(enlace.className,'unit');assert.equal(enlace.children.length,2);
    assert.deepEqual(enlace.children.map(i=>i.className),['logo-lt','logo-dk']);
    assert.equal(halos.filter(h=>!/^sate-(siglas|sep)$/.test(h.className)).length,0);
    continue;
  }
  const halo=ranura.children[0],img=halo.children[0];
  assert.equal(halo.tag,'span');assert.equal(halo.className,'sate-logo-halo');
  assert.equal(img.tag,'img');assert.equal(img.className,'sate-logo-unidad');
  assert.equal(img.src,'../assets/logos/unidades/'+(config.identidadUnidades[unidad]?.logo||'ipn')+'.webp');
  assert.equal(img.alt,c.SATE_CONFIG.unidades[unidad].nombre);
  img.onerror();assert.equal(img.hidden,true,unidad+': imagen fallida oculta');assert.equal(halo.hidden,true);
  const realce=config.unidades[unidad]?.realce||config.identidadUnidades[unidad]?.realce;
  assert.equal(valores['--sate-realce'],realce?.claro||'var(--sate-acento-base)',unidad+': tema claro');
  assert.equal(halo.style['--halo'],realce?.claro||'var(--sate-acento-base)');
  atributos['data-theme']='dark';
  c.aplicarRealce(unidad);
  assert.equal(valores['--sate-realce'],realce?.oscuro||'var(--sate-acento-base)',unidad+': tema oscuro');
  assert.equal(halo.style['--halo'],realce?.oscuro||'var(--sate-acento-base)');
  vm.runInContext('elegirUnidad();',c);
  assert.equal(selector.children.length,1);
  assert.equal(selector.children[0].textContent,'Cambiar de unidad');
  selector.children[0].onclick();assert.equal(c.location.href,'index.html?sateEntrada=1');
  atributos['data-theme']='light';c.aplicarRealce(unidad);
  assert.equal(halo.style['--halo'],realce?.claro||'var(--sate-acento-base)');
}
const estilosIdentidad=leer('web/sate/componentes.css');
assert.match(estilosIdentidad,/\.sate-logo-unidad\{[^}]*max-height:36px;[^}]*width:auto;height:auto;[^}]*object-fit:contain;/);
assert.doesNotMatch(estilosIdentidad,/\.sate-logo-unidad\{[^}]*background:#fff/);   // sin ficha blanca: halo del color de la unidad (dueño)
assert.match(estilosIdentidad,/\.sate-logo-halo img\{filter:drop-shadow\(0 0 9px [^}]*var\(--halo\)[^}]*drop-shadow\(0 0 18px [^}]*var\(--halo\)/);   // opción B del dueño: contorno amplio y tenue
assert.match(estilosIdentidad,/\.sate-logo-halo\{[^}]*position:relative;display:inline-grid;place-items:center;[^}]*isolation:isolate;overflow:visible/);
assert.match(estilosIdentidad,/\.sate-logo-halo::before\{content:none\}/);
assert.doesNotMatch(estilosIdentidad,/\.sate-logo-unidad\{[^}]*radial-gradient/);   // el degradado se veía dentro del logo (dueño)
assert.match(estilosIdentidad,/\.sate-selector-unidad \.sate-logo-unidad\{max-height:24px;max-width:24px\}/);
const interaccion = inicio.slice(inicio.indexOf('  if (cfg.leyenda) {'), inicio.indexOf('  // Logo de la unidad, hasta la derecha'));
for (const unidad of Object.keys(config.unidades)) {
  const boton = {dataset:{},setAttribute(k,v){this[k]=v},replaceChildren(n){this.children=[n];this.textContent=n.textContent}};
  const ayuda = {querySelector:()=>boton};
  const leyenda = {appendChild(n){this.ayuda=n}};
  let clave, variables;
  const c = {cfg:config.unidades[unidad], texto, document:{getElementById:()=>leyenda,createElement:tag=>({tag})},
    SateUI:{ayuda(k,v){clave=k;variables=v;return ayuda}}};
  vm.runInNewContext(interaccion,c);
  if (c.cfg.leyenda) {
    assert.equal(clave,'sate.leyenda.'+c.cfg.leyenda);
    assert.equal(variables.unidad,c.cfg.siglas);
    assert.equal(leyenda.ayuda,ayuda);
    assert.equal(boton.textContent,texto('sate.encabezado.prueba'));
    assert.equal(boton.children[0].tag,'span');
    assert.equal(boton.dataset.corto,texto('sate.encabezado.prueba_corto'));
    assert.equal(boton['aria-label'],boton.textContent);
  } else assert.equal(leyenda.ayuda,undefined);
}
// Ejecutar el estado real: leer, reemplazar y borrar; el perfil ficticio no es una lectura SAES.
const saes = leer('web/dist/sate/nucleo.js').match(/const SAES=\{[\s\S]*?\n\};/)[0];
const span={}, corto={}, clases={}, btn={setAttribute(k,v){this[k]=v},querySelector:s=>s==='.sate-texto-corto'?corto:span};
const indicador={classList:{toggle(k,v){clases[k]=v}},setAttribute(k,v){this[k]=v}};
const c=vm.createContext({SATE:{texto},document:{getElementById:id=>id==='saes-open'?btn:id==='sate-saes-indicador'?indicador:null}});
vm.runInContext(saes+'\nglobalThis.estado=SAES.status;',c);
for (const datos of [null,{leido:'2026-10-07T12:00:00Z'},{leido:'2026-10-08T15:00:00Z'},null,{demo:true,leido:'2026-10-07T12:00:00Z'}]) {
  const usando=!!datos&&!datos.demo;
  c.estado(datos);assert.equal(clases.on,usando);assert.equal(span.textContent,usando?'Actualizar datos del SAES':'Traer datos del SAES');
  assert.equal(btn['aria-label'],span.textContent,'La acción en icono conserva su nombre accesible');
  assert.equal(corto.textContent,usando?'Actualizar':'Traer datos');
  const esperado=usando?texto('sate.cupos.alumno_actualizado',{hora:new Date(datos.leido).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',hour12:false})}):texto('sate.encabezado.sin_datos');
  assert.equal(indicador.title,esperado);assert.equal(indicador['aria-label'],esperado);
}
const core=leer('web/dist/sate/nucleo.js');
assert.match(core,/if\(location.hash==='#demo'\)/);
assert.match(core,/Modo demostración[\s\S]*Salir del modo demostración/);
assert.match(core,/sessionStorage.removeItem\('ipnt.demo'\)/);
const css=leer('web/sate/componentes.css');
const cssEnc=leer('web/sate/encabezado.css');
const cssComparable=s=>s.replace(/\/\*[\s\S]*?\*\//g,' ').replace(/\s+/g,' ').trim();
assert.equal(cssComparable(leer('web/dist/sate/encabezado.css')),cssComparable(cssEnc));
assert.match(html,/<link rel="stylesheet" href="encabezado.css">/);
assert.match(cssEnc,/grid-template-areas:"marca contexto acciones" "nav nav nav" "avisos avisos avisos"/);
assert.match(cssEnc,/@media\(min-width:768px\) and \(max-width:1023px\)/);
assert.match(cssEnc,/@media\(max-width:767px\)/);
assert.match(cssEnc,/\.sate-marca\{[^}]*display:flex;align-items:center/);
assert.match(cssEnc,/margin:var\(--ipn-esp-6\) 0 0/,'Aire entre la franja superior y las pestañas');
assert.match(css,/\.sate-controles select\{field-sizing:content;min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap/);
// El respaldo mide solo la opción elegida, también después de cambiar carrera.
{
  const fuente=leer('web/sate/nucleo.js');
  const funcion=fuente.slice(fuente.indexOf('function ajustarCarrera(){'),fuente.indexOf('if(document.fonts)'));
  const selector={selectedOptions:[{textContent:'Biónica'}],style:{}};
  let nativo=false,mediciones=0;
  const contexto={CSS:{supports:()=>nativo},$:()=>selector,
    getComputedStyle:()=>({font:'12px sans-serif',paddingLeft:'10px',paddingRight:'10px',borderLeftWidth:'1px',borderRightWidth:'1px',getPropertyValue:()=> '24px'}),
    document:{createElement:()=>({getContext:()=>({measureText(t){mediciones++;return {width:t.length*8}}})})}};
  vm.runInNewContext(funcion+';globalThis.ajustar=ajustarCarrera',contexto);
  {
    selector.selectedOptions[0].textContent='Ingeniería Biónica';contexto.ajustar();
    const largo=Number(selector.style.width.match(/\d+/)[0]);
    selector.selectedOptions[0].textContent='Biónica';contexto.ajustar();
    assert.ok(Number(selector.style.width.match(/\d+/)[0])<largo,'se contrae al cambiar');
    assert.match(selector.style.width,/\+ var\(--ipn-esp-6\)\)/);
  }
  nativo=true;const antes=mediciones;contexto.ajustar();assert.equal(mediciones,antes);
  assert.match(fuente,/TOP_CARRERAS!==carrerasClave[\s\S]*?innerHTML=cars\.map[\s\S]*?TOP_CARRERAS=carrerasClave;ajustarCarrera\(\)/);
}
const catalogo=leer('contenido/textos/es.toml');
for(const clave of ['lead_temporal','aviso_temporal_1']){
  const linea=catalogo.split('\n').find(l=>l.startsWith(clave+' ='));
  assert.match(linea,/dos periodos semestrales completos/);
  assert.match(linea,/no tienen que ser seguidos/);
  assert.doesNotMatch(linea,/un año|consecutivos/);
}
assert.match(catalogo.split('\n').find(l=>l.startsWith('periodos_ayuda =')),/Elige uno o dos periodos\..*consulta tu saldo con Gestión Escolar/);
const baja=JSON.parse(leer('web/dist/sate/datos/upiita/guia.json'));
assert.ok(JSON.stringify(baja).includes('dos periodos semestrales completos en toda tu trayectoria; no tienen que ser seguidos'));
assert.match(acciones,/class="sate-texto-corto">Traer datos/,'H: etiqueta móvil inicial en catálogo');
assert.match(css,/#sate-avisos-globales \.sate-chips\{flex-wrap:nowrap/);
assert.match(css,/\.bar-top\{border-bottom:0/);
assert.match(css,/\.sate-navegacion\{display:flex;align-items:center/);
assert.match(css,/:is\(#sate-tabs,\.sate-medicion\) \.sate-pestana__texto\{white-space:nowrap;overflow-wrap:normal\}/);
assert.match(css,/data-controles-separados=true\]>#sate-tabs\{flex-basis:100%\}/);
assert.match(css,/body\.sate-flotante \.sate-barra\{display:flex\}/);
assert.match(css,/\.sate-barra__btn \.sate-pestana__texto\{white-space:nowrap;overflow-wrap:normal\}/);
// Ejecutar el adaptador real con geometría controlada, sin navegador ni red.
{
const adaptador = inicio.slice(inicio.indexOf('  function adaptarPestanas()'),inicio.indexOf('  function selectorMarca('));
let ancho = 1000, completo = 600, corto = 400, medicion, frame, frames = 0, observador, mutacion, fuentes;
const boton = {dataset:{id:'mapa'},focus(){doc.activeElement=this}};
const inferior = {dataset:{id:'mapa'},focus(){doc.activeElement=this}};
const tabs = {dataset:{},cloneNode(){return {dataset:{},removeAttribute(){},querySelectorAll(){return []},
  getBoundingClientRect(){return {width:this.scrollWidth+2}},
  get scrollWidth(){return this.dataset.escalon==='corto'?corto:completo},offsetWidth:2,clientWidth:0}},
  contains(n){return n===boton},querySelector(){return boton}};
const controles = {cloneNode(){return {removeAttribute(){},querySelectorAll(){return []},getBoundingClientRect(){return {width:240}}}}};
const nav = {dataset:{},get clientWidth(){return ancho},querySelector(){return controles},appendChild(n){medicion=n}};
const contenedor = {closest(){return nav}};
const clases = {};
const doc = {activeElement:null,getElementById(){return contenedor},
  createElement(){return {setAttribute(){},replaceChildren(...n){this.children=n}}},
  body:{classList:{toggle(k,v){clases[k]=v}}},documentElement:{},
  fonts:{ready:{then(f){fuentes=f}},addEventListener(){}}};
vm.runInNewContext(adaptador+'\nadaptarPestanas();', {tabs,barra:{contains(n){return n===inferior},querySelector(){return inferior}},
  document:doc,getComputedStyle(){return {paddingLeft:'0px',paddingRight:'0px',columnGap:'12px'}},
  requestAnimationFrame(f){frame=f;frames++},addEventListener(){},matchMedia(){return {matches:false}},
  ResizeObserver:class {constructor(f){observador=f}observe(n){assert.equal(n,nav)}},
  MutationObserver:class {constructor(f){mutacion=f}observe(){}}});
function comprobar(w, escalon, separado) {
  ancho=w;observador();const f=frame;frame=null;f();
  assert.equal(tabs.dataset.escalon,escalon,`ancho disponible ${w}`);
  assert.equal(nav.dataset.controlesSeparados,String(separado));
  assert.equal(clases['sate-flotante'],escalon==='flotante');
}
// Límites exactos, reducción, recuperación desde barra oculta y ráfagas del observador.
for (const [w,e,s] of [[854,'completo',false],[853,'completo',true],[602,'completo',true],
  [601,'corto',true],[402,'corto',true],[401,'flotante',true],[1000,'completo',false],
  [1440,'completo',false],[1024,'completo',false],[768,'completo',true],[375,'flotante',true]]) comprobar(w,e,s);
doc.activeElement=boton;comprobar(300,'flotante',true);assert.equal(doc.activeElement,inferior);
comprobar(1000,'completo',false);assert.equal(doc.activeElement,boton);
const antes=frames;observador();observador();mutacion();fuentes();assert.equal(frames,antes+1);frame();
// Una nueva fuente o idioma puede cambiar los anchos incluso sin cambiar el contenedor.
completo=1100;corto=1050;fuentes();frame();assert.equal(tabs.dataset.escalon,'flotante');
completo=600;corto=400;mutacion();frame();assert.equal(tabs.dataset.escalon,'completo');
assert.equal(medicion.inert,true);
}
// DIS5 sustituye la caja y el botón colgante de ENC2; conserva identidad, foco y acciones.
{
  assert.equal((html.match(/<header\b/g) || []).length, 1);
  assert.ok(!html.includes('<!--__INST_'));
  const css = leer('web/sate/encabezado.css');
  assert.match(css, /grid-template-areas:"marca contexto acciones" "nav nav nav"/);
  assert.match(css, /grid-template-areas:"marca acciones" "contexto contexto" "nav nav"/);
  assert.match(css, /\.sate-unidad-btn\{[^}]*color:var\(--ipn-acento\)[^}]*text-decoration:underline/);
  assert.match(css, /\.sate-estado-dato\.on\{background:var\(--ipn-ok\)\}/);
  assert.match(css, /\.sate-estado-dato\{[^}]*background:var\(--ipn-error\)/);
  assert.match(css, /:is\(button,a,select,summary\):focus-visible/);
  assert.match(leer('web/sate/componentes.css'), /body\.sate-flotante \.sate-barra\{display:flex\}/);
  assert.equal(config.unidades.upiita.pestanas.length, 6);
}
// El módulo externo conserva el menú y alterna la barra al cruzar la navegación.
{
  assert.match(html,/<script src="encabezado\.js"><\/script>/);
  const js=leer('web/dist/sate/encabezado.js');let scroll,navBottom=20,bar;
  const menu={open:false,querySelector(){return {focus(){}}}};
  const nav={getAttribute(){return 'Navegación'},getBoundingClientRect(){return {bottom:navBottom}}};
  const links={cloneNode(){return {querySelectorAll(){return []}}}};
  const makeEl=()=>({className:'',hidden:false,append(){},setAttribute(){},addEventListener(){},querySelectorAll(){return []},getBoundingClientRect(){return {bottom:this.hidden?0:44,height:44}}});
  const h={querySelector(s){return s==='.sate-menu'?menu:s==='.sate-navegacion'?nav:links},after(x){bar=x},addEventListener(){}};
  const desplazamientos={};
  const doc={querySelector(){return h},createElement:makeEl,getElementById(){return null},documentElement:{style:{setProperty(k,v){desplazamientos[k]=v}}}};
  const media={matches:true,addEventListener(){}};
  vm.runInNewContext(js,{document:doc,matchMedia:()=>media,addEventListener(k,f){if(k==='scroll')scroll=f},requestAnimationFrame:f=>f()});
  assert.equal(bar.hidden,true,'arriba, barra oculta');
  assert.equal(desplazamientos['--sate-barra-alto'],'44px','el tope se reserva antes del umbral');
  navBottom=-1;scroll();assert.equal(bar.hidden,false,'al salir de la navegación, barra visible');
  assert.equal(desplazamientos['--sate-barra-alto'],'44px','los sticky reservan la altura visible');
  navBottom=20;scroll();assert.equal(bar.hidden,true,'al volver arriba, barra oculta');
  assert.equal(desplazamientos['--sate-barra-alto'],'44px','regresar no cambia el tope de los filtros');
}
let bloques = 0;
const paginas = [...readdirSync('web/dist').filter(f=>/^horarios-.*\.html$/.test(f)).map(f=>'web/dist/'+f), ...readdirSync('web/dist/sate').filter(f=>f.endsWith('.html')).map(f=>'web/dist/sate/'+f)];
for (const archivo of paginas) for (const m of leer(archivo).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
  if (/\bsrc\s*=|application\/(?:ld\+)?json/i.test(m[1])) continue;
  const politica=leer(archivo).match(/http-equiv="Content-Security-Policy"[^>]*content="([^"]+)"/i)?.[1]||'';
  const scripts=politica.match(/(?:^|;)\s*script-src\s+([^;]+)/i)?.[1]||'';
  assert.match(scripts,/'unsafe-inline'/,archivo+': script inline sin permiso CSP');
  try { new Function(m[2]); bloques++; } catch (e) { throw new Error(archivo+': '+e.message); }
}
console.log(`Parseo con new Function: ${paginas.length} HTML, ${bloques} bloques. OK.`);
console.log('Encabezado: contratos e integración del adaptador, límites, recuperación, foco, fuentes y agrupación por frame. OK.');
