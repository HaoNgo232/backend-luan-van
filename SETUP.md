# 🚀 Setup Guide - E-Commerce Microservices

## 📋 Prerequisites

- **Node.js**: v20+ (recommended: v20.11.0)
- **pnpm**: v8+ (`npm install -g pnpm`)
- **Docker**: v24+ with Docker Compose
- **PostgreSQL Client**: For database access (optional)

## 🔧 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

**⚠️ IMPORTANT: Update these values in `.env`:**

```env
# Generate strong JWT secret (minimum 32 characters)
JWT_SECRET_KEY=your_super_secret_key_min_32_chars_here

# Update CORS if needed
CORS_ORIGIN=http://localhost:3001,http://localhost:4200

# Database URLs are pre-configured for Docker
```

### 3. Start Infrastructure

```bash
# Start NATS and all PostgreSQL databases
docker compose up -d

# Wait for databases to be ready (check logs)
docker compose logs -f
```

### 4. Run Database Migrations

```bash
# Generate Prisma clients
pnpm db:gen:all

# Run migrations for all services
pnpm db:migrate:all
```

### 5. Start All Services

```bash
# Development mode with hot reload
pnpm dev:all

# OR start individually
pnpm nest start --watch user-app
pnpm nest start --watch product-app
# ... etc
```

### 6. Verify Services

**Gateway**: http://localhost:3000
**NATS Monitor**: http://localhost:8222

Test endpoints:

```bash
# Create user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# With coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

### E2E Tests

```bash
# Full E2E test suite (starts test containers)
pnpm test:full

# OR run manually
pnpm test:compose:up
pnpm test:db:migrate
pnpm test:run
pnpm test:compose:down
```

## 📦 Database Management

### Reset All Databases

```bash
pnpm db:reset:all
```

### Access Databases

```bash
# User DB
psql -h localhost -p 5433 -U user -d user_db

# Product DB
psql -h localhost -p 5434 -U product -d product_db

# ... etc (see docker-compose.yml for ports)
```

### Prisma Studio (GUI)

```bash
# Open Prisma Studio for specific service
npx prisma studio --schema=apps/user-app/prisma/schema.prisma
```

## 🐛 Troubleshooting

### Port Conflicts

If ports are already in use:

```bash
# Stop all Docker containers
docker compose down -v

# Check what's using the port
lsof -i :5433  # or any port
```

### Database Connection Issues

```bash
# Verify databases are running
docker compose ps

# Check logs
docker compose logs user_db
docker compose logs product_db
```

### Prisma Client Errors

```bash
# Regenerate all Prisma clients
pnpm db:gen:all

# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

### NATS Connection Issues

```bash
# Check NATS is running
docker compose logs nats

# Restart NATS
docker compose restart nats
```

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP
┌──────▼──────────┐
│  Gateway :3000  │
└────────┬────────┘
         │ NATS
    ┌────┴────────────────────────┐
    │                             │
┌───▼────┐  ┌────────┐  ┌────────▼──┐
│ User   │  │Product │  │  Cart     │
│Service │  │Service │  │  Service  │
└───┬────┘  └───┬────┘  └────┬──────┘
    │           │            │
┌───▼───┐  ┌───▼────┐  ┌────▼──────┐
│User DB│  │Prod DB │  │  Cart DB  │
└───────┘  └────────┘  └───────────┘
```

## 📚 Next Steps

1. ✅ Setup complete → Start implementing business logic
2. 📖 Read `docs/ai/design/README.md` for architecture details
3. 🔨 Run `/new-requirement` command to add features
4. 🧪 Write tests with `/writing-test` command
5. 🔍 Review code with `/code-review` command

## 🆘 Need Help?

- Check `docs/ai/` for detailed documentation
- Run `.cursor/commands/` commands for guided workflows
- Review `docs/knowledge/TESTING.md` for testing guide
