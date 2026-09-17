import { readFile, writeFile } from 'node:fs/promises';

const indexPath = 'public/index.html';
const controllerPath = 'public/users-ui.js';
const cssPath = 'public/users-ui.css';

let html = await readFile(indexPath, 'utf8');
const [controller,css] = await Promise.all([readFile(controllerPath, 'utf8'),readFile(cssPath,'utf8')]);

for (const marker of ["/api/users", "/api/audit", "#manageUsersBtn", "data-users-edit", "data-users-reset", "usersUiAudit"]) {
  if (!controller.includes(marker)) throw new Error(`users-ui.js inválido: marcador ausente ${marker}`);
}
if(!css.includes('ELEGANCE_MOVE_USERS_AUDIT_UI_V1')||!css.includes('.users-audit-item')) throw new Error('users-ui.css inválido');
try { new Function(controller); } catch (error) { throw new Error(`users-ui.js com sintaxe inválida: ${error.message}`); }

html=html.replace(/<style id="elegance-users-admin-ui">[\s\S]*?<\/style>\s*/g,'');
const bodyOpen=html.indexOf('<body');
if(bodyOpen<0) throw new Error('index.html inválido: <body> não encontrado');
const headClose=html.lastIndexOf('</head>',bodyOpen);
if(headClose<0) throw new Error('index.html inválido: </head> não encontrado');
html=html.slice(0,headClose)+`<style id="elegance-users-admin-ui">${css}</style>`+html.slice(headClose);

if (!html.includes('src="/users-ui.js"')) {
  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose < 0) throw new Error('index.html inválido: </body> não encontrado');
  html = html.slice(0, bodyClose) + '<script src="/users-ui.js"></script>' + html.slice(bodyClose);
}

if (!html.includes('src="/users-ui.js"')) throw new Error('Falha ao injetar users-ui.js');
if((html.match(/id="elegance-users-admin-ui"/g)||[]).length!==1) throw new Error('CSS administrativo duplicado');
await writeFile(indexPath, html, 'utf8');
console.log('USERS_UI_OK', { controllerBytes: Buffer.byteLength(controller), cssBytes:Buffer.byteLength(css), indexBytes: Buffer.byteLength(html), audit:true });
