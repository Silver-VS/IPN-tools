// Guía politécnica y bibliotecas: funciones puras (sin navegador ni red).
// URL de cada buscador del IPN, búsqueda de preguntas, apartados por unidad y fuentes con artículo.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const leer = f => readFileSync(f, 'utf8');
const sate = JSON.parse(leer('data/sate.json'));
const guia = JSON.parse(execFileSync('python', ['-c', 'import json,sys;from pathlib import Path;sys.path.insert(0,"tools");from build_sate import fusionar_guia;leer=lambda n:json.loads(Path("data/guia/"+n+".json").read_text(encoding="utf-8"));print(json.dumps(fusionar_guia(leer("comun"),leer("upiita")),ensure_ascii=False))'], {encoding: 'utf8', env: {...process.env, PYTHONIOENCODING: 'utf-8'}}));
const c = vm.createContext({});
vm.runInContext(leer('web/sate/bibliotecas.js'), c);
vm.runInContext(leer('web/sate/guia.js'), c);
const B = c.SateBibliotecas, G = c.SateGuia;
assert.ok(B && G, 'sin SATE ni DOM, los archivos exponen solo las funciones puras');
assert.equal(c.SateBibliotecas.panel, undefined, 'el panel solo existe con la interfaz');

/* ---------- Bibliotecas ---------- */
const f = Object.fromEntries(sate.bibliotecas.map(x => [x.id, x]));
const t = 'cálculo diferencial', q = encodeURIComponent(t);
assert.equal(q, 'c%C3%A1lculo%20diferencial');
assert.equal(B.url(f.catalogo, t), 'https://www.busqueda.dirbibliotecas.ipn.mx/F/?func=find-b&request=' + q + '&find_code=WRD');
for (const [campo, codigo] of [['titulo', 'WTI'], ['autor', 'WAU'], ['tema', 'WSU'], ['todo', 'WRD'], ['desconocido', 'WRD']]) {
  assert.equal(B.url(f.catalogo, t, {campo}), 'https://www.busqueda.dirbibliotecas.ipn.mx/F/?func=find-b&request=' + q + '&find_code=' + codigo, campo);
}
assert.equal(B.url(f.catalogo, t, {biblioteca: 'UPITA'}), 'https://www.busqueda.dirbibliotecas.ipn.mx/F/?func=find-b&request=' + q + '&find_code=WRD&filter_code_5=WSL&filter_request_5=UPITA', 'solo la biblioteca de la unidad');
assert.equal(B.url(f.catalogo, t, {biblioteca: null}), B.url(f.catalogo, t), 'por omisión, todo el IPN');
assert.equal(B.url(f.digital, t), 'https://searchbox.ebsco.com/search/?schemaId=search&custid=s3753448&groupid=main&profid=eds&authtype=ip&scope=site&site=eds-live&direct=true&bquery=' + q);
assert.equal(B.url(f.digital, t, {campo: 'titulo'}), f.digital.url.replace('{termino}', encodeURIComponent('TI ' + t)));
assert.equal(B.url(f.digital, 'Stewart', {campo: 'autor'}).endsWith('bquery=AU%20Stewart'), true);
assert.equal(B.url(f.digital, t, {biblioteca: 'UPITA'}), B.url(f.digital, t), 'el filtro de biblioteca solo es del catálogo');
assert.equal(B.url(f.tesis, t), 'https://tesis.ipn.mx/discover?query=' + q);
assert.equal(B.url(f.tesis, t, {campo: 'autor', biblioteca: 'UPITA'}), B.url(f.tesis, t));
// Sin término se abre la portada del buscador; el término nunca inyecta parámetros.
for (const x of Object.values(f)) { assert.equal(B.url(x, '   '), x.inicio); assert.equal(B.url(x, ''), x.inicio); assert.equal(B.url(x), x.inicio); }
const malo = 'a&find_code=WTI#"><b>';
const par = (x, k, op) => new URL(B.url(x, malo, op)).searchParams;
assert.equal(par(f.catalogo, 'request', {biblioteca: 'UPITA'}).get('request'), malo, 'el término llega entero, sin abrir parámetros');
assert.equal(par(f.catalogo, 'find_code').get('find_code'), 'WRD');
assert.equal(par(f.catalogo, 'filter', {biblioteca: 'UPITA'}).get('filter_request_5'), 'UPITA');
assert.equal(par(f.digital).get('bquery'), malo);
assert.equal(par(f.digital).get('custid'), 's3753448');
assert.equal(par(f.tesis).get('query'), malo);
for (const x of Object.values(f)) assert.ok(!/[<>"# ]/.test(B.url(x, malo)), x.id + ': sin caracteres sin codificar');
assert.equal((B.url(f.catalogo, malo).match(/find_code=/g) || []).length, 1, 'el término no agrega otro find_code');
// destinos: una tarjeta por buscador, en el orden de data/sate.json
const d = B.destinos(sate.bibliotecas, t, {campo: 'tema', biblioteca: 'UPITA'});
assert.deepEqual(Array.from(d, x => x.id), ['catalogo', 'digital', 'tesis']);
assert.ok(d.every(x => x.href.startsWith('https://')));
assert.equal(d[1].aviso, 'sate.guia.biblio_digital_aviso');

/* ---------- Guía ---------- */
assert.equal(G.norm('Situación ESCOLAR'), 'situacion escolar');
assert.deepEqual(Array.from(G.terminos('¿Qué es un dictamen?')), ['que', 'es', 'un', 'dictamen']);
const r = G.buscarPreguntas(guia.preguntas, 'DICTAMEN');
assert.ok(r.length >= 4 && r.every(p => /dictamen/.test(G.norm([p.pregunta, p.respuesta, ...p.pasos, ...p.palabras].join(' ')))));
assert.equal(r[0].id.includes('dictamen'), true, 'primero, las que coinciden en el título');
assert.equal(G.buscarPreguntas(guia.preguntas, 'zzzxyz').length, 0);
assert.equal(G.buscarPreguntas(guia.preguntas, '').length, 0);
assert.ok(G.buscarPreguntas(guia.preguntas, 'etsssss').length === 0);
assert.ok(G.buscarPreguntas(guia.preguntas, 'titulo de suficiencia').some(p => p.id === 'que-son-ets'), 'sin acentos ni mayúsculas');
assert.ok(G.buscarPreguntas(guia.preguntas, 'dictamen', 'tramites').every(p => p.apartado === 'tramites'));
assert.ok(G.buscarPreguntas(guia.preguntas, 'baja', 'situacion').every(p => p.apartado === 'situacion'));
// apartados por unidad: con datos y programas (UPIITA) o ninguno (sin contenido propio)
const ap = id => Array.from(G.apartadosDisponibles(sate.guia, {guiaDatos: true, vistas: [{id: 'temarios'}]}), a => a.id);
assert.deepEqual(ap(), ['situacion', 'tramites', 'reglamentos', 'programas', 'acudir']);
assert.deepEqual(Array.from(G.apartadosDisponibles(sate.guia, {guiaDatos: false, vistas: []}), a => a.id), []);
assert.deepEqual(Array.from(G.apartadosDisponibles(sate.guia, {guiaDatos: false, vistas: [{id: 'temarios'}]}), a => a.id), ['programas']);
assert.ok(sate.guia.filter(a => a.pronto).every(a => !G.apartadosDisponibles(sate.guia, {guiaDatos: true, vistas: [{id: 'temarios'}]}).includes(a)));
assert.equal(G.enlace('upiita'), '#/upiita/guia');
assert.equal(G.enlace('upiita', 'situacion', 'que-es-dictamen'), '#/upiita/guia/situacion/que-es-dictamen');
// fuentes con artículo
const tx = (k, v) => k === 'sate.guia.fuente_articulo' ? v.documento + ', art. ' + v.articulo : k;
const fu = G.fuente(guia, {doc: 'rge', articulo: '52, fracc. III, y 60'}, tx);
assert.equal(fu.texto, 'Reglamento General de Estudios del IPN, art. 52, fracc. III, y 60');
assert.equal(fu.url, 'https://www.ipn.mx/assets/files/normatividad/docs/reglamentos/rge-13-06-2011.pdf');
assert.equal(G.fuente(guia, {doc: 'saes'}, tx).texto, 'SAES de la UPIITA');
assert.equal(G.fuente(guia, {doc: 'inexistente'}, tx), null);
for (const p of guia.preguntas) for (const x of p.fuentes) assert.ok(G.fuente(guia, x, tx).url.startsWith('https://'), p.id);
// textos: todas las claves nuevas existen
const textos = JSON.parse(execFileSync('python', ['-c', 'import sys,json;sys.path.insert(0,"tools");import contenido;print(json.dumps(contenido.objeto_t(),ensure_ascii=False))'], {encoding: 'utf8', maxBuffer: 1 << 26, env: {...process.env, PYTHONIOENCODING: 'utf-8'}}));
for (const k of ['sate.guia.situacion', 'sate.guia.acudir', 'sate.guia.fuente_articulo', 'sate.guia.revisado', 'sate.biblio.titulo', 'sate.biblio.solo_unidad', 'componentes.migas', 'componentes.volver_a', 'sate.ventanilla.ver_guia', 'temarios.selector.titulo']) assert.ok(k in textos, k);
for (const a of sate.guia) { assert.ok(a.titulo in textos && a.descripcion in textos, a.id); }
console.log('OK guía y bibliotecas: URL de catálogo, Biblioteca Digital y tesis (término codificado, filtro de unidad), búsqueda de preguntas, apartados por unidad y fuentes con artículo.');
