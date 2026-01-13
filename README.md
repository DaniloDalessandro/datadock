# 📊 DataDock

**Sistema completo de gerenciamento e importação de dados com suporte a múltiplas fontes**

[![Django](https://img.shields.io/badge/Django-5.2-green.svg)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

---

## 📑 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Quick Start](#-quick-start)
  - [Com Docker (Recomendado)](#com-docker-recomendado)
  - [Instalação Manual](#instalação-manual)
- [Docker - Guia Completo](#-docker---guia-completo)
- [API Documentation](#-api-documentation)
- [Testes](#-testes)
  - [Backend](#testes-backend)
  - [Frontend](#testes-frontend)
- [Deploy em Produção](#-deploy-em-produção)
- [Comandos Úteis](#-comandos-úteis)
- [Troubleshooting](#-troubleshooting)
- [Contribuindo](#-contribuindo)

---

## 🎯 Sobre o Projeto

**DataDock** é uma plataforma completa para importação, gerenciamento e consulta de grandes volumes de dados de múltiplas fontes. Desenvolvido com Django REST Framework no backend e Next.js no frontend, oferece uma interface moderna e APIs robustas para integração de dados empresariais.

### Por que DataDock?

- 🚀 **Rápido**: Processamento otimizado com cache Redis e bulk operations
- 🔒 **Seguro**: Autenticação JWT, permissões granulares, rate limiting
- 📈 **Escalável**: Arquitetura preparada para grandes volumes
- 🎨 **Moderno**: Interface responsiva com Next.js 15 e shadcn/ui
- 🐳 **Deploy Fácil**: Containerizado com Docker, pronto para produção
- 📊 **Analítico**: Dashboard com métricas e visualizações em tempo real

---

## ✨ Funcionalidades

### 📥 Importação de Dados

- ✅ Upload de arquivos CSV e Excel (.xlsx, .xls)
- ✅ Importação de APIs externas (JSON)
- ✅ Detecção automática de tipos de dados
- ✅ Validação e sanitização de dados
- ✅ Deduplicação inteligente com hashing MD5
- ✅ Processamento assíncrono com Celery (grandes volumes)
- ✅ Preview de dados antes da importação
- ✅ Limites configuráveis (tamanho, linhas, colunas)

### 🔍 Consulta e Busca

- ✅ Busca full-text em todos os datasets
- ✅ Filtros avançados por coluna (numéricos, texto, data, categoria)
- ✅ Filtros de seleção para colunas TEXT (até 100 valores únicos)
- ✅ Paginação otimizada
- ✅ Export em CSV e Excel com filtros aplicados
- ✅ Preview de dados
- ✅ Metadados de colunas (tipos, valores únicos, filter_type)
- ✅ Datasets públicos e privados
- ✅ Seleção de colunas para download

### 📊 Dashboard e Analytics

- ✅ Estatísticas agregadas em tempo real
- ✅ Gráficos de volume mensal
- ✅ Status de datasets (ativos, arquivados)
- ✅ Estimativa de armazenamento
- ✅ Taxa de crescimento
- ✅ Visualizações com Recharts

### 🔐 Segurança e Autenticação

- ✅ JWT Authentication com refresh tokens
- ✅ Permissões granulares (owner, admin, user)
- ✅ Rate limiting por usuário e IP
- ✅ CORS configurável
- ✅ CSRF protection
- ✅ Validação em múltiplas camadas
- ✅ Logs de auditoria
- ✅ Proteção contra SQL injection, XSS, CSRF

### ⚡ Performance

- ✅ Cache Redis para queries frequentes
- ✅ Bulk operations para inserções
- ✅ select_related/prefetch_related (Django ORM)
- ✅ Índices de banco otimizados
- ✅ Streaming de downloads (memória eficiente)
- ✅ Lazy loading de dados
- ✅ Gzip compression

### 🤖 Alice AI Assistant (RAG)

- ✅ Assistente virtual inteligente powered by Google Gemini
- ✅ **RAG (Retrieval Augmented Generation)** com busca vetorial
- ✅ Busca semântica usando pgvector (PostgreSQL)
- ✅ Embeddings com Google Gemini (models/embedding-001)
- ✅ Auto-indexação de datasets com Django Signals
- ✅ Respostas contextualizadas baseadas em dados reais
- ✅ Top 5 datasets mais relevantes por pergunta
- ✅ Comando de gerenciamento para indexar datasets existentes
- ✅ Health check para verificar configurações AI
- ✅ **100% Gemini** - Sem dependência de OpenAI

---

## 🛠️ Tecnologias

### Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Python | 3.12 | Linguagem principal |
| Django | 5.2 | Framework web |
| Django REST Framework | 3.16 | API REST |
| PostgreSQL | 16 | Banco de dados relacional |
| Redis | 7 | Cache e message broker |
| Celery | 5.4 | Processamento assíncrono |
| Gunicorn | 23.0 | WSGI server (produção) |
| Pandas | 2.2 | Processamento de dados |
| openpyxl | 3.1 | Manipulação de Excel |
| **pgvector** | 0.3.6 | **Busca vetorial (RAG)** |
| **Google Gemini** | Latest | **Chat + Embeddings (100% Gemini)** |

### Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Next.js | 15.5 | Framework React |
| React | 19.1 | Biblioteca UI |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Framework CSS |
| shadcn/ui | Latest | Componentes UI |
| Recharts | 3.2 | Biblioteca de gráficos |
| Zod | 4.1 | Validação de schemas |
| React Hook Form | 7.65 | Gerenciamento de formulários |
| Vitest | 2.1 | Framework de testes |

### DevOps e Infraestrutura

- **Docker** & **Docker Compose** - Containerização
- **Nginx** - Proxy reverso e load balancer
- **GitHub** - Versionamento
- **Logging** - Logs estruturados e rotativos

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX (Porta 80/443)                          │
│          Reverse Proxy + SSL + Static Files + Gzip              │
└─────────────┬───────────────────────────────┬───────────────────┘
              │                               │
              │                               │
      ┌───────▼────────┐            ┌────────▼────────┐
      │   Frontend      │            │    Backend      │
      │   Next.js 15    │            │   Django 5.2    │
      │   Port 3000     │◄──────────►│   Port 8000     │
      │                 │  REST API   │  + Gunicorn     │
      │  - React 19     │  JSON/JWT   │  - DRF          │
      │  - TypeScript   │             │  - Service Layer│
      │  - Tailwind     │             │  - ORM          │
      └─────────────────┘            └────────┬────────┘
                                              │
                    ┌─────────────────────────┼─────────────────┐
                    │                         │                 │
            ┌───────▼────────┐    ┌──────────▼─────┐  ┌────────▼────────┐
            │  Celery Worker  │    │   PostgreSQL   │  │     Redis       │
            │  Background     │    │   Database     │  │  Cache/Queue    │
            │  Tasks          │    │   Port 5432    │  │   Port 6379     │
            │  - Imports      │    │  - Dados       │  │  - Cache        │
            │  - Exports      │    │  - Users       │  │  - Sessions     │
            └─────────────────┘    └────────────────┘  └─────────────────┘
                    │
            ┌───────▼────────┐
            │  Celery Beat   │
            │  Scheduler     │
            │  - Cleanup     │
            │  - Reports     │
            └────────────────┘
```

### Padrões de Design

- **Service Layer Pattern**: Lógica de negócio separada das views
- **Repository Pattern**: Abstração de acesso a dados (Django ORM)
- **Factory Pattern**: Criação de usuários e processos
- **Dependency Injection**: Injeção de dependências via Django
- **Clean Architecture**: Separação clara de responsabilidades

---

## 📁 Estrutura do Projeto

### Estrutura Geral

```
dataport/
├── backend/                    # Django REST API
├── frontend/                   # Next.js Application
├── nginx/                      # Configuração Nginx
├── docker-compose.yml          # Docker Compose
└── README.md                   # Documentação
```

### Backend (Django)

```
backend/
├── accounts/                   # Autenticação e usuários
│   ├── management/commands/   # Comandos personalizados
│   ├── models.py              # User, Profile
│   ├── serializers.py
│   ├── services.py            # Lógica de negócio
│   ├── views.py               # API Views
│   └── tests.py
│
├── alice/                      # Assistente AI (RAG)
│   ├── management/commands/
│   ├── services/
│   │   └── vector_service.py  # Busca vetorial
│   ├── models.py              # DatasetVector
│   └── views.py
│
├── data_import/                # Importação de dados
│   ├── models.py              # ImportProcess, DataTable
│   ├── services.py
│   ├── tasks.py               # Celery tasks
│   ├── views.py
│   └── cache.py               # Cache Redis
│
└── core/                       # Settings Django
    ├── settings.py
    ├── urls.py
    ├── celery.py
    └── health_checks.py
```

### Frontend (Next.js)

```
frontend/src/
├── app/                                # Next.js App Router
│   ├── (auth)/                         # 🔐 Grupo de autenticação
│   │   └── login/page.tsx
│   │
│   ├── (private)/                      # 🔒 Rotas autenticadas
│   │   ├── dashboard/page.tsx
│   │   ├── datasets/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── alice/page.tsx
│   │   ├── ajuda/page.tsx
│   │   └── layout.tsx                  # Layout com sidebar
│   │
│   ├── (public)/                       # 🌐 Rotas públicas
│   │   ├── home/page.tsx               # Landing page
│   │   └── datasets-publicos/page.tsx
│   │
│   ├── layout.tsx                      # Layout raiz
│   └── page.tsx                        # Redirect inicial
│
├── components/
│   ├── layout/                         # Componentes de layout
│   │   ├── sidebar/
│   │   │   └── app-sidebar.tsx
│   │   └── navigation/
│   │       ├── nav-main.tsx
│   │       └── nav-user.tsx
│   │
│   ├── auth/                           # Autenticação
│   │   ├── AuthGuard.tsx
│   │   └── LoginForm.tsx
│   │
│   ├── datasets/
│   │   └── DatasetDialog.tsx
│   │
│   ├── filters/                        # Filtros avançados
│   │   ├── ColumnFilterPopover.tsx
│   │   ├── StringFilter.tsx
│   │   ├── NumberFilter.tsx
│   │   ├── DateFilter.tsx
│   │   └── CategoryFilter.tsx
│   │
│   └── ui/                             # shadcn/ui components
│
├── hooks/                              # Custom hooks
│   ├── useAuth.ts
│   └── useDatasets.ts
│
└── lib/                                # Utilitários
    ├── api.ts
    ├── auth.ts
    └── config.ts
```

### Convenções

**Rotas (App Router)**:
- `(auth)` - Grupo de autenticação (login)
- `(private)` - Rotas protegidas (dashboard, datasets, alice)
- `(public)` - Rotas públicas (home, datasets públicos)
- `[id]` - Rotas dinâmicas

**Componentes**:
- `layout/` - Estrutura (sidebar, navigation, header)
- `auth/` - Autenticação (AuthGuard, LoginForm)
- `datasets/` - Específicos de datasets
- `filters/` - Componentes de filtro
- `ui/` - Componentes genéricos (shadcn/ui)

---

## 🚀 Quick Start

### Com Docker (Recomendado)

**Pré-requisitos:** Docker 24.0+ e Docker Compose 2.20+

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/dataport.git
cd dataport

# 2. Configurar variáveis de ambiente
cp .env.example .env

# Editar .env e configurar:
# - POSTGRES_PASSWORD (senha do banco)
# - REDIS_PASSWORD (senha do Redis)
# - DJANGO_SECRET_KEY (chave secreta)
nano .env

# 3. Iniciar todos os serviços
docker-compose up -d

# 4. Aguardar inicialização (30-60 segundos)
docker-compose logs -f

# 5. Criar superusuário (primeiro acesso)
docker-compose exec backend python manage.py createsuperuser
```

**Pronto!** 🎉 Acesse:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/api/docs

### Instalação Manual

#### Pré-requisitos

- **Python 3.12+** ([Download](https://www.python.org/downloads/))
- **Node.js 20+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **Google Gemini API Key** (Opcional - para Alice AI) - [Obter aqui](https://ai.google.dev/)

---

#### 📦 Passo 1: Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/dataport.git
cd dataport
```

---

#### 🐍 Passo 2: Configurar Backend (Django)

```bash
# 1. Navegar para pasta backend
cd backend

# 2. Criar ambiente virtual
python -m venv venv

# 3. Ativar ambiente virtual
# Windows (CMD):
venv\Scripts\activate

# Windows (PowerShell):
venv\Scripts\Activate.ps1

# Linux/Mac:
source venv/bin/activate

# 4. Atualizar pip
python -m pip install --upgrade pip

# 5. Instalar dependências
pip install -r requirements.txt

# 6. Criar arquivo .env
# Windows:
copy .env.example .env

# Linux/Mac:
cp .env.example .env

# 7. Editar .env e configurar as variáveis
# Abra o arquivo .env em um editor de texto e configure:
```

**Exemplo de `.env` mínimo:**
```bash
# Django
DJANGO_SECRET_KEY=sua-chave-secreta-aqui-gere-uma-nova
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite - padrão)
# Nenhuma configuração necessária, criado automaticamente

# Redis (Opcional - fallback para cache em memória se não disponível)
REDIS_URL=redis://localhost:6379/0

# Google Gemini AI (Opcional - para assistente Alice)
GEMINI_API_KEY=your-gemini-api-key-here

# Frontend URL
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Celery (Opcional)
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

**💡 Dica:** Para gerar uma chave secreta segura:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

```bash
# 8. Executar migrações do banco de dados
python manage.py migrate

# 9. Criar superusuário (admin)
python manage.py createsuperuser
# Siga as instruções interativas

# 10. (Opcional) Criar dados de exemplo
python manage.py create_sample_data

# 11. Iniciar servidor Django
python manage.py runserver
```

**✅ Backend rodando em:** `http://localhost:8000`

---

#### ⚛️ Passo 3: Configurar Frontend (Next.js)

**Abra um NOVO terminal** (deixe o backend rodando no anterior)

```bash
# 1. Navegar para pasta frontend (a partir da raiz do projeto)
cd frontend

# 2. Instalar dependências
npm install

# 3. Criar arquivo .env.local
# Windows:
copy .env.example .env.local

# Linux/Mac:
cp .env.example .env.local

# 4. Editar .env.local
# Abra o arquivo e verifique se está assim:
```

**`.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
# 5. Iniciar servidor Next.js
npm run dev
```

**✅ Frontend rodando em:** `http://localhost:3000`

---

#### 🎉 Passo 4: Acessar o Sistema

Após seguir todos os passos acima, você terá:

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Frontend (App)** | http://localhost:3000 | Use o usuário criado no passo 9 |
| **Backend API** | http://localhost:8000 | - |
| **Admin Django** | http://localhost:8000/admin | Use o superusuário criado |
| **API Docs (Swagger)** | http://localhost:8000/api/docs | - |
| **API Schema** | http://localhost:8000/api/schema | - |

---

#### 🔧 Passo 5: Serviços Opcionais

##### Redis (Recomendado para produção)

**Opção 1 - Docker (mais fácil):**
```bash
docker run -d -p 6379:6379 --name redis-dataport redis:7-alpine
```

**Opção 2 - Instalação local:**
- **Windows**: [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
- **Linux**: `sudo apt install redis-server && sudo systemctl start redis`
- **Mac**: `brew install redis && brew services start redis`

##### Celery Workers (Para processamento assíncrono)

**Terminal 3:**
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

celery -A core worker -l info --pool=solo  # Windows
# celery -A core worker -l info  # Linux/Mac
```

**Terminal 4 (Scheduler - opcional):**
```bash
cd backend
venv\Scripts\activate  # Windows

celery -A core beat -l info
```

---

#### 📝 Resumo dos Comandos para Próximas Execuções

Depois da instalação inicial, para subir o sistema:

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Celery (Opcional):**
```bash
cd backend
venv\Scripts\activate  # Windows
celery -A core worker -l info --pool=solo
```

---

## 🐳 Docker - Guia Completo

📖 **[Documentação Completa de Docker](DOCKER.md)** - Guia detalhado com comandos, troubleshooting e dicas

### Estrutura de Serviços

```yaml
services:
  postgres    # Banco de dados PostgreSQL 16
  redis       # Cache e message broker
  backend     # Django + Gunicorn
  celery-worker  # Background tasks
  celery-beat    # Scheduler
  frontend    # Next.js
  nginx       # Proxy reverso (opcional)
```

### Comandos Docker

#### Desenvolvimento

```bash
# Modo desenvolvimento (hot reload)
docker-compose -f docker-compose.dev.yml up -d

# Ver logs em tempo real
docker-compose -f docker-compose.dev.yml logs -f

# Ver logs de um serviço específico
docker-compose -f docker-compose.dev.yml logs -f backend

# Parar serviços
docker-compose -f docker-compose.dev.yml down
```

#### Produção

```bash
# Build das imagens
docker-compose build

# Build sem cache (rebuild completo)
docker-compose build --no-cache

# Iniciar em background
docker-compose up -d

# Ver status dos containers
docker-compose ps

# Parar serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker-compose down -v
```

#### Gerenciamento

```bash
# Executar comandos Django
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py collectstatic

# Acessar shell do container
docker-compose exec backend bash
docker-compose exec frontend sh

# Reiniciar um serviço específico
docker-compose restart backend

# Ver uso de recursos
docker stats

# Ver logs
docker-compose logs --tail=100 backend
docker-compose logs --since 2024-01-01T10:00:00
```

#### Banco de Dados

```bash
# Backup do banco
docker-compose exec postgres pg_dump -U dataport dataport > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T postgres psql -U dataport dataport < backup.sql

# Acessar PostgreSQL
docker-compose exec postgres psql -U dataport -d dataport

# Ver tabelas
docker-compose exec postgres psql -U dataport -d dataport -c "\dt"
```

#### Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune -a

# Remover volumes não utilizados
docker volume prune

# Limpeza completa (CUIDADO!)
docker system prune -a --volumes
```

### Variáveis de Ambiente (.env)

```bash
# PostgreSQL
POSTGRES_DB=dataport
POSTGRES_USER=dataport
POSTGRES_PASSWORD=sua_senha_segura_aqui

# Redis
REDIS_PASSWORD=sua_senha_redis_aqui

# Django
DJANGO_SECRET_KEY=sua_chave_secreta_muito_longa_aqui
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,seu-dominio.com

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://seu-dominio.com

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Email (opcional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=sua-senha-de-app
```

### Health Checks

Todos os serviços têm health checks automáticos. Endpoints disponíveis:

| Endpoint | Descrição | Componentes Verificados |
|----------|-----------|------------------------|
| `/health/` | Basic health check | Database |
| `/health/detailed/` | Verificação completa | Database, Redis, Celery, Disk Space |
| `/health/ready/` | Readiness probe (Kubernetes) | Database |
| `/health/live/` | Liveness probe (Kubernetes) | Application status |

```bash
# Verificar saúde dos serviços
docker-compose ps

# Testar endpoints
curl http://localhost:8000/health/
curl http://localhost:8000/health/detailed/
curl http://localhost:8000/health/ready/
curl http://localhost:8000/health/live/

# Resposta de exemplo (health/detailed/)
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": {"status": "healthy", "message": "Database connection OK"},
    "cache": {"status": "healthy", "message": "Cache connection OK"},
    "celery": {"status": "healthy", "message": "2 Celery worker(s) active"},
    "disk": {"status": "healthy", "used_percent": 45.2, "free_gb": 120.5}
  }
}
```

### Volumes Persistentes

```yaml
volumes:
  postgres_data:     # Dados do PostgreSQL
  redis_data:        # Dados do Redis
  backend_logs:      # Logs do backend
  backend_static:    # Arquivos estáticos
  backend_media:     # Uploads de usuários
  nginx_logs:        # Logs do Nginx
```

**IMPORTANTE:** Fazer backup regular dos volumes!

---

## 📚 API Documentation

### Documentação Interativa

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### Endpoints Principais

#### Autenticação

```bash
# Login
POST /api/auth/login
Body: {"email": "user@example.com", "password": "senha"}
Response: {"access": "token...", "refresh": "token...", "user": {...}}

# Refresh Token
POST /api/auth/refresh
Body: {"refresh": "refresh_token..."}
Response: {"access": "novo_access_token..."}

# Logout
POST /api/auth/logout
Headers: Authorization: Bearer {token}
Body: {"refresh": "refresh_token..."}
```

#### Importação de Dados

```bash
# Criar importação (arquivo)
POST /api/data-import/
Headers: Authorization: Bearer {token}
Body (multipart/form-data):
  - file: arquivo.csv
  - table_name: "vendas_2024"
  - import_type: "file"

# Criar importação (API)
POST /api/data-import/
Headers: Authorization: Bearer {token}
Body (JSON):
{
  "table_name": "usuarios_api",
  "endpoint_url": "https://api.example.com/users",
  "import_type": "endpoint"
}

# Listar processos
GET /api/data-import/processes/?page=1&page_size=20
Headers: Authorization: Bearer {token}

# Detalhes do processo
GET /api/data-import/processes/{id}/
Headers: Authorization: Bearer {token}

# Preview dos dados
GET /api/data-import/processes/{id}/preview/
Headers: Authorization: Bearer {token}
Response: {"columns": [...], "data": [...], "total_records": 1000}

# Download
GET /api/data-import/processes/{id}/download/
Headers: Authorization: Bearer {token}
Response: arquivo CSV

# Adicionar mais dados
POST /api/data-import/processes/{id}/append/
Headers: Authorization: Bearer {token}
Body: (mesmo formato do POST /api/data-import/)

# Deletar processo
DELETE /api/data-import/processes/{id}/delete/
Headers: Authorization: Bearer {token}

# Alternar status (ativo/inativo)
POST /api/data-import/processes/{id}/toggle-status/
Headers: Authorization: Bearer {token}
```

#### Busca e Consulta

```bash
# Buscar em todos os datasets
GET /api/data-import/search/?q=termo_busca
Headers: Authorization: Bearer {token}
Response: {"results": [...], "total_tables": 5}

# Busca pública (sem auth)
GET /api/data-import/public-search/?q=termo
Response: {"results": [...]}

# Listar datasets públicos
GET /api/data-import/public-datasets/
Response: {"count": 10, "results": [...]}

# Dados públicos de um dataset
GET /api/data-import/public-data/{id}/
Response: {"columns": [...], "data": [...]}

# Metadados de colunas (com tipos de filtros)
GET /api/data-import/public-metadata/{id}/
Response: {
  "columns": [
    {
      "name": "nome",
      "type": "TEXT",
      "filter_type": "category",  # string, integer, float, date, category
      "unique_values": ["valor1", "valor2", ...]  # até 100 valores
    }
  ]
}
```

#### Analytics

```bash
# Estatísticas do dashboard
GET /api/data-import/dashboard-stats/
Headers: Authorization: Bearer {token}
Response: {
  "metrics": {
    "total_datasets": 45,
    "active_datasets": 32,
    "total_records": 1250000,
    "storage_tb": 2.5,
    "growth_rate": 15.3
  },
  "dataset_status": [...],
  "monthly_volume": [...]
}
```

#### Exemplos com cURL

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dataport.com","password":"admin123"}' \
  | jq -r '.access')

# 2. Upload de arquivo
curl -X POST http://localhost:8000/api/data-import/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@dados.csv" \
  -F "table_name=vendas_jan" \
  -F "import_type=file"

# 3. Importar de API
curl -X POST http://localhost:8000/api/data-import/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_name": "usuarios_github",
    "endpoint_url": "https://api.github.com/users",
    "import_type": "endpoint"
  }'

# 4. Listar datasets
curl http://localhost:8000/api/data-import/processes/ \
  -H "Authorization: Bearer $TOKEN"

# 5. Buscar dados
curl "http://localhost:8000/api/data-import/search/?q=brasil" \
  -H "Authorization: Bearer $TOKEN"

# 6. Download
curl http://localhost:8000/api/data-import/processes/1/download/ \
  -H "Authorization: Bearer $TOKEN" \
  -o dados.csv
```

---

## 🤖 Alice AI Assistant com RAG

Alice é a assistente virtual inteligente do DataDock, powered by **Google Gemini** com **RAG (Retrieval Augmented Generation)** para busca semântica.

### 🎯 O que é RAG?

RAG combina:
- **Busca Vetorial**: Encontra datasets semanticamente similares à pergunta
- **LLM (Gemini)**: Gera respostas naturais baseadas nos dados encontrados
- **Contextualização**: Respostas precisas usando dados reais do sistema

### 🔧 Configuração

#### 1. Instalar dependências

```bash
cd backend
pip install pgvector==0.3.6
```

#### 2. Configurar variáveis de ambiente

Adicione ao `.env`:

```bash
# Google Gemini API Key (usado para chat E embeddings)
GEMINI_API_KEY=sua-chave-gemini-aqui
```

**Como obter a chave:**
- **Gemini API Key**: https://makersuite.google.com/app/apikey (GRÁTIS)

#### 3. Aplicar migrações

```bash
python manage.py migrate alice
```

Isso habilita a extensão `pgvector` no PostgreSQL.

#### 4. Indexar datasets existentes

```bash
# Indexar todos os datasets completos
python manage.py index_datasets

# Reindexar tudo (incluindo já indexados)
python manage.py index_datasets --all

# Indexar dataset específico por ID
python manage.py index_datasets --dataset-id 123

# Indexar dataset específico por nome
python manage.py index_datasets --table-name data001
```

### 📊 Como funciona

1. **Pergunta do usuário**: "Quais dados de importação temos?"
2. **Embedding da pergunta**: Gemini gera vetor de 768 dimensões (models/embedding-001)
3. **Busca vetorial**: pgvector encontra top 5 datasets similares via L2Distance
4. **Contexto enriquecido**: Monta contexto com datasets relevantes
5. **Resposta AI**: Gemini gera resposta natural baseada no contexto

### 🔍 Endpoints

#### Chat com Alice

```bash
POST /api/alice/chat/
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Quais datasets de navegação temos disponíveis?"
}
```

**Resposta:**

```json
{
  "success": true,
  "response": "Encontrei **3 datasets** de navegação:\n\n1. **data_navegacao_2024** - 15.234 registros\n2. **shipping_logs** - 8.901 registros\n3. **vessel_tracking** - 23.456 registros\n\nTodos contêm dados atualizados de movimentação portuária.",
  "timestamp": "2025-12-28T10:30:00Z"
}
```

#### Health Check

```bash
GET /api/alice/health/
Authorization: Bearer <token>
```

**Resposta:**

```json
{
  "status": "healthy",
  "service": "Alice AI Assistant",
  "gemini_configured": true,
  "rag_enabled": true,
  "embedding_model": "Google Gemini models/embedding-001",
  "timestamp": "2025-12-28T10:30:00Z"
}
```

### 🚀 Indexação Automática

Datasets são **automaticamente indexados** quando:
- ✅ Status muda para `completed`
- ✅ Dataset é criado via upload/API
- ✅ Dataset é atualizado

Implementado via **Django Signals** em `alice/signals.py`.

### 📁 Arquitetura

```
alice/
├── models.py              # DatasetEmbedding model (VectorField)
├── views.py               # AliceChatView com RAG
├── services/
│   └── vector_service.py  # VectorService (embeddings, busca)
├── signals.py             # Auto-indexação
├── migrations/
│   └── 0001_enable_vector_extension.py
└── management/
    └── commands/
        └── index_datasets.py  # Comando de indexação
```

### 🎨 Modelo de Embedding

```python
class DatasetEmbedding(models.Model):
    dataset = OneToOneField('DataImportProcess')  # Relação 1:1
    description = TextField()                     # Descrição textual
    embedding = VectorField(dimensions=768)       # Vetor Gemini
    metadata = JSONField()                        # Metadados adicionais
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

### 💡 Dicas

- **Custo**: Gemini Embeddings são **GRATUITOS** (até 1500 requisições/dia)
- **Performance**: Busca vetorial é extremamente rápida (ms)
- **Precisão**: RAG retorna apenas datasets relevantes
- **Fallback**: Se RAG falhar, usa contexto tradicional
- **100% Gemini**: Uma única API key para tudo (chat + embeddings)

### 🔒 Rate Limiting

- **30 requisições/minuto** por usuário
- Retry automático com exponential backoff
- Cache de contexto (5 minutos)

---

## 🧪 Testes

### Testes Backend

#### Executar Testes

```bash
cd backend

# Todos os testes
python manage.py test

# App específico
python manage.py test accounts
python manage.py test data_import

# Teste específico
python manage.py test accounts.tests.UserSerializerTest

# Com verbose
python manage.py test --verbosity=2

# Manter banco de testes (mais rápido)
python manage.py test --keepdb
```

#### Cobertura de Testes

```bash
# Instalar coverage
pip install coverage

# Executar com cobertura
coverage run --source='.' manage.py test

# Ver relatório
coverage report

# Gerar HTML
coverage html
# Abrir htmlcov/index.html no navegador

# Ver apenas arquivos com menos de 80%
coverage report --skip-covered --skip-empty
```

#### Testes Existentes (Backend)

**accounts app** (~450 linhas de testes):
- ✅ Models (Company, CustomUser, Profiles)
- ✅ Serializers (UserSerializer)
- ✅ Views (Login, Password Reset, Change Password)
- ✅ APIs (Company, User management)
- **Cobertura**: ~80%

**data_import app**:
- ⚠️ **Em desenvolvimento** (0% cobertura)
- Necessário: testes de importação, validação, serviços

### Testes Frontend

#### Configuração

Framework de testes configurado:
- **Vitest** - Framework de testes rápido
- **React Testing Library** - Testes de componentes
- **@testing-library/jest-dom** - Matchers customizados
- **jsdom** - Ambiente DOM

#### Executar Testes

```bash
cd frontend

# Todos os testes
npm test

# Watch mode (reexecuta ao salvar)
npm test -- --watch

# Interface visual
npm run test:ui

# Cobertura
npm run test:coverage

# Teste específico
npm test auth.test.ts

# Com UI e cobertura
npm run test:ui -- --coverage
```

#### Testes Existentes (Frontend)

**lib/auth.test.ts** (10 testes):
- ✅ getAccessToken / getRefreshToken
- ✅ setAuthTokens
- ✅ clearAuthData
- ✅ isAuthenticated
- ✅ getTokenExpiration
- ✅ isTokenExpired (com buffer)

**lib/api.test.ts** (6 testes):
- ✅ apiGet com autenticação
- ✅ apiPost com dados
- ✅ apiDelete
- ✅ Tratamento de erro 401
- ✅ Refresh automático de token

**hooks/useAuth.test.tsx** (3 testes):
- ✅ Estado inicial
- ✅ Usuário não autenticado
- ✅ Usuário autenticado

**Total**: 19 testes | **Cobertura**: ~30%

#### Estrutura de Testes

```
frontend/src/
├── lib/
│   └── __tests__/
│       ├── auth.test.ts
│       └── api.test.ts
├── hooks/
│   └── __tests__/
│       └── useAuth.test.tsx
└── test/
    └── setup.ts          # Configuração global
```

#### Exemplo de Teste

```typescript
// lib/__tests__/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getAccessToken, setAuthTokens } from '../auth'

describe('Auth Utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve armazenar access token', () => {
    setAuthTokens({ access: 'test-token' })
    expect(getAccessToken()).toBe('test-token')
  })

  it('deve retornar null quando não há token', () => {
    expect(getAccessToken()).toBeNull()
  })
})
```

---

## 🚢 Deploy em Produção

### Checklist Pré-Deploy

- [ ] Configurar variáveis de ambiente
- [ ] Alterar `DJANGO_SECRET_KEY`
- [ ] Configurar senhas seguras (PostgreSQL, Redis)
- [ ] `DEBUG=False`
- [ ] Configurar `ALLOWED_HOSTS`
- [ ] Configurar `CORS_ALLOWED_ORIGINS`
- [ ] Configurar domínio e SSL/HTTPS
- [ ] Testar build localmente
- [ ] Configurar backup automático
- [ ] Configurar monitoramento (opcional)

### Deploy com Docker

```bash
# 1. Configurar produção
cp .env.example .env
# Editar .env com valores de produção

# 2. Build
docker-compose build

# 3. Iniciar
docker-compose up -d

# 4. Verificar
docker-compose ps
docker-compose logs -f

# 5. Criar superuser
docker-compose exec backend python manage.py createsuperuser

# 6. Collectstatic (se não automático)
docker-compose exec backend python manage.py collectstatic --noinput
```

### SSL/HTTPS com Nginx

```bash
# 1. Instalar Certbot
docker-compose exec nginx apk add certbot

# 2. Obter certificado
docker-compose exec nginx certbot --nginx -d seu-dominio.com

# 3. Renovação automática (cron)
0 0 * * * docker-compose exec nginx certbot renew --quiet
```

### Backup Automático

```bash
# Script de backup (backup.sh)
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump -U dataport dataport > \
  ${BACKUP_DIR}/db_backup_${DATE}.sql

# Backup volumes
docker run --rm -v dataport-backend-media:/data -v ${BACKUP_DIR}:/backup \
  alpine tar czf /backup/media_${DATE}.tar.gz -C /data .

# Manter apenas últimos 7 dias
find ${BACKUP_DIR} -name "*.sql" -mtime +7 -delete
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +7 -delete
```

Agendar no cron:
```bash
0 2 * * * /path/to/backup.sh
```

### Monitoramento (Opcional)

#### Health Checks

```bash
# Adicionar ao cron
*/5 * * * * curl -f http://seu-dominio.com/health/ || echo "Site down" | mail -s "Alert" admin@example.com
```

#### Logs Centralizados

```bash
# docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🛠️ Comandos Úteis

### Django

```bash
# Migrações
python manage.py makemigrations
python manage.py migrate
python manage.py showmigrations

# Superuser
python manage.py createsuperuser

# Shell
python manage.py shell
python manage.py dbshell

# Limpar sessões expiradas
python manage.py clearsessions

# Coletar arquivos estáticos
python manage.py collectstatic

# Comandos customizados
python manage.py create_sample_data
python manage.py create_user_with_profile
```

### Next.js

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Lint
npm run lint

# Testes
npm test
npm run test:coverage
```

### Git

```bash
# Status
git status

# Commit (Conventional Commits)
git commit -m "feat: adicionar importação de Excel"
git commit -m "fix: corrigir bug de autenticação"
git commit -m "docs: atualizar README"

# Push
git push origin main

# Pull
git pull origin main
```

### PostgreSQL

```bash
# Conectar
psql -U dataport -d dataport

# Comandos úteis
\dt                 # Listar tabelas
\d+ table_name      # Descrever tabela
\l                  # Listar databases
\du                 # Listar usuários
\q                  # Sair

# Queries úteis
SELECT COUNT(*) FROM data_import_importeddatarecord;
SELECT table_name, record_count FROM data_import_dataimportprocess;
```

---

## 🔧 Troubleshooting

### Problema: Containers não iniciam

```bash
# Ver logs detalhados
docker-compose logs

# Verificar portas em uso
netstat -tulpn | grep -E ':(3000|8000|5432|6379|80)'

# Rebuild forçado
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Problema: Erro de conexão com banco

```bash
# Verificar se PostgreSQL está healthy
docker-compose ps postgres

# Ver logs
docker-compose logs postgres

# Testar conexão
docker-compose exec backend python manage.py dbshell
```

### Problema: Frontend não conecta ao backend

1. Verificar `NEXT_PUBLIC_API_URL` no `.env.local`
2. Verificar `CORS_ALLOWED_ORIGINS` no backend
3. Testar backend: `curl http://localhost:8000/health/`
4. Ver logs: `docker-compose logs backend`

### Problema: Celery não processa tasks

```bash
# Ver logs do worker
docker-compose logs celery-worker

# Verificar conexão com Redis
docker-compose exec backend python -c "import redis; r = redis.Redis(host='redis', port=6379); print(r.ping())"

# Listar tasks registradas
docker-compose exec celery-worker celery -A core inspect registered
```

### Problema: Erro 401 Unauthorized

1. Verificar se token está sendo enviado: `Authorization: Bearer {token}`
2. Verificar se token não expirou (60 minutos)
3. Fazer refresh do token: `POST /api/auth/refresh`
4. Ver logs: `docker-compose logs backend`

### Problema: Importação falha

```bash
# Ver logs detalhados
docker-compose logs backend | grep -i error

# Verificar limites
# MAX_ROWS = 100000
# MAX_COLUMNS = 100
# MAX_FILE_SIZE = 50MB

# Testar manualmente
docker-compose exec backend python manage.py shell
>>> from data_import.services import DataImportService
>>> DataImportService.process_file_data(file)
```

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Siga os passos:

### 1. Fork e Clone

```bash
# Fork no GitHub
# Clonar seu fork
git clone https://github.com/seu-usuario/dataport.git
cd dataport
```

### 2. Criar Branch

```bash
git checkout -b feature/minha-feature
# ou
git checkout -b fix/meu-bugfix
```

### 3. Desenvolver

- Escrever código limpo e documentado
- Seguir padrões de código (PEP 8, ESLint)
- Adicionar testes
- Testar localmente

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm test
```

### 4. Commit

Use **Conventional Commits**:

```bash
# Formato
tipo(escopo): descrição curta

# Exemplos
git commit -m "feat: adicionar importação de JSON"
git commit -m "fix: corrigir validação de email"
git commit -m "docs: atualizar guia de instalação"
git commit -m "style: formatar código com black"
git commit -m "refactor: extrair lógica para service layer"
git commit -m "test: adicionar testes para auth"
git commit -m "chore: atualizar dependências"
```

**Tipos**:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação de código
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

### 5. Push e Pull Request

```bash
git push origin feature/minha-feature
```

Abra Pull Request no GitHub com:
- Título descritivo
- Descrição do que foi feito
- Screenshots (se aplicável)
- Referência a issues

### Code Style

**Backend (Python)**:
- PEP 8
- Black formatter
- Type hints
- Docstrings

**Frontend (TypeScript)**:
- ESLint
- Prettier
- Tipos explícitos
- JSDoc quando necessário

### Revisão

Seu PR será revisado. Mudanças podem ser solicitadas.

---

## 📊 Status do Projeto

### Qualidade de Código

| Categoria | Nota | Status |
|-----------|------|--------|
| Arquitetura | 8.0/10 | ✅ Excelente |
| Backend | 7.5/10 | ✅ Bom |
| Frontend | 6.5/10 | ⚠️ Precisa melhorias |
| API Design | 8.0/10 | ✅ Excelente |
| Segurança | 7.0/10 | ✅ Bom |
| Testes | 5.5/10 | ⚠️ Em desenvolvimento |
| Documentação | 9.0/10 | ✅ Excelente |

**Média Geral**: 7.4/10

### Cobertura de Testes

- **Backend accounts**: ~80% ✅
- **Backend data_import**: 0% ⚠️ (em desenvolvimento)
- **Frontend**: ~30% ⚠️ (em desenvolvimento)

### Melhorias Recentes (v1.0.6)

- ✅ Reorganização completa da estrutura do frontend
  - Grupos de rotas: `(auth)`, `(private)`, `(public)`
  - Componentes organizados em: `layout/`, `auth/`, `datasets/`, `filters/`
  - Documentação completa da estrutura no README
- ✅ Correção de bug crítico: Timestamp serialization (datasets com colunas de data)
- ✅ Filtros de categoria para colunas TEXT (seleção de valores únicos)
- ✅ Favicon/ícone do site (database icon azul)
- ✅ Docker otimizado com multi-stage builds
- ✅ Configuração Nginx completa (proxy reverso, cache, gzip)
- ✅ Limpeza de código e comentários em PT-BR
- ✅ Documentação Docker completa (DOCKER.md)
- ✅ Health checks robustos (basic, detailed, ready, live)
- ✅ Next.js standalone output para Docker

### Roadmap

#### v1.1 (Em desenvolvimento)

- [ ] Testes completos para data_import
- [ ] Cobertura de testes frontend >70%
- [ ] CI/CD com GitHub Actions
- [ ] Modo escuro completo
- [ ] PWA (Progressive Web App)

#### v2.0 (Planejado)

- [ ] OAuth2 (Google, GitHub, Microsoft)
- [ ] 2FA (Autenticação de dois fatores)
- [ ] GraphQL API
- [ ] WebSockets (real-time updates)
- [ ] Export para Parquet, JSON
- [ ] Visualizações D3.js
- [ ] ML para análise de dados
- [ ] S3 storage integration
- [ ] Multi-tenancy
- [ ] Internacionalização (i18n)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

```
MIT License

Copyright (c) 2024 DataDock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👥 Autores

- **Seu Nome** - *Desenvolvimento inicial* - [GitHub](https://github.com/seu-usuario)

Veja também a lista de [contribuidores](https://github.com/seu-usuario/dataport/contributors).

---

## 🙏 Agradecimentos

- [Django](https://www.djangoproject.com/) - Framework web Python
- [Next.js](https://nextjs.org/) - Framework React
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados
- [Redis](https://redis.io/) - Cache e message broker
- Comunidade open source ❤️

---

## 📞 Suporte

- **Documentação**: [Wiki](https://github.com/seu-usuario/dataport/wiki)
- **Docker Guide**: [DOCKER.md](DOCKER.md) - Guia completo de Docker
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/dataport/issues)
- **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/dataport/discussions)

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela! ⭐**

**Desenvolvido com ❤️ para facilitar a gestão de dados**

[⬆ Voltar ao topo](#-datadock)

</div>
