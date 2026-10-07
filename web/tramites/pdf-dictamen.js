/* Estampado oficial conservado; no lee DOM ni almacenamiento. */
(function(raiz){
// Coordenadas medidas con pdfplumber: x y ancho desde la izquierda; base desde el borde superior (792-y).
const COORDS={interno:{paterno:[47,201,172],materno:[229,201,133],nombres:[372,201,191],carrera:[47,238,315],boleta:[372,238,191],telefono:[47,275,119],celular:[176,275,148],correo:[334,275,229],ingreso:[229,446,58],oficios:[446,446,117]},
externo:{apellidos:[102,180,261],nombres:[416,180,139],boleta:[104,194,145],unidad:[338,194,26],carrera:[466,194,89],nacimiento:[147,209,216],civil:[429,209,126],domicilio:[145,224,410],telefono:[145,297,119],correo:[372,297,183],ingreso_ext:[315,312,240],ultimo:[246,327,309],dictamen_fecha:[243,341,120],otras_situacion:[200,472,247],otras_causas:[151,577,400]}};
function nombre(v){return [v.paterno,v.materno,v.nombres].filter(Boolean).join(' ')}
async function generar(datos){
  const {tipo,valores:v,pdfs,texto:txt}=datos;
  const DATA={pdfs};
  if(typeof PDFLib==='undefined')throw new Error(txt('biblioteca'));
  const {PDFDocument,StandardFonts,rgb}=PDFLib;
  const doc=tipo==='carta'?await PDFDocument.create():await PDFDocument.load(DATA.pdfs[tipo]);
  let page=tipo==='carta'?doc.addPage([612,792]):doc.getPages()[0];
  const font=await doc.embedFont(StandardFonts.Helvetica);
  // Se rechaza el desbordamiento en lugar de ocultar o perder datos escritos por el alumno.
  function texto(s,x,base,w,size=9,min=7){
    s=String(s||'');if(!s)return;
    try{font.encodeText(s)}catch(e){throw new Error(txt('caracteres'))}
    while(font.widthOfTextAtSize(s,size)>w&&size>min)size-=.25;
    if(font.widthOfTextAtSize(s,size)>w)throw new Error(txt('exceso'));
    page.drawText(s,{x,y:792-base,size,font,color:rgb(0,0,0)});
  }
  function lineas(s,x,base,w,max,size=9,paso=12){
    const ls=[];
    for(const par of String(s||'').split('\n')){let l='';for(const word of par.split(/\s+/).filter(Boolean)){if(l&&font.widthOfTextAtSize(l+' '+word,size)>w){ls.push(l);l=word}else l+=(l?' ':'')+word}ls.push(l)}
    if(ls.length>max)throw new Error(txt('exceso'));ls.forEach((l,i)=>texto(l,x,base+i*paso,w,size,size));
  }
  function marca(x,base){texto('X',x,base,12,9)}
  const fecha=v.fecha?new Date(v.fecha+'T12:00:00'):null;
  if(fecha&&Number.isNaN(fecha.getTime()))throw new Error(txt('fecha_invalida'));
  const mes=fecha?fecha.toLocaleDateString('es-MX',{month:'long'}):'';
  if(tipo==='carta'){
    texto(txt('carta_titulo'),54,60,504,14);texto(txt(v.tipo==='externo'?'destino_externo':'destino_interno'),54,90,504,10);
    texto(fecha?fecha.toLocaleDateString('es-MX',{dateStyle:'long'}):'',54,118,504,10);
    lineas(txt('carta_datos',{nombre:nombre(v)}),54,145,504,3,10,14);
    lineas(`${txt('boleta')}: ${v.boleta} | ${txt('carrera')}: ${v.carrera}`,54,190,504,3,10,14);
    let ls=[];for(const p of v.motivos.split('\n')){let l='';for(const word of p.split(/\s+/).filter(Boolean)){if(l&&font.widthOfTextAtSize(l+' '+word,11)>504){ls.push(l);l=word}else l+=(l?' ':'')+word}ls.push(l)}
    let base=250;for(const l of ls){if(base>620){page=doc.addPage([612,792]);base=60}texto(l,54,base,504,11,11);base+=16}
    if(base>590){page=doc.addPage([612,792]);base=60}
    texto(txt('correo')+': '+v.correo,54,base+35,504,10);texto(txt(v.celular?'celular':'telefono')+': '+(v.celular||v.telefono),54,base+55,504,10);
    texto(nombre(v),54,base+115,504,10);texto(txt('firma'),54,base+140,504,10);
  }else{
    const campos={...v,telefono:tipo==='externo'?(v.celular||v.telefono):v.telefono,apellidos:[v.paterno,v.materno].filter(Boolean).join(' '),unidad:v.unidad==='UPIITA-IPN'?'UPIITA':v.unidad};
    Object.entries(COORDS[tipo]).forEach(([k,c])=>texto(campos[k],...c,tipo==='externo'?8:9,tipo==='externo'?6:7));
    if(tipo==='interno'){
      if(fecha){texto(fecha.getDate(),273,153,18);texto(mes,332,153,107);texto(fecha.getFullYear(),505,153,58)}
      if(['98','1998'].includes(v.plan))texto('X',215,422,6,6,6);else if(['09','2009'].includes(v.plan))texto('X',263,422,6,6,6);else if(v.plan)throw new Error(txt('plan_no_admitido'));
      if(/^s[ií]$/i.test(v.anteriores))marca(482,422);else if(/^no$/i.test(v.anteriores))marca(548,422);
      lineas(v.peticion,48,329,514,5,10,14);
      if(v.filas.length>8)throw new Error(txt('filas_exceso'));
      v.filas.forEach((r,i)=>{const b=497+i*12.3;texto([r.clave,r.nombre].filter(Boolean).join(' · '),47,b,315,8,6);texto(r.nivel,372,b,64,8);texto(r.cursada,446,b,50,8);texto(r.recursada,506,b,57,8,6)});
    }else{
      if(fecha){texto(fecha.getDate(),446,128,14,7);texto(mes,478,128,39,7,6);
        // El original solo admite 201_: una máscara localizada actualiza la fecha sin alterar el resto.
        page.drawRectangle({x:533,y:661,width:24,height:11,color:rgb(1,1,1)});texto(fecha.getFullYear(),534,128,22,7)}
      for(const [g,b] of [['dependientes',253],['hijos',268]]){if(v[g].includes('si'))marca(495,b);if(v[g].includes('no'))marca(539,b)}
      for(const [k,x] of [['propio',157],['pareja',286],['no_contestar',535]])if(v.embarazo.includes(k))marca(x,283);
      if(v.organo.includes('ctce'))marca(445,341);if(v.organo.includes('cgc'))marca(540,341);
      v.situacion.forEach(k=>marca(460,378+(+k.slice(1)-1)*18.9));
      lineas(v.peticion,58,506,491,4,7,8);
      const causas={salud:123,economica:208,familiar:293,legal:378,laboral:456,administrativa:545};
      v.causas.forEach(k=>marca(k==='otras'?124:causas[k],k==='otras'?577:559));
      const anexos={boleta_global:[290,614],probatorios:[514,614],carta_anexo:[290,629],otros_anexos:[514,629],dictamenes:[290,644],bajas:[290,658]};
      v.anexos.forEach(k=>marca(...anexos[k]));texto(v.correo,61,691,490,9);texto(nombre(v),100,737,190,9,6);
    }
  }
  return doc.save();
}

raiz.PdfDictamen={generar,cabe: (texto,recuadro)=>PdfTramites.cabe(texto,recuadro)};
})(globalThis);
