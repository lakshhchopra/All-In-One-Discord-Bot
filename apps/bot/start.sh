#!/bin/bash
set -e

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Generating Prisma Client & Syncing DB Schema..."
npx prisma generate
npx prisma db push --accept-data-loss

echo "🔨 Compiling TypeScript..."
npx tsc

echo "🤖 Starting bot..."
node dist/index.js

