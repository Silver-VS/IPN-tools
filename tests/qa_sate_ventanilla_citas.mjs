// Integración local del enlace por clave y el lector literal. Sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer=p=>readFileSync(p,'utf8');
const config=JSON.parse(leer('data/sate.json'));
const compilado=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
assert.deepEqual(compilado.citasVentanilla,config.citasVentanilla);
for(const ancho of [1300,1024,768,375])for(const oscuro of [false,true]){
  const {document,Elemento,Evento}=crearEntorno();
  document.contains=n=>document.documentElement.contains(n);
  Object.defineProperty(Elemento.prototype,'open',{get(){return this.hasAttribute('open')},set(v){if(v)this.setAttribute('open','');else this.removeAttribute('open')}});
  Object.defineProperty(Elemento.prototype,'offsetParent',{get(){return document.body}});
  const c=vm.createContext({document,console,setTimeout,clearTimeout,innerWidth:ancho,addEventListener(){},removeEventListener(){},
    matchMedia:q=>({matches:q.includes('dark')?oscuro:ancho<=599}),
    SATE_CONFIG:config,SATE_UNIDAD:'upiita',
    SATE:{texto:(k,v={})=>(compilado.textos[k]||k).replace(/\{(\w+)\}/g,(_,n)=>v[n]??''),
      pestana(){},json:async p=>JSON.parse(leer(p.includes('/reglamentos/')?'data/reglamentos/'+p.split('/').pop():'data/guia/comun.json'))}});
  vm.runInContext('window=globalThis',c);
  for(const f of ['componentes','tramites','guia'])vm.runInContext(leer('web/sate/'+f+'.js'),c);
  for(const [clave,refs] of Object.entries(config.citasVentanilla)){
    const nodo=document.createElement('div');document.body.appendChild(nodo);
    const etiqueta=clave.startsWith('dictamen.')?leer('contenido/textos/es.toml').match(new RegExp('^'+clave.split('.')[1]+' = "([^"]+)"','m'))?.[1]:undefined;
    c.SateTramites.citas(nodo,clave,etiqueta);
    const botones=nodo.querySelectorAll('button');assert.equal(botones.length,refs.length);
    for(let i=0;i<refs.length;i++){
      const [doc,n]=refs[i],b=botones[i];
      if(clave==='dictamen.fund_e1'&&n==='57')assert.match(b.textContent,/fracc\. III y VI/,'Conserva ambas fracciones en el chip del artículo 57');
      if(clave==='dictamen.fund_e3')assert.match(b.textContent,/último párrafo/);
      if(clave==='sate.baja.aviso_temporal_2')assert.match(b.textContent,/fracciones I y II/);
      if(clave==='sate.baja.aviso_definitiva_3')assert.match(b.textContent,/fracción I/);
      assert.equal(b.getAttribute('aria-haspopup'),'dialog');b.focus();await b.onclick();
      const modal=document.querySelector('dialog');assert.ok(modal.open);
      assert.equal(modal.getAttribute('aria-labelledby'),'sate-modal-titulo');
      const reg=JSON.parse(leer('data/reglamentos/'+doc+'.json'));
      const a=reg.articulos.find(a=>String(a.n)===n);
      if(a)assert.equal(modal.querySelector('.guia-articulo-literal').textContent,a.texto);
      else assert.ok(modal.querySelector('[role="status"]'),'Documento sin texto: aviso explícito');
      const enlace=modal.querySelector('.guia-articulo a');
      assert.ok(enlace.getAttribute('href').endsWith('/art-'+n));
      const cerrar=modal.querySelector('.sate-modal__x');
      const enlaces=modal.querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex]:not([tabindex="-1"])');
      enlaces.at(-1).focus();modal.dispatchEvent(new Evento('keydown',{key:'Tab'}));assert.equal(document.activeElement,cerrar);
      modal.dispatchEvent(new Evento('keydown',{key:'Tab',shiftKey:true}));assert.equal(document.activeElement,enlaces.at(-1));
      modal.dispatchEvent(new Evento('cancel'));assert.ok(!modal.open);assert.equal(document.activeElement,b);
    }
  }
}
const css=leer('web/sate/componentes.css');
assert.match(css,/sate-modal\.sate-modal--lectura\{[^}]*height:100dvh;[^}]*border-radius:0;animation:none/);
console.log('Ventanilla: claves, literalidad, foco y cierre DOM en 1300/1024/768/375, claro y oscuro OK');
