FROM node:20-alpine AS builder
WORKDIR /workspace

COPY package*.json ./
COPY apps/farm-service/package*.json ./apps/farm-service/
COPY libs/shared/package*.json ./libs/shared/
RUN npm install --workspaces

COPY tsconfig.base.json ./
COPY libs/shared ./libs/shared
COPY apps/farm-service ./apps/farm-service

WORKDIR /workspace/apps/farm-service
RUN npm run build -w @trustagri/shared
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /workspace/apps/farm-service/dist ./dist
COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/libs/shared ./libs/shared

EXPOSE 3003
CMD ["node", "dist/main"]
