/* Funciones puras: también se prueban en Node sin DOM ni navegador. */
(function (raiz) {
  function ruta(hash, unidad, config) {
    if (!hash.startsWith('#/')) return null;
    const partes = hash.slice(2).split('?')[0].split('/');
    if (config[partes[0]]) unidad = partes.shift();
    let pestaña = partes.shift() || 'mapa';
    // Los enlaces de Ventanilla previos a esta publicación siguen siendo navegables.
    if (pestaña === 'tramites' && config[unidad]?.pestanas.includes('trayectoria') && (!config[unidad].pestanas.includes('tramites') || partes[0]==='reinscripcion')) {
      pestaña = 'trayectoria';
      partes.length = 0;
    }
    if (['situacion','desempeno'].includes(pestaña)) pestaña = 'trayectoria';
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
      if (['mapa','horarios','trayectoria','situacion','desempeno','calendario','tramites'].includes(p[0].split('?')[0]) && unidad) hash = '#/' + unidad + '/' + p.join('/');
    }
    return 'sate/index.html' + query + hash;
  }
  raiz.SateRutas = { ruta, redireccion };
})(typeof window !== 'undefined' ? window : globalThis);
