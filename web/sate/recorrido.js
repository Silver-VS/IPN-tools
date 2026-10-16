/* Se descarga únicamente cuando el alumnado solicita el recorrido. */
(function(raiz){
  const tx=(k,v)=>SATE.texto('sate.recorrido.'+k,v);
  function variables(a){
    const obt=Number(a?.avance?.obtenidos),faltan=Number(a?.avance?.faltan),total=Number(a?.carga?.total)||obt+faltan;
    const avance=a?.avance?.obtenidos!=null&&Number.isFinite(obt)&&total>0?Math.round(obt/total*100)+' %':null;
    const n=new Set((a?.acreditadas||[]).filter(r=>r&&Number(r[1])>=6&&Number(r[1])<=10).map(r=>r[0])).size;
    return {avance,n};
  }
  function cumple(p,a){return p.condicion==='siempre'||p.condicion==='personal'&&!!a}
  function contenido(p,a,texto=tx){const v=variables(a);return texto(a&&p.personal&&(p.texto!=='trayectoria'||v.avance!=null)?p.personal:p.texto,v)}
  function siguiente(pasos,desde,direccion,existe){for(let i=desde;i>=0&&i<pasos.length;i+=direccion)if(existe(pasos[i]))return i;return -1}
  let activo=false;
  async function iniciar(){
    if(activo)return;
    activo=true;
    let ui,origen=document.activeElement,elemento,indice=-1,ocupado=false,cerrado=false;
    const salir=()=>{cerrado=true;activo=false;removeEventListener('resize',colocar);removeEventListener('scroll',colocar,true);ui?.elemento.remove();if(origen?.isConnected)origen.focus()};
    function colocar(){
      if(!elemento||!ui)return;
      const r=elemento.getBoundingClientRect(),limite=ui.tarjeta.getBoundingClientRect().top-12;
      const top=Math.max(8,Math.min(r.top,limite-44)),left=Math.max(8,r.left);
      Object.assign(ui.marco.style,{top:top+'px',left:left+'px',width:Math.max(0,Math.min(r.right,innerWidth-8)-left)+'px',height:Math.max(0,Math.min(r.bottom,limite)-top)+'px'});
    }
    try{
      const r=await fetch('recorrido.json');if(!r.ok)throw new Error('recorrido.json: HTTP '+r.status);
      const a=SATE.alumno?.(),cfg=SATE_CONFIG.unidades[SATE_UNIDAD];
      const pasos=(await r.json()).filter(p=>cfg.pestanas.includes(p.pestana)&&cumple(p,a));
      ui=SateUI.recorridoTarjeta(salir);
      const botones={};
      for(const k of ['anterior','siguiente','salir']){const b=document.createElement('button');b.type='button';b.className='sate-btn';b.textContent=tx(k);b.onclick=()=>k==='salir'?salir():mover(k==='anterior'?-1:1).catch(()=>SateUI.modal(tx('boton'),tx('error'),{pequeno:true}));ui.acciones.appendChild(b);botones[k]=b}
      async function mover(direccion){
        if(ocupado||cerrado)return;ocupado=true;let i=indice;
        try{
          while((i=siguiente(pasos,i+direccion,direccion,()=>true))!==-1){
            await SATE.visitar(pasos[i].pestana);if(cerrado)return;
            elemento=document.querySelector(pasos[i].selector);
            if(elemento&&!elemento.closest('[hidden]')&&elemento.getClientRects().length)break;
            console.debug('SATE: paso de recorrido omitido',{paso:i,selector:pasos[i].selector});
          }
          if(i===-1){if(direccion>0)salir();return}
          indice=i;ui.titulo.textContent=tx('paso',{n:i+1,total:pasos.length});ui.texto.textContent=contenido(pasos[i],a);
          botones.anterior.disabled=i===0;
          if(!ui.elemento.open)ui.elemento.showModal();
          elemento.scrollIntoView({block:'start',behavior:'instant'});window.scrollBy({top:-96,behavior:'instant'});colocar();
          botones.salir.focus({preventScroll:true});
        }catch(e){salir();console.error('SATE: paso de recorrido fallido',{paso:i,mensaje:e.message,pila:e.stack});throw e}
        finally{ocupado=false}
      }
      addEventListener('resize',colocar);addEventListener('scroll',colocar,true);
      await mover(1);
    }catch(e){salir();throw e}
  }
  raiz.SateRecorrido={iniciar,variables,cumple,contenido,siguiente};
})(typeof window!=='undefined'?window:globalThis);
