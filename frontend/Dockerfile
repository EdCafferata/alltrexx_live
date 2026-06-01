# ── Stap 1: Build React app ───────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --silent
COPY src ./src
COPY public ./public
# Backend URL voor productie — pas aan naar jouw NAS IP of domein
ENV REACT_APP_API_URL=http://localhost:8080
RUN npm run build

# ── Stap 2: Serveer via nginx ─────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
