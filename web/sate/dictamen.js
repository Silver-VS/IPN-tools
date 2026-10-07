/* Captura de Dictamen; el estampado oficial pertenece exclusivamente a PdfDictamen. */
(function(raiz){
  const el=(tag,texto)=>{const n=document.createElement(tag);if(texto!=null)n.textContent=texto;return n};
  const leer=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const periodo=p=>{const m=String(p||'').match(/^(?:20)?(\d{2})\/?([12])$/);return m?m[1]+'/'+m[2]:''};
  const tipos={interno:'Dictamen de la Comisión de Situación Escolar de la UPIITA',externo:'Dictamen externo (COSIE-01)'};
  function sugerir(s){
    if(s?.riesgoBajaDefinitiva||s?.revocacion)return {tipo:'externo',motivo:'Tu situación requiere revisar una baja definitiva o una revocación.'};
    if(s?.nDes)return {tipo:'interno',motivo:'Tienes materias desfasadas que debes revisar con la Comisión de Situación Escolar de la UPIITA.'};
    return {tipo:'',motivo:'No hay una señal suficiente para sugerir un tipo de dictamen.'};
  }
  function pendientes(a,catalogo){
    const aprobadas=new Set((a.acreditadas||[]).map(r=>r[0])),filas=new Map();
    for(const r of [...a.reprobadas_periodo||[],...a.desfasadas_saes||[],...a.kardex_reprobadas||[]]){
      if(!r||aprobadas.has(r[0]))continue;
      const plan=String(a.plan||'').replace(/^2009$/,'09').replace(/^1998$/,'98');
      const [nombre,nivel]=catalogo[`${a.carrera}|${plan}|${r[0]}`]||[];
      if(!nombre)continue;
      const hist=[...new Set((a.kardex_reprobadas||[]).filter(h=>h[0]===r[0]).map(h=>periodo(h[2])).filter(Boolean))].sort();
      filas.set(r[0],{clave:r[0],nombre,nivel,cursada:hist[0]||periodo((a.reprobadas_periodo||[]).find(h=>h[0]===r[0])?.[1]),recursada:hist.slice(1).join(', ')});
    }
    return [...filas.values()];
  }
  function plantilla(tipo,periodo,filas,opcion='inscribir'){
    const lista=filas.map(r=>r.nombre).join(', ')||'las unidades de aprendizaje indicadas';
    if(opcion==='tiempo')return `Solicito ampliación de tiempo para concluir mis estudios y regularizar las unidades de aprendizaje ${lista}. Expongo mis motivos en la carta anexa.`;
    if(tipo==='externo')return `Solicito al Consejo General Consultivo que revise mi situación escolar y autorice mi continuidad en el periodo ${periodo}, para regularizar ${lista}. Expongo mis motivos en la carta anexa.`;
    return `Solicito autorización para inscribir en el periodo ${periodo} las unidades de aprendizaje ${lista}, con el fin de regularizar mi situación escolar.`;
  }
  let carga,font;
  async function cargar(){
    if(!carga)carga=(async()=>{
      await SATE.script('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js');
      await SATE.script('../tramites/pdf-comun.js');await SATE.script('../tramites/pdf-dictamen.js');
      const doc=await PDFLib.PDFDocument.create();font=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    })().catch(e=>{carga=null;console.error('Dictamen: carga de PDF fallida',{etapa:'biblioteca',error:e.name});throw e});
    return carga;
  }
  function medir(texto,tipo){return PdfTramites.cabe(texto,{font,ancho:tipo==='externo'?491:514,size:tipo==='externo'?7:10,max:tipo==='externo'?4:5})}
  function opciones(id,texto,items,{multiple=false,sensible=false,visible,requerido=false,ayuda}={}){
    return {id,texto,sensible,visible,requerido,resumen:v=>(Array.isArray(v)?v:[v]).map(k=>items.find(i=>i[0]===k)?.[1]||'').filter(Boolean).join(', '),
      pintar(box,ctx){
        const f=el('fieldset');f.className='dictamen-opciones'+(id==='tipo'?' dictamen-tipos':'');f.appendChild(el('legend',texto));if(ayuda)f.appendChild(el('p',ayuda));
        items.forEach(([valor,etiqueta,ayudaOpcion])=>{const l=el('label'),n=el('input');n.type=multiple?'checkbox':'radio';n.name='dictamen-'+id;n.value=valor;n.checked=multiple?(ctx.datos[id]||[]).includes(valor):ctx.datos[id]===valor;
          n.onchange=()=>{const actual=ctx.datos[id]||[];ctx.cambiar(multiple?(n.checked?[...actual,valor]:actual.filter(k=>k!==valor)):valor,!multiple)};
          l.appendChild(n);const contenido=el('span',etiqueta);if(ayudaOpcion){contenido.appendChild(el('br'));contenido.appendChild(el('small',ayudaOpcion))}l.appendChild(contenido);f.appendChild(l)});box.appendChild(f);
      }};
  }
  function definir(){
    const base=SATE_DATA.dictamen,a=leer('saes.alumno'),alumno=a?.upiita_saes===1&&(a.unidad||'upiita')==='upiita'?a:{};
    const compartido=()=>{const v=leer('hu.tramite.datos');return v?.confirmado?v.datos:null};
    const datos=compartido()||{},catalogo=base.materias;
    const carrera=Object.entries(SATE_DATA.carreras||{}).find(([k,n])=>k===datos.carrera||n===datos.carrera)?.[0]||alumno.carrera;
    const plan=String(datos.plan||alumno.plan||'').replace(/^20(\d{2})$/,'$1').replace(/^1998$/,'98');
    const materias=Object.entries(catalogo).filter(([k])=>k.startsWith(`${carrera}|${plan}|`)).map(([k,[nombre,nivel]])=>({clave:k.split('|')[2],nombre,nivel,cursada:'',recursada:''}));
    const pre=pendientes(alumno,catalogo),sugerencia=sugerir(typeof situacionDatos==='function'?situacionDatos():null);
    let inicializado=false;
    const interno=d=>d.tipo==='interno',externo=d=>d.tipo==='externo';
    const texto=(k,v={})=>(base.textos['dictamen.'+k]||k).replace(/\{(\w+)\}/g,(_,n)=>v[n]??'');
    const camposSituacion=[
      opciones('anteriores','¿Has tenido dictámenes antes?',[['Sí','Sí'],['No','No']],{visible:interno,requerido:true}),
      {id:'oficios',texto:'Número(s) de oficio',visible:d=>interno(d)&&d.anteriores==='Sí',requerido:true},
      {id:'ingreso',texto:'Ciclo de ingreso al IPN',visible:interno,requerido:true,ayuda:'Escribe el ciclo en que ingresaste al IPN, por ejemplo 24/1. Consúltalo en tu primer registro del SAES.',validar:v=>!periodo(v)?'Escribe el ciclo como YY/P, por ejemplo 24/1.':''},
      ...[['nacimiento','Fecha de nacimiento','date'],['civil','Estado civil'],['domicilio','Domicilio'],['ingreso_ext','Ciclo de ingreso al nivel superior'],['ultimo','Último semestre inscrito'],['dictamen_fecha','Fecha del último dictamen','date'],['otras_situacion','Otra situación escolar'],['otras_causas','Otra causa']].map(([id,texto,tipo])=>({id,texto,tipo,sensible:true,visible:externo})),
      opciones('organo','¿Quién emitió tu último dictamen?',[['ctce','Comisión de Situación Escolar de tu unidad'],['cgc','Consejo General Consultivo']],{sensible:true,visible:externo}),
      opciones('situacion','Situación escolar actual',[['s1','Tengo materias desfasadas'],['s2','No solicité reinscripción el periodo anterior'],['s3','Solicito reconocer calificaciones aprobadas'],['s4','Necesito más tiempo para concluir mis estudios'],['s5','No cumplí un dictamen anterior'],['s6','Otra situación']],{multiple:true,sensible:true,visible:externo}),
      opciones('causas','¿Qué causó esta situación?',[['salud','Salud'],['economica','Dificultades económicas'],['familiar','Situación familiar'],['legal','Situación legal'],['laboral','Trabajo'],['administrativa','Trámites administrativos'],['otras','Otra causa']],{multiple:true,sensible:true,visible:externo}),
      ...[['dependientes','¿Tu pareja depende económicamente de ti?'],['hijos','¿Tienes hijos menores que dependan de ti?']].map(([id,t])=>opciones(id,t,[['si','Sí'],['no','No'],['no_contestar','Prefiero no contestar']],{sensible:true,visible:externo})),
      opciones('embarazo','Embarazo',[['propio','Estoy embarazada'],['pareja','Mi pareja está embarazada'],['no_contestar','Prefiero no contestar']],{sensible:true,visible:externo}),
      opciones('anexos','Documentos que anexas',[['boleta_global','Boleta global'],['probatorios','Documentos que respaldan mis motivos'],['carta_anexo','Carta de motivos'],['otros_anexos','Otros documentos'],['dictamenes','Dictámenes anteriores'],['bajas','Documentos de baja']],{multiple:true,sensible:true,visible:externo})
    ];
    const tipo=opciones('tipo','Elige el tipo de dictamen',Object.entries(tipos).map(([k,v])=>[k,v,k==='interno'?'Para regularizar materias desfasadas.':'Para revisar riesgo de baja definitiva o revocación.']),{requerido:true,ayuda:sugerencia.motivo+' ¿No estás seguro? Pregúntalo en Gestión Escolar.'});
    tipo.validar=v=>v==='interno'&&!['09','2009','98','1998'].includes(String(compartido()?.plan))?'El formato interno solo contempla los planes 1998 y 2009. Consulta Gestión Escolar para confirmar el formato que corresponde a tu plan.':'';
    const filas={id:'filas',texto:'Tus materias',resumen:v=>(v||[]).map(r=>`${r.nombre} · nivel ${r.nivel} · cursada ${r.cursada||'sin dato'} · recursada ${r.recursada||'sin dato'}`).join('; '),validar:v=>!Array.isArray(v)||v.length>8?'Selecciona como máximo 8 materias.':!v.length?'Selecciona al menos una materia.':'',
      pintar(box,ctx){
        const contador=el('p',`${ctx.datos.filas.length} de 8 renglones del formato`),aviso=el('p',pre.length>8?'Tu historial tiene más de 8 materias pendientes. Seleccionamos las primeras 8; revisa cuáles incluir y consulta Gestión Escolar para las restantes.':'');aviso.setAttribute('role','status');box.appendChild(contador);
        const q=el('input');q.type='search';q.setAttribute('aria-label','Buscar otra materia del plan');q.placeholder='Buscar otra materia del plan';box.appendChild(q);
        const lista=el('div');lista.className='dictamen-opciones';box.appendChild(lista);box.appendChild(aviso);
        function pintar(){lista.replaceChildren();const todas=new Map([...pre,...materias,...ctx.datos.filas].map(r=>[r.clave,r]));
          for(const r of todas.values()){
            const marcada=ctx.datos.filas.some(f=>f.clave===r.clave);if(!marcada&&!r.nombre.toLocaleLowerCase().includes(q.value.toLocaleLowerCase()))continue;
            const l=el('label'),n=el('input');n.type='checkbox';n.checked=marcada;
            n.onchange=()=>{if(n.checked&&ctx.datos.filas.length>=8){n.checked=false;aviso.textContent='El formato tiene 8 renglones. Quita una materia antes de agregar otra.';return}
              ctx.cambiar(n.checked?[...ctx.datos.filas,r]:ctx.datos.filas.filter(f=>f.clave!==r.clave));contador.textContent=`${ctx.datos.filas.length} de 8 renglones del formato`;aviso.textContent='';pintar()};
            l.appendChild(n);l.appendChild(el('span',`${r.nombre} · nivel ${r.nivel} · cursada ${r.cursada||'sin dato'} · recursada ${r.recursada||'sin dato'}`));lista.appendChild(l);
          }}q.oninput=pintar;pintar();
      }};
    const peticion={id:'peticion',texto:'Tu petición',requerido:true,validar:(v,d)=>!font?'Espera a que cargue el medidor de renglones.':!medir(v,d.tipo).ok?'Acorta tu petición para que quepa en el recuadro del formato.':'',
      pintar(box,ctx){
        const l=el('label'),n=el('textarea'),contador=el('p');l.className='tramite-campo';l.appendChild(el('span','Tu petición (puedes editarla)'));n.value=ctx.datos.peticion;l.appendChild(n);box.appendChild(l);box.appendChild(contador);contador.setAttribute('aria-live','polite');
        const actualizar=()=>{contador.textContent=font?`${medir(n.value,ctx.datos.tipo).renglones.length} de ${ctx.datos.tipo==='externo'?4:5} renglones${medir(n.value,ctx.datos.tipo).ok?'':'; acorta el texto para continuar'}`:'Cargando el medidor de renglones…'};
        n.oninput=()=>{ctx.cambiar(n.value);actualizar()};
        for(const [op,t] of [['inscribir','Proponer petición de reinscripción'],['tiempo','Proponer ampliación de tiempo']]){const b=el('button',t);b.type='button';b.className='sate-btn';b.onclick=()=>{n.value=plantilla(ctx.datos.tipo,ctx.datos.periodo,ctx.datos.filas,op);ctx.datos.propuesta=n.value;ctx.cambiar(n.value);actualizar()};box.appendChild(b)}
        actualizar();cargar().then(actualizar).catch(()=>{contador.textContent='No se pudo cargar el medidor. Recarga la página.'});
      }};
    const guias=[['paso','¿Qué pasó?'],['acciones','¿Qué has hecho para regularizarte?'],['compromiso','¿Qué te comprometes a hacer?']].map(([id,texto])=>({id,texto,sensible:true,pintar(box,ctx){
      const l=el('label'),n=el('textarea');l.className='tramite-campo';l.appendChild(el('span',texto));n.value=ctx.datos[id];l.appendChild(n);box.appendChild(l);
      n.oninput=()=>{const anterior=guias.map(c=>ctx.datos[c.id]).filter(Boolean).join('\n\n');ctx.cambiar(n.value);
        if(!ctx.datos.motivos||ctx.datos.motivos===anterior){ctx.datos.motivos=guias.map(c=>ctx.datos[c.id]).filter(Boolean).join('\n\n');const carta=box.querySelector('#dictamen-motivos');if(carta)carta.value=ctx.datos.motivos}
      };
    }}));
    const motivos={id:'motivos',texto:'Vista previa editable de tu carta de motivos',tipo:'textarea',sensible:true,requerido:true,ayuda:'Sugerimos una página. La carta puede ocupar varias páginas.',pintar(box,ctx){
      const b=el('button','Armar la carta con mis respuestas');b.type='button';b.className='sate-btn';const l=el('label'),n=el('textarea');n.id='dictamen-motivos';l.className='tramite-campo';l.appendChild(el('span',motivos.texto));n.value=ctx.datos.motivos;l.appendChild(n);box.appendChild(el('p',motivos.ayuda));box.appendChild(b);box.appendChild(l);
      b.onclick=()=>{n.value=guias.map(c=>ctx.datos[c.id]).filter(Boolean).join('\n\n');ctx.cambiar(n.value)};n.oninput=()=>ctx.cambiar(n.value);
    }};
    // Los motivos también pueden contener salud, familia o trabajo: jamás se guardan.
    const valores=d=>({...compartido(),...d,unidad:'UPIITA-IPN',fecha:new Date().toLocaleDateString('en-CA'),oficios:d.anteriores==='Sí'?d.oficios:'',...Object.fromEntries(['dependientes','hijos','embarazo','organo'].map(k=>[k,typeof d[k]==='string'&&d[k]?[d[k]]:[]])),...Object.fromEntries(['situacion','causas','anexos'].map(k=>[k,Array.isArray(d[k])?d[k]:[]]))});
    async function generar(d,preview=false){
      await cargar();if(!d.tipo)return PdfTramites.unir([],{texto:SATE.texto});
      if(!preview&&(!compartido()||!medir(d.peticion,d.tipo).ok||d.filas.length>8))throw new Error('Respuestas incompletas');
      const v=valores(d);if(preview){if(!medir(v.peticion,v.tipo).ok)v.peticion='';v.filas=v.filas.slice(0,8)}
      let etapa='formato';
      try{
        const formato=await PdfDictamen.generar({tipo:d.tipo,valores:v,pdfs:base.pdfs,texto});etapa='carta';
        const carta=await PdfDictamen.generar({tipo:'carta',valores:{...v,motivos:v.motivos||''},pdfs:base.pdfs,texto});etapa='unión e instrucciones';
        return await PdfTramites.unir([formato,carta],{texto:SATE.texto,vistoBueno:d.tipo==='interno'?'tu tutor académico':undefined});
      }catch(e){
        // La etapa y las cantidades permiten localizar la falla sin revelar las respuestas.
        console.error('Dictamen: generación fallida',{etapa,tipo:d.tipo,preview,materias:v.filas.length,renglones:medir(v.peticion,d.tipo).renglones.length,error:e.name});throw e;
      }
    }
    return {id:'dictamen',titulo:'Solicitud de dictamen',datos:{tipo:sugerencia.tipo,filas:pre.slice(0,8),periodo:periodo(alumno.periodo_actual||alumno.periodo||SATE_DATA.calendario?.periodo)},
      pasos:[{titulo:'¿Qué necesitas?',campos:[{id:'datos',texto:'Mis datos para trámites',resumen:()=>Object.values(compartido()||{}).filter(Boolean).join(' · '),validar:()=>!compartido()?'Confirma primero Mis datos para trámites.':'',pintar(box){box.appendChild(el('p',compartido()?Object.values(compartido()).filter(Boolean).join(' · '):'Confirma tus datos antes de continuar.'));const b=el('button','Mis datos para trámites');b.type='button';b.onclick=()=>SateTramites.misDatos(document.getElementById('sate-tramites'),()=>SATE.ir('tramites'));box.appendChild(b)}},tipo]},
        {titulo:'Tus materias',campos:[filas,{id:'periodo',texto:'Periodo que solicitas',requerido:true,validar:v=>!periodo(v)?'Escribe el periodo como YY/P, por ejemplo 27/1.':''}]},
        {titulo:'Tu situación',ayuda:d=>d.tipo==='externo'?'Estos datos no se guardan; si recargas la página tendrás que volver a llenarlos':'Revisa tus dictámenes anteriores y el ciclo en que ingresaste al IPN.',campos:camposSituacion},{titulo:'Tu petición y tus motivos',ayuda:'Las respuestas guía y la carta de motivos se mantienen solo en memoria.',campos:[peticion,{id:'propuesta',visible:()=>false},...guias,motivos]}],
      preparar(d,p){if(!inicializado){if(!d.ultimo)d.ultimo=alumno.ultimo_semestre||'';inicializado=true}if(p===3&&(!d.peticion||d.peticion===d.propuesta)){d.peticion=plantilla(d.tipo,d.periodo,d.filas);d.propuesta=d.peticion}},
      revisar(box){box.appendChild(el('p','Estos datos no se guardan; si recargas la página tendrás que volver a llenarlos'))},
      confirmacion:'Confirmo que la información es verdadera',descargaTexto:'Descargar mi solicitud (PDF)',archivo:d=>`dictamen-${d.tipo}-${compartido()?.boleta||''}.pdf`,generar:d=>generar(d),previsualizar:d=>generar(d,true)};
  }
  raiz.SateDictamen={definir,sugerir,pendientes,plantilla,medir,cargar};
  SateTramites.registrar(definir,'dictamen');
})(globalThis);
