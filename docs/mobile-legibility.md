# Legibilidade mobile — Elegance Move

A interface mobile mantém a estética slim da marca, mas textos operacionais não devem depender de tamanhos microscópicos.

Diretriz aplicada:

- KPIs e textos auxiliares principais: aproximadamente 9–11,5 px conforme hierarquia.
- Navegação inferior: aproximadamente 8,3–8,8 px, preservando a altura do dock.
- Labels de tabelas/cards de clientes: 8,5 px ou mais.
- Metadados do PDV: 10 px para cor, tamanho, estoque e informações auxiliares.
- Títulos, valores e CTAs permanecem maiores conforme a hierarquia existente.

A camada `mobile-legibility.css` é injetada depois de `mobile-polish.css` para funcionar como contrato final de leitura, sem mudar a identidade visual do projeto.
