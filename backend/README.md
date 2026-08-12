# Financy — Back-end

API GraphQL de gestão de finanças pessoais. Projeto independente: tem o próprio `package.json` e o próprio lockfile, e roda sozinho, sem o `frontend/`.

**Stack:** TypeScript · GraphQL (Apollo Server 4) · Prisma · SQLite · JWT · Zod · Vitest

---

## Como rodar

Pré-requisitos: **Node 20+** e **pnpm 10+** (`corepack enable`).

```bash
pnpm install
cp .env.example .env

# Gere um JWT_SECRET e cole no .env:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

pnpm db:setup   # migrações + dados de demonstração
pnpm dev
```

GraphQL em <http://localhost:4000/graphql>, healthcheck em <http://localhost:4000/health>.

Conta criada pelo seed: `conta@teste.com` / `financy123`.

### Variáveis de ambiente

| Chave | Descrição |
| --- | --- |
| `DATABASE_URL` | Conexão do SQLite (`file:./dev.db`) |
| `JWT_SECRET` | Segredo que assina os tokens — **obrigatório** |
| `JWT_EXPIRES_IN` | Validade do token (padrão `7d`) |
| `PORT` | Porta da API (padrão `4000`) |
| `CORS_ORIGIN` | Origens liberadas, separadas por vírgula |
| `UPLOADS_DIR` | Pasta onde as fotos de perfil são gravadas (padrão `./uploads`) |
| `PUBLIC_URL` | URL pública da API, usada para montar o endereço das fotos |

A API valida essas variáveis na inicialização e falha com uma mensagem clara se faltar alguma.

---

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Sobe a API com reload |
| `pnpm build` / `pnpm start` | Compila para `dist/` e roda o build |
| `pnpm test` | Testes de integração (Vitest) |
| `pnpm typecheck` / `pnpm lint` | TypeScript estrito e ESLint |
| `pnpm db:setup` | `migrate deploy` + `generate` + `seed` |
| `pnpm db:migrate` / `db:reset` / `db:studio` / `seed` | Utilitários do Prisma |

---

## Estrutura

```
backend/
├── prisma/
│   ├── schema.prisma    User, Category, Transaction
│   ├── migrations/
│   └── seed.ts          conta de demonstração com dados do mês corrente
├── src/
│   ├── modules/         user | category | transaction (typeDefs + resolvers)
│   ├── lib/             auth, prisma, loaders, erros, validação, uploads
│   ├── config/env.ts    validação das variáveis de ambiente
│   ├── context.ts       contexto por request + requireUser
│   └── server.ts        Apollo Server + express + CORS
└── tests/               80 testes de integração
```

---

## Schema

```graphql
type Query {
  me: User
  categories: [Category!]!
  category(id: ID!): Category
  categoryStats: CategoryStats!
  transactions(filter: TransactionFilter, page: Int = 1, pageSize: Int = 10): TransactionPage!
  summary(month: Int, year: Int): Summary!
}

type Mutation {
  signUp(name: String!, email: String!, password: String!): AuthPayload!
  signIn(email: String!, password: String!): AuthPayload!
  updateProfile(name: String!): User!
  updateAvatar(image: String!): User!
  removeAvatar: User!
  createCategory(input: CategoryInput!): Category!
  updateCategory(id: ID!, input: CategoryInput!): Category!
  deleteCategory(id: ID!): Boolean!
  createTransaction(input: TransactionInput!): Transaction!
  updateTransaction(id: ID!, input: TransactionInput!): Transaction!
  deleteTransaction(id: ID!): Boolean!
}
```

Autenticação por header: `Authorization: Bearer <token>`.

---

## Decisões

**Isolamento por usuário em toda operação.** Todo resolver protegido passa por `requireUser` e filtra por `userId`. Update e delete usam `where: { id, userId }` e tratam `count === 0` como "não encontrado" — um usuário não consegue tocar nem detectar o recurso de outro. Coberto por 13 testes em `tests/isolation.test.ts`.

**Dinheiro em centavos (`Int`).** Nenhum valor monetário passa por ponto flutuante. O valor é sempre positivo e o sinal vem do campo `type`.

**Datas em meia-noite UTC.** Evita o clássico "a transação de 01/12 aparece como 30/11" quando o fuso do navegador está atrás de Greenwich.

**Deletar categoria não apaga transações.** A relação usa `onDelete: SetNull`: as transações sobrevivem e passam a exibir "Sem categoria".

**Saldo por categoria é líquido.** A agregação separa por tipo e expõe `incomeCents`, `expenseCents` e `balanceCents` (entradas menos saídas).

**Sem N+1.** Os campos agregados de `Category` são resolvidos por um DataLoader por request, alimentado por um único `groupBy`.

**Avatar validado pelos magic bytes.** A foto chega como data URL base64 na mutation `updateAvatar`, e o `Content-Type` declarado é conferido contra os primeiros bytes do arquivo — um `.php` renomeado para `image/png` é recusado. Só PNG, JPEG e WebP, até 2 MB, nome gerado por UUID (o nome original nunca toca o disco) e o arquivo anterior é apagado ao trocar. Os arquivos ficam em `UPLOADS_DIR`, fora do banco, servidos como estáticos em `/uploads`.

---

## Testes

```bash
pnpm test
```

Cada suíte roda contra uma cópia própria de um banco SQLite migrado, executando operações GraphQL de ponta a ponta: autenticação, CRUD das duas entidades, filtros, paginação, agregações e o isolamento entre usuários.

---

## Docker

A imagem é autossuficiente (contexto = esta pasta):

```bash
docker build -t financy-backend .
```

Ou, junto com o front, pelo `docker-compose.yml` da raiz.
