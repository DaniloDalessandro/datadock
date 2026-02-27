# DataDock

Sistema de gerenciamento e importação de dados com suporte a múltiplas fontes.

## Funcionalidades

- **Importação**: CSV, Excel, APIs externas
- **Busca**: Full-text, filtros avançados, datasets públicos/privados
- **Dashboard**: Estatísticas em tempo real
- **Alice AI**: Assistente com RAG (LangChain + Gemini)
- **Segurança**: JWT, rate limiting, permissões granulares

## Stack

- **Backend**: Django 5.2, PostgreSQL, Redis, Celery
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui
- **Infra**: Docker, Nginx

---

## Quick Start com Docker

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/dataport.git
cd dataport
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Postgres
POSTGRES_DB=dataport
POSTGRES_USER=dataport
POSTGRES_PASSWORD=sua-senha-segura

# Redis
REDIS_PASSWORD=sua-senha-redis
```

Crie o arquivo `backend/.env`:

```bash
# Django
DJANGO_SECRET_KEY=sua-chave-secreta-aqui
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# Frontend URL
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Email (opcional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=sua-app-password

# AI - Google Gemini (opcional, para Alice AI)
GEMINI_API_KEY=sua-chave-gemini
```

### 3. Suba os containers

```bash
docker-compose up -d
```

### 4. Crie o superusuário

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 5. Acesse

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Admin Django | http://localhost:8000/admin |
| Swagger | http://localhost:8000/api/docs/ |
| ReDoc | http://localhost:8000/api/redoc/ |

---

## Variáveis de Ambiente

### Raiz do projeto (`.env`)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `POSTGRES_DB` | Nome do banco de dados | `dataport` |
| `POSTGRES_USER` | Usuário do PostgreSQL | `dataport` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | `dataport123` |
| `REDIS_PASSWORD` | Senha do Redis | `redis123` |

#### Senha do Redis

A senha do Redis é configurada de formas diferentes dependendo do ambiente:

| Ambiente | Senha | Onde configurar |
|----------|-------|-----------------|
| **Produção** (`docker-compose.yml`) | Obrigatória | `.env` na raiz (`REDIS_PASSWORD`) |
| **Desenvolvimento** (`docker-compose.dev.yml`) | Não usa | Nenhuma configuração necessária |
| **Local** (sem Docker) | Opcional | `backend/.env` (`REDIS_URL`) |

**Produção:** O Redis é protegido com senha. Configure no `.env` da raiz:
```bash
REDIS_PASSWORD=sua-senha-segura
```

O `docker-compose.yml` usa essa variável para:
- Iniciar o Redis com `--requirepass`
- Conectar o backend via `redis://:senha@redis:6379/0`

**Desenvolvimento:** O `docker-compose.dev.yml` roda o Redis **sem senha** para simplificar.

**Local (sem Docker):** Se o Redis local não tem senha, use:
```bash
REDIS_URL=redis://localhost:6379/0
```

Se o Redis local tem senha:
```bash
REDIS_URL=redis://:sua-senha@localhost:6379/0
```

### Backend (`backend/.env`)

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `DJANGO_SECRET_KEY` | Chave secreta do Django | Sim |
| `DEBUG` | Modo debug (True/False) | Sim |
| `ALLOWED_HOSTS` | Hosts permitidos | Sim |
| `DATABASE_URL` | URL de conexão do banco | Não* |
| `REDIS_URL` | URL do Redis para cache | Não* |
| `CELERY_BROKER_URL` | URL do Redis para Celery | Não* |
| `FRONTEND_URL` | URL do frontend | Sim |
| `CORS_ALLOWED_ORIGINS` | Origens CORS permitidas | Sim |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Validade do access token | Não |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Validade do refresh token | Não |
| `EMAIL_HOST` | Servidor SMTP | Não |
| `EMAIL_PORT` | Porta SMTP | Não |
| `EMAIL_HOST_USER` | Usuário SMTP | Não |
| `EMAIL_HOST_PASSWORD` | Senha SMTP | Não |
| `GEMINI_API_KEY` | Chave da API Google Gemini | Não |

*Em Docker, essas variáveis são configuradas automaticamente pelo `docker-compose.yml`.

### Frontend (`frontend/.env.local`)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NEXT_PUBLIC_API_URL` | URL da API backend | `http://localhost:8000` |

---

## Docker

### Desenvolvimento vs Produção

| | Desenvolvimento | Produção |
|--|-----------------|----------|
| **Arquivo** | `docker-compose.dev.yml` | `docker-compose.yml` |
| **Backend** | `runserver` (hot reload) | `gunicorn` (4 workers) |
| **Celery** | `--reload` (auto restart) | workers otimizados |
| **Frontend** | `npm run dev` | build otimizado |
| **Redis** | sem senha | com senha |
| **Nginx** | não incluso | incluso |
| **DEBUG** | `True` | `False` |

### Modo Desenvolvimento

```bash
# Subir ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Parar
docker-compose -f docker-compose.dev.yml down
```

Não precisa configurar `.env` - usa valores padrão para desenvolvimento rápido.

### Modo Produção

```bash
# Subir ambiente de produção
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar
docker-compose down
```

Requer configuração do `.env` na raiz e `backend/.env`.

---

### Serviços

| Container | Imagem | Porta | Descrição |
|-----------|--------|-------|-----------|
| `dataport-postgres` | pgvector/pgvector:pg16 | 5432 | Banco de dados com suporte a vetores |
| `dataport-redis` | redis:7-alpine | 6379 | Cache e broker do Celery |
| `dataport-backend` | ./backend | 8000 | API Django + Gunicorn |
| `dataport-celery-worker` | ./backend | - | Worker para tarefas assíncronas |
| `dataport-celery-beat` | ./backend | - | Agendador de tarefas |
| `dataport-frontend` | ./frontend | 3000 | Next.js |
| `dataport-nginx` | nginx:alpine | 80, 443 | Proxy reverso |

### Comandos úteis

```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs de um serviço
docker-compose logs -f backend
docker-compose logs -f celery-worker

# Executar comandos Django
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py shell

# Acessar shell do container
docker-compose exec backend bash
docker-compose exec postgres psql -U dataport

# Reiniciar um serviço
docker-compose restart backend

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (APAGA DADOS!)
docker-compose down -v

# Rebuild após mudanças no Dockerfile
docker-compose up -d --build
```

### Backup e Restore

```bash
# Backup do banco
docker-compose exec postgres pg_dump -U dataport dataport > backup.sql

# Restore do banco
docker-compose exec -T postgres psql -U dataport dataport < backup.sql
```

### Health Checks

| Endpoint | Descrição |
|----------|-----------|
| `/health/` | Status básico |
| `/health/detailed/` | Status detalhado (DB, Redis, Celery) |

---

## Instalação Manual (sem Docker)

### Pré-requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (opcional, pode usar SQLite)
- Redis 7+ (opcional)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
# Editar .env com suas configurações
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

### Celery (opcional)

```bash
# Em um terminal separado
cd backend
celery -A core worker -l info

# Em outro terminal (para tarefas agendadas)
celery -A core beat -l info
```

---

## Testes

```bash
# Backend
docker-compose exec backend python manage.py test

# ou localmente
cd backend && python manage.py test

# Frontend
cd frontend && npm test
```


