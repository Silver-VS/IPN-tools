// Regresión de arquitectura sin navegador ni datos personales.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import vm from 'node:vm';
const leer = p => readFileSync(p, 'utf8');
const datos = JSON.parse(leer('data/sate.json'));
const ids = Object.keys(JSON.parse(leer('data/unidades_identidad.json')).unidades);
const historico = "UNIDAD==='upiita'?'hu.':'hu.'+UNIDAD+'.'";
function infracciones(nombre, src) {
  // Lista blanca por archivo y expresión completa, nunca por línea o unidad.
  if (nombre === 'nucleo.js') src = src.replace(historico, '');
  // Detectar valores literales y segmentos de rutas, dominios y archivos.
  // Variables est, clases est-sim y la palabra española ese no son ids literales.
  return ids.filter(id => new RegExp('([\'"`])'+id+'\\1|[/.-]'+id+'(?=[/.\'"`?#])','i').test(src)
    || new RegExp('(?<![\\p{L}\\p{N}_])'+id.toUpperCase()+'(?![\\p{L}\\p{N}_-])','u').test(src));
}
for (const nombre of readdirSync('web/sate').filter(n => n.endsWith('.js') || n === 'cascaron.html')) {
  assert.deepEqual(infracciones(nombre, leer('web/sate/'+nombre)), [], nombre+': id de unidad fuera de datos');
}
for (const id of ids) {
  assert.deepEqual(infracciones('inicio.js', `if (unidad === '${id}') {}`), [id]);
  assert.deepEqual(infracciones('cascaron.html', `<a href="/#/${id}/mapa">`), [id]);
}
assert.deepEqual(infracciones('nucleo.js', historico), []);
assert.deepEqual(infracciones('inicio.js', historico), ['upiita']);
assert.deepEqual(infracciones('nucleo.js', historico+"; unidad==='upiita'"), ['upiita']);
assert.deepEqual(datos.unidades.upiita.carga, {B:{min:27,media:40,max:80}});
assert.deepEqual(datos.unidades.upiita.carrerasSemestrales, ['E']);
for (const [id,cfg] of Object.entries(datos.unidades)) {
  assert.equal(cfg.cargaCalculada, id === 'upibi');
  assert.equal(cfg.electivas.tramite, id === 'upiita' ? 'electivas' : null);
}
const c = vm.createContext({});
vm.runInContext(leer('web/sate/rutas.js'), c);
assert.equal(c.SateRutas.redireccion('escom','','#/mapa'), 'sate/index.html#/escom/mapa');
assert.equal(c.SateRutas.redireccion('escom','','#/encb/mapa'), 'sate/index.html#/encb/mapa');
assert.equal(c.SateRutas.redireccion('escom','','#code=abc'), 'sate/index.html?sateUnidad=escom#code=abc');
// Las funciones reales deben responder a las capacidades incluso al cambiar el id.
const core = leer('web/sate/nucleo.js');
const semestral = core.match(/const SEMESTRAL=([^;]+);/)[0];
const plazo = core.slice(core.indexOf('function plazoReferencia('), core.indexOf('function proyeccionCreditos('));
for (const capacidades of [...Object.values(datos.unidades), {}]) {
  const contexto = vm.createContext({CAPACIDADES:capacidades, UNIDAD:'unidad-ficticia', S:{car:'E'}, MAP:()=>({})});
  vm.runInContext(semestral+plazo+';globalThis.sem=SEMESTRAL;globalThis.plazo=plazoReferencia', contexto);
  assert.equal(contexto.sem(), capacidades.carrerasSemestrales?.includes('E') || false);
  const r = contexto.plazo({carga:{total:400,min:27,duracion:9,duracion_max:14}});
  assert.equal(r.calculado, capacidades.cargaCalculada===true);
  assert.equal(r.max, capacidades.cargaCalculada===true ? 15 : 14);
}
console.log('OK arquitectura: ids en datos, prefijo histórico acotado y rutas genéricas');
