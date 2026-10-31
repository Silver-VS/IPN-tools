// Regresiones estructurales R25-FIX/R25-FIX2, sin navegador:
// dos radios semánticos, sin franjas laterales de acento, flujo normal en Horarios.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const template = readFileSync('web/horarios.template.html', 'utf8');
const componentes = readFileSync('web/sate/componentes.css', 'utf8');
assert.match(componentes, /--ipn-radio-control\s*:\s*\.5rem/);
assert.match(componentes, /--ipn-radio-superficie\s*:\s*\.75rem/);
assert.match(template, /--ipn-radio-control\s*:\s*\.5rem/);
assert.match(template, /--ipn-radio-superficie\s*:\s*\.75rem/);
assert.match(componentes, /button,select,input,textarea,\[role="button"\][^{]*\{[^}]*border-radius\s*:\s*var\(--ipn-radio-control\)/);
// Horarios: la barra de filtros va en flujo normal y el eje de horas mide lo necesario.
assert.match(template, /\.filters\s*\{[^}]*position\s*:\s*relative/);
assert.doesNotMatch(template, /\.filters\s*\{[^}]*position\s*:\s*(?:fixed|sticky|absolute)/);
assert.doesNotMatch(template, /\.filters\s*\{[^}]*(?<![-\w])height\s*:\s*\d/);
assert.match(template, /\.cal\s*\{[^}]*grid-template-columns\s*:\s*4\.25rem/);
assert.match(template, /\.hours div\s*\{[^}]*white-space\s*:\s*nowrap/);

const cascaron = readFileSync('web/sate/cascaron.html', 'utf8');
assert.match(cascaron, /\.cal\s*\{[^}]*grid-template-columns\s*:\s*4\.25rem/);
assert.match(cascaron, /\.hours div\s*\{[^}]*white-space\s*:\s*nowrap/);
assert.match(componentes, /\.filters\.filtros-d\s*\{[^}]*position\s*:\s*relative/);
assert.doesNotMatch(cascaron, /\.filters\s*\{[^}]*(?:position\s*:\s*(?:fixed|absolute)|(?<![-\w])height\s*:\s*\d)/);

function archivos(dir, ext) {
  return readdirSync(dir, {withFileTypes: true}).flatMap(e => {
    const p = join(dir, e.name);
    return e.isDirectory() ? archivos(p, ext) : ext.some(x => e.name.endsWith(x)) ? [p] : [];
  });
}
const css = [...archivos('web/sate', ['.css']), ...archivos('web/policore', ['.css']), 'web/horarios.template.html', 'web/sate/cascaron.html'];
const js = [...archivos('web/sate', ['.js']), ...archivos('web/policore', ['.js'])];
const TOKEN = String.raw`(?:var\(--ipn-radio-(?:control|superficie)(?:,[^)]*)?\)|0)`;
const VALOR_OK = new RegExp(String.raw`^${TOKEN}(?:\s+${TOKEN})*$`);
const ACENTO = /acento|accent|guinda|sate-realce|--ok\b|--bad\b|--warn\b|ipn-ok|ipn-error|ipn-aviso|--area|--cal-color|--tmr-area|--gd-area|--sel-area|--pc-acento|hsl\(/i;

function revisar(ruta, texto, esJs, compilado = false) {
  const FORMAS = /^(?:50%|999px|[2-5]px|\.2em|2px 2px 0 0)$/;   // el compilado ya no trae comentarios: se aceptan solo las formas no-control conocidas
  const malos = {radios: [], franjas: []};
  const lineas = texto.split(/\r?\n/);
  lineas.forEach((linea, n) => {
    const donde = `${ruta}:${n + 1}`;
    if (esJs && !/style|cssText|border/i.test(linea)) return;
    for (const m of linea.matchAll(/border-radius\s*:\s*([^;}'"`\n]*)/g)) {
      const valor = m[1].replace(/\/\*.*?\*\//g, '').trim();
      if (!VALOR_OK.test(valor) && !(compilado ? FORMAS.test(valor) : linea.includes('forma: no-control'))) malos.radios.push(`${donde} ${valor}`);
    }
    if (/\.style\.borderRadius|borderRadius\s*[:=]/.test(linea) && !linea.includes('forma: no-control')) malos.radios.push(`${donde} borderRadius en JS`);
    for (const m of linea.matchAll(/(border-(?:left|inline-start)(?:-width|-color|-style)?)\s*:\s*([^;}'"`\n]*)/g)) {
      const v = m[2].trim();
      if (/^(?:0|none|solid|transparent)$/.test(v)) continue;
      const ancho = v.match(/(\d+(?:\.\d+)?)px/);
      const grueso = (m[1].endsWith('-width') || !/-(color|style)$/.test(m[1])) && ((ancho && parseFloat(ancho[1]) >= 2) || /var\(--ipn-esp-\d\)/.test(v));
      const color = /-color$/.test(m[1]) ? true : ACENTO.test(v);
      if (grueso || color) malos.franjas.push(`${donde} ${m[1]}: ${v}`);
    }
    for (const m of linea.matchAll(/(border-(?:right|inline-end))\s*:\s*([^;}'"`\n]*)/g)) {
      if (/^(?:0|none)$/.test(m[2].trim())) continue;
      if (/acento|accent|guinda|sate-realce|plan-segundo/.test(m[2])) malos.franjas.push(`${donde} ${m[1]}: ${m[2]}`);
    }
    if (/inset\s+-?\d+(?:\.\d+)?px\s+0\s+(?:var|#|rgb|hsl)/.test(linea)) malos.franjas.push(`${donde} sombra interior lateral`);
  });
  // ::before/::after que dibujan una barra pegada a un costado de arriba a abajo
  for (const m of texto.matchAll(/([^{}]*::(?:before|after))\s*\{([^}]*)\}/g)) {
    const c = m[2];
    if (/(?:^|;)\s*(?:left|inset-inline-start)\s*:\s*0\b/.test(c) && /(?:^|;)\s*top\s*:\s*0\b/.test(c) && /(?:^|;)\s*bottom\s*:\s*0\b/.test(c) && /width\s*:\s*\d+(?:px|rem)/.test(c) && !/right\s*:/.test(c))
      malos.franjas.push(`${ruta} ${m[1].trim()} barra lateral`);
  }
  return malos;
}

import {existsSync} from 'node:fs';
// CSS inyectado por tools/*.py (cuenta, SAES, skins, encabezado) y HTML ya compilado.
const inyectados = ['cuenta.py', 'saes.py', 'skins.py', 'institucional.py', 'encuesta.py'].map(n => join('tools', n));
const compilados = ['web/dist', 'web/dist/sate'].filter(existsSync).flatMap(d => readdirSync(d).filter(n => n.endsWith('.html') && (d.endsWith('sate') || /^horarios-/.test(n))).map(n => join(d, n)));
const radios = [], franjas = [];
for (const ruta of css) { const r = revisar(ruta, readFileSync(ruta, 'utf8'), false); radios.push(...r.radios); franjas.push(...r.franjas); }
for (const ruta of [...inyectados, ...compilados]) { const r = revisar(ruta, readFileSync(ruta, 'utf8'), false, ruta.startsWith('web')); radios.push(...r.radios); franjas.push(...r.franjas); }
for (const ruta of js) { const r = revisar(ruta, readFileSync(ruta, 'utf8'), true); radios.push(...r.radios); franjas.push(...r.franjas); }
assert.deepEqual(radios, [], `Radios sin token ni «forma: no-control»:\n${radios.join('\n')}`);
assert.deepEqual(franjas, [], `Franjas laterales de acento o de 2 px o más:\n${franjas.join('\n')}`);

// El detector funciona: dos muestras con fallo deben detectarse.
const mala = revisar('muestra.css', '.a{border-radius:12px}.b{border-left:4px solid var(--ipn-acento)}.c::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px}', false);
assert.equal(mala.radios.length, 1);
assert.equal(mala.franjas.length, 2);
const buena = revisar('muestra.css', '.a{border-radius:var(--ipn-radio-control)}.b{border-left:1px solid var(--ipn-linea)}.c{border-radius:50% /* forma: no-control */}', false);
assert.deepEqual([buena.radios.length, buena.franjas.length], [0, 0]);

console.log(`OK R25-FIX2: ${css.length} CSS/plantillas y ${js.length} JS revisados; radios solo por token o «forma: no-control»; sin franjas laterales; flujo y eje horario correctos.`);
