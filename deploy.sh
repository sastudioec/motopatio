#!/bin/bash
echo "🚀 Iniciando deploy de MotoPatío..."
cd /var/www/motopatio
git pull origin main
echo "📦 Instalando dependencias..."
npm install
echo "🗄️ Actualizando base de datos..."
npx prisma db push --accept-data-loss
npx prisma generate
echo "🔨 Construyendo el proyecto..."
npm run build
echo "♻️ Reiniciando servidor..."
pm2 restart motopatio || pm2 start npm --name "motopatio" -- start
pm2 save
echo "✅ MotoPatío está corriendo en motopatio.com"