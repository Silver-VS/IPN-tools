// SPDX-License-Identifier: MIT
// Uso: D:\Tools\nodejs\node.exe tools/verificar_donativos.mjs (tras compilar).
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';

const raiz = new URL('../', import.meta.url);
const dist = new URL('web/dist/', raiz);
const url = JSON.parse(readFileSync(new URL('data/cuenta.json', raiz), 'utf8')).donativos;
let bloques = 0;
for (const nombre of readdirSync(dist).filter(n => n.endsWith('.html'))) {
  const pagina = readFileSync(new URL(nombre, dist), 'utf8');
  let bloque = 0;
  for (const m of pagina.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    bloque++;
    if (/\bsrc\s*=|\btype\s*=\s*["'](?:application\/ld\+json|application\/json)["']/i.test(m[1])) continue;
    try { new Function(m[2]); } catch (error) {
      throw new Error(`${nombre}: bloque script ${bloque}: ${error.message}`);
    }
    bloques++;
  }
  if (!['index.html', 'horarios-upiita.html', 'horarios-escom.html'].includes(nombre)) continue;
  const pie = pagina.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/i)?.[1];
  assert.ok(pie?.includes(`href="${url}" target="_blank" rel="noopener"`), `${nombre}: falta enlace seguro en el pie`);
  assert.ok(pie.includes('class="ipnt-apoyo"'), `${nombre}: falta fragmento de apoyo`);
  assert.ok(pie.includes('aria-hidden="true"'), `${nombre}: falta icono decorativo`);
  assert.ok(!pagina.includes('/*__APOYO') && !pagina.includes('<!--__APOYO'), `${nombre}: marcador sin resolver`);
  assert.ok(!/<(?:iframe|script|img|link)\b[^>]*(?:src|href)=["']https:\/\/github\.com\//i.test(pagina), `${nombre}: carga de GitHub en la pagina`);
  if (nombre.startsWith('horarios-')) {
    assert.ok(pagina.includes("$('#foot-info').textContent="), `${nombre}: se sobrescribe el pie`);
    assert.ok(pagina.includes('const APOYO='), `${nombre}: falta apoyo en la encuesta`);
  }
  console.log(`${nombre}: enlace del pie y marcadores correctos`);
}
for (const nombre of ['index.html', 'horarios-upiita.html', 'horarios-escom.html', 'sate/index.html']) {
  assert.ok(readdirSync(dist).includes(nombre), `Falta compilar ${nombre}`);
}
console.log(`${bloques} bloques de script parseados sin errores; sin navegador ni red.`);

// Ejecuta el manejador real con un envio simulado; nunca consulta el endpoint de la encuesta.
const horarios = readFileSync(new URL('horarios-upiita.html', dist), 'utf8').replaceAll('\r\n', '\n');
const apoyo = JSON.parse(horarios.match(/const APOYO=(.*);/)[1]);
const funcion = horarios.match(/async function enviar\(tipo,motivo,f\)\{[\s\S]*?\n\}\n\n\/\* ---------- API/)[0]
  .split('\n\n/* ---------- API')[0];
for (const falla of [false, true]) {
  const msg = {className:'', textContent:'', classList:{add(){}}};
  const boton = {disabled:false};
  const formulario = {
    outerHTML:'formulario original',
    querySelector(s){return s === '.enc-msg' ? msg : boton;},
    querySelectorAll(){return [];}
  };
  const estado = {id:'ficticio', hasta:1};
  let cierres = 0, guardados = 0;
  const ejecutar = new Function('mandar', 'FormData', 'contexto', 'E', 'ahora', 'guardar', 'enlaces', 'APOYO', 'setTimeout',
    `let enviado=false; ${funcion}; return enviar;`)(
    async () => {if (falla) throw new Error('sin conexión');},
    class {entries(){return [['inscrito', 'aun']][Symbol.iterator]();}},
    () => ({}), estado, () => 123, () => guardados++, () => {}, apoyo, () => cierres++);
  await ejecutar('completa', 'manual', formulario);
  if (falla) {
    assert.equal(formulario.outerHTML, 'formulario original', 'Un envio fallido muestra el agradecimiento');
    assert.equal(boton.disabled, false, 'El envio fallido no permite reintentar');
    assert.equal(guardados, 0, 'El envio fallido guarda una respuesta');
  } else {
    assert.ok(formulario.outerHTML.includes(apoyo), 'El agradecimiento no incluye el enlace compartido');
    assert.equal(estado.resp.inscrito, 'aun', 'El enlace altera la respuesta');
    assert.equal(guardados, 1, 'No se guarda la respuesta exitosa');
    assert.equal(cierres, 0, 'El cierre automatico impide leer el enlace');
  }
}
console.log('Encuesta: agradecimiento con apoyo al enviar; fallo conserva el formulario para reintentar.');
