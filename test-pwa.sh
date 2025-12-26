#!/bin/bash

# Nail Art Match - PWA Test Script
# Tento skript automaticky zbuilduje projekt a spustí test server

echo "🧪 Nail Art Match - PWA Testing"
echo "================================"
echo ""

# Krok 1: Build
echo "📦 Krok 1/3: Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Krok 2: Kontrola súborov
echo "📋 Krok 2/3: Checking PWA files..."

FILES=("dist/manifest.json" "dist/sw.js" "dist/index.html")
ALL_OK=true

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - MISSING!"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = false ]; then
    echo ""
    echo "❌ Some PWA files are missing!"
    exit 1
fi

echo "✅ All PWA files present!"
echo ""

# Krok 3: Spustenie servera
echo "🚀 Krok 3/3: Starting test server..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PWA Test Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🌐 URL: http://localhost:3000"
echo ""
echo "  📖 Testovací návod: TEST_PWA.md"
echo ""
echo "  ⚡ Rýchle kroky:"
echo "     1. Otvor Chrome: http://localhost:3000"
echo "     2. Stlač F12 → Application → Service Workers"
echo "     3. Skontroluj 'activated and is running'"
echo "     4. Network → Offline checkbox ☑️"
echo "     5. Reload stránku (F5)"
echo "     6. Hra by mala fungovať offline! ✅"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Server beží... Stlač Ctrl+C pre zastavenie."
echo ""

# Kontrola či npx serve je dostupný
if command -v npx &> /dev/null; then
    npx serve dist -p 3000
elif command -v python3 &> /dev/null; then
    echo "ℹ️  Using Python HTTP server (npx not found)"
    cd dist && python3 -m http.server 3000
elif command -v php &> /dev/null; then
    echo "ℹ️  Using PHP server (npx not found)"
    cd dist && php -S localhost:3000
else
    echo "❌ No HTTP server found!"
    echo ""
    echo "Please install one of:"
    echo "  - Node.js (npx serve)"
    echo "  - Python 3 (python3 -m http.server)"
    echo "  - PHP (php -S)"
    exit 1
fi
