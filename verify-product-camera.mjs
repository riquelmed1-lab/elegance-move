import { readFile } from 'node:fs/promises';

const html=await readFile('public/index.html','utf8');
const markers=[
  'id="productPhotoInput"',
  'id="productCameraInput"',
  'capture="environment"',
  'Escolher da galeria',
  'Tirar foto',
  "cameraInput=document.getElementById('productCameraInput')",
  "const photoFile=cameraInput.files?.[0]||photoInput.files?.[0];",
  'function compressProductPhoto(file)',
  '/api/product-image',
  'product-photo-stock',
  'product-photo-sale',
  'dashboard-product-photo',
  'doc-product-photo'
];
for(const marker of markers){
  if(!html.includes(marker)) throw new Error('Fotos de produto/câmera incompletas: '+marker);
}

const mainMarker="<script>\n(function(){\n'use strict';";
const mainOpen=html.indexOf(mainMarker);
if(mainOpen<0) throw new Error('Script principal não encontrado');
const codeStart=mainOpen+'<script>\n'.length;
const codeEnd=html.indexOf('</script>',codeStart);
if(codeEnd<0) throw new Error('Fim do script principal não encontrado');
new Function(html.slice(codeStart,codeEnd));

console.log('PRODUCT_CAMERA_VERIFIED',{gallery:true,camera:true,compression:true,stock:true,sale:true,dashboard:true,a4:true});
