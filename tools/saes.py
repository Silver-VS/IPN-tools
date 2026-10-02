"""Conexión con el SAES (v2) sin servidores: marcador "Lector UPIITA" + carga por pegado en las páginas.

- bookmarklet(tool_url): convierte tools/lector_saes.js en un enlace javascript: (solo lectura en el SAES).
- JS/CSS/HTML comunes que se inyectan en las plantillas:
    /*__SAES_JS__*/        objeto SAES: guardar/leer/borrar los datos del alumno (solo en este navegador)
    <!--__SAES_CARD__-->   botón "Usar mis datos del SAES" + ventana con instrucciones y área para pegar
                           (la ventana es un <dialog>: no ocupa lugar en la página ni la desplaza)
    Cualquier elemento con [data-saes-open] también abre la ventana.
"""
import pathlib, re, urllib.parse, json, html, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "lector_saes.js"
SAES_URL = "https://www.saes.upiita.ipn.mx/"


def lector_js(tool_url=""):
    """Código del Lector UPIITA sin comentarios (para el marcador completo o para publicarlo como lector.js)."""
    js = SRC.read_text(encoding="utf-8")
    js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)          # el código no usa comentarios de línea
    js = "\n".join(l.strip() for l in js.splitlines() if l.strip())
    return js.replace("__TOOL_URL__", tool_url)


def bookmarklet(tool_url=""):
    return "javascript:" + urllib.parse.quote(lector_js(tool_url), safe="")


def loader(base):
    """Marcador corto (~180 caracteres) que descarga lector.js del sitio: Chrome para Android corta los marcadores largos."""
    return ("javascript:(function(){var s=document.createElement('script');"
            "s.src='" + base + "lector.js?v='+Date.now();document.head.appendChild(s)})()")


JS = r"""
/* ---------- datos del SAES (v2): solo en este navegador ---------- */
const SAES={
  KEY:'saes.alumno',
  load(){try{const v=JSON.parse(localStorage.getItem(this.KEY)||'null');return v&&v.upiita_saes===1?v:null}catch(e){return null}},
  save(d){if(window.IPNT)IPNT.set(this.KEY,JSON.stringify(d));else try{localStorage.setItem(this.KEY,JSON.stringify(d))}catch(e){}},
  clear(){try{localStorage.removeItem(this.KEY)}catch(e){}if(window.IPNT)IPNT.borrar(this.KEY)},
  parse(t){try{const d=JSON.parse(String(t||'').trim());if(d&&d.upiita_saes===1&&Array.isArray(d.acreditadas))return d}catch(e){}return null},
  autorizada(d){const m=String(d?.avance?.autorizada||'').match(/(\d+(?:\.\d+)?)\s*CR/i)||String(d?.avance?.autorizada||'').match(/(\d+(?:\.\d+)?)/);return m?+m[1]:null},
  open(){const dl=document.getElementById('saes-dlg');if(!dl)return;if(dl.showModal&&!dl.open)dl.showModal();else dl.setAttribute('open','')},
  close(){const dl=document.getElementById('saes-dlg');if(!dl)return;if(dl.close)dl.close();else dl.removeAttribute('open')},
  /* conecta el botón y la ventana: abrir, arrastrar el marcador, copiar su código y pegar los datos */
  wire(onLoad){
    const dl=document.getElementById('saes-dlg');if(!dl)return;
    const paste=dl.querySelector('#saes-paste'), msg=dl.querySelector('#saes-msg');
    document.querySelectorAll('[data-saes-open]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();SAES.open()}));
    dl.querySelector('#saes-x').addEventListener('click',()=>SAES.close());
    dl.addEventListener('click',e=>{if(e.target===dl)SAES.close()});   // clic fuera de la ventana
    const take=t=>{const d=SAES.parse(t);if(!d){msg.innerHTML='<span class="bad">El contenido no corresponde al Lector UPIITA. Ejecuta el marcador en el SAES y selecciona «Copiar mis datos».</span>';return}
      SAES.save(d);paste.value='';msg.innerHTML='<span class="ok">Datos del SAES cargados.</span>';onLoad(d);setTimeout(()=>SAES.close(),900)};
    paste.addEventListener('paste',e=>{e.preventDefault();take(e.clipboardData.getData('text'))});
    paste.addEventListener('input',()=>{if(paste.value.trim().startsWith('{'))take(paste.value)});
    // copiar el código: portapapeles moderno, luego execCommand; si ambos fallan, queda seleccionado para copiarlo a mano
    dl.querySelector('#saes-copybm').addEventListener('click',async e=>{const b=e.currentTarget,box=dl.querySelector('#saes-bmcode'),m=dl.querySelector('#saes-copymsg');
      let ok=false;try{await navigator.clipboard.writeText(box.value);ok=true}catch(err){}
      if(!ok){box.focus();box.select();box.setSelectionRange(0,box.value.length);try{ok=document.execCommand('copy')}catch(err){}}
      b.textContent=ok?'Copiado ✓':'Copiar';m.textContent=ok?'Código copiado. Pégalo como dirección (URL) del marcador.':'El navegador no permitió copiar: el código ya está seleccionado; mantén presionado y elige «Copiar».';
      if(ok)setTimeout(()=>{b.textContent='Copiar'},2500)});
    dl.querySelector('#saes-again').addEventListener('click',()=>{dl.querySelector('#saes-steps').hidden=false});
    dl.querySelector('#saes-clear').addEventListener('click',e=>{
      if(!e.target.dataset.confirm){e.target.dataset.confirm='1';e.target.textContent='Confirmar: borrar mis datos';setTimeout(()=>{delete e.target.dataset.confirm;e.target.textContent='Borrar mis datos'},4000);return}
      SAES.clear();msg.textContent='Tus datos del SAES se borraron de este navegador.';onLoad(null)});
  },
  /* aviso cuando se explora una carrera distinta a la del perfil cargado: nada del perfil se aplica ni se modifica */
  mismatch(car,nameOf,onBack){
    const el=document.getElementById('saes-mismatch');if(!el)return;
    const d=SAES.load(), cap=s=>String(s||'').toLowerCase().replace(/(^|\s)(\S)/g,(m,a,b)=>a+b.toUpperCase()).replace(/\b(En|De|Y)\b/g,w=>w.toLowerCase()).replace(/^Ingenieria\b/,'Ingeniería');
    let hid=null;try{hid=localStorage.getItem('saes.aviso')}catch(e){}
    if(!d||!d.carrera||d.carrera===car||hid===d.leido){el.hidden=true;return}
    const mine=cap(nameOf(d.carrera)||d.carrera_nombre), here=cap(nameOf(car));
    el.innerHTML=`<p><b>Consultando ${here||'otra carrera'}.</b> Tus datos del SAES corresponden a ${mine}; el avance y las sugerencias no se aplican en esta carrera.</p>`+
      `<div class="mm-act"><button class="btn" type="button" data-mm="back">Volver a ${mine}</button><button class="btn" type="button" data-mm="load">Usar datos de otra sesión</button><button class="x" type="button" data-mm="hide" aria-label="Ocultar este aviso" title="Ocultar este aviso">×</button></div>`;
    el.hidden=false;
    el.onclick=e=>{const a=e.target.closest('[data-mm]')?.dataset.mm;if(!a)return;
      if(a==='back')onBack(d.carrera);else if(a==='load')SAES.open();
      else{try{localStorage.setItem('saes.aviso',d.leido)}catch(err){}el.hidden=true}};
  },
  status(d){
    const st=document.getElementById('saes-status'), btn=document.getElementById('saes-open');
    if(btn){btn.classList.toggle('on',!!d);btn.querySelector('span').textContent=d?'Mis datos del SAES':'Usar mis datos del SAES';
      btn.title=d?'Datos del SAES cargados. Selecciona para actualizarlos o eliminarlos.':'Incorpora tu avance desde el SAES (opcional)'}
    if(!st)return;
    st.hidden=!d;document.getElementById('saes-steps').hidden=!!d;document.getElementById('saes-clear').hidden=!d;
    if(!d)return;
    const f=new Date(d.leido).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'});
    st.querySelector('#saes-who').textContent=`${d.carrera_nombre||''} · boleta ${d.boleta||'—'} · leídos el ${f}`;
  }
};
"""

CSS = r"""
.saes-open{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.saes-open::before{content:"";width:9px;height:9px;border-radius:50%;border:2px solid currentColor;flex:none}
.saes-open.on::before{background:var(--ok);border-color:var(--ok)}
.saes-dlg{width:min(600px,calc(100vw / var(--ui-zoom,1) - 32px));max-height:calc(100vh / var(--ui-zoom,1) - 48px);overflow:auto;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--fg);padding:20px 22px;box-shadow:0 24px 60px -16px rgba(0,0,0,.45)}
.saes-dlg::backdrop{background:rgba(20,12,16,.45)}
.saes-dlg h2{margin:0;font-size:1.25rem}
.saes-dlg .dl-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px}
.saes-dlg .x{border:0;background:none;font-size:1.5rem;line-height:1;cursor:pointer;color:var(--muted);padding:2px 6px}
.saes-dlg ol{margin:10px 0;padding-left:1.3rem;display:flex;flex-direction:column;gap:12px;font-size:.92rem}
.saes-dlg li>p{margin:4px 0}
.saes-dlg details{margin-top:6px;font-size:.86rem;border-left:3px solid var(--line);padding:2px 0 2px 10px}
.saes-dlg summary{cursor:pointer;color:var(--accent);font-weight:600}
.saes-dlg details ul{margin:6px 0;padding-left:1.1rem;display:flex;flex-direction:column;gap:4px}
.saes-dlg kbd{font-family:var(--f-mono,ui-monospace,monospace);font-size:.8em;border:1px solid var(--line);border-bottom-width:2px;border-radius:4px;padding:0 4px;background:var(--bg)}
.saes-bm{display:inline-flex;align-items:center;gap:6px;background:var(--accent);color:var(--accent-fg);border-radius:999px;padding:5px 14px;font-weight:600;text-decoration:none;cursor:grab}
.saes-paste{width:100%;min-height:2.8rem;resize:none;font-size:.9rem}
.saes-note{font-size:.8rem;color:var(--muted)}
.saes-code{display:flex;gap:8px;align-items:stretch;margin:6px 0 4px}
.saes-code textarea{flex:1;min-width:0;font:12px/1.4 ui-monospace,Consolas,monospace;resize:vertical;word-break:break-all}
.saes-mm[hidden]{display:none}
.saes-mm{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;margin-top:12px;padding:10px 12px 10px 14px;border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:var(--r);background:var(--surface);font-size:.88rem}
.saes-mm p{margin:0;flex:1 1 360px;min-width:0}
.saes-mm .mm-act{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.saes-mm .x{border:0;background:none;font-size:1.3rem;line-height:1;cursor:pointer;color:var(--muted);padding:2px 6px}
#saes-msg .ok{color:var(--ok);font-weight:600} #saes-msg .bad{color:var(--bad);font-weight:600}
"""


def card(bm_href, page="horarios", short=""):
    # en el sitio publicado, el código para teléfono es el marcador corto (descarga lector.js)
    code_text = html.escape(short or bm_href)
    copy_note = " (versión corta: descarga el Lector desde este sitio)" if short else ""
    version = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")   # para saber si el navegador ya cargó la última versión
    what = ("tu avance académico: materias acreditadas, reprobadas y en curso, carga autorizada y fecha de cita"
            if page == "horarios" else "tu nombre, boleta y carrera, así como las electivas liberadas")
    return f"""<button class="btn saes-open" id="saes-open" type="button" data-saes-open aria-haspopup="dialog"><span>Usar mis datos del SAES</span></button>
<dialog class="saes-dlg" id="saes-dlg" aria-labelledby="saes-h">
  <div class="dl-head"><h2 id="saes-h">Usa tus datos del SAES</h2><button class="x" id="saes-x" type="button" aria-label="Cerrar">×</button></div>
  <p style="margin:0;font-size:.92rem">Opcional. Incorpora {what}. La información se procesa en tu navegador y no se envía a ningún servidor.</p>
  <div id="saes-status" hidden><p style="margin:10px 0 0;font-size:.92rem"><b>Datos del SAES cargados.</b> <span class="muted" id="saes-who"></span></p>
    <p class="saes-note" style="margin:4px 0 0">Para actualizarlos, ejecuta de nuevo el marcador en el SAES y pega el resultado abajo. <button class="link" id="saes-again" type="button">Ver instrucciones</button></p></div>
  <div id="saes-steps">
    <ol>
      <li><b>Guarda el Lector UPIITA en tu navegador</b> (solo la primera vez).
        <p class="muted">Un <b>marcador</b> (favorito) es un acceso guardado en el navegador. El Lector UPIITA, en lugar de abrir una página, consulta tu información dentro del SAES.</p>
        <p>Arrastra este botón a tu barra de marcadores: <a class="saes-bm" id="saes-bm" href="{bm_href}" draggable="true" onclick="event.preventDefault()">Lector UPIITA</a></p>
        <details><summary>Mostrar la barra de marcadores</summary><ul>
          <li><b>Chrome, Edge, Brave u Opera:</b> pulsa <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> (en Mac, <kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd>).</li>
          <li><b>Firefox:</b> clic derecho en la barra superior › Barra de marcadores › Mostrar siempre.</li>
          <li><b>Safari:</b> menú Visualización › Mostrar barra de favoritos (<kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd>).</li>
        </ul></details>
        <details><summary>Instalación manual o en teléfono</summary>
          <ol>
            <li>Copia el código del marcador{copy_note}:
              <div class="saes-code"><textarea id="saes-bmcode" readonly rows="3" aria-label="Código del marcador" onfocus="this.select()">{code_text}</textarea>
                <button class="btn primary" id="saes-copybm" type="button">Copiar</button></div>
              <small class="saes-note" id="saes-copymsg" aria-live="polite">Si el botón no copia, mantén presionado el recuadro y elige «Seleccionar todo» y después «Copiar».</small></li>
            <li>Guarda cualquier página como marcador (<kbd>Ctrl</kbd>+<kbd>D</kbd> o la estrella de la barra de direcciones).</li>
            <li>Edita el marcador: asigna el nombre <b>Lector UPIITA</b> y sustituye la <b>dirección (URL)</b> por el código copiado.</li>
          </ol>
          <p><b>Cómo usarlo según el navegador del teléfono:</b></p>
          <ul>
            <li><b>Firefox (Android, iPhone o iPad):</b> con el SAES abierto, abre tus marcadores y elige <b>Lector UPIITA</b>.</li>
            <li><b>Safari (iPhone o iPad):</b> en cualquier página, toca <b>Compartir</b> › <b>Agregar marcador</b> y guárdalo con el nombre <b>Lector UPIITA</b>. Abre <b>Marcadores</b> › <b>Editar</b>, toca ese marcador y sustituye su dirección por el código copiado. Con el SAES abierto, toca la barra de direcciones y elige <b>Lector UPIITA</b> en la sección de marcadores (aparece como guardado recientemente).</li>
            <li><b>Chrome (Android):</b> abrirlo desde la lista de marcadores no funciona. Con el SAES abierto, toca la barra de direcciones, escribe <b>Lector UPIITA</b> y elige el marcador en las sugerencias.</li>
            <li><b>Chrome (iPhone o iPad):</b> guarda cualquier página como marcador, edítalo con el nombre <b>Lector UPIITA</b> y sustituye su dirección por el código copiado. Con el SAES abierto, ejecuta el marcador.</li>
          </ul></details></li>
      <li><b>Entra al SAES</b> (<a href="{SAES_URL}" target="_blank" rel="noopener">saes.upiita.ipn.mx</a>), inicia sesión y pulsa el marcador <b>Lector UPIITA</b>. Revisa el resumen y pulsa <b>Copiar mis datos</b>.</li>
      <li><b>Regresa aquí y pega</b> (<kbd>Ctrl</kbd>+<kbd>V</kbd>) en este recuadro:</li>
    </ol>
  </div>
  <textarea class="saes-paste" id="saes-paste" placeholder="Pega aquí tus datos del SAES (Ctrl+V)" aria-label="Pegar datos del SAES"></textarea>
  <div class="actions" style="display:flex;gap:8px;align-items:center;margin-top:8px"><span id="saes-msg" aria-live="polite" style="font-size:.86rem"></span><button class="btn" id="saes-clear" type="button" style="margin-left:auto" hidden>Borrar mis datos</button></div>
  <p class="saes-note" style="margin:10px 0 0">El marcador solo consulta tu Kárdex, tu Estado general, tu horario actual y tu Cita de reinscripción; no inscribe, no modifica ni envía nada. Los datos se guardan únicamente en este navegador.</p>
  <p class="saes-note" style="margin:6px 0 0">Versión de la página: {version}</p>
</dialog>"""


def inject(html, page, tool_url=""):
    bm = bookmarklet(tool_url)
    short = loader(tool_url.rsplit("/", 1)[0] + "/") if tool_url.startswith("https://") and "claude.ai" not in tool_url else ""
    html = html.replace("/*__SAES_JS__*/", JS, 1).replace("/*__SAES_CSS__*/", CSS, 1)
    return html.replace("<!--__SAES_CARD__-->", card(bm, page, short), 1)
