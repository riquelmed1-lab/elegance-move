# QA responsivo — Elegance Move

Checklist obrigatório para alterações visuais e funcionais.

## Viewports

- 390 × 844 — celular compacto
- 430 × 932 — celular grande
- 768 × 1024 — tablet
- 1366 × 768 — notebook
- 1440 × 900 — desktop

## Telas críticas

1. Login e recuperação de senha
2. Dashboard
3. Clientes e detalhe da cliente
4. Vendas
5. Nova venda / PDV
6. Estoque
7. Cadastro/edição de produto e fotos
8. Entradas
9. Caixa
10. Sistema / usuários

## Critérios

- Nenhum overflow horizontal involuntário.
- Botões de ação primária totalmente visíveis e com área de toque adequada.
- Texto operacional legível sem sobreposição ou corte.
- Cards sem colisão entre nome, avatar, valor, badge ou ação.
- Modais acessíveis em altura reduzida, com conteúdo rolável.
- Dock mobile não deve cobrir ações ou conteúdo final.
- Fotos mantêm proporção e não deformam o produto.
- Estados vazio, carregando e erro permanecem compreensíveis.
- Navegação respeita perfil de acesso.
- PDV não permite estoque negativo e mantém resumo da venda acessível.

## Regra de publicação

Mudanças de layout devem preservar desktop e mobile. Se uma correção específica exigir exceção de breakpoint, ela deve ser documentada e preferencialmente centralizada no CSS da tela correspondente.
