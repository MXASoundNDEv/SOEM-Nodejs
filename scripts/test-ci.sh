#!/bin/bash

# Script pour tester localement les étapes du CI
# Usage: ./test-ci.sh

set -e

echo "🧪 Test CI Local - SOEM-Nodejs"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
fi

# Check if Node.js version is sufficient
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version >= 18 requis. Version actuelle: $(node --version)"
    exit 1
fi

print_success "Node.js version: $(node --version)"

# Step 1: Install dependencies
print_step "Installation des dépendances"
if npm ci; then
    print_success "Dépendances installées"
else
    print_error "Échec de l'installation des dépendances"
    exit 1
fi

# Step 2: TypeScript compilation check
print_step "Vérification de la compilation TypeScript"
if npx tsc --noEmit; then
    print_success "Compilation TypeScript OK"
else
    print_error "Erreurs de compilation TypeScript"
    exit 1
fi

# Step 3: Linting
print_step "Vérification du code (ESLint)"
if npm run lint:check; then
    print_success "Lint OK"
else
    print_warning "Problèmes de lint détectés"
    echo "Exécutez 'npm run lint' pour corriger automatiquement"
fi

# Step 4: Security audit
print_step "Audit de sécurité"
if npm audit --audit-level=moderate; then
    print_success "Audit de sécurité OK"
else
    print_warning "Vulnérabilités détectées - vérifiez npm audit"
fi

# Step 5: Build TypeScript
print_step "Compilation TypeScript"
if npx tsc; then
    print_success "Build TypeScript OK"
else
    print_error "Échec du build TypeScript"
    exit 1
fi

# Step 6: Build native addon avec node-gyp
print_step "Build de l'addon natif"
if npx node-gyp configure build; then
    print_success "Build natif OK"

    # Check if .node file was created
    if [ -f "build/Release/soem_addon.node" ]; then
        print_success "Fichier soem_addon.node créé"
    else
        print_warning "Fichier .node non trouvé"
    fi
else
    print_warning "Échec du build natif (assurez-vous que node-gyp et une toolchain sont installés)"
fi

# Step 7: Run tests
print_step "Exécution des tests"
if npm run test:ci; then
    print_success "Tests OK"
else
    print_error "Échec des tests"
    exit 1
fi

# Step 8: Test examples (if native addon is available)
if [ -f "build/Release/soem_addon.node" ]; then
    print_step "Test des exemples"
    
    # Test basic functionality
    if node -e "
        try {
            const { SoemMaster } = require('./dist');
            console.log('✓ Module chargé');
            const interfaces = SoemMaster.listInterfaces();
            console.log('✓ listInterfaces fonctionne, trouvé:', interfaces.length, 'interfaces');
            const master = new SoemMaster('test');
            console.log('✓ Instanciation master OK');
            master.close();
            console.log('✓ Test de fumée réussi');
        } catch(e) {
            console.error('✗ Test de fumée échoué:', e.message);
            process.exit(1);
        }
    "; then
        print_success "Test de fumée OK"
    else
        print_error "Échec du test de fumée"
        exit 1
    fi
    
    # Test list interfaces example
    print_step "Test de l'exemple list-interfaces"
    if timeout 10s node examples/list-interfaces.js; then
        print_success "Exemple list-interfaces OK"
    else
        print_warning "Exemple list-interfaces échoué (timeout ou erreur)"
    fi
else
    print_warning "Addon natif non disponible - exemples ignorés"
fi

# Final summary
echo ""
echo "================================"
print_success "🎉 Tests CI locaux terminés avec succès!"
echo ""
echo "Prochaines étapes:"
echo "  1. Commit et push des changements"
echo "  2. Vérifier le CI GitHub Actions"
echo "  3. Créer une release avec git tag vX.X.X"
echo ""
