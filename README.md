# AgroOps — Frontend

Painel de monitoramento de temperatura e umidade de lotes de frutas, feito com Next.js (App Router) e TypeScript.

## Como rodar

```bash
cp .env.example .env.local
npm install
npm run dev
```

O app fica em http://localhost:3000. Ele consome dois serviços:

| Variável | Serviço | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | API Flask | Login e cadastro de usuários |
| `NEXT_PUBLIC_NODERED_URL` | Node-RED | Leituras, lotes e alertas |

## Telas

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/login` | Login | Público |
| `/` | Visão geral | Autenticado |
| `/lotes` | Lotes monitorados | Autenticado |
| `/lotes/[codigo]` | Detalhe do lote | Autenticado |
| `/perfil` | Perfil | Autenticado |
| `/cadastro` | Cadastro de usuários | Administrador |

## Estrutura

```
src/
  app/          rotas (o grupo (painel) compartilha o menu lateral)
  components/   formulários, layout e componentes de monitoramento
  hooks/        sessão, polling e formulários
  lib/          clientes de API, sessão, formatação e validação
  styles/       tokens e folhas de estilo do painel
  types/        contratos da API Flask e do Node-RED
```

## Scripts

`npm run dev`, `npm run build`, `npm run start`, `npm run lint` e `npm run typecheck`.
