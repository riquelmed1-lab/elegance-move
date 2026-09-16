import { readFile } from 'node:fs/promises';

const [html,css,js]=await Promise.all([
  readFile('public/index.html','utf8'),
  readFile('public/login-premium.css','utf8'),
  readFile('public/login-premium.js','utf8')
]);

for(const marker of ['ELEGANCE_MOVE_LOGIN_PREMIUM_V1','em-login-screen','.em-login-brand','#loginForm','.em-password-toggle']) if(!css.includes(marker)) throw new Error(`Login premium CSS incompleto: ${marker}`);
for(const marker of ['ELEGANCE_MOVE_LOGIN_PREMIUM_RUNTIME_V1','decorateLogin','Bem-vinda de volta','elegance-move-rose-gold-v9.png','em-login-screen']) if(!js.includes(marker)) throw new Error(`Login premium JS incompleto: ${marker}`);
for(const marker of ['id="elegance-login-premium"','id="elegance-login-premium-runtime"']) if(!html.includes(marker)) throw new Error(`Login premium build incompleto: ${marker}`);
if((html.match(/id="elegance-login-premium"/g)||[]).length!==1) throw new Error('Login premium CSS duplicado');
if((html.match(/id="elegance-login-premium-runtime"/g)||[]).length!==1) throw new Error('Login premium JS duplicado');
new Function(js);
console.log('LOGIN_PREMIUM_VERIFIED',{cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js)});
