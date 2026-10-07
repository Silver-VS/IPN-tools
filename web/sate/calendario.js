/* Vista diferida; fechas y fuentes compartidas con Situación. */
(function(){
  const api=SATE.calendario, tx=(k,v)=>SATE.texto('sate.calendario.'+k,v);
  const el=(tag,texto,clase)=>{const n=document.createElement(tag);if(texto!=null)n.textContent=texto;if(clase)n.className=clase;return n};
  const svg=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n};
  const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const date=s=>new Date(s+'T00:00:00');
  // UTC solo para distancias entre fechas civiles: los cambios de horario no alteran las pistas.
  const numero=s=>Date.parse(s+'T00:00:00Z')/86400000;
  const sumar=(s,n)=>{const d=date(s);d.setDate(d.getDate()+n);return iso(d)};
  const fecha=s=>date(s).toLocaleDateString('es-MX',{dateStyle:'long'});
  const rango=e=>e.desde===e.hasta?fecha(e.desde):tx('rango',{desde:fecha(e.desde),hasta:fecha(e.hasta)});
  const delDia=(s,eventos)=>eventos.filter(e=>e.desde<=s&&e.hasta>=s);
  let vista='periodo';try{if(localStorage.getItem('hu.cal.vista')==='mes')vista='mes'}catch{}
  let mes=null, foco=null, modo='mes', semana=null, periodo=null, planeadoAnterior=null, detalleActual=null, panel;
  const seleccion=new Set(api.categorias);
  let actualizarSeleccion=()=>{};
  function boton(texto,accion,id){const b=el('button',texto,'sate-btn');b.type='button';if(id)b.id=id;b.onclick=accion;return b}
  function redibujar(id){mostrar();if(id)document.getElementById(id)?.focus()}
  function segmento(opciones,actual,nombre,cambiar){
    const g=el('div',null,'calendario-segmento');g.setAttribute('role','group');g.setAttribute('aria-label',tx(nombre));
    opciones.forEach(([id,clave])=>{const b=boton(tx(clave),()=>{cambiar(id);redibujar('cal-'+nombre+'-'+id)},'cal-'+nombre+'-'+id);b.setAttribute('aria-pressed',id===actual);g.appendChild(b)});return g;
  }
  function pintarDetalle(){
    actualizarSeleccion();
    panel.replaceChildren();const titulo=el('h3',detalleActual?.titulo||tx('detalle'));titulo.id='cal-detalle-titulo';titulo.tabIndex=-1;panel.appendChild(titulo);
    if(!detalleActual){panel.appendChild(el('p',tx('sin_eventos')));return}
    if(!detalleActual.eventos.length)panel.appendChild(el('p',tx('sin_eventos')));
    detalleActual.eventos.forEach(e=>{const s=el('section',null,'calendario-detalle-evento');s.setAttribute('data-categoria',e.categoria);s.appendChild(el('h4',e.titulo));s.appendChild(el('p',tx('categoria_'+e.categoria),'calendario-categoria'));s.appendChild(el('p',rango(e)));if(e.nota||e.texto)s.appendChild(el('p',e.nota||e.texto));s.appendChild(el('p',tx('fuente',{fuente:e.fuente}),'calendario-fuente'));panel.appendChild(s)});
  }
  function abrir(eventos,titulo){detalleActual={eventos,titulo};pintarDetalle();document.getElementById('cal-detalle-titulo').focus({preventScroll:true});panel.scrollIntoView?.({block:'nearest'})}
  function periodos(eventos){return [...new Set(eventos.map(e=>e.periodo).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))}
  function meses(eventos){
    if(!eventos.length)return [];
    let ini=eventos.reduce((s,e)=>e.desde<s?e.desde:s,eventos[0].desde).slice(0,7);
    const fin=eventos.reduce((s,e)=>e.hasta>s?e.hasta:s,eventos[0].hasta).slice(0,7), salida=[];
    while(ini<=fin){salida.push(ini);const d=date(ini+'-01');d.setMonth(d.getMonth()+1);ini=iso(d).slice(0,7)}return salida;
  }
  // El último día es inclusivo: una pista se reutiliza cuando ha terminado el proceso anterior.
  function pistas(eventos){
    const finales=[];return [...eventos].sort((a,b)=>a.desde.localeCompare(b.desde)||b.hasta.localeCompare(a.hasta)).map(e=>{let pista=finales.findIndex(fin=>fin<e.desde);if(pista<0)pista=finales.length;finales[pista]=e.hasta;return {e,pista}});
  }
  function periodoGrafico(contenido,todos,eventos){
    const desde=todos.reduce((s,e)=>e.desde<s?e.desde:s,todos[0].desde), hasta=todos.reduce((s,e)=>e.hasta>s?e.hasta:s,todos[0].hasta);
    const total=numero(hasta)-numero(desde)+1, items=pistas(eventos), n=Math.max(1,...items.map(i=>i.pista+1));
    const exterior=125+n*18, centro=exterior+45, tam=centro*2, ang=s=>-Math.PI/2+(numero(s)-numero(desde))/total*Math.PI*2;
    const punto=(a,r)=>[centro+Math.cos(a)*r,centro+Math.sin(a)*r];
    const linea=(root,a,r1,r2,clase)=>{const p=punto(a,r1),q=punto(a,r2);root.appendChild(svg('line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],class:clase}))};
    const anillo=svg('svg',{viewBox:`0 0 ${tam} ${tam}`,class:'calendario-anillo','aria-label':tx('grafico_periodo',{periodo}),role:'group'});
    const banda=svg('svg',{viewBox:`0 0 640 ${90+n*30}`,class:'calendario-banda','aria-label':tx('grafico_periodo',{periodo}),role:'group'});
    const x=s=>24+(numero(s)-numero(desde))/total*592;
    if(items.length)anillo.appendChild(svg('circle',{cx:centro,cy:centro,r:exterior,class:'calendario-pista'}));
    for(let p=0;p<n&&items.length;p++)banda.appendChild(svg('line',{x1:24,x2:616,y1:55+p*30,y2:55+p*30,class:'calendario-pista'}));
    for(let s=desde;s<=hasta;s=sumar(s,1)){
      if(date(s).getDay()===1){linea(anillo,ang(s),exterior+8,exterior+13,'calendario-tick');banda.appendChild(svg('line',{x1:x(s),x2:x(s),y1:34,y2:40,class:'calendario-tick'}))}
      if(s===desde||s.endsWith('-01')){
        linea(anillo,ang(s),exterior+8,exterior+19,'calendario-tick');
        const finMes=iso(new Date(date(s).getFullYear(),date(s).getMonth()+1,1)), medio=sumar(s,Math.floor((Math.min(numero(hasta)+1,numero(finMes))-numero(s))/2));
        const p=punto(ang(medio),exterior+29), label=date(s).toLocaleDateString('es-MX',{month:'short'});
        const t=svg('text',{x:p[0],y:p[1],'text-anchor':'middle',class:'calendario-svg-mes'});t.textContent=label;anillo.appendChild(t);
        const b=svg('text',{x:x(medio),y:22,'text-anchor':'middle',class:'calendario-svg-mes'});b.textContent=label;banda.appendChild(b);
      }
    }
    const t=svg('text',{x:centro,y:centro-10,'text-anchor':'middle',class:'calendario-svg-periodo'});t.textContent=tx('periodo_nombre',{periodo});anillo.appendChild(t);
    const subt=svg('text',{x:centro,y:centro+17,'text-anchor':'middle',class:'calendario-svg-mes'});subt.textContent=tx('semanas',{n:Math.ceil(total/7)});anillo.appendChild(subt);
    const marcas=[], filas=[];let bajoMouse=null, bajoFoco=null;
    const destacar=()=>{const activo=bajoMouse||bajoFoco;for(const {e,nodo} of [...marcas,...filas]){nodo.setAttribute('data-resaltado',e===activo);nodo.setAttribute('data-atenuado',!!activo&&e!==activo)}};
    items.forEach(({e,pista})=>{
      const r=exterior-pista*18, a=ang(e.desde), b=ang(sumar(e.hasta,1))-.008, puntual=e.desde===e.hasta;
      const p=punto(a+.004,r),q=punto(b,r), marca=puntual?svg('circle',{cx:p[0],cy:p[1],r:6}):svg('path',{d:`M ${p[0]} ${p[1]} A ${r} ${r} 0 ${b-a>Math.PI?1:0} 1 ${q[0]} ${q[1]}`});
      const y=55+pista*30, lineal=puntual?svg('circle',{cx:x(e.desde),cy:y,r:7}):svg('line',{x1:x(e.desde),x2:x(sumar(e.hasta,1)),y1:y,y2:y});
      for(const m of [marca,lineal]){m.setAttribute('class','calendario-arco');m.setAttribute('data-categoria',e.categoria);m.setAttribute('data-pista',pista);m.setAttribute('data-desde',e.desde);m.setAttribute('data-hasta',e.hasta);m.setAttribute('tabindex','0');m.setAttribute('role','button');m.setAttribute('aria-label',e.titulo+'. '+rango(e));const title=svg('title');title.textContent=e.titulo+'. '+rango(e);m.appendChild(title);m.onclick=()=>abrir([e],tx('detalle'));m.onkeydown=k=>{if(k.key==='Enter'||k.key===' '){k.preventDefault();m.onclick()}}}
      for(const m of [marca,lineal]){marcas.push({e,nodo:m});m.onmouseenter=()=>{bajoMouse=e;destacar()};m.onmouseleave=()=>{bajoMouse=null;destacar()};m.onfocus=()=>{bajoFoco=e;destacar()};m.onblur=()=>{bajoFoco=null;destacar()}}
      anillo.appendChild(marca);banda.appendChild(lineal);
    });
    if(api.hoy()>=desde&&api.hoy()<=hasta){
      linea(anillo,ang(api.hoy()),90,exterior+19,'calendario-aguja');const p=punto(ang(api.hoy()),85), h=svg('text',{x:p[0],y:p[1],'text-anchor':'middle',class:'calendario-svg-hoy'});h.textContent=tx('hoy');anillo.appendChild(h);
      banda.appendChild(svg('line',{x1:x(api.hoy()),x2:x(api.hoy()),y1:30,y2:68+(n-1)*30,class:'calendario-aguja'}));const hb=svg('text',{x:Math.max(42,Math.min(595,x(api.hoy()))),y:90+(n-1)*30,'text-anchor':'middle',class:'calendario-svg-hoy'});hb.textContent=tx('hoy');banda.appendChild(hb);
    }
    contenido.appendChild(el('p',tx('rango',{desde:fecha(desde),hasta:fecha(hasta)}),'calendario-rango'));contenido.appendChild(anillo);contenido.appendChild(banda);
    const leyenda=el('ul',null,'calendario-categorias');leyenda.setAttribute('aria-label',tx('categorias_presentes'));
    api.categorias.filter(c=>eventos.some(e=>e.categoria===c)).forEach(c=>{const li=el('li',null);li.setAttribute('data-categoria',c);const muestra=el('span',null,'calendario-muestra');muestra.setAttribute('aria-hidden','true');li.appendChild(muestra);li.appendChild(el('span',tx('categoria_'+c)));leyenda.appendChild(li)});contenido.appendChild(leyenda);
    const procesos=el('section',null,'calendario-lista');procesos.appendChild(el('h3',tx('procesos')));const lista=el('ul',null,'calendario-procesos');
    items.forEach(({e})=>{const li=el('li'), b=boton('',()=>abrir([e],tx('detalle')));b.className='calendario-proceso';b.setAttribute('data-categoria',e.categoria);b.appendChild(el('span',e.titulo));b.appendChild(el('small',rango(e)));filas.push({e,nodo:b});li.appendChild(b);lista.appendChild(li)});procesos.appendChild(lista);
    actualizarSeleccion=()=>{for(const {e,nodo} of [...marcas,...filas])nodo.setAttribute('aria-pressed',!!detalleActual?.eventos.some(d=>d.titulo===e.titulo&&d.desde===e.desde&&d.hasta===e.hasta&&d.periodo===e.periodo))};
    if(!eventos.length)procesos.appendChild(el('p',tx('sin_eventos')));return procesos;
  }
  function mesGrafico(contenido,todos,eventos){
    const disponibles=meses(todos);if(!disponibles.includes(mes))mes=disponibles.find(m=>m>=api.hoy().slice(0,7))||disponibles.at(-1);
    if(!semana)semana=api.hoy().startsWith(mes)?api.hoy():mes+'-01';
    const primero=date(mes+'-01'), ultimo=iso(new Date(primero.getFullYear(),primero.getMonth()+1,0));
    const inicio=modo==='semana'?sumar(semana,-((date(semana).getDay()+6)%7)):sumar(mes+'-01',-((primero.getDay()+6)%7));
    const fin=modo==='semana'?sumar(inicio,6):sumar(ultimo,6-(date(ultimo).getDay()+6)%7);
    const nav=el('div',null,'calendario-nav'), titulo=el('h3',tx('titulo_mes',{mes:primero.toLocaleDateString('es-MX',{month:'long'}),anio:primero.getFullYear()}));titulo.id='cal-mes';titulo.setAttribute('aria-live','polite');
    const mover=salto=>{if(modo==='mes'){mes=disponibles[disponibles.indexOf(mes)+salto];semana=null}else{semana=sumar(semana,7*salto);mes=semana.slice(0,7);if(mes<disponibles[0])mes=disponibles[0];if(mes>disponibles.at(-1))mes=disponibles.at(-1)}foco=null;detalleActual=null;redibujar(salto<0?'cal-anterior':'cal-proximo')};
    const prev=boton(tx('flecha_anterior'),()=>mover(-1),'cal-anterior'), next=boton(tx('flecha_proxima'),()=>mover(1),'cal-proximo');prev.setAttribute('aria-label',tx(modo==='mes'?'anterior':'semana_anterior'));next.setAttribute('aria-label',tx(modo==='mes'?'proximo':'semana_proxima'));
    prev.disabled=modo==='mes'?disponibles.indexOf(mes)===0:sumar(inicio,-1)<disponibles[0]+'-01';next.disabled=modo==='mes'?disponibles.indexOf(mes)===disponibles.length-1:sumar(inicio,7).slice(0,7)>disponibles.at(-1);
    const hoy=boton(tx('boton_hoy'),()=>{mes=api.hoy().slice(0,7);semana=api.hoy();foco=api.hoy();detalleActual=null;redibujar('cal-hoy')},'cal-hoy');hoy.disabled=!disponibles.includes(api.hoy().slice(0,7));
    nav.appendChild(titulo);nav.appendChild(prev);nav.appendChild(next);nav.appendChild(hoy);contenido.appendChild(nav);contenido.appendChild(segmento([['mes','mes'],['semana','semana']],modo,'escala',id=>{modo=id;if(id==='semana')semana=foco||mes+'-01';detalleActual=null}));
    if(modo==='semana')contenido.appendChild(el('p',tx('rango',{desde:fecha(inicio),hasta:fecha(fin)}),'calendario-rango'));
    const grid=el('div',null,'calendario-mes');grid.setAttribute('aria-labelledby','cal-mes');const head=el('div',null,'calendario-dias-semana');for(let i=0;i<7;i++)head.appendChild(el('span',new Date(2026,9,5+i).toLocaleDateString('es-MX',{weekday:'short'})));grid.appendChild(head);
    const botones=[];if(!foco||foco<inicio||foco>fin)foco=api.hoy()>=inicio&&api.hoy()<=fin?api.hoy():inicio<mes+'-01'&&mes+'-01'<=fin?mes+'-01':inicio;
    for(let s=inicio;s<=fin;s=sumar(s,7)){
      const finSemana=sumar(s,6), fila=el('div',null,'calendario-semana'), fechas=el('div',null,'calendario-fechas');
      const items=pistas(eventos.filter(e=>e.desde<=finSemana&&e.hasta>=s).map(e=>({...e,original:e,desde:e.desde<s?s:e.desde,hasta:e.hasta>finSemana?finSemana:e.hasta})));
      for(let i=0;i<7;i++){
        const f=sumar(s,i), es=delDia(f,eventos), celda=el('div',null,'calendario-celda'), b=boton(String(date(f).getDate()),()=>{foco=f;botones.forEach(n=>n.tabIndex=n===b?0:-1);abrir(es,fecha(f))});b.className='calendario-dia';b.tabIndex=f===foco?0:-1;b.setAttribute('data-fecha',f);b.setAttribute('aria-label',fecha(f)+'. '+(es.length?es.map(e=>e.titulo).join('. '):tx('sin_eventos')));
        if(f===api.hoy()){b.setAttribute('aria-current','date');b.setAttribute('aria-label',tx('hoy')+'. '+b.getAttribute('aria-label'))}if(!f.startsWith(mes))celda.className+=' calendario-fuera';if(es.some(e=>e.categoria==='feriado'))celda.className+=' calendario-feriado';
        b.onkeydown=k=>{const idx=botones.indexOf(b), saltos={ArrowRight:1,ArrowLeft:-1,ArrowDown:7,ArrowUp:-7,Home:-i,End:6-i};if(k.key in saltos){k.preventDefault();const dest=botones[Math.max(0,Math.min(botones.length-1,idx+saltos[k.key]))];botones.forEach(n=>n.tabIndex=-1);dest.tabIndex=0;foco=dest.getAttribute('data-fecha');dest.focus()}};botones.push(b);celda.appendChild(b);fechas.appendChild(celda);
      }fila.appendChild(fechas);const barras=el('div',null,'calendario-barras');
      items.filter(it=>it.pista<3).forEach(({e,pista})=>{const original=e.original, b=boton(original.titulo,()=>abrir([original],tx('detalle')));b.className='calendario-pill';b.setAttribute('data-categoria',e.categoria);b.setAttribute('data-continua',original.desde!==original.hasta);b.setAttribute('aria-label',original.titulo+'. '+rango(original));b.title=original.titulo+'. '+rango(original);b.style.gridColumn=`${numero(e.desde)-numero(s)+1} / ${numero(e.hasta)-numero(s)+2}`;b.style.gridRow=pista+1;barras.appendChild(b)});fila.appendChild(barras);
      const mas=el('div',null,'calendario-mas');for(let i=0;i<7;i++){const f=sumar(s,i), count=items.filter(it=>it.pista>=3&&it.e.desde<=f&&it.e.hasta>=f).length;if(count){const b=boton(tx('mas',{n:count}),()=>abrir(delDia(f,eventos),fecha(f)));b.setAttribute('aria-label',fecha(f)+'. '+tx('mas',{n:count}));b.style.gridColumn=i+1;mas.appendChild(b)}}fila.appendChild(mas);grid.appendChild(fila);
    }contenido.appendChild(grid);if(!eventos.some(e=>e.desde<=fin&&e.hasta>=inicio))contenido.appendChild(el('p',tx('sin_eventos')));
  }
  function mostrar(){
    const box=document.getElementById('sate-calendario'), eventos=api.eventos(), opciones=periodos(eventos);actualizarSeleccion=()=>{};box.replaceChildren();box.appendChild(el('h2',SATE.texto('sate.pestana.calendario.titulo')));
    if(!eventos.length){box.appendChild(el('p',tx('sin_eventos')));return}
    const planeado=typeof perMeta==='function'?perName(perMeta()):DATA.calendario?.periodo;
    if(planeado!==planeadoAnterior||!opciones.includes(periodo)){periodo=opciones.includes(planeado)?planeado:opciones.includes(DATA.calendario?.periodo)?DATA.calendario.periodo:opciones.at(-1);planeadoAnterior=planeado;mes=null;semana=null;detalleActual=null}
    const solicitado=api.procesoPendiente;
    if(solicitado){
      periodo=solicitado.periodo;mes=solicitado.desde.slice(0,7);semana=solicitado.desde;foco=solicitado.desde;seleccion.add(solicitado.categoria);
      detalleActual={eventos:[solicitado],titulo:tx('detalle')};api.procesoPendiente=null;
    }
    box.appendChild(el('p',tx('instrucciones'),'calendario-intro'));
    const controles=el('div',null,'calendario-controles');controles.appendChild(segmento([['periodo','vista_periodo'],['mes','vista_mes']],vista,'vista',id=>{vista=id;IPNT.set('hu.cal.vista',id);detalleActual=null}));
    const label=el('label',tx('periodo'),'calendario-selector'), select=el('select');select.id='cal-periodo';select.setAttribute('aria-label',tx('periodo'));opciones.forEach(p=>{const o=el('option',tx('periodo_nombre',{periodo:p}));o.value=p;o.selected=p===periodo;select.appendChild(o)});select.onchange=()=>{periodo=select.value;mes=null;semana=null;detalleActual=null;redibujar('cal-periodo')};label.appendChild(select);controles.appendChild(label);box.appendChild(controles);
    const filtros=el('fieldset',null,'calendario-filtros');filtros.appendChild(el('legend',tx('filtros')));api.categorias.forEach(c=>{const label=el('label',null,'calendario-filtro');label.setAttribute('data-categoria',c);const check=el('input');check.type='checkbox';check.id='cal-filtro-'+c;check.checked=seleccion.has(c);check.onchange=()=>{check.checked?seleccion.add(c):seleccion.delete(c);detalleActual=null;redibujar(check.id)};label.appendChild(check);label.appendChild(el('span',tx('categoria_'+c)));filtros.appendChild(label)});box.appendChild(filtros);
    const todos=eventos.filter(e=>e.periodo===periodo), visibles=todos.filter(e=>seleccion.has(e.categoria)), layout=el('div',null,'calendario-layout'), contenido=el('div',null,'calendario-contenido');panel=el('aside',null,'calendario-detalle');panel.setAttribute('aria-labelledby','cal-detalle-titulo');layout.appendChild(contenido);layout.appendChild(panel);box.appendChild(layout);
    if(vista==='periodo')box.appendChild(periodoGrafico(contenido,todos,visibles));else mesGrafico(contenido,todos,visibles);
    if(!detalleActual){
      const ordenados=[...visibles].sort((a,b)=>a.desde.localeCompare(b.desde)||a.hasta.localeCompare(b.hasta));
      // Si terminó el periodo, conservar un detalle útil sin inventar fechas futuras.
      const proximo=ordenados.find(e=>e.desde>api.hoy())||ordenados.find(e=>e.hasta>=api.hoy())||ordenados.at(-1);
      detalleActual={eventos:proximo?[proximo]:[],titulo:tx('detalle')};
    }
    pintarDetalle();box.appendChild(el('p',tx(vista==='periodo'?'leyenda_periodo':'leyenda_mes'),'calendario-leyenda'));
    if(solicitado)document.getElementById('cal-detalle-titulo').focus();
  }
  SATE.pestana('calendario',{montar(){},mostrar,ocultar(){}});
})();
