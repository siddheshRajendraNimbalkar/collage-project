#!/bin/bash

echo "🚀 Setting up Docker Redis for your project..."

# Start Redis container
echo "📦 Starting Redis container..."
docker-compose up -d redis

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
sleep 5

# Check if Redis is running
if docker-compose ps redis | grep -q "Up"; then
    echo "✅ Redis is running successfully!"
    echo "🔗 Redis is available at: redis://localhost:6379"
    echo ""
    echo "📋 Next steps:"
    echo "1. Install new Redis dependency: npm install"
    echo "2. Your autocomplete data needs to be migrated to the new Redis instance"
    echo "3. Start your Next.js app: npm run dev"
    echo ""
    echo "🔧 Redis Management:"
    echo "- Connect to Redis CLI: docker exec -it collage-project-redis redis-cli"
    echo "- View logs: docker-compose logs redis"
    echo "- Stop Redis: docker-compose down"
else
    echo "❌ Failed to start Redis. Please check Docker installation."
    exit 1
fi