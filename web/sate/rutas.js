/* Funciones puras: también se prueban en Node sin DOM ni navegador. */
(function (raiz) {
  function ruta(hash, unidad, config) {
    if (!hash.startsWith('#/')) return null;
    // Compatibilidad con enlaces de artículo que usan un segundo #.
    hash = hash.replace(/(\/reglamentos\/[A-Za-z0-9_-]+)#(art-[\w.-]+|transitorios)$/, '$1/$2');
    const partes = hash.slice(2).split('?')[0].split('/');
    if (config[partes[0]]) unidad = partes.shift();
    let pestaña = partes.shift() || 'mapa';
    // Canonizar enlaces guardados antes de la Guía, conservando materia y sección.
    if (pestaña === 'temarios') { pestaña = 'guia'; partes.unshift('programas'); }
    if (pestaña === 'guia' && partes[0] === 'programas') {
      const detalle = partes.slice(1);
      if (!config[unidad]?.pestanas.includes('guia') || detalle.length > 3 || !detalle.every(p => /^[A-Za-z0-9_-]+$/.test(p))) return null;
      return {unidad, pestana:'temarios', vista:true, padre:'guia', partes:detalle, tramite:null,
        hash:'#/' + unidad + '/guia/programas' + detalle.map(p => '/' + p).join('') + (hash.includes('?') ? '?' + hash.split('?').slice(1).join('?') : '')};
    }
    // Apartados de la Guía: #/<unidad>/guia[/<apartado>[/<pregunta o instancia>]]
    if (pestaña === 'guia' && config[unidad]?.pestanas.includes('guia')) {
      let ancla;
      if (partes[0] === 'reglamentos' && partes.length === 3) {
        try { ancla = decodeURIComponent(partes[2]); } catch { return null; }
        if (!/^(?:art-[\w -]+(?:\.\w+){0,2}|cap-\d+|transitorios|texto)$/.test(ancla)) return null;
      }
      if (partes.length > (partes[0] === 'reglamentos' ? 3 : 2) || !partes.slice(0, ancla ? 2 : partes.length).every(p => /^[A-Za-z0-9_-]+$/.test(p))) return null;
      return {unidad, pestana:'guia', tramite:null, partes:ancla ? [...partes.slice(0, 2), ancla] : partes.slice(),
        hash:'#/' + unidad + '/guia' + partes.map(p => '/' + p).join('') + (hash.includes('?') ? '?' + hash.split('?').slice(1).join('?') : '')};
    }
    // Los enlaces de Ventanilla previos a esta publicación siguen siendo navegables.
    if (pestaña === 'tramites' && config[unidad]?.pestanas.includes('trayectoria') && (!config[unidad].pestanas.includes('tramites') || partes[0]==='reinscripcion')) {
      pestaña = 'trayectoria';
      partes.length = 0;
    }
    if (['situacion','desempeno'].includes(pestaña)) pestaña = 'trayectoria';
    // Vistas con ruta propia que no ocupan una pestaña (data/sate.json: vistas); las partes siguientes son suyas.
    const vista = config[unidad]?.vistas?.find(v => v.id === pestaña && !v.externa);
    if (vista) {
      if (partes.length > 4 || !partes.every(p => /^[A-Za-z0-9_.-]+$/.test(p))) return null;
      return { unidad, pestana: pestaña, vista: true, padre: vista.padre, partes: partes.slice(), tramite: null,
        hash: '#/' + unidad + '/' + pestaña + partes.map(p => '/' + p).join('') + (hash.includes('?') ? '?' + hash.split('?').slice(1).join('?') : '') };
    }
    if (!config[unidad] || !config[unidad].pestanas.includes(pestaña)) return null;
    if (partes.length && (pestaña !== 'tramites' || partes.length !== 1 || !config[unidad].tramites.includes(partes[0]))) return null;
    return { unidad, pestana: pestaña, tramite: partes[0] || null,
      hash: '#/' + unidad + '/' + pestaña + (partes.length ? '/' + partes[0] : '') + (hash.includes('?') ? '?' + hash.split('?').slice(1).join('?') : '') };
  }
  function requiereRaiz(actual, id) {
    return !!actual && !!(actual.pestana !== id || actual.vista || actual.partes?.length || actual.tramite);
  }
  function redireccion(unidad, search, hash) {
    let query = search;
    if (unidad && hash && !hash.startsWith('#/')) {
      query += (query ? '&' : '?') + 'sateUnidad=' + unidad;
    }
    // OAuth, demo y tema conservan su hash íntegro; la unidad viaja en search.
    if (!hash) hash = unidad ? '#/' + unidad + '/mapa' : '';
    else if (hash.startsWith('#/')) {
      const p = hash.slice(2).split('/');
      if (['mapa','horarios','trayectoria','situacion','desempeno','calendario','tramites','temarios','guia'].includes(p[0].split('?')[0]) && unidad) hash = '#/' + unidad + '/' + p.join('/');
      hash = hash.replace(/\/temarios(?=\/|\?|$)/, '/guia/programas');
    }
    return 'sate/index.html' + query + hash;
  }
  // Inventario compartido con la medición sin navegador. No incluye acciones de detalle/PDF.
  function recursos(cfg, unidad, id) {
    const datos = n => 'datos/' + unidad + '/' + n + '.json';
    const tramites = [...new Set((cfg.tramites || []).flatMap(t => [
      ...(t === 'electivas' ? ['../tramites/electivas-reglas.js'] : []), cfg.scriptsTramite?.[t] || t + '.js']))];
    return ({trayectoria:['desempeno.js'], mapa:[datos('oferta'),'mapa.js'],
      horarios:[datos('oferta'),...(cfg.cupos ? ['cupos.js','cupos-vista.js'] : []),'horarios.js'],
      calendario:['calendario.js'], tramites:[datos('tramites'),'tramites.js',...tramites],
      guia:['bibliotecas.js','guia.js','guia.css','temarios.css','../policore/lector.css',...(cfg.guiaDatos ? [datos('guia')] : [])],
      temarios:['bibliotecas.js','temarios.js','guia.css','temarios.css',datos('temarios/indice')]})[id] || [];
  }
  function precargador(cfg, unidad, json) {
    const pedidos = new Set();
    function precargar(id) {
      if (raiz.navigator?.connection?.saveData) return Promise.resolve();
      return Promise.all(recursos(cfg, unidad, id).map(url => {
        if (pedidos.has(url)) return;
        pedidos.add(url);
        if (url.endsWith('.json')) return json(url).catch(e => {
          pedidos.delete(url); console.debug('SATE: precarga fallida', {url, mensaje:e.message});
        });
        // Descargar sin ejecutar: los scripts clásicos dependen del orden del núcleo.
        const enlace = raiz.document.createElement('link');
        enlace.rel = 'preload'; enlace.as = url.endsWith('.css') ? 'style' : 'script'; enlace.href = url;
        enlace.onerror = () => pedidos.delete(url);
        raiz.document.head.appendChild(enlace);
      }));
    }
    function reposo(ids) {
      if (raiz.navigator?.connection?.saveData) return;
      const pendientes = ids.slice();
      const siguiente = () => {
        if (!pendientes.length || raiz.navigator?.connection?.saveData) return;
        precargar(pendientes.shift()).finally(() => programar());
      };
      const programar = () => raiz.requestIdleCallback ? raiz.requestIdleCallback(siguiente) : raiz.setTimeout(siguiente, 250);
      // El temporizador fuera del frame permite presentar primero la vista inicial.
      if (raiz.requestAnimationFrame) raiz.requestAnimationFrame(() => raiz.setTimeout(programar, 0));
      else programar();
    }
    return {precargar, reposo};
  }
  raiz.SateRutas = { ruta, requiereRaiz, redireccion, recursos, precargador };
})(typeof window !== 'undefined' ? window : globalThis);
