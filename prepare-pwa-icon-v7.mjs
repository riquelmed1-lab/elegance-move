import { copyFile, access } from 'node:fs/promises';

const source='public/pwa-icon.png';
const target='public/elegance-move-icon-v7.png';
await access(source);
await copyFile(source,target);
console.log('PWA_ICON_V7_READY',{source,target});
