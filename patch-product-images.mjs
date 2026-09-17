import { readFile, writeFile } from 'node:fs/promises';

const file='public/index.html';
let html=await readFile(file,'utf8');

const helperMarker='function productPhotoMarkup(url,name,extraClass)';
if(!html.includes(helperMarker)){
  const insertAt=html.indexOf('function productModal(p){');
  if(insertAt<0) throw new Error('productModal não encontrado');
  const helpers=String.raw`function productPhotoMarkup(url,name,extraClass){const cls=extraClass?' '+extraClass:'';return url?'<span class="product-photo'+cls+'"><img src="'+esc(url)+'" alt="'+esc(name||'Produto')+'" loading="lazy"></span>':'<span class="product-photo product-photo-empty'+cls+'" aria-hidden="true">◇</span>'}
function productImageUrlByName(name){const n=String(name||'').trim().toUpperCase(),matches=db.products.filter(p=>String(p.name||'').trim().toUpperCase()===n);return matches.find(p=>p.imageUrl)?.imageUrl||matches[0]?.imageUrl||''}
function compressProductPhoto(file){return new Promise((resolve,reject)=>{if(!file||!String(file.type||'').startsWith('image/'))return reject(new Error('Selecione uma imagem válida.'));const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{try{let max=1200,quality=.82,data='';for(let attempt=0;attempt<4;attempt++){const scale=Math.min(1,max/Math.max(img.naturalWidth||1,img.naturalHeight||1)),w=Math.max(1,Math.round((img.naturalWidth||1)*scale)),h=Math.max(1,Math.round((img.naturalHeight||1)*scale)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);data=canvas.toDataURL('image/jpeg',quality);if(data.length<1900000)break;max=Math.round(max*.78);quality=Math.max(.68,quality-.05)}URL.revokeObjectURL(url);if(!data||data.length>=2700000)return reject(new Error('A foto ficou muito pesada. Tente outra imagem.'));resolve(data)}catch(e){URL.revokeObjectURL(url);reject(e)}};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Não foi possível ler esta imagem.'))};img.src=url})}
async function uploadProductPhoto(productId,file,previousUrl=''){const dataUrl=await compressProductPhoto(file),r=await fetch('/api/product-image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId,dataUrl,previousUrl})}),data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error==='Image too large'?'A foto ficou muito pesada.':(data.error||'Não foi possível enviar a foto.'));return data.url}
async function deleteProductPhoto(productId,imageUrl=''){const r=await fetch('/api/product-image',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId,imageUrl})});if(!r.ok)throw new Error('Não foi possível remover a foto.');return true}
`;
  html=html.slice(0,insertAt)+helpers+html.slice(insertAt);
}

const priceNeedle=String.raw`<label><span class="label">Preço de venda</span><input id="productPrice" name="price" type="number" min="0" step="0.01" class="input" value="'+(p?.price??0)+'"></label><div class="span2 status-box">`;
const priceReplacement=String.raw`<label><span class="label">Preço de venda</span><input id="productPrice" name="price" type="number" min="0" step="0.01" class="input" value="'+(p?.price??0)+'"></label><div class="span2 product-photo-editor"><div id="productPhotoPreview" class="product-photo-editor-preview">'+productPhotoMarkup(p?.imageUrl||'',p?.name||'Produto','product-photo-large')+'</div><div class="product-photo-editor-copy"><div class="label" style="margin-bottom:5px">Foto do produto</div><div class="muted" style="font-size:10px;line-height:1.5">No celular, toque em escolher foto para usar a câmera ou a galeria. A imagem será otimizada automaticamente.</div><input id="productPhotoInput" type="file" accept="image/*" class="product-photo-input"><div class="product-photo-actions"><label for="productPhotoInput" class="btn btn-soft">Adicionar / trocar foto</label><button type="button" id="removeProductPhoto" class="btn btn-soft" '+(p?.imageUrl?'':'style="display:none"')+'>Remover foto</button></div></div></div><div class="span2 status-box">`;
if(html.includes(priceNeedle)) html=html.replace(priceNeedle,priceReplacement); else if(!html.includes('id="productPhotoInput"')) throw new Error('Campo de preço do produto não encontrado');

const submitNeedle="document.getElementById('productForm').onsubmit=e=>{";
if(html.includes(submitNeedle)) html=html.replace(submitNeedle,"let removePhoto=false;const photoInput=document.getElementById('productPhotoInput'),photoPreview=document.getElementById('productPhotoPreview'),removePhotoBtn=document.getElementById('removeProductPhoto');photoInput.onchange=()=>{const file=photoInput.files?.[0];if(!file)return;removePhoto=false;const local=URL.createObjectURL(file);photoPreview.innerHTML='<span class=\"product-photo product-photo-large\"><img src=\"'+local+'\" alt=\"Prévia da foto\"></span>';removePhotoBtn.style.display='inline-flex'};removePhotoBtn.onclick=()=>{removePhoto=true;photoInput.value='';photoPreview.innerHTML=productPhotoMarkup('','Produto','product-photo-large');removePhotoBtn.style.display='none'};document.getElementById('productForm').onsubmit=async e=>{");

const objNeedle="const obj={id:p?.id||id('prod'),code,name,category,size:upperData(f.get('size')),color:upperData(f.get('color')),stock:Math.max(0,Number(f.get('stock')||0)),price:Math.max(0,Number(f.get('price')||0)),cost:Math.max(0,Number(f.get('cost')||0))};";
const objReplacement="const productId=p?.id||id('prod');let imageUrl=p?.imageUrl||'';const photoFile=photoInput.files?.[0];try{if(photoFile){toast('Enviando foto do produto...');imageUrl=await uploadProductPhoto(productId,photoFile,imageUrl)}else if(removePhoto&&p?.imageUrl){await deleteProductPhoto(productId,p.imageUrl);imageUrl=''}}catch(err){return toast(err?.message||'Não foi possível salvar a foto.','err')}const obj={id:productId,code,name,category,size:upperData(f.get('size')),color:upperData(f.get('color')),stock:Math.max(0,Number(f.get('stock')||0)),price:Math.max(0,Number(f.get('price')||0)),cost:Math.max(0,Number(f.get('cost')||0)),imageUrl};";
if(html.includes(objNeedle)) html=html.replace(objNeedle,objReplacement); else if(!html.includes('let imageUrl=p?.imageUrl')) throw new Error('Objeto de produto não encontrado');

const deleteProductNeedle="function delProduct(pid){const p=db.products.find(x=>x.id===pid);if(!p)return;confirmModal('Excluir produto?','O produto '+p.name+' será removido do estoque. O histórico das vendas será preservado.','Excluir produto',()=>{db.products=db.products.filter(x=>x.id!==pid);save();render();toast('Produto excluído.')})}";
const deleteProductReplacement="function delProduct(pid){const p=db.products.find(x=>x.id===pid);if(!p)return;confirmModal('Excluir produto?','O produto '+p.name+' será removido do estoque. O histórico das vendas será preservado.','Excluir produto',async()=>{if(p.imageUrl){try{await deleteProductPhoto(pid,p.imageUrl)}catch(err){console.warn('Falha ao limpar foto do produto',err)}}db.products=db.products.filter(x=>x.id!==pid);save();render();toast('Produto excluído.')})}";
if(html.includes(deleteProductNeedle)) html=html.replace(deleteProductNeedle,deleteProductReplacement); else if(!html.includes("console.warn('Falha ao limpar foto do produto'")) throw new Error('Exclusão de produto não encontrada');

const stockStart="<tr><td><b>'+esc(p.name)+'</b><div class=\"code-pill\">";
const stockStartReplacement="<tr><td><div class=\"product-stock-cell\">'+productPhotoMarkup(p.imageUrl||'',p.name,'product-photo-stock')+'<div class=\"product-stock-copy\"><b>'+esc(p.name)+'</b><div class=\"code-pill\">";
if(html.includes(stockStart)) html=html.replace(stockStart,stockStartReplacement);
const stockEnd="<div class=\"muted\" style=\"font-size:10px;margin-top:4px\">'+esc(p.category)+'</div></td><td>";
const stockEndReplacement="<div class=\"muted\" style=\"font-size:10px;margin-top:4px\">'+esc(p.category)+'</div></div></div></td><td>";
if(html.includes(stockEnd)) html=html.replace(stockEnd,stockEndReplacement);

const saleStart="<div class=\"product-row\"><div><b>'+esc(p.name)+'</b><div class=\"muted\" style=\"font-size:11px;margin-top:4px\">";
const saleStartReplacement="<div class=\"product-row\"><div class=\"sale-product-info\">'+productPhotoMarkup(p.imageUrl||'',p.name,'product-photo-sale')+'<div class=\"sale-product-copy\"><b>'+esc(p.name)+'</b><div class=\"muted\" style=\"font-size:11px;margin-top:4px\">";
if(html.includes(saleStart)) html=html.replace(saleStart,saleStartReplacement);
const saleEnd="'+p.stock+' em estoque</div></div><div class=\"qty\">";
const saleEndReplacement="'+p.stock+' em estoque</div></div></div><div class=\"qty\">";
if(html.includes(saleEnd)) html=html.replace(saleEnd,saleEndReplacement);

const topNeedle="top.map(x=>'<div class=\"list-row\"><div class=\"list-row-main\"><b>'+esc(x[0])+'</b>";
const topReplacement="top.map(x=>'<div class=\"list-row premium-product-with-photo\">'+productPhotoMarkup(productImageUrlByName(x[0]),x[0],'dashboard-product-photo')+'<div class=\"list-row-main\"><b>'+esc(x[0])+'</b>";
if(html.includes(topNeedle)) html=html.replace(topNeedle,topReplacement);

for(const marker of ['function productPhotoMarkup(url,name,extraClass)','function compressProductPhoto(file)','/api/product-image','previousUrl','id="productPhotoInput"','imageUrl};','product-photo-stock','product-photo-sale','dashboard-product-photo',"console.warn('Falha ao limpar foto do produto'"]){
  if(!html.includes(marker)) throw new Error('Patch de fotos incompleto: '+marker);
}

await writeFile(file,html,'utf8');
console.log('PRODUCT_IMAGES_PATCH_OK',{bytes:Buffer.byteLength(html),deleteCleanup:true,stableStoragePath:true});
