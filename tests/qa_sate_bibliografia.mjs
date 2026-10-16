// Casos tomados de los programas reales; sin navegador ni red.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {crearEntorno} from './dom_minimo.mjs';
const leer = f => readFileSync(f, 'utf8');
const config = JSON.parse(leer('data/sate.json'));
const {document} = crearEntorno();
const textos = {
  'sate.biblio.disponibilidad': 'Consultar disponibilidad',
  'sate.biblio.disponibilidad_titulo': 'Consultar disponibilidad: {titulo}'
};
const c = vm.createContext({document, SATE_CONFIG: config, SATE: {texto: (k, v) => textos[k].replace('{titulo}', v?.titulo || '')}});
vm.runInContext(leer('web/sate/bibliotecas.js'), c);
const b = c.SateBibliotecas;
const materias = carrera => JSON.parse(leer(`data/temarios/upiita/${carrera}.json`)).materias;
const referencias = ['bionica', 'mecatronica', 'telematica'].flatMap(carrera => materias(carrera).flatMap(m => (m.bibliografia || []).map(b => b.texto)));
const casos = [
  ['Grossman, Stanley I.', 'Álgebra Lineal'],
  ['Howard, A.', 'Introducción al Álgebra Lineal'],
  ['Nakos, G.', 'Álgebra Lineal con aplicaciones'],
  ['Soler, F.', 'Álgebra Lineal y Programación Lineal'],
  ['Kart, G.', 'Cell Biology'],
  ['Purves, W.K.', 'Life: The Science of Biology'],
  ['Blair, Clifford.', 'Bioestadística'],
  ['Daniel, Wayne.', 'Bioestadística: base para el análisis de las ciencias'],
  ['Gadotti, M. (2002)', 'Pedagogía de la Tierra'],
  ['Allen B. Tucker (2003)', 'Lenguajes de programación. Principios y paradigmas'],
  ['Cairo Osvaldo (2008)', 'Metodología de la programación: algoritmos, diagrams de flujo'],
  ['Grady Booch;', 'El Lenguaje Unificado De Modelado: Guía Del Usuario']
];
const catalogo = config.bibliotecas.find(f => f.id === 'catalogo');
for (const [prefijo, esperado] of casos) {
  const referencia = referencias.find(r => r.startsWith(prefijo));
  assert.ok(referencia, `Falta caso real: ${prefijo}`);
  assert.equal(b.tituloDeReferencia(referencia), esperado, referencia);
  const nodo = b.referencia(referencia), a = nodo.querySelector('a');
  assert.equal(a.getAttribute('href'), catalogo.url.replace('{termino}', encodeURIComponent(esperado)).replace('{campo}', 'WTI'));
  assert.equal(a.getAttribute('target'), '_blank');
  assert.equal(a.getAttribute('rel'), 'noopener');
  assert.equal(a.getAttribute('aria-label'), `Consultar disponibilidad: ${esperado}`);
  assert.equal(a.textContent, 'Consultar disponibilidad');
  assert.equal(nodo.querySelector('span').textContent, referencia);
}
assert.equal(b.tituloDeReferencia('ÁLGEBRA LINEAL. Editorial Limusa. ISBN 123'), 'ÁLGEBRA LINEAL');
assert.equal(b.tituloDeReferencia('Referencia sin separadores ni año'), 'Referencia sin separadores ni año');
assert.equal(b.tituloDeReferencia(null), '');
console.log('OK');
