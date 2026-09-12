import { readFile, writeFile } from 'node:fs/promises';

const file = 'public/index.html';
let html = await readFile(file, 'utf8');

const quoteBlock = "const financial=isQuote?'<div class=\"payment-status quote\"><div class=\"status-icon\">i</div><div><b>Condição comercial</b><span>Este orçamento não movimenta estoque nem caixa.</span></div><strong>'+money.format(record.total)+'</strong></div>':(open>0?";
const replacement = "const financial=isQuote?'':(open>0?";

if (html.includes(quoteBlock)) {
  html = html.replace(quoteBlock, replacement);
} else if (!html.includes("const financial=isQuote?'':(open>0?")) {
  throw new Error('Bloco de condição comercial do orçamento não encontrado.');
}

await writeFile(file, html, 'utf8');
console.log('QUOTE_CONDITION_REMOVED_OK');
