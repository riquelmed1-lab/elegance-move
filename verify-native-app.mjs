import { readFile } from 'node:fs/promises';

const [html,css,js]=await Promise.all([
  readFile('public/index.html','utf8'),
  readFile('public/native-app.css','utf8'),
  readFile('public/native-app.js','utf8')
]);

for(const marker of ['ELEGANCE_MOVE_NATIVE_APP_V1','em-app-standalone','#emMobileDock','#emPwaSplash']) if(!css.includes(marker)) throw new Error(`Native app CSS incompleto: ${marker}`);
for(const marker of ['ELEGANCE_MOVE_NATIVE_APP_RUNTIME_V1','em-app-standalone','display-mode: standalone','animateView']) if(!js.includes(marker)) throw new Error(`Native app JS incompleto: ${marker}`);
for(const marker of ['id="elegance-native-app"','id="elegance-native-app-runtime"']) if(!html.includes(marker)) throw new Error(`Native app build incompleto: ${marker}`);
if((html.match(/id="elegance-native-app"/g)||[]).length!==1) throw new Error('Native app CSS duplicado');
if((html.match(/id="elegance-native-app-runtime"/g)||[]).length!==1) throw new Error('Native app JS duplicado');
new Function(js);
console.log('NATIVE_APP_VERIFIED',{cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js),standalone:true});
