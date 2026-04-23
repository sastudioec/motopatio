#!/bin/bash
set -e
echo "🚀 Iniciando deploy de MotoPatío..."
cd /var/www/motopatio
git pull origin main
echo "📦 Instalando dependencias..."
npm install
echo "🗄️ Actualizando base de datos..."
npx prisma db push --accept-data-loss
npx prisma generate
echo "⏸️  Deteniendo servidor antes del build (evita ChunkLoadError por chunks huérfanos)..."
pm2 delete motopatio 2>/dev/null || true
echo "🔨 Construyendo el proyecto..."
npm run build
echo "♻️ Arrancando servidor con ecosystem.config.js..."
pm2 start /var/www/motopatio/ecosystem.config.js
pm2 save
echo "✅ MotoPatío está corriendo en motopatio.com"