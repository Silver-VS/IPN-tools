// Pruebas sin navegador: contratos de rutas, redirecciones y parseo de salidas.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const leer = p => readFileSync(p,'utf8');
const config = JSON.parse(leer('data/sate.json')).unidades;
const context = vm.createContext({URLSearchParams});
vm.runInContext(leer('web/sate/rutas.js'),context);
const {ruta,redireccion} = context.SateRutas;
let pruebas = 0;
for (const u of Object.keys(config)) {
  for (const p of config[u].pestanas) {
    const h = '#/'+u+'/'+p;
    assert.equal(ruta(h,'upiita',config).hash,h); pruebas++;
    assert.equal(ruta('#/'+p,u,config).unidad,u); pruebas++;
  }
  for (const h of ['#demo','#code=abc&state=def','#error=denied','#dark','','#foo']) {
    assert.equal(ruta(h,u,config),null); pruebas++;
    const target = redireccion(u,'?materia=B211&valor=a%20b',h);
    assert.ok(target.startsWith('sate/index.html?materia=B211&valor=a%20b'));
    assert.ok(target.endsWith(h || '#/'+u+'/mapa')); pruebas++;
  }
  assert.equal(redireccion(u,'?x=1','#/horarios'),'sate/index.html?x=1#/'+u+'/horarios'); pruebas++;
  assert.equal(ruta('#/'+u+'/mapa/extra',u,config),null); pruebas++;
}
assert.equal(ruta('#/escom/situacion','upiita',config),null);
assert.equal(ruta('#/upibi/tramites','upiita',config),null);
assert.equal(ruta('#/upiita/tramites/electivas?desde=mapa','upiita',config).tramite,'electivas');
assert.equal(ruta('#/upiita/tramites/inventado','upiita',config),null);
assert.equal(redireccion(null,'?x=1','#demo'),'sate/index.html?x=1#demo');
pruebas += 5;

function archivos(dir) {
  return readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory()?archivos(path.join(dir,e.name)):[path.join(dir,e.name)]);
}
let scripts = 0;
for (const f of archivos('web/dist').filter(f=>f.endsWith('.html'))) {
  const html = leer(f);
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\bsrc\s*=|application\/(?:ld\+)?json/i.test(m[1])) continue;
    assert.ok(!/\btype\s*=\s*["']module/.test(m[1]),'Se requiere añadir verificación de ES modules: '+f);
    new vm.Script(m[2],{filename:f}); scripts++;
  }
}
for (const f of archivos('web/sate').filter(f=>f.endsWith('.js')).concat(archivos('web/dist/sate').filter(f=>f.endsWith('.js')))) {
  new vm.Script(leer(f),{filename:f}); scripts++;
}
// Parsear también el ámbito global conjunto detecta declaraciones duplicadas entre módulos.
new vm.Script(['nucleo.js','mapa.js','horarios.js'].map(n=>leer('web/dist/sate/'+n)).join('\n'));
for (const unidad of Object.keys(config)) {
  const f = 'web/dist/horarios-'+unidad+'.html'; let destino;
  const c = vm.createContext({URLSearchParams,location:{search:'?demo=1',hash:'#code=x',replace:u=>destino=u}});
  for (const m of leer(f).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) vm.runInContext(m[1],c);
  assert.equal(destino,'sate/index.html?demo=1&sateUnidad='+unidad+'#code=x'); pruebas++;
}
const comunes = ['index.html','nucleo.js','inicio.js','rutas.js','componentes.js'];
const base = comunes.reduce((s,n)=>s+statSync('web/dist/sate/'+n).size,0);
const medidas = {};
for (const u of Object.keys(config)) {
  const nucleo=statSync('web/dist/sate/datos/'+u+'/nucleo.json').size;
  const oferta=statSync('web/dist/sate/datos/'+u+'/oferta.json').size;
  medidas[u]={cascaronNucleo:base+nucleo,vistaInicial:base+nucleo+oferta+statSync('web/dist/sate/mapa.js').size,presupuesto:160000};
}
console.log(JSON.stringify({pruebas,scripts,bytes:medidas},null,2));
