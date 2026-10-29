/* Caché pública por build. Los bytes se validan antes de adoptar una respuesta:
   una publicación parcial nunca combina documentos de dos compilaciones. */
const BUILD = /*__BUILD__*/null;
const BASE = new URL('./', self.location.href);
const PREFIJO = 'ipnt-' + BASE.pathname + '-';
const CACHE = PREFIJO + BUILD.version;
const clave = ruta => new URL(ruta, BASE).href;
async function descargar(ruta) {
  const respuesta = await fetch(clave(ruta), {cache:'no-cache'});
  if (!respuesta.ok || respuesta.redirected) throw new Error('SW: HTTP ' + respuesta.status + ' ' + ruta);
  const bytes = await respuesta.clone().arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b=>b.toString(16).padStart(2,'0')).join('');
  if (hash !== BUILD.archivos[ruta]) throw new Error('SW: build distinto ' + ruta);
  return respuesta;
}
self.addEventListener('install', evento => evento.waitUntil((async()=>{
  const cache = await caches.open(CACHE);
  await Promise.all(BUILD.precache.map(async ruta => cache.put(clave(ruta), await descargar(ruta))));
  // Una actualización espera al cierre de los documentos del build anterior.
  // skipWaiting borraría sus cachés con scripts antiguos todavía en ejecución.
})()));
self.addEventListener('activate', evento => evento.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(k=>k.startsWith(PREFIJO)&&k!==CACHE).map(k=>caches.delete(k)));
  // Tampoco reclamar documentos abiertos sin controlador: podrían tener HTML
  // de una publicación anterior. Las nuevas navegaciones usan este build íntegro.
})()));
self.addEventListener('fetch', evento => {
  const url = new URL(evento.request.url);
  if (evento.request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const ruta = url.pathname.slice(BASE.pathname.length);
  if (!Object.hasOwn(BUILD.archivos, ruta)) return;
  // No guardar parámetros de cuenta, autorizaciones ni respuestas de otros sitios.
  if (url.search && !(ruta === 'sate/index.html' && [...url.searchParams.keys()].every(k=>['sateGuia','sateUnidad','sateEntrada','pestanas'].includes(k)))) return;
  const datos = ruta.startsWith('sate/datos/');
  const actualizar = async cache => {
    const r = await descargar(ruta); await cache.put(clave(ruta), r.clone()); return r;
  };
  // waitUntil se registra sincrónicamente, antes de ceder el evento.
  const trabajo = caches.open(CACHE).then(async cache => {
    const guardada = await cache.match(clave(ruta));
    if (guardada) {
      if (datos) return {respuesta:guardada, fondo:actualizar(cache).catch(e=>console.warn(e.message))};
      return {respuesta:guardada};
    }
    return {respuesta:await actualizar(cache)};
  });
  evento.respondWith(trabajo.then(r=>r.respuesta));
  evento.waitUntil(trabajo.then(r=>r.fondo).catch(e=>console.warn('SW: recurso no disponible', {ruta,mensaje:e.message})));
});
