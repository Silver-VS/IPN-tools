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
  function control(){return 'barra'}
  let activo=false;
  async function iniciar(){
    if(activo)return;
    activo=true;
    let ui,origen=document.activeElement,elemento,indice=-1,pasos=[],ocupado=false,cerrado=false;
    const salir=()=>{if(cerrado)return;cerrado=true;activo=false;removeEventListener('resize',colocar);removeEventListener('scroll',colocar,true);removeEventListener('blur',salir);document.removeEventListener('visibilitychange',alCambiarVisibilidad);if(ui)SateUI.cerrarVentana(ui.elemento);ui?.elemento.remove();if(origen?.isConnected)origen.focus()};
    const alCambiarVisibilidad=()=>{if(document.visibilityState==='hidden')salir()};
    function colocar(){
      if(!elemento||!ui||!ui.elemento.open)return;
      let r=elemento.getBoundingClientRect();const ancho=ui.tarjeta.offsetWidth,alto=ui.tarjeta.offsetHeight,gap=12,margen=8;
      const zonaBaja=ui.acciones.getBoundingClientRect().top-gap;
      const opciones=caja=>[
        {x:caja.left,y:caja.top-alto-gap,lugar:'arriba',espacio:caja.top-margen},
        {x:caja.left,y:caja.bottom+gap,lugar:'abajo',espacio:innerHeight-margen-caja.bottom},
        {x:caja.left-ancho-gap,y:caja.top,lugar:'izquierda',espacio:caja.left-margen},
        {x:caja.right+gap,y:caja.top,lugar:'derecha',espacio:innerWidth-margen-caja.right}
      ];
      let candidatos=opciones(r);
      const cabe=c=>c.espacio>=((c.lugar==='arriba'||c.lugar==='abajo')?alto:ancho)&&c.x>=margen&&c.y>=margen&&c.x+ancho<=innerWidth-margen&&c.y+alto<=innerHeight-margen;
      let destino=candidatos.find(cabe);
      if(!destino){
        if(r.height>Math.min(alto+gap,zonaBaja-margen)){
          elemento.scrollIntoView({block:'start',inline:'nearest',behavior:'instant'});
          r=elemento.getBoundingClientRect();
          destino={x:margen,y:Math.max(margen,zonaBaja-alto),lugar:'zona-inferior',espacio:zonaBaja-margen};
        }else{
          elemento.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
          r=elemento.getBoundingClientRect();candidatos=opciones(r);
          destino=candidatos.find(cabe)||candidatos.reduce((a,b)=>b.espacio>a.espacio?b:a);
        }
      }
      const x=Math.max(margen,Math.min(destino.x,innerWidth-ancho-margen));
      const y=Math.max(margen,Math.min(destino.y,innerHeight-alto-margen));
      Object.assign(ui.tarjeta.style,{top:y+'px',left:x+'px',right:'auto',bottom:'auto'});
      const marcoAbajo=destino.lugar==='zona-inferior'?Math.min(r.bottom,y-gap):r.bottom;
      Object.assign(ui.marco.style,{top:Math.max(0,r.top)+'px',left:Math.max(0,r.left)+'px',width:Math.max(0,Math.min(r.right,innerWidth)-Math.max(0,r.left))+'px',height:Math.max(0,Math.min(marcoAbajo,innerHeight)-Math.max(0,r.top))+'px'});
    }
    try{
      const r=await fetch('recorrido.json');if(!r.ok)throw new Error('recorrido.json: HTTP '+r.status);
      const a=SATE.alumno?.(),cfg=SATE_CONFIG.unidades[SATE_UNIDAD];
      pasos=(await r.json()).filter(p=>cfg.pestanas.includes(p.pestana)&&cumple(p,a));
      ui=SateUI.recorridoTarjeta(salir);
      ui.tarjeta.classList.add('sate-recorrido__bienvenida');ui.elemento.dataset.vista='bienvenida';
      ui.titulo.textContent=tx('bienvenida');ui.texto.textContent='';
      const lista=document.createElement('div');lista.className='sate-recorrido__lista';lista.setAttribute('aria-label',tx('bienvenida'));
      const pestanas=[...new Set(cfg.pestanas)];
      for(const pestana of pestanas){
        const paso=pasos.find(p=>p.pestana===pestana);if(!paso)continue;
        const tarjeta=document.createElement('article');tarjeta.className='sate-recorrido__opcion';
        const titulo=document.createElement('h3');titulo.textContent=SATE.texto('sate.pestana.'+pestana+'.titulo');
        const texto=document.createElement('p');texto.textContent=contenido(paso,a);
        const boton=document.createElement('button');boton.type='button';boton.className='sate-btn';boton.textContent=tx('muestrame');boton.onclick=()=>{ui.elemento.dataset.vista='pasos';ui.tarjeta.classList.remove('sate-recorrido__bienvenida');ui.lista.hidden=true;iniciarPestana(pestana).catch(()=>SateUI.modal(tx('bienvenida'),tx('error'),{pequeno:true}))};
        tarjeta.append(titulo,texto,boton);lista.appendChild(tarjeta);
      }
      ui.lista=lista;ui.tarjeta.insertBefore(lista,ui.acciones);ui.acciones.hidden=true;
      SateUI.abrirVentana(ui.elemento,{alCerrar:salir,cierre:true,navegacion:ui.tarjeta});
      const botones={};
      for(const k of ['anterior','siguiente','salir']){const b=document.createElement('button');b.type='button';b.className='sate-btn';b.textContent=tx(k);b.onclick=()=>k==='salir'?salir():mover(k==='anterior'?-1:1).catch(()=>SateUI.modal(tx('bienvenida'),tx('error'),{pequeno:true}));ui.acciones.appendChild(b);botones[k]=b}
      async function iniciarPestana(pestana){pasos=pasos.filter(p=>p.pestana===pestana);indice=-1;ui.acciones.hidden=false;await mover(1)}
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
          indice=i;const paso=pasos[i];ui.titulo.textContent=tx('paso',{n:i+1,total:pasos.length});ui.texto.textContent=contenido(paso,a);
          ui.tarjeta.dataset.control=control(paso,elemento.getBoundingClientRect(),innerWidth);
          botones.anterior.disabled=i===0;botones.siguiente.textContent=i===pasos.length-1?tx('terminar'):tx('siguiente');
          elemento.scrollIntoView({block:'nearest',behavior:'instant'});
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          colocar();botones.salir.focus({preventScroll:true});
        }catch(e){salir();console.error('SATE: paso de recorrido fallido',{paso:i,mensaje:e.message,pila:e.stack});throw e}
        finally{ocupado=false}
      }
      ui.elemento.addEventListener('keydown',e=>{
        if(e.key!=='Tab')return;
        const enfocados=[...ui.elemento.querySelectorAll('button:not([disabled])')].filter(b=>!b.closest('[hidden]'));if(!enfocados.length)return;
        if(e.shiftKey&&document.activeElement===enfocados[0]){e.preventDefault();enfocados.at(-1).focus()}
        else if(!e.shiftKey&&document.activeElement===enfocados.at(-1)){e.preventDefault();enfocados[0].focus()}
      });
      addEventListener('resize',colocar);addEventListener('scroll',colocar,true);addEventListener('blur',salir);document.addEventListener('visibilitychange',alCambiarVisibilidad);
      (lista.querySelector('button')||ui.acciones.querySelector('button')).focus();
    }catch(e){salir();throw e}
  }
  raiz.SateRecorrido={iniciar,variables,cumple,contenido,siguiente,control};
})(typeof window!=='undefined'?window:globalThis);
