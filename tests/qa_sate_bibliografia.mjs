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
  assert.equal(a.getAttribute('href'), catalogo.url.replace('{termino}', encodeURIComponent(b.consultaDeReferencia(esperado))).replace('{campo}', 'WTI') + '&adjacent=N');
  assert.equal(a.getAttribute('target'), '_blank');
  assert.equal(a.getAttribute('rel'), 'noopener');
  assert.equal(a.getAttribute('aria-label'), `Consultar disponibilidad: ${esperado}`);
  assert.equal(a.textContent, 'Consultar disponibilidad');
  assert.equal(nodo.querySelector('span').textContent, referencia);
}
assert.equal(b.tituloDeReferencia('ÁLGEBRA LINEAL. Editorial Limusa. ISBN 123'), 'ÁLGEBRA LINEAL');
assert.equal(b.tituloDeReferencia('Referencia sin separadores ni año'), 'Referencia sin separadores ni año');
assert.equal(b.tituloDeReferencia(null), '');
// Referencias reales del barrido del catálogo: título limpio (sin ediciones, editoriales ni autores) y consulta de 4–5 palabras clave.
const reales = [
  ['• Churchill, R. V. and Brown, J. W (2008). Complex Variables and Applications (8th Edition). USA: McGraw-Hill.', 'Complex Variables and Applications', 'Complex Variables Applications'],
  ['• Bernal, C. A. (2010). Metodología de la Investigación (3a. edición). Colombia: Pearson. ISBN 978-9586991285.', 'Metodología de la Investigación', 'Metodología Investigación'],
  ['1. Donald R. Askeland, Pradeep P. Fulay, Wendelin J. Wright (2010), The Science and Engineering of Materials (6ª Edición), USA: Cengage Learning', 'The Science and Engineering of Materials', 'Science Engineering Materials'],
  ['• Márquez F. (2004), UNIX Programación Avanzada (3ª edición), España: AlfaOmega ISBN: 9701510496', 'UNIX Programación Avanzada', 'UNIX Programación Avanzada'],
  ['Barnes Davis, Programación Orientada a Objetos con Java, Ed. Prentice Hall, México, 2007, ISBN: 9702607922', 'Programación Orientada a Objetos con Java', 'Programación Orientada Objetos Java'],
  ['• Kuo B. C., Golnaraghi F. (2003). Automatic Control Systems, John Wiley & Sons, USA. ISBN 0471134760', 'Automatic Control Systems', 'Automatic Control Systems'],
  ['• Lewin, B. (2007). Genes IX (9th Edition). England: Oxford Press. ISBN: 0763740632', 'Genes IX', 'Genes'],
  ['• Rana S., Sharma J. (2006), Frontiers of Geographic Information Technology, Netherlands: Springer-Verlag, ISBN 3540337466', 'Frontiers of Geographic Information Technology', 'Frontiers Geographic Information Technology'],
  ['Larson, Hostetler, Edwards, Cálculo I, Ed. McGraw Hill, 8ª Edición, México 2006', 'Cálculo I', 'Cálculo'],
  ['5. Wakerly John F. (2007). Digital design: principles and practices (4th Edition). USA: Pearson Prentice Hall.', 'Digital design: principles and practices', 'Digital design']
];
for (const [texto, titulo, consulta] of reales) {
  assert.equal(b.tituloDeReferencia(texto), titulo, texto);
  assert.equal(b.consultaDeReferencia(titulo), consulta, titulo);
}
assert.equal(b.consultaDeReferencia('Sistemas de control en tiempo discreto para ingeniería moderna'), 'Sistemas control tiempo discreto ingeniería');
console.log('OK');
