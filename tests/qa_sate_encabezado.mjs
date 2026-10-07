// Contratos e interacción del encabezado generado, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer = f => readFileSync(f, 'utf8');
const html = leer('web/dist/sate/index.html');
const config = JSON.parse(html.match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const texto = k => config.textos[k];
const encabezado = html.slice(html.indexOf('<header class="top">'), html.indexOf('</header>', html.indexOf('<header class="top">')));
assert.match(encabezado, /id="b-unidad"[^>]*aria-label="Cambiar unidad académica"[^>]*>▾<\/button>/);
assert.match(encabezado, /<span id="sate-leyenda"><\/span>/);
assert.match(encabezado, /class="sate-navegacion"[\s\S]*id="sate-tabs"[\s\S]*class="sate-controles"/);
assert.match(encabezado, /<label class="field"><span class="sate-sr">Carrera<\/span><select id="f-carrera">/);
assert.equal((html.match(/id="f-carrera"/g) || []).length, 1);
assert.equal((html.match(/id="saes-open"/g) || []).length, 1);
assert.match(encabezado, /id="saes-open"[^>]*data-saes-open[\s\S]*Mis datos del SAES/);
assert.match(encabezado, /<details id="sate-datos-menu">[\s\S]*<summary aria-label="Opciones de mis datos del SAES"/);
assert.match(encabezado, /class="sate-datos-opciones">[\s\S]*data-saes-open[^>]*>Actualizar[\s\S]*data-demo-open>Probar con datos de ejemplo/);
assert.ok(!encabezado.includes('Tu avance (opcional)'));
assert.ok(!encabezado.includes('<hr'));
assert.ok(!html.includes('/*__SATE_'));
const inicio = leer('web/sate/inicio.js');
const interaccion = inicio.slice(inicio.indexOf('  if (cfg.leyenda) {'), inicio.indexOf('  const nombreUnidad'));
for (const unidad of Object.keys(config.unidades)) {
  const eventos = {}, docEventos = {}, boton = {setAttribute(k,v){this[k]=v}}, resumen = {focus(){this.enfocado=true}};
  const ayuda = {querySelector:()=>boton};
  const leyenda = {appendChild(n){this.ayuda=n}};
  const menu = {open:true, addEventListener(k,f){eventos[k]=f}, contains:n=>n?.dentro, querySelector:()=>resumen};
  let clave, variables;
  const c = {cfg:config.unidades[unidad], texto, document:{getElementById:id=>id==='sate-leyenda'?leyenda:menu, addEventListener(k,f){docEventos[k]=f}},
    SateUI:{ayuda(k,v){clave=k;variables=v;return ayuda}}};
  vm.runInNewContext(interaccion,c);
  if (c.cfg.leyenda) {
    assert.equal(clave,'sate.leyenda.'+c.cfg.leyenda);
    assert.equal(variables.unidad,c.cfg.siglas);
    assert.equal(leyenda.ayuda,ayuda);
    assert.equal(boton.textContent,texto('sate.encabezado.prueba'));
    assert.equal(boton['aria-label'],boton.textContent);
  } else assert.equal(leyenda.ayuda,undefined);
  eventos.click({target:{closest:()=>true}});assert.equal(menu.open,false,'Una acción cierra el desplegable');
  menu.open=true;docEventos.click({target:{dentro:true}});assert.equal(menu.open,true);
  docEventos.click({target:{}});assert.equal(menu.open,false,'Clic exterior cierra');
  menu.open=true;eventos.keydown({key:'Escape'});assert.equal(menu.open,false);assert.equal(resumen.enfocado,true);
}
// Ejecutar el estado real del SAES generado: conserva punto, título y etiqueta estable.
const saes = leer('web/dist/sate/nucleo.js').match(/const SAES=\{[\s\S]*?\n\};/)[0];
const span={}, clases={}, btn={classList:{toggle(k,v){clases[k]=v}},querySelector:()=>span};
const c=vm.createContext({SATE:{texto},document:{getElementById:id=>id==='saes-open'?btn:null}});
vm.runInContext(saes+'\nglobalThis.estado=SAES.status;',c);
for (const datos of [null,{},null]) {
  c.estado(datos);assert.equal(clases.on,!!datos);assert.equal(span.textContent,'Mis datos del SAES');
  assert.equal(btn.title,texto(datos?'sate.encabezado.datos_cargados':'sate.encabezado.datos_opcionales'));
}
const css=leer('web/sate/componentes.css');
assert.match(css,/header\.top\{border-bottom:0/);
assert.match(css,/\.bar-top\{border-bottom:0/);
assert.match(css,/\.sate-navegacion\{display:flex;align-items:center/);
assert.match(css,/@media\(max-width:720px\)\{[\s\S]*\.sate-controles\{flex:1;width:100%\}/);
assert.match(css,/#sate-datos-menu summary[^}]*\):focus-visible\{outline:2px solid var\(--ipn-acento\)/);
console.log('Encabezado: ids, textos, ayuda por unidad, opciones, Escape/foco, estado SAES, dos filas y reglas móviles. OK.');
