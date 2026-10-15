/* Formatos oficiales, sin DOM ni almacenamiento. Coordenadas medidas con pdfplumber:
   [x, base desde arriba, ancho], en puntos sobre páginas de 612 x 792; sin AcroForm.
   Se conservan los originales, incluidas firmas y encabezados. */
(function(raiz){
  const COORDS={
    temporal:{fecha:[332,381,209],paterno:[154,410,142],materno:[307,410,115],nombres:[433,410,128],boleta:[189,449,116],carrera:[396,449,165],correo:[260,635,294],celular:[291,658,263],periodos:[365,678,189]},
    definitiva:{fecha:[349,330,208],paterno:[134,358,142],materno:[288,358,112],nombres:[411,358,158],boleta:[154,418,109],carrera:[351,418,218],correo:[111,458,170],celular:[369,458,200]}
  };
  async function generar({tipo,valores:v,pdfs,texto:tx}){
    let campo='formato';
    try{
      if(!COORDS[tipo]||!pdfs?.[tipo])throw new Error(tx('sin_formato'));
      if(typeof PDFLib==='undefined')throw new Error(tx('biblioteca'));
      const {PDFDocument,StandardFonts,rgb}=PDFLib,doc=await PDFDocument.load(pdfs[tipo]),page=doc.getPages()[0];
      const font=await doc.embedFont(StandardFonts.Helvetica);
      function texto(s,[x,base,w],size=10,min=7){
        s=String(s??'');if(!s)return;
        if(/[\r\n\t]/.test(s))throw new Error(tx('exceso'));
        try{font.encodeText(s)}catch{throw new Error(tx('caracteres'))}
        while(font.widthOfTextAtSize(s,size)>w&&size>min)size-=.25;
        if(font.widthOfTextAtSize(s,size)>w)throw new Error(tx('exceso'));
        page.drawText(s,{x,y:page.getHeight()-base,size,font,color:rgb(0,0,0)});
      }
      for(const [k,c] of Object.entries(COORDS[tipo])){campo=k;texto(v[k],c)}
      campo='motivos';
      // Un renglón por celda del original. Ni recorte ni anexos que oculten un exceso.
      const x=tipo==='temporal'?62:27,w=tipo==='temporal'?492:542,base=tipo==='temporal'?511:520;
      const lineas=[];
      for(const par of String(v.motivos||'').split(/\r?\n/)){
        let l='';for(const palabra of par.split(/\s+/).filter(Boolean)){
          if(l&&font.widthOfTextAtSize(l+' '+palabra,10)>w){lineas.push(l);l=palabra}else l+=(l?' ':'')+palabra;
        }lineas.push(l);
      }
      if(lineas.length>4)throw new Error(tx('exceso'));
      lineas.forEach((l,i)=>texto(l,[x,base+i*25.55,w],10,10));
      return await doc.save();
    }catch(error){
      // Solo contexto técnico: los datos personales nunca aparecen en el log.
      console.error('Bajas: PDF fallido',{tipo,campo,error:error.name});throw error;
    }
  }
  raiz.PdfBajas={generar};
})(globalThis);
