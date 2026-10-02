"""Cuenta institucional y persistencia del perfil (formato `ipnt` 1, ver docs/FORMATO-PERFIL.md).

- Respaldo en archivo (*.ipnt.json): descargar y restaurar, sin iniciar sesión.
- Sincronización con la cuenta @alumno.ipn.mx: MSAL.js (Microsoft Entra ID, tenant del IPN) y la carpeta de
  la aplicación en el OneDrive del alumno (permiso Files.ReadWrite.AppFolder). Sin servidor propio.

Configuración: data/cuenta.json {"clientId": "...", "tenant": "..."}; la variable IPNT_CLIENT_ID la sustituye.
Sin clientId, el inicio de sesión aparece como «próximamente» y el respaldo en archivo sigue funcionando.
"""
import json
import os
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
IPN_TENANT = "f94bf4d9-8097-4794-adf6-a5466ca28563"   # login.microsoftonline.com/alumno.ipn.mx (también ipn.mx)
MSAL = ("https://cdn.jsdelivr.net/npm/@azure/msal-browser@4.30.0/lib/msal-browser.min.js",
        "sha384-RGxxfG5yRS8DLU7ZJ8OoLhbV/BsJFHyPuMVHrTLbpj3t5Z15LnviJmaznKY/a7LZ")


def config():
    f = ROOT / "data" / "cuenta.json"
    c = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    v = (ROOT / "VERSION").read_text(encoding="utf-8").strip() if (ROOT / "VERSION").exists() else ""
    return {"clientId": os.environ.get("IPNT_CLIENT_ID", c.get("clientId", "")), "tenant": c.get("tenant", IPN_TENANT),
            "version": v, "unidad": c.get("unidad", "upiita"), "msal": MSAL[0], "sri": MSAL[1]}


JS = r"""
/* ---------- perfil IPN-tools: respaldo y sincronización con la cuenta institucional (tools/cuenta.py) ---------- */
var IPNT=window.IPNT=(()=>{
  const CFG=/*__IPNT_CFG__*/{}, FILE='perfil.ipnt.json', SCOPES=['Files.ReadWrite.AppFolder'];
  // qué se guarda: todo lo de Horarios (hu.) y Electivas (ue.), menos el estado de pantalla de cada dispositivo
  const SYNC=/^(hu\.|ue\.)|^saes\.alumno$/, LOCAL=/^hu\.(tab|per|tur|niv|view|mview|cview|mobnote)$/;
  const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}},
    del(k){try{localStorage.removeItem(k)}catch(e){}},keys(){try{return Object.keys(localStorage)}catch(e){return[]}},
    obj(k,d){try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}},put(k,o){try{localStorage.setItem(k,JSON.stringify(o))}catch(e){}}};
  const opt=()=>ls.obj('ipnt.opt',{saes:false});
  const sincroniza=k=>SYNC.test(k)&&!LOCAL.test(k)&&(k!=='saes.alumno'||opt().saes);
  const parse=s=>{try{return JSON.parse(s)}catch(e){return s}};
  let timer=null, busy=null, pca=null, cuenta=null, st={fase:'',ultimo:ls.get('ipnt.last'),error:''};

  /* ---- documento ---- */
  function documento(base){
    const t=ls.obj('ipnt.t',{}), b=ls.obj('ipnt.b',{}), claves={}, borrados={};
    // lo que este navegador no maneja (p. ej. datos del SAES sin autorización) se conserva tal como estaba
    if(base) for(const [k,e] of Object.entries(base.claves||{})) if(SYNC.test(k)&&!LOCAL.test(k)&&!sincroniza(k)) claves[k]=e;
    for(const k of ls.keys()) if(sincroniza(k)) claves[k]={t:t[k]||0,v:parse(ls.get(k))};
    for(const [k,v] of Object.entries(b)) if(sincroniza(k)&&!(k in claves)) borrados[k]=v;
    if(base) for(const [k,v] of Object.entries(base.borrados||{})) if(!(k in claves)&&!(k in borrados)) borrados[k]=v;
    return {ipnt:1,tipo:'perfil',app:'IPN-tools',version:CFG.version||'',unidad:CFG.unidad||'',guardado:new Date().toISOString(),claves,borrados};
  }
  function validar(d){
    if(!d||typeof d!=='object'||d.tipo!=='perfil'||typeof d.claves!=='object') throw new Error('El archivo no es un perfil de IPN-tools.');
    if(!(d.ipnt>=1)) throw new Error('El archivo no es un perfil de IPN-tools.');
    if(d.ipnt>1) throw new Error('El perfil se guardó con una versión más nueva de la herramienta. Actualiza la página.');
    return d;
  }
  // fusión clave por clave: gana la marca de tiempo más reciente; devuelve cuántas claves cambiaron aquí
  function fusionar(d){
    const t=ls.obj('ipnt.t',{}), b=ls.obj('ipnt.b',{});let n=0;
    for(const [k,e] of Object.entries(d.claves||{})){
      if(!sincroniza(k)||!e) continue;
      const mia=t[k]??b[k]??null, hay=ls.get(k)!=null;
      if((e.t||0)>(mia||0)||(!hay&&mia==null)){const v=JSON.stringify(e.v);if(ls.get(k)!==v){ls.set(k,v);n++}t[k]=e.t||0;delete b[k]}
    }
    for(const [k,bt] of Object.entries(d.borrados||{})){
      if(!sincroniza(k)) continue;
      if(bt>(t[k]||0)&&ls.get(k)!=null){ls.del(k);n++;b[k]=bt;delete t[k]}
    }
    ls.put('ipnt.t',t);ls.put('ipnt.b',b);return n;
  }
  const firma=d=>JSON.stringify([Object.entries(d.claves||{}).map(([k,e])=>[k,e.t]).sort(),Object.entries(d.borrados||{}).sort()]);

  /* ---- registro de cambios (lo llaman las páginas al guardar) ---- */
  function touch(k){if(!sincroniza(k))return;const t=ls.obj('ipnt.t',{}),b=ls.obj('ipnt.b',{});t[k]=Date.now();delete b[k];ls.put('ipnt.t',t);ls.put('ipnt.b',b);programar()}
  // escritura de las páginas: solo cuenta como cambio si el valor es distinto (volver a guardar lo mismo no gana la fusión)
  function set(k,v){const antes=ls.get(k);if(!ls.set(k,v))return;if(antes!==v)touch(k)}
  function borrar(k){if(!sincroniza(k))return;const t=ls.obj('ipnt.t',{}),b=ls.obj('ipnt.b',{});delete t[k];b[k]=Date.now();ls.put('ipnt.t',t);ls.put('ipnt.b',b);programar()}
  function programar(){if(!cuenta)return;clearTimeout(timer);timer=setTimeout(()=>{timer=null;sincronizar(false)},3000)}

  /* ---- Microsoft Entra ID + OneDrive (carpeta de la aplicación) ---- */
  const cargarMsal=()=>window.msal?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src=CFG.msal;s.integrity=CFG.sri;s.crossOrigin='anonymous';
    s.onload=ok;s.onerror=()=>no(new Error('No se pudo cargar el inicio de sesión de Microsoft. Revisa tu conexión.'));document.head.appendChild(s)});
  const pagina=()=>location.origin+location.pathname;
  async function msalListo(){
    if(pca) return pca;
    await cargarMsal();
    pca=new msal.PublicClientApplication({auth:{clientId:CFG.clientId,authority:'https://login.microsoftonline.com/'+CFG.tenant,redirectUri:pagina(),navigateToLoginRequestUrl:false},
      cache:{cacheLocation:'localStorage'}});
    await pca.initialize();
    const r=await pca.handleRedirectPromise().catch(e=>{st.error=texto(e);return null});
    cuenta=r?.account||pca.getActiveAccount()||pca.getAllAccounts()[0]||null;
    if(cuenta){pca.setActiveAccount(cuenta);ls.set('ipnt.cuenta',cuenta.username)}
    return pca;
  }
  async function token(){
    try{return (await pca.acquireTokenSilent({scopes:SCOPES,account:cuenta})).accessToken}
    catch(e){if(e instanceof msal.InteractionRequiredAuthError){st.fase='expirada';throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')}throw e}
  }
  const G='https://graph.microsoft.com/v1.0/me/drive/special/approot:/'+FILE;
  async function graph(url,o={}){const r=await fetch(url,{...o,headers:{...(o.headers||{}),Authorization:'Bearer '+await token()}});return r}
  async function bajar(){
    const r=await graph(G);
    if(r.status===404) return {doc:null,etag:null};
    if(!r.ok) throw new Error('OneDrive respondió '+r.status+' al leer tu perfil.');
    const it=await r.json(), c=it['@microsoft.graph.downloadUrl']?await fetch(it['@microsoft.graph.downloadUrl']):await graph(G+':/content');
    return {doc:validar(await c.json()),etag:it.eTag};
  }
  async function subir(d,etag){
    const r=await graph(G+':/content',{method:'PUT',headers:{'Content-Type':'application/json',...(etag?{'If-Match':etag}:{'If-None-Match':'*'})},body:JSON.stringify(d)});
    if(r.status===412||r.status===409) return null;   // otro dispositivo escribió antes: se vuelve a fusionar
    if(!r.ok) throw new Error('OneDrive respondió '+r.status+' al guardar tu perfil.');
    return true;
  }
  function sincronizar(alAbrir){
    if(!cuenta) return Promise.resolve(0);
    if(busy){programar();return busy}
    st.fase='sync';st.error='';pintar();
    busy=(async()=>{
      let cambios=0;
      for(let i=0;i<3;i++){
        const {doc,etag}=await bajar();
        if(doc) cambios+=fusionar(doc);
        const mio=documento(doc);
        if(doc&&firma(doc)===firma(mio)) return cambios;
        if(await subir(mio,etag)) return cambios;
      }
      throw new Error('No se pudo guardar: otro dispositivo está escribiendo al mismo tiempo. Intenta de nuevo.');
    })().then(n=>{
      st.fase='ok';st.ultimo=new Date().toISOString();ls.set('ipnt.last',st.ultimo);
      if(n>0){
        // con la página recién abierta se recarga sola (una vez); a mitad del uso, se avisa
        let ya=false;try{ya=sessionStorage.getItem('ipnt.recarga')==='1'}catch(e){}
        if(alAbrir&&!ya){try{sessionStorage.setItem('ipnt.recarga','1')}catch(e){}location.reload();return n}
        st.fase='cambios';
      }
      try{sessionStorage.removeItem('ipnt.recarga')}catch(e){}
      return n;
    }).catch(e=>{st.fase=st.fase==='expirada'?'expirada':'error';st.error=texto(e);return 0}).finally(()=>{busy=null;pintar()});
    return busy;
  }
  const texto=e=>{const m=String(e?.errorMessage||e?.message||e||'');
    if(/AADSTS65001|consent/i.test(m)) return 'El IPN aún no autoriza esta aplicación para las cuentas institucionales (se requiere el consentimiento del administrador).';
    if(/user_cancelled|cancel/i.test(m)) return 'Inicio de sesión cancelado.';
    return m.split('\n')[0].slice(0,220)};
  async function entrar(){
    st.error='';st.fase='login';pintar();
    try{
      await msalListo();
      const req={scopes:SCOPES,prompt:'select_account',redirectUri:new URL('auth.html',location.href).href};
      let r;
      try{r=await pca.loginPopup(req)}
      catch(e){ // ventanas emergentes bloqueadas (frecuente en teléfonos): inicio de sesión en la misma pestaña
        if(/popup_window_error|empty_window_error|block/i.test(String(e?.errorCode||e?.message))){await pca.loginRedirect({scopes:SCOPES,prompt:'select_account'});return}
        throw e}
      cuenta=r.account;pca.setActiveAccount(cuenta);ls.set('ipnt.cuenta',cuenta.username);
      await sincronizar(true);
    }catch(e){st.fase='error';st.error=texto(e);pintar()}
  }
  async function salir(borrarLocal){
    try{if(pca&&cuenta)await pca.clearCache({account:cuenta})}catch(e){}
    cuenta=null;ls.del('ipnt.cuenta');ls.del('ipnt.last');st={fase:'',ultimo:null,error:''};
    if(borrarLocal){for(const k of ls.keys())if(/^(hu\.|ue\.|saes\.|ipnt\.)/.test(k))ls.del(k);location.reload();return}
    pintar();
  }

  /* ---- respaldo en archivo ---- */
  function descargar(){
    const d=documento(null), a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,1)],{type:'application/json'}));
    a.download='ipn-tools-respaldo-'+new Date().toISOString().slice(0,10)+'.ipnt.json';
    document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);
  }
  async function restaurar(file){
    const d=validar(JSON.parse(await file.text())), ahora=Date.now(), t=ls.obj('ipnt.t',{});let n=0;
    const b=ls.obj('ipnt.b',{});
    for(const [k,e] of Object.entries(d.claves)) if(SYNC.test(k)&&!LOCAL.test(k)&&e){ls.set(k,JSON.stringify(e.v));t[k]=ahora;delete b[k];n++}
    ls.put('ipnt.t',t);ls.put('ipnt.b',b);
    if(cuenta) await sincronizar(false);
    return n;
  }

  /* ---- interfaz ---- */
  const $i=id=>document.getElementById(id);
  const hora=iso=>{if(!iso)return'';const d=new Date(iso);return d.toLocaleDateString('es-MX',{day:'numeric',month:'short'})+' '+d.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})};
  function pintar(){
    const btn=$i('ipnt-open'), dl=$i('ipnt-dlg');if(!btn||!dl)return;
    const on=!!cuenta, nom=on?(cuenta.name||cuenta.username):'';
    btn.classList.toggle('on',on);btn.classList.toggle('warn',st.fase==='error'||st.fase==='expirada'||st.fase==='cambios');
    btn.querySelector('span').textContent=on?(nom.split(/\s+/)[0]||'Mi cuenta'):'Iniciar sesión';
    btn.title=on?`Sesión: ${cuenta.username}`:'Inicia sesión con tu cuenta institucional para guardar tus datos';
    $i('ipnt-out').hidden=on;$i('ipnt-in').hidden=!on;
    $i('ipnt-login').disabled=!CFG.clientId||st.fase==='login';$i('ipnt-soon').hidden=!!CFG.clientId;
    if(on){$i('ipnt-who').textContent=nom+(cuenta.name?` · ${cuenta.username}`:'');}
    const s=$i('ipnt-state'), f=st.fase;
    s.className='ipnt-state '+(f==='error'||f==='expirada'?'bad':f==='cambios'?'warn':f==='ok'?'ok':'');
    s.innerHTML=f==='sync'?'Sincronizando…':f==='login'?'Abriendo el inicio de sesión de Microsoft…':
      f==='cambios'?'Se recibieron cambios de otro dispositivo. <button class="link" type="button" data-ipnt-reload>Recargar para verlos</button>':
      f==='error'||f==='expirada'?esc(st.error):on&&st.ultimo?'Guardado en tu OneDrive · '+hora(st.ultimo):on?'Conectado.':'';
    if(!on&&st.error&&f!=='sync'){s.className='ipnt-state bad';s.textContent=st.error}
    $i('ipnt-saes').checked=!!opt().saes;
    $i('ipnt-relogin').hidden=f!=='expirada';
  }
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function wire(){
    const dl=$i('ipnt-dlg'), btn=$i('ipnt-open');if(!dl||!btn)return;
    const abrir=()=>{if(dl.showModal&&!dl.open)dl.showModal();else dl.setAttribute('open','');if(CFG.clientId)msalListo().catch(()=>{});pintar()};
    const cerrar=()=>{if(dl.close)dl.close();else dl.removeAttribute('open')};
    btn.addEventListener('click',abrir);$i('ipnt-x').addEventListener('click',cerrar);dl.addEventListener('click',e=>{if(e.target===dl)cerrar()});
    $i('ipnt-login').addEventListener('click',entrar);$i('ipnt-relogin').addEventListener('click',entrar);
    $i('ipnt-sync').addEventListener('click',()=>sincronizar(false));
    $i('ipnt-logout').addEventListener('click',()=>salir(false));
    $i('ipnt-wipe').addEventListener('click',()=>{const c=$i('ipnt-wipe-ok');c.hidden=!c.hidden});
    $i('ipnt-wipe-yes').addEventListener('click',()=>salir(true));
    $i('ipnt-saes').addEventListener('change',e=>{const o=opt();o.saes=e.target.checked;ls.put('ipnt.opt',o);if(o.saes)touch('saes.alumno');programar()});
    $i('ipnt-down').addEventListener('click',descargar);
    $i('ipnt-file').addEventListener('change',async e=>{const f=e.target.files[0],m=$i('ipnt-filemsg');if(!f)return;
      try{const n=await restaurar(f);m.className='ipnt-state ok';m.textContent=`Respaldo restaurado (${n} elementos). Recargando…`;setTimeout(()=>location.reload(),900)}
      catch(err){m.className='ipnt-state bad';m.textContent=texto(err)}e.target.value=''});
    dl.addEventListener('click',e=>{if(e.target.closest('[data-ipnt-reload]'))location.reload()});
    // al volver a la pestaña se traen los cambios de otros dispositivos; al salir se guarda lo pendiente
    document.addEventListener('visibilitychange',()=>{if(!cuenta)return;
      if(document.visibilityState==='hidden'){if(timer){clearTimeout(timer);timer=null;sincronizar(false)}}
      else if(!st.ultimo||Date.now()-new Date(st.ultimo)>60000)sincronizar(false)});
    pintar();
    // sesión guardada o regreso del inicio de sesión en la misma pestaña
    if(CFG.clientId&&(ls.get('ipnt.cuenta')||/[#&?](code|error)=/.test(location.hash+location.search)))
      msalListo().then(()=>{pintar();if(cuenta)sincronizar(true)}).catch(e=>{st.fase='error';st.error=texto(e);pintar()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else setTimeout(wire,0);
  return {set,touch,borrar,documento,fusionar,validar,sincronizar,descargar,restaurar,get cuenta(){return cuenta}};
})();
"""

CSS = r"""
.ipnt-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:999px;padding:4px 12px 4px 6px;font:inherit;font-size:.86rem;font-weight:600;cursor:pointer;white-space:nowrap;position:relative}
.ipnt-btn:hover{border-color:var(--accent)}
.ipnt-btn svg{flex:none;color:var(--muted)}
.ipnt-btn.on svg{color:var(--ok)}
.ipnt-btn.warn::after{content:"";position:absolute;top:1px;right:1px;width:8px;height:8px;border-radius:50%;background:var(--warn)}
@media (max-width:600px){.ipnt-btn span{display:none}.ipnt-btn{padding:4px 6px}}
.ipnt-dlg h3{margin:16px 0 6px;font-size:1rem}
.ipnt-dlg .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ipnt-dlg .chk{display:flex;gap:8px;align-items:flex-start;font-size:.9rem;margin-top:10px}
.ipnt-dlg .chk input{margin-top:3px}
.ipnt-state{font-size:.88rem;min-height:1.3em;margin:8px 0 0}
.ipnt-state.ok{color:var(--ok)} .ipnt-state.bad{color:var(--bad)} .ipnt-state.warn{color:var(--warn)}
.ipnt-file{position:relative;overflow:hidden}
.ipnt-file input{position:absolute;inset:0;opacity:0;cursor:pointer}
.ipnt-ms{display:inline-flex;align-items:center;gap:8px}
.ipnt-dlg button:disabled{opacity:.5;cursor:not-allowed}
"""

UI = """<button class="ipnt-btn" id="ipnt-open" type="button" aria-haspopup="dialog" title="Inicia sesión con tu cuenta institucional para guardar tus datos">
<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Iniciar sesión</span></button>
<dialog class="saes-dlg ipnt-dlg" id="ipnt-dlg" aria-labelledby="ipnt-h">
  <div class="dl-head"><h2 id="ipnt-h">Tu cuenta y tus datos</h2><button class="x" id="ipnt-x" type="button" aria-label="Cerrar">×</button></div>
  <div id="ipnt-out">
    <p style="margin:0;font-size:.92rem">Sin sesión, tus planes, marcas y actividades se guardan solo en este navegador. Inicia sesión con tu cuenta institucional para conservarlos y usarlos en cualquier dispositivo.</p>
    <div class="row" style="margin-top:12px"><button class="btn primary ipnt-ms" id="ipnt-login" type="button">
      <svg viewBox="0 0 21 21" width="16" height="16" aria-hidden="true"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
      Iniciar sesión con @alumno.ipn.mx</button></div>
    <p class="saes-note" id="ipnt-soon" style="margin:8px 0 0">El inicio de sesión con la cuenta institucional estará disponible próximamente. Mientras tanto, usa el respaldo en archivo.</p>
  </div>
  <div id="ipnt-in" hidden>
    <p style="margin:0;font-size:.92rem"><b id="ipnt-who"></b></p>
    <div class="row" style="margin-top:10px"><button class="btn" id="ipnt-sync" type="button">Sincronizar ahora</button><button class="btn primary" id="ipnt-relogin" type="button" hidden>Volver a iniciar sesión</button><button class="btn" id="ipnt-logout" type="button">Cerrar sesión</button><button class="link" id="ipnt-wipe" type="button">Cerrar sesión y borrar mis datos de este navegador</button></div>
    <div class="row" id="ipnt-wipe-ok" hidden style="margin-top:8px;font-size:.88rem">¿Borrar de este navegador tus planes, marcas, actividades y datos del SAES? Tu copia en OneDrive se conserva. <button class="btn" id="ipnt-wipe-yes" type="button">Sí, borrar</button></div>
    <label class="chk"><input type="checkbox" id="ipnt-saes"><span>Guardar también mis datos del SAES (kárdex, estado general y cita) en mi OneDrive.</span></label>
  </div>
  <p class="ipnt-state" id="ipnt-state" aria-live="polite"></p>
  <h3>Respaldo en archivo</h3>
  <p class="saes-note" style="margin:0 0 8px">Descarga tus datos para guardarlos o pasarlos a otro navegador. Restaurar reemplaza los datos de este navegador por los del archivo.</p>
  <div class="row"><button class="btn" id="ipnt-down" type="button">Descargar respaldo</button><label class="btn ipnt-file">Restaurar desde archivo<input type="file" id="ipnt-file" accept=".json,application/json"></label></div>
  <p class="ipnt-state" id="ipnt-filemsg" aria-live="polite"></p>
  <p class="saes-note" style="margin:14px 0 0">Tus datos se guardan en tu propio OneDrive, en la carpeta <b>Aplicaciones › IPN-tools</b>; la herramienta solo tiene acceso a esa carpeta. No hay servidor intermedio: nadie más puede consultarlos.</p>
</dialog>"""

AUTH = """<!doctype html><html lang="es"><meta charset="utf-8"><title>Iniciando sesión…</title>
<body style="font:16px system-ui,sans-serif;padding:24px;color:#52525b">Iniciando sesión…</body></html>
"""


def inject(html):
    cfg = config()
    js = JS.replace("/*__IPNT_CFG__*/{}", json.dumps(cfg), 1)
    html = html.replace("/*__CUENTA_JS__*/", js, 1).replace("/*__CUENTA_CSS__*/", CSS, 1)
    return html.replace("<!--__CUENTA_BTN__-->", UI, 1)
