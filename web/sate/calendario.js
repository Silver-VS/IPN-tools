/* Vista diferida: la fuente y la consulta de próximos eventos viven en el núcleo. */
(function(){
  const api=SATE.calendario, tx=(k,v)=>SATE.texto('sate.calendario.'+k,v);
  const el=(tag,texto,clase)=>{const n=document.createElement(tag);if(texto!=null)n.textContent=texto;if(clase)n.className=clase;return n};
  const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const fecha=s=>new Date(s+'T00:00:00').toLocaleDateString('es-MX',{dateStyle:'long'});
  let mes=null, foco=null, seleccion=new Set(api.categorias);
  const delDia=(s,eventos)=>eventos.filter(e=>e.desde<=s&&e.hasta>=s);
  function detalle(s){
    const cuerpo=el('div'), eventos=delDia(s,api.eventos().filter(e=>seleccion.has(e.categoria)));
    if(!eventos.length)cuerpo.appendChild(el('p',tx('sin_eventos')));
    eventos.forEach(e=>{const seccion=el('section');seccion.appendChild(el('h3',e.titulo));seccion.appendChild(el('p',tx('categoria_'+e.categoria),'calendario-marca'));seccion.appendChild(el('p',fecha(e.desde)+(e.desde!==e.hasta?' / '+fecha(e.hasta):'')));if(e.nota||e.texto)seccion.appendChild(el('p',e.nota||e.texto));seccion.appendChild(el('p',tx('fuente',{fuente:e.fuente})));cuerpo.appendChild(seccion)});
    SateUI.modal(fecha(s),cuerpo);
  }
  function meses(){
    const eventos=api.eventos(), planeado=typeof perMeta==='function'?perName(perMeta()):DATA.calendario?.periodo;
    const anterior=typeof perIdx==='function'?perName(perIdx(planeado)-1):null;
    const relevantes=eventos.filter(e=>e.periodo===planeado||e.periodo===anterior);
    // Sin fechas confirmadas de un periodo, se conserva acceso a los avisos disponibles.
    const lista=relevantes.length?relevantes:eventos;
    if(!lista.length)return [];
    let ini=lista.reduce((s,e)=>e.desde<s?e.desde:s,lista[0].desde).slice(0,7);
    const fin=lista.reduce((s,e)=>e.hasta>s?e.hasta:s,lista[0].hasta).slice(0,7), salida=[];
    while(ini<=fin){salida.push(ini);const d=new Date(ini+'-01T00:00:00');d.setMonth(d.getMonth()+1);ini=iso(d).slice(0,7)}
    return salida;
  }
  function mostrar(){
    const box=document.getElementById('sate-calendario'), disponibles=meses();box.replaceChildren();
    box.appendChild(el('h2',SATE.texto('sate.pestana.calendario.titulo')));
    if(!disponibles.length){box.appendChild(el('p',tx('sin_eventos')));return}
    if(!disponibles.includes(mes))mes=disponibles.find(m=>m>=api.hoy().slice(0,7))||disponibles.at(-1);
    box.appendChild(el('p',tx('instrucciones')));
    const filtros=el('div',null,'calendario-filtros');filtros.setAttribute('role','group');filtros.setAttribute('aria-label',tx('filtros'));
    api.categorias.forEach(c=>{const b=el('button',tx('categoria_'+c),'sate-btn calendario-marca');b.type='button';b.setAttribute('data-categoria',c);b.setAttribute('aria-pressed',seleccion.has(c));b.onclick=()=>{seleccion.has(c)?seleccion.delete(c):seleccion.add(c);mostrar();document.getElementById('cal-filtro-'+c).focus()};b.id='cal-filtro-'+c;filtros.appendChild(b)});box.appendChild(filtros);
    const nav=el('div',null,'calendario-nav'), titulo=el('h3',new Date(mes+'-01T00:00:00').toLocaleDateString('es-MX',{month:'long',year:'numeric'}));titulo.id='cal-mes';titulo.setAttribute('aria-live','polite');
    for(const [salto,clave] of [[-1,'anterior'],[1,'proximo']]){const b=el('button',tx(clave),'sate-btn');b.type='button';b.id='cal-'+clave;b.disabled=!disponibles[disponibles.indexOf(mes)+salto];b.onclick=()=>{mes=disponibles[disponibles.indexOf(mes)+salto];foco=null;mostrar();document.getElementById(b.id).focus()};nav.appendChild(b);if(salto===-1)nav.appendChild(titulo)}box.appendChild(nav);
    const eventos=api.eventos().filter(e=>seleccion.has(e.categoria)), tabla=el('table',null,'calendario-mes');tabla.setAttribute('aria-labelledby','cal-mes');
    const head=el('thead'), fila=el('tr');for(let i=0;i<7;i++){const th=el('th',new Date(2026,9,5+i).toLocaleDateString('es-MX',{weekday:'short'}));th.setAttribute('scope','col');fila.appendChild(th)}head.appendChild(fila);tabla.appendChild(head);
    const body=el('tbody'), primero=new Date(mes+'-01T00:00:00'), dias=new Date(primero.getFullYear(),primero.getMonth()+1,0).getDate(), offset=(primero.getDay()+6)%7;
    const botones=[];if(!foco||!foco.startsWith(mes))foco=api.hoy().startsWith(mes)?api.hoy():mes+'-01';
    for(let i=0;i<Math.ceil((offset+dias)/7)*7;i++){
      if(i%7===0)body.appendChild(el('tr'));const td=el('td');body.children[body.children.length-1].appendChild(td);const dia=i-offset+1;if(dia<1||dia>dias)continue;
      const s=mes+'-'+String(dia).padStart(2,'0'), es=delDia(s,eventos), b=el('button',null,'calendario-dia');b.type='button';b.tabIndex=s===foco?0:-1;b.setAttribute('data-fecha',s);b.appendChild(el('b',dia));
      if(s===api.hoy()){b.setAttribute('aria-current','date');b.appendChild(el('small',tx('hoy')))}
      if(es.some(e=>e.categoria==='feriado'))td.className='calendario-feriado';
      es.forEach(e=>{const marca=el('span',null,'calendario-marca');marca.appendChild(el('span',tx('categoria_'+e.categoria)));marca.appendChild(el('span',' · '+e.titulo,'calendario-evento-titulo'));marca.setAttribute('data-categoria',e.categoria);marca.setAttribute('data-continua',e.desde!==e.hasta);b.appendChild(marca)});
      b.setAttribute('aria-label',fecha(s)+'. '+(s===api.hoy()?tx('hoy')+'. ':'')+(es.length?es.map(e=>tx('categoria_'+e.categoria)+': '+e.titulo).join('. '):tx('sin_eventos')));
      b.onclick=()=>detalle(s);b.onkeydown=e=>{let indice=botones.indexOf(b), destino;
        if(e.key==='ArrowRight')destino=indice+1;if(e.key==='ArrowLeft')destino=indice-1;if(e.key==='ArrowDown')destino=indice+7;if(e.key==='ArrowUp')destino=indice-7;
        if(e.key==='Home')destino=Math.max(0,indice-(i%7));if(e.key==='End')destino=Math.min(dias-1,indice+6-(i%7));
        if(destino!=null){e.preventDefault();const siguiente=botones[Math.max(0,Math.min(dias-1,destino))];botones.forEach(n=>n.tabIndex=-1);siguiente.tabIndex=0;foco=siguiente.getAttribute('data-fecha');siguiente.focus()}};
      botones.push(b);td.appendChild(b);
    }tabla.appendChild(body);box.appendChild(tabla);
    const leyenda=el('p',tx('leyenda'));leyenda.className='calendario-leyenda';box.appendChild(leyenda);
    if(!eventos.some(e=>e.desde.slice(0,7)<=mes&&e.hasta.slice(0,7)>=mes))box.appendChild(el('p',tx('sin_eventos')));
  }
  SATE.pestana('calendario',{montar(){},mostrar,ocultar(){SateUI.cerrarModal()}});
})();
