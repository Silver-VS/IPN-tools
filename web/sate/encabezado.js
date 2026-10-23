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
  const nav=h.querySelector('.sate-navegacion'),tabs=h.querySelector('.sate-enlaces');
  if(!nav||!tabs)return;
  const mq=matchMedia('(min-width:768px)'),bar=document.createElement('div');
  bar.className='sate-barra-flotante';bar.hidden=true;
  const marca=document.createElement('span');marca.className='sate-barra-marca';marca.textContent='SATE';
  const copia=document.createElement('nav');copia.setAttribute('aria-label',nav.getAttribute('aria-label')||'');
  const enlaces=tabs.cloneNode(true);enlaces.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));copia.append(enlaces);
  const acciones=document.createElement('div');acciones.className='sate-barra-acciones';
  for(const id of ['sate-ayuda-recorrido','theme-btn']){
    const original=document.getElementById(id);if(!original)continue;
    const boton=original.cloneNode(true);boton.removeAttribute('id');boton.addEventListener('click',()=>original.click());acciones.append(boton);
  }
  bar.append(marca,copia,acciones);h.after(bar);
  const sync=()=>{bar.hidden=!(mq.matches&&nav.getBoundingClientRect().bottom<0)};
  let pendiente=false;
  const actualizar=()=>{if(pendiente)return;pendiente=true;requestAnimationFrame(()=>{pendiente=false;sync()})};
  addEventListener('scroll',actualizar,{passive:true});addEventListener('resize',actualizar);mq.addEventListener('change',sync);
  bar.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');if(!a)return;
    bar.querySelectorAll('a[aria-current=page]').forEach(x=>x.removeAttribute('aria-current'));a.setAttribute('aria-current','page');
  });
  sync();
})();
