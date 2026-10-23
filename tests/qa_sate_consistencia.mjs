// Inventario de fuentes, sin navegador, red ni datos personales.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import vm from 'node:vm';

export function auditar(css, archivo) {
  const filas=[], errores=[];
  css=css.replace(/\/\*[\s\S]*?\*\//g,'');
  const sticky=new Set([...css.matchAll(/([^{}]+)\{([^{}]*position:\s*sticky[^{}]*)\}/g)].flatMap(m=>m[1].trim().split(',').map(s=>s.trim())));
  const botones=new Set([...css.matchAll(/([^{}]+)\{([^{}]*cursor:\s*pointer[^{}]*)\}/g)].flatMap(m=>m[1].split(',').map(s=>s.trim().match(/(?:^|[ >+~])([.#][\w-]+)(?:\[[^\]]+\])?$/)?.[1]).filter(Boolean)));
  for(const bloque of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector=bloque[1].trim(), cuerpo=bloque[2];
    const propiedades=Object.fromEntries([...cuerpo.matchAll(/([\w-]+)\s*:\s*([^;]+)(?:;|$)/g)].map(m=>[m[1],m[2].trim()]));
    const radio=propiedades['border-radius'];
    const boton=!/::|\binput\b/.test(selector) && (selector.split(',').some(s=>/(?:^|[ >+~])(?:button|\.[\w-]*btn[\w-]*|\.add|\.x|\.link)(?:[.:#\[][^ ]*)?$/.test(s.trim()) || [...botones].some(b=>s.trim()===b || (s.trim().startsWith(b) && /^[\[.:#][^ ]*$/.test(s.trim().slice(b.length))))) || propiedades.cursor==='pointer');
    if(boton && !selector.includes('.sate-termino') && !selector.includes('.sate-enlace-reglamento')) {   // enlaces dentro del texto: no alteran el renglón
      for(const propiedad of ['height','min-height','max-height']) {
        const valor=propiedades[propiedad]?.replace(/\s*!important$/,'');
        // Excepción: las barras de la línea de tiempo del calendario son marcas de datos (dueño: vista compacta), no botones de acción.
        if(/^\.calendario-ev(?:\[data-puntual=true\])?$/.test(selector)) continue;
        if(valor && !/^(?:auto|var\(--ipn-(?:control-alto|control-compacto|objetivo-tactil)\))$/.test(valor)) errores.push(`${archivo}: ${selector}: altura de botón ${propiedad} ${valor}`);
      }
    }
    for(const [propiedad,valor] of Object.entries(propiedades).filter(([p])=>/^border-(?:(?:top|bottom)-(?:left|right)-)?radius$/.test(p))) {
      if(!/^(?:0|var\(--ipn-radio(?:-pastilla|-circulo)?\))(?: (?:0|var\(--ipn-radio\)))*$/.test(valor)) errores.push(`${archivo}: ${selector}: ${propiedad} ${valor}`);
      if(valor==='var(--ipn-radio-pastilla)' && !/^(?:\.(?:tramite-estado|calendario-pildora|sate-chip|sel-area|chip|wchip|tag-rel|simchip|dpill|k-chip|eqv-f|an-tag)|\.guia-chips button)$/.test(selector)) errores.push(`${archivo}: ${selector}: pastilla fuera de filtros/estado`);
      if(valor==='var(--ipn-radio-circulo)' && !/^(?:\.tmr-paso|\.guia-etapa-num|\.guia-pasos li::before|\.sate-tarjeta-nav__icono|\.sate-chip__marca|\.sate-estado-dato|\.calendario-(?:ficha-punto|signo)|\.gd-estacion-punto|\.sel-area::before|\.tramite-(?:estado|guardado)::before|\.box\.curso::after|\.legend i\.l-curso::after|\.tgl-ui::after|\.cupos-interruptor-pista::after|\.cal-l::before|\.info|\.mm-leg i)$/.test(selector)) errores.push(`${archivo}: ${selector}: círculo fuera de pasos/íconos`);
    }
    if(propiedades.top && (propiedades.position==='sticky' || selector.split(',').some(s=>sticky.has(s.trim())) || /rgl-(?:encabezado|nivel)/.test(selector)) && !propiedades.top.includes('--sate-barra-alto')) errores.push(`${archivo}: ${selector}: sticky top ${propiedades.top}`);
    if(radio || /button|btn|chip|pestana|volver|calendario-(?:ficha|dia|item)/.test(selector) || propiedades.cursor==='pointer') filas.push({archivo,selector,radio,alto:propiedades.height,minimo:propiedades['min-height'],fondo:propiedades.background,borde:propiedades.border,padding:propiedades.padding,color:propiedades.color,fuente:propiedades['font-size'],peso:propiedades['font-weight']});
  }
  return {filas,errores};
}
// Comprueba que el guardia detecta regresiones y permite el sistema y stickies horizontales.
assert.equal(auditar('.x{border-radius:8px}', 'prueba').errores.length,1);
for(const alto of ['28px','38px','40px','44px','var(--ipn-esp-6)']) assert.equal(auditar(`button{min-height:${alto}}`,'prueba').errores.length,1);
assert.equal(auditar('.accion{cursor:pointer;height:28px}','prueba').errores.length,1);
assert.equal(auditar('.accion{cursor:pointer}.accion:hover{height:28px}','prueba').errores.length,1);
assert.equal(auditar('button{min-height:var(--ipn-control-compacto)}','prueba').errores.length,0);
assert.equal(auditar('.x{position:sticky;top:0}', 'prueba').errores.length,1);
assert.equal(auditar('.x{position:sticky;top:var(--ipn-esp-4)}', 'prueba').errores.length,1);
assert.equal(auditar('.x{position:sticky}.x{top:0}', 'prueba').errores.length,1);
assert.equal(auditar('.x{border-top-left-radius:8px}', 'prueba').errores.length,1);
assert.equal(auditar('.accion{border-radius:var(--ipn-radio-pastilla)}', 'prueba').errores.length,1);
assert.equal(auditar('.tarjeta{border-radius:var(--ipn-radio-circulo)}', 'prueba').errores.length,1);
assert.equal(auditar('.x{border-radius:var(--ipn-radio);position:sticky;top:calc(var(--sate-barra-alto) + var(--ipn-esp-4))}.y{position:sticky;left:0}', 'prueba').errores.length,0);
// Integración del encabezado: desplazamiento real, redimensionamiento y regreso a móvil.
{
  let bottom=10, alto=44, escritorio=true, resize;
  const eventos={}, valores={};
  const nodo=()=>({hidden:false,setAttribute(){},removeAttribute(){},append(){},addEventListener(){},querySelectorAll:()=>[],getBoundingClientRect:()=>({bottom:alto})});
  const tabs={...nodo(),cloneNode:nodo};
  const nav={...nodo(),getAttribute:()=>'',getBoundingClientRect:()=>({bottom})};
  const h={querySelector:s=>s==='.sate-enlaces'?tabs:s==='.sate-navegacion'?nav:null,after(){}};
  const mq={get matches(){return escritorio},addEventListener(k,fn){eventos.media=fn}};
  const document={querySelector:()=>h,getElementById:()=>null,createElement:nodo,documentElement:{style:{setProperty(k,v){valores[k]=v}}}};
  vm.runInNewContext(readFileSync('web/sate/encabezado.js','utf8'),{document,matchMedia:()=>mq,addEventListener(k,fn){eventos[k]=fn},requestAnimationFrame:fn=>fn(),ResizeObserver:class{constructor(fn){resize=fn}observe(){}}});
  assert.equal(valores['--sate-barra-alto'],'0px');
  bottom=-1;eventos.scroll();assert.equal(valores['--sate-barra-alto'],'44px');
  alto=68.2;resize();assert.equal(valores['--sate-barra-alto'],'69px');
  escritorio=false;eventos.media();assert.equal(valores['--sate-barra-alto'],'0px');
  escritorio=true;eventos.resize();assert.equal(valores['--sate-barra-alto'],'69px');
  bottom=10;eventos.scroll();assert.equal(valores['--sate-barra-alto'],'0px');
}
const archivos=[...readdirSync('web/sate').filter(f=>f.endsWith('.css')).map(f=>'web/sate/'+f),'web/sate/cascaron.html'];
const componentes=readFileSync('web/sate/componentes.css','utf8');
assert.match(componentes,/:root\{--ipn-control-compacto:32px\}/);
assert.match(componentes,/:is\(td,\.marks,\.maptools\) :is\(button,\.add\)\{min-height:var\(--ipn-control-compacto\)/);
assert.match(componentes,/@media\(max-width:767px\)\{:is\(td,\.marks,\.maptools\) :is\(button,\.add\)\{min-height:var\(--ipn-objetivo-tactil\);min-width:var\(--ipn-objetivo-tactil\)/);
assert.match(readFileSync('web/sate/encabezado.css','utf8'),/--ipn-control-alto:var\(--ipn-objetivo-tactil,44px\)/,'la altura común conserva el objetivo táctil');
const resultados=archivos.map(f=>auditar(f.endsWith('.html')?readFileSync(f,'utf8').match(/<style>([\s\S]*?)<\/style>/)[1]:readFileSync(f,'utf8'),f));
const filas=resultados.flatMap(r=>r.filas), errores=resultados.flatMap(r=>r.errores);
if(process.argv.includes('--inventario')) console.log(JSON.stringify({radios:[...new Set(filas.map(f=>f.radio).filter(Boolean))],alturas:[...new Set(filas.flatMap(f=>[f.alto,f.minimo]).filter(Boolean))],componentes:filas},null,2));
else console.log('Inventario SATE:',filas.length,'reglas;',JSON.stringify([...new Set(filas.map(f=>f.radio).filter(Boolean))]));
assert.deepEqual(errores,[],errores.join('\n'));
