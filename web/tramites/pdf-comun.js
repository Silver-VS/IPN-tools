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
  async function unir(pdfs){
    const {PDFDocument}=PDFLib,doc=await PDFDocument.create();
    for(const bytes of pdfs){
      const src=await PDFDocument.load(bytes),pages=await doc.copyPages(src,src.getPageIndices());
      pages.forEach(p=>doc.addPage(p));
    }
    return doc.save();
  }
  raiz.PdfTramites={cabe,unir};
})(globalThis);
