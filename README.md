# Elegance Move

Sistema de gestão da Elegance Move publicado na Vercel, com dados e autenticação no Supabase.

## Arquitetura atual

- Deploy: Vercel
- Banco e autenticação: Supabase
- Front-end gerado em: `public/index.html`
- APIs: `/api/auth`, `/api/state`, `/api/users`, `/api/product-image`
- Mobile: interface responsiva com navegação inferior
- PWA: manifest, service worker, ícone e modo standalone

## PWA

A aplicação pode ser instalada no celular e aberta em modo standalone, sem a interface do navegador. O build injeta as metatags PWA e registra o service worker automaticamente através de `patch-pwa.mjs` e `public/pwa-runtime.js`.
