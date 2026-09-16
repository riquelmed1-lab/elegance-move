import { readFile, writeFile } from 'node:fs/promises';

const source=(await readFile('assets/elegance-app-icon.b64','utf8')).trim();
const png=Buffer.from(source,'base64');

if(png.length<5000) throw new Error('Approved Elegance icon is invalid');
if(png[0]!==0x89 || png[1]!==0x50 || png[2]!==0x4e || png[3]!==0x47) throw new Error('Approved Elegance icon is not PNG');
const width=png.readUInt32BE(16);
const height=png.readUInt32BE(20);
if(width!==180 || height!==180) throw new Error(`Approved Elegance icon must be 180x180, got ${width}x${height}`);

const targets=[
  'public/elegance-move-rose-gold-v9.png',
  'public/pwa-icon.png',
  'public/pwa-icon-maskable.png',
  'public/apple-touch-icon.png'
];

await Promise.all(targets.map(path=>writeFile(path,png)));
console.log('APPROVED_PWA_ICON_OK',{pngBytes:png.length,width,height,targets,version:9});
