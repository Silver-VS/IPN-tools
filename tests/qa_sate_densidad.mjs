// Regresion de escala y geometria de la navegacion, sin navegador.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const componentes = readFileSync('web/sate/componentes.css', 'utf8');
const encabezado = readFileSync('web/sate/encabezado.css', 'utf8');
const jsEncabezado = readFileSync('web/sate/encabezado.js', 'utf8');

const bloquesDensidad = componentes.match(/@media\s*\(\s*min-width\s*:\s*640px\s*\)\s*and\s*\(\s*pointer\s*:\s*fine\s*\)\s*\{[\s\S]*?--ipn-tamano-m\s*:[^;]+;[\s\S]*?--ipn-control-alto\s*:[^;]+;[\s\S]*?--ipn-esp-1\s*:[^;]+;[\s\S]*?\n\s*\}/g) || [];
assert.equal(bloquesDensidad.length, 1, 'Debe existir un solo bloque central de densidad de escritorio');

function cssFiles(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? cssFiles(path) : entry.name.endsWith('.css') ? [path] : [];
  });
}
const sinToken = [];
for (const path of cssFiles('web/sate')) {
  const css = readFileSync(path, 'utf8');
  for (const match of css.matchAll(/([^{}]+)\{[^{}]*?font-size\s*:\s*([^;}]+)[;}]/gs)) {
    const valor = match[2].trim();
    if (/^(?:0|(?:\d*\.)?\d+(?:px|rem|em))$/i.test(valor)) {
      // Este cero solo suprime texto del glifo decorativo; no fija un tamano legible.
      const ceroIcono = valor === '0' && path.endsWith('guia.css') && match[1].includes('.rgl-art-acciones .rgl-icono');
      if (!ceroIcono) sinToken.push(`${path}: font-size:${valor}`);
    }
  }
}
assert.deepEqual(sinToken, [], `font-size fijo fuera de tokens: ${sinToken.join(', ')}`);

assert.match(encabezado, /:is\(#sate-tabs,\.sate-medicion\)\s+\.sate-pestana\s*\{[^}]*min-height\s*:\s*var\(--ipn-objetivo-tactil\)[^}]*font-size\s*:\s*var\(--ipn-tamano-xs\)/s,
  'La fila original usa la escala compacta de escritorio');
assert.match(encabezado, /\.sate-barra-flotante\s*\{[^}]*height\s*:\s*var\(--ipn-objetivo-tactil\)[^}]*min-height\s*:\s*var\(--ipn-objetivo-tactil\)[^}]*font-size\s*:\s*var\(--ipn-tamano-xs\)/s,
  'La barra fija conserva altura y tipografia de la fila');
assert.match(encabezado, /\.sate-barra-flotante \.sate-pestana\s*\{[^}]*min-height\s*:\s*var\(--ipn-objetivo-tactil\)/s);
assert.match(encabezado, /\.sate-barra-flotante \.sate-pestana\s*\{[^}]*font-size\s*:\s*var\(--ipn-tamano-xs\)/s);
assert.match(componentes, /body\.sate-flotante #sate-tabs\s*\{\s*visibility\s*:\s*hidden\s*\}/,
  'La fila original permanece en el flujo y reserva su alto');
assert.match(jsEncabezado, /setProperty\('--sate-barra-alto',[^;]*bar\.getBoundingClientRect\(\)\.height/,
  'El espacio sticky coincide con la altura efectiva de la barra fija');

console.log('OK densidad: un bloque central, tipografia tokenizada y barra fija de la misma escala');
