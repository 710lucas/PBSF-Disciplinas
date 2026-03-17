#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          VERIFICAÇÃO DO VISUALIZADOR                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de erros
ERRORS=0

# Verificar Node.js
echo -n "✓ Verificando Node.js... "
if command -v node &> /dev/null; then
    VERSION=$(node -v)
    echo -e "${GREEN}OK${NC} ($VERSION)"
else
    echo -e "${RED}FALHOU${NC}"
    echo "  → Instale Node.js: https://nodejs.org/"
    ERRORS=$((ERRORS + 1))
fi

# Verificar NPM
echo -n "✓ Verificando NPM... "
if command -v npm &> /dev/null; then
    VERSION=$(npm -v)
    echo -e "${GREEN}OK${NC} ($VERSION)"
else
    echo -e "${RED}FALHOU${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar package.json
echo -n "✓ Verificando package.json... "
if [ -f "package.json" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}NÃO ENCONTRADO${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar node_modules
echo -n "✓ Verificando dependências... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}NÃO INSTALADAS${NC}"
    echo "  → Execute: npm install"
    ERRORS=$((ERRORS + 1))
fi

# Verificar server.js
echo -n "✓ Verificando server.js... "
if [ -f "server.js" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}NÃO ENCONTRADO${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar diretório dados
echo -n "✓ Verificando diretório dados/... "
if [ -d "dados" ]; then
    COUNT=$(ls dados/*.json 2>/dev/null | wc -l)
    echo -e "${GREEN}OK${NC} ($COUNT arquivos JSON)"
else
    echo -e "${RED}NÃO ENCONTRADO${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar arquivos das instituições
echo ""
echo "📊 Instituições disponíveis:"
for INST in UFPB UFCG IFPB UEPB; do
    echo -n "  • $INST... "
    if [ -f "dados/$INST.json" ]; then
        SIZE=$(du -h "dados/$INST.json" | cut -f1)
        echo -e "${GREEN}✓${NC} ($SIZE)"
    else
        echo -e "${RED}✗${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# Verificar diretório public
echo ""
echo -n "✓ Verificando public/... "
if [ -d "public" ]; then
    COUNT=$(ls public/*.html 2>/dev/null | wc -l)
    echo -e "${GREEN}OK${NC} ($COUNT páginas HTML)"
else
    echo -e "${RED}NÃO ENCONTRADO${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Resumo final
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ TUDO OK!${NC} O visualizador está pronto para uso."
    echo ""
    echo "Para iniciar:"
    echo "  1. npm install   (se ainda não instalou)"
    echo "  2. npm start"
    echo "  3. Abra http://localhost:3000"
else
    echo -e "${RED}✗ $ERRORS problema(s) encontrado(s)${NC}"
    echo ""
    echo "Corrija os problemas acima antes de continuar."
fi
echo "═══════════════════════════════════════════════════════════════"
