# Guide d'utilisation des interfaces réseau EtherCAT

Ce guide explique comment utiliser les nouvelles fonctionnalités de détection et de gestion des interfaces réseau dans le package SOEM-Node.

## Fonctionnalités ajoutées

### 1. Liste des interfaces réseau

La nouvelle méthode statique `SoemMaster.listInterfaces()` permet de lister toutes les interfaces réseau disponibles sur le système.

```javascript
const { SoemMaster } = require('soem-node');

// Lister toutes les interfaces disponibles
const interfaces = SoemMaster.listInterfaces();
console.log('Interfaces disponibles:', interfaces);
```

Retourne un tableau d'objets avec les propriétés :
- `name`: Nom de l'interface (ex: `"eth0"` sur Linux, `"\Device\NPF_{GUID}"` sur Windows)
- `description`: Description lisible de l'interface

### 2. Utilitaires EtherCAT

Le module `EtherCATUtils` fournit des fonctions utilitaires pour faciliter la gestion des interfaces :

```javascript
const { EtherCATUtils } = require('./examples/ethercat-utils');

// Lister toutes les interfaces avec leur statut
EtherCATUtils.printInterfaceInfo();

// Trouver automatiquement la meilleure interface
const bestInterface = EtherCATUtils.findBestInterface();

// Créer un master avec détection automatique d'interface
const master = EtherCATUtils.createMaster();
```

## Exemples d'utilisation

### Exemple 1: Lister les interfaces

```bash
node examples/list-interfaces.js
```

Affiche toutes les interfaces réseau disponibles avec leur nom et description.

### Exemple 2: Scan automatique

```bash
node examples/auto-scan.js
```

Teste automatiquement chaque interface jusqu'à en trouver une qui fonctionne pour EtherCAT.

### Exemple 3: Gestionnaire d'interfaces

```bash
# Lister les interfaces avec leur statut
node examples/interface-manager.js --interfaces

# Scan complet avec détection automatique
node examples/interface-manager.js

# Aide
node examples/interface-manager.js --help
```

## Différences entre plateformes

### Windows
- Les noms d'interface sont au format `\Device\NPF_{GUID}`
- Nécessite WinPcap ou Npcap installé
- Privilégier les interfaces Ethernet physiques (Intel, Realtek, etc.)
- Exécution en tant qu'administrateur recommandée

### Linux
- Les noms d'interface sont au format classique (`eth0`, `enp0s3`, etc.)
- Nécessite les permissions d'accès aux sockets bruts
- Exécution avec `sudo` ou permissions appropriées

## Utilisation programmatique

### Méthode manuelle
```javascript
const { SoemMaster } = require('soem-node');

// Lister les interfaces
const interfaces = SoemMaster.listInterfaces();

// Choisir une interface spécifique
const selectedInterface = interfaces.find(iface => 
  iface.description.includes('Intel') || iface.description.includes('Ethernet')
);

// Créer le master avec l'interface choisie
const master = new SoemMaster(selectedInterface.name);
if (master.init()) {
  console.log('EtherCAT initialisé avec succès');
  // ... utiliser le master
  master.close();
}
```

### Méthode automatique avec utilitaires
```javascript
const { EtherCATUtils } = require('./examples/ethercat-utils');

// Création automatique avec gestion d'erreurs
const master = EtherCATUtils.createMaster();
if (master) {
  try {
    const slaves = master.configInit();
    console.log(\`\${slaves} esclaves détectés\`);
    // ... traitement
  } finally {
    master.close();
  }
} else {
  console.error('Impossible de créer le master EtherCAT');
}
```

## Dépannage

### Aucune interface trouvée
- Vérifier que WinPcap/Npcap est installé (Windows)
- Vérifier les permissions d'exécution
- Exécuter en tant qu'administrateur/sudo

### Interface ne fonctionne pas
- Tester avec une interface différente
- Vérifier que l'interface n'est pas utilisée par d'autres processus
- S'assurer que les périphériques EtherCAT sont connectés et alimentés

### Erreurs de permissions
- Windows: Exécuter PowerShell en tant qu'administrateur
- Linux: Utiliser `sudo` ou configurer les permissions appropriées

## API Reference

### SoemMaster.listInterfaces()
- **Type**: Méthode statique
- **Retour**: `NetworkInterface[]`
- **Description**: Liste toutes les interfaces réseau disponibles

### EtherCATUtils.findBestInterface()
- **Retour**: `NetworkInterface | null`
- **Description**: Trouve automatiquement la meilleure interface pour EtherCAT

### EtherCATUtils.createMaster(preferredInterface?)
- **Paramètres**: 
  - `preferredInterface` (optionnel): Nom de l'interface préférée
- **Retour**: `SoemMaster | null`
- **Description**: Crée un master EtherCAT avec détection automatique d'interface
