// Selección y resalte del mapa: alterna atributos/clases sobre el DOM existente.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
const leer=f=>readFileSync(f,'utf8');
const mapa=leer('web/sate/mapa.js'), nucleo=leer('web/sate/nucleo.js'), componentes=leer('web/sate/componentes.js');
const cascaron=leer('web/sate/cascaron.html'), fuenteInicio=leer('web/sate/inicio.js'), css=leer('web/sate/componentes.css');
assert.match(cascaron,/\.mapwrap\{[^}]*overflow-x:auto;overflow-y:hidden/,'el mapa solo desplaza horizontalmente');
assert.doesNotMatch(cascaron,/\.mapwrap\{[^}]*max-height:[^}]*vh/,'el mapa crece al alto de su contenido');
assert.doesNotMatch(cascaron,/\.areas\{position:sticky/,'el encabezado de columnas no tapa niveles al inicio');
assert.doesNotMatch(css,/\.mapwrap\{padding-bottom:var\(--sate-plan-alto/,'la caja del mapa no reserva espacio vacío bajo el último nivel (dueño 2026-10-23)');
assert.match(css,/#v-tray\{padding-bottom:calc\(var\(--sate-plan-alto/,'la reserva de la bandeja flotante va al final de la página');
assert.match(fuenteInicio,/new ResizeObserver\(\(\)=>\{\s*document\.documentElement\.style\.setProperty\('--sate-plan-alto',Math\.ceil\(bandeja\.getBoundingClientRect\(\)\.height\)\+'px'\)/,'la reserva sigue el alto real de la bandeja');
assert.match(mapa,/\$\('#mapwrap'\)\.scrollTop=0/,'cada render inicia el nivel 1 bajo el encabezado');
assert.match(cascaron,/\.box\.done\{opacity:\.45;color:var\(--ipn-tenue\);background:var\(--ipn-superficie\)/,'acreditadas deslavadas y neutras, sin verde (dueño 2026-10-23)');
assert.match(fuenteInicio,/envoltura\.appendChild\(selectorPlan\);barra\.insertBefore\(envoltura,botonMapa\.nextSibling\)/,'la barra flotante reutiliza el selector del mapa');
assert.match(fuenteInicio,/destino\.after\(selectorPlan\)/,'al salir del mapa el selector vuelve a su posición original');
assert.match(css,/\.sate-barra__plan #plan-periodos button\{min-width:0;min-height:var\(--ipn-control-alto\)/,'los controles del selector mantienen un objetivo táctil suficiente');
assert.match(mapa,/const H=Y\(bands\.length\?bands\[bands\.length-1\]\[3\]:L\.h\)/,'el SVG termina al final de la última banda curricular');

// --- DOM mínimo con classList y atributos ---
const nodo=(clase,data={},attrs={})=>{
  const n={dataset:data,attrs:{...attrs},cls:new Set(clase.split(' ').filter(Boolean)),
    classList:{remove:(...x)=>x.forEach(y=>n.cls.delete(y)),add:(...x)=>x.forEach(y=>n.cls.add(y)),contains:x=>n.cls.has(x)},
    setAttribute(k,v){n.attrs[k]=v},getAttribute(k){return n.attrs[k]??null},querySelector(){return null}};
  return n;
};
const cajas=[nodo('box pend',{box:'A'}),nodo('box pend',{box:'B'}),nodo('box pend',{box:'C'}),nodo('box pend',{box:'D'}),nodo('box slot')];
const cajasIniciales=[...cajas];
const aristas=[nodo('edge',{a:'A',b:'B'},{'marker-end':'url(#ah)'}),nodo('edge',{a:'B',b:'C'},{'marker-end':'url(#ah)'}),
  nodo('edge',{a:'A',b:'D'},{'marker-end':'url(#ah)'}),nodo('edge lejana',{a:'A',b:'C'},{'marker-end':'url(#ah)'}),nodo('edge past',{a:'D',b:'D'},{'marker-end':'url(#ah)'})];
aristas[4].dataset.past='1';
const mapEl={childElementCount:5,querySelectorAll:s=>s==='.box'?cajas:s==='.edge'?aristas:[]};
let llamadas={renderMap:0,renderInsp:0,renderList:0,toggleBox:0},rafs=[],eventos={},elecciones=new Set();
const S={mapHover:null,reqHover:null};
const c=vm.createContext({S,SATE:{pestana(){},texto:()=>''},PLAN_DOS_PERIODOS:false,planEtiqueta:()=>'',planElegidas:()=>elecciones,planAsignado:k=>elecciones.has(k)?0:null,tr:()=>({done:[]}),ancestors:ks=>new Set([...ks].filter(k=>k==='B').map(()=> 'A')),
  document:{addEventListener:(k,f)=>eventos[k]=f,querySelector:()=>({focus(){}})},CSS:{escape:String},toggleBox:k=>{llamadas.toggleBox++;elecciones.has(k)?elecciones.delete(k):elecciones.add(k);c.actualizarMapaPlan()},addEventListener(){},$:()=>mapEl,requestAnimationFrame:f=>{rafs.push(f);return rafs.length},
  prereqs:()=>({B:['A'],C:['B'],D:['A']}),conSim:(on,f)=>f(),conPlan:f=>f(),usaSim:()=>false,mview:()=>'mapa',
  renderMap:()=>{llamadas.renderMap++},renderInsp:()=>{llamadas.renderInsp++},renderList:()=>{llamadas.renderList++},console});
vm.createContext(c);
vm.runInContext('window=globalThis',c);
vm.runInContext(componentes,c);
vm.runInContext(mapa,c);c.renderMap=()=>{llamadas.renderMap++};c.renderInsp=()=>{llamadas.renderInsp++};c.renderList=()=>{llamadas.renderList++};

// 1. Cálculo del resaltado
const hot=vm.runInContext("calcHot('B',null,prereqs())",c);
assert.deepEqual([...hot].sort(),['A','B','C']);
assert.deepEqual([...hot.pre],['A']);assert.deepEqual([...hot.post],['C']);
assert.equal(vm.runInContext("calcHot(null,null,prereqs())",c),null);
const hr=vm.runInContext("calcHot('B',['C','D'],prereqs())",c);
assert.deepEqual([...hr].sort(),['B','C','D']);

// 2. Pasar el cursor: clases aplicadas y retiradas, sin renderMap
c.S.mapHover='B';
vm.runInContext('pedirResalte();pedirResalte()',c);
assert.equal(rafs.length,1,'los eventos se agrupan en un solo cuadro');
rafs.shift()();
assert.equal(llamadas.renderMap,0,'pasar el cursor no redibuja el mapa');
assert.equal(llamadas.renderInsp,1);
assert.equal(cajas.length,cajasIniciales.length,'seleccionar conserva el número de cajas');
cajas.forEach((n,i)=>assert.strictEqual(n,cajasIniciales[i],'seleccionar conserva cada nodo de materia'));
const cl=n=>[...n.cls].sort().join(' ');
assert.equal(cl(cajas[0]),'box hpre pend'.split(' ').sort().join(' '));
assert.equal(cl(cajas[1]),'box hot pend'.split(' ').sort().join(' '));
assert.equal(cl(cajas[2]),'box hpost pend'.split(' ').sort().join(' '));
assert.equal(cl(cajas[3]),'box dim pend'.split(' ').sort().join(' '));
assert.ok(cajas[4].cls.has('dim'),'las casillas de optativa también se atenúan');
assert.equal(cl(aristas[0]),'edge hot pre');assert.equal(aristas[0].attrs['marker-end'],'url(#ahpre)');
assert.equal(cl(aristas[1]),'edge hot post');assert.equal(aristas[1].attrs['marker-end'],'url(#ahpost)');
assert.equal(cl(aristas[2]),'dim edge'.split(' ').sort().join(' '));assert.equal(aristas[2].attrs['marker-end'],'url(#ah)');
assert.ok(!aristas[4].cls.has('past'),'«past» solo cuando no hay resaltado');

// 3. Idéntico al dibujo: las clases de cajas y flechas salen de las mismas funciones que usa el dibujo
const UI=c.SateUI;
for(const k of ['A','B','C','D'])assert.equal(UI.resalteCaja(hot,k,'B',null).trim().split(' ').filter(Boolean).every(x=>cajas[['A','B','C','D'].indexOf(k)].cls.has(x)),true);
assert.equal(UI.resalteCaja(null,'A',null,null),'');
assert.equal(UI.resalteCaja(hr,'B','B',['C','D']),' hpre');
assert.equal(vm.runInContext("resalteArista(null,'A','B',null).cls",c),'');

// 4. Interacción fijada: clic selecciona, clic vacío y Esc limpian; no hay botón Cerrar.
assert.match(nucleo,/if\(bx\)\{S\.mapHover=bx\.dataset\.box;S\.mapFocus=true;S\.reqHover=null;resaltarMapa\(\);toggleBox\(bx\.dataset\.box\);return\}/,'el clic enfoca antes de alternar la materia en el plan');
assert.match(nucleo,/if\(S\.mapFocus\|\|S\.reqHover\)\{S\.mapFocus=false;S\.mapHover=null;S\.reqHover=null;resaltarMapa\(\)\}/,'el clic vacío retira el resalte');
assert.match(nucleo,/e\.key==='Escape'.*S\.mapFocus=false;S\.mapHover=null;S\.reqHover=null;resaltarMapa\(\)/,'Esc retira el resalte');
assert.doesNotMatch(nucleo,/data-fclose|>Cerrar<\/button>/,'el inspector ya no ofrece Cerrar para retirar el resalte');
assert.match(nucleo,/if\(bx&&\(e\.key==='Enter'\|\|e\.key===' '\)\)\{e\.preventDefault\(\);S\.mapHover=bx\.dataset\.box;S\.mapFocus=true;S\.reqHover=null;resaltarMapa\(\);toggleBox\(bx\.dataset\.box\)/,'Enter y Espacio seleccionan y ejecutan la acción de clic');

const inicioEventos=nucleo.indexOf('/* ---------- eventos ---------- */'),inicioClick=nucleo.indexOf("document.addEventListener('click',e=>{",inicioEventos),inicioTeclado=nucleo.indexOf("document.addEventListener('keydown',e=>{const bx=",inicioClick),finTeclado=nucleo.indexOf("document.addEventListener('change',e=>",inicioTeclado);
vm.runInContext(nucleo.slice(inicioClick,inicioTeclado)+nucleo.slice(inicioTeclado,finTeclado),c);
const antesClick=cajas[1],targetBox={closest:s=>s==='[data-box]'?{dataset:{box:'B'}}:null},targetVacio={closest:()=>null};
eventos.click({target:targetBox});assert.equal(c.S.mapHover,'B');assert.equal(c.S.mapFocus,true);assert.ok(cajas[1].cls.has('hot'));assert.ok(cajas[1].cls.has('want'));assert.ok(cajas[0].cls.has('req'));assert.equal(llamadas.toggleBox,1);
assert.strictEqual(cajas[1],antesClick,'el clic conserva el mismo nodo de la materia');assert.equal(mapEl.childElementCount,5,'el clic no recrea los nodos del mapa');
eventos.click({target:targetVacio});assert.equal(c.S.mapHover,null);assert.equal(c.S.mapFocus,false);assert.ok(!cajas[1].cls.has('hot'),'el clic vacío limpia el resalte');
c.S.mapHover='B';c.S.mapFocus=true;eventos.keydown({key:'Escape',target:targetVacio,preventDefault(){}});assert.equal(c.S.mapHover,null);assert.equal(c.S.mapFocus,false);assert.ok(!cajas[1].cls.has('hot'),'Esc limpia el resalte');

// 5. Retirar el cursor: vuelve al estado base (con «past» restituida)
c.S.mapHover=null;vm.runInContext('pedirResalte()',c);rafs.shift()();
assert.equal(llamadas.renderMap,0);
for(const n of cajas)assert.ok(![...n.cls].some(x=>['hot','hpre','hpost','dim'].includes(x)),'caja limpia');
for(const n of aristas)assert.ok(![...n.cls].some(x=>['hot','pre','post','dim'].includes(x)),'flecha limpia');
assert.ok(aristas[4].cls.has('past'));
assert.ok(aristas.every(n=>n.attrs['marker-end']==='url(#ah)'));
assert.ok(aristas[3].cls.has('lejana'),'la flecha lejana conserva su clase (CSS la oculta sin resaltado)');

// 6. Resaltado desde la lista de requisitos (reqHover)
c.S.mapHover='B';c.S.reqHover=['C','D'];vm.runInContext('resaltarMapa()',c);
assert.ok(cajas[1].cls.has('hpre')&&cajas[2].cls.has('hpost')&&cajas[3].cls.has('hpost')&&cajas[0].cls.has('dim'));
assert.equal(llamadas.renderMap,0);

// 7. Mapa sin dibujar: dibujo completo
mapEl.childElementCount=0;vm.runInContext('resaltarMapa()',c);
assert.equal(llamadas.renderMap,1);

// 8. Los manejadores de cursor y teclado ya no llaman a renderMap
const manejadores=nucleo.split('\n').filter(l=>/pointerover|pointerleave|focusin|focusout|salirRequisitos/.test(l)&&/mapHover|reqHover/.test(l));
assert.ok(manejadores.length>=6,'manejadores encontrados');
for(const l of manejadores)assert.ok(!/renderMap\(\)/.test(l),'sin renderMap: '+l.slice(0,90));
assert.ok(mapa.includes('.edge.lejana')||leer('web/horarios.template.html').includes('.edge.lejana{display:none}'));

// Medición en una maqueta mayor que las trayectorias normales: incluye caja, arista y propagación transitiva.
const prereqGrande={};
for(let i=1;i<320;i++)prereqGrande[`M${i}`]=[`M${i-1}`];
cajas.splice(0,cajas.length,...Array.from({length:320},(_,i)=>nodo('box pend',{box:`M${i}`})));
aristas.splice(0,aristas.length,...Array.from({length:1280},(_,i)=>{const b=i%319+1;return nodo('edge',{a:`M${b-1}`,b:`M${b}`},{'marker-end':'url(#ah)'})}));
c.prereqs=()=>prereqGrande;c.S.mapHover='M160';mapEl.childElementCount=cajas.length+aristas.length;
const inicio=performance.now();vm.runInContext('resaltarMapa()',c);const ms=performance.now()-inicio;
assert.ok(ms<50,`resalte en mapa de 320 materias y 1 280 líneas: ${ms.toFixed(2)} ms`);
console.log(`qa_sate_mapa_hover: ok (320 materias, 1 280 líneas: ${ms.toFixed(2)} ms)`);
