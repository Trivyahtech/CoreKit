# CoreKit ECommerce — Deployment Guide

| Field            | Value                     |
| ---------------- | ------------------------- |
| **Project**      | CoreKit ECommerce         |
| **Version**      | 1.0.0                    |
| **Date**         | 2026-04-14                |

---

## 1. Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20+ LTS | Runtime |
| npm | 10+ | Package manager |
| Docker | 24+ | Containerization |
| Docker Compose | 2.x | Local services |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Cache / Queue |
| Git | 2.x | Version control |

---

## 2. Local Development Setup

### 2.1 Clone the Repository

```bash
git clone https://github.com/<org>/CoreKit.git
cd CoreKit/ECommerce
```

### 2.2 Start Infrastructure (PostgreSQL + Redis)

```bash
cd corekit-backend
docker-compose up -d
```

This starts:
- **PostgreSQL 16** on `localhost:5432` (user: `postgres`, password: `postgres`, db: `corekit`)
- **Redis 7** on `localhost:6379`

Verify:
```bash
docker-compose ps
```

### 2.3 Backend Setup

```bash
cd corekit-backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values (see section 3 below)

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma migrate deploy

# 5. Seed the database (optional)
npx prisma db seed

# 6. Start development server
npm run start:dev
```

Backend runs at: `http://localhost:3000`  
Swagger docs at: `http://localhost:3000/api/docs`

### 2.4 Frontend Setup

```bash
cd corekit-frontend

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Frontend runs at: `http://localhost:3001`

---

## 3. Environment Variables

### Backend (`corekit-backend/.env`)

```env
# App
NODE_ENV=development
PORT=3000
API_PREFIX=api
APP_NAME=Corekit API

# CORS
CORS_ORIGIN=http://localhost:3001

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/corekit?schema=public

# JWT
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRES_IN=7d

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Email (optional for dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

> **⚠️ Security:** Never commit `.env` files. Use secrets management in production.

---

## 4. Database Management

### Run Migrations

```bash
cd corekit-backend

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations to production
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

### Prisma Studio (Visual DB Browser)

```bash
npx prisma studio
```

Opens at `http://localhost:5555`

### Seed Database

```bash
npx prisma db seed
```

---

## 5. Production Build

### 5.1 Backend

```bash
cd corekit-backend

# Build
npm run build

# Start production
npm run start:prod
```

### 5.2 Frontend

```bash
cd corekit-frontend

# Build
npm run build

# Start production
npm run start
```

---

## 6. Docker Deployment

### 6.1 Build Backend Image

```bash
cd corekit-backend

docker build -t corekit-backend:latest .
```

### 6.2 Run Backend Container

```bash
docker run -d \
  --name corekit-backend \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/corekit?schema=public" \
  -e JWT_SECRET="your-production-secret" \
  -e REDIS_HOST="host.docker.internal" \
  -e REDIS_PORT=6379 \
  -e NODE_ENV=production \
  corekit-backend:latest
```

### 6.3 Full Stack with Docker Compose (Production)

Create `docker-compose.prod.yml`:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: corekit
    volumes:
      - corekit_postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - corekit_redis_data:/data

  backend:
    build:
      context: ./corekit-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/corekit?schema=public
      JWT_SECRET: ${JWT_SECRET}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      NODE_ENV: production

volumes:
  corekit_postgres_data:
  corekit_redis_data:
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 7. Cloud Deployment Options

### 7.1 AWS

| Service | Component |
|---------|-----------|
| EC2 / ECS | Backend container |
| RDS | PostgreSQL 16 |
| ElastiCache | Redis 7 |
| S3 + CloudFront | Static assets / images |
| Route 53 | DNS |
| ACM | SSL certificates |

### 7.2 Vercel (Frontend)

```bash
cd corekit-frontend
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1`

### 7.3 Railway / Render

Both support NestJS + PostgreSQL + Redis with one-click deploys from GitHub.

---

## 8. Reverse Proxy (Nginx)

Example `nginx.conf`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 9. Health Checks

| Check | Endpoint | Expected |
|-------|----------|----------|
| Backend API | `GET /api/v1/health` | `{ "status": "ok" }` |
| PostgreSQL | `pg_isready -h localhost -p 5432` | Exit code 0 |
| Redis | `redis-cli ping` | `PONG` |

---

## 10. Common Commands Reference

```bash
# Backend
npm run start:dev          # Dev mode with watch
npm run start:prod         # Production mode
npm run build              # Build for production
npm run lint               # Lint code
npm run test               # Unit tests
npm run test:e2e           # End-to-end tests
npm run test:cov           # Test coverage

# Database
npx prisma migrate dev     # Create + apply migration
npx prisma migrate deploy  # Apply pending migrations
npx prisma db seed         # Seed database
npx prisma studio          # Visual DB browser
npx prisma generate        # Regenerate client

# Docker
docker-compose up -d       # Start services
docker-compose down        # Stop services
docker-compose logs -f     # Stream logs

# Frontend
npm run dev                # Dev server
npm run build              # Production build
npm run start              # Start production server
npm run lint               # Lint code
```

---

## 11. Troubleshooting

| Problem | Solution |
|---------|----------|
| Database connection refused | Verify Docker is running: `docker-compose ps` |
| Prisma client not found | Run `npx prisma generate` |
| Port 3000 already in use | Kill process: `lsof -ti:3000 \| xargs kill` |
| Redis connection error | Check Redis container: `docker logs corekit-redis` |
| CORS errors | Verify `CORS_ORIGIN` in `.env` matches frontend URL |
| Migration errors | Try `npx prisma migrate reset` (dev only) |
