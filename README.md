# Agenda F1 & F2

Web app para calendario de F1 e F2 em Horario de Brasilia, com programacao por sessao, resultados oficiais por sessao, classificacoes, login Google e sincronizacao com Google Agenda.

## Rodar Localmente

1. Copie `.env.example` para `.env`.
2. Preencha `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` se quiser testar login/sync Google.
3. Rode:

```bash
npm install
npm run prisma:push
npm run dev
```

Abra `http://localhost:3000`.

## Deploy Manual No Render Free

No plano Free, crie um Web Service manualmente no Render usando este repositorio GitHub.

Configuracao do servico:

- Runtime: `Node`
- Branch: `main`
- Build Command: `npm ci --include=dev && npm run render:build`
- Start Command: `npm run render:start`
- Health Check Path: `/api/health`
- Instance Type: `Free`
- Auto-Deploy: opcional. Para deploy manual, deixe desativado.

Variaveis de ambiente no Render:

- `DATABASE_URL`: `file:./dev.db`
- `NEXTAUTH_URL`: URL publica do servico, por exemplo `https://agenda-f1-f2.onrender.com`
- `NEXTAUTH_SECRET`: gere uma string longa aleatoria
- `GOOGLE_CLIENT_ID`: Client ID do OAuth Google
- `GOOGLE_CLIENT_SECRET`: Client Secret do OAuth Google

Importante: Web Services Free nao preservam alteracoes no filesystem local. Como esta versao usa SQLite, login/sessoes/links do Google Agenda podem resetar quando o Render reiniciar ou redeployar. Os dados de F1/F2 continuam vindo das fontes oficiais.

No Google Cloud Console, adicione a callback de producao:

```text
https://SEU-DOMINIO-RENDER.onrender.com/api/auth/callback/google
```

Para local, mantenha tambem:

```text
http://localhost:3000/api/auth/callback/google
```

## Dados

- F1: calendario/standings via Jolpica, resultados de sessoes via paginas oficiais da Formula 1.
- F2: calendario, standings e resultados de sessoes via paginas/endpoints oficiais da FIA Formula 2.
- Temporada ativa: 2026.
- Sem resultado oficial publicado, o app mostra estado vazio e nao inventa classificacao.

## Google Agenda

O app cria um calendario secundario chamado `Agenda F1 & F2` usando o escopo `https://www.googleapis.com/auth/calendar.app.created`. Eventos usam IDs deterministicos para evitar duplicidade.
