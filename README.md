# Ginga

![Ginga Home](docs/images/ginga-home.png)

## Objetivo do Projeto

O **Ginga** é uma plataforma *open source* desenvolvida para conectar talentos de tecnologia a oportunidades de mercado. O projeto divide-se em dois módulos principais:

* **GingaPort:** Focado no profissional, permitindo a criação de portfólios técnicos robustos com integração à API do GitHub.
* **GingaVagas:** Focado em empresas, permitindo a publicação de vagas com transparência salarial e requisitos técnicos categorizados por tags.

---

## Tecnologias Utilizadas

O projeto utiliza um stack moderno focado em performance e produtividade:

* **Linguagem:** Python 3.12+.
* **Framework Web:** Django 6.0+.
* **Gestão de Pacotes:** [UV](https://www.google.com/search?q=https://astral.sh/uv/) (substituto rápido para o pip).
* **Banco de Dados:** PostgreSQL.
* **CSS:** Tailwind CSS (via CDN no template base).
* **Linting/Formatting:** Ruff.
* **Containerização:** Docker e Docker Compose.

---

## Como Instalar e Executar Localmente (via UV)

### Pré-requisitos

1. Ter o **UV** instalado em sua máquina.
2. PostgreSQL instalado ou Docker para rodar o banco de dados.

### 1. Clonar o Repositório

```bash
git clone <url-do-seu-repositorio>
cd ginga-web

```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e ajuste os valores necessários (como credenciais do banco):

```bash
cp .env.example .env

```

Certifique-se de que o `DATABASE_URL` no `.env` aponta para sua instância local do Postgres.

### 3. Instalar Dependências e Sincronizar o Ambiente

O UV gerencia o ambiente virtual automaticamente:

```bash
uv sync

```

### 4. Executar Migrações

```bash
uv run manage.py migrate

```

### 5. Carregar Dados Iniciais

Carregue as tecnologias para o sistema de autocomplete de vagas e competências:

```bash
uv run python manage.py load_techs
```

Este comando é **idempotente** - pode ser executado múltiplas vezes sem criar duplicatas. Ele popula o banco com 100 tecnologias categorizadas (linguagens, frameworks, bancos de dados, DevOps, etc.) para uso no autocomplete.

### 6. (Opcional) Popular com Dados de Teste

Para desenvolvimento e testes, você pode popular o banco com dados fictícios:

```bash
uv run python manage.py seed_test_data
```

Este comando cria:
- **5 Recrutadores** com 1-3 empresas cada (total: 9 empresas)
- **10 vagas por empresa** (9 ativas + 1 inativa)
- **20 Candidatos** (7 excelentes, 8 medianos, 5 incompletos)
- **Candidaturas** aleatórias (3-7 por candidato com perfil)

**Credenciais de teste:**
- Senha padrão: `ginga@2024`
- Recrutadores: `master@techcorp.com.br`, `ana.rh@inovabr.com.br`
- Candidatos: `flavio.expert@email.com`, `carolina.dev@email.com`

O comando é **idempotente** - pode ser executado múltiplas vezes sem duplicar dados.

### 7. Executar o Servidor

Para iniciar o projeto localmente, utilize o comando:

```bash
uv run manage.py runserver
```

---

## Comandos de Gerenciamento

| Comando | Descrição |
|---------|-----------|
| `uv run python manage.py migrate` | Executa migrações do banco de dados |
| `uv run python manage.py createsuperuser` | Cria um usuário administrador |
| `uv run python manage.py load_techs` | Carrega 100 tecnologias para autocomplete (idempotente) |
| `uv run python manage.py seed_test_data` | Popula o banco com dados de teste (idempotente) |
| `uv run python manage.py runserver` | Inicia o servidor de desenvolvimento |
| `uv run ruff check` | Verifica qualidade do código |
| `uv run ruff check --fix` | Corrige automaticamente problemas de lint |

---

## Contribuição

Adoramos contribuições! Para contribuir com o Ginga, siga estes passos:

1. Faça um **Fork** do projeto.
2. Crie uma branch para sua funcionalidade (`git checkout -b feature/minha-feature`).
3. Desenvolva suas alterações.
4. Certifique-se de que o código segue os padrões do projeto (veja a seção Ruff abaixo).
5. Envie um **Pull Request (PR)** descrevendo suas mudanças detalhadamente.

---

## Qualidade de Código com Ruff

Antes de realizar qualquer commit ou solicitar um PR, você **deve** executar o seguinte comando:

```bash
uv run ruff check

```

### Por que executar o Ruff?

O **Ruff** é utilizado neste projeto para garantir a consistência do código. Ele atua como:

* **Linter:** Identifica erros de sintaxe, variáveis não utilizadas e más práticas.
* **Formatter:** Garante que todos os colaboradores sigam o mesmo estilo de escrita (PEP 8), facilitando a leitura e revisão do código por outros membros da comunidade.
