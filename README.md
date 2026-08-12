# Financy

> **Branch `feat/avatar-upload`.** Contém o desafio completo **mais** o desafio opcional de upload de foto de perfil. O código original do desafio, só com as regras obrigatórias, está preservado no `master`.

Aplicação fullstack de gerenciamento de finanças pessoais: cada usuário cria sua conta, faz login e gerencia **apenas** as próprias transações e categorias.

- **API** — TypeScript, GraphQL (Apollo Server 4), Prisma, SQLite, JWT
- **Front** — TypeScript, React, Vite, GraphQL, TailwindCSS, TanStack Query

---

## Como rodar localmente

Pré-requisitos: **Node 20+** e **pnpm 10+** (`corepack enable`).

`backend/` e `frontend/` são projetos independentes, cada um com seu `package.json` e seu lockfile — dá para rodar qualquer um dos dois sozinho.

**Backend** (terminal 1):

```bash
cd backend
pnpm install
cp .env.example .env

# Gere um JWT_SECRET e cole no .env:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

pnpm db:setup   # migrações + dados de demonstração
pnpm dev        # http://localhost:4000/graphql
```

**Frontend** (terminal 2):

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm dev        # http://localhost:5173
```

Se preferir um terminal só, os scripts da raiz são atalhos para os dois: `pnpm run install:all`, `pnpm setup`, `pnpm dev`.

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

Dentro de `backend/` ou de `frontend/`:

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Sobe o projeto em modo desenvolvimento |
| `pnpm build` | Compila para produção |
| `pnpm test` | Roda a suíte de testes |
| `pnpm typecheck` | TypeScript em modo estrito |
| `pnpm lint` | ESLint |

Só no backend: `db:setup`, `db:migrate`, `db:reset`, `db:studio`, `seed`.

Na raiz, os mesmos comandos (`dev`, `build`, `test`, `typecheck`, `lint`) rodam nas duas pastas em sequência, mais `install:all` e `setup`.

---

## Variáveis de ambiente

**`backend/.env`**

| Chave | Descrição |
| --- | --- |
| `DATABASE_URL` | Conexão do SQLite (`file:./dev.db`) |
| `JWT_SECRET` | Segredo que assina os tokens — **obrigatório** |
| `JWT_EXPIRES_IN` | Validade do token (padrão `7d`) |
| `PORT` | Porta da API (padrão `4000`) |
| `CORS_ORIGIN` | Origens liberadas, separadas por vírgula |
| `UPLOADS_DIR` | Pasta onde as fotos de perfil são gravadas (padrão `./uploads`) |
| `PUBLIC_URL` | URL pública da API, usada para montar o endereço das fotos |

**`frontend/.env`**

| Chave | Descrição |
| --- | --- |
| `VITE_BACKEND_URL` | Endpoint GraphQL da API |

A API valida essas variáveis na inicialização e falha com uma mensagem clara se faltar alguma — melhor do que descobrir um `JWT_SECRET` vazio no primeiro login.

---

## Estrutura

```
financy/
├── backend/                 desafio Back-end — API GraphQL (Apollo Server + Prisma + SQLite)
│   ├── prisma/              schema, migrações e seed
│   ├── src/
│   │   ├── modules/         user | category | transaction (typeDefs + resolvers)
│   │   ├── lib/             auth, prisma, loaders, erros, validação
│   │   ├── context.ts       contexto por request + requireUser
│   │   └── server.ts
│   └── tests/               testes de integração (Vitest)
├── frontend/                desafio Front-end — SPA React + Vite
│   └── src/
│       ├── components/      brand, layout, ui (styleguide), diálogos
│       ├── pages/           login, cadastro, dashboard, transações, categorias, perfil
│       ├── graphql/         cliente, operações e tipos
│       ├── hooks/           queries e mutations (TanStack Query)
│       └── lib/             formatação, datas, catálogo de categorias
└── docker-compose.yml
```

---

## Decisões de projeto

**Dinheiro em centavos (`Int`).** Nenhum valor monetário passa por ponto flutuante. O `Decimal` do Prisma tem suporte irregular em SQLite e `Float` arredonda errado; o valor é sempre positivo e o sinal vem do campo `type`.

**Isolamento por usuário em toda operação.** Todo resolver protegido passa por `requireUser` e filtra por `userId`. Update e delete usam `where: { id, userId }` e tratam `count === 0` como "não encontrado" — um usuário não consegue tocar nem detectar o recurso de outro. Isso é coberto por 13 testes dedicados em `backend/tests/isolation.test.ts`.

**Deletar categoria não apaga transações.** A relação usa `onDelete: SetNull`: as transações sobrevivem e passam a exibir a tag "Sem categoria". O diálogo de confirmação avisa quantas serão afetadas. Apagar uma categoria não pode apagar o histórico financeiro de ninguém.

**Datas em meia-noite UTC.** Gravar e filtrar em UTC evita o clássico "a transação de 01/12 aparece como 30/11" quando o fuso do navegador está atrás de Greenwich.

**Saldo por categoria é líquido, não bruto.** Uma categoria pode receber e gastar — um freela que rende R$ 800 e custa R$ 400 de ferramenta tem **saldo de R$ 400**, não de R$ 1.200. Por isso a agregação separa por tipo e expõe `incomeCents`, `expenseCents` e `balanceCents` (entradas menos saídas, podendo ser negativo). No dashboard o saldo aparece com sinal e cor, e quando a categoria tem os dois sentidos a quebra é exibida embaixo — senão o saldo sozinho esconderia o movimento real.

**Sem N+1 nas categorias.** Os campos agregados são resolvidos por um DataLoader por request, alimentado por um único `groupBy` — não uma query por categoria da lista.

**Tokens do tema amostrados do Figma.** As cores em `frontend/src/index.css` foram lidas pixel a pixel dos exports do layout, não estimadas a olho. As sete cores de categoria são exatamente os tons 600 do Tailwind; as tags derivam os tons 100 e 700.

**Tipos GraphQL escritos à mão.** Em `frontend/src/graphql/types.ts`, espelhando o SDL da API. O schema é pequeno e estável, e assim o build do front não depende de um servidor no ar para gerar código — o que simplifica CI e Docker.

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
- [x] Upload de foto de perfil (desafio opcional)
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

**Fora de escopo:** o link "Recuperar senha" na tela de login existe por fidelidade ao layout, mas o fluxo de recuperação não faz parte desta versão e o app informa isso ao ser clicado.

---

## Upload de foto de perfil

O desafio opcional, implementado nesta branch. Em `/perfil`, o botão de câmera sobre o avatar abre o seletor de arquivos; a foto aparece na hora e passa a valer na navbar. Há também "Remover foto", que volta para as iniciais.

**A imagem é tratada no navegador antes de subir.** O `<canvas>` corta no centro para um quadrado, reduz para 512 px e recodifica em WebP — uma foto de 4 MB vira algo em torno de 40 KB. Isso mantém o payload pequeno, garante que o avatar seja sempre quadrado (o layout é circular) e evita depender de processamento de imagem no servidor.

**O upload viaja pelo próprio GraphQL**, como data URL base64 na mutation `updateAvatar`. Não usei `multipart/form-data` nem `graphql-upload`: seria mais uma dependência e um segundo caminho de autenticação para manter, enquanto a mutation já herda o `Authorization` e o tratamento de erros de todo o resto.

**O servidor não confia no que o navegador diz.** O `Content-Type` declarado no data URL é conferido contra os magic bytes do arquivo, então um `.php` renomeado para `image/png` é recusado. Além disso: só PNG, JPEG e WebP, limite de 2 MB, nome de arquivo gerado por UUID (o nome original nunca toca o disco) e a foto anterior é apagada ao trocar, para não acumular lixo.

**Os arquivos ficam fora do banco**, em `UPLOADS_DIR`, servidos como estáticos em `/uploads`. No Docker a pasta vive no mesmo volume do SQLite, então as fotos sobrevivem ao recriar os containers.

---

## Testes

```bash
pnpm -C backend test   # API
pnpm -C frontend test  # front
pnpm test              # os dois, a partir da raiz
```

**API (80 testes, Vitest).** Integração real: cada suíte roda contra uma cópia própria de um banco SQLite migrado, executando operações GraphQL de ponta a ponta. Cobre autenticação, CRUD das duas entidades, filtros, paginação, agregações e — o mais importante — o isolamento entre usuários.

**Front (45 testes, Vitest + Testing Library).** Foca no que quebra em silêncio: a máscara de moeda e seu ciclo de ida e volta em centavos, as conversões de data em UTC, a renderização das tags por cor e a validação do formulário de login.
