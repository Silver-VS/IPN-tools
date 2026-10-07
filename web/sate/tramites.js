/* Base de Ventanilla. V2/V3 registran sus definiciones sin duplicar persistencia ni PDF. */
(function(raiz){
  const tx=(k,v)=>SATE.texto('sate.ventanilla.'+k,v);
  const el=(tag,texto,clase)=>{const n=document.createElement(tag);if(texto!=null)n.textContent=texto;if(clase)n.className=clase;return n};
  const boton=(texto,accion)=>{const b=el('button',texto,'sate-btn');b.type='button';b.onclick=accion;return b};
  function bajar(bytes,archivo){
    const u=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=el('a');
    a.href=u;a.download=archivo;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);
  }
  function confirmarDescarga(){
    return new Promise(resolve=>{
      SateUI.modal(tx('descargar'),tx('entrega_firmados'),{pequeno:true,alCerrar:()=>resolve(false),acciones:[
        {texto:tx('generar_pdf'),primaria:true,onclick:()=>resolve(true)},
        {texto:tx('cancelar')}
      ]});
    });
  }
  function leer(id){try{return JSON.parse(localStorage.getItem('hu.tramite.'+id)||'null')}catch{return null}}
  const completados=new Map();
  function estado(borrador,aplicacion,ahora=Date.now()){
    if(aplicacion?.aplica===false)return {id:'no_aplica',motivo:aplicacion.motivo,accion:null};
    if(borrador?.listo)return {id:'listo',accion:'descargar'};
    if(borrador)return {id:'progreso',accion:'continuar',paso:Math.min((borrador.paso||0)+1,borrador.total||1),total:borrador.total||1,min:Math.max(0,Math.floor((ahora-borrador.actualizado)/60000))};
    return {id:'no_iniciado',accion:'empezar'};
  }
  function separarNombre(nombre,inicioNombres,inicioMaterno,ultimaApellido=false){
    const palabras=String(nombre||'').trim().split(/\s+/).filter(Boolean),limite=inicioNombres+(ultimaApellido?1:0);
    if(limite<1||limite>=palabras.length)return null;
    const materno=inicioMaterno==null?limite:inicioMaterno;
    if(materno<1||materno>limite)return null;
    return {paterno:palabras.slice(0,materno).join(' '),materno:palabras.slice(materno,limite).join(' '),nombres:palabras.slice(limite).join(' ')};
  }
  function modelo(def,borrador=leer(def.id)){
    const memoria=completados.get(def.id);
    const campos=def.pasos.flatMap(p=>p.campos||[]),permitidos=new Set(campos.filter(c=>!c.sensible).map(c=>c.id));
    const inicial=typeof def.datos==='function'?def.datos():def.datos;
    const datos={};
    for(const c of campos)datos[c.id]=memoria?.datos[c.id]??(c.sensible?'':borrador?.datos?.[c.id]??inicial?.[c.id]??'');
    let paso=Math.max(0,Math.min(borrador?.paso||0,def.pasos.length)),listo=false;
    const validar=c=>c.visible&&!c.visible(datos)?'':c.validar?.(datos[c.id],datos)||(c.requerido&&!String(datos[c.id]??'').trim()?tx('requerido'):'');
    function guardar(){
      const seguro=Object.fromEntries(Object.entries(datos).filter(([k])=>permitidos.has(k)));
      // Nunca se registra el contenido de los campos, ni en mensajes de error.
      const v={paso,total:def.pasos.length+1,datos:seguro,actualizado:Date.now(),listo:listo&&!campos.some(c=>c.sensible&&datos[c.id])};
      try{IPNT.set('hu.tramite.'+def.id,JSON.stringify(v))}catch(e){console.error('Ventanilla: autoguardado fallido',{tramite:def.id,paso,error:e.name});throw e}
      // Un trámite sensible puede descargarse otra vez durante la sesión, nunca tras recargar.
      if(listo)completados.set(def.id,{...v,listo:true,datos:JSON.parse(JSON.stringify(datos))});
      return v;
    }
    return {datos,campos,validar,guardar,get paso(){return paso},set paso(v){paso=v},get listo(){return listo},set listo(v){listo=v;if(!v)completados.delete(def.id)},
      avanzar(){if((def.pasos[paso]?.campos||campos).some(c=>validar(c)))return false;paso=Math.min(paso+1,def.pasos.length);guardar();return true},
      atras(){paso=Math.max(0,paso-1);guardar()},cambiar(i){paso=i;listo=false;completados.delete(def.id);guardar()}};
  }
  function asistente(box,def){
    const m=modelo(def);let url=null,version=0,destruido=false,temporizador;
    function revocar(){if(url){URL.revokeObjectURL(url);url=null}}
    async function previsualizar(){
      const v=++version;
      if(!def.generar||!def.previsualizar&&m.campos.some(c=>m.validar(c))){revocar();const marco=box.querySelector('iframe');if(marco)marco.removeAttribute('src');const ver=box.querySelector('[data-ver-formato]');if(ver)ver.disabled=true;return}
      try{
        const bytes=await (def.previsualizar||def.generar)({...m.datos});
        if(destruido||v!==version)return;
        revocar();url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
        const marco=box.querySelector('iframe');if(marco)marco.src=url;
        const ver=box.querySelector('[data-ver-formato]');if(ver)ver.disabled=false;
      }catch(e){if(destruido||v!==version)return;revocar();box.querySelector('iframe')?.removeAttribute('src');const ver=box.querySelector('[data-ver-formato]');if(ver)ver.disabled=true;console.error('Ventanilla: vista previa fallida',{tramite:def.id,paso:m.paso,error:e.name});const aviso=box.querySelector('[data-pdf-estado]');if(aviso)aviso.textContent=tx('pdf_error')}
    }
    function programar(){clearTimeout(temporizador);temporizador=setTimeout(previsualizar,300)}
    async function descargar(){
      if(def.confirmacion&&!confirmado){box.querySelector('[data-pdf-estado]').textContent=def.confirmacion;return}
      const invalidos=m.campos.filter(c=>m.validar(c));
      if(invalidos.length){m.cambiar(def.pasos.findIndex(p=>p.campos.includes(invalidos[0])));pintar();return}
      if(!await confirmarDescarga()||destruido)return;
      const b=box.querySelector('[data-descargar]');b.disabled=true;
      try{
        const bytes=await def.generar({...m.datos});
        if(destruido)return;
        bajar(bytes,typeof def.archivo==='function'?def.archivo(m.datos):def.archivo||def.id+'.pdf');
        m.listo=true;m.guardar();def.alTerminar?.(m.datos);
      }catch(e){console.error('Ventanilla: descarga fallida',{tramite:def.id,paso:m.paso,error:e.name});box.querySelector('[data-pdf-estado]').textContent=tx('pdf_error')}
      finally{if(!destruido)b.disabled=false}
    }
    let confirmado=false;
    function pintar(){
      def.preparar?.(m.datos,m.paso);confirmado=false;
      box.replaceChildren();box.appendChild(el('h2',def.titulo));
      const indicador=el('ol',null,'tramite-pasos');indicador.setAttribute('aria-label',tx('pasos'));
      [...def.pasos.map(p=>p.titulo),tx('revisar')].forEach((s,i)=>{const n=el('li',s);if(i===m.paso)n.setAttribute('aria-current','step');indicador.appendChild(n)});box.appendChild(indicador);
      const layout=el('div',null,'tramite-asistente'),pantalla=el('div',null,'tramite-pantalla');layout.appendChild(pantalla);
      pantalla.appendChild(el('h3',m.paso===def.pasos.length?tx('revisar'):def.pasos[m.paso].titulo));
      if(def.pasos[m.paso]?.ayuda){const ayuda=def.pasos[m.paso].ayuda;pantalla.appendChild(el('p',typeof ayuda==='function'?ayuda(m.datos):ayuda))}
      if(m.paso===def.pasos.length){
        const resumen=el('dl',null,'tramite-revision');
        def.pasos.forEach((p,i)=>(p.campos||[]).filter(c=>!c.visible||c.visible(m.datos)).forEach(c=>{
          const filas=c.revision?c.revision(m.datos[c.id],m.datos):[{texto:c.texto,valor:c.resumen?c.resumen(m.datos[c.id],m.datos):String(m.datos[c.id]||tx('sin_dato'))}];
          for(const dato of filas){const fila=el('div');fila.appendChild(el('dt',dato.texto));fila.appendChild(el('dd',dato.valor));const b=boton(tx('cambiar'),()=>{if(dato.cambiar)dato.cambiar();else{m.cambiar(i);pintar()}});b.setAttribute('aria-label',tx('cambiar_dato',{dato:dato.texto}));fila.appendChild(b);resumen.appendChild(fila)}
        }));pantalla.appendChild(resumen);
        def.revisar?.(pantalla,m.datos);
        if(def.confirmacion){const l=el('label',null,'tramite-campo'),n=el('input');n.type='checkbox';n.onchange=()=>confirmado=n.checked;l.appendChild(n);l.appendChild(el('span',def.confirmacion));pantalla.appendChild(l)}
      }else for(const c of def.pasos[m.paso].campos||[]){
        if(c.visible&&!c.visible(m.datos))continue;
        const render=c.pintar||c.render;
        if(render){
          const grupo=el('div',null,'tramite-compuesto'),error=el('p','');
          grupo.id='tramite-'+def.id+'-'+c.id;grupo.tabIndex=-1;
          error.id=grupo.id+'-error';error.setAttribute('aria-live','polite');grupo.setAttribute('aria-describedby',error.id);
          grupo.onblur=()=>{const mensaje=m.validar(c);error.textContent=mensaje;grupo.setAttribute('aria-invalid',String(!!mensaje));m.guardar()};
          render(grupo,{datos:m.datos,cambiar(valor,repintar=false){if(arguments.length)m.datos[c.id]=valor;m.listo=false;m.guardar();programar();if(repintar)pintar()},validar:()=>m.validar(c),repintar:pintar});
          grupo.appendChild(error);pantalla.appendChild(grupo);continue;
        }
        const l=el('label',null,'tramite-campo'),n=el(c.tipo==='textarea'?'textarea':'input'),ayuda=el('small',c.ayuda||''),error=el('span','');
        n.id='tramite-'+def.id+'-'+c.id;n.value=m.datos[c.id];if(c.tipo!=='textarea')n.type=c.tipo||'text';
        n.required=!!c.requerido;error.id=n.id+'-error';ayuda.id=n.id+'-ayuda';error.setAttribute('aria-live','polite');n.setAttribute('aria-describedby',ayuda.id+' '+error.id);
        n.oninput=()=>{m.datos[c.id]=n.value;m.listo=false;programar()};
        n.onblur=()=>{m.datos[c.id]=n.value;const mensaje=m.validar(c);error.textContent=mensaje;n.setAttribute('aria-invalid',String(!!mensaje));m.guardar()};
        l.appendChild(el('span',c.texto));l.appendChild(n);l.appendChild(ayuda);l.appendChild(error);pantalla.appendChild(l);
      }
      const acciones=el('div',null,'tramite-acciones');if(m.paso>0)acciones.appendChild(boton(tx('atras'),()=>{m.atras();pintar()}));
      if(m.paso<def.pasos.length)acciones.appendChild(boton(tx('continuar'),()=>{
        // Validar también al continuar; la escritura por sí sola no muestra errores.
        for(const c of def.pasos[m.paso].campos||[]){const n=box.querySelector('#tramite-'+def.id+'-'+c.id);if(n){if(!c.pintar&&!c.render)m.datos[c.id]=n.value;n.onblur()}}
        if(m.avanzar())pintar();else{aviso.textContent=(def.pasos[m.paso].campos||[]).map(m.validar).filter(Boolean).join(' ');box.querySelector('[aria-invalid="true"]')?.focus()}
      }));
      else if(def.generar){const b=boton(def.descargaTexto||tx('descargar'),descargar);b.setAttribute('data-descargar','');acciones.appendChild(b)}
      else if(def.alTerminar)acciones.appendChild(boton(tx('confirmar'),()=>{if(!m.campos.some(c=>m.validar(c))){m.listo=true;m.guardar();def.alTerminar(m.datos)}}));
      pantalla.appendChild(acciones);
      const aviso=el('p','');aviso.setAttribute('data-pdf-estado','');aviso.setAttribute('role','status');pantalla.appendChild(aviso);
      if(def.generar){
        const lateral=el('aside',null,'tramite-preview'),iframe=el('iframe');iframe.title=tx('vista_previa');if(url)iframe.src=url;lateral.appendChild(iframe);layout.appendChild(lateral);
        const ver=boton(tx('ver_formato'),()=>{if(url)window.open(url,'_blank','noopener')});ver.className+=' tramite-ver';ver.setAttribute('data-ver-formato','');ver.disabled=!url;pantalla.appendChild(ver);programar();
      }
      box.appendChild(layout);
    }
    pintar();return {modelo:m,descargar,destruir(){destruido=true;version++;clearTimeout(temporizador);revocar();for(const c of m.campos)if(c.sensible)m.datos[c.id]=''}};
  }
  function prellenar(a){
    if(!a||a.upiita_saes!==1||(a.unidad||'upiita')!=='upiita')return {};
    return {boleta:a.boleta||'',carrera:a.carrera_nombre||a.carrera||'',plan:a.plan||'',correo:a.correo_institucional||a.correo||'',celular:a.celular||'',telefono:a.telefono||''};
  }
  function misDatos(box,volver=()=>mostrarLista(box)){
    box.replaceChildren();const previo=leer('datos'),a=(window.SATE?.alumno?window.SATE.alumno():(()=>{try{return JSON.parse(localStorage.getItem('saes.alumno')||'null')}catch{return null}})());
    const datos={...prellenar(a),...(previo?.datos||{})},campos=['paterno','materno','nombres','boleta','carrera','plan','correo','celular','telefono'];
    box.appendChild(el('h2',tx('datos_titulo')));box.appendChild(el('p',tx('datos_ayuda')));
    const controles={},resumen=el('p','');resumen.setAttribute('aria-live','polite');
    const actualizar=()=>resumen.textContent=tx('nombre_resumen',{paterno:controles.paterno.value,materno:controles.materno.value,nombres:controles.nombres.value});
    if(a?.nombre&&(a.unidad||'upiita')==='upiita'){
      const palabras=a.nombre.trim().split(/\s+/),chips=el('div',null,'tramite-chips');let nombres=null,materno=null,ultimo=false;
      const modo=boton(tx('ultima_palabra'),()=>{ultimo=!ultimo;modo.textContent=tx(ultimo?'primera_palabra':'ultima_palabra');modo.setAttribute('aria-pressed',String(ultimo));nombres=null;materno=null;indicacion.textContent=tx(ultimo?'elige_ultimo_apellido':'elige_nombre')});
      const indicacion=el('p',tx('elige_nombre'));
      const aplicar=()=>{const s=separarNombre(a.nombre,nombres,materno,ultimo);if(s){for(const k of ['paterno','materno','nombres'])controles[k].value=s[k];actualizar()}};
      palabras.forEach((p,i)=>chips.appendChild(boton(p,()=>{
        if(nombres==null){const limite=i+(ultimo?1:0);if(limite<1||limite>=palabras.length)return;nombres=i;aplicar();indicacion.textContent=tx('elige_materno')}
        else{const limite=nombres+(ultimo?1:0);if(i<1||i>=limite)return;materno=i;aplicar();indicacion.textContent=tx('editar_nombre')}
      })));
      box.appendChild(indicacion);box.appendChild(chips);box.appendChild(modo);
    }
    const form=el('form',null,'tramite-datos');form.noValidate=true;
    for(const k of campos){
      const l=el('label',null,'tramite-campo'),n=el('input');n.name=k;n.value=datos[k]||'';n.type=k==='correo'?'email':k==='boleta'?'text':['celular','telefono'].includes(k)?'tel':'text';if(k==='boleta')n.inputMode='numeric';
      n.required=['paterno','nombres','boleta','carrera','plan','correo'].includes(k);n.id='tramite-datos-'+k;
      const error=el('small','');error.id=n.id+'-error';error.setAttribute('aria-live','polite');n.setAttribute('aria-describedby',error.id);
      n.onblur=()=>{error.textContent=validarDatos(k,n.value,n.required);n.setAttribute('aria-invalid',String(!!error.textContent))};
      n.oninput=actualizar;controles[k]=n;l.appendChild(el('span',tx('dato_'+k)));l.appendChild(n);l.appendChild(error);form.appendChild(l);
    }
    form.appendChild(resumen);actualizar();form.appendChild(el('p',tx('datos_validacion')));
    const confirmar=el('button',tx('confirmar'),'sate-btn');confirmar.type='submit';form.appendChild(confirmar);
    form.onsubmit=e=>{e.preventDefault();for(const n of Object.values(controles))n.onblur();const mal=Object.values(controles).find(n=>n.getAttribute('aria-invalid')==='true');if(mal){mal.focus();return}
      const d=Object.fromEntries(campos.map(k=>[k,controles[k].value.trim()]));IPNT.set('hu.tramite.datos',JSON.stringify({datos:d,confirmado:true,actualizado:Date.now()}));volver();
    };
    form.appendChild(boton(tx('atras'),volver));box.appendChild(form);
  }
  function validarDatos(k,v,requerido=false){
    if(requerido&&!v.trim())return tx('requerido');
    if(k==='boleta'&&!/^\d{10}$/.test(v))return tx('boleta_error');
    if(k==='correo'&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return tx('correo_error');
    return '';
  }
  const definiciones=new Map();let activo;
  function mostrarLista(box){
    box.replaceChildren();box.appendChild(el('h2',tx('titulo')));box.appendChild(boton(tx('mis_datos'),()=>misDatos(box)));box.appendChild(el('p',tx('guardado_ayuda')));
    const lista=el('div',null,'tramite-lista');
    for(const id of SATE_CONFIG.unidades[SATE_UNIDAD].tramites){
      const aplica=SATE.presente.aplicaTramite(id),e=estado(completados.get(id)||leer(id),aplica),tarjeta=el('section',null,'tramite-tarjeta');
      tarjeta.appendChild(el('h3',SATE.texto('sate.tramite.'+id+'.titulo')));tarjeta.appendChild(el('p',tx(id+'_para')));
      tarjeta.appendChild(el('p',tx('estado_'+e.id)+(e.id==='progreso'?' · '+tx('avance',e):e.motivo?' · '+e.motivo:'')));
      if(aplica?.aplica){const n=el('p',tx('te_aplica')+' · '+aplica.motivo);tarjeta.appendChild(n)}
      if(e.accion){
        const accion=boton(tx(e.accion),async()=>{
          const entrada=definiciones.get(id),def=typeof entrada==='function'?entrada():entrada;
          if(e.accion!=='descargar'||!def?.generar){SATE.ir('tramites/'+id);return}
          if(!await confirmarDescarga())return;
          accion.disabled=true;
          try{
            const m=modelo(def);
            await def.preparar?.(m.datos,m.paso);
            if(m.campos.some(c=>m.validar(c))){m.listo=false;m.guardar();SATE.ir('tramites/'+id);return}
            bajar(await def.generar({...m.datos}),typeof def.archivo==='function'?def.archivo(m.datos):def.archivo||id+'.pdf');
          }
          catch(error){console.error('Ventanilla: descarga guardada fallida',{tramite:id,error:error.name});aviso.textContent=tx('pdf_error')}
          finally{accion.disabled=false}
        });
        const aviso=el('p','');aviso.setAttribute('role','status');tarjeta.appendChild(accion);tarjeta.appendChild(aviso);
      }
      lista.appendChild(tarjeta);
    }box.appendChild(lista);
  }
  function mostrar(r){
    activo?.destruir();activo=null;const box=document.getElementById('sate-tramites');
    if(r.tramite){
      const entrada=definiciones.get(r.tramite),def=typeof entrada==='function'?entrada():entrada;
      if(def){activo=asistente(box,def);return}
      mostrarLista(box);return;
    }mostrarLista(box);
  }
  raiz.SateTramites={estado,separarNombre,modelo,asistente,misDatos,prellenar,validarDatos,mostrarLista,registrar:(def,id)=>definiciones.set(id||def.id,def)};
  SATE.pestana('tramites',{mostrar,ocultar(){activo?.destruir();activo=null}});
})(globalThis);
