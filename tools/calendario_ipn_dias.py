import fitz, sys, json, re, datetime as dt
CIRC=False
pdf=sys.argv[1]; p=fitz.open(pdf)[0]
W=[w for w in p.get_text('words')]
MESES=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
titulos=[w for w in W if w[4] in MESES]
# cada título define un bloque: días debajo (hasta 130 pt) y en su columna (±85 pt del centro)
dias=[w for w in W if re.fullmatch(r'\d{1,2}',w[4]) and w[1]>titulos[0][1] and w[1]<1500]
leg_y=min(w[1] for w in W if w[4]=='Inscripción')-5 if any(w[4]=='Inscripción' for w in W) else 9e9
dr=p.get_drawings()
def col(c): return tuple(round(v,2) for v in c) if c else None
def cerca(a,b,t=0.06): return a and b and all(abs(x-y)<=t for x,y in zip(a,b))
REGLAS=[  # (categoria, test)
 ('inscripcion_reinscripcion', lambda f,s,k,da: cerca(f,(0.09,0.4,0.2))),
 ('registro_ordinaria',        lambda f,s,k,da: cerca(f,(0.44,0.23,0.59))),
 ('registro_extraordinaria',   lambda f,s,k,da: cerca(f,(0.97,0.92,0.09))),
 ('inscripcion_ets',           lambda f,s,k,da: cerca(f,(0.12,0.16,0.36))),
 ('ets',                       lambda f,s,k,da: cerca(f,(0.58,0.72,0.88),0.1) and 're' in k),
 ('vacaciones',                lambda f,s,k,da: cerca(f,(0.88,0.89,0.89),0.05)),
 ('saberes_previos',           lambda f,s,k,da: cerca(f,(0.98,0.8,0.68))),
 ('planeacion_docente',        lambda f,s,k,da: cerca(s,(0.75,0.12,0.15)) and 're' in k),
 ('nivelacion_nuevo_ingreso',  lambda f,s,k,da: da and cerca(s,(0.23,0.33,0.64))),
 ('induccion_ns',              lambda f,s,k,da: cerca(s,(0.98,0.9,0.27),0.06) and 're' in k),
 ('induccion_nms',             lambda f,s,k,da: cerca(s,(0.17,0.68,0.89),0.06) and 're' in k),
 ('examen_grado_posgrado',     lambda f,s,k,da: cerca(s,(0.73,0.32,0.62)) and 're' in k),
 ('descanso_obligatorio',      lambda f,s,k,da: cerca(s,(0.14,0.12,0.13)) and 're' in k),
 ('descanso_sindical',         lambda f,s,k,da: cerca(s,(0.33,0.56,0.79),0.08) and 'c' in k and CIRC),
 ('induccion_nms',             lambda f,s,k,da: cerca(s,(0.33,0.56,0.79),0.08) and 'c' in k and not CIRC),
 ('limite_calificaciones_posgrado', lambda f,s,k,da: cerca(s,(0.93,0.24,0.59)) and 'c' in k),
 ('inicio_periodo',            lambda f,s,k,da: cerca(f,(0.58,0.81,0.57)) or cerca(s,(0.0,0.65,0.32))),
 ('inicio_periodo_nms',        lambda f,s,k,da: cerca(s,(0.17,0.68,0.89)) and 'l' in k and 're' not in k),
 ('fin_periodo',               lambda f,s,k,da: cerca(s,(0.94,0.25,0.21)) and 'l' in k),
 ('dia_politecnico',           lambda f,s,k,da: cerca(f,(0.44,0.11,0.28)) and 'c' in k),
]
def cats_de(w):
    cx,cy=(w[0]+w[2])/2,(w[1]+w[3])/2; out=set()
    for x in dr:
        R=x['rect']
        if R.y0>leg_y-2: continue
        # celdas/rangos: contienen el centro; símbolos chicos (triángulo/círculo): se traslapan con la celda
        dentro=R.x0-1<=cx<=R.x1+1 and R.y0-1<=cy<=R.y1+1
        if not dentro and not (R.width<20 and R.height<20 and R.intersects(fitz.Rect(w[0]-4,w[1]-4,w[2]+4,w[3]+4))): continue
        f,s=col(x.get('fill')),col(x.get('color')); k=''.join(sorted(set(i[0] for i in x['items']))); da=bool(x.get('dashes') and x['dashes']!='[] 0')
        global CIRC; CIRC=R.width<22 and abs(R.width-R.height)<4
        for cat,t in REGLAS:
            try:
                if t(f,s,k,da): out.add(cat)
            except Exception: pass
    return out
res=[]
orden=sorted(titulos,key=lambda t:(round(t[1]/50),t[0]))
anio={}; y=2026
for t in orden:  # agosto 2026 … agosto 2027 por orden de lectura
    m=MESES.index(t[4])+1
    if m==1: y=2027
    anio[id(t)]=(y,m)
for w in dias:
    if w[1]>leg_y: continue
    cx=(w[0]+w[2])/2
    cand=[t for t in titulos if t[1]<w[1]<t[1]+185 and abs(cx-(t[0]+t[2])/2)<90]
    if not cand: continue
    t=max(cand,key=lambda t:t[1]); y,m=anio[id(t)]
    try: f=dt.date(y,m,int(w[4]))
    except ValueError: continue
    c=cats_de(w)
    if c: res.append((f.isoformat(),sorted(c)))
res.sort()
json.dump(res,sys.stdout,ensure_ascii=False)
