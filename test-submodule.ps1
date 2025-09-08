#!/usr/bin/env pwsh
# Script pour tester l'initialisation du sous-module SOEM

Write-Host "=== Test d'initialisation du sous-module SOEM ==="

# Test 1: Vérifier l'état actuel
Write-Host "`n1. État actuel du sous-module:"
git submodule status

Write-Host "`n2. Contenu du répertoire external:"
Get-ChildItem -Path "external" -ErrorAction SilentlyContinue

Write-Host "`n3. Vérification des fichiers critiques:"
$files = @(
    "external/soem/CMakeLists.txt",
    "external/soem/cmake/Darwin.cmake",
    "external/soem/cmake/Linux.cmake",
    "external/soem/cmake/Windows.cmake"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file existe"
    }
    else {
        Write-Host "✗ $file manquant" -ForegroundColor Red
    }
}

# Test 2: Simuler la ré-initialisation
Write-Host "`n4. Test de ré-initialisation (simulation):"
Write-Host "git submodule deinit -f external/soem"
Write-Host "git submodule update --init --recursive --force"

Write-Host "`n5. Structure du répertoire cmake:"
Get-ChildItem -Path "external/soem/cmake" -ErrorAction SilentlyContinue

Write-Host "`n=== Fin du test ==="
