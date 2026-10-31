/* Catálogo común: los ámbitos autorizados se resuelven desde la capacidad en el build. */
(function (raiz) {
  'use strict';
  function crear(contenido, opciones) {
    const t = (k, v) => opciones.texto('sate.actividades.' + k, v);
    const h = (tag, attrs, hijos) => {
      const nodo = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs || {})) {
        if (k === 'texto') nodo.textContent = v;
        else nodo.setAttribute(k, v);
      }
      for (const hijo of hijos || []) nodo.appendChild(hijo);
      return nodo;
    };
    const secciones = contenido?.secciones || [];
    if (!secciones.length) return h('p', {texto:t('sin_elementos')});
    let seleccion = Number(opciones.seccion) || 0;
    if (!secciones[seleccion]) seleccion = 0;
    let ambito = '';
    const titulo = s => opciones.texto(s.tituloClave, {unidad:s.items[0]?.unidad});
    const zona = h('section', {'class':'sate-actividades', 'aria-label':t('titulo')});
    const rueda = h('div', {'class':'act-rueda'});
    const panel = h('section', {'class':'act-panel', id:'actividades-panel', 'aria-label':t('detalle')});
    const encabezado = h('h2', {id:'actividades-seccion'});
    const contador = h('p', {'class':'act-conteo', role:'status', 'aria-live':'polite', 'aria-atomic':'true'});
    const filtro = h('select', {id:'actividades-unidad'}, [h('option', {value:'', texto:t('todos')})]);
    for (const unidad of new Set(secciones.flatMap(s => s.items.map(a => a.unidad)))) {
      filtro.appendChild(h('option', {value:unidad, texto:unidad}));
    }
    const lista = h('div', {'class':'act-lista'});
    panel.append(h('header', {'class':'act-cabecera'}, [encabezado, contador,
      h('label', {'class':'act-filtro', for:'actividades-unidad'}, [h('span', {texto:t('unidad')}), filtro])]), lista);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = (tag, attrs, texto) => {
      const n = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      if (texto != null) n.textContent = texto;
      return n;
    };
    const dibujo = svg('svg', {viewBox:'0 0 520 520', role:'group', 'aria-label':t('rueda')});
    const leyenda = h('nav', {'class':'act-leyenda', 'aria-label':t('secciones')});
    const sectores = [], botones = [];
    const polar = (r, a) => [260 + r * Math.cos(a), 260 + r * Math.sin(a)];
    const paso = 2 * Math.PI / secciones.length, inicio = -Math.PI / 2 - paso / 2;
    secciones.forEach((s, i) => {
      const a = inicio + i * paso, b = a + paso;
      const [x1,y1] = polar(252,a), [x2,y2] = polar(252,b), [x3,y3] = polar(128,b), [x4,y4] = polar(128,a);
      const g = svg('g', {'class':'act-sector', tabindex:'0', role:'button', 'aria-label':titulo(s),
        'aria-controls':panel.id, 'data-seccion':i});
      g.appendChild(svg('path', {d:`M${x1},${y1} A252,252 0 0 1 ${x2},${y2} L${x3},${y3} A128,128 0 0 0 ${x4},${y4} Z`, fill:`var(--ipn-act-${i + 1})`}));
      const [x,y] = polar(190,(a+b)/2);
      g.appendChild(svg('text', {x, y, 'text-anchor':'middle', 'dominant-baseline':'middle', 'class':'act-numero'}, String(i+1)));
      const boton = h('button', {type:'button', 'class':'sate-btn', 'aria-controls':panel.id, 'data-area':i,
        texto:`${i+1}. ${titulo(s)}`});
      const elegir = () => mostrar(i);
      g.addEventListener('mouseenter', elegir);
      g.addEventListener('focus', elegir);
      g.addEventListener('click', elegir);
      g.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(); }
        const delta = ['ArrowRight','ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft','ArrowUp'].includes(e.key) ? -1 : 0;
        if (delta) { e.preventDefault(); sectores[(i + secciones.length + delta) % secciones.length].focus({preventScroll:true}); }
        if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); sectores[e.key === 'Home' ? 0 : secciones.length-1].focus({preventScroll:true}); }
      });
      boton.addEventListener('click', elegir);
      sectores.push(g); botones.push(boton); dibujo.appendChild(g); leyenda.appendChild(boton);
    });
    dibujo.append(svg('text', {x:260, y:253, 'text-anchor':'middle', 'class':'act-centro'}, t('centro')),
      svg('text', {x:260, y:278, 'text-anchor':'middle', 'class':'act-ayuda'}, t('selecciona')));
    rueda.append(dibujo, leyenda);
    zona.append(rueda, panel);
    function ficha(a, indice) {
      const oficial = (tag, texto) => h(tag, {'data-oficial':a.fuente.documento, texto});
      const dl = h('dl');
      for (const k of ['descripcion','requisitos','horario','lugar','contacto']) {
        if (!a[k]) continue;
        dl.appendChild(h('div', {}, [h('dt', {texto:t(k)}), a[k] === 'no_verificado'
          ? h('dd', {texto:t('por_confirmar')}) : oficial('dd', a[k])]));
      }
      if (a.estado === 'no_verificado') dl.appendChild(h('div', {}, [h('dt', {texto:t('estado')}), h('dd', {texto:t('por_confirmar')})]));
      const enlace = h('a', {'class':'sate-btn sate-btn--chico', href:a.url, target:'_blank', rel:'noopener noreferrer', texto:t('fuente')});
      return h('article', {'class':'act-ficha', 'data-actividad':indice, 'data-unidad':a.unidad}, [
        h('header', {}, [oficial('h3', a.nombre), h('small', {texto:a.unidad})]), dl, enlace]);
    }
    function mostrar(i) {
      seleccion = i;
      sectores.forEach((g,j) => g.setAttribute('aria-pressed', String(i === j)));
      botones.forEach((b,j) => b.setAttribute('aria-pressed', String(i === j)));
      encabezado.textContent = titulo(secciones[i]);
      const items = secciones[i].items.map((a,j) => ({a,j})).filter(({a}) => !ambito || a.unidad === ambito);
      contador.textContent = t('conteo', {n:items.length});
      lista.replaceChildren(...(items.length ? items.map(({a,j}) => ficha(a,j)) : [h('p', {texto:t('sin_elementos')})]));
      console.debug('SATE: actividades y servicios', {seccion:i, ambito:ambito || '*', elementos:items.length});
    }
    filtro.addEventListener('change', () => { ambito = filtro.value; mostrar(seleccion); });
    mostrar(seleccion);
    // Los resultados de búsqueda pueden abrir una ficha concreta sin cambiar la rueda.
    if (opciones.actividad != null && opciones.actividad !== '') {
      const indice = Number(opciones.actividad);
      lista.querySelector(`[data-actividad="${indice}"]`)?.setAttribute('data-destino', 'true');
    }
    return zona;
  }
  raiz.SateActividades = {crear};
})(globalThis);
