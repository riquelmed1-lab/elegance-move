import { readFile, writeFile } from 'node:fs/promises';

const file = 'public/index.html';
let html = await readFile(file, 'utf8');

const dashboardDecl = "const revenue=db.sales.reduce((s,v)=>s+v.total,0),received=db.sales.reduce((s,v)=>s+salePaid(v),0),open=db.sales.reduce((s,v)=>s+saleBalance(v),0),grossProfit=db.sales.reduce((s,v)=>s+saleProfit(v),0),lowProducts=db.products.filter(p=>p.stock<=3),openSales=db.sales.filter(s=>saleBalance(s)>0),late=openSales.filter(overdue).length;";
if (!html.includes(dashboardDecl)) throw new Error('Dashboard base não encontrado.');
html = html.replace(dashboardDecl, dashboardDecl + "\nconst inventoryCapital=db.products.reduce((s,p)=>s+(Number(p.cost)||0)*(Number(p.stock)||0),0),purchaseInvestment=(db.entries||[]).reduce((s,e)=>s+(Number(e.totalCost)||0),0),purchaseUnits=(db.entries||[]).reduce((s,e)=>s+(Number(e.qty)||0),0);");

const oldKpi = "metric('Faturamento líquido',money.format(revenue),'Receita após descontos aplicados')+metric('Recebido',money.format(received),'Entradas financeiras confirmadas')+metric('A receber',money.format(open),openSales.length+' venda(s) aguardando pagamento')+metric('Lucro bruto',money.format(grossProfit),'Resultado antes das despesas')";
const newKpi = "metric('Faturamento líquido',money.format(revenue),'Receita após descontos aplicados')+metric('Recebido',money.format(received),'Entradas financeiras confirmadas')+metric('A receber',money.format(open),openSales.length+' venda(s) aguardando pagamento')+metric('Lucro bruto (vendas)',money.format(grossProfit),'Receita - custo histórico vendido')+metric('Capital em estoque',money.format(inventoryCapital),'Custo médio atual × saldo')+metric('Investido em compras',money.format(purchaseInvestment),purchaseUnits+' unidade(s) registradas')";
if (!html.includes(oldKpi)) throw new Error('KPIs originais do dashboard não encontrados.');
html = html.replace(oldKpi, newKpi);

let syncPatches = 0;
html = html.replace(/save\(\);render\(\);toast\('Entrada excluída\.[^']*'\)/g, () => {
  syncPatches++;
  return "persistLocal();render();setCloudStatus('Banco online','Salvando correção da entrada...');queueCloudSave().then(()=>{render();toast('Entrada excluída. Dashboard e estoque atualizados.')})";
});
html = html.replace(/save\(\);render\(\);toast\('Registro de entrada excluído[^']*'\)/g, () => {
  syncPatches++;
  return "persistLocal();render();setCloudStatus('Banco online','Salvando exclusão da entrada...');queueCloudSave().then(()=>{render();toast('Registro de entrada excluído e dashboard atualizado.')})";
});
if (!syncPatches) throw new Error('Fluxo de exclusão de entrada não encontrado para sincronização.');

for (const marker of ['Capital em estoque','Investido em compras','Dashboard e estoque atualizados.']) {
  if (!html.includes(marker)) throw new Error(`Patch do dashboard incompleto: ${marker}`);
}

await writeFile(file, html, 'utf8');
console.log('DASHBOARD_ENTRY_SYNC_OK', { bytes: Buffer.byteLength(html), syncPatches });
