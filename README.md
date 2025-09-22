# SOEM-Nodejs

[![CI/CD](https://github.com/MXASoundNDEv/SOEM-Nodejs/actions/workflows/ci.yml/badge.svg)](https://github.com/MXASoundNDEv/SOEM-Nodejs/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/soem-node.svg)](https://badge.fury.io/js/soem-node)
[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey)](https://github.com/MXASoundNDEv/SOEM-Nodejs)
[![Coverage](https://img.shields.io/badge/coverage-38%25-yellow)](./coverage/index.html)

Bindings Node.js haute performance pour [SOEM (Simple Open EtherCAT Master)](https://github.com/OpenEtherCATsociety/SOEM) avec détection automatique des interfaces réseau et utilitaires de gestion avancés.

## 🚀 Fonctionnalités

- ✅ **Détection automatique d'interfaces** - Trouve automatiquement les meilleures interfaces EtherCAT
- ✅ **Support multi-plateforme** - Windows, Linux (x64, arm64)
- ✅ **TypeScript complet** - Types de sécurité avec auto-complétion
- ✅ **API moderne** - Interface intuitive et bien documentée
- ✅ **Utilitaires intégrés** - Outils de gestion et de diagnostic
- ✅ **Tests complets** - Suite de tests robuste avec couverture de code
- ✅ **Exemples pratiques** - Cas d'usage réels et tutoriels

## 📦 Installation

```bash
npm install soem-node
```

### Prérequis système

- **Node.js** >= 18
- **Compilateur C/C++** (MSVC Build Tools sous Windows, gcc ou clang sous Linux)
- **Python** (détecté par node-gyp)

> CMake n'est plus requis : la chaîne de build utilise uniquement `node-gyp` et `binding.gyp`.

#### Windows
- **Npcap** (recommandé) ou **WinPcap** (pour l'accès réseau)
  - Téléchargez depuis [npcap.com](https://npcap.com/#download)
  - Installation requise pour les opérations réseau
- **Visual Studio Build Tools** ou **Visual Studio**

#### Linux
- **libpcap-dev** (Ubuntu/Debian) ou **libpcap** (autres distributions)
- **Permissions réseau** pour les sockets bruts

### Configuration des permissions (Linux)

Pour éviter d'exécuter en tant que root :
```bash
sudo setcap cap_net_raw,cap_net_admin+eip $(which node)
```

## 🎯 Démarrage rapide

### 1. Découverte des interfaces

```javascript
const { SoemMaster } = require('soem-node');

// Lister toutes les interfaces disponibles
const interfaces = SoemMaster.listInterfaces();
console.log('Interfaces disponibles:', interfaces);
```

### 2. Création automatique de master

```javascript
const { EtherCATUtils } = require('soem-node/examples/ethercat-utils');

// Création automatique avec la meilleure interface
const master = EtherCATUtils.createMaster();
if (master) {
  try {
    const slaves = master.configInit();
    console.log(`${slaves} esclaves EtherCAT détectés`);
  } finally {
    master.close();
  }
}
```

### 3. Communication EtherCAT complète

```javascript
const { SoemMaster } = require('soem-node');

async function main() {
  const master = new SoemMaster('eth0'); // ou interface Windows
  
  if (!master.init()) {
    throw new Error('Échec d\'initialisation EtherCAT');
  }

  try {
    // Configuration
    const slaves = master.configInit();
    if (slaves > 0) {
      master.configMapPDO();
      
      // Communication cyclique
      for (let i = 0; i < 100; i++) {
        master.sendProcessdata();
        const wkc = master.receiveProcessdata();
        console.log(`Cycle ${i}: WKC=${wkc}`);
        
        await new Promise(r => setTimeout(r, 10)); // 10ms cycle
      }
      
      // Lecture SDO
      const deviceType = master.sdoRead(1, 0x1000, 0);
      if (deviceType) {
        console.log('Type de périphérique:', deviceType.readUInt32LE(0).toString(16));
      }
    }
  } finally {
    master.close();
  }
}

main().catch(console.error);
```

## Build manuel

La construction appelle `node-gyp` et génère automatiquement `ec_options.h` via l'action déclarée dans `binding.gyp` (script `scripts/generate-ec-options.js`).

```
npm run build
```

Le binaire natif est produit dans `build/Release/soem_addon.node`.

## Utilisation avec Electron

Basé sur **Node-API (N-API)** : la plupart des versions d'Electron compatibles avec le niveau N-API supporté fonctionnent sans rebuild. Si nécessaire (erreur de chargement/ABI) :

```bash
npm rebuild --runtime=electron --target=30.0.0 --dist-url=https://electronjs.org/headers
```

Pour `electron-builder` :
```jsonc
{
  "asarUnpack": [
    "node_modules/soem-node/build/Release/*.node"
  ]
}
```

Checklist rapide :
- Installer Npcap (Windows) ou libpcap (Linux)
- Vérifier l'architecture (x64 / arm64)
- Ajuster les capabilities Linux (voir plus haut)

Réf. : https://www.electronjs.org/docs/latest/tutorial/native-code-and-electron

## 🧪 Tests et Qualité

### Exécution des tests

```bash
# Tests de base
npm test

# Tests avec couverture
npm run test:ci

# Tests en mode watch
npm run test:watch

# Tous les tests (incluant ceux en développement)
npm run test:all

# Vérification du code
npm run lint

# Audit de sécurité
npm run security
```

### Couverture de code

Le projet maintient une couverture de code élevée avec des tests unitaires et d'intégration complets :

- ✅ Tests unitaires pour toutes les API principales
- ✅ Tests d'intégration pour les flux de travail complets  
- ✅ Mocks intelligents pour les environnements CI/CD
- ✅ Tests de performance et de stabilité

### CI/CD

Le projet utilise GitHub Actions pour :
- ✅ Tests automatisés sur Windows, Linux
- ✅ Vérification TypeScript et ESLint
- ✅ Audit de sécurité
- ✅ Build multi-plateforme
- ✅ Publication automatique NPM

## 🔧 Développement

### Setup de développement

```bash
# Cloner le repository
git clone https://github.com/MXASoundNDEv/SOEM-Nodejs.git
cd SOEM-Nodejs

# Installer les dépendances
npm install

# Build du projet
npm run build

# Lancer les tests
npm test
```

### Structure du projet

```
soem-node/
├── src/               # Code source TypeScript
├── examples/          # Exemples et utilitaires
├── test/              # Suite de tests
├── types/             # Définitions TypeScript
├── external/          # Sous-modules (SOEM)
├── docs/              # Documentation
└── scripts/           # Scripts utilitaires (génération options, release, CI)
```

## Exemple

```
node examples/scan-and-read.js eth0
```

Ce script détecte les esclaves, échange les `processdata` et lit l'SDO `0x1000` du slave 1.

## Dépannage

- Binaire introuvable : vérifier `build/Release/soem_addon.node` après `npm run build`.
- Erreurs compilation : vérifier Python + toolchain C/C++.
- Accès réseau refusé : Npcap/libpcap + permissions/capabilities.
- Rebuild forcé : `npm rebuild --verbose` (ajouter flags Electron si besoin).
- Debug approfondi : `node-gyp configure build --verbose`.

## Licence

Ce projet est distribué sous licence GPL-2.0-or-later. SOEM est GPLv2 avec exceptions ; la distribution de binaires précompilés peut imposer de publier votre code source. Une licence commerciale de SOEM est disponible pour des utilisations propriétaires.
