# AgroOps — Frontend

Painel de monitoramento de temperatura e umidade (do solo e do ar) de lotes de
frutas, feito com Next.js (App Router) e TypeScript. Os dados vêm da API Flask
deste repositório (`../backend`).

## Como rodar

```bash
cp .env.example .env.local
npm install
npm run dev
```

O app fica em http://localhost:3000 e consome a API Flask em
`http://127.0.0.1:5000/api` (configurável por `NEXT_PUBLIC_API_URL`).

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL base da API Flask, incluindo `/api`. |
| `NEXT_PUBLIC_TELEFONE_TRANSPORTADORA` | Telefone exibido no detalhe do lote (opcional). |

> O backend precisa estar rodando. Veja `../backend/README.md` para instalar as
> dependências e configurar o banco.

## Telas

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/login` | Login | Público |
| `/` | Visão geral (temperatura, umidade do solo e umidade do ar) | Autenticado |
| `/lotes` | Lotes monitorados | Autenticado |
| `/lotes/[codigo]` | Detalhe do lote | Autenticado |
| `/relatorio` | Relatório de condições | Autenticado |
| `/sensores` | Atalho para o relatório | Autenticado |
| `/alertas` | Central de avisos | Autenticado |
| `/perfil` | Perfil | Autenticado |
| `/cadastro` | Cadastro de usuários | Administrador |

## Estrutura

```
src/
  app/          rotas (o grupo (painel) compartilha o menu lateral)
  components/   formulários, layout e componentes de monitoramento
  hooks/        sessão, polling e formulários
  lib/          clientes da API Flask, sessão, formatação e validação
  styles/       tokens e folhas de estilo do painel
  types/        contratos da API Flask
```

## Integração com a API

- `src/lib/api/http.ts` centraliza `GET`/`POST`, anexa automaticamente o JWT da
  sessão e normaliza os envelopes `{ success, message, data }` da API Flask.
- `src/lib/api/monitoramento.ts` monta os dados do dashboard a partir de
  `/lotes`, `/sensores` e `/registros`.
- `src/lib/api/auth.ts` e `src/lib/api/usuarios.ts` cuidam de login e cadastro.

## Scripts

`npm run dev`, `npm run build`, `npm run start`, `npm run lint` e `npm run typecheck`.
