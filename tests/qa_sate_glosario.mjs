// R2-GLO: contrato CSS y ciclo de ayuda con DOM en memoria, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer = p => readFileSync(p, 'utf8');
const css = leer('web/sate/componentes.css');
const regla = selector => {
  const linea = css.split('\n').map(x => x.trim()).find(x => x.startsWith(selector + '{'));
  assert.ok(linea, selector);
  return linea.slice(selector.length + 1).split('}')[0];
};
assert.match(regla('.sate-ayuda--termino'), /display:inline;/);
const terminoCSS = regla('.sate-ayuda__btn.sate-termino');
for (const propiedad of ['display:inline;', 'padding:0;', 'color:inherit;', 'font:inherit;', 'line-height:inherit;',
  'text-decoration-style:dotted;', 'text-decoration-thickness:max(1px,.08em);',
  'text-decoration-color:var(--ipn-tenue);', 'text-underline-offset:.08em;', 'cursor:help']) assert.ok(terminoCSS.includes(propiedad), propiedad);
assert.doesNotMatch(terminoCSS, /vertical-align/);
assert.match(regla('.sate-globo'), /position:fixed;/);
assert.match(regla('.sate-globo'), /max-width:min\(320px,40ch,calc\(100vw - 16px\)\)/);
const tactil = css.split('@media(hover:none){')[1].split('\n}')[0];
const objetivos = [...tactil.matchAll(/([^{}]+)\{([^{}]*min-(?:height|width):(?:44px|var\(--ipn-control-alto\))!important[^{}]*)\}/g)];
assert.equal(objetivos.length, 3);
for (const [, selector] of objetivos) assert.ok(selector.trim().endsWith(':not(.sate-termino)'), selector);
assert.match(regla('.sate-termino::before'), /position:absolute;/);
assert.match(regla('.sate-termino::before'), /height:max\(100%,44px\)/);
assert.match(regla('.sate-ayuda__btn.sate-termino:focus-visible'), /outline:1px solid var\(--ipn-acento\)/);
assert.match(regla('.sate-ayuda__btn.sate-termino:hover,.sate-ayuda__btn.sate-termino:focus-visible'), /color:var\(--ipn-acento\)/);

// El token tenue conserva contraste >= 3:1 con fondo y superficie en ambos temas.
const cascaron = leer('web/sate/cascaron.html');
const luminancia = hex => {
  const rgb = hex.match(/\w\w/g).map(x => parseInt(x, 16) / 255)
    .map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
for (const tema of cascaron.matchAll(/--ipn-fondo:#([\da-f]{6}); --ipn-superficie:#([\da-f]{6});[^}]*?--ipn-tenue:#([\da-f]{6});/g)) {
  for (const fondo of [tema[1], tema[2]]) {
    const a = luminancia(tema[3]), b = luminancia(fondo);
    assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 3, `Contraste ${tema[3]} / ${fondo}`);
  }
}
const {document, Evento, Elemento} = crearEntorno();
const eventos = {}, pendientes = new Map();
let secuencia = 0, movil = false;
const c = vm.createContext({document, innerWidth:1000, innerHeight:700,
  matchMedia:() => ({matches:movil}), addEventListener:(k, fn) => { eventos[k] = fn; },
  setTimeout:(fn, ms) => { pendientes.set(++secuencia, {fn, ms}); return secuencia; },
  clearTimeout:id => pendientes.delete(id)});
vm.runInContext(leer('web/sate/componentes.js'), c);
Elemento.prototype.focus = function () {
  document.activeElement = this;
  this.dispatchEvent(new Evento('focusin'));
};
const avanzar = ms => { for (const [id, t] of [...pendientes]) if (t.ms === ms) { pendientes.delete(id); t.fn(); } };
const env = c.SateUI.ayuda('', {}, {texto:'dictamen', titulo:'Dictamen', definicion:'Resolución ficticia <segura>.'});
document.body.appendChild(env);
const b = env.querySelector('button'), g = env.querySelector('.sate-globo');
assert.ok(env.classList.contains('sate-ayuda--termino'));
assert.ok(b.classList.contains('sate-termino'));
assert.equal(b.textContent, 'dictamen');
assert.equal(g.getAttribute('role'), 'tooltip');
assert.equal(b.getAttribute('aria-describedby'), null);
let rect = {left:210, right:280, top:100, bottom:120, width:70};
b.getBoundingClientRect = () => rect;
g.getBoundingClientRect = () => ({width:300});
g.offsetHeight = 90;
env.dispatchEvent(new Evento('mouseenter', {bubbles:false}));
assert.ok(g.hidden, 'el hover espera 120 ms');
avanzar(120);
assert.equal(g.hidden, false);
assert.equal(g.parentNode, document.body, 'fuera de ancestros locales');
assert.equal(b.getAttribute('aria-describedby'), g.id);
assert.equal(g.textContent, 'Resolución ficticia <segura>.');
assert.equal(g.style.left, '210px', 'alineado al inicio de la palabra');
assert.equal(g.style.top, '126px');
env.dispatchEvent(new Evento('mouseleave', {bubbles:false}));
g.dispatchEvent(new Evento('mouseenter', {bubbles:false}));
avanzar(160);
assert.equal(g.hidden, false, 'puente entre palabra y globo');
document.dispatchEvent(new Evento('keydown', {key:'Escape'}));
assert.ok(g.hidden, 'Escape no reabre al devolver el foco');
assert.equal(document.activeElement, b);
assert.equal(b.getAttribute('aria-describedby'), null);
rect = {left:970, right:995, top:650, bottom:670, width:25};
b.click();
assert.equal(g.style.left, '692px', 'junto a la palabra y dentro del margen derecho');
assert.equal(g.style.top, '554px', 'voltea arriba');
eventos.scroll();
assert.ok(g.hidden);
b.click(); eventos.resize(); assert.ok(g.hidden);
// El mismo anclaje se usa para los iconos; abrir otro cierra el anterior.
b.click();
const icono = c.SateUI.ayuda('ayuda.ficticia'); document.body.appendChild(icono);
icono.querySelector('button').click();
assert.ok(g.hidden);
const ayudaIcono = document.getElementById(icono.querySelector('button').getAttribute('aria-describedby'));
assert.equal(ayudaIcono.parentNode, document.body);
eventos.scroll();
movil = true; b.click();
assert.ok(g.hidden);
assert.ok(document.querySelector('.sate-modal--pequeno'));
console.log('OK R2-GLO: CSS, contraste, término, tooltip anclado, hover, Escape, scroll/resize, iconos y táctil.');
