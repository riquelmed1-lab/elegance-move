import { copyFile, access, readFile, writeFile } from 'node:fs/promises';

const source='public/pwa-icon.png';
const target='public/elegance-move-icon-v7.png';
await access(source);
await copyFile(source,target);

const replaceInFile=async(path,replacements)=>{
  let text=await readFile(path,'utf8');
  for(const [from,to] of replacements) text=text.split(from).join(to);
  await writeFile(path,text,'utf8');
};

await replaceInFile('public/index.html',[
  ['/pwa-icon.png?v=5','/elegance-move-icon-v7.png'],
  ['/pwa-icon.png','/elegance-move-icon-v7.png'],
  ['manifest.webmanifest?v=5','manifest.webmanifest?v=7']
]);
await replaceInFile('public/manifest.webmanifest',[
  ['/pwa-icon.png?v=5','/elegance-move-icon-v7.png'],
  ['/pwa-icon.png','/elegance-move-icon-v7.png']
]);
await replaceInFile('public/pwa-runtime.js',[
  ['/pwa-icon.png','/elegance-move-icon-v7.png']
]);
await replaceInFile('public/sw.js',[
  ['elegance-move-pwa-v4','elegance-move-pwa-v7'],
  ['/pwa-icon.png','/elegance-move-icon-v7.png']
]);

console.log('PWA_ICON_V7_READY',{source,target});
