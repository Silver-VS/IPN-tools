import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const c=vm.createContext({TextEncoder,Response,Blob,CompressionStream,DecompressionStream,Uint8Array,btoa,atob});
vm.runInContext(readFileSync('web/sate/guia.js','utf8'),c);
const G=c.SateGuia;
const afectados=[];
for(const f of readdirSync('data/reglamentos').filter(x=>x.endsWith('.json')&&x!=='indice.json')) {
 const r=JSON.parse(readFileSync('data/reglamentos/'+f,'utf8')), arbol=G.arbolReglamento(r);
 assert.deepEqual(Array.from(G.numerosNodo(arbol)),r.articulos.map(a=>a.n),f+': orden completo');
 const visitar=(n,ruta=[])=>{
  const ns=Array.from(G.numerosNodo(n));
  assert.deepEqual(ns,r.articulos.filter(a=>ruta.every((t,i)=>a.ubicacion[i]===t)).map(a=>a.n),f+': intervalo real');
  for(const h of n.hijos)visitar(h,[...ruta,h.titulo]);
 };
 visitar(arbol);
 const titulos=[];const estructura=(xs)=>{for(const n of xs||[]){titulos.push(n.titulo);estructura(n.hijos);}};estructura(r.estructura);
 const reales=[];const arbolTitulos=n=>{for(const h of n.hijos){reales.push(h.titulo);arbolTitulos(h);}};arbolTitulos(arbol);
 assert.deepEqual(reales,titulos,f+': todos los encabezados de estructura en orden');
 const viejo=n=>[...n.hijos.flatMap(viejo),...n.articulos];
 if(JSON.stringify(viejo(arbol))!==JSON.stringify(r.articulos.map(a=>a.n)))afectados.push(f);
 for(const a of r.articulos)assert.equal(G.destinoArticulo(r,'art '+a.n),G.anclaArticulo(a.n));
 if(r.transitorios.length)assert.equal(G.destinoArticulo(r,'transitorio 1'),'transitorio-'+r.transitorios[0].n);
}
const p={formato:'sate-investigacion',version:1,nombre:'Prueba ficticia',proposito:'solicitud',autor:'',etiquetas:[],marcadores:[]};
G.alternarMarcador(p,'rge','52');G.alternarMarcador(p,'rge','48');G.alternarMarcador(p,'cgc','45','II');
assert.equal(p.marcadores.length,3);
const grupos=G.fundamentoInv(p,{rge:{titulo:'RGE'},cgc:{titulo:'CGC'}});
assert.deepEqual(JSON.parse(JSON.stringify(grupos)),[{titulo:'CGC',numeros:['45']},{titulo:'RGE',numeros:['48','52']}]);
G.alternarMarcador(p,'rge','52');assert.equal(p.marcadores.length,2);G.alternarMarcador(p,'rge','52');
p.marcadores[0].anotaciones.push({inicio:0,fin:5,literal:'Texto',nota:'Nota ficticia',etiqueta:'plazo'});
const antes=createHash('sha256').update(readFileSync('data/reglamentos/rge.json')).digest('hex');
const textos=['Texto ','oficial de prueba'], anotacion={inicio:3,fin:10,literal:'to ofic'};
assert.deepEqual(JSON.parse(JSON.stringify(G.segmentosAnotacion(textos,anotacion))),{inicio:[0,3],fin:[1,4]});
assert.deepEqual(JSON.parse(JSON.stringify(G.segmentosAnotacion(['Tex','to oficial de prueba'],anotacion))),{inicio:[1,0],fin:[1,7]});
assert.equal(G.segmentosAnotacion(['Texto modificado'],anotacion),null,'un cambio de texto invalida el rango');
assert.equal(textos.join(''),'Texto oficial de prueba','recalcular no reescribe texto');
assert.deepEqual(JSON.parse(JSON.stringify(await G.decodificarInv(await G.codificarInv(p)))),JSON.parse(JSON.stringify(p)));
assert.equal(createHash('sha256').update(readFileSync('data/reglamentos/rge.json')).digest('hex'),antes);
for(const mal of [{...p,version:2},{...p,nombre:'<script>'},{...p,marcadores:[{...p.marcadores[0],anotaciones:[{inicio:-1,fin:3,literal:'abc',nota:'',etiqueta:'favor'}]}]}])assert.throws(()=>G.validarInvestigacion(mal));
await assert.rejects(()=>G.decodificarInv('!invalid'));
const css=readFileSync('web/sate/guia.css','utf8');
const tokens=readFileSync('vendor/ipn-comun/dist/tokens.css','utf8')+readFileSync('web/sate/componentes.css','utf8')+readFileSync('web/sate/encabezado.css','utf8');
const investigacionCss=css.slice(css.indexOf('/* Investigación:'));
for(const [,token] of investigacionCss.matchAll(/var\((--ipn-[\w-]+)\)/g))assert.ok(tokens.includes(token+':'),token+' existe en ambos temas por herencia');
for(const ancho of [1300,1024,768,375]){
 assert.ok(ancho>768.98?investigacionCss.includes('min-width:0'):investigacionCss.includes('max-height:50dvh'));
}
assert.match(investigacionCss,/focus-visible/);
assert.match(investigacionCss,/::highlight\(sate-inv-plazo\)/);
console.log('OK investigación: índice/estructura/intervalos, marcadores, agrupación, compresión, validación, huella. Orden previo afectado: '+afectados.join(', '));
