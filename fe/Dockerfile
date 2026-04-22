# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .

ARG VITE_API_BASE_URL=http://localhost:3006/api/v1
ARG VITE_USE_MOCK=false
ARG VITE_DEV_LOGIN_SECRET=
ARG VITE_DEV_LOGIN_ZALO_ID=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_USE_MOCK=$VITE_USE_MOCK \
    VITE_DEV_LOGIN_SECRET=$VITE_DEV_LOGIN_SECRET \
    VITE_DEV_LOGIN_ZALO_ID=$VITE_DEV_LOGIN_ZALO_ID

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

COPY --from=builder /app/www /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
