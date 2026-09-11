import { readFile, writeFile } from 'node:fs/promises';

const indexPath = 'public/index.html';
const controllerPath = 'public/users-ui.js';

let html = await readFile(indexPath, 'utf8');
const controller = await readFile(controllerPath, 'utf8');

for (const marker of ["/api/users", "#manageUsersBtn", "data-users-edit", "data-users-reset"]) {
  if (!controller.includes(marker)) throw new Error(`users-ui.js inválido: marcador ausente ${marker}`);
}

if (!html.includes('src="/users-ui.js"')) {
  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose < 0) throw new Error('index.html inválido: </body> não encontrado');
  html = html.slice(0, bodyClose) + '<script src="/users-ui.js"></script>' + html.slice(bodyClose);
}

if (!html.includes('src="/users-ui.js"')) throw new Error('Falha ao injetar users-ui.js');
await writeFile(indexPath, html, 'utf8');
console.log('USERS_UI_OK', { controllerBytes: Buffer.byteLength(controller), indexBytes: Buffer.byteLength(html) });
