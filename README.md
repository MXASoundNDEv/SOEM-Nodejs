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

## 📘 API détaillée (SoemMaster)

Cette section résume et intègre la documentation de `docs/API-SoemMaster.md` directement dans le README. Pour des détails supplémentaires (contexte EtherCAT, glossaire), voir le dossier `docs/`.

### Table des matières

1. Vue d'ensemble
2. Import & types
3. Cycle de vie minimal
4. Tableau récapitulatif
5. Référence par catégorie
   - Initialisation & découverte
   - Process Data (PDO / Groupes)
   - Accès objets (SDO / SoE / EEPROM)
   - Gestion d'état & récupération
   - Distributed Clocks & Sync
   - Accès bas-niveau (APRD/APWR/LRW/LRD/LWR)
   - Utilitaires & diagnostics
6. Exemples avancés
7. Erreurs & diagnostics
8. Bonnes pratiques performance
9. FAQ courte

---

### 1. Vue d'ensemble

`SoemMaster` est un wrapper TypeScript au-dessus du binding natif SOEM. Il fournit:
- Découverte et configuration des esclaves
- Mapping PDO et échanges cycliques
- Lecture/écriture SDO, SoE, EEPROM
- Primitives bas-niveau (APRD, etc.)
- Gestion de Distributed Clocks (DC)
- Fonctions de récupération et reconfiguration d'esclaves

Les méthodes reflètent les primitives SOEM. Les validations avancées sont faites côté natif. Vérifiez systématiquement les retours.

### 2. Import & types

CommonJS:
```js
const { SoemMaster } = require('soem-node');
```
ESM / TypeScript:
```ts
import { SoemMaster } from 'soem-node';
```

Type principal supplémentaire:
```ts
interface NetworkInterface { name: string; description: string }
```

### 3. Cycle de vie minimal

```
new SoemMaster(ifname) -> init() -> configInit() -> (slaves > 0 ?) -> configMapPDO() -> [boucle]
  sendProcessdata(); receiveProcessdata(); (SDO/SoE accès ponctuels) -> close()
```

### 4. Tableau récapitulatif

| Méthode | Retour | Catégorie | Notes |
|---------|--------|-----------|-------|
| constructor(ifname?) | instance | Init | Interface réseau par défaut `eth0` (adapter sous Windows) |
| init() | boolean | Init | Ouvre l'interface |
| configInit() | number | Découverte | Nombre d'esclaves |
| configMapPDO() | void | PDO | Map processdata |
| state() | number | État | Lecture cache |
| readState() | number | État | Force rafraîchissement |
| sdoRead(slave,i,sub,ca?) | Buffer\|null | SDO | Complete Access optionnel |
| sdoWrite(slave,i,sub,data,ca?) | boolean | SDO | Complete Access optionnel |
| sendProcessdata() | number | PDO | Envoi cycle |
| receiveProcessdata() | number | PDO | WKC / octets |
| writeState(slave,state) | number | État | Workcounter/code |
| stateCheck(slave,req,timeout?) | number | État | Bloque jusqu'état |
| reconfigSlave(slave,timeout?) | number | Récupération | Reconfigure |
| recoverSlave(slave,timeout?) | number | Récupération | >0 = ok |
| slaveMbxCyclic(slave) | number | Mailbox | Active cyclique |
| configDC() | boolean | DC | Active DC |
| getSlaves() | any[] | Info | Métadonnées esclaves |
| initRedundant(if1,if2) | boolean | Redondance | Master redondant |
| configMapGroup(group?) | Buffer\|null | PDO Group | Mapping groupe |
| sendProcessdataGroup(group?) | number | PDO Group | Variante |
| receiveProcessdataGroup(group?,timeout?) | number | PDO Group | Variante |
| mbxHandler(group?,limit?) | number | Mailbox | Traitement messages |
| elist2string() | string | Diagnostic | Journal erreurs |
| SoEread(slave,driveNo,flags,idn) | Buffer\|null | SoE | Lecture élément |
| SoEwrite(slave,driveNo,flags,idn,data) | boolean | SoE | Écriture élément |
| readeeprom(slave,addr,timeout?) | number | EEPROM | Lecture mot |
| writeeeprom(slave,addr,data,timeout?) | number | EEPROM | Écriture mot |
| APRD(ADP,ADO,length,timeout?) | Buffer\|null | Bas-niveau | Application Read |
| APWR(ADP,ADO,data,timeout?) | number | Bas-niveau | Application Write |
| LRW(LogAdr,length,buf,timeout?) | number | Bas-niveau | Logical Read/Write |
| LRD(LogAdr,length,timeout?) | Buffer\|null | Bas-niveau | Logical Read |
| LWR(LogAdr,data,timeout?) | number | Bas-niveau | Logical Write |
| dcsync0(slave,act,CyclTime,CyclShift) | boolean | DC | Sync simple |
| dcsync01(slave,act,CyclTime0,CyclTime1,CyclShift) | boolean | DC | Sync dual |
| SoemMaster.listInterfaces() | NetworkInterface[] | Utilitaire | Découverte interfaces |

### 5. Référence par catégorie

#### Initialisation & découverte
`init()`, `configInit()`, `configMapPDO()`, `initRedundant()`
Ordre recommandé: init -> configInit -> (slaves>0) -> configMapPDO.

#### Process Data (PDO / Groupes)
`sendProcessdata()`, `receiveProcessdata()`, variantes `*Group()` pour segmenter plusieurs groupes de slaves et gérer des cadences différentes.

#### Accès objets (SDO / SoE / EEPROM)
SDO: `sdoRead` / `sdoWrite` (+ flag `ca` Complete Access). SoE pour drives supportant protocole SoE. EEPROM pour opérations bas-niveau (attention aux timings et verrouillages matériels).

#### Gestion d'état & récupération
`state()`, `readState()`, `writeState()`, `stateCheck()`, `reconfigSlave()`, `recoverSlave()`. Utiliser `stateCheck` après une transition (ex: PRE-OP -> SAFE-OP) pour attendre de façon synchrone.

#### Distributed Clocks & Sync
`configDC()`, `dcsync0()`, `dcsync01()`. Configure la synchronisation temporelle matérielle pour minimiser la dérive. Ajuster `CyclTime` en ns.

#### Accès bas-niveau
`APRD`, `APWR`, `LRW`, `LRD`, `LWR` donnent un contrôle fin sur le trafic EtherCAT. Réservé aux usages avancés (diagnostic spécifique, optimisation bas-niveau, tests conformance).

#### Utilitaires & diagnostics
`elist2string()` agrège les logs internes SOEM. `getSlaves()` permet d'inspecter dynamiquement le bus. `mbxHandler()` pour traitement mailbox périodique.

### 6. Exemples avancés

Boucle temps réel simplifiée (pseudo 1 kHz) :
```js
const master = new SoemMaster('eth0');
if (!master.init()) throw new Error('init failed');
try {
  const slaves = master.configInit();
  if (!slaves) return;
  master.configMapPDO();
  master.configDC();
  const periodUs = 1000; // 1 kHz
  const start = process.hrtime.bigint();
  for (let i = 0; i < 5000; i++) {
    master.sendProcessdata();
    master.receiveProcessdata();
    // Work... (lire/écrire buffers partagés)
    const target = start + BigInt(i + 1) * BigInt(periodUs) * 1000n;
    while (process.hrtime.bigint() < target) {}
  }
} finally { master.close(); }
```

Lecture groupée d'objets SDO (ex: indices consécutifs) :
```js
function readU32(master, slave, index, sub) {
  const b = master.sdoRead(slave, index, sub);
  return b ? b.readUInt32LE(0) : null;
}
const items = [0x1000,0x1001,0x1008];
const results = Object.fromEntries(items.map(i => [i.toString(16), readU32(master,1,i,0)]));
```

Activation DC Sync simple :
```js
if (master.configDC()) {
  master.dcsync0(1, true, 1000000, 0); // 1 ms cycle
}
```

Redondance :
```js
const red = new SoemMaster('eth0');
if (red.initRedundant('eth0','eth1')) {
  // Procéder comme un master classique (configInit, etc.)
}
```

### 7. Erreurs & diagnostics
- Retour `false`/`null` indique échec non fatal (ex: SDO non lu)
- Exceptions: problèmes init majeurs, erreurs N-API
- `elist2string()` pour journal interne après anomalies
- Timeouts: ajuster paramètres `timeout?` sur méthodes correspondantes
- WKC (Working Counter) anormal: vérifier topologie, câblage, état esclave, pertes paquets

### 8. Bonnes pratiques performance
- Pré-allouer buffers pour `LRW` au lieu de recréer chaque cycle
- Minimiser les appels SDO pendant la boucle temps réel (faire hors cycle ou avant)
- Activer DC pour réduire la gigue de synchronisation
- Sur Linux, isoler le CPU (isolcpus) et utiliser un scheduler temps réel si critique
- Sur Windows, réduire les interruptions (désactiver services non nécessaires)

### 9. FAQ courte
**Q: Pourquoi `sdoRead` retourne null ?** L'esclave n'a pas répondu ou index/sub invalide.
**Q: Besoin de root sous Linux ?** Non si capabilities `cap_net_raw,cap_net_admin` définies.
**Q: Peut-on utiliser Electron ?** Oui, basé N-API; rebuild seulement si ABI incompatible.
**Q: Comment diagnostiquer un WKC = 0 ?** Vérifier lien physique, interface sélectionnée, câbles et alimentation des esclaves.

---

Pour plus de détails ou contributions, consultez `docs/API-SoemMaster.md` et ouvrez une Issue/PR.
