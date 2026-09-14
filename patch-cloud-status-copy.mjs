import { readFile, writeFile } from 'node:fs/promises';

const file='public/index.html';
let html=await readFile(file,'utf8');

const replacements = [
  ['Pronto para nuvem','Sistema conectado'],
  ['Aguardando integração','Sistema online'],
  ['Banco online + login seguro','Sistema online e seguro'],
  ['Clientes, produtos, entradas, vendas, pagamentos e despesas já estão modelados. A próxima etapa é sincronizar tudo em nuvem.','Dados de clientes, produtos, estoque, vendas, pagamentos, despesas e usuários armazenados com segurança na nuvem.'],
  ['Precificação e lucro','Gestão de custos e lucro'],
  ['As entradas recalculam custo médio; cada venda preserva o custo do momento, aplica desconto e calcula lucro bruto de forma auditável.','O sistema acompanha custo médio, preço de venda, descontos e lucro de cada operação automaticamente.']
];

let changed = 0;
for (const [from,to] of replacements) {
  if (html.includes(from)) {
    html = html.split(from).join(to);
    changed++;
  }
}

if (!html.includes('Sistema conectado')) throw new Error('Título atualizado não encontrado após o patch.');
if (!html.includes('Sistema online e seguro')) throw new Error('Bloco online atualizado não encontrado após o patch.');
if (!html.includes('Gestão de custos e lucro')) throw new Error('Bloco de custos atualizado não encontrado após o patch.');

await writeFile(file,html,'utf8');
console.log('CLOUD_STATUS_COPY_OK',{changed,bytes:Buffer.byteLength(html)});
