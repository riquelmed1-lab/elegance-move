# Normalização do banco — fase sombra com dual-write seguro

## Estado atual

O `app_state` continua sendo a **fonte operacional e de leitura** do aplicativo. Nenhuma tela foi migrada ainda para ler diretamente das tabelas normalizadas.

Em 17/09/2026 foi concluído o backfill inicial e, após validação de paridade, foi ativado um **dual-write em sombra não bloqueante** no banco.

Sempre que a revisão do `app_state` muda, o trigger privado `trg_shadow_sync_app_state_update` tenta sincronizar a representação normalizada. Se essa sincronização falhar, a atualização do `app_state` continua válida: a venda/operação principal não é derrubada por uma falha da camada sombra.

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

O schema normalizado preserva os campos já usados pelo estado operacional, incluindo:

- custo e imagem de produto;
- custo unitário de itens de venda e orçamento;
- número, validade e valor planejado do orçamento;
- total gasto e última compra do cliente.

## Validação

O primeiro backfill foi validado na revisão 51 com todas as diferenças em zero:

- contagem de clientes, produtos, vendas, itens, pagamentos, orçamentos, despesas e entradas;
- total de vendas e pagamentos;
- total de despesas e custo das entradas;
- saldo total de estoque;
- campos principais de clientes, produtos, vendas e itens.

A função privada `private.normalized_shadow_parity()` é o semáforo técnico. `ok = true` significa que o JSON operacional e as tabelas normalizadas estão equivalentes nas métricas monitoradas.

## Sincronização

A função `private.sync_normalized_from_app_state()` continua privada, sem `EXECUTE` para `anon` ou `authenticated`.

O trigger privado `private.shadow_sync_app_state_after_update()` é executado somente quando a revisão muda. Ele:

1. executa a sincronização;
2. calcula a paridade;
3. registra a saúde da sincronização;
4. grava `shadow_sync.mismatch` ou `shadow_sync.failed` na auditoria somente quando há problema;
5. captura exceções para não bloquear a operação principal do sistema.

## Monitoramento administrativo

A tabela `public.normalization_health` guarda somente informações técnicas de saúde:

- revisão sincronizada;
- `ok` / erro;
- diferenças de paridade;
- data/hora da última sincronização.

Ela possui RLS e é legível apenas por administrador. Não há permissão de INSERT/UPDATE/DELETE para usuários autenticados comuns.

A API administrativa `/api/audit` também retorna o objeto `normalization` junto ao histórico, permitindo acompanhar esse estado sem expor funções privadas do banco.

## Próximas fases

1. observar o dual-write durante operações reais da loja;
2. confirmar paridade em revisões posteriores à 51;
3. tratar qualquer divergência antes de alterar leituras;
4. migrar leituras por domínio, começando por produtos/estoque;
5. depois migrar clientes;
6. por último migrar vendas/financeiro;
7. retirar `app_state` somente quando todas as áreas estiverem cobertas e validadas.

## Regra de segurança

O `app_state` permanece como fonte de verdade durante esta fase. Nenhuma falha da camada normalizada deve impedir venda, atualização de estoque ou operação financeira. O cutover de leitura só pode ocorrer após múltiplas revisões reais com paridade `ok = true`.
