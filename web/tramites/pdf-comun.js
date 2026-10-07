/* Funciones sin DOM ni almacenamiento. Las plantillas oficiales nunca se modifican. */
(function(raiz){
  function cabe(texto,{font,ancho,size=10,max=5}){
    const renglones=[];
    let anchoValido=true;
    for(const par of String(texto||'').split('\n')){
      let linea='';
      for(const palabra of par.split(/\s+/).filter(Boolean)){
        if(font.widthOfTextAtSize(palabra,size)>ancho)anchoValido=false;
        if(linea&&font.widthOfTextAtSize(linea+' '+palabra,size)>ancho){renglones.push(linea);linea=palabra}
        else linea+=(linea?' ':'')+palabra;
      }
      renglones.push(linea);
    }
    return {renglones,max,ok:anchoValido&&renglones.length<=max};
  }
  async function unir(pdfs,{texto,vistoBueno}={}){
    const {PDFDocument,StandardFonts}=PDFLib,doc=await PDFDocument.create();
    for(const bytes of pdfs){
      const src=await PDFDocument.load(bytes),pages=await doc.copyPages(src,src.getPageIndices());
      pages.forEach(p=>doc.addPage(p));
    }
    const font=await doc.embedFont(StandardFonts.Helvetica),p=doc.addPage([612,792]);
    let y=730;
    const claves=['instrucciones_titulo','instrucciones_firma',...(vistoBueno?['instrucciones_visto_bueno']:[]),'instrucciones_entrega'];
    for(const clave of claves){
      const valor=texto('sate.ventanilla.'+clave,{persona:vistoBueno||''});
      const {renglones,ok}=cabe(valor,{font,ancho:504,size:11,max:30});
      if(!ok||y-renglones.length*16<54)throw new Error(texto('sate.ventanilla.instrucciones_exceso'));
      for(const linea of renglones){p.drawText(linea,{x:54,y,size:11,font});y-=16}y-=20;
    }
    return doc.save();
  }
  raiz.PdfTramites={cabe,unir};
})(globalThis);
