"""Variantes visuales ("skins") para comparar en vivo. Todas conservan el guinda IPN como acento y Noto Sans.

- institucional: paleta web IPN con neutros cálidos (base de las plantillas).
- lab: inspirada en IBM Carbon (gris 10 #f4f4f4 / gris 100 #161616), esquinas rectas, retícula técnica.
- plano: plano técnico/CAD; tinta azul profunda en oscuro, papel milimétrico en claro, acento oro UPIITA.
- aurora: inspirada en Vercel Geist / Linear; neutros zinc, radios amplios, sombras suaves, brillo sutil.
Se inyectan en las plantillas en /*__SKINS__*/ (CSS) y <!--__SKINUI__--> (selector).
"""

def _theme(name, light, dark, extra=""):
    lt = ";".join(f"{k}:{v}" for k, v in light.items())
    dk = ";".join(f"{k}:{v}" for k, v in dark.items())
    return (f":root[data-skin=\"{name}\"]{{{lt}}}\n"
            f"@media (prefers-color-scheme: dark){{:root[data-skin=\"{name}\"]:not([data-theme=\"light\"]){{{dk};color-scheme:dark}}}}\n"
            f":root[data-skin=\"{name}\"][data-theme=\"dark\"]{{{dk};color-scheme:dark}}\n{extra}\n")


LAB = _theme("lab",
    {"--bg": "#f4f4f4", "--surface": "#ffffff", "--sunken": "#f2f2f2", "--line": "#e0e0e0", "--fg": "#1a1a1a", "--muted": "#525252",
     "--accent": "#750946", "--accent-strong": "#5b1237", "--accent-soft": "#f6edf1", "--band": "#f4f4f4", "--edge": "#8d8d8d",
     "--ok": "#24693d", "--ok-soft": "#defbe6", "--warn": "#6e521d", "--warn-soft": "#fcf4d6", "--bad": "#a2191f", "--bad-soft": "#fff1f1",
     "--r": "2px", "--grid": "rgba(22,22,22,.045)"},
    {"--bg": "#161616", "--surface": "#262626", "--sunken": "#1f1f1f", "--line": "#393939", "--fg": "#e0e0e0", "--muted": "#a8a8a8",
     "--accent": "#e38fb2", "--accent-strong": "#f0b8cf", "--accent-fg": "#1a0910", "--accent-soft": "#3a2430", "--band": "#1c1c1c", "--edge": "#6f6f6f",
     "--ok": "#6fdc8c", "--ok-soft": "#0e3a1f", "--warn": "#f1c21b", "--warn-soft": "#3d3200", "--bad": "#ff8389", "--bad-soft": "#4b1214",
     "--grid": "rgba(244,244,244,.04)", "--st-rest": "#262626", "--own": "#333333"},
    """[data-skin="lab"] body{background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:24px 24px}
[data-skin="lab"] .card,[data-skin="lab"] .subj,[data-skin="lab"] section.step,[data-skin="lab"] .calwrap,[data-skin="lab"] .mapwrap{box-shadow:none}
[data-skin="lab"] .lbl,[data-skin="lab"] label.field>span,[data-skin="lab"] .meta,[data-skin="lab"] .count{font-family:var(--f-mono);letter-spacing:0}
[data-skin="lab"] h1,[data-skin="lab"] h2{font-weight:600;letter-spacing:-.01em}
[data-skin="lab"] .tabs button[aria-selected="true"]{box-shadow:inset 0 -3px 0 var(--accent);border-radius:0}""")

PLANO = _theme("plano",
    {"--bg": "#f2f5f8", "--surface": "#ffffff", "--sunken": "#edf1f5", "--line": "#d3dbe3", "--fg": "#17202b", "--muted": "#4f5b69",
     "--accent": "#750946", "--accent-strong": "#5b1237", "--accent-soft": "#f6edf1", "--band": "#eef2f6", "--edge": "#7b8794",
     "--ok": "#2d6a4a", "--ok-soft": "#e2efe8", "--warn": "#74561a", "--warn-soft": "#f5eedd", "--bad": "#a3283f", "--bad-soft": "#f9e6ea",
     "--gold": "#8c6a26", "--r": "4px", "--grid": "rgba(31,74,124,.07)", "--grid2": "rgba(31,74,124,.035)"},
    {"--bg": "#0d141d", "--surface": "#141e2a", "--sunken": "#101923", "--line": "#273546", "--fg": "#dbe4ee", "--muted": "#97a6b8",
     "--accent": "#ea97ba", "--accent-strong": "#f6c0d6", "--accent-fg": "#1b0a12", "--accent-soft": "#33202d", "--band": "#111a24", "--edge": "#5c6f86",
     "--ok": "#7fd3a3", "--ok-soft": "#123326", "--warn": "#e7c27a", "--warn-soft": "#33290f", "--bad": "#ff9bb0", "--bad-soft": "#3d1622",
     "--gold": "#d4b06a", "--grid": "rgba(120,170,230,.07)", "--grid2": "rgba(120,170,230,.03)",
     "--blk-s": "30%", "--blk-l": "26%", "--st-rest": "#172331", "--own": "#1d2a38"},
    """[data-skin="plano"] body{background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px),linear-gradient(var(--grid2) 1px,transparent 1px),linear-gradient(90deg,var(--grid2) 1px,transparent 1px);background-size:80px 80px,80px 80px,16px 16px,16px 16px}
[data-skin="plano"] header.top{border-bottom:1px solid var(--line);box-shadow:0 2px 0 -1px var(--gold)}
[data-skin="plano"] h1{letter-spacing:.02em}
[data-skin="plano"] h1::after{content:"";display:block;width:56px;height:3px;margin-top:8px;background:linear-gradient(90deg,var(--accent),var(--gold))}
[data-skin="plano"] .lbl,[data-skin="plano"] label.field>span,[data-skin="plano"] .meta{font-family:var(--f-mono);letter-spacing:.02em}
[data-skin="plano"] .card,[data-skin="plano"] .subj,[data-skin="plano"] section.step,[data-skin="plano"] .mapwrap,[data-skin="plano"] .calwrap{border-color:var(--line);box-shadow:0 0 0 1px rgba(255,255,255,.02) inset}
[data-skin="plano"] .box.hot{box-shadow:0 0 0 2px var(--accent),0 0 18px -2px var(--accent)}
[data-skin="plano"] .edge.hot{filter:drop-shadow(0 0 3px var(--accent))}""")

AURORA = _theme("aurora",
    {"--bg": "#fafafa", "--surface": "#ffffff", "--sunken": "#f4f4f5", "--line": "#d9d9de", "--fg": "#18181b", "--muted": "#52525b",
     "--accent": "#750946", "--accent-strong": "#5b1237", "--accent-soft": "#f7eef2", "--band": "#f7f7f8", "--edge": "#a1a1aa",
     "--ok": "#15803d", "--ok-soft": "#ecfdf3", "--warn": "#8a5a00", "--warn-soft": "#fdf6e3", "--bad": "#b42346", "--bad-soft": "#fdecf0",
     "--r": "12px", "--glow1": "rgba(117,9,70,.10)", "--glow2": "rgba(179,142,93,.12)", "--shadow": "0 1px 2px rgba(24,24,27,.05),0 8px 24px -14px rgba(24,24,27,.18)"},
    {"--bg": "#09090b", "--surface": "#18181b", "--sunken": "#111113", "--line": "#323237", "--fg": "#e4e4e7", "--muted": "#a1a1aa",
     "--accent": "#ec9cbf", "--accent-strong": "#f7c6db", "--accent-fg": "#1d0a13", "--accent-soft": "#2e1a24", "--band": "#0f0f11", "--edge": "#52525b",
     "--ok": "#6ee7a0", "--ok-soft": "#0f2a1c", "--warn": "#f5c56b", "--warn-soft": "#2f230b", "--bad": "#fda4b8", "--bad-soft": "#3a1520",
     "--glow1": "rgba(236,156,191,.16)", "--glow2": "rgba(212,176,106,.10)", "--shadow": "0 1px 0 rgba(255,255,255,.04) inset,0 10px 30px -16px rgba(0,0,0,.6)",
     "--blk-s": "30%", "--blk-l": "24%", "--st-rest": "#1c1c1f", "--own": "#26262a"},
    """[data-skin="aurora"] body{background:radial-gradient(1100px 380px at 12% -120px,var(--glow1),transparent 70%),radial-gradient(900px 340px at 92% -140px,var(--glow2),transparent 70%),var(--bg) no-repeat}
[data-skin="aurora"] .card,[data-skin="aurora"] .subj,[data-skin="aurora"] section.step,[data-skin="aurora"] .mapwrap,[data-skin="aurora"] .calwrap,[data-skin="aurora"] .insp{box-shadow:var(--shadow)}
[data-skin="aurora"] h1{letter-spacing:-.025em;font-weight:700}
[data-skin="aurora"] h2{letter-spacing:-.015em}
[data-skin="aurora"] .btn,[data-skin="aurora"] .chip,[data-skin="aurora"] .seg,[data-skin="aurora"] input,[data-skin="aurora"] select{border-radius:999px}
[data-skin="aurora"] .seg button{border-radius:999px}
[data-skin="aurora"] header.top{border-bottom:1px solid var(--line)}""")

CSS = "/* Variantes visuales para comparar (tools/skins.py) */\n" + LAB + PLANO + AURORA + """
body{zoom:var(--ui-zoom,1)}
/* algunos navegadores (Firefox con zoom) no repintan el texto de ejemplo al escribir: se oculta explícitamente */
input:not(:placeholder-shown)::placeholder,textarea:not(:placeholder-shown)::placeholder{color:transparent;opacity:0}
.skinbar[hidden]{display:none}
.title-row{display:flex;align-items:center;gap:12px}
.theme-btn{display:inline-grid;place-items:center;flex:none;width:36px;height:36px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--muted);cursor:pointer;padding:0}
.theme-btn:hover{color:var(--fg);border-color:var(--edge)}
.theme-btn .i-sun{display:none}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .theme-btn .i-sun{display:block}:root:not([data-theme="light"]) .theme-btn .i-moon{display:none}}
:root[data-theme="dark"] .theme-btn .i-sun{display:block}:root[data-theme="dark"] .theme-btn .i-moon{display:none}
.skinbar{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:50;display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:4px 4px 4px 12px;box-shadow:0 6px 24px -10px rgba(0,0,0,.35);font-size:.82rem}
.skinbar .seg{border-radius:999px}
.skinbar .seg button{padding:5px 11px;font-size:.82rem}
@media (max-width:640px){.skinbar{left:8px;right:8px;justify-content:space-between;overflow-x:auto}}
"""

UI = """<div class="skinbar" id="skinbar" role="group" aria-label="Estilo visual" hidden><span class="muted">Estilo</span><div class="seg">
<button data-skin-set="institucional">Institucional</button><button data-skin-set="lab">Laboratorio</button><button data-skin-set="plano">Plano técnico</button><button data-skin-set="aurora">Aurora</button></div></div>
<script>(function(){
  var KEY='skin', valid=['institucional','lab','plano','aurora'];
  // Aurora es el estilo elegido; el selector solo aparece con #estilos (o con el nombre de una variante) para comparar.
  var DEF='aurora', h=location.hash.slice(1);
  if(h==='estilos'||valid.indexOf(h)>=0)document.getElementById('skinbar').hidden=false;
  var get=function(){if(valid.indexOf(h)>=0)return h;if(h!=='estilos')return DEF;try{return localStorage.getItem(KEY)||DEF}catch(e){return DEF}};
  var apply=function(s){document.documentElement.setAttribute('data-skin',s);document.querySelectorAll('[data-skin-set]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.skinSet===s))});try{localStorage.setItem(KEY,s)}catch(e){}window.dispatchEvent(new Event('resize'))};
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-skin-set]');if(b)apply(b.dataset.skinSet)});
  apply(get());
})();</script>"""


# evita el destello del estilo base y aplica el tema claro/oscuro elegido antes de pintar
EARLY = ("<script>(function(){var r=document.documentElement;r.setAttribute('data-skin','aurora');"
         # tema: sigue al navegador; una elección manual dura solo la visita (sessionStorage). Se borra la elección
         # permanente de versiones anteriores para que todos vuelvan a modo automático.
         "try{localStorage.removeItem('theme');var t=sessionStorage.getItem('theme');if(t==='light'||t==='dark')r.setAttribute('data-theme',t)}catch(e){}"
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
    return html.replace("/*__SKINS__*/", CSS, 1).replace("<!--__SKINUI__-->", UI, 1)
