#!/bin/bash
set -e

echo "📦 Installing dependencies..."
npm install

echo "🔨 Compiling TypeScript..."
npx tsc

echo "🤖 Starting bot..."
node dist/index.js
