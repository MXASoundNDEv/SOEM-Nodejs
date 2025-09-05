# Script PowerShell pour tester localement les étapes du CI
# Usage: .\test-ci.ps1

$ErrorActionPreference = "Stop"

Write-Host "🧪 Test CI Local - SOEM-Nodejs" -ForegroundColor Blue
Write-Host "================================" -ForegroundColor Blue

function Write-Step {
    param($Message)
    Write-Host "📋 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if npm is installed
try {
    $null = Get-Command npm -ErrorAction Stop
}
catch {
    Write-Error-Custom "npm n'est pas installé"
    exit 1
}

# Check Node.js version
$nodeVersion = (node --version) -replace 'v', '' -split '\.' | Select-Object -First 1
if ([int]$nodeVersion -lt 18) {
    Write-Error-Custom "Node.js version >= 18 requis. Version actuelle: $(node --version)"
    exit 1
}

Write-Success "Node.js version: $(node --version)"

# Step 1: Install dependencies
Write-Step "Installation des dépendances"
try {
    npm ci
    Write-Success "Dépendances installées"
}
catch {
    Write-Error-Custom "Échec de l'installation des dépendances"
    exit 1
}

# Step 2: TypeScript compilation check
Write-Step "Vérification de la compilation TypeScript"
try {
    npx tsc --noEmit
    Write-Success "Compilation TypeScript OK"
}
catch {
    Write-Error-Custom "Erreurs de compilation TypeScript"
    exit 1
}

# Step 3: Linting
Write-Step "Vérification du code (ESLint)"
try {
    npm run lint:check
    Write-Success "Lint OK"
}
catch {
    Write-Warning "Problèmes de lint détectés"
    Write-Host "Exécutez 'npm run lint' pour corriger automatiquement"
}

# Step 4: Security audit
Write-Step "Audit de sécurité"
try {
    npm audit --audit-level=moderate
    Write-Success "Audit de sécurité OK"
}
catch {
    Write-Warning "Vulnérabilités détectées - vérifiez npm audit"
}

# Step 5: Build TypeScript
Write-Step "Compilation TypeScript"
try {
    npx tsc
    Write-Success "Build TypeScript OK"
}
catch {
    Write-Error-Custom "Échec du build TypeScript"
    exit 1
}

# Step 6: Build native addon (if cmake-js is available)
Write-Step "Build de l'addon natif"
try {
    $null = Get-Command cmake -ErrorAction Stop
    npx cmake-js rebuild
    Write-Success "Build natif OK"
    
    # Check if .node file was created
    if (Test-Path "build\Release\soem_addon.node") {
        Write-Success "Fichier soem_addon.node créé"
    }
    else {
        Write-Warning "Fichier .node non trouvé"
    }
}
catch {
    Write-Warning "CMake non disponible ou échec du build natif"
}

# Step 7: Run tests
Write-Step "Exécution des tests"
try {
    npm run test:ci
    Write-Success "Tests OK"
}
catch {
    Write-Error-Custom "Échec des tests"
    exit 1
}

# Step 8: Test examples (if native addon is available)
if (Test-Path "build\Release\soem_addon.node") {
    Write-Step "Test des exemples"
    
    # Test basic functionality
    try {
        $testScript = @"
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
"@
        node -e $testScript
        Write-Success "Test de fumée OK"
    }
    catch {
        Write-Error-Custom "Échec du test de fumée"
        exit 1
    }
    
    # Test list interfaces example
    Write-Step "Test de l'exemple list-interfaces"
    try {
        $job = Start-Job -ScriptBlock { node examples/list-interfaces.js }
        $completed = Wait-Job $job -Timeout 10
        if ($completed) {
            Receive-Job $job
            Write-Success "Exemple list-interfaces OK"
        }
        else {
            Stop-Job $job
            Write-Warning "Exemple list-interfaces échoué (timeout)"
        }
        Remove-Job $job
    }
    catch {
        Write-Warning "Exemple list-interfaces échoué"
    }
}
else {
    Write-Warning "Addon natif non disponible - exemples ignorés"
}

# Final summary
Write-Host ""
Write-Host "================================" -ForegroundColor Blue
Write-Success "🎉 Tests CI locaux terminés avec succès!"
Write-Host ""
Write-Host "Prochaines étapes:"
Write-Host "  1. Commit et push des changements"
Write-Host "  2. Vérifier le CI GitHub Actions"
Write-Host "  3. Créer une release avec git tag vX.X.X"
Write-Host ""
