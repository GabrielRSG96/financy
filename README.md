# Financy

Aplicação fullstack de gerenciamento de finanças pessoais: cada usuário cria sua conta, faz login e gerencia **apenas** as próprias transações e categorias.

- **API** — TypeScript, GraphQL (Apollo Server 4), Prisma, SQLite, JWT
- **Front** — TypeScript, React, Vite, GraphQL, TailwindCSS, TanStack Query

---

## Como rodar localmente

Pré-requisitos: **Node 20+** e **pnpm 10+** (`corepack enable`).

```bash
# 1. Dependências
pnpm install

# 2. Variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Preencha o JWT_SECRET em apps/api/.env, por exemplo:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Banco: migrações + dados de demonstração
pnpm --filter api db:setup

# 5. Sobe API (:4000) e front (:5173) juntos
pnpm dev
```

Abra <http://localhost:5173>. Para explorar o app já com dados, use a conta de demonstração criada pelo seed:

| E-mail | Senha |
| --- | --- |
| `conta@teste.com` | `financy123` |

O GraphQL fica em <http://localhost:4000/graphql> e há um `/health` para checagens.

### Com Docker

```bash
docker compose up --build
```

Front em <http://localhost:8080>, API em <http://localhost:4000>. O SQLite vive num volume nomeado, então os dados sobrevivem ao recriar os containers. Defina `JWT_SECRET` no ambiente antes de subir em qualquer coisa que não seja sua máquina.

---

## Scripts

Na raiz (todos operam sobre os dois apps):

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Sobe API e front em paralelo |
| `pnpm build` | Compila os dois para produção |
| `pnpm test` | Roda as suítes de API e front |
| `pnpm typecheck` | TypeScript em modo estrito |
| `pnpm lint` | ESLint |

Só na API: `db:migrate`, `db:reset`, `db:studio`, `seed`.

---

## Variáveis de ambiente

**`apps/api/.env`**

| Chave | Descrição |
| --- | --- |
| `DATABASE_URL` | Conexão do SQLite (`file:./dev.db`) |
| `JWT_SECRET` | Segredo que assina os tokens — **obrigatório** |
| `JWT_EXPIRES_IN` | Validade do token (padrão `7d`) |
| `PORT` | Porta da API (padrão `4000`) |
| `CORS_ORIGIN` | Origens liberadas, separadas por vírgula |

**`apps/web/.env`**

| Chave | Descrição |
| --- | --- |
| `VITE_BACKEND_URL` | Endpoint GraphQL da API |

A API valida essas variáveis na inicialização e falha com uma mensagem clara se faltar alguma — melhor do que descobrir um `JWT_SECRET` vazio no primeiro login.

---

## Estrutura

```
financy/
├── apps/
│   ├── api/
│   │   ├── prisma/          schema, migrações e seed
│   │   ├── src/
│   │   │   ├── modules/     user | category | transaction (typeDefs + resolvers)
│   │   │   ├── lib/         auth, prisma, loaders, erros, validação
│   │   │   ├── context.ts   contexto por request + requireUser
│   │   │   └── server.ts
│   │   └── tests/           testes de integração (Vitest)
│   └── web/
│       └── src/
│           ├── components/  brand, layout, ui (styleguide), diálogos
│           ├── pages/       login, cadastro, dashboard, transações, categorias, perfil
│           ├── graphql/     cliente, operações e tipos
│           ├── hooks/       queries e mutations (TanStack Query)
│           └── lib/         formatação, datas, catálogo de categorias
└── docker-compose.yml
```

---

## Decisões de projeto

**Dinheiro em centavos (`Int`).** Nenhum valor monetário passa por ponto flutuante. O `Decimal` do Prisma tem suporte irregular em SQLite e `Float` arredonda errado; o valor é sempre positivo e o sinal vem do campo `type`.

**Isolamento por usuário em toda operação.** Todo resolver protegido passa por `requireUser` e filtra por `userId`. Update e delete usam `where: { id, userId }` e tratam `count === 0` como "não encontrado" — um usuário não consegue tocar nem detectar o recurso de outro. Isso é coberto por 13 testes dedicados em `apps/api/tests/isolation.test.ts`.

**Deletar categoria não apaga transações.** A relação usa `onDelete: SetNull`: as transações sobrevivem e passam a exibir a tag "Sem categoria". O diálogo de confirmação avisa quantas serão afetadas. Apagar uma categoria não pode apagar o histórico financeiro de ninguém.

**Datas em meia-noite UTC.** Gravar e filtrar em UTC evita o clássico "a transação de 01/12 aparece como 30/11" quando o fuso do navegador está atrás de Greenwich.

**Saldo por categoria é líquido, não bruto.** Uma categoria pode receber e gastar — um freela que rende R$ 800 e custa R$ 400 de ferramenta tem **saldo de R$ 400**, não de R$ 1.200. Por isso a agregação separa por tipo e expõe `incomeCents`, `expenseCents` e `balanceCents` (entradas menos saídas, podendo ser negativo). No dashboard o saldo aparece com sinal e cor, e quando a categoria tem os dois sentidos a quebra é exibida embaixo — senão o saldo sozinho esconderia o movimento real.

**Sem N+1 nas categorias.** Os campos agregados são resolvidos por um DataLoader por request, alimentado por um único `groupBy` — não uma query por categoria da lista.

**Tokens do tema amostrados do Figma.** As cores em `apps/web/src/index.css` foram lidas pixel a pixel dos exports do layout, não estimadas a olho. As sete cores de categoria são exatamente os tons 600 do Tailwind; as tags derivam os tons 100 e 700.

**Tipos GraphQL escritos à mão.** Em `apps/web/src/graphql/types.ts`, espelhando o SDL da API. O schema é pequeno e estável, e assim o build do front não depende de um servidor no ar para gerar código — o que simplifica CI e Docker.

**"Lembrar-me" faz o que promete.** Marcado, o token vai para o `localStorage` e sobrevive ao fechar o navegador; desmarcado, fica no `sessionStorage` e morre com a aba.

---

## Funcionalidades

- [x] Criar conta e fazer login (senha com bcrypt, sessão via JWT)
- [x] Ver e gerenciar apenas os próprios dados
- [x] Transações: criar, listar, editar e deletar
- [x] Categorias: criar, listar, editar e deletar
- [x] Filtros de transação por busca, tipo, categoria e período, com paginação de 10 por página
- [x] Dashboard com saldo total, receitas e despesas do mês
- [x] Edição de perfil e logout
- [x] CORS habilitado
- [x] Testes automatizados (API e front)
- [x] Docker Compose
- [x] CI no GitHub Actions

### Páginas

| Rota | Tela |
| --- | --- |
| `/` | Login (deslogado) ou Dashboard (logado) |
| `/cadastro` | Criar conta |
| `/transacoes` | Lista com filtros e paginação |
| `/categorias` | Grid de categorias e estatísticas |
| `/perfil` | Editar nome, e-mail somente leitura, sair |

Mais os dois diálogos de formulário — nova/editar transação e nova/editar categoria.

**Fora de escopo:** o link "Recuperar senha" na tela de login existe por fidelidade ao layout, mas o fluxo de recuperação não faz parte desta versão e o app informa isso ao ser clicado. O upload de avatar (desafio opcional) também não foi implementado — o avatar exibe as iniciais do usuário, como no Figma.

---

## Testes

```bash
pnpm test              # tudo
pnpm --filter api test # só a API
pnpm --filter web test # só o front
```

**API (63 testes, Vitest).** Integração real: cada suíte roda contra uma cópia própria de um banco SQLite migrado, executando operações GraphQL de ponta a ponta. Cobre autenticação, CRUD das duas entidades, filtros, paginação, agregações e — o mais importante — o isolamento entre usuários.

**Front (29 testes, Vitest + Testing Library).** Foca no que quebra em silêncio: a máscara de moeda e seu ciclo de ida e volta em centavos, as conversões de data em UTC, a renderização das tags por cor e a validação do formulário de login.
