import { readFile, writeFile } from 'node:fs/promises';

const indexPath = 'public/index.html';
const controllerPath = 'public/password-recovery.js';

let html = await readFile(indexPath, 'utf8');
const controller = await readFile(controllerPath, 'utf8');

for (const marker of ['Esqueci minha senha', '/auth/v1/recover', 'recoveryPasswordForm', '/auth/v1/user']) {
  if (!controller.includes(marker)) throw new Error(`password-recovery.js inválido: marcador ausente ${marker}`);
}

if (!html.includes('src="/password-recovery.js"')) {
  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose < 0) throw new Error('index.html inválido: </body> não encontrado');
  html = html.slice(0, bodyClose) + '<script src="/password-recovery.js"></script>' + html.slice(bodyClose);
}

if (!html.includes('src="/password-recovery.js"')) throw new Error('Falha ao injetar password-recovery.js');
await writeFile(indexPath, html, 'utf8');
console.log('PASSWORD_RECOVERY_OK', { controllerBytes: Buffer.byteLength(controller), indexBytes: Buffer.byteLength(html) });
