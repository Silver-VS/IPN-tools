/* Bajas: asistente común y estampado local sobre los originales de Gestión Escolar.
   El límite y los plazos de baja temporal se fundamentan en el RGE, artículo 55. */
(function(raiz){
  const tx=(k,v)=>SATE.texto('sate.baja.'+k,v);
  const el=(tag,texto,clase)=>{const n=document.createElement(tag);if(texto!=null)n.textContent=texto;if(clase)n.className=clase;return n};
  const leer=k=>{try{return JSON.parse((window.IPNT?.almacen||localStorage).getItem(k)||'null')}catch{return null}};
  const identidad=()=>{const d=leer('hu.tramite.datos');return d?.confirmado?d.datos:null};
  const alumno=()=>window.SATE?.alumno?SATE.alumno():leer('saes.alumno');
  // Motivos por tipo: solo ids; el texto vive en es.toml (motivo_<id> y motivo_<id>_ayuda).
  const MOTIVOS={temporal:['salud','economico','laboral','personal','otro'],definitiva:['cambio_institucion','salud','economico','laboral','personal','otro']};
  const DATOS=['paterno','nombres','boleta','carrera','plan','correo'];
  const indice=p=>{const m=String(p||'').match(/^(?:20)?(\d{2})[\/-]?([12])$/);return m?+m[1]*2+(+m[2]-1):null};
  const deIndice=i=>String(Math.floor(i/2)).padStart(2,'0')+'/'+(i%2+1);
  const periodoValido=p=>/^\d{2}\/[12]$/.test(String(p||''));
  // El periodo en curso y los dos siguientes; sin dato del SAES el campo queda como texto libre.
  function periodos(){
    const base=indice(alumno()?.periodo_actual||raiz.SATE_DATA?.calendario?.periodo);
    return base==null?[]:[0,1,2].map(n=>deIndice(base+n));
  }
  function urlFormato(tipo){
    const b=raiz.SATE_DATA?.bajas,archivo=b?.[tipo];
    return b?.base&&archivo?b.base+encodeURIComponent(archivo):'';
  }
  function validarIdentidad(){
    const d=identidad();if(!d)return tx('identidad_falta');
    for(const k of DATOS){const e=SateTramites.validarDatos(k,d[k]||'',true);if(e)return e}
    return '';
  }
  function campoIdentidad(){
    return {id:'identidad',texto:tx('paso_datos'),validar:validarIdentidad,
      render:(caja,ctx)=>SateTramites.datosInline(caja,()=>{ctx.cambiar();ctx.repintar()},['celular']),
      revision(){
        const d=identidad()||{};
        return [[tx('r_nombre'),[d.nombres,d.paterno,d.materno].filter(Boolean).join(' ')],[tx('r_boleta'),d.boleta],[tx('r_carrera'),d.carrera],[tx('r_plan'),d.plan],[tx('r_correo'),d.correo],[tx('r_celular'),d.celular]]
          .filter(([,valor])=>valor).map(([texto,valor])=>({texto,valor}));
      }};
  }
  function campoAviso(tipo){
    return {id:'aviso',texto:tx('aviso_titulo'),revision:()=>[],render(caja){
      const aviso=el('aside',null,'tramite-aviso');aviso.appendChild(el('h4',tx('aviso_titulo')));
      const lista=el('ul');for(const n of [1,2,3])lista.appendChild(el('li',tx('aviso_'+tipo+'_'+n)));
      aviso.appendChild(lista);caja.appendChild(aviso);
      if(tipo==='temporal'&&raiz.SATE_DATA?.bajas?.reglamento){const a=el('a',tx('fundamento'));a.href=raiz.SATE_DATA.bajas.reglamento;a.target='_blank';a.rel='noopener';aviso.appendChild(a)}
    }};
  }
  function opciones(caja,ctx,id,leyenda,lista){
    const grupo=el('div',null,'tramite-opciones');grupo.setAttribute('role','radiogroup');grupo.setAttribute('aria-label',leyenda);
    for(const [valor,texto,ayuda] of lista){
      const etiqueta=el('label',null,'tramite-opcion'),radio=el('input');
      radio.type='radio';radio.name='baja-'+id;radio.value=valor;radio.checked=ctx.datos[id]===valor;radio.onchange=()=>{if(radio.checked)ctx.cambiar(valor)};
      const t=el('span',null,'tramite-opcion-t');t.appendChild(el('span',texto));if(ayuda)t.appendChild(el('small',ayuda));
      etiqueta.appendChild(radio);etiqueta.appendChild(t);grupo.appendChild(etiqueta);
    }
    caja.appendChild(grupo);
  }
  function campoMotivo(tipo){
    return {id:'motivo',texto:tx('r_motivo'),grupo:tx('grupo_motivo'),sensible:true,requerido:true,
      validar:v=>MOTIVOS[tipo].includes(v)?'':tx('motivo_error'),
      resumen:v=>v?tx('motivo_'+v):'',
      render(caja,ctx){opciones(caja,ctx,'motivo',tx('motivo_leyenda'),MOTIVOS[tipo].map(id=>[id,tx('motivo_'+id),tx('motivo_'+id+'_ayuda')]))}};
  }
  function campoExplicacion(){
    return {id:'explicacion',texto:tx('explicacion_texto'),tipo:'textarea',sensible:true,grupo:tx('grupo_motivo'),ayuda:tx('explicacion_ayuda'),
      validar:v=>String(v||'').length>600?tx('explicacion_error'):'',revision:v=>[{texto:tx('r_explicacion'),valor:v||tx('sin_explicacion')}]};
  }
  function campoPeriodo(tipo){
    const lista=periodos();
    return {id:'periodo',texto:tx('periodo_texto_'+tipo),grupo:tx('grupo_periodo'),requerido:true,
      validar:v=>periodoValido(v)?'':tx('periodo_error'),
      render(caja,ctx){
        const etiqueta=el('label',null,'tramite-campo'),entrada=lista.length?el('select'):el('input'),ayuda=el('small',tx('periodo_ayuda'));
        entrada.id='baja-periodo';
        if(lista.length)for(const p of lista){const o=el('option',p);o.value=p;entrada.appendChild(o)}
        else{entrada.type='text';entrada.placeholder='27/1'}
        entrada.value=ctx.datos.periodo||lista[0]||'';if(lista.length&&!ctx.datos.periodo)ctx.cambiar(entrada.value);
        entrada.onchange=entrada.oninput=()=>ctx.cambiar(entrada.value.trim());
        entrada.onblur=()=>{ctx.cambiar(entrada.value.trim())};
        etiqueta.appendChild(el('span',tx('periodo_texto_'+tipo)));etiqueta.appendChild(entrada);etiqueta.appendChild(ayuda);caja.appendChild(etiqueta);
      }};
  }
  function campoPeriodos(){
    return {id:'periodos',texto:tx('periodos_texto'),grupo:tx('grupo_periodo'),requerido:true,
      validar:v=>['1','2'].includes(String(v))?'':tx('periodos_error'),resumen:v=>tx('periodos_n',{n:+v||0}),
      render(caja,ctx){
        const etiqueta=el('label',null,'tramite-campo'),selector=el('select'),ayuda=el('small',tx('periodos_ayuda'));
        for(const n of ['1','2']){const o=el('option',tx('periodos_n',{n:+n}));o.value=n;selector.appendChild(o)}
        selector.value=ctx.datos.periodos||'1';if(!ctx.datos.periodos)ctx.cambiar('1');
        selector.onchange=()=>ctx.cambiar(selector.value);
        etiqueta.appendChild(el('span',tx('periodos_texto')));etiqueta.appendChild(selector);etiqueta.appendChild(ayuda);caja.appendChild(etiqueta);
      }};
  }
  function definir(tipo){
    const id='baja_'+tipo,url=urlFormato(tipo);
    let avisoPdf;
    const faltante=d=>validarIdentidad()||(!raiz.SATE_DATA?.bajas?.pdfs?.[tipo]?tx('sin_formato'):'')||(!MOTIVOS[tipo].includes(d.motivo)?tx('motivo_error'):'')||(!periodoValido(d.periodo)?tx('periodo_error'):'')||(tipo==='temporal'&&!['1','2'].includes(String(d.periodos))?tx('periodos_error'):'')||(String(d.explicacion||'').length>600?tx('explicacion_error'):'');
    async function generar(d){
      if(avisoPdf)avisoPdf.textContent='';
      try{
        const falta=faltante(d);if(falta)throw new Error(falta);
        await cargar();
        const periodos=tipo==='temporal'?Array.from({length:+d.periodos},(_,i)=>deIndice(indice(d.periodo)+i)).join(', '):d.periodo;
        return await PdfBajas.generar({tipo,pdfs:raiz.SATE_DATA.bajas.pdfs,texto:tx,valores:{...identidad(),fecha:new Date().toLocaleDateString('es-MX'),periodos,
          motivos:[...(tipo==='definitiva'?[tx('pdf_periodo',{periodo:d.periodo})]:[]),tx('motivo_'+d.motivo),d.explicacion].filter(Boolean).join('. ')}});
      }catch(error){
        // El asistente común muestra un fallo genérico; conservar aquí la explicación concreta del PDF.
        if(avisoPdf)avisoPdf.textContent=error.message;throw error;
      }
    }
    return {id,titulo:tx('titulo_'+tipo),lead:tx('lead_'+tipo),requisitos:()=>[tx('revision_ayuda')],volver:true,revisarTitulo:tx('revisar_titulo'),revisionAyuda:tx('revision_ayuda'),
      datos:{periodos:'1'},
      pasos:[
        {titulo:tx('paso_datos'),ayuda:tx('paso_datos_ayuda'),campos:[campoIdentidad()]},
        {titulo:tx('paso_motivo'),ayuda:tx('paso_motivo_ayuda_'+tipo),campos:[campoAviso(tipo),campoMotivo(tipo),campoExplicacion(),campoPeriodo(tipo),...(tipo==='temporal'?[campoPeriodos()]:[])]}
      ],
      descargaTexto:tx('descargar'),archivo:id+'.pdf',faltante,generar,previsualizar:generar,
      revisar(pantalla){
        avisoPdf=el('p');avisoPdf.setAttribute('role','status');pantalla.appendChild(avisoPdf);
        const oficial=el('section',null,'tramite-oficial');
        oficial.appendChild(el('h4',tx('oficial_titulo')));
        oficial.appendChild(el('p',tx(url?'oficial_ayuda':'sin_formato')));
        if(url){const enlace=el('a',tx('abrir_formato'),'sate-btn');enlace.href=url;enlace.target='_blank';enlace.rel='noopener';oficial.appendChild(enlace)}
        pantalla.appendChild(oficial);
      }};
  }
  let carga;
  function cargar(){
    if(!carga)carga=(async()=>{
      await SATE.script('../assets/vendor/pdf-lib.min.js');
      await SATE.script('../tramites/pdf-bajas.js');
    })().catch(error=>{carga=null;console.error('Bajas: carga de PDF fallida',{etapa:'biblioteca',error:error.name});throw error});
    return carga;
  }
  // La definición se arma al abrir para consultar los textos y periodos vigentes.
  for(const tipo of ['temporal','definitiva'])SateTramites.registrar(()=>definir(tipo),'baja_'+tipo);
  raiz.SateBajas={definir,periodos,urlFormato,validarIdentidad,MOTIVOS};
})(globalThis);
