# 🚀 Guide de Release et Publication NPM

Ce guide explique comment publier une nouvelle version de **SOEM-Nodejs** sur NPM.

## 📋 Prérequis

### 1. Permissions NPM
Vous devez avoir les permissions de publication sur le package `soem-node` :
```bash
npm adduser
npm whoami  # Vérifier que vous êtes connecté
```

### 2. Token NPM pour CI/CD
Dans les secrets GitHub, ajouter :
- `NPM_TOKEN` : Token d'authentification NPM

### 3. Environment de production
- Branche `main` propre
- Tous les tests passent
- Aucun changement non-committé

## 🎯 Méthodes de Release

### Méthode 1: Script automatique (Recommandé)

```bash
# Release patch (0.1.0 -> 0.1.1)
npm run release:patch

# Release minor (0.1.0 -> 0.2.0)  
npm run release:minor

# Release major (0.1.0 -> 1.0.0)
npm run release:major

# Version spécifique
npm run release 1.2.3
```

Le script va :
1. ✅ Vérifier la branche et l'état du repo
2. ✅ Exécuter tous les tests et vérifications
3. ✅ Mettre à jour la version dans `package.json`
4. ✅ Mettre à jour le `CHANGELOG.md`
5. ✅ Créer un commit de release
6. ✅ Créer un tag Git
7. ✅ Pousser vers GitHub (avec confirmation)

### Méthode 2: Manuel

```bash
# 1. Vérifications
npm run production-check

# 2. Mise à jour version
npm version patch  # ou minor/major

# 3. Push avec tags
git push origin main --tags
```

## 🤖 Workflow Automatique

Une fois le tag poussé, GitHub Actions va automatiquement :

### 1. **Tests Multi-plateforme** 
- ✅ Ubuntu Latest
- ✅ Windows Latest  

### 2. **Build Natif**
- ✅ Compilation des binaires natifs
- ✅ Test des addons compilés
- ✅ Validation cross-platform

### 3. **Publication NPM**
- ✅ Publication automatique sur NPM
- ✅ Création de la release GitHub
- ✅ Upload des artifacts

### 4. **Notification**
- ✅ Status de la publication
- ✅ Liens vers NPM et GitHub

## 📦 Vérification Post-Release

### Vérifier NPM
```bash
# Vérifier que le package est publié
npm view soem-node

# Tester l'installation
npm install soem-node@latest
```

### Vérifier GitHub
- ✅ Release créée avec les notes
- ✅ Tag visible dans l'historique
- ✅ Artifacts attachés

## 🔧 Configuration Workflow

### Variables d'environnement
Le workflow utilise ces secrets GitHub :
- `NPM_TOKEN` : Token d'authentification NPM
- `GITHUB_TOKEN` : Automatiquement fourni par GitHub

### Triggers
Le workflow se déclenche sur :
- **Tags** : `v*` (ex: v1.0.0)
- **Releases** : Création d'une release
- **Manuel** : Via workflow_dispatch

## 🐛 Dépannage

### Échec de publication NPM
```bash
# Vérifier l'authentification
npm whoami

# Vérifier les permissions
npm access list packages

# Re-publier manuellement si nécessaire
npm publish
```

### Échec des tests CI
```bash
# Reproduire localement
npm run test:ci

# Vérifier sur toutes les plateformes
# ou attendre les résultats CI
```

### Tag déjà existant
```bash
# Supprimer le tag local et distant
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Recréer avec la nouvelle version
git tag v1.0.0
git push origin v1.0.0
```

## 📈 Checklist de Release

- [ ] 🧪 Tous les tests passent (`npm test`)
- [ ] 🔍 Code review terminé
- [ ] 📚 Documentation mise à jour
- [ ] 🔄 CHANGELOG.md mis à jour
- [ ] 🚀 Version bump approprié
- [ ] 🏷️ Tag créé et poussé
- [ ] 📦 NPM publication réussie
- [ ] 🎉 Release GitHub créée
- [ ] ✅ Vérification post-release

## 🔗 Liens Utiles

- **NPM Package**: https://www.npmjs.com/package/soem-node
- **GitHub Releases**: https://github.com/MXASoundNDEv/SOEM-Nodejs/releases
- **GitHub Actions**: https://github.com/MXASoundNDEv/SOEM-Nodejs/actions
- **Documentation**: https://github.com/MXASoundNDEv/SOEM-Nodejs#readme

---

## 🎯 Exemple Complet

```bash
# 1. Préparer la release
git checkout main
git pull origin main
npm run production-check

# 2. Créer la release
npm run release:minor

# 3. Confirmer le push (dans le script)
# y

# 4. Suivre le progrès
# https://github.com/MXASoundNDEv/SOEM-Nodejs/actions

# 5. Vérifier NPM
npm view soem-node
```

🎉 **Votre release est prête !**
