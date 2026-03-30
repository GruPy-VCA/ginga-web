# Ginga — frontend (React)

SPA em React (Vite + TypeScript) com Tailwind CSS, autenticação via AWS Cognito (Amplify v6) e chamadas à API FastAPI com token Bearer (ID token).

## Pré-requisitos

- Node.js 20+ (recomendado)
- Conta de usuário **CONFIRMED** no User Pool Ginga
- API Ginga acessível e CORS permitindo a origem deste app (ver README na raiz do repositório)

## Configuração

1. Copie o exemplo de variáveis:

   ```bash
   cp .env.example .env
   ```

2. Preencha `.env` com os valores reais do Cognito e da API (alinhados ao Terraform / ambiente).

**`VITE_API_BASE_URL`:** use apenas a **origem** (host + porta ou Function URL completa **sem** path). Não inclua `/api/v1` — o cliente já prefixa os paths. Se você colocar `.../api/v1`, a requisição vira `.../api/v1/api/v1/me` e a API responde **404 Not Found**.

## Desenvolvimento

```bash
npm install
npm run dev
```

O Vite costuma servir em `http://localhost:5173`. Ajuste `VITE_API_BASE_URL` para apontar para a API local ou deploy.

## Scripts

| Comando        | Descrição              |
| -------------- | ---------------------- |
| `npm run dev`  | Servidor de desenvolvimento |
| `npm run build`| Build de produção (`dist/`) |
| `npm run preview` | Pré-visualiza o build |
| `npm run lint` | ESLint                 |

## Fluxo de login

- Login com **e-mail** e **senha** (mesmo fluxo que o client atual do pool).
- Se o usuário foi criado no console com **senha temporária**, use essa senha no primeiro acesso; a tela pedirá uma **nova senha definitiva** (desafio `NEW_PASSWORD_REQUIRED` do Cognito).
- O Amplify obtém a sessão; o cliente HTTP (`src/lib/api.ts`) envia o **ID token** no header `Authorization: Bearer <token>`, compatível com a validação JWT da API (`aud` = App Client ID).

## Chamadas à API

Use `apiFetch` em `src/lib/api.ts` para requisições autenticadas. A rota `/dashboard` chama `GET /api/v1/me` como exemplo.

## Build de produção

```bash
npm run build
```

Sirva o conteúdo de `dist/` atrás de um CDN ou bucket estático. Configure na infraestrutura (Lambda / API Gateway) a variável **`FRONTEND_URL`** com a origem exata do app em produção para o CORS, ou use `*` apenas em testes.
