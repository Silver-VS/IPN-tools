// Diseño §1–§3a: componentes y núcleo en memoria, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=f=>readFileSync(f,'utf8');
const html=leer('web/dist/sate/index.html');
const config=JSON.parse(html.match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
assert.equal(config.textos['sate.pestana.horarios.titulo'],'Horarios de clase');
assert.equal(config.textos['sate.pestana.calendario.titulo'],'Calendario escolar');
assert.equal(config.textos['sate.pestana.horarios.corto'],'Horarios');
assert.equal(config.textos['sate.pestana.calendario.corto'],'Calendario');
assert.match(html,/<html lang="es" data-pestanas="v1">/);
const arranque=leer('web/sate/inicio.js').split('  let api, actual')[0]+'})();';
for(const [search,base,esperada] of [['','v3','v3'],['','v1','v1'],['?pestanas=v1','v3','v1'],['?pestanas=v3','v1','v3'],['?pestanas=v2','v3','v3']]){
  const attrs={'data-pestanas':base};
  vm.runInNewContext(arranque,{SATE_CONFIG:config,URLSearchParams,location:{search},document:{querySelector:()=>({setAttribute(k,v){attrs[k]=v}})}});
  assert.equal(attrs['data-pestanas'],esperada,`Variante ${search} desde ${base}`);
}
let document;
class Nodo{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.dataset={};this.eventos={}}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='data-id')this.dataset.id=v}
  getAttribute(k){return this.attrs[k]??null}removeAttribute(k){delete this.attrs[k]}
  appendChild(n){this.children.push(n);return n}addEventListener(k,f){this.eventos[k]=f}
  focus(){document.activeElement=this}
}
document={createElement:tag=>new Nodo(tag),createTextNode:text=>({textContent:text}),getElementById(){return null},addEventListener(){}};
const c=vm.createContext({document,addEventListener(){}});vm.runInContext('window=globalThis',c);
vm.runInContext(leer('web/dist/sate/componentes.js'),c);
const items=config.unidades.upiita.pestanas.map(id=>({id,texto:config.textos['sate.pestana.'+id+'.titulo'],corto:config.textos['sate.pestana.'+id+'.corto'],grupo:config.unidades.upiita.grupos.findIndex(g=>g.includes(id))}));
let destino;
const tabs=c.SateUI.pestanas({items,activa:'trayectoria',alCambiar:id=>destino=id});
const barra=c.SateUI.barraInferior({items:items.map(it=>({...it,corto:null,texto:it.corto,titulo:it.texto})),activa:'trayectoria',alElegir:id=>destino=id});
for(const [i,b] of tabs.children.entries()){
  assert.equal(b.getAttribute('role'),'tab');assert.equal(b.getAttribute('type'),'button');
  assert.equal(b.getAttribute('data-id'),items[i].id);
  assert.equal(b.children[0].getAttribute('aria-hidden'),'true');
  assert.match(b.children[0].innerHTML,/<svg.*stroke="currentColor"/);
  assert.equal(b.children[1].textContent,items[i].texto);
  assert.equal(b.children[2].textContent,items[i].corto);
  assert.equal(b.getAttribute('aria-label'),items[i].texto);
  assert.equal(barra.children[i].getAttribute('aria-label'),items[i].texto);
  assert.match(barra.children[i].children[0].innerHTML,/<svg/);
}
assert.equal(tabs.children.filter(b=>b.className.includes('sate-grupo-inicio')).length,1);
assert.equal(barra.children.filter(b=>b.className.includes('sate-grupo-inicio')).length,1);
tabs.children[0].eventos.keydown({key:'End',preventDefault(){}});
assert.equal(destino,'calendario');assert.equal(document.activeElement,tabs.children.at(-1));
tabs.children.at(-1).eventos.keydown({key:'ArrowRight',preventDefault(){}});
assert.equal(destino,'trayectoria');assert.equal(document.activeElement,tabs.children[0]);
tabs.children[0].eventos.keydown({key:'ArrowLeft',preventDefault(){}});
assert.equal(destino,'calendario');assert.equal(document.activeElement,tabs.children.at(-1));
tabs.children.at(-1).eventos.keydown({key:'Home',preventDefault(){}});
assert.equal(destino,'trayectoria');assert.equal(document.activeElement,tabs.children[0]);
const mapa=tabs.children.find(b=>b.getAttribute('data-id')==='mapa');
mapa.eventos.click();assert.equal(destino,'mapa');
assert.equal(mapa.getAttribute('aria-selected'),'true');assert.equal(mapa.tabIndex,0);
const horarios=barra.children.find(b=>b.getAttribute('data-id')==='horarios');
horarios.eventos.click();assert.equal(destino,'horarios');
assert.equal(horarios.getAttribute('aria-current'),'page');
assert.deepEqual(config.unidades.upiita.tramites,[]);
for(const nav of [tabs,barra])assert.ok(!nav.children.some(b=>b.getAttribute('data-id')==='tramites'));
vm.runInContext(leer('web/dist/sate/rutas.js'),c);
for(const hash of ['#/upiita/tramites','#/upiita/tramites/ets','#/upiita/tramites/dictamen?origen=viejo']){
  const ruta=c.SateRutas.ruta(hash,'upiita',config.unidades);
  assert.equal(ruta.pestana,'trayectoria');assert.equal(ruta.tramite,null);
  assert.equal(ruta.hash,'#/upiita/trayectoria'+(hash.includes('?')?'?origen=viejo':''));
}
const css=leer('web/sate/componentes.css');
assert.match(css,/\[data-pestanas=v3\] \.sate-pestana__icono\{display:none/);
assert.match(css,/\[data-pestanas\] \.sate-barra \.sate-pestana__icono\{display:inline-flex/);
assert.match(css,/aria-selected=true\]::after.*background:var\(--ipn-acento\)/);
assert.match(css,/\.sate-grupo-inicio::before.*width:1px/);
assert.match(css,/\.sate-pestana:focus-visible,\.sate-barra__btn:focus-visible,\.trayectoria-minimapa button:focus-visible/);
assert.ok(css.includes('.trayectoria-resumen{grid-column:1 / -1}'));   // resumen a todo el ancho
assert.ok(css.includes('.trayectoria-minimapa{grid-column:2;grid-row:2 / span 4;align-self:stretch'));   // minimapa a la derecha, misma altura que el contenido
assert.match(css,/@media\(max-width:720px\).*\.trayectoria-minimapa\{grid-column:1;grid-row:2/);
// Contraste de texto AA y de puntos/foco ≥3:1 con los tokens efectivos de ambos temas.
const fuente=leer('web/sate/cascaron.html');
const temas=[...fuente.matchAll(/(?:^:root|:root\[data-theme="dark"\]|:root:not\(\[data-theme="light"\]\))\{([^}]+)\}/gm)].map(m=>Object.fromEntries([...m[1].matchAll(/--([\w-]+):(#[\da-f]+);/g)].map(x=>[x[1],x[2]])));
assert.equal(temas.length,3);
const lum=hex=>hex.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const contraste=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
for(const tema of temas)for(const fondo of ['surface','sunken']){
  for(const frente of ['fg','muted','accent'])assert.ok(contraste(tema[frente],tema[fondo])>=4.5,`${frente}/${fondo}: AA`);
  for(const frente of ['ok','accent','muted','ipn-reprobada','ipn-desfasada'])assert.ok(contraste(tema[frente],tema[fondo])>=3,`${frente}/${fondo}: puntos y foco`);
}
const nucleo=leer('web/sate/nucleo.js');
const funcion=nucleo.slice(nucleo.indexOf('function minimapaCurricular('),nucleo.indexOf('// modo personal: materias'));
const estados=['done','curso','rest lock','fail','late fail','late'];
const L={w:300,h:60,boxes:estados.map((st,i)=>[i*40,0,30,40,String(i)]).concat([[240,0,30,40,null,'Optativa']]),edges:[]};
let personal=true;
const ctx=vm.createContext({MAP:()=>({layout:L}),isPersonal:()=>personal,slotFill:()=>new Map(),rowBands:()=>[[1,20,0,60]],statusOf:k=>estados[+k],isElec:()=>false,esc:s=>s,
  cur:()=>({'0':['Materia',0,1,'O'],'1':['Otra',0,2,'O']}),SATE:{texto:(k,v)=>config.textos[k].replace(/\{n, plural, one \{([^{}]*)\} other \{([^{}]*)\}\}/,(m,uno,otros)=>(v.n===1?uno:otros).replaceAll('#',String(v.n))).replace('{n}',v.n)}});
vm.runInContext(funcion,ctx);
const mini=ctx.minimapaCurricular();
assert.deepEqual(JSON.parse(JSON.stringify(mini.cnt)),{done:1,curso:1,pend:2,fail:1,late:2});
assert.equal((mini.svg.match(/data-estado="late"/g)||[]).length,2,'Desfase tiene prioridad sobre reprobación');
assert.match(mini.svg,/data-estado="fail"[^>]+fill="var\(--ipn-reprobada\)"/);
assert.match(mini.svg,/data-estado="late"[^>]+fill="var\(--ipn-desfasada\)"/);
assert.match(mini.leyenda,/2 desfasadas/);
assert.match(ctx.minimapaCurricular(null).svg,/<circle/,'También hay minimapa sin trazado PDF');
personal=false;assert.equal(ctx.minimapaCurricular(),null);
assert.ok(!leer('web/sate/mapa.js').includes('function slotFill('),'Optativas se resuelven una sola vez en núcleo');
assert.ok(!leer('web/sate/mapa.js').includes('<circle'),'Mapa reutiliza los puntos del núcleo');
console.log('Diseño §1–§3a: nombres, variantes/URL, SVG, grupos, teclado, barra móvil, foco, contraste AA y cinco estados compartidos. OK.');
