# Multi-stage build for the entire project
FROM node:18 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.23.5 AS backend-builder
WORKDIR /app/backend
COPY BACKEND/go.mod BACKEND/go.sum ./
RUN go mod download
COPY BACKEND/ ./
RUN go build -o main .

# Final stage - nginx to serve frontend and proxy to backend
FROM nginx:latest
COPY --from=frontend-builder /app/frontend/.next/standalone /usr/share/nginx/html/frontend
COPY --from=frontend-builder /app/frontend/.next/static /usr/share/nginx/html/frontend/.next/static
COPY --from=backend-builder /app/backend/main /usr/local/bin/backend
COPY --from=backend-builder /app/backend/app.env /usr/local/bin/

# Create nginx config
RUN echo 'server { \
    listen 80; \
    location / { \
        proxy_pass http://localhost:3000; \
    } \
    location /api/ { \
        proxy_pass http://localhost:9090/; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start both services
CMD ["sh", "-c", "backend & nginx -g 'daemon off;'"]