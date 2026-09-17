# Normalização do banco — fase sombra

## Estado atual

O `app_state` continua sendo a fonte operacional do aplicativo. Nenhuma leitura ou escrita do front/API foi migrada ainda para as tabelas normalizadas.

Em 17/09/2026 foi concluído o primeiro backfill em sombra para as tabelas estruturadas do Supabase, preservando o funcionamento atual do sistema.

### Tabelas sincronizadas

- `clients`
- `products`
- `sales`
- `sale_items`
- `payments`
- `quotes`
- `quote_items`
- `expenses`
- `purchase_entries`

`inventory_movements` ainda não participa desta fase.

## Compatibilidade de modelo

O schema normalizado foi ampliado para preservar campos já existentes no `app_state`, incluindo:

- custo e imagem de produto;
- custo unitário de itens de venda e orçamento;
- número, validade e valor planejado do orçamento;
- total gasto e última compra do cliente.

## Validação

O backfill foi validado contra o estado operacional atual. Na revisão 51, todas as diferenças verificadas ficaram em zero:

- contagem de clientes, produtos, vendas, itens, pagamentos, orçamentos, despesas e entradas;
- total de vendas e pagamentos;
- total de despesas e custo das entradas;
- saldo total de estoque;
- somas de preço e custo dos produtos;
- campos principais de clientes, produtos, vendas e itens.

A função privada `private.normalized_shadow_parity()` funciona como semáforo técnico: `ok = true` indica que o estado JSON e as tabelas normalizadas estão equivalentes nas métricas monitoradas.

## Sincronização manual

Foi criada `private.sync_normalized_from_app_state()` para repetir a sincronização de forma controlada. A função não está exposta a `anon` nem `authenticated` e não é acionada automaticamente pelo aplicativo.

Essa decisão é intencional: primeiro validamos estabilidade e paridade; somente depois será avaliado o dual-write automático.

## Próximas fases

1. manter `app_state` como fonte de verdade enquanto a camada sombra é observada;
2. validar sincronização após novas operações reais;
3. evoluir a função de sincronização e testes de paridade;
4. introduzir dual-write de forma transacional, com rollback em caso de falha;
5. migrar leituras por domínio gradualmente;
6. retirar `app_state` somente quando todas as áreas estiverem cobertas e validadas.

## Regra de segurança

Não ligar trigger automático de sincronização nem trocar a fonte de leitura sem uma rodada completa de paridade e teste operacional. A prioridade é preservar vendas, estoque e financeiro em produção.