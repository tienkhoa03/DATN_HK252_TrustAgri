FROM node:20-alpine AS builder
WORKDIR /workspace

COPY package*.json ./
COPY apps/monitoring-service/package*.json ./apps/monitoring-service/
COPY libs/shared/package*.json ./libs/shared/
RUN npm install --workspaces

COPY tsconfig.base.json ./
COPY libs/shared ./libs/shared
COPY apps/monitoring-service ./apps/monitoring-service

WORKDIR /workspace/apps/monitoring-service
RUN npm run build -w @trustagri/shared
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /workspace/apps/monitoring-service/dist ./dist
COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/libs/shared ./libs/shared

EXPOSE 3005
CMD ["node", "dist/main"]
