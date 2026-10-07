// Contratos e interacción del encabezado generado, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer = f => readFileSync(f, 'utf8');
const html = leer('web/dist/sate/index.html');
const config = JSON.parse(html.match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const texto = (k,v={}) => config.textos[k].replace(/\{(\w+)\}/g,(_,n)=>v[n]??'{'+n+'}');
const encabezado = html.slice(html.indexOf('<header class="top">'), html.indexOf('</header>', html.indexOf('<header class="top">')));
assert.match(encabezado, /id="b-unidad"[^>]*aria-label="Cambiar unidad académica"[^>]*>▾<\/button>/);
assert.match(encabezado, /<span id="sate-leyenda"><\/span>/);
assert.match(encabezado, /class="sate-navegacion"[\s\S]*id="sate-tabs"[\s\S]*class="sate-controles"/);
assert.match(encabezado, /<label class="field"><span class="sate-sr">Carrera<\/span><select id="f-carrera">/);
assert.equal((html.match(/id="f-carrera"/g) || []).length, 1);
assert.equal((html.match(/id="saes-open"/g) || []).length, 1);
const fila = encabezado.slice(encabezado.indexOf('class="sate-fila-avisos"'),encabezado.indexOf('class="sate-navegacion"'));
assert.match(fila,/id="sate-avisos-globales"[\s\S]*id="saes-open"[^>]*data-saes-open[\s\S]*Actualizar datos del SAES[\s\S]*id="sate-saes-indicador"[^>]*role="status"[^>]*aria-label="Sin datos del SAES"/);
assert.ok(!encabezado.slice(encabezado.indexOf('class="sate-navegacion"')).includes('saes-open'));
assert.ok(!html.includes('sate-datos-menu'));
for (const archivo of ['index.html','nucleo.js','inicio.js','mapa.js','situacion.js','desempeno.js','saes-dialogo.js']) {
  const fuente=leer('web/dist/sate/'+archivo);
  assert.ok(!/Probar con datos de ejemplo|prueba con datos de ejemplo|data-demo-open|desempeno-demo/.test(fuente),archivo+' sin acceso visible a demo');
}
assert.ok(!Object.keys(config.textos).some(k=>/sate\.(encabezado\.(datos|datos_movil|datos_acciones|demo|datos_cargados|datos_opcionales)|situacion\.probar_demo|desempeno\.demo)$/.test(k)));
assert.ok(!encabezado.includes('Tu avance (opcional)'));
assert.ok(!encabezado.includes('<hr'));
assert.ok(!html.includes('/*__SATE_'));
const inicio = leer('web/sate/inicio.js');
const interaccion = inicio.slice(inicio.indexOf('  if (cfg.leyenda) {'), inicio.indexOf('  const nombreUnidad'));
for (const unidad of Object.keys(config.unidades)) {
  const boton = {setAttribute(k,v){this[k]=v}};
  const ayuda = {querySelector:()=>boton};
  const leyenda = {appendChild(n){this.ayuda=n}};
  let clave, variables;
  const c = {cfg:config.unidades[unidad], texto, document:{getElementById:()=>leyenda},
    SateUI:{ayuda(k,v){clave=k;variables=v;return ayuda}}};
  vm.runInNewContext(interaccion,c);
  if (c.cfg.leyenda) {
    assert.equal(clave,'sate.leyenda.'+c.cfg.leyenda);
    assert.equal(variables.unidad,c.cfg.siglas);
    assert.equal(leyenda.ayuda,ayuda);
    assert.equal(boton.textContent,texto('sate.encabezado.prueba'));
    assert.equal(boton['aria-label'],boton.textContent);
  } else assert.equal(leyenda.ayuda,undefined);
}
// Ejecutar el estado real: leer, reemplazar y borrar; el perfil ficticio no es una lectura SAES.
const saes = leer('web/dist/sate/nucleo.js').match(/const SAES=\{[\s\S]*?\n\};/)[0];
const span={}, clases={}, btn={querySelector:()=>span};
const indicador={classList:{toggle(k,v){clases[k]=v}},setAttribute(k,v){this[k]=v}};
const c=vm.createContext({SATE:{texto},document:{getElementById:id=>id==='saes-open'?btn:id==='sate-saes-indicador'?indicador:null}});
vm.runInContext(saes+'\nglobalThis.estado=SAES.status;',c);
for (const datos of [null,{leido:'2026-10-07T12:00:00Z'},{leido:'2026-10-08T15:00:00Z'},null,{demo:true,leido:'2026-10-07T12:00:00Z'}]) {
  const usando=!!datos&&!datos.demo;
  c.estado(datos);assert.equal(clases.on,usando);assert.equal(span.textContent,'Actualizar datos del SAES');
  const esperado=usando?texto('sate.encabezado.usando_datos',{fecha:new Date(datos.leido).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'})}):texto('sate.encabezado.sin_datos');
  assert.equal(indicador.title,esperado);assert.equal(indicador['aria-label'],esperado);
}
const core=leer('web/dist/sate/nucleo.js');
assert.match(core,/if\(location.hash==='#demo'\)/);
assert.match(core,/Modo demostración[\s\S]*Salir del modo demostración/);
assert.match(core,/sessionStorage.removeItem\('ipnt.demo'\)/);
const css=leer('web/sate/componentes.css');
assert.match(css,/header\.top\{border-bottom:0/);
assert.match(css,/\.bar-top\{border-bottom:0/);
assert.match(css,/\.sate-navegacion\{display:flex;align-items:center/);
assert.match(css,/@media\(max-width:720px\)\{[\s\S]*\.sate-controles\{flex:1;width:100%\}/);
assert.match(css,/\.sate-datos\{[^}]*margin-left:auto/);
assert.match(css,/#sate-tabs \.sate-pestana__texto\{white-space:nowrap;overflow-wrap:normal\}/);
assert.match(css,/@media\(min-width:721px\) and \(max-width:1280px\)\{#sate-tabs\{flex-basis:100%\}\.sate-controles\{flex-basis:100%\}/);
assert.match(css,/#sate-saes-indicador::before\{[^}]*border:2px solid var\(--ipn-tenue\)/);
assert.match(css,/#sate-saes-indicador.on::before\{background:var\(--ipn-ok\);border-color:var\(--ipn-ok\)/);
assert.match(css,/\.sate-datos \.saes-open::before\{content:none\}/);
assert.match(css,/\.sate-datos \.btn[^}]*\):focus-visible\{outline:2px solid var\(--ipn-acento\)/);
console.log('Encabezado: ids, ayuda por unidad, fila persistente, actualización, indicador SAES real con fecha, demo solo por hash y etiquetas sin salto a 1180 px. OK.');
