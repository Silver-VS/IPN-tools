// Lector de reglamentos (opción B): estructura, anclas, relaciones y fuente. Sin navegador.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
const leer = f => readFileSync(f, 'utf8');
const c = vm.createContext({});
vm.runInContext(leer('web/sate/guia.js'), c);
const G = c.SateGuia;
const reg = id => JSON.parse(leer('data/reglamentos/' + id + '.json'));

// anclas
assert.equal(G.anclaArticulo('4', 'III', 'b'), 'art-4.III.b');
assert.deepEqual({...G.leerAncla('art-1 Bis.II')}, {n: '1 Bis', fr: 'II', inciso: null});
assert.deepEqual({...G.leerAncla('art-33.III.b')}, {n: '33', fr: 'III', inciso: 'b'});
assert.equal(G.leerAncla('transitorios'), null);

// todos los reglamentos: cada fracción se encuentra en el texto y ningún artículo se pierde
for (const f of readdirSync('data/reglamentos').filter(n => n.endsWith('.json') && n !== 'indice.json')) {
  const r = reg(f.replace('.json', '')), arbol = G.arbolReglamento(r);
  const cuenta = n => n.articulos.length + n.hijos.reduce((s, h) => s + cuenta(h), 0);
  assert.equal(cuenta(arbol), r.articulos.length, f + ': árbol completo');
  for (const a of r.articulos) {
    const p = G.partesArticulo(a);
    if (a.fracciones?.length) assert.equal(p.fracciones.length, a.fracciones.length, f + ' art. ' + a.n + ': fracciones');
  }
}
// definiciones: regla conservadora
const rge3 = reg('rge').articulos.find(a => a.n === '3'), p3 = G.partesArticulo(rge3);
assert.equal(p3.definiciones.length, 37);
assert.equal(p3.definiciones[0].termino, 'Academia');
assert.equal(G.dividirDefiniciones('Texto normal sin lista. Otra oración: con dos puntos.'), null);
assert.equal(G.partesArticulo(reg('cambio_carrera').articulos.find(a => a.n === '5')).definiciones, null, 'OCR con viñetas no se parte');
// incisos
const h33 = G.partesArticulo(reg('honor').articulos.find(a => a.n === '33'));
assert.deepEqual(Array.from(h33.fracciones.find(f => f.fr === 'III').incisos, x => x.inciso), ['a', 'b', 'c']);
assert.ok(!h33.fracciones.find(f => f.fr === 'III').texto.includes(' a) '));
// fracciones con «I.-» (Ley Orgánica)
assert.ok(G.partesArticulo(reg('lo').articulos.find(a => a.n === '3')).fracciones.length >= 9);
// búsqueda
const ri = reg('ri');
assert.equal(G.buscarArticulos(ri, '12')[0].n, '12');
assert.ok(G.buscarArticulos(ri, 'dictamen').length > 0);
assert.equal(G.buscarArticulos(ri, ''). length, 0);
// relaciones reales
const d = {preguntas: [{id: 'a', apartado: 'situacion', pregunta: 'A', respuesta: 'Ver [[a:rge:52|art. 52]]', pasos: [], ventanilla: 'dictamen', fuentes: [{doc: 'rge', arts: ['60']}]}]};
let rel = G.relacionesArticulo(d, 'rge', '52', ['dictamen']);
assert.equal(rel.preguntas.length, 1); assert.deepEqual(Array.from(rel.tramites), ['dictamen']);
assert.equal(G.relacionesArticulo(d, 'rge', '60', []).tramites.length, 0, 'trámite que la unidad no tiene');
assert.equal(G.relacionesArticulo(d, 'rge', '1', ['dictamen']).preguntas.length, 0);

// fuente: Noto Sans, no la serif de PoliCORE
const css = leer('web/sate/guia.css');
assert.match(css, /\.rgl \.pc-lector\.pc-oficial[^{]*\{font-family:var\(--ipn-fuente-texto\)\}/);
assert.ok(!/\.rgl[^{]*\{[^}]*(serif|Noto Serif)/.test(css), 'sin serif en el lector de reglamentos');
console.log('OK reglamentos: árbol, fracciones, incisos, definiciones, anclas, búsqueda, relaciones y fuente');
