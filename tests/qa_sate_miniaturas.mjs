// DOM local: no usa navegador ni red. Comprueba las celdas de todas las variantes.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer=p=>readFileSync(p,'utf8'),src=leer('web/sate/tramites.js');
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const {document}=crearEntorno();
const c=vm.createContext({document,SATE_CONFIG:config,SATE_UNIDAD:'upiita',raiz:{},leer:()=>null,
  tx:k=>config.textos['sate.ventanilla.'+k]||k,
  el:(tag,texto,clase)=>{const n=document.createElement(tag);if(texto!=null)n.textContent=texto;if(clase)n.className=clase;return n}});
vm.runInContext(src.slice(src.indexOf('  function miniatura('),src.indexOf('  function estado(')),c);
for(const id of ['baja_temporal','baja_definitiva','electivas','dictamen'])for(const tipo of id==='dictamen'?['interno','externo']:[''])for(const ejemplo of [false,true]){
  const mini=c.miniatura({id},{tipo,nombres:'Nombre ficticio '.repeat(30),carrera:'Programa ficticio '.repeat(30),correo:'correo.largo@example.test'},ejemplo);
  const campos=mini.querySelectorAll('.tramite-miniatura-campo'),celdas=new Set();
  assert.ok(campos.length>=7,id+tipo);
  for(const campo of campos){
    const estilo=campo.getAttribute('style');assert.match(estilo,/^grid-row:\d+;grid-column:[12]$/);
    assert.ok(!celdas.has(estilo),'Celda repetida: '+id+tipo+' '+estilo);celdas.add(estilo);
    assert.equal(campo.children.length,2,'Etiqueta sobre valor');
  }
  const hoja=mini.querySelector('.tramite-miniatura-hoja');
  assert.equal(hoja.children.at(-1).className,'tramite-miniatura-firma');
}
for(const archivo of ['dictamen','bajas','tramites'])assert.doesNotMatch(leer('web/sate/'+archivo+'.js'),/tx\('fundamento'\)/,'Sin control Fundamento');
const css=leer('web/sate/componentes.css');
assert.match(src,/mini\.onclick=ampliarFormato/,'La miniatura usa la hoja común ampliada');
assert.match(src,/ver=boton\(tx\('ver_formato'\),ampliarFormato\)/,'Vista previa usa la misma ampliación');
assert.match(src,/function ampliarFormato\(\)\{\s*const hoja=miniatura\(def,m\.datos,false\)/);
for(const clase of ['campo','firma','tabla']){
  const regla=css.match(new RegExp('\\.tramite-miniatura-'+clase+'\\{([^}]+)\\}'))[1];
  assert.doesNotMatch(regla,/position:absolute/,'Contenido en flujo: '+clase);
}
assert.match(css,/tramite-miniatura-marca\{[^}]*z-index:-1;[^}]*rotate\(-30deg\);opacity:\.1/);
console.log('Miniaturas: bajas temporal/definitiva, DIE-03 y dictamen interno/externo, celdas únicas y firma en flujo OK');
