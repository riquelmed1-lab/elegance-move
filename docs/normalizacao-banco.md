# Normalização do banco — dual-write seguro e primeiro cutover de leitura

## Estado atual

O `app_state` continua sendo a **fonte operacional de verdade e de escrita** do aplicativo.

Em 17/09/2026 foi concluído o backfill inicial e, após validação de paridade, foi ativado um **dual-write em sombra não bloqueante** no banco.

Após testes reais de cliente, produto/estoque, orçamento e venda, todos com paridade zero, foi iniciado o primeiro cutover de leitura: **Produtos/Estoque agora preferem `public.products` na resposta de `/api/state`**.

Esse cutover é protegido por fallback. A API só usa a coleção normalizada quando quantidade, IDs e todos os campos relevantes do produto coincidem com o snapshot atual do `app_state`. Se a leitura normalizada falhar ou houver qualquer divergência, a resposta continua usando `app_state` sem interromper a operação.

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
- tamanho, cor, categoria, preço e estoque de produto;
- custo unitário de itens de venda e orçamento;
- número, validade e valor planejado do orçamento;
- total gasto e última compra do cliente.

## Validação

O primeiro backfill foi validado na revisão 51 com todas as diferenças em zero.

Depois da ativação do dual-write, operações reais avançaram o sistema até a revisão 57, mantendo `normalization_health.ok = true` e todas as diferenças monitoradas em zero.

Foram validados em uso real:

- atualização de cliente;
- atualização de produto/estoque;
- criação de orçamento com itens;
- criação de venda com item, pagamento, baixa de estoque e atualização do cliente.

Antes do primeiro cutover de leitura, os 37 produtos do `app_state` foram comparados com os 37 registros de `public.products`, com **0 divergências campo a campo**.

A função privada `private.normalized_shadow_parity()` continua sendo o semáforo técnico. `ok = true` significa que o JSON operacional e as tabelas normalizadas estão equivalentes nas métricas monitoradas.

## Leitura de Produtos/Estoque

A rota `/api/state` continua lendo `app_state`, pois os demais domínios ainda dependem dele. Para `products`, porém, a API tenta ler `public.products` usando o token autenticado do usuário.

A leitura normalizada só é aceita quando:

1. a consulta REST de `public.products` é bem-sucedida;
2. a quantidade de produtos é idêntica;
3. todos os IDs existem nos dois snapshots;
4. não há IDs duplicados;
5. código, custo, nome, tamanho, cor, preço, estoque, categoria e imagem são equivalentes.

Quando todas essas condições passam, a resposta usa os objetos de `public.products`, mantendo a mesma ordem que o `app_state` já fornecia ao frontend.

Se qualquer condição falhar, a API usa imediatamente o snapshot de `app_state`. O cabeçalho `X-Elegance-Products-Source` informa `normalized` ou `app_state` para observabilidade técnica.

A sanitização de custo para o perfil vendedor continua aplicada depois da escolha da fonte de leitura, portanto a migração não altera a regra de visibilidade de custo.

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

1. observar a leitura normalizada de Produtos/Estoque durante novas operações reais;
2. confirmar que o fallback não é acionado em condições normais;
3. tratar qualquer divergência antes de ampliar o cutover;
4. migrar Clientes para leitura normalizada com o mesmo padrão seguro;
5. depois migrar Vendas/Financeiro;
6. retirar `app_state` somente quando todas as áreas estiverem cobertas e validadas.

## Regra de segurança

O `app_state` permanece como fonte de verdade e escrita durante esta fase. Nenhuma falha da camada normalizada deve impedir venda, atualização de estoque ou operação financeira. Cada novo domínio só pode abandonar a leitura legada após validação real, paridade estável e fallback operacional.
