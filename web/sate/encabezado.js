(()=>{
  const h=document.querySelector('.sate-encabezado');
  if(!h)return;
  const menu=h.querySelector('.sate-menu');
  if(menu){
    const mqMenu=matchMedia('(max-width:767px)');
    const adaptar=()=>{menu.open=!mqMenu.matches};
    adaptar();
    mqMenu.addEventListener('change',adaptar);
    h.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&mqMenu.matches){menu.open=false;menu.querySelector('summary').focus()}
    });
  }
  // Grupos trae las pestañas dentro del encabezado (.sate-enlaces); SATE las tiene aparte (.sate-pestanas).
  // SATE crea sus pestañas después de este script: la barra se arma cuando ya existen.
  const armar=()=>{
  const enlacesEnc=h.querySelector('.sate-enlaces'),pestanas=enlacesEnc?null:document.querySelector('.sate-pestanas');
  const nav=enlacesEnc?h.querySelector('.sate-navegacion'):pestanas,tabs=enlacesEnc||pestanas;
  if(!nav||!tabs)return;
  const mq=matchMedia('(min-width:768px)'),bar=document.createElement('div');
  bar.className='sate-barra-flotante';bar.hidden=true;
  const marca=document.createElement('span');marca.className='sate-barra-marca';marca.textContent='SATE';
  const copia=document.createElement('nav');copia.setAttribute('aria-label',nav.getAttribute('aria-label')||'');
  const enlaces=tabs.cloneNode(true);if(pestanas)enlaces.removeAttribute('role');enlaces.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
  if(pestanas){
    // Los botones clonados pierden sus eventos: reenvían el clic a la pestaña original con el mismo data-id.
    enlaces.querySelectorAll('[role=tab]').forEach(x=>{x.removeAttribute('role');x.removeAttribute('aria-controls');x.removeAttribute('aria-selected');x.removeAttribute('tabindex')});
    enlaces.addEventListener('click',e=>{const x=e.target.closest('[data-id]');if(x)pestanas.querySelector('[data-id="'+x.dataset.id+'"]')?.click()});
    const marcar=()=>{const sel=pestanas.querySelector('[aria-selected=true]')?.dataset.id;enlaces.querySelectorAll('[data-id]').forEach(x=>x.dataset.id===sel?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current'))};
    new MutationObserver(marcar).observe(pestanas,{subtree:true,attributes:true,attributeFilter:['aria-selected']});marcar();
  }
  copia.append(enlaces);
  const acciones=document.createElement('div');acciones.className='sate-barra-acciones';
  for(const id of ['sate-ayuda-recorrido','theme-btn']){
    const original=document.getElementById(id);if(!original)continue;
    const boton=original.cloneNode(true);boton.removeAttribute('id');boton.addEventListener('click',()=>original.click());acciones.append(boton);
  }
  bar.append(marca,copia,acciones);h.after(bar);
  // La altura puede cambiar por fuentes, zoom o etiquetas; los sticky comparten el borde visible.
  const sync=()=>{
    bar.hidden=!(mq.matches&&nav.getBoundingClientRect().bottom<0);
    document.documentElement.style.setProperty('--sate-barra-alto',(bar.hidden?0:Math.ceil(bar.getBoundingClientRect().bottom))+'px');
  };
  let pendiente=false;
  const actualizar=()=>{if(pendiente)return;pendiente=true;requestAnimationFrame(()=>{pendiente=false;sync()})};
  addEventListener('scroll',actualizar,{passive:true});addEventListener('resize',actualizar);mq.addEventListener('change',sync);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(actualizar).observe(bar);
  bar.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');if(!a)return;
    bar.querySelectorAll('a[aria-current=page]').forEach(x=>x.removeAttribute('aria-current'));a.setAttribute('aria-current','page');
  });
  sync();
  };
  if(h.querySelector('.sate-enlaces')||document.querySelector('.sate-pestanas'))armar();
  else{const ob=new MutationObserver(()=>{if(document.querySelector('.sate-pestanas')){ob.disconnect();armar()}});ob.observe(document.body||document.documentElement,{childList:true,subtree:true})}
})();
