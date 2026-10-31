// Integración real de la Guía y el catálogo, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer=p=>readFileSync(p,'utf8');
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const texto=(k,v={})=>(config.textos[k]||k).replace(/\{(\w+)\}/g,(_,k)=>v[k]??'');
for(const unidad of ['upiita','escom','upibi']) {
  const datos=JSON.parse(leer(`web/dist/sate/datos/${unidad}/guia.json`));
  const {document}=crearEntorno();
  document.createElementNS=(_,tag)=>document.createElement(tag);
  let pestana;
  const mensajes=[];
  const c=vm.createContext({document,setTimeout,clearTimeout,console:{...console,debug(){},warn:(...m)=>mensajes.push(m)},
    matchMedia:()=>({matches:false}),location:{hash:`#/${unidad}/guia`,pathname:'/',search:'',href:'https://sitio.test/'},
    history:{replaceState(){}},scrollTo(){},addEventListener(){},removeEventListener(){},SATE_UNIDAD:unidad,SATE_CONFIG:config,
    SATE:{texto,json:async()=>datos,pestana:(_,p)=>pestana=p,error:e=>{throw e;}}});
  for(const archivo of ['componentes','actividades','guia'])vm.runInContext(leer(`web/sate/${archivo}.js`),c);
  c.SateUI.usarTextos(texto);
  const caja=document.createElement('div');caja.setAttribute('id','sate-guia');document.body.appendChild(caja);
  for(const partes of [['ruta','aprovecha'],['actividades']]) {
    await pestana.mostrar({partes});
    assert.deepEqual(mensajes,[],'la Guía carga sin errores');
    assert.equal(caja.querySelectorAll('.sate-actividades').length,1,unidad+'/'+partes.join('/')+': una sola implementación en ambas entradas');
    const botones=caja.querySelectorAll('[data-area]');
    assert.equal(botones.length,6);
    datos.actividades.secciones.forEach((s,i)=>{
      botones[i].click();
      assert.equal(caja.querySelectorAll('[data-actividad]').length,s.items.length);
      assert.equal(botones[i].getAttribute('aria-pressed'),'true');
      assert.ok(caja.querySelectorAll('[data-oficial]').length>=s.items.length);
      assert.doesNotMatch(caja.textContent,/no_verificado|sate\.actividades\./);
    });
  }
}
console.log('OK R27: rueda común en Guía y rutas, 6 secciones por unidad, fichas oficiales y selección.');
