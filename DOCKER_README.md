# Docker Setup for Collage Project

This project includes Docker configurations for easy deployment and development.

## Files Created

### Dockerfiles
- `BACKEND/Dockerfile` - Backend Go service
- `frontend/Dockerfile` - Frontend Next.js service  
- `Dockerfile` - Root combined build (optional)

### Docker Compose Files
- `docker-compose.yml` - Full production setup
- `docker-compose.dev.yml` - Development databases only

### Configuration Files
- `BACKEND/.dockerignore` - Backend ignore rules
- `frontend/.dockerignore` - Frontend ignore rules

## Usage

### Full Production Setup
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:9090
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Development Setup (Databases Only)
```bash
# Start only PostgreSQL and Redis for local development
docker-compose -f docker-compose.dev.yml up -d

# Then run frontend and backend locally:
cd frontend && npm run dev
cd BACKEND && go run main.go
```

### Individual Services
```bash
# Build and run backend only
docker-compose up --build backend

# Build and run frontend only  
docker-compose up --build frontend
```

## Environment Variables

The backend uses these environment variables (configured in docker-compose.yml):
- `DBSOURCE` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `APIADDR` - API server address
- `SECRET_KEY` - JWT secret key

## Database Migration

After starting PostgreSQL, you may need to run database migrations:
```bash
# Connect to backend container
docker exec -it collage_backend sh

# Run migrations (if you have migration commands)
# ./migrate -path db/migrations -database "postgresql://root:password@postgres:5432/collage-project-backend?sslmode=disable" up
```

## Stopping Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Troubleshooting

1. **Port conflicts**: Change ports in docker-compose.yml if needed
2. **Build issues**: Run `docker-compose build --no-cache` to rebuild from scratch
3. **Database connection**: Ensure PostgreSQL is fully started before backend connects
4. **Logs**: View logs with `docker-compose logs [service-name]`