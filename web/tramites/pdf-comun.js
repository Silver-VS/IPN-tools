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
  // Reconoce el tipo por los primeros bytes, no por la extensión: pdf, jpg o png.
  function tipoArchivo(b){
    if(b&&b.length>4&&b[0]===0x25&&b[1]===0x50&&b[2]===0x44&&b[3]===0x46)return 'pdf';
    if(b&&b.length>3&&b[0]===0xFF&&b[1]===0xD8&&b[2]===0xFF)return 'jpg';
    if(b&&b.length>8&&b[0]===0x89&&b[1]===0x50&&b[2]===0x4E&&b[3]===0x47)return 'png';
    return '';
  }
  async function paginas(bytes){return (await PDFLib.PDFDocument.load(bytes)).getPageIndices().length}
  // Una imagen ocupa una hoja carta, ajustada dentro de un margen de 0.5 in y centrada.
  async function imagenAPdf(bytes,tipo){
    const {PDFDocument}=PDFLib,doc=await PDFDocument.create();
    const img=tipo==='png'?await doc.embedPng(bytes):await doc.embedJpg(bytes);
    const margen=36,escala=Math.min((612-2*margen)/img.width,(792-2*margen)/img.height),w=img.width*escala,h=img.height*escala;
    doc.addPage([612,792]).drawImage(img,{x:(612-w)/2,y:(792-h)/2,width:w,height:h});
    return doc.save();
  }
  // Convierte cada anexo (pdf o imagen) en un PDF; el orden recibido es el orden final.
  async function anexosAPdf(archivos){
    const salida=[];
    for(const bytes of archivos){
      const tipo=tipoArchivo(bytes);
      if(tipo==='pdf')salida.push(bytes);else if(tipo)salida.push(await imagenAPdf(bytes,tipo));else throw new Error('anexo_tipo');
    }
    return salida;
  }
  raiz.PdfTramites={cabe,unir,tipoArchivo,paginas,imagenAPdf,anexosAPdf};
})(globalThis);
