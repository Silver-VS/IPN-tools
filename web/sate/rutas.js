/* Funciones puras: también se prueban en Node sin DOM ni navegador. */
(function (raiz) {
  function ruta(hash, unidad, config) {
    if (!hash.startsWith('#/')) return null;
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
      if (partes.length > 2 || !partes.every(p => /^[A-Za-z0-9_-]+$/.test(p))) return null;
      return {unidad, pestana:'guia', tramite:null, partes:partes.slice(),
        hash:'#/' + unidad + '/guia' + partes.map(p => '/' + p).join('') + (hash.includes('?') ? '?' + hash.split('?').slice(1).join('?') : '')};
    }
    // Los enlaces de Ventanilla previos a esta publicación siguen siendo navegables.
    if (pestaña === 'tramites' && config[unidad]?.pestanas.includes('trayectoria') && (!config[unidad].pestanas.includes('tramites') || partes[0]==='reinscripcion')) {
      pestaña = 'trayectoria';
      partes.length = 0;
    }
    if (['situacion','desempeno'].includes(pestaña)) pestaña = 'trayectoria';
    // Vistas con ruta propia que no ocupan una pestaña (data/sate.json: vistas); las partes siguientes son suyas.
    const vista = config[unidad]?.vistas?.find(v => v.id === pestaña);
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
  raiz.SateRutas = { ruta, redireccion };
})(typeof window !== 'undefined' ? window : globalThis);
