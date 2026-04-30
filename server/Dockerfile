# ---- 构建阶段 ----
FROM node:20-alpine AS builder

# 安装 OpenSSL（Prisma 引擎依赖）
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# ---- 运行阶段 ----
FROM node:20-alpine

# 安装 git（版本控制）和 OpenSSL（Prisma 依赖）
RUN apk add --no-cache git openssl libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# 创建 uploads 目录
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx nest start"]
