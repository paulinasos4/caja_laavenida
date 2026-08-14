#!/usr/bin/env bash
# Ayuda para conectar la base de datos en LOCAL.
# Uso:
#   1. Conseguí tu connection string de Neon (https://neon.tech → tu proyecto → Connection Details)
#   2. Ejecutá:  bash setup-db.sh "postgresql://usuario:pass@ep-xxxx.neon.tech/neondb?sslmode=require"
#   3. Después:   npm run dev

set -euo pipefail

URL="${1:-}"

if [ -z "$URL" ]; then
  echo "❌ Falta la connection string."
  echo ""
  echo "Uso:"
  echo '  bash setup-db.sh "postgresql://usuario:pass@ep-xxxx.neon.tech/neondb?sslmode=require"'
  echo ""
  echo "La conseguís en: https://neon.tech → tu proyecto → Connection Details"
  exit 1
fi

# Chequeo básico de que parece una URL de postgres
case "$URL" in
  postgresql://*|postgres://*) ;;
  *)
    echo "⚠️  Eso no parece una connection string de Postgres (debería empezar con postgresql://)"
    echo "    Lo que pasaste: $URL"
    exit 1
    ;;
esac

# Escribir .env.local (con comillas para evitar problemas con caracteres especiales del password)
printf 'POSTGRES_URL="%s"\n' "$URL" > .env.local

echo "✅ .env.local creado con POSTGRES_URL."
echo ""
echo "Verificando que .env.local está ignorado por git..."
if git check-ignore -q .env.local; then
  echo "✅ .env.local está en .gitignore — tu contraseña NO se va a subir a git."
else
  echo "⚠️  ATENCIÓN: .env.local NO parece estar ignorado por git. Revisá el .gitignore antes de commitear."
fi

echo ""
echo "Siguiente paso:"
echo "  1. Creá la tabla en Neon (SQL Editor) con el contenido de db/schema.sql"
echo "  2. npm run dev"
echo "  3. Abrí http://localhost:3000"
