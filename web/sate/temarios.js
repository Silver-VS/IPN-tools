/* Programas de estudio de SATE (unidades de aprendizaje).
   A. Funciones puras (adaptador de un registro de data/temarios/<unidad>/<carrera>.json al documento genérico del lector
      de PoliCORE, búsqueda y agrupación): se prueban en Node y las usa la página de revisión.
   B. Integración: vista única de cada unidad de aprendizaje, vistazo del Mapa curricular, selector con la trayectoria visual y
      explorador por líneas de aprendizaje en #/<unidad>/guia/programas. La portada de la Guía vive en guia.js. */
(function (raiz) {
  'use strict';

  /* ===================== A. Funciones puras ===================== */
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const claveNorm = k => String(k == null ? '' : k).trim().toUpperCase();
  const num = n => (Number.isInteger(+n) ? String(+n) : (+n).toFixed(2).replace(/\.?0+$/, ''));
  const vacio = v => v == null || String(v).trim() === '';
  const anio = plan => (/^\d{2}$/.test(String(plan)) ? '20' + plan : String(plan || ''));
  const TIPOS_BIBLIO = { b: 'basica', basica: 'basica', 'básica': 'basica', c: 'complementaria', complementaria: 'complementaria' };

  // Temario -> documento genérico {titulo, subtitulo, metadatos, secciones, fuente, avisos}.
  // ctx: {t: función de textos, carrera: nombre de la carrera, plan: '09'}
  function documento(reg, ctx) {
    const t = ctx.t, mt = c => t('temarios.meta.' + c), st = c => t('temarios.seccion.' + c);
    const meta = [], horas = reg.horas || {}, cr = reg.creditos || {};
    const dato = (clave, valor) => { if (!vacio(valor)) meta.push({ etiqueta: mt(clave), valor: String(valor).trim() }); };
    if (reg.nivel != null) dato('nivel', reg.nivel);
    if (reg.tipo) dato('tipo', t('temarios.tipo.' + reg.tipo));
    if (cr.tepic != null) dato('tepic', num(cr.tepic));
    if (cr.satca != null) dato('satca', num(cr.satca));
    if (horas.teoria_semana != null || horas.practica_semana != null) {
      dato('horas_semana', t('temarios.meta.horas_semana_valor', { teoria: num(horas.teoria_semana || 0), practica: num(horas.practica_semana || 0) }));
    }
    if (horas.totales_semestre != null) dato('horas_semestre', num(horas.totales_semestre));
    dato('vigencia', reg.vigencia);
    dato('academia', reg.academia);
    const secciones = [];
    const texto = (id, valor) => { if (!vacio(valor)) secciones.push({ id, titulo: st(id), tipo: 'texto', contenido: String(valor).trim() }); };
    texto('objetivo', reg.objetivo);
    if ((reg.contenidos || []).length) {
      secciones.push({ id: 'contenidos', titulo: st('contenidos'), tipo: 'unidades', rotulo: t('temarios.documento.unidad'),
        contenido: reg.contenidos.map(u => ({ numero: u.numero || '', titulo: u.titulo || '', subtemas: u.subtemas || [] })) });
    }
    texto('orientacion', reg.orientacion);
    texto('evaluacion', reg.evaluacion);
    if ((reg.bibliografia || []).length) {
      secciones.push({ id: 'bibliografia', titulo: st('bibliografia'), tipo: 'bibliografia', contenido: reg.bibliografia.map(b => {
        const k = TIPOS_BIBLIO[norm(b.tipo).trim()];
        return { texto: b.texto || '', tipo: k ? t('temarios.biblio.' + k) : '' };
      }) });
    }
    const avisos = [{ tipo: 'ocr', texto: t('temarios.aviso.ocr') }];
    if (typeof reg.confianza === 'number' && reg.confianza < 0.98) avisos.push({ tipo: 'coincidencia', texto: t('temarios.aviso.coincidencia') });
    return {
      titulo: reg.nombre,
      subtitulo: t('temarios.documento.subtitulo', { clave: claveNorm(reg.clave), carrera: ctx.carrera || '' }),
      metadatos: meta, secciones: secciones.map(s => ({ ...s, oficial: reg.pdf || reg.archivo || ('programa:' + reg.clave) })), avisos,
      oficial: reg.pdf || reg.archivo || ('programa:' + reg.clave),
      fuente: { texto: t('temarios.documento.fuente', { plan: anio(ctx.plan || reg.plan) }) }
    };
  }

  // Campos del registro donde aparece la consulta (todas las palabras, en cualquier campo); null si no coincide.
  function terminos(q) { return norm(q).split(/\s+/).filter(Boolean); }
  function textoContenidos(reg) {
    return (reg.contenidos || []).map(u => [u.numero, u.titulo, ...(u.subtemas || [])].join(' ')).join(' \n ');
  }
  function buscarEnRegistro(reg, terms) {
    if (!terms.length) return [];
    const campos = { nombre: norm(claveNorm(reg.clave) + ' ' + (reg.nombre || '')), objetivo: norm(reg.objetivo), contenidos: norm(textoContenidos(reg)), bibliografia:norm((reg.bibliografia || []).map(b => b.texto).join(' ')) };
    const todo = Object.values(campos).join(' \n ');
    if (!terms.every(w => todo.includes(w))) return null;
    return Object.keys(campos).filter(k => terms.some(w => campos[k].includes(w)));
  }
  // Filtra el índice {clave: {c: carrera, n: nombre, v: nivel, t: tipo}}. `registros(c)` devuelve Map clave->registro o null
  // (carrera aún no descargada: solo se busca en el nombre y la clave).
  function filtrar(materias, f, registros) {
    const terms = terminos(f.q || ''), r = [];
    for (const [clave, m] of Object.entries(materias)) {
      if (f.carrera && f.carrera !== '*' && m.c !== f.carrera) continue;
      if (f.nivel && f.nivel !== '*' && String(m.v) !== String(f.nivel)) continue;
      if (f.tipo && f.tipo !== '*' && m.t !== f.tipo) continue;
      let donde = [];
      if (terms.length) {
        const reg = registros && registros(m.c)?.get(clave);
        if (reg) { donde = buscarEnRegistro(reg, terms); if (!donde) continue; }
        else { const nombre = norm(clave + ' ' + m.n); if (!terms.every(w => nombre.includes(w))) continue; donde = ['nombre']; }
      }
      r.push({ clave, ...m, donde });
    }
    return r;
  }
  function agrupar(lista) {
    const g = new Map();
    for (const x of lista.slice().sort((a, b) => (a.v ?? 99) - (b.v ?? 99) || a.n.localeCompare(b.n, 'es') || a.clave.localeCompare(b.clave))) {
      const k = x.v ?? 0;
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(x);
    }
    return [...g.entries()].map(([nivel, items]) => ({ nivel, items }));
  }
  function enlace(unidad, carrera, clave, seccion) {
    return '#/' + unidad + '/guia/programas' + (carrera ? '/' + carrera + (clave ? '/' + clave + (seccion ? '/' + seccion : '') : '') : '');
  }
  function recursosValidos(datos) {
    return !!datos && typeof datos === 'object' && !Array.isArray(datos) && Object.values(datos).every(rs => Array.isArray(rs) && rs.every(r =>
      r && ['titulo','url','fuente','idioma','tipo','licencia'].every(k => typeof r[k] === 'string' && r[k].trim()) &&
      /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(r.url) && (r.unidades === undefined || Array.isArray(r.unidades) && r.unidades.every(n => Number.isInteger(n) && n > 0))));
  }
  function tituloTema(s, siglas = raiz.SATE_CONFIG?.siglasTemarios || []) {
    return String(s || '');
  }
  // Requisitos directos (r) y materias que desbloquea una materia del índice, ordenados por nivel y nombre.
  function relaciones(materias, clave) {
    const k = claveNorm(clave), orden = (a, b) => (materias[a].v ?? 99) - (materias[b].v ?? 99) || materias[a].n.localeCompare(materias[b].n, 'es');
    const antes = (materias[k]?.r || []).filter(x => materias[x]).sort(orden);
    const despues = Object.keys(materias).filter(c => (materias[c].r || []).includes(k)).sort(orden);
    return { antes, despues };
  }
  // Líneas de aprendizaje de una carrera: una fila por área (en el orden de las columnas del mapa) con sus materias por nivel.
  // Las materias sin área (optativas y especialidad) van al final en una fila con nombre null.
  function lineasDeAprendizaje(materias, carreraId, areas) {
    const filas = (areas || []).map(a => ({ nombre: a.nombre, color: a.color, items: [] })), otras = { nombre: null, color: null, items: [] };
    for (const [clave, m] of Object.entries(materias)) {
      if (m.c !== carreraId) continue;
      (filas.find(f => f.nombre === m.a) || otras).items.push({ clave, ...m });
    }
    if (otras.items.length) filas.push(otras);
    for (const f of filas) f.items.sort((a, b) => (a.v ?? 99) - (b.v ?? 99) || a.n.localeCompare(b.n, 'es') || a.clave.localeCompare(b.clave));
    return filas.filter(f => f.items.length);
  }
  raiz.SateTemarios = { norm, claveNorm, documento, terminos, buscarEnRegistro, filtrar, agrupar, enlace, recursosValidos, tituloTema, relaciones, lineasDeAprendizaje };

  if (typeof raiz.SATE === 'undefined' || typeof raiz.SATE_CONFIG === 'undefined' || typeof document === 'undefined') return;

  /* ===================== B. Integración con SATE ===================== */
  const t = (c, v) => SATE.texto(c, v);
  const E = { indice: null, pIndice: null, carreras: {}, pCarreras: {}, recursos: {}, nombres: new Map(), panel: null, token: 0, origen: null, origenClave: null };
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  const unidad = () => raiz.SATE_UNIDAD;
  const ir = (carrera, clave, seccion) => enlace(unidad(), carrera, clave, seccion);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function h(etiqueta, atributos, hijos) {
    const n = document.createElement(etiqueta);
    for (const k in atributos || {}) {
      const v = atributos[k];
      if (v == null || v === false) continue;
      if (k === 'texto') n.textContent = v; else n.setAttribute(k, v === true ? '' : v);
    }
    for (const x of hijos || []) if (x) n.appendChild(typeof x === 'string' ? document.createTextNode(x) : x);
    const origen = typeof atributos?.texto === 'string' && E.nombres.get(atributos.texto);
    if (origen) SateUI.oficial(n, origen);
    return n;
  }
  function cargarCss() {
    if (!BASE || !document.head) return;
    for (const archivo of ['guia.css', 'temarios.css']) {
      const href = BASE + archivo;
      if ([...document.querySelectorAll('link[data-tmr-css]')].some(l => l.getAttribute('href') === href)) continue;
      document.head.appendChild(h('link', { rel: 'stylesheet', href, 'data-tmr-css': '' }));
    }
  }
  cargarCss();

  /* ---------- datos ---------- */
  const traer = nombre => SATE.json ? SATE.json('datos/' + unidad() + '/temarios/' + nombre + '.json') : fetch('datos/' + unidad() + '/temarios/' + nombre + '.json').then(r => {
    if (!r.ok) throw new Error('datos/' + unidad() + '/temarios/' + nombre + ': HTTP ' + r.status);
    return r.json();
  });
  function preparar() {
    return E.pIndice ||= traer('indice').then(d => { E.indice = d; for (const [clave, m] of Object.entries(d.materias)) E.nombres.set(m.n, 'plan:' + m.c + '/' + clave); return d; }).catch(e => { E.pIndice = null; throw e; });
  }
  function carreraDatos(id) {
    return E.pCarreras[id] ||= traer(id).then(d => {
      const materias = new Map();
      for (const r of d.materias) materias.set(claveNorm(r.clave), r);
      return (E.carreras[id] = { plan: d.plan, materias });
    }).catch(e => { delete E.pCarreras[id]; throw e; });
  }
  const todasCargadas = () => Object.keys(E.indice?.carreras || {}).every(id => E.carreras[id]);
  const cargarTodas = () => Promise.all(Object.keys(E.indice.carreras).map(carreraDatos));
  const tiene = k => !!E.indice?.materias?.[claveNorm(k)];
  async function registro(clave) {
    const k = claveNorm(clave), e = E.indice?.materias?.[k];
    if (!e) return null;
    const c = await carreraDatos(e.c), reg = c.materias.get(k);
    return reg ? { registro: reg, carreraId: e.c, plan: c.plan } : null;
  }
  async function cargarRecursos(carrera) {
    if (!E.indice?.recursos?.includes(carrera)) return {};
    return E.recursos[carrera] ||= fetch('datos/' + unidad() + '/recursos/' + carrera + '.json').then(async r => {
      if (r.status === 404) return {};
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      if (!recursosValidos(d)) throw new Error('Esquema de recursos inválido');
      return d;
    }).catch(e => { delete E.recursos[carrera]; console.warn('SATE: recursos no disponibles', {unidad:unidad(), carrera, mensaje:e.message}); return {}; });
  }
  const documentoDe = r => documento(r.registro, { t, carrera: E.indice.carreras[r.carreraId]?.nombre, plan: r.plan });
  const hayProgramas = () => !!SATE_CONFIG.unidades[unidad()]?.vistas?.some(v => v.id === 'temarios');
  function carreraPropia() {
    const letra = typeof S !== 'undefined' ? S.car : null;
    return Object.entries(E.indice.carreras).find(([, c]) => c.letra === letra)?.[0] || Object.keys(E.indice.carreras)[0];
  }

  function nombreDe(k) { const e = E.indice?.materias?.[claveNorm(k)]; return e ? e.n : k; }
  const enlaceHtml = k => {
    const programa=tiene(k)?'<a href="'+esc(ir(E.indice.materias[claveNorm(k)].c,claveNorm(k)))+'">'+esc(t('sate.puentes.programa'))+'</a>':'';
    const grupos=typeof classes==='function'?classes().filter(c=>c[0]===S.car && claveNorm(c[8])===claveNorm(k)):[];
    const oferta=grupos.length?'<a href="#/'+unidad()+'/horarios?materia='+encodeURIComponent(k)+'">'+esc(t('sate.puentes.grupos',{n:new Set(grupos.map(c=>c[3])).size}))+'</a>':'';
    return '<p class="insp-temario sate-puentes-materia">'+programa+oferta+'<a href="#/'+unidad()+'/guia">'+esc(t('sate.puentes.todo'))+'</a></p>';
  };
  const migasBase = () => [{ texto: t('sate.pestana.guia.titulo'), href: '#/' + unidad() + '/guia' }, { texto: t('sate.guia.programas'), href: ir() }];

  /* ---------- vista única de una unidad de aprendizaje ----------
     Es la única ficha completa: datos, objetivo, todas las unidades con sus temas, evaluación, recursos, relaciones, bibliografía,
     búsqueda en bibliotecas y el PDF original. El modal del Mapa curricular (modo «vistazo») solo resume y lleva aquí. */
  const enlaceExterno = (clase, href, hijos, texto) => h('a', { 'class': clase, href, target: '_blank', rel: 'noopener noreferrer', texto }, hijos);
  function fichaRelacion(titulo, claves, ninguna, alIr) {
    const lista = claves.length ? h('div', { 'class': 'tmr-rel-lista' }, claves.map(k => {
      const a = h('a', { 'class': 'tmr-rel-enlace', href: ir(E.indice.materias[k].c, k), texto: E.indice.materias[k].n });
      if (alIr) a.addEventListener('click', e => alIr(e, k));
      else a.addEventListener('click', e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); abrir(k, a); });
      return a;
    })) : h('p', { 'class': 'tmr-nota', texto: ninguna });
    return h('div', { 'class': 'tmr-rel' }, [h('h4', { texto: titulo }), lista]);
  }
  const parrafos = texto => String(texto || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
  function construirFicha(r, recursos, op) {
    op = op || {};
    const m = r.registro, alIr = op.alIr, vistazo = op.modo === 'vistazo', dialogo = !!op.dialogo;   // dialogo: el título lo pone la ventana
    const origen = m.pdf || m.archivo || ('programa:' + m.clave);
    const oficial = n => SateUI.oficial(n, origen);
    const dato = (valor, etiqueta) => h('div', {}, [h('strong', { texto: valor }), h('small', { texto: t('sate.guia.' + etiqueta) })]);
    const horas = m.horas || {}, cr = m.creditos || {};
    const rel = relaciones(E.indice.materias, m.clave);
    const pdf = m.pdf ? enlaceExterno('btn' + (vistazo ? '' : ' primary') + ' tmr-pdf', m.pdf, null, t('sate.guia.pdf')) : null;   // en el vistazo el botón principal lleva a la ficha completa
    if (pdf) pdf.setAttribute('title', t('sate.guia.pdf_ayuda'));
    const completa = h('a', { 'class': 'btn primary tmr-completa', href: ir(r.carreraId, m.clave), texto: t('temarios.ficha.ver_completa') });
    if (alIr) completa.addEventListener('click', alIr);
    const cambiar = !vistazo && op.alCambiar ? h('button', { type: 'button', 'class': 'btn tmr-cambiar', texto: t('temarios.ficha.cambiar') }) : null;
    if (cambiar) cambiar.addEventListener('click', op.alCambiar);
    const notas = [m.descripcion && m.descripcion_revisada === false ? t('sate.guia.descripcion_pendiente') : null, t('sate.guia.nota')].filter(Boolean);
    const cifras = h('div', { 'class': 'tmr-cifras' }, [cr.tepic != null || cr.satca != null ? dato(num(cr.tepic ?? cr.satca), 'creditos') : null, horas.teoria_semana != null || horas.practica_semana != null ? dato(num((horas.teoria_semana || 0) + (horas.practica_semana || 0)), 'horas') : null, m.tipo ? dato(t('temarios.tipo.' + m.tipo), 'tipo') : null]);
    const enc = h('header', { 'class': 'tmr-ficha-enc' }, [
      dialogo ? null : oficial(h('h2', { texto: m.nombre, tabindex: '-1' })),
      h('p', { 'class': 'tmr-meta', texto: [m.clave, E.indice.carreras[r.carreraId]?.nombre, m.nivel != null ? t('temarios.lista.nivel', { n: m.nivel }) : null].filter(Boolean).join(' · ') }),
      m.descripcion ? h('p', { 'class': 'tmr-descripcion', texto: m.descripcion }) : null,
      h('div', { 'class': 'tmr-acciones' }, vistazo ? [completa, pdf] : [pdf, cambiar])]);
    const relaciones_ = rel.antes.length || rel.despues.length ? h('section', { 'class': 'tmr-bloque', id: 'ficha-relaciones' }, [h('h3', { texto: t('sate.guia.relaciones') }),
      fichaRelacion(t('sate.guia.antes'), rel.antes, t('sate.guia.antes_ninguna'), alIr), fichaRelacion(t('sate.guia.despues'), rel.despues, t('sate.guia.despues_ninguna'), alIr)]) : null;
    let cuerpo;
    if (vistazo) {
      cuerpo = [enc, cifras, relaciones_, h('footer', { 'class': 'tmr-bloque' }, notas.map(n => h('p', { 'class': 'tmr-nota', texto: n })))];
    } else {
      const texto = (id, titulo, valor) => { const ps = parrafos(valor); return ps.length ? h('section', { 'class': 'tmr-bloque', id: 'ficha-' + id }, [h('h3', { texto: titulo }), ...ps.map(x => oficial(h('p', { texto: x })))]) : null; };
      const unidades = (m.contenidos || []).length ? h('section', { 'class': 'tmr-bloque', id: 'ficha-contenidos' }, [h('h3', { texto: t('sate.guia.veras') }),
        oficial(h('ol', { 'class': 'tmr-pasos' }, m.contenidos.map((u, i) => h('li', {}, [h('span', { 'class': 'tmr-paso', texto: String(i + 1) }), h('div', {}, [h('h4', { texto: tituloTema(u.titulo) }), ...(u.subtemas || []).map(x => h('p', { texto: tituloTema(x) }))])]))))]) : null;
      const rec = recursos.length ? h('section', { 'class': 'tmr-bloque', id: 'ficha-recursos' }, [h('h3', { texto: t('sate.guia.recursos') }), ...recursos.map(x => enlaceExterno('tmr-recurso', x.url, [h('small', { texto: [x.fuente, x.idioma, x.tipo].join(' · ') }), h('span', { texto: x.titulo + ' ↗' })]))]) : null;
      const biblio = h('section', { 'class': 'tmr-bloque', id: 'ficha-bibliografia' }, [
        (m.bibliografia || []).length ? h('h3', { texto: t('sate.guia.bibliografia') }) : h('h3', { texto: t('temarios.ficha.bibliotecas_titulo') }),
        (m.bibliografia || []).length ? h('ul', { 'class': 'tmr-biblio' }, m.bibliografia.map(b => { const n = SateBibliotecas.referencia(String(b.texto || '').trim()); oficial(n.querySelector('span')); return n; })) : null,
        raiz.SateBibliotecas && raiz.SateBibliotecas.panel ? raiz.SateBibliotecas.panel({ termino: m.nombre, titulo: t('temarios.ficha.bibliotecas_titulo') }) : null]);
      const objetivo = texto('objetivo', t('temarios.seccion.objetivo'), m.objetivo);
      const secciones = [['contenidos', t('sate.guia.veras'), unidades],
        ['orientacion', t('temarios.seccion.orientacion'), texto('orientacion', t('temarios.seccion.orientacion'), m.orientacion)],
        ['recursos', t('sate.guia.recursos'), rec], ['bibliografia', t('sate.guia.bibliografia'), biblio]].filter(x => x[2]);
      const colorArea = m.area?.color || 'var(--ipn-acento)';
      const trayectoria = h('section', { 'class': 'tmr-lateral-bloque tmr-trayectoria', id: 'ficha-relaciones' }, [
        h('h3', { texto: t('temarios.ficha.trayectoria') }),
        m.nivel != null ? h('p', { 'class': 'tmr-trayectoria-dato', texto: t('temarios.ficha.nivel', { n: m.nivel }) }) : null,
        cr.tepic != null || cr.satca != null ? h('p', { 'class': 'tmr-trayectoria-dato', texto: t('temarios.ficha.creditos', { n: num(cr.tepic ?? cr.satca), escala: cr.tepic != null ? 'TEPIC' : 'SATCA' }) }) : null,
        m.area?.nombre ? h('p', { 'class': 'tmr-area', style: '--tmr-area:' + colorArea }, [m.area.nombre]) : null,
        fichaRelacion(t('temarios.ficha.requisitos'), rel.antes, t('temarios.ficha.sin_requisitos'), alIr),
        fichaRelacion(t('temarios.ficha.habilita'), rel.despues, t('temarios.ficha.sin_habilita'), alIr)
      ]);
      const acreditacion = h('section', { 'class': 'tmr-lateral-bloque', id: 'ficha-evaluacion' }, [
        h('h3', { texto: t('temarios.ficha.acreditacion') }),
        ...parrafos(m.evaluacion).map(x => oficial(h('p', { texto: x }))),
        h('p', { 'class': 'tmr-nota', texto: t('temarios.ficha.ponderacion') })
      ]);
      const enlacePdf = h('section', { 'class': 'tmr-bloque', id: 'ficha-pdf' }, [h('h3', { texto: t('sate.guia.pdf') }), pdf]);
      const bloques = [objetivo, ...secciones.filter(x => x[0] !== 'bibliografia').map(x => x[2]), acreditacion, biblio].filter(Boolean);
      const nav = h('nav', { 'class': 'rgl-arbol tmr-indice', 'aria-label': t('temarios.ficha.indice') });
      const detalle = h('details', { 'class': 'rgl-indice', open: !raiz.matchMedia?.('(max-width:768.98px)').matches }, [h('summary', { 'class': 'rgl-resumen', texto: t('temarios.ficha.indice') }), h('div', { 'class': 'rgl-indice__cuerpo' }, [nav])]);
      const destinos = [];
      const entrada = (n, titulo, padre) => {
        const id = n.getAttribute('id').replace('ficha-', '');
        const a = h('a', { 'class': 'rgl-indice-titulo', href: ir(r.carreraId, m.clave, id), 'data-seccion': id, texto: titulo });
        a.addEventListener('click', () => { if (raiz.matchMedia?.('(max-width:768.98px)').matches) detalle.open = false; });
        padre.appendChild(a); destinos.push([n, a]);
      };
      for (const bloque of bloques) {
        bloque.classList.add('rgl-seccion');
        const titulo = bloque.querySelector('h3'); titulo.classList.add('rgl-encabezado');
        entrada(bloque, titulo.textContent, nav);
        const hijos = h('div', { 'class': 'rgl-grupo__cuerpo' });
        bloque.querySelectorAll('.tmr-pasos li').forEach((li, i) => {
          li.setAttribute('id', 'ficha-unidad-' + (i + 1));
          entrada(li, li.querySelector('h4').textContent, hijos);
          const temas = h('div', { 'class': 'rgl-grupo__cuerpo' });
          li.querySelectorAll('p').forEach((p, j) => { p.setAttribute('id', 'ficha-unidad-' + (i + 1) + '-tema-' + (j + 1)); entrada(p, p.textContent, temas); });
          if (temas.children.length) hijos.appendChild(temas);
        });
        if (hijos.children.length) nav.appendChild(hijos);
      }
      const seguir = () => {
        if (!document.contains(nav)) { raiz.removeEventListener?.('scroll', seguir); return; }
        const activo = SateUI.lectorVisible(destinos.map(d => [d, d[0]])) || destinos[0];
        for (const d of destinos) { if (d === activo) d[1].setAttribute('aria-current', 'location'); else d[1].removeAttribute('aria-current'); }
      };
      raiz.addEventListener('scroll', seguir, { passive: true });
      const lienzo = h('div', { 'class': 'rgl-texto' }, [...bloques, h('footer', {}, notas.map(n => h('p', { 'class': 'tmr-nota', texto: n })))]);
      const ajustar = () => {
        if (!document.contains(nav)) { raiz.removeEventListener?.('resize', ajustar); return; }
        SateUI.lectorEncabezados(lienzo, raiz.matchMedia?.('(max-width:768.98px)').matches ? detalle.querySelector('summary').offsetHeight || 48 : 0);
      };
      raiz.addEventListener('resize', ajustar);
      if (raiz.requestAnimationFrame) raiz.requestAnimationFrame(ajustar);
      cuerpo = [enc, SateUI.lector(detalle, lienzo, h('aside', { 'class': 'rgl-riel tmr-lateral-datos' }, [trayectoria, cifras, enlacePdf, cambiar]))];
    }
    const ficha = h('div', { 'class': 'tmr-ficha' + (vistazo ? ' tmr-ficha--vistazo' : '') }, cuerpo.filter(Boolean));
    if (ficha.style && ficha.style.setProperty) ficha.style.setProperty('--tmr-area', m.area?.color || 'var(--ipn-acento)');
    return ficha;
  }

  /* ---------- vistazo: modal del Mapa curricular ---------- */
  function construirPanel() {
    const cuerpo = h('div', { 'class': 'tmr-panel-cuerpo' });
    const ventana = SateUI.modal(t('temarios.panel.etiqueta', { materia: nombreDe(E.origenClave) }), cuerpo, {amplio:true,origen:E.origen});
    E.panel = ventana.elemento; E.cuerpo = cuerpo;
    return E.panel;
  }
  async function abrir(clave, origen) {
    const k = claveNorm(clave);
    if (!tiene(k)) return;
    E.origen = origen || E.origen; E.origenClave = k;
    const p = construirPanel();
    const cuerpo = E.cuerpo;
    p.setAttribute('aria-label', t('temarios.panel.etiqueta', { materia: nombreDe(k) }));
    cuerpo.replaceChildren(h('p', { 'class': 'tmr-estado', role: 'status', texto: t('temarios.panel.cargando') }));
    try {
      const r = await registro(k);
      if (!p.open) return;
      if(!SATE.actual || SATE.actual.pestana==='guia' || SATE.actual.padre==='guia') {
        const recursos=await cargarRecursos(r.carreraId);
        if(!p.open)return;
        p.style.setProperty('--tmr-area',r.registro.area?.color || 'var(--ipn-acento)');
        cuerpo.replaceChildren(construirFicha(r,recursos[k]||[],{modo:'vistazo',alIr:()=>SateUI.cerrarVentana(p)}));
        return;
      }
      const ficha=h('div',{'class':'sate-puentes-materia'},[
        SateUI.oficial(h('strong',{texto:r.registro.nombre}),'temarios'),
        h('a',{href:ir(r.carreraId,r.registro.clave),texto:t('sate.puentes.programa')}),
        h('a',{href:'#/'+unidad()+'/guia',texto:t('sate.puentes.todo')})]);
      // La oferta corresponde al periodo y carrera seleccionados; no se deducen relaciones normativas.
      const grupos=typeof classes==='function'?classes().filter(c=>c[0]===S.car && claveNorm(c[8])===k):[];
      if(grupos.length){
        const a=h('a',{href:'#/'+unidad()+'/horarios?materia='+encodeURIComponent(k),texto:t('sate.puentes.grupos',{n:new Set(grupos.map(c=>c[3])).size})});
        ficha.insertBefore(a,ficha.lastChild);
      }
      if(SATE.relacionesMateria)ficha.insertAdjacentHTML('beforeend',SATE.relacionesHtml(SATE.relacionesMateria(k)));
      ficha.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>SateUI.cerrarVentana(p)));
      cuerpo.replaceChildren(ficha);
      p.setAttribute('aria-label', t('temarios.panel.etiqueta', { materia: r.registro.nombre }));
    } catch (e) {
      if (!p.open) return;
      console.warn('SATE: ficha no disponible', {unidad:unidad(), clave:k, ruta:raiz.location.hash, mensaje:e.message, pila:e.stack});
      const otra = h('button', { type: 'button', 'class': 'btn', texto: t('temarios.panel.reintentar') });
      otra.addEventListener('click', () => abrir(k, E.origen));
      cuerpo.replaceChildren(h('p', { 'class': 'tmr-estado', role: 'alert', texto: t('temarios.panel.error') }), otra);
    }
  }
  function cerrar(op) {
    const p = E.panel;
    if (p) SateUI.cerrarVentana(p);
  }

  /* ---------- selector de unidad de aprendizaje: ventana con la trayectoria visual ---------- */
  const SEL = { q: '', carrera: null, area: '*', orden: 'nivel' };
  function areasDe(carreraId) {
    const ind = E.indice, usadas = new Set(Object.values(ind.materias).filter(m => m.c === carreraId).map(m => m.a));
    const vistas = new Set(), r = [];
    for (const a of ind.carreras[carreraId].areas || []) { if (usadas.has(a.nombre) && !vistas.has(a.nombre)) { vistas.add(a.nombre); r.push(a); } }
    return r;
  }
  function construirSelector(op) {
    const ind = E.indice, ids = Object.keys(ind.carreras);
    if (op && op.carrera && ind.carreras[op.carrera]) SEL.carrera = op.carrera;
    if (!SEL.carrera || !ind.carreras[SEL.carrera]) SEL.carrera = carreraPropia();
    const buscar = SateUI.buscador({ etiqueta: t('temarios.selector.buscar'), marcador: t('temarios.selector.marcador'), valor: SEL.q, id: 'sel-q', alCambiar: v => { SEL.q = v; pintar(); } });
    const selCarrera = h('select', { id: 'sel-carrera' }, ids.map(id => h('option', { value: id, texto: ind.carreras[id].nombre })));
    selCarrera.value = SEL.carrera;
    selCarrera.addEventListener('change', () => { SEL.carrera = selCarrera.value; SEL.area = '*'; pintarAreas(); pintar(); });
    const orden = SateUI.segmentado({ etiqueta: t('temarios.selector.orden'), opciones: [{ id: 'nivel', texto: t('temarios.selector.orden_nivel') }, { id: 'az', texto: t('temarios.selector.orden_az') }], valor: SEL.orden, alCambiar: v => { SEL.orden = v; pintar(); } });
    const areas = h('ul', { 'class': 'sel-areas', 'aria-label': t('temarios.selector.areas') });
    const estado = h('p', { 'class': 'sel-estado', role: 'status', 'aria-live': 'polite' });
    const cuerpo = h('div', { 'class': 'sel-cuerpo' });
    function pintarAreas() {
      const lista = [{ nombre: '*', texto: t('temarios.selector.areas_todas'), color: null }, ...areasDe(SEL.carrera).map(a => ({ nombre: a.nombre, texto: a.nombre, color: a.color }))];
      areas.replaceChildren(...lista.map(a => {
        const b = h('button', { type: 'button', 'class': 'sel-area', 'aria-pressed': SEL.area === a.nombre ? 'true' : 'false', texto: a.texto });
        if (a.color) b.style.setProperty('--sel-area', a.color);
        b.addEventListener('click', () => { SEL.area = a.nombre; for (const x of areas.querySelectorAll('.sel-area')) x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); pintar(); });
        return h('li', {}, [b]);
      }));
    }
    function boton(m, colores) {
      const b = h('button', { type: 'button', 'class': 'sel-materia', 'data-clave': m.clave, 'aria-current': op && op.actual === m.clave ? 'true' : null }, [h('span', { texto: m.n }), h('small', { texto: [m.clave, SEL.orden === 'az' && m.v != null ? t('temarios.lista.nivel', { n: m.v }) : null].filter(Boolean).join(' · ') })]);
      const c = colores.get(m.a); if (c) b.style.setProperty('--sel-area', c);
      b.addEventListener('click', () => { abrirFicha(m.clave); });
      return h('li', {}, [b]);
    }
    function pintar() {
      const terms = terminos(SEL.q), colores = new Map((ind.carreras[SEL.carrera].areas || []).map(a => [a.nombre, a.color]));
      let lista = filtrar(ind.materias, { q: SEL.q, carrera: SEL.carrera, nivel: '*', tipo: '*' }, id => E.carreras[id]?.materias);
      if (SEL.area !== '*') lista = lista.filter(m => m.a === SEL.area);
      if (SEL.orden === 'az') {
        lista.sort((a, b) => a.n.localeCompare(b.n, 'es') || a.clave.localeCompare(b.clave));
        cuerpo.replaceChildren(lista.length ? h('ul', { 'class': 'sel-lista' }, lista.map(m => boton(m, colores))) : h('p', { 'class': 'sel-vacio', texto: t('temarios.lista.sin_resultados') }));
      } else {
        const grupos = agrupar(lista);
        cuerpo.replaceChildren(grupos.length ? h('div', { 'class': 'sel-mapa' }, grupos.map(g => h('section', { 'class': 'sel-col' }, [
          h('h3', { texto: g.nivel ? t('temarios.lista.nivel', { n: g.nivel }) : t('sate.guia.linea_otras') }),
          h('ul', { 'class': 'sel-items' }, g.items.map(m => boton(m, colores)))]))) : h('p', { 'class': 'sel-vacio', texto: t('temarios.lista.sin_resultados') }));
      }
      const mi = ++SEL.token;
      estado.textContent = t(SEL.orden === 'az' ? 'temarios.selector.estado_az' : 'temarios.selector.estado_nivel', { resultados: t('temarios.lista.resultados', { n: lista.length }) });
      // Con una búsqueda, los programas de las demás carreras se descargan una vez para buscar también en su objetivo y contenido.
      if (terms.length && !todasCargadas()) cargarTodas().then(() => { if (mi === SEL.token) pintar(); }).catch(e => console.debug('SATE: búsqueda en temarios incompleta', e.message));
    }
    pintarAreas(); pintar();
    return { nodo: h('div', { 'class': 'sel' }, [
      h('div', { 'class': 'sel-controles' }, [
        h('div', { 'class': 'tmr-campo' }, [h('span', { texto: t('temarios.selector.buscar') }), buscar.raiz]),
        ids.length > 1 ? h('label', { 'class': 'tmr-campo' }, [h('span', { texto: t('temarios.filtro.carrera') }), selCarrera]) : null]),
      areas,
      h('div', { 'class': 'sel-barra' }, [estado, orden.raiz]),
      cuerpo]), foco: buscar.entrada };
  }
  SEL.token = 0;
  function abrirSelector(op) {
    SEL.q = ''; SEL.area = '*';   // cada vez que se abre, sin la búsqueda ni el área anteriores; el orden se recuerda
    const s = construirSelector(op);
    SateUI.modal(t('temarios.selector.titulo'), s.nodo, { amplio: true });
  }

  /* ---------- Programas de estudio: #/<unidad>/guia/programas[/<carrera>/<clave>[/<seccion>]] ---------- */
  const P = { token: 0, clave: null };
  const G = { carrera: null, modo: 'trayectoria', vista: null, token: 0, zoom: { metro: null, matriz: null }, escala: 1 };
  const claseNivel = v => 'gd-n' + Math.min(Math.max(+v || 1, 1), 9);
  const reducido = () => !!(raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion:reduce)').matches);

  function bloqueConsultar() {
    const res = h('ul', { 'class': 'guia-resultados', id: 'gd-res', hidden: true });
    const aviso = h('p', { 'class': 'sate-sr', role: 'status', 'aria-live': 'polite' });
    let primero = null;
    const buscar = SateUI.buscador({ etiqueta: t('sate.guia.buscar_etiqueta'), marcador: t('sate.guia.buscar_marcador'), id: 'gd-q', alCambiar: pintar,
      alEnviar: () => { if (primero) raiz.location.hash = primero.getAttribute('href'); } });
    function pintar() {
      const q = buscar.entrada.value.trim(), terms = terminos(q);
      primero = null;
      if (!terms.length) { res.hidden = true; res.replaceChildren(); aviso.textContent = ''; return; }
      const nq = norm(q);
      const lista = filtrar(E.indice.materias, { q, carrera: '*', nivel: '*', tipo: '*' }, null)
        .sort((a, b) => (norm(b.n).startsWith(nq) - norm(a.n).startsWith(nq)) || (a.v ?? 99) - (b.v ?? 99) || a.n.localeCompare(b.n, 'es'));
      const varias = Object.keys(E.indice.carreras).length > 1;
      res.hidden = false;
      res.replaceChildren(...(lista.length ? lista.slice(0, 8).map(m => {
        const meta = [m.clave, varias ? E.indice.carreras[m.c]?.nombre : null, m.v != null ? t('temarios.lista.nivel', { n: m.v }) : null].filter(Boolean).join(' · ');
        const a = h('a', { 'class': 'guia-resultado', href: ir(m.c, m.clave) }, [h('span', { texto: m.n }), h('small', { texto: meta })]);
        primero ||= a;
        return h('li', {}, [a]);
      }) : [h('li', { 'class': 'guia-vacio', texto: t('sate.guia.buscar_sin_resultados') })]));
      aviso.textContent = t('temarios.lista.resultados', { n: lista.length });
    }
    const elegir = h('button', { type: 'button', 'class': 'btn', texto: t('temarios.selector.abrir') });
    elegir.addEventListener('click', () => abrirSelector({ carrera: carreraPropia() }));
    return h('section', { 'class': 'guia-buscar', 'aria-label': t('sate.guia.consultar_titulo') }, [
      h('label', { 'class': 'tmr-campo', for: 'gd-q', texto: t('sate.guia.buscar_etiqueta') }),
      buscar.raiz, aviso, res, h('div', {}, [elegir])]);
  }
  // Programas de estudio con dos formas de explorar (trayectoria escolar; líneas y especializaciones, en metro o en matriz). Elegir una materia abre su ficha
  // única en una ventana emergente (SateUI.modal): la página no cambia de ruta ni se desplaza, y al cerrar el foco vuelve a la materia.
  async function abrirFicha(clave) {
    abrir(clave, document.activeElement);
  }
  /* Metro: una vía gruesa por área (mismo color que en el Mapa), una estación (anillo) por unidad de aprendizaje y una zona por nivel.
     Las vías y los transbordos se dibujan en un solo SVG; cada estación es un botón HTML encima. Si un nivel tiene varias unidades de la
     misma línea, la vía se ramifica en sub-vías paralelas. No hay panel lateral: elegir una estación abre la ficha. */
  const METRO = { col: 120, caja: 108, carril: 55, enc: 30, tope: 3, margen: 12, r: 10 };
  const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  const hexRgb = c => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(c || ''); return m ? [1, 2, 3].map(i => parseInt(m[i], 16) / 255) : null; };
  const luz = c => { const v = hexRgb(c); if (!v) return null; const [r, g, b] = v.map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  // Texto de la píldora: blanco si contrasta ≥ 4.5 con el color de la línea; si no, casi negro.
  const textoSobre = c => { const l = luz(c); return l == null || 1.05 / (l + 0.05) >= 4.5 ? '#fff' : '#17171c'; };
  function distribuirMetro(filas) {
    const niveles = [...new Set(filas.flatMap(f => f.items.map(i => i.v)))].filter(v => v != null).sort((a, b) => a - b);
    const carriles = filas.map(f => Math.max(1, Math.min(METRO.tope, Math.max(0, ...niveles.map(v => f.items.filter(i => i.v === v).length)))));
    const subs = new Map(niveles.map(v => [v, Math.max(1, ...filas.map((f, k) => Math.ceil(f.items.filter(i => i.v === v).length / carriles[k])))]));
    const inicio = new Map(); let x = METRO.margen;
    for (const v of niveles) { inicio.set(v, x); x += subs.get(v) * METRO.col; }
    let y = METRO.enc;
    const lineas = filas.map((f, k) => {
      const nl = carriles[k], pos = [];
      const lineasTxt = Math.max(2, ...f.items.map(i => Math.ceil(i.n.length / 17))), carril = METRO.carril + 15 * (lineasTxt - 2);
      for (const v of niveles) f.items.filter(i => i.v === v).forEach((i, n) => {
        const carrilN = n % nl, sub = Math.floor(n / nl);
        pos.push({ item: i, carril: carrilN, x: inicio.get(v) + sub * METRO.col + METRO.col / 2, y: y + 6 + carrilN * carril + 12, top: y + 6 + carrilN * carril });
      });
      const l = { fila: f, pos, nl, carril, top: y, alto: nl * carril + 12 };
      y += l.alto; return l;
    });
    return { niveles, inicio, subs, ancho: x + METRO.margen, alto: y + METRO.margen, lineas };
  }
  // Vías de una línea: el tronco continuo y, por cada sub-vía, una rama que sale del tronco con esquinas redondeadas.
  function viasMetro(l) {
    const r = METRO.r, y0 = l.pos[0].y, vias = [];
    const xs = l.pos.map(p => p.x), ramas = [];
    for (let c = 1; c < l.nl; c++) {
      const del = l.pos.filter(p => p.carril === c); if (!del.length) continue;
      const xa = Math.min(...del.map(p => p.x)), xb = xa - METRO.col / 2 + 2, yc = del[0].y;
      ramas.push({ xb, d: 'M' + xb + ' ' + y0 + ' V' + (yc - r) + ' Q' + xb + ' ' + yc + ' ' + (xb + r) + ' ' + yc + ' H' + Math.max(...del.map(p => p.x)) });
    }
    const x1 = Math.min(...xs, ...ramas.map(r_ => r_.xb)), x2 = Math.max(...xs);
    vias.push('M' + x1 + ' ' + y0 + ' H' + x2, ...ramas.map(r_ => r_.d));
    return vias;
  }
  // Transbordo: tramo del color de la línea de origen que baja o sube hasta la estación que la pide como requisito.
  function trasbordoMetro(a, b, desfase) {
    const r = METRO.r, vx = b.x - METRO.col / 2 + 4 + desfase * 6, s = Math.sign(b.y - a.y) || 1;
    return 'M' + a.x + ' ' + a.y + ' H' + (vx - r) + ' Q' + vx + ' ' + a.y + ' ' + vx + ' ' + (a.y + s * r) + ' V' + (b.y - s * r) + ' Q' + vx + ' ' + b.y + ' ' + (vx + r) + ' ' + b.y + ' H' + b.x;
  }
  function pintarMetro(destino, ind, carreraId, abrirFichaDe) {
    const car = ind.carreras[carreraId], filas = lineasDeAprendizaje(ind.materias, carreraId, car.areas);
    const veces = new Map();   // en cuántas especializaciones aparece cada materia
    for (const l of car.lineas || []) for (const k of new Set(l.claves)) veces.set(k, (veces.get(k) || 0) + 1);
    const m = distribuirMetro(filas), NS = 'http://www.w3.org/2000/svg';
    const por = new Map(); m.lineas.forEach((l, k) => l.pos.forEach(p => por.set(p.item.clave, { ...p, k })));
    const nodo = (tag, attrs, hijos) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); for (const x of hijos || []) n.appendChild(x); return n; };
    const color = l => l.fila.color || 'var(--ipn-tenue)';
    const svg = nodo('svg', { 'class': 'gd-metro-trazo', width: m.ancho, height: m.alto, 'aria-hidden': 'true' });
    m.niveles.forEach((v, k) => {
      const x = m.inicio.get(v), w = m.subs.get(v) * METRO.col;
      if (k % 2) svg.appendChild(nodo('rect', { 'class': 'gd-metro-banda', x: x, y: 8, width: w, height: m.alto - 16, rx: 10 }));
      const tx = nodo('text', { 'class': 'gd-metro-zona', x: x + w / 2, y: 26, 'text-anchor': 'middle' }); tx.textContent = t('temarios.lista.nivel', { n: ROMANOS[v] || v });
      svg.appendChild(tx);
    });
    // Transbordos (requisitos que vienen de otra línea), debajo de las vías propias.
    const destinos = new Map();
    for (const [clave, b] of por) for (const rq of ind.materias[clave].r || []) {
      const a = por.get(rq); if (!a || a.k === b.k || a.x >= b.x) continue;
      const j = destinos.get(clave) || 0; destinos.set(clave, j + 1);
      svg.appendChild(nodo('path', { 'class': 'gd-metro-trasbordo', d: trasbordoMetro(a, b, j % 3), 'data-a': rq, 'data-b': clave, style: 'stroke:' + color(m.lineas[a.k]), fill: 'none' }));
    }
    m.lineas.forEach(l => { for (const d of viasMetro(l)) svg.appendChild(nodo('path', { 'class': 'gd-metro-linea', d, style: 'stroke:' + color(l), fill: 'none', 'data-linea': String(m.lineas.indexOf(l)) })); });
    const capa = h('div', { 'class': 'gd-metro-capa', style: 'width:' + m.ancho + 'px;height:' + m.alto + 'px' }, []);
    capa.appendChild(svg);
    for (const l of m.lineas) {
      const nombre = l.fila.nombre || t('sate.guia.linea_otras');
      for (const p of l.pos) {
        const i = p.item, n = veces.get(i.clave) || 0, sale = (i.r || []).some(r_ => por.get(r_) && por.get(r_).k !== por.get(i.clave).k) || [...por.keys()].some(c => (ind.materias[c].r || []).includes(i.clave) && por.get(c).k !== por.get(i.clave).k);
        const e = h('button', { type: 'button', 'class': 'gd-estacion' + (n > 1 || sale ? ' gd-estacion--cruce' : ''), 'data-clave': i.clave, 'aria-haspopup': 'dialog',
          'aria-label': t('sate.guia.metro_estacion', { materia: i.n, clave: i.clave, linea: nombre, nivel: i.v }) + (n > 1 ? '. ' + t('sate.guia.metro_correspondencia', { n }) : ''),
          style: 'left:' + (p.x - METRO.caja / 2) + 'px;top:' + p.top + 'px;width:' + METRO.caja + 'px;--gd-area:' + color(l) },
          [h('span', { 'class': 'gd-estacion-punto', 'aria-hidden': 'true' }), h('span', { 'class': 'gd-estacion-caja', 'aria-hidden': 'true' }, [h('small', { texto: i.clave }), h('span', { 'class': 'gd-estacion-nombre', texto: i.n })])]);
        e.addEventListener('click', () => abrirFichaDe(i.clave));
        capa.appendChild(e);
      }
    }
    const pildoras = h('div', { 'class': 'gd-metro-lineas', role: 'group', 'aria-label': t('sate.guia.columna_linea'), style: 'height:' + m.alto + 'px' }, m.lineas.map(l => {
      const f = l.fila, p = h('span', { 'class': 'gd-metro-pildora' + (f.color ? '' : ' gd-metro-pildora--neutra'), texto: f.nombre || t('sate.guia.linea_otras'), style: 'top:' + l.pos[0].y + 'px' });
      if (f.color) { p.style.background = f.color; p.style.color = textoSobre(f.color); }
      return p;
    }));
    const lienzo = h('div', { 'class': 'gd-metro-lienzo' }, [pildoras, capa]);
    // Al enfocar o pasar sobre una estación se ilumina su cadena de seriación (requisitos y materias que dependen de ella).
    const marcar = clave => {
      lienzo.classList.toggle('gd-metro--foco', !!clave);
      for (const e of lienzo.querySelectorAll('.gd-estacion')) {
        const c = e.getAttribute('data-clave');
        e.classList.toggle('gd-estacion--rel', !!clave && (c === clave || (ind.materias[clave].r || []).includes(c) || (ind.materias[c].r || []).includes(clave)));
      }
      for (const p of lienzo.querySelectorAll('.gd-metro-trasbordo')) p.classList.toggle('gd-metro-trasbordo--rel', !!clave && (p.getAttribute('data-a') === clave || p.getAttribute('data-b') === clave));
    };
    const estacion = ev => ev.target && ev.target.closest && ev.target.closest('.gd-estacion');
    for (const [entra, sale] of [['focusin', 'focusout'], ['mouseover', 'mouseout']]) {
      lienzo.addEventListener(entra, ev => { const e = estacion(ev); if (e) marcar(e.getAttribute('data-clave')); });
      lienzo.addEventListener(sale, ev => { if (estacion(ev)) marcar(null); });
    }
    const caja = h('div', { 'class': 'gd-metro-caja', role: 'region', tabindex: '0', 'aria-label': t('sate.guia.metro_etiqueta') }, [lienzo]);
    destino.replaceChildren(caja, h('p', { 'class': 'tmr-nota gd-metro-leyenda', texto: t('sate.guia.metro_leyenda_correspondencia') }));
  }
  const VISTA_CLAVE = 'ipnt.programasVista';
  function desplazamiento(caja) {
    if (caja.parentNode.classList.contains('gd-desplazamiento')) return caja.parentNode.actualizar;
    const marco = h('div', { 'class': 'gd-desplazamiento' });
    caja.parentNode.insertBefore(marco, caja); marco.appendChild(caja);
    const botones = [-1, 1].map(dir => {
      const b = h('button', { type: 'button', 'class': 'gd-desplazar gd-desplazar--' + (dir < 0 ? 'izquierda' : 'derecha'), 'aria-label': t('temarios.desplazar.' + (dir < 0 ? 'izquierda' : 'derecha')), texto: dir < 0 ? '‹' : '›' });
      b.addEventListener('click', () => caja.scrollBy({ left: dir * caja.clientWidth * .75, behavior: reducido() ? 'auto' : 'smooth' }));
      marco.appendChild(b); return b;
    });
    const actualizar = () => {
      botones[0].hidden = !(caja.scrollLeft > 1);
      botones[1].hidden = !(caja.scrollWidth - caja.clientWidth - caja.scrollLeft > 1);
    };
    let inicio = null, movido = false;
    caja.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; inicio = { x: e.clientX, scroll: caja.scrollLeft }; movido = false; });
    caja.addEventListener('pointermove', e => {
      if (!inicio) return;
      if (Math.abs(e.clientX - inicio.x) > 5) { movido = true; caja.setPointerCapture?.(e.pointerId); e.preventDefault(); caja.scrollLeft = inicio.scroll - (e.clientX - inicio.x); }
    });
    const terminar = () => { inicio = null; };
    caja.addEventListener('pointerup', terminar); caja.addEventListener('pointercancel', terminar);
    caja.addEventListener('pointerleave', e => { if (!caja.hasPointerCapture?.(e.pointerId)) terminar(); });
    caja.addEventListener('click', e => { if (movido) { e.preventDefault(); e.stopPropagation(); movido = false; } }, true);
    caja.addEventListener('scroll', actualizar, { passive: true });
    marco.actualizar = actualizar; actualizar(); return actualizar;
  }
  function vistaGuardada() {
    try { const v = (raiz.IPNT?.almacen || raiz.localStorage).getItem(VISTA_CLAVE); if (v === 'metro' || v === 'matriz') return v; } catch (e) { /* sin almacén: se usa la vista por omisión */ }
    return raiz.matchMedia && raiz.matchMedia('(max-width:639.98px)').matches ? 'matriz' : 'metro';   // en teléfono, la matriz
  }
  function guardarVista(v) { try { raiz.IPNT?.set(VISTA_CLAVE, v); } catch (e) { /* la elección solo vale en esta visita */ } }
  function explorador() {
    const ind = E.indice, ids = Object.keys(ind.carreras);
    if (!G.carrera || !ind.carreras[G.carrera]) G.carrera = carreraPropia();
    G.vista ||= vistaGuardada();
    const selCarrera = h('select', { id: 'gd-carrera' });
    selCarrera.replaceChildren(...ids.map(id => h('option', { value: id, texto: ind.carreras[id].nombre })));
    selCarrera.value = G.carrera;
    const tray = h('div', { 'class': 'gd-tray' }), lin = h('div', { 'class': 'gd-lin' }), metro = h('div', { 'class': 'gd-metro' }), mapa = h('div', { 'class': 'gd-mapa' }), esp = h('div', { 'class': 'gd-esp' });
    const seg = SateUI.segmentado({ etiqueta: t('sate.guia.explorar_modo'), opciones: [{ id: 'trayectoria', texto: t('sate.guia.modo_trayectoria'), corto: t('sate.guia.modo_trayectoria_corto') }, { id: 'lineas', texto: t('sate.guia.modo_lineas'), corto: t('sate.guia.modo_lineas_corto') }], valor: G.modo, alCambiar: m => { G.modo = m; pintar(); } });
    const vista = SateUI.segmentado({ etiqueta: t('sate.guia.vista_etiqueta'), opciones: [{ id: 'metro', texto: t('sate.guia.vista_metro') }, { id: 'matriz', texto: t('sate.guia.vista_matriz') }], valor: G.vista, alCambiar: v => { G.vista = v; guardarVista(v); pintar(); } });
    const zoom = h('div', { 'class': 'seg gd-zoom', role: 'group', 'aria-label': t('sate.guia.vista_zoom') }, [
      h('button', { type: 'button', 'data-gd-zoom': '-1', 'aria-label': t('sate.guia.vista_alejar'), texto: '−' }),
      h('button', { type: 'button', 'data-gd-zoom': '0', texto: t('sate.guia.vista_ajustar') }),
      h('button', { type: 'button', 'data-gd-zoom': '1', 'aria-label': t('sate.guia.vista_acercar'), texto: '+' })]);
    const escala = () => {
      const lienzo = metro.hidden ? mapa.querySelector('.gd-mapa-lienzo') : metro.querySelector('.gd-metro-lienzo');
      if (!lienzo) return;
      const caja = metro.hidden ? mapa : metro, id = metro.hidden ? 'matriz' : 'metro';
      const ancho = caja.clientWidth || 1000;
      lienzo.style.zoom = '1';
      const w = lienzo.scrollWidth || ancho;
      const ajustar = Math.min(1.5, ancho / w);
      lienzo.style.zoom = String(G.zoom[id] ?? Math.max(1, ajustar));
      G.escala = Number(lienzo.style.zoom) || 1;
      desplazamiento(metro.hidden ? mapa : metro.querySelector('.gd-metro-caja'))();
    };
    zoom.addEventListener('click', e => {
      const b = e.target.closest('[data-gd-zoom]'); if (!b) return;
      const id = metro.hidden ? 'matriz' : 'metro';
      G.zoom[id] = b.dataset.gdZoom === '0' ? null : Math.max(1, Math.min(1.5, (G.zoom[id] ?? G.escala) * (b.dataset.gdZoom === '1' ? 1.12 : 1 / 1.12)));
      escala();
    });
    // Una materia es siempre un botón: clic, Enter o espacio abren su ficha en la ventana emergente.
    function chip(i, clase, hijos, color) {
      const b = h('button', { type: 'button', 'class': 'gd-chip ' + clase, 'data-clave': i.clave, 'aria-haspopup': 'dialog' }, hijos);
      if (color && b.style && b.style.setProperty) b.style.setProperty('--gd-area', color);
      b.addEventListener('click', () => abrirFicha(i.clave));
      return b;
    }
    function pintarTrayectoria() {
      const colores = new Map((ind.carreras[G.carrera].areas || []).map(a => [a.nombre, a.color]));
      const grupos = agrupar(filtrar(ind.materias, { carrera: G.carrera, nivel: '*', tipo: '*' }, null));
      tray.replaceChildren(...grupos.map(g => h('section', { 'class': 'gd-sem' }, [
        h('h4', { texto: g.nivel ? t('temarios.lista.nivel', { n: g.nivel }) : t('sate.guia.linea_otras') }),
        h('ul', {}, g.items.map(i => h('li', {}, [chip(i, 'gd-chip--sem', [h('span', { texto: i.n }), h('small', { texto: i.clave })], colores.get(i.a))])))])));
    }
    function pintarMapa() {
      const filas = lineasDeAprendizaje(ind.materias, G.carrera, ind.carreras[G.carrera].areas);
      const niveles = [...new Set(filas.flatMap(f => f.items.map(i => i.v)))].filter(v => v != null).sort((a, b) => a - b);
      mapa.setAttribute('data-niveles', String(niveles.length));
      const lienzo = h('div', { 'class': 'gd-mapa-lienzo' }, [
        h('div', { 'class': 'gd-fila gd-fila--enc', 'aria-hidden': 'true' }, [h('span', { 'class': 'gd-quien', texto: t('sate.guia.columna_linea') }),
          h('div', { 'class': 'gd-cols' }, niveles.map(v => h('span', { 'class': claseNivel(v), texto: t('temarios.lista.nivel', { n: v }) })))]),
        ...filas.map(f => {
          const fila = h('div', { 'class': 'gd-fila', role: 'group', 'aria-label': f.nombre || t('sate.guia.linea_otras') }, [
            h('div', { 'class': 'gd-quien' }, [h('h4', { texto: f.nombre || t('sate.guia.linea_otras') })]),
            h('div', { 'class': 'gd-cols' }, f.items.map(i => {
              const antes = relaciones(ind.materias, i.clave).antes;   // la seriación: qué materias van antes
              return chip(i, claseNivel(i.v), [h('span', { 'class': 'gd-chip-nivel', texto: t('temarios.lista.nivel', { n: i.v }) }), h('span', { texto: i.n }),
                antes.length ? h('small', { 'class': 'gd-chip-antes', texto: t('sate.guia.chip_antes', { claves: antes.join(', ') }) }) : null]);
            }))]);
          if (f.color && fila.style && fila.style.setProperty) fila.style.setProperty('--gd-area', f.color);
          return fila;
        })]);
      mapa.replaceChildren(lienzo);
    }
    function pintarEsp() {
      const lineas = ind.carreras[G.carrera].lineas || [], porArea = new Map();
      for (const l of lineas) { if (!porArea.has(l.area)) porArea.set(l.area, []); porArea.get(l.area).push(l); }
      if (!porArea.size) { esp.replaceChildren(h('p', { 'class': 'tmr-nota', texto: t('sate.guia.esp_vacia') })); return; }
      esp.replaceChildren(...[...porArea].map(([area, ls]) => h('div', { 'class': 'gd-esp-area' }, [h('h4', { texto: area }),
        ...ls.map(l => {
          const linea = h('div', { 'class': 'gd-esp-linea' }, [h('small', { texto: l.linea }),
            h('ul', {}, l.claves.filter(k => ind.materias[k]).map(k => h('li', {}, [chip({ clave: k }, 'gd-chip--esp', [h('span', { texto: ind.materias[k].n }), h('small', { texto: k })], l.color)])))]);
          if (l.color && linea.style?.setProperty) linea.style.setProperty('--ipn-linea-especializacion', l.color);
          return linea;
        })])));
    }
    function pintar() {
      seg.fijar(G.modo); vista.fijar(G.vista);
      tray.hidden = G.modo !== 'trayectoria'; lin.hidden = G.modo !== 'lineas';
      metro.hidden = G.vista !== 'metro'; mapa.hidden = G.vista !== 'matriz';
      if (mapa.parentNode?.classList.contains('gd-desplazamiento')) mapa.parentNode.hidden = mapa.hidden;
      if (G.modo === 'trayectoria') { pintarTrayectoria(); return; }
      if (G.vista === 'metro') { pintarMetro(metro, ind, G.carrera, abrirFicha); mapa.replaceChildren(); } else { pintarMapa(); metro.replaceChildren(); }
      pintarEsp();
      if (raiz.requestAnimationFrame) raiz.requestAnimationFrame(escala); else escala();
    }
    selCarrera.addEventListener('change', () => { G.carrera = selCarrera.value; pintar(); });
    raiz.addEventListener('resize', escala);
    pintar();
    const campo = ids.length > 1 ? h('label', { 'class': 'tmr-campo gd-campo' }, [h('span', { texto: t('temarios.filtro.carrera') }), selCarrera]) : null;
    lin.replaceChildren(h('div', { 'class': 'gd-lin-barra' }, [vista.raiz, zoom]), metro, mapa,
      h('section', { 'class': 'gd-esp-seccion' }, [h('h3', { texto: t('sate.guia.esp_titulo') }), esp]));
    return h('section', { 'class': 'gd-explorar', id: 'gd-explorar', 'aria-labelledby': 'gd-explorar-titulo' }, [
      h('header', { 'class': 'gd-explorar-enc' }, [h('div', {}, [h('h3', { id: 'gd-explorar-titulo', texto: t('sate.guia.explorar_seccion') }), h('p', { texto: t('sate.guia.explorar_intro') })]), campo, seg.raiz]),
      tray, lin,
      h('p', { 'class': 'tmr-nota', texto: t('sate.guia.explorar_nota') })]);
  }
  function cabeceraPagina(migas, titulo, intro) {
    const hh = h('h2', { texto: titulo, tabindex: '-1' });
    return { nodo: h('header', { 'class': 'guia-cab' }, [SateUI.migas(migas), hh, intro ? h('p', { 'class': 'tmr-intro', texto: intro }) : null]), titulo: hh };
  }
  function irASeccion(id) {
    const n = document.getElementById('ficha-' + id);
    if (!n) return;
    n.scrollIntoView({ behavior: reducido() ? 'auto' : 'smooth', block: 'start' });
    const hh = n.querySelector('h3'); if (hh) { hh.setAttribute('tabindex', '-1'); hh.focus({ preventScroll: true }); }
  }
  function portadaProgramas(caja) {
    const cab = cabeceraPagina(migasBase().slice(0, 1).concat([{ texto: t('sate.guia.programas') }]), t('sate.guia.programas'), t('temarios.explorador.intro'));
    document.title = t('sate.guia.programas') + ' — ' + t('sate.pestana.guia.titulo');
    const carrera = SATE.actual?.partes?.[0];
    if (SATE.guia?.buscador) cab.nodo.appendChild(SATE.guia.buscador({fuente:'programas', carrera, nombre:E.indice.carreras[carrera]?.nombre || t('sate.guia.programas')}));
    caja.replaceChildren(h('div', { 'class': 'tmr guia' }, [cab.nodo, bloqueConsultar(), explorador()]));
    P.clave = null;
    cab.titulo.focus({ preventScroll: true });
    if (raiz.scrollTo) raiz.scrollTo(0, 0);
  }
  async function mostrarProgramas(r) {
    const caja = document.getElementById('sate-temarios'), mi = ++P.token;
    if (!hayProgramas()) { caja.replaceChildren(h('p', { 'class': 'tmr-vacio', texto: t('sate.guia.sin_programas') })); return; }
    try { await preparar(); } catch (e) {
      caja.replaceChildren(h('p', { 'class': 'tmr-vacio', role: 'alert', texto: t('temarios.explorador.sin_datos') }));
      return;
    }
    if (mi !== P.token) return;
    const [carr, clave, seccion] = (r && r.partes) || [];
    if (!carr || !clave) { portadaProgramas(caja); return; }
    const k = claveNorm(clave), id = carr + '/' + k;
    document.title = (E.indice.materias[k]?.n || clave) + ' · programa — ' + t('sate.pestana.guia.titulo');
    // Misma ficha ya abierta (p. ej. un clic en el índice): solo se desplaza a la sección.
    if (P.clave === id && caja.querySelector('.tmr-ficha')) { if (seccion) irASeccion(seccion); return; }
    caja.replaceChildren(h('p', { 'class': 'tmr-estado', role: 'status', texto: t('temarios.panel.cargando') }));
    let reg = null, recursos = {};
    try { reg = await registro(k); if (reg) recursos = await cargarRecursos(reg.carreraId); } catch (e) {
      console.debug('SATE: temario no disponible', e.message);
      if (mi === P.token) caja.replaceChildren(h('p', { 'class': 'tmr-estado', role: 'alert', texto: t('temarios.panel.error') }));
      return;
    }
    if (mi !== P.token) return;
    if (!reg || reg.carreraId !== carr) {
      caja.replaceChildren(h('div', { 'class': 'tmr guia' }, [cabeceraPagina([...migasBase().slice(0, 1), { texto: t('sate.guia.programas'), href: ir() }, { texto: t('temarios.explorador.no_encontrado_titulo') }], t('temarios.explorador.no_encontrado_titulo'), t('temarios.explorador.no_encontrado')).nodo]));
      return;
    }
    const ficha = construirFicha(reg, recursos[k] || [], { modo: 'completa', alCambiar: () => abrirSelector({ carrera: reg.carreraId, actual: k }) });
    const cab = h('div', { 'class': 'guia-cab' }, [SateUI.migas([...migasBase(), { texto: reg.registro.nombre }])]);
    if (SATE.guia?.buscador) cab.appendChild(SATE.guia.buscador({fuente:'programas',carrera:carr,materia:k,nombre:reg.registro.nombre}));
    caja.replaceChildren(h('div', { 'class': 'tmr guia' }, [cab, h('div', { 'class': 'tmr-pagina' }, [ficha])]));
    P.clave = id;
    if (seccion) irASeccion(seccion);
    else {
      const titulo = ficha.querySelector('.tmr-ficha-enc h2');
      if (titulo) titulo.focus({ preventScroll: true });
      if (raiz.scrollTo) raiz.scrollTo(0, 0);
    }
  }

  SATE.temarios = { preparar, tiene, abrir, cerrar, abrirSelector, enlaceHtml, documento: documentoDe, cargarRecursos, estado: E };
  document.addEventListener('click', e => {
    const a = e.target.closest?.('.insp-temario a');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const clave = a.getAttribute('href').split('/').at(-1);
    if (tiene(clave)) { e.preventDefault(); abrir(clave, a); }
  });
  SATE.pestana('temarios', { montar() {}, mostrar(r) { return mostrarProgramas(r).catch(e => SATE.error(e)); }, ocultar() { cerrar(); P.token++; P.clave = null; } });
})(typeof window !== 'undefined' ? window : globalThis);
