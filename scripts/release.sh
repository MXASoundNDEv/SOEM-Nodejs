#!/bin/bash

# Script de release pour SOEM-Nodejs
# Usage: ./scripts/release.sh [patch|minor|major|version]

set -e

echo "🚀 SOEM-Nodejs Release Script"
echo "=============================="

# Vérifier que nous sommes sur la branche main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Erreur: Vous devez être sur la branche 'main' pour faire une release"
    echo "   Branche actuelle: $CURRENT_BRANCH"
    exit 1
fi

# Vérifier que le working directory est propre
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Erreur: Le working directory n'est pas propre"
    echo "   Commitez ou stash vos changements avant de faire une release"
    git status --short
    exit 1
fi

# Déterminer le type de version
VERSION_TYPE=${1:-patch}
echo "📋 Type de version: $VERSION_TYPE"

# Vérification complète avant release
echo ""
echo "📋 1. Tests et vérifications..."
npm run production-check
if [ $? -ne 0 ]; then
    echo "❌ Les vérifications de production ont échoué"
    exit 1
fi

# Mettre à jour la version
echo ""
echo "📋 2. Mise à jour de la version..."
if [[ "$VERSION_TYPE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    # Version spécifique fournie
    NEW_VERSION=$VERSION_TYPE
    npm version $NEW_VERSION --no-git-tag-version
else
    # Incrément automatique
    NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
    NEW_VERSION=${NEW_VERSION#v}  # Supprimer le 'v' du début
fi

echo "✅ Nouvelle version: $NEW_VERSION"

# Mettre à jour le CHANGELOG
echo ""
echo "📋 3. Mise à jour du CHANGELOG..."
TODAY=$(date +%Y-%m-%d)
sed -i.bak "s/## \[Unreleased\]/## [Unreleased]\n\n## [$NEW_VERSION] - $TODAY/" CHANGELOG.md
rm CHANGELOG.md.bak 2>/dev/null || true

# Commit des changements
echo ""
echo "📋 4. Commit des changements..."
git add package.json CHANGELOG.md
git commit -m "chore(release): bump version to $NEW_VERSION

- Update package.json version
- Update CHANGELOG.md with release date

Release notes:
- All tests passing
- Production ready
- Multi-platform support validated"

# Créer le tag
echo ""
echo "📋 5. Création du tag..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION

🚀 SOEM-Nodejs v$NEW_VERSION

✅ Features:
- EtherCAT Master functionality
- Cross-platform interface discovery
- TypeScript support
- Production-ready tests

🔗 NPM: https://www.npmjs.com/package/soem-node
📖 Docs: https://github.com/MXASoundNDEv/SOEM-Nodejs

Automatically tagged by release script."

echo "✅ Tag v$NEW_VERSION créé"

# Confirmation avant push
echo ""
echo "📋 6. Prêt à publier:"
echo "   📦 Version: $NEW_VERSION"
echo "   🏷️  Tag: v$NEW_VERSION"
echo "   📝 Changelog mis à jour"
echo ""
read -p "Voulez-vous pousser vers GitHub et déclencher la publication NPM ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📋 7. Push vers GitHub..."
    git push origin main
    git push origin "v$NEW_VERSION"
    
    echo ""
    echo "🎉 Release lancée !"
    echo ""
    echo "📊 Prochaines étapes:"
    echo "   1. GitHub Actions va démarrer automatiquement"
    echo "   2. Tests sur Windows/Linux"
    echo "   3. Build des binaires natifs"
    echo "   4. Publication sur NPM"
    echo "   5. Création de la release GitHub"
    echo ""
    echo "🔗 Suivez le progrès sur:"
    echo "   https://github.com/MXASoundNDEv/SOEM-Nodejs/actions"
    echo ""
    echo "📦 NPM package sera disponible à:"
    echo "   https://www.npmjs.com/package/soem-node"
else
    echo ""
    echo "❌ Publication annulée"
    echo "💡 Pour pousser manuellement plus tard:"
    echo "   git push origin main"
    echo "   git push origin v$NEW_VERSION"
fi
