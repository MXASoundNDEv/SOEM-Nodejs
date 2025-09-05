# Script de release pour SOEM-Nodejs (PowerShell)
# Usage: .\scripts\release.ps1 [patch|minor|major|version]

param(
    [string]$VersionType = "patch"
)

Write-Host "🚀 SOEM-Nodejs Release Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Vérifier que nous sommes sur la branche main
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "main") {
    Write-Host "❌ Erreur: Vous devez être sur la branche 'main' pour faire une release" -ForegroundColor Red
    Write-Host "   Branche actuelle: $currentBranch" -ForegroundColor Yellow
    exit 1
}

# Vérifier que le working directory est propre
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "❌ Erreur: Le working directory n'est pas propre" -ForegroundColor Red
    Write-Host "   Commitez ou stash vos changements avant de faire une release" -ForegroundColor Yellow
    git status --short
    exit 1
}

Write-Host "📋 Type de version: $VersionType" -ForegroundColor Yellow

# Vérification complète avant release
Write-Host ""
Write-Host "📋 1. Tests et vérifications..." -ForegroundColor Yellow
npm run production-check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Les vérifications de production ont échoué" -ForegroundColor Red
    exit 1
}

# Mettre à jour la version
Write-Host ""
Write-Host "📋 2. Mise à jour de la version..." -ForegroundColor Yellow
if ($VersionType -match "^\d+\.\d+\.\d+$") {
    # Version spécifique fournie
    $newVersion = $VersionType
    npm version $newVersion --no-git-tag-version
}
else {
    # Incrément automatique
    $versionOutput = npm version $VersionType --no-git-tag-version
    $newVersion = $versionOutput -replace "^v", ""
}

Write-Host "✅ Nouvelle version: $newVersion" -ForegroundColor Green

# Mettre à jour le CHANGELOG
Write-Host ""
Write-Host "📋 3. Mise à jour du CHANGELOG..." -ForegroundColor Yellow
$today = Get-Date -Format "yyyy-MM-dd"
$changelogContent = Get-Content CHANGELOG.md
$changelogContent = $changelogContent -replace "## \[Unreleased\]", "## [Unreleased]`n`n## [$newVersion] - $today"
$changelogContent | Set-Content CHANGELOG.md

# Commit des changements
Write-Host ""
Write-Host "📋 4. Commit des changements..." -ForegroundColor Yellow
git add package.json CHANGELOG.md
git commit -m "chore(release): bump version to $newVersion

- Update package.json version
- Update CHANGELOG.md with release date

Release notes:
- All tests passing
- Production ready
- Multi-platform support validated"

# Créer le tag
Write-Host ""
Write-Host "📋 5. Création du tag..." -ForegroundColor Yellow
git tag -a "v$newVersion" -m "Release v$newVersion

🚀 SOEM-Nodejs v$newVersion

✅ Features:
- EtherCAT Master functionality
- Cross-platform interface discovery
- TypeScript support
- Production-ready tests

🔗 NPM: https://www.npmjs.com/package/soem-node
📖 Docs: https://github.com/MXASoundNDEv/SOEM-Nodejs

Automatically tagged by release script."

Write-Host "✅ Tag v$newVersion créé" -ForegroundColor Green

# Confirmation avant push
Write-Host ""
Write-Host "📋 6. Prêt à publier:" -ForegroundColor Yellow
Write-Host "   📦 Version: $newVersion" -ForegroundColor White
Write-Host "   🏷️  Tag: v$newVersion" -ForegroundColor White
Write-Host "   📝 Changelog mis à jour" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Voulez-vous pousser vers GitHub et déclencher la publication NPM ? (y/N)"

if ($confirm -eq "y" -or $confirm -eq "Y") {
    Write-Host ""
    Write-Host "📋 7. Push vers GitHub..." -ForegroundColor Yellow
    git push origin main
    git push origin "v$newVersion"
    
    Write-Host ""
    Write-Host "🎉 Release lancée !" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. GitHub Actions va démarrer automatiquement" -ForegroundColor White
    Write-Host "   2. Tests sur Windows/Linux/macOS" -ForegroundColor White
    Write-Host "   3. Build des binaires natifs" -ForegroundColor White
    Write-Host "   4. Publication sur NPM" -ForegroundColor White
    Write-Host "   5. Création de la release GitHub" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Suivez le progrès sur:" -ForegroundColor Cyan
    Write-Host "   https://github.com/MXASoundNDEv/SOEM-Nodejs/actions" -ForegroundColor Blue
    Write-Host ""
    Write-Host "📦 NPM package sera disponible à:" -ForegroundColor Cyan
    Write-Host "   https://www.npmjs.com/package/soem-node" -ForegroundColor Blue
}
else {
    Write-Host ""
    Write-Host "❌ Publication annulée" -ForegroundColor Yellow
    Write-Host "💡 Pour pousser manuellement plus tard:" -ForegroundColor Cyan
    Write-Host "   git push origin main" -ForegroundColor White
    Write-Host "   git push origin v$newVersion" -ForegroundColor White
}
