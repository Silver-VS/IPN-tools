"""Tema visual común de Horarios y Electivas: solo el institucional (neutros zinc y acento guinda) con claro/oscuro.

Las variantes lab/plano/aurora y su selector se retiraron (decisión del dueño, 2026-10-06). Aquí quedan: el script que aplica
el tema antes de pintar y la escala en pantallas anchas, el botón claro/oscuro y las reglas del aspecto antes llamado aurora.
Se inyecta en las plantillas en /*__SKINS__*/ (CSS) y <!--__THEME_BTN__--> (botón).
"""

CSS = """/* Ajustes comunes del tema institucional (tools/skins.py) */
body{background:radial-gradient(1100px 380px at 12% -120px,var(--glow1),transparent 70%),radial-gradient(900px 340px at 92% -140px,var(--glow2),transparent 70%),var(--bg) no-repeat}
.card,.subj,section.step,.mapwrap,.calwrap,.insp{box-shadow:var(--shadow)}
h1{letter-spacing:-.025em;font-weight:700}
h2{letter-spacing:-.015em}
.btn,.chip,.seg,input,select{border-radius:999px}
.seg button{border-radius:999px}
header.top{border-bottom:1px solid var(--line)}
body{zoom:var(--ui-zoom,1)}
/* algunos navegadores (Firefox con zoom) no repintan el texto de ejemplo al escribir: se oculta explícitamente */
input:not(:placeholder-shown)::placeholder,textarea:not(:placeholder-shown)::placeholder{color:transparent;opacity:0}
.title-row{display:flex;align-items:center;gap:12px}
.theme-btn{display:inline-grid;place-items:center;flex:none;width:36px;height:36px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--muted);cursor:pointer;padding:0}
.theme-btn:hover{color:var(--fg);border-color:var(--edge)}
.theme-btn .i-sun{display:none}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .theme-btn .i-sun{display:block}:root:not([data-theme="light"]) .theme-btn .i-moon{display:none}}
:root[data-theme="dark"] .theme-btn .i-sun{display:block}:root[data-theme="dark"] .theme-btn .i-moon{display:none}
"""

# evita el destello del estilo base y aplica el tema claro/oscuro elegido antes de pintar
EARLY = ("<script>(function(){var r=document.documentElement;"
         # tema: sigue al navegador; una elección manual dura solo la visita (sessionStorage). Se borra la elección
         # permanente de versiones anteriores para que todos vuelvan a modo automático.
         "try{localStorage.removeItem('theme');localStorage.removeItem('skin');var t=sessionStorage.getItem('theme');if(t==='light'||t==='dark')r.setAttribute('data-theme',t)}catch(e){}"
         # escala en pantallas anchas: el contenido se diseña para ~1550 px; más ancho, todo crece (máx. 1.35×).
         # Con zoom manual del navegador el ancho útil baja y la escala vuelve a 1 (no se acumula).
         "var z=function(){var v=Math.min(1.35,Math.max(1,innerWidth/1550));r.style.setProperty('--ui-zoom',v.toFixed(3))};"
         "z();addEventListener('resize',z)})()</script>")

# Selector claro/oscuro junto al título (<!--__THEME_BTN__-->). Por defecto sigue al navegador; el botón cambia el tema
# durante la visita y, si coincide con el del sistema o el sistema cambia, vuelve a modo automático.
THEME_BTN = """<button class="theme-btn" id="theme-btn" type="button" aria-label="Cambiar tema claro u oscuro" title="Cambiar a tema oscuro">
<svg class="i-moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
<svg class="i-sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
</button>
<script>(function(){
  var r=document.documentElement,b=document.getElementById('theme-btn'),mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
  var dark=function(){var t=r.getAttribute('data-theme');return t?t==='dark':!!(mq&&mq.matches)};
  var label=function(){var d=dark();b.title=d?'Cambiar a tema claro':'Cambiar a tema oscuro';b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',String(d))};
  var auto=function(){r.removeAttribute('data-theme');try{sessionStorage.removeItem('theme')}catch(e){}};
  b.addEventListener('click',function(){var n=dark()?'light':'dark',sys=mq&&mq.matches?'dark':'light';
    if(n===sys)auto();else{r.setAttribute('data-theme',n);try{sessionStorage.setItem('theme',n)}catch(e){}}
    label();window.dispatchEvent(new Event('resize'))});
  if(mq&&mq.addEventListener)mq.addEventListener('change',function(){auto();label();window.dispatchEvent(new Event('resize'))});
  label();
})();</script>"""


def inject(html):
    html = html.replace("</title>", "</title>\n" + EARLY, 1)
    html = html.replace("<!--__THEME_BTN__-->", THEME_BTN, 1)
    return html.replace("/*__SKINS__*/", CSS, 1).replace("<!--__SKINUI__-->", "", 1)   # el marcador SKINUI ya no se usa
