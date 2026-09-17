import { readFile, writeFile } from 'node:fs/promises';

const file='public/index.html';
let html=await readFile(file,'utf8');

const inputNeedle='<input id="productPhotoInput" type="file" accept="image/*" class="product-photo-input"><div class="product-photo-actions"><label for="productPhotoInput" class="btn btn-soft">Adicionar / trocar foto</label>';
const inputReplacement='<input id="productPhotoInput" type="file" accept="image/*" class="product-photo-input"><input id="productCameraInput" type="file" accept="image/*" capture="environment" class="product-photo-input"><div class="product-photo-actions"><label for="productPhotoInput" class="btn btn-soft">Escolher da galeria</label><label for="productCameraInput" class="btn btn-soft">Tirar foto</label>';
if(html.includes(inputNeedle)) html=html.replace(inputNeedle,inputReplacement);
else if(!html.includes('id="productCameraInput"')) throw new Error('Editor de foto do produto não encontrado.');

const setupNeedle="let removePhoto=false;const photoInput=document.getElementById('productPhotoInput'),photoPreview=document.getElementById('productPhotoPreview'),removePhotoBtn=document.getElementById('removeProductPhoto');photoInput.onchange=()=>{const file=photoInput.files?.[0];if(!file)return;removePhoto=false;const local=URL.createObjectURL(file);photoPreview.innerHTML='<span class=\"product-photo product-photo-large\"><img src=\"'+local+'\" alt=\"Prévia da foto\"></span>';removePhotoBtn.style.display='inline-flex'};removePhotoBtn.onclick=()=>{removePhoto=true;photoInput.value='';photoPreview.innerHTML=productPhotoMarkup('','Produto','product-photo-large');removePhotoBtn.style.display='none'};";
const setupReplacement="let removePhoto=false;const photoInput=document.getElementById('productPhotoInput'),cameraInput=document.getElementById('productCameraInput'),photoPreview=document.getElementById('productPhotoPreview'),removePhotoBtn=document.getElementById('removeProductPhoto');const showSelectedProductPhoto=input=>{const file=input?.files?.[0];if(!file)return;removePhoto=false;if(input===photoInput)cameraInput.value='';else photoInput.value='';const local=URL.createObjectURL(file);photoPreview.innerHTML='<span class=\"product-photo product-photo-large\"><img src=\"'+local+'\" alt=\"Prévia da foto\"></span>';removePhotoBtn.style.display='inline-flex'};photoInput.onchange=()=>showSelectedProductPhoto(photoInput);cameraInput.onchange=()=>showSelectedProductPhoto(cameraInput);removePhotoBtn.onclick=()=>{removePhoto=true;photoInput.value='';cameraInput.value='';photoPreview.innerHTML=productPhotoMarkup('','Produto','product-photo-large');removePhotoBtn.style.display='none'};";
if(html.includes(setupNeedle)) html=html.replace(setupNeedle,setupReplacement);
else if(!html.includes("cameraInput=document.getElementById('productCameraInput')")) throw new Error('Controle da foto do produto não encontrado.');

const fileNeedle="const photoFile=photoInput.files?.[0];";
const fileReplacement="const photoFile=cameraInput.files?.[0]||photoInput.files?.[0];";
if(html.includes(fileNeedle)) html=html.replace(fileNeedle,fileReplacement);
else if(!html.includes("const photoFile=cameraInput.files?.[0]||photoInput.files?.[0];")) throw new Error('Seleção da foto do produto não encontrada.');

for(const marker of ['id="productCameraInput"','capture="environment"','Escolher da galeria','Tirar foto',"cameraInput=document.getElementById('productCameraInput')","const photoFile=cameraInput.files?.[0]||photoInput.files?.[0];"]){
  if(!html.includes(marker)) throw new Error('Captura por câmera incompleta: '+marker);
}

await writeFile(file,html,'utf8');
console.log('PRODUCT_CAMERA_PATCH_OK',{bytes:Buffer.byteLength(html),gallery:true,camera:true});
