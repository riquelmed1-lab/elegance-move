import { readFile, writeFile } from 'node:fs/promises';
import { inflateSync, deflateSync } from 'node:zlib';

const source=(await readFile('assets/elegance-app-icon.b64','utf8')).trim();
const png=Buffer.from(source,'base64');
const PNG_SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);

function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){
    crc^=byte;
    for(let i=0;i<8;i++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}

function chunk(type,data){
  const typeBuf=Buffer.from(type,'ascii');
  const out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);
  typeBuf.copy(out,4);
  data.copy(out,8);
  out.writeUInt32BE(crc32(Buffer.concat([typeBuf,data])),8+data.length);
  return out;
}

function paeth(a,b,c){
  const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  return pa<=pb&&pa<=pc?a:pb<=pc?b:c;
}

function decodePng(buffer){
  if(buffer.length<33||!buffer.subarray(0,8).equals(PNG_SIGNATURE)) throw new Error('Approved Elegance icon is not PNG');
  let offset=8,width=0,height=0,bitDepth=0,colorType=0,interlace=0,palette=null,alpha=null;
  const idat=[];
  while(offset+12<=buffer.length){
    const length=buffer.readUInt32BE(offset),type=buffer.toString('ascii',offset+4,offset+8),data=buffer.subarray(offset+8,offset+8+length);
    if(type==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];interlace=data[12];
    } else if(type==='PLTE') palette=data;
    else if(type==='tRNS') alpha=data;
    else if(type==='IDAT') idat.push(data);
    else if(type==='IEND') break;
    offset+=12+length;
  }
  if(bitDepth!==8||interlace!==0) throw new Error(`Unsupported approved PNG format: bitDepth=${bitDepth}, interlace=${interlace}`);
  const channels={0:1,2:3,3:1,4:2,6:4}[colorType];
  if(!channels) throw new Error(`Unsupported approved PNG color type: ${colorType}`);
  const rowBytes=width*channels,raw=inflateSync(Buffer.concat(idat));
  if(raw.length!==(rowBytes+1)*height) throw new Error('Approved PNG pixel stream has unexpected size');
  const rows=Buffer.alloc(rowBytes*height);
  let src=0;
  for(let y=0;y<height;y++){
    const filter=raw[src++],row=rows.subarray(y*rowBytes,(y+1)*rowBytes),prev=y?rows.subarray((y-1)*rowBytes,y*rowBytes):null;
    for(let x=0;x<rowBytes;x++){
      const value=raw[src++],left=x>=channels?row[x-channels]:0,up=prev?prev[x]:0,upLeft=prev&&x>=channels?prev[x-channels]:0;
      let predictor=0;
      if(filter===1) predictor=left;
      else if(filter===2) predictor=up;
      else if(filter===3) predictor=Math.floor((left+up)/2);
      else if(filter===4) predictor=paeth(left,up,upLeft);
      else if(filter!==0) throw new Error(`Unsupported PNG filter: ${filter}`);
      row[x]=(value+predictor)&255;
    }
  }
  const rgba=Buffer.alloc(width*height*4);
  for(let i=0;i<width*height;i++){
    const inAt=i*channels,outAt=i*4;
    if(colorType===6){rows.copy(rgba,outAt,inAt,inAt+4);}
    else if(colorType===2){rgba[outAt]=rows[inAt];rgba[outAt+1]=rows[inAt+1];rgba[outAt+2]=rows[inAt+2];rgba[outAt+3]=255;}
    else if(colorType===3){
      const idx=rows[inAt],p=idx*3;
      if(!palette||p+2>=palette.length) throw new Error('Approved PNG palette is invalid');
      rgba[outAt]=palette[p];rgba[outAt+1]=palette[p+1];rgba[outAt+2]=palette[p+2];rgba[outAt+3]=alpha&&idx<alpha.length?alpha[idx]:255;
    } else if(colorType===0){rgba[outAt]=rgba[outAt+1]=rgba[outAt+2]=rows[inAt];rgba[outAt+3]=255;}
    else if(colorType===4){rgba[outAt]=rgba[outAt+1]=rgba[outAt+2]=rows[inAt];rgba[outAt+3]=rows[inAt+1];}
  }
  return {width,height,rgba};
}

function scaleRgba(image,targetWidth,targetHeight){
  const out=Buffer.alloc(targetWidth*targetHeight*4),{width,height,rgba}=image;
  for(let y=0;y<targetHeight;y++){
    const sy=Math.max(0,Math.min(height-1,(y+.5)*height/targetHeight-.5)),y0=Math.floor(sy),y1=Math.min(height-1,y0+1),fy=sy-y0;
    for(let x=0;x<targetWidth;x++){
      const sx=Math.max(0,Math.min(width-1,(x+.5)*width/targetWidth-.5)),x0=Math.floor(sx),x1=Math.min(width-1,x0+1),fx=sx-x0;
      const a=(y0*width+x0)*4,b=(y0*width+x1)*4,c=(y1*width+x0)*4,d=(y1*width+x1)*4,o=(y*targetWidth+x)*4;
      for(let ch=0;ch<4;ch++){
        const top=rgba[a+ch]*(1-fx)+rgba[b+ch]*fx,bottom=rgba[c+ch]*(1-fx)+rgba[d+ch]*fx;
        out[o+ch]=Math.round(top*(1-fy)+bottom*fy);
      }
    }
  }
  return {width:targetWidth,height:targetHeight,rgba:out};
}

function maskable(image,size){
  const inner=Math.round(size*.78),scaled=scaleRgba(image,inner,inner),rgba=Buffer.alloc(size*size*4);
  for(let i=0;i<size*size;i++){const at=i*4;rgba[at]=247;rgba[at+1]=242;rgba[at+2]=239;rgba[at+3]=255;}
  const offset=Math.floor((size-inner)/2);
  for(let y=0;y<inner;y++) for(let x=0;x<inner;x++){
    const s=(y*inner+x)*4,d=((y+offset)*size+(x+offset))*4,alpha=scaled.rgba[s+3]/255;
    rgba[d]=Math.round(scaled.rgba[s]*alpha+rgba[d]*(1-alpha));
    rgba[d+1]=Math.round(scaled.rgba[s+1]*alpha+rgba[d+1]*(1-alpha));
    rgba[d+2]=Math.round(scaled.rgba[s+2]*alpha+rgba[d+2]*(1-alpha));
    rgba[d+3]=255;
  }
  return {width:size,height:size,rgba};
}

function encodePng(image){
  const {width,height,rgba}=image,rowBytes=width*4,raw=Buffer.alloc((rowBytes+1)*height);
  let at=0;
  for(let y=0;y<height;y++){raw[at++]=0;rgba.copy(raw,at,y*rowBytes,(y+1)*rowBytes);at+=rowBytes;}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  return Buffer.concat([PNG_SIGNATURE,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}

if(png.length<5000) throw new Error('Approved Elegance icon is invalid');
const approved=decodePng(png);
if(approved.width!==180||approved.height!==180) throw new Error(`Approved Elegance icon must be 180x180, got ${approved.width}x${approved.height}`);

const icon192=encodePng(scaleRgba(approved,192,192));
const icon512=encodePng(scaleRgba(approved,512,512));
const iconMaskable=encodePng(maskable(approved,512));
const targets=[
  ['public/elegance-move-rose-gold-v9.png',png],
  ['public/apple-touch-icon.png',png],
  ['public/pwa-icon.png',icon192],
  ['public/pwa-icon-192.png',icon192],
  ['public/pwa-icon-512.png',icon512],
  ['public/pwa-icon-maskable.png',iconMaskable],
  ['public/pwa-icon-maskable-512.png',iconMaskable]
];
await Promise.all(targets.map(([path,data])=>writeFile(path,data)));
console.log('APPROVED_PWA_ICON_OK',{source:{bytes:png.length,width:approved.width,height:approved.height},generated:{icon192:icon192.length,icon512:icon512.length,maskable512:iconMaskable.length},targets:targets.map(([path])=>path),version:10});
