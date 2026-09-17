# Trilha de auditoria — Elegance Move

A trilha de auditoria registra alterações relevantes sem armazenar senhas ou outros segredos.

## Eventos atuais

- `state.update`: atualização do estado operacional da loja, com revisão anterior/nova e horário.
- `user.create`: criação de usuário por administrador.
- `user.update`: alteração administrativa de perfil, status, nome ou e-mail; o log registra somente indicadores de mudança e perfis/status anterior e novo.
- `user.password_reset`: redefinição de senha por administrador; a senha nunca é gravada no log.

## Acesso

- `audit_logs` usa RLS.
- Apenas administradores podem consultar a trilha.
- Inserções administrativas exigem usuário autenticado com perfil administrador e `actor_id = auth.uid()`.
- A API `/api/audit` exige sessão de administrador e limita a consulta a no máximo 100 eventos por requisição.

## Dados sensíveis

Senhas, tokens de sessão e conteúdo de autenticação não devem ser gravados em `audit_logs`.
