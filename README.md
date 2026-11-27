# AgroOps — Frontend

Painel de monitoramento de temperatura e umidade (do solo e do ar) de lotes de
frutas, feito com Next.js (App Router) e TypeScript. As leituras de monitoramento
vêm do ThingSpeak; lotes, sensores, usuários e autenticação continuam na API Flask
deste repositório (`../backend`).

## Como rodar

```bash
cp .env.example .env.local
npm install
npm run dev
```

O app fica em http://localhost:3000 e consome a API Flask em
`http://127.0.0.1:5000/api` (configurável por `NEXT_PUBLIC_API_URL`). As leituras
exibidas no dashboard, no detalhe do lote, no relatório e nos alertas são buscadas
na rota interna `/api/thingspeak`, que consulta o canal no servidor Next.js — a
chave de leitura não é enviada ao navegador.

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL base da API Flask, incluindo `/api`. |
| `NEXT_PUBLIC_TELEFONE_TRANSPORTADORA` | Telefone exibido no detalhe do lote (opcional). |
| `THINGSPEAK_CHANNEL_ID` | ID do canal ThingSpeak. |
| `THINGSPEAK_READ_KEY` | Read API Key do canal (somente no servidor). |
| `THINGSPEAK_RESULTS` | Quantidade de leituras buscadas no feed (padrão `100`). |
| `THINGSPEAK_FIELD_TEMPERATURA` / `THINGSPEAK_FIELD_UMIDADE_AR` / `THINGSPEAK_FIELD_UMIDADE_SOLO` | Sobrescrevem os campos detectados pelo nome (opcional). |

> O backend precisa estar rodando para login, lotes, sensores e alertas. Veja
> `../backend/README.md` para instalar as dependências e configurar o banco.

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
  app/api/thingspeak/  rota interna que consulta o canal no servidor
  components/   formulários, layout e componentes de monitoramento
  hooks/        sessão, polling e formulários
  lib/          clientes da API Flask, sessão, formatação e validação
  styles/       tokens e folhas de estilo do painel
  types/        contratos da API Flask e do ThingSpeak
```

## Integração com a API

- `src/lib/api/http.ts` centraliza `GET`/`POST`, anexa automaticamente o JWT da
  sessão e normaliza os envelopes `{ success, message, data }` da API Flask.
- `src/lib/api/monitoramento.ts` monta os dados do dashboard: lotes, sensores e
  alertas vêm da API Flask; as leituras de temperatura/umidade vêm de
  `/api/thingspeak`.
- `src/app/api/thingspeak/route.ts` consulta `api.thingspeak.com`, normaliza os
  campos do canal (`field1`/`field2`/`field3`) e devolve as leituras em ordem
  cronológica. A chave de leitura fica apenas no ambiente do servidor.
- `src/lib/api/auth.ts` e `src/lib/api/usuarios.ts` cuidam de login e cadastro.

## Scripts

`npm run dev`, `npm run build`, `npm run start`, `npm run lint` e `npm run typecheck`.
