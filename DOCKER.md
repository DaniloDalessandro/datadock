# 🐳 Docker - DataDock

Guia completo para execução do DataDock usando Docker.

## 📋 Pré-requisitos

- Docker Desktop ou Docker Engine (>= 20.10)
- Docker Compose (>= 2.0)
- 4GB+ de RAM disponível
- 10GB+ de espaço em disco

## 🚀 Início Rápido

### Desenvolvimento

```bash
# Iniciar todos os serviços em modo desenvolvimento
docker-compose -f docker-compose.dev.yml up

# Ou em background
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Parar serviços
docker-compose -f docker-compose.dev.yml down
```

Acesse:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin

### Produção

```bash
# Iniciar todos os serviços em modo produção
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

Acesse:
- **Aplicação**: http://localhost (via Nginx)
- **API Direta**: http://localhost:8000

## 🏗️ Arquitetura dos Containers

```
┌─────────────────────────────────────────────┐
│              Nginx (Port 80)                │
│         Proxy Reverso / Load Balancer       │
└────────────┬──────────────┬─────────────────┘
             │              │
    ┌────────▼──────┐  ┌───▼──────────┐
    │   Frontend    │  │   Backend    │
    │   Next.js     │  │   Django     │
    │   Port 3000   │  │   Port 8000  │
    └───────────────┘  └──────┬───────┘
                              │
         ┌────────────────────┼────────────────┐
         │                    │                │
    ┌────▼─────┐      ┌──────▼────┐   ┌──────▼──────┐
    │PostgreSQL│      │   Redis   │   │   Celery    │
    │Port 5432 │      │ Port 6379 │   │   Workers   │
    └──────────┘      └───────────┘   └─────────────┘
```

## 📦 Serviços Disponíveis

### Backend Django
- **Container**: `dataport-backend`
- **Porta**: 8000
- **Health Check**: http://localhost:8000/health/

### Frontend Next.js
- **Container**: `dataport-frontend`
- **Porta**: 3000
- **Health Check**: http://localhost:3000/

### PostgreSQL
- **Container**: `dataport-postgres`
- **Porta**: 5432
- **Database**: dataport (produção) / dataport_dev (desenvolvimento)
- **User**: dataport
- **Password**: dataport123 (alterar em produção!)

### Redis
- **Container**: `dataport-redis`
- **Porta**: 6379
- **Password**: redis123 (alterar em produção!)

### Celery Worker
- **Container**: `dataport-celery-worker`
- Processa tarefas assíncronas

### Celery Beat
- **Container**: `dataport-celery-beat`
- Agenda tarefas periódicas

### Nginx
- **Container**: `dataport-nginx`
- **Portas**: 80 (HTTP), 443 (HTTPS)

## 🔧 Comandos Úteis

### Gerenciamento Geral

```bash
# Ver status de todos os containers
docker-compose ps

# Reiniciar um serviço específico
docker-compose restart backend

# Reconstruir imagens
docker-compose build

# Reconstruir sem cache
docker-compose build --no-cache

# Remover tudo (containers, volumes, networks)
docker-compose down -v
```

### Backend Django

```bash
# Executar migrations
docker-compose exec backend python manage.py migrate

# Criar superusuário
docker-compose exec backend python manage.py createsuperuser

# Coletar arquivos estáticos
docker-compose exec backend python manage.py collectstatic --noinput

# Shell Django
docker-compose exec backend python manage.py shell

# Acessar bash no container
docker-compose exec backend bash
```

### Frontend Next.js

```bash
# Acessar bash no container
docker-compose exec frontend sh

# Ver logs em tempo real
docker-compose logs -f frontend

# Reinstalar dependências
docker-compose exec frontend npm install
```

### PostgreSQL

```bash
# Acessar psql
docker-compose exec postgres psql -U dataport -d dataport

# Backup do banco de dados
docker-compose exec postgres pg_dump -U dataport dataport > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U dataport dataport < backup.sql
```

### Redis

```bash
# Acessar Redis CLI
docker-compose exec redis redis-cli -a redis123

# Limpar cache
docker-compose exec redis redis-cli -a redis123 FLUSHALL
```

## 🔍 Logs e Debugging

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Ver últimas 100 linhas
docker-compose logs --tail=100 backend

# Logs do Nginx
docker-compose exec nginx tail -f /var/log/nginx/access.log
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

## 🌍 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# PostgreSQL
POSTGRES_DB=dataport
POSTGRES_USER=dataport
POSTGRES_PASSWORD=SENHA_SEGURA_AQUI

# Redis
REDIS_PASSWORD=SENHA_REDIS_AQUI

# Django
DJANGO_SECRET_KEY=sua-chave-secreta-aqui
DEBUG=False
ALLOWED_HOSTS=seu-dominio.com,localhost

# Frontend
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com
```

## 📊 Health Checks

O sistema possui múltiplos endpoints de health check:

```bash
# Health check básico (database)
curl http://localhost:8000/health/

# Health check detalhado (todos os componentes)
curl http://localhost:8000/health/detailed/

# Readiness probe (pronto para receber tráfego)
curl http://localhost:8000/health/ready/

# Liveness probe (aplicação está viva)
curl http://localhost:8000/health/live/
```

## 🔐 Segurança

### Produção Checklist

- [ ] Alterar senhas padrão (PostgreSQL, Redis)
- [ ] Configurar DJANGO_SECRET_KEY única
- [ ] Definir ALLOWED_HOSTS corretamente
- [ ] Configurar CORS_ALLOWED_ORIGINS
- [ ] Ativar HTTPS no Nginx
- [ ] Configurar firewall
- [ ] Implementar backup automático
- [ ] Monitorar logs de segurança

## 🚨 Troubleshooting

### Container não inicia

```bash
# Ver logs de erro
docker-compose logs backend

# Verificar se a porta já está em uso
netstat -an | grep 8000

# Remover e recriar container
docker-compose down
docker-compose up -d
```

### Erro de conexão com banco de dados

```bash
# Verificar se PostgreSQL está saudável
docker-compose ps postgres

# Ver logs do PostgreSQL
docker-compose logs postgres

# Recriar banco de dados
docker-compose down -v
docker-compose up -d
```

### Build falha

```bash
# Limpar cache do Docker
docker system prune -a

# Reconstruir sem cache
docker-compose build --no-cache
```

## 📈 Performance

### Otimizações Recomendadas

1. **Volumes**: Use named volumes para melhor performance
2. **Build Multi-stage**: Dockerfiles já otimizados com multi-stage
3. **Cache**: Redis configurado com persistência
4. **Workers**: Ajuste número de workers Gunicorn baseado em CPU
5. **Memory**: Alocar pelo menos 4GB de RAM

### Ajustar Workers

Edite `docker-compose.yml`:

```yaml
command: gunicorn --bind 0.0.0.0:8000 --workers 8 --timeout 120 core.wsgi:application
```

Recomendação: `workers = (2 x CPU cores) + 1`

## 🔄 Atualizações

```bash
# Atualizar código e reconstruir
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d

# Executar migrations
docker-compose exec backend python manage.py migrate
```

## 📚 Documentação Adicional

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Django Deployment](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)

## 💡 Dicas

1. Use `docker-compose.dev.yml` para desenvolvimento (hot reload)
2. Use `docker-compose.yml` para produção (otimizado)
3. Sempre faça backup antes de atualizações
4. Monitore uso de disco dos volumes
5. Configure logs rotation para evitar disco cheio

---

**Desenvolvido para o projeto DataDock** 🚀
