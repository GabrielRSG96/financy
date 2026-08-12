# Financy — Front-end

SPA de gestão de finanças pessoais, seguindo o layout do Figma. Projeto independente: tem o próprio `package.json` e o próprio lockfile, e roda sozinho — só precisa de uma API no ar em `VITE_BACKEND_URL`.

**Stack:** TypeScript · React · Vite · GraphQL · TailwindCSS · TanStack Query · React Hook Form + Zod · Vitest

---

## Como rodar

Pré-requisitos: **Node 20+**, **pnpm 10+** (`corepack enable`) e a API do `backend/` rodando.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Abra <http://localhost:5173>. Com o seed do backend aplicado, entre com `conta@teste.com` / `financy123`.

### Variáveis de ambiente

| Chave | Descrição |
| --- | --- |
| `VITE_BACKEND_URL` | Endpoint GraphQL da API (padrão `http://localhost:4000/graphql`) |

---

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento (Vite) |
| `pnpm build` / `pnpm preview` | Build de produção e preview local |
| `pnpm test` | Testes (Vitest + Testing Library) |
| `pnpm typecheck` / `pnpm lint` | TypeScript estrito e ESLint |

---

## Páginas

| Rota | Tela |
| --- | --- |
| `/` | Login (deslogado) ou Dashboard (logado) |
| `/cadastro` | Criar conta |
| `/transacoes` | Lista com filtros e paginação |
| `/categorias` | Grid de categorias e estatísticas |
| `/perfil` | Editar nome, foto de perfil, e-mail somente leitura, sair |

Mais os dois diálogos de formulário: nova/editar transação e nova/editar categoria.

---

## Estrutura

```
frontend/
└── src/
    ├── components/
    │   ├── brand/       logo e wordmark (SVG desenhados à mão)
    │   ├── profile/     upload da foto de perfil
    │   ├── layout/      navbar e casca das páginas
    │   ├── ui/          primitivos do styleguide
    │   └── dialogs/     formulários de transação e categoria
    ├── pages/           login, cadastro, dashboard, transações, categorias, perfil
    ├── graphql/         cliente, operações e tipos
    ├── hooks/           queries e mutations (TanStack Query)
    ├── contexts/        autenticação
    └── lib/             formatação, datas, catálogo de categorias, imagem
```

---

## Decisões

**TanStack Query + `graphql-request`** no lugar do Apollo Client: bundle bem menor e invalidação por chave de cache é suficiente aqui — não há necessidade de cache normalizado.

**Tipos GraphQL escritos à mão** em `src/graphql/types.ts`, espelhando o SDL da API. O schema é pequeno e estável, então o build não depende de um servidor no ar para gerar código.

**Tokens do tema amostrados do Figma.** As cores em `src/index.css` foram lidas pixel a pixel dos exports do layout, não estimadas a olho. As sete cores de categoria são exatamente os tons 600 do Tailwind; as tags derivam os tons 100 e 700.

**Valores em centavos, sempre.** A máscara de moeda escreve direto em centavos (estilo calculadora) e o valor trafega como `Int` — nada de ponto flutuante entre a tela e o banco.

**A foto de perfil é processada no navegador.** O `<canvas>` corta no centro para um quadrado, reduz para 512 px e recodifica em WebP antes de enviar — uma foto de 4 MB vira algo em torno de 40 KB. Sobe pelo próprio GraphQL, como data URL base64, sem `multipart/form-data`.

**"Lembrar-me" faz o que promete.** Marcado, o token vai para o `localStorage` e sobrevive ao fechar o navegador; desmarcado, fica no `sessionStorage` e morre com a aba.

---

## Testes

```bash
pnpm test
```

45 testes focados no que quebra em silêncio: a máscara de moeda e seu ciclo de ida e volta em centavos, as conversões de data em UTC, a renderização das tags por cor, a validação do formulário de login e as regras de corte e validação da foto de perfil.

---

## Docker

A imagem é autossuficiente (contexto = esta pasta) e serve o build por nginx com fallback de SPA:

```bash
docker build -t financy-frontend .
```

Ou, junto com a API, pelo `docker-compose.yml` da raiz.
