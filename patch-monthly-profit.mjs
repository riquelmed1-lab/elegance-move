import { readFile, writeFile } from 'node:fs/promises';

const file = 'public/index.html';
let html = await readFile(file, 'utf8');

const financeDecl = "const inventoryCapital=db.products.reduce((s,p)=>s+(Number(p.cost)||0)*(Number(p.stock)||0),0),purchaseInvestment=(db.entries||[]).reduce((s,e)=>s+(Number(e.totalCost)||0),0),purchaseUnits=(db.entries||[]).reduce((s,e)=>s+(Number(e.qty)||0),0);";
if (!html.includes(financeDecl)) throw new Error('Indicadores financeiros do dashboard não encontrados.');

const monthlyDecl = String.raw`
const nowMonth=new Date(),monthKey=nowMonth.getFullYear()+'-'+String(nowMonth.getMonth()+1).padStart(2,'0'),monthLabel=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(nowMonth),monthlySales=db.sales.filter(v=>String(v.date||'').slice(0,7)===monthKey),monthlyRevenue=monthlySales.reduce((s,v)=>s+(Number(v.total)||0),0),monthlyGrossProfit=monthlySales.reduce((s,v)=>s+saleProfit(v),0),monthlyExpenses=(db.expenses||[]).filter(e=>String(e.date||'').slice(0,7)===monthKey).reduce((s,e)=>s+(Number(e.amount)||0),0),monthlyNetProfit=monthlyGrossProfit-monthlyExpenses;
`;
html = html.replace(financeDecl, financeDecl + monthlyDecl);

const existingKpis = "metric('Faturamento líquido',money.format(revenue),'Receita após descontos aplicados')+metric('Recebido',money.format(received),'Entradas financeiras confirmadas')+metric('A receber',money.format(open),openSales.length+' venda(s) aguardando pagamento')+metric('Lucro bruto (vendas)',money.format(grossProfit),'Receita - custo histórico vendido')+metric('Capital em estoque',money.format(inventoryCapital),'Custo médio atual × saldo')+metric('Investido em compras',money.format(purchaseInvestment),purchaseUnits+' unidade(s) registradas')";
if (!html.includes(existingKpis)) throw new Error('Bloco de KPIs do dashboard não encontrado.');

const monthlyKpis = "metric('Faturamento do mês',money.format(monthlyRevenue),monthLabel)+metric('Lucro bruto do mês',money.format(monthlyGrossProfit),'Vendas do mês - custo das mercadorias')+metric('Despesas do mês',money.format(monthlyExpenses),'Despesas lançadas em '+monthLabel)+metric('Lucro líquido do mês',money.format(monthlyNetProfit),'Lucro bruto - despesas do mês')";
html = html.replace(existingKpis, monthlyKpis + '+' + existingKpis);

for (const marker of ['monthlyNetProfit','Faturamento do mês','Despesas do mês','Lucro líquido do mês']) {
  if (!html.includes(marker)) throw new Error(`Indicador mensal incompleto: ${marker}`);
}

await writeFile(file, html, 'utf8');
console.log('MONTHLY_PROFIT_PATCH_OK', { bytes: Buffer.byteLength(html) });
