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
  // Respuesta de la Guía politécnica para este trámite (data/sate.json: guiaTramites); '' si la unidad no tiene Guía con contenido.
  function enlaceGuia(id){const u=SATE_CONFIG.unidades[SATE_UNIDAD],r=u?.guiaDatos&&u.guiaTramites?.[id];return r?'#/'+SATE_UNIDAD+'/guia/'+r:''}
  function leer(id){try{return JSON.parse((window.IPNT?.almacen||localStorage).getItem('hu.tramite.'+id)||'null')}catch{return null}}
  const completados=new Map();
  function estado(borrador,aplicacion,ahora=Date.now()){
    if(aplicacion?.aplica===false)return {id:'no_aplica',motivo:aplicacion.motivo,accion:null};
    if(borrador?.listo)return {id:'listo',accion:'descargar'};
    if(borrador)return {id:'progreso',accion:'continuar',paso:Math.min((borrador.paso||0)+1,borrador.total||1),total:borrador.total||1,min:Math.max(0,Math.floor((ahora-borrador.actualizado)/60000))};
    return {id:'no_iniciado',accion:'empezar'};
  }
  function separarNombre(nombre){
    const palabras=String(nombre||'').trim().split(/\s+/).filter(Boolean);
    const particulas=new Set('de del la las los y da das do dos van von mc mac'.split(' '));
    // Reservar siempre el primer nombre; las partículas pertenecen a la palabra que sigue.
    const apellido=()=>{let inicio=palabras.length-1;while(inicio>1&&particulas.has(palabras[inicio-1].toLowerCase()))inicio--;return palabras.splice(inicio).join(' ')};
    if(palabras.length<2)return {paterno:'',materno:'',nombres:palabras.join(' ')};
    const ultimo=apellido(),dos=palabras.length>1,paterno=dos?apellido():ultimo;
    return {paterno,materno:dos?ultimo:'',nombres:palabras.join(' ')};
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
      if(estadoFalta()){revocar();box.querySelector('iframe')?.removeAttribute('src');return}
      if(!def.generar||!def.previsualizar&&m.campos.some(c=>m.validar(c))){revocar();const marco=box.querySelector('iframe');if(marco)marco.removeAttribute('src');const ver=box.querySelector('[data-ver-formato]');if(ver)ver.disabled=true;return}
      try{
        const bytes=await (def.previsualizar||def.generar)({...m.datos});
        if(destruido||v!==version)return;
        revocar();url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
        const marco=box.querySelector('iframe');if(marco)marco.src=url;
        const ver=box.querySelector('[data-ver-formato]');if(ver)ver.disabled=false;
      }catch(e){if(destruido||v!==version)return;revocar();box.querySelector('iframe')?.removeAttribute('src');const ver=box.querySelector('[data-ver-formato]');if(ver)ver.disabled=true;console.error('Ventanilla: vista previa fallida',{tramite:def.id,paso:m.paso,error:e.name});const aviso=box.querySelector('[data-pdf-estado]');if(aviso)aviso.textContent=tx('pdf_error')}
    }
    // Un trámite puede declarar qué le falta (def.faltante) para que nunca se genere una hoja vacía.
    function estadoFalta(){
      const f=def.faltante?.(m.datos,m.paso===def.pasos.length)||'',ver=box.querySelector('[data-ver-formato]'),gen=box.querySelector('[data-descargar]'),aviso=box.querySelector('[data-pdf-falta]');
      if(f&&ver)ver.disabled=true;if(gen)gen.disabled=!!f;if(aviso)aviso.textContent=f;return f;
    }
    function programar(){clearTimeout(temporizador);temporizador=setTimeout(previsualizar,300)}
    async function descargar(){
      const falta=estadoFalta();if(falta){box.querySelector('[data-pdf-estado]').textContent=falta;return}
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
      finally{if(!destruido)b.disabled=!!def.faltante?.(m.datos,true)}
    }
    let confirmado=false;
    // Regreso a la lista: el avance ya está guardado, así que no pide confirmación.
    function regreso(clase){const b=boton(tx('volver'),()=>SATE.ir('tramites'));b.className+=' sate-volver tramite-regreso '+clase;return b}
    function pintar(){
      def.preparar?.(m.datos,m.paso);confirmado=false;
      box.replaceChildren();
      const ultimo=m.paso===def.pasos.length,nombres=[...def.pasos.map(p=>p.titulo),def.revisarTitulo||tx('revisar')];
      if(def.volver){const cabeza=el('div',null,'tramite-encabezado');cabeza.appendChild(el('h2',def.titulo));cabeza.appendChild(regreso('tramite-volver'));box.appendChild(cabeza)}
      else box.appendChild(el('h2',def.titulo));
      const lead=typeof def.lead==='string'?def.lead:'';if(lead)box.appendChild(el('p',lead,'tramite-lead'));
      const guia=enlaceGuia(def.id);if(guia){const g=SateUI.tarjetaNav({href:guia,titulo:tx('guia_titulo'),detalle:tx('guia_detalle'),compacta:true});g.className+=' tramite-guia';box.appendChild(g)}
      // Los pasos ya hechos se pueden volver a abrir; el activo y los pendientes no son botones.
      const pasos=el('ol',null,'tramite-pasos');pasos.setAttribute('aria-label',tx('pasos'));
      nombres.forEach((nombre,i)=>{
        const li=el('li',null,'tramite-paso'+(i<m.paso?' hecho':i===m.paso?' activo':'')),hecho=i<m.paso;
        const cuerpo=el(hecho?'button':'span',null,'tramite-paso-ir');
        if(hecho){cuerpo.type='button';cuerpo.onclick=()=>{m.paso=i;m.guardar();pintar()};cuerpo.setAttribute('aria-label',tx('ir_paso',{n:i+1,paso:nombre}))}
        else if(i===m.paso)li.setAttribute('aria-current','step');
        cuerpo.appendChild(el('span',tx('paso_n',{n:i+1}),'tramite-paso-n'));cuerpo.appendChild(el('span',nombre,'tramite-paso-t'));
        li.appendChild(cuerpo);pasos.appendChild(li);
      });box.appendChild(pasos);
      const conVista=ultimo&&!!def.generar;
      const layout=el('div',null,'tramite-asistente'+(conVista?' con-vista':'')),pantalla=el('div',null,'tramite-pantalla');layout.appendChild(pantalla);
      const cabecera=el('header',null,'tramite-paso-cabecera');cabecera.appendChild(el('h3',nombres[m.paso]));
      const ayuda=ultimo?(def.revisionAyuda||tx('revision_ayuda')):def.pasos[m.paso]?.ayuda;
      if(ayuda)cabecera.appendChild(el('p',typeof ayuda==='function'?ayuda(m.datos):ayuda,'tramite-ayuda'));
      pantalla.appendChild(cabecera);
      // Cada paso agrupa sus campos en tarjetas; un campo con `grupo` abre una tarjeta nueva con ese título.
      let bloque=null,rejilla=null,grupoActual;
      const nuevoBloque=titulo=>{bloque=el('section',null,'tramite-bloque');if(titulo)bloque.appendChild(el('h4',titulo));rejilla=el('div',null,'tramite-rejilla');bloque.appendChild(rejilla);pantalla.appendChild(bloque)};
      if(ultimo){
        bloque=el('section',null,'tramite-bloque'+(def.imprimible?' tramite-imprimible':''));
        if(def.imprimible)bloque.appendChild(el('p',def.titulo+' · '+new Date().toLocaleDateString('es-MX',{dateStyle:'long'}),'tramite-solo-impresion'));
        const resumen=el('dl',null,'tramite-revision');
        def.pasos.forEach((p,i)=>(p.campos||[]).filter(c=>!c.visible||c.visible(m.datos)).forEach(c=>{
          const filas=c.revision?c.revision(m.datos[c.id],m.datos):[{texto:c.texto,valor:c.resumen?c.resumen(m.datos[c.id],m.datos):String(m.datos[c.id]||tx('sin_dato'))}];
          for(const dato of filas){const fila=el('div');fila.appendChild(el('dt',dato.texto));fila.appendChild(el('dd',dato.valor));const b=boton(tx('cambiar'),()=>{if(dato.cambiar)dato.cambiar();else{m.cambiar(i);pintar()}});b.className+=' tramite-sin-impresion tramite-texto';b.setAttribute('aria-label',tx('cambiar_dato',{dato:dato.texto}));fila.appendChild(b);resumen.appendChild(fila)}
        }));bloque.appendChild(resumen);pantalla.appendChild(bloque);
        def.revisar?.(pantalla,m.datos,bloque);
        if(def.confirmacion){const l=el('label',null,'tramite-campo'),n=el('input');n.type='checkbox';n.onchange=()=>confirmado=n.checked;l.appendChild(n);l.appendChild(el('span',def.confirmacion));pantalla.appendChild(l)}
      }else for(const c of def.pasos[m.paso].campos||[]){
        if(c.visible&&!c.visible(m.datos))continue;
        if(!bloque||c.grupo&&c.grupo!==grupoActual){grupoActual=c.grupo;nuevoBloque(c.grupo)}
        const render=c.pintar||c.render;
        if(render){
          const grupo=el('div',null,'tramite-compuesto tramite-ancho'),error=el('p','');
          grupo.id='tramite-'+def.id+'-'+c.id;grupo.tabIndex=-1;
          error.id=grupo.id+'-error';error.setAttribute('aria-live','polite');grupo.setAttribute('aria-describedby',error.id);
          grupo.onblur=()=>{const mensaje=m.validar(c);error.textContent=mensaje;grupo.setAttribute('aria-invalid',String(!!mensaje));m.guardar()};
          render(grupo,{datos:m.datos,cambiar(valor,repintar=false){if(arguments.length)m.datos[c.id]=valor;m.listo=false;m.guardar();programar();if(repintar)pintar()},validar:()=>m.validar(c),repintar:pintar});
          grupo.appendChild(error);rejilla.appendChild(grupo);continue;
        }
        const l=el('label',null,'tramite-campo'+(c.tipo==='textarea'||c.ancho?' tramite-ancho':'')),n=el(c.tipo==='textarea'?'textarea':'input'),ayudaCampo=el('small',c.ayuda||''),error=el('span','');
        n.id='tramite-'+def.id+'-'+c.id;n.value=m.datos[c.id];if(c.tipo!=='textarea')n.type=c.tipo||'text';
        n.required=!!c.requerido;error.id=n.id+'-error';ayudaCampo.id=n.id+'-ayuda';error.setAttribute('aria-live','polite');n.setAttribute('aria-describedby',ayudaCampo.id+' '+error.id);
        n.oninput=()=>{m.datos[c.id]=n.value;m.listo=false;programar()};
        n.onblur=()=>{m.datos[c.id]=n.value;const mensaje=m.validar(c);error.textContent=mensaje;n.setAttribute('aria-invalid',String(!!mensaje));m.guardar()};
        l.appendChild(el('span',c.texto));l.appendChild(n);l.appendChild(ayudaCampo);l.appendChild(error);rejilla.appendChild(l);
      }
      // La vista previa y «Ver formato» solo en el último paso: antes se podía sacar un PDF casi vacío.
      if(conVista){
        const lateral=el('aside',null,'tramite-preview'),iframe=el('iframe');iframe.title=tx('vista_previa');if(url)iframe.src=url;lateral.appendChild(iframe);layout.appendChild(lateral);
        const fila=el('div',null,'tramite-ver-fila'),ver=boton(tx('ver_formato'),()=>{if(url)window.open(url,'_blank','noopener')});ver.className+=' tramite-ver';ver.setAttribute('data-ver-formato','');ver.disabled=!url;
        fila.appendChild(ver);fila.appendChild(el('small',tx('ver_formato_ayuda')));pantalla.appendChild(fila);
        programar();
      }
      if(def.generar&&def.faltante){const falta=el('p','',  'tramite-falta');falta.setAttribute('data-pdf-falta','');falta.setAttribute('role','status');pantalla.appendChild(falta)}
      const aviso=el('p','');aviso.setAttribute('data-pdf-estado','');aviso.setAttribute('role','status');pantalla.appendChild(aviso);
      const acciones=el('div',null,'tramite-acciones');acciones.appendChild(el('span',tx('guardado'),'tramite-guardado'));
      if(m.paso>0)acciones.appendChild(boton(tx('atras'),()=>{m.atras();pintar()}));
      const primario=b=>{b.className+=' sate-btn--primario';acciones.appendChild(b);return b};
      if(m.paso<def.pasos.length)primario(boton(tx('continuar'),()=>{
        // Validar también al continuar; la escritura por sí sola no muestra errores.
        for(const c of def.pasos[m.paso].campos||[]){const n=box.querySelector('#tramite-'+def.id+'-'+c.id);if(n){if(!c.pintar&&!c.render)m.datos[c.id]=n.value;n.onblur()}}
        if(m.avanzar())pintar();else{aviso.textContent=(def.pasos[m.paso].campos||[]).map(m.validar).filter(Boolean).join(' ');box.querySelector('[aria-invalid="true"]')?.focus()}
      }));
      else if(def.generar){const b=primario(boton(def.descargaTexto||tx('descargar'),descargar));b.setAttribute('data-descargar','')}
      else if(def.alTerminar)primario(boton(def.terminarTexto||tx('confirmar'),()=>{
        // Si falta algo (p. ej. un dato sensible que no sobrevivió a la recarga), se vuelve al paso que lo pide.
        const invalidos=m.campos.filter(c=>m.validar(c));
        if(invalidos.length){m.cambiar(Math.max(0,def.pasos.findIndex(p=>(p.campos||[]).includes(invalidos[0]))));pintar();return}
        m.listo=true;m.guardar();def.alTerminar(m.datos);
      }));
      pantalla.appendChild(acciones);
      box.appendChild(layout);if(def.generar)estadoFalta();
      if(def.volver){const pie=el('div',null,'tramite-pie');pie.appendChild(regreso('tramite-volver-pie'));box.appendChild(pie)}
    }
    pintar();return {modelo:m,descargar,destruir(){destruido=true;version++;clearTimeout(temporizador);revocar();for(const c of m.campos)if(c.sensible)m.datos[c.id]=''}};
  }
  function prellenar(a){
    if(!a||a.upiita_saes!==1)return {};
    return {boleta:a.boleta||'',carrera:a.carrera_nombre||a.carrera||'',plan:a.plan||'',correo:a.correo_institucional||a.correo||''};
  }
  function guardarDatos(datos){
    try{IPNT.set('hu.tramite.datos',JSON.stringify({datos,confirmado:true,actualizado:Date.now()}))}
    catch(e){console.error('Ventanilla: identidad no guardada',{fase:'confirmación',error:e.name});throw e}
  }
  function alumnoActual(){return window.SATE?.alumno?SATE.alumno():(()=>{try{return JSON.parse((window.IPNT?.almacen||localStorage).getItem('saes.alumno')||'null')}catch{return null}})()}
  function formularioDatos(box,datos,campos,volver,{nombre=false}={}){
    const form=el('form',null,'tramite-datos'),controles={};form.noValidate=true;
    if(nombre)form.appendChild(el('h3',tx('nombre_titulo')));
    for(const k of campos){
      const l=el('label',null,'tramite-campo'),n=el('input');n.name=k;n.value=datos[k]||'';n.type=k==='correo'?'email':['celular','telefono'].includes(k)?'tel':'text';if(k==='boleta')n.inputMode='numeric';
      n.required=['paterno','nombres','boleta','carrera','plan','correo'].includes(k);n.id='tramite-datos-'+k;n.readOnly=nombre;
      const error=el('small','');error.id=n.id+'-error';error.setAttribute('aria-live','polite');n.setAttribute('aria-describedby',error.id);
      n.onblur=()=>{error.textContent=validarDatos(k,n.value,n.required);n.setAttribute('aria-invalid',String(!!error.textContent))};
      controles[k]=n;l.appendChild(el('span',tx('dato_'+k)));l.appendChild(n);l.appendChild(error);form.appendChild(l);
    }
    form.appendChild(el('p',tx('apellidos_aviso'),'tramite-apellidos-aviso'));
    const acciones=el('div',null,'tramite-acciones');
    if(nombre)acciones.appendChild(boton(tx('corregir_nombre'),()=>{for(const n of Object.values(controles))n.readOnly=false;controles.paterno.focus()}));
    const confirmar=el('button',tx(nombre?'si_guardar':'guardar'),'sate-btn sate-btn--primario');confirmar.type='submit';acciones.appendChild(confirmar);form.appendChild(acciones);
    form.onsubmit=e=>{e.preventDefault();for(const n of Object.values(controles))n.onblur();const mal=Object.values(controles).find(n=>n.getAttribute('aria-invalid')==='true');if(mal){mal.readOnly=false;mal.focus();return}
      guardarDatos({...datos,...Object.fromEntries(campos.map(k=>[k,controles[k].value.trim()]))});volver();
    };
    box.appendChild(form);return form;
  }
  function confirmarSaes(a,box,continuar){
    const previo=leer('datos'),datos={...(previo?.datos||{}),...prellenar(a)};
    if(previo?.confirmado){guardarDatos(datos);continuar();return false}
    box.replaceChildren();formularioDatos(box,{...datos,...separarNombre(a.nombre)},['paterno','materno','nombres'],continuar,{nombre:true});return true;
  }
  function misDatos(box,volver=()=>mostrarLista(box),contacto=[]){
    const previo=leer('datos'),a=alumnoActual(),datos={...separarNombre(a?.nombre),...prellenar(a),...(previo?.datos||{})};
    box.replaceChildren();formularioDatos(box,datos,['paterno','materno','nombres','boleta','carrera','plan','correo',...contacto],volver);
  }
  function datosInline(box,alGuardar,contacto=[]){
    box.replaceChildren();
    const previo=leer('datos'),d=previo?.datos;
    if(!previo?.confirmado){misDatos(box,()=>{datosInline(box,alGuardar,contacto);alGuardar?.()},contacto);return}
    const resumen=el('p',null,'tramite-identidad');resumen.appendChild(el('span',[[d.nombres,d.paterno,d.materno].filter(Boolean).join(' '),d.boleta,d.carrera].filter(Boolean).join(' · ')));
    const editor=el('div');
    const editar=()=>misDatos(editor,()=>{box.replaceChildren();datosInline(box,alGuardar,contacto);alGuardar?.()},contacto);
    resumen.appendChild(boton(tx('editar'),editar));box.appendChild(resumen);box.appendChild(editor);
    if(contacto.some(k=>!(k in d))||['paterno','nombres','boleta','carrera','plan','correo'].some(k=>validarDatos(k,d[k]||'',true)))editar();
  }
  function validarDatos(k,v,requerido=false){
    if(requerido&&!v.trim())return tx('requerido');
    if(k==='boleta'&&!/^\d{10}$/.test(v))return tx('boleta_error');
    if(k==='correo'&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return tx('correo_error');
    return '';
  }
  const definiciones=new Map();let activo;
  function mostrarLista(box){
    box.replaceChildren();box.appendChild(el('h2',tx('titulo')));box.appendChild(el('p',tx('guardado_ayuda'),'tramite-lead'));
    if(!SATE_CONFIG.unidades[SATE_UNIDAD].tramites.length){box.replaceChildren(el('h2',tx('titulo')),el('p',tx('sin_tramites')));return}
    // Lo que ya tiene avance o está terminado va primero; lo demás queda como disponible.
    const grupos={curso:[],disponibles:[]};
    for(const id of SATE_CONFIG.unidades[SATE_UNIDAD].tramites){
      const aplica=SATE.presente.aplicaTramite(id),e=estado(completados.get(id)||leer(id),aplica);
      grupos[e.id==='progreso'||e.id==='listo'?'curso':'disponibles'].push({id,aplica,e});
    }
    const clases={listo:'ok',progreso:'curso',no_aplica:'',no_iniciado:''};
    for(const [clave,filas] of Object.entries(grupos)){
      if(!filas.length)continue;
      const grupo=el('section',null,'tramite-grupo'),rotulo=el('h3',tx('grupo_'+clave),'tramite-grupo-rotulo'),lista=el('ul',null,'tramite-filas');
      rotulo.id='tramite-grupo-'+clave;lista.setAttribute('aria-labelledby',rotulo.id);grupo.appendChild(rotulo);
      for(const {id,aplica,e} of filas){
        const fila=el('li',null,'tramite-fila'),texto=el('div',null,'tramite-fila-texto');
        texto.appendChild(el('h4',SATE.texto('sate.tramite.'+id+'.titulo')));texto.appendChild(el('p',tx(id+'_para'),'tramite-fila-para'));
        const meta=e.id==='progreso'?tx('avance',e):e.motivo?e.motivo:'';
        if(meta)texto.appendChild(el('p',meta,'tramite-fila-meta'));
        if(aplica?.aplica)texto.appendChild(el('p',tx('te_aplica')+' · '+aplica.motivo,'tramite-fila-meta tramite-aplica'));
        const aviso=el('p','','tramite-fila-meta');aviso.setAttribute('role','status');texto.appendChild(aviso);
        fila.appendChild(texto);
        fila.appendChild(el('span',tx('estado_'+e.id),'tramite-estado'+(clases[e.id]?' '+clases[e.id]:'')));
        const lateral=el('div',null,'tramite-fila-acciones');
        if(e.accion){
          const entrada0=definiciones.get(id);
          // Un trámite sin PDF (bajas) se termina con un resumen imprimible: no hay nada que descargar.
          const sinPdf=!!entrada0&&(entrada0.sinPdf||typeof entrada0!=='function'&&!entrada0.generar);
          const verbo=e.accion==='descargar'&&sinPdf?'ver_resumen':e.accion;
          const accion=boton(tx(verbo),async()=>{
            const entrada=definiciones.get(id),def=typeof entrada==='function'?entrada():entrada;
            if(e.accion!=='descargar'||!def?.generar){SATE.ir('tramites/'+id);return}
            if(!await confirmarDescarga())return;
            accion.disabled=true;
            try{
              await SATE.prepararTramite?.(id);
              const m=modelo(def);
              await def.preparar?.(m.datos,m.paso);
              if(m.campos.some(c=>m.validar(c))){m.listo=false;m.guardar();SATE.ir('tramites/'+id);return}
              bajar(await def.generar({...m.datos}),typeof def.archivo==='function'?def.archivo(m.datos):def.archivo||id+'.pdf');
            }
            catch(error){console.error('Ventanilla: descarga guardada fallida',{tramite:id,error:error.name});aviso.textContent=tx('pdf_error')}
            finally{accion.disabled=false}
          });
          accion.setAttribute('aria-label',tx('accion_aria',{accion:tx(verbo),tramite:SATE.texto('sate.tramite.'+id+'.titulo')}));
          // Acciones de fila secundarias; la acción primaria pertenece al asistente abierto.
          lateral.appendChild(accion);
          // Un trámite terminado se puede revisar (vuelve al asistente) o reiniciar.
          if(e.id==='listo'){
            const extra=el('div',null,'tramite-acciones-extra');
            for(const [texto0,hacer] of [[tx('corregir'),()=>SATE.ir('tramites/'+id)],[tx('reiniciar'),()=>{
              if(!confirm(tx('reiniciar_confirmar')))return;
              const k='hu.tramite.'+id;try{IPNT.borrar?.(k);(IPNT.almacen||localStorage).removeItem(k)}catch(err){}
              completados.delete(id);mostrarLista(box);
            }]]){const b=boton(texto0,hacer);b.className+=' tramite-texto';b.setAttribute('aria-label',texto0+': '+SATE.texto('sate.tramite.'+id+'.titulo'));extra.appendChild(b)}
            lateral.appendChild(extra);
          }
        }
        const guia=enlaceGuia(id);
        if(guia){const g=el('a',tx('ver_guia'),'sate-enlace tramite-ver-guia');g.href=guia;g.setAttribute('aria-label',tx('ver_guia_aria',{tramite:SATE.texto('sate.tramite.'+id+'.titulo')}));lateral.appendChild(g)}
        fila.appendChild(lateral);lista.appendChild(fila);
      }
      grupo.appendChild(lista);box.appendChild(grupo);
    }
  }
  function mostrar(r){return globalThis.SateMedicion?globalThis.SateMedicion.render('ventanilla',()=>mostrarVista(r)):mostrarVista(r)}
  function mostrarVista(r){
    activo?.destruir();activo=null;const box=document.getElementById('sate-tramites');
    if(r.tramite){
      const entrada=definiciones.get(r.tramite),def=typeof entrada==='function'?entrada():entrada;
      if(def){activo=asistente(box,def);return}
      mostrarLista(box);return;
    }mostrarLista(box);
  }
  raiz.SateTramites={estado,separarNombre,modelo,asistente,misDatos,datosInline,confirmarSaes,prellenar,validarDatos,mostrarLista,registrar:(def,id)=>definiciones.set(id||def.id,def)};
  SATE.pestana('tramites',{mostrar,ocultar(){activo?.destruir();activo=null}});
})(globalThis);
