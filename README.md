# soem-node

Bindings Node-API pour [SOEM](https://github.com/OpenEtherCATsociety/SOEM).

## Prérequis

- Node.js \>= 18
- CMake \>= 3.18
- Outils de compilation C/C++ (gcc/clang, make, etc.)
- Sous-module SOEM initialisé :
  ```bash
  git submodule update --init --recursive
  ```

## Installation

```
npm install
```

Le script postinstall lance `cmake-js` pour construire le module natif. Pour des logs détaillés :
```
DEBUG=cmake-js:* npm install
```

### Permissions réseau

SOEM utilise des sockets bruts. Sous Linux, pour éviter d'exécuter Node en root :
```
sudo setcap cap_net_raw,cap_net_admin+eip $(which node)
```

## Build manuel

```
npm run build
```

## Exemple

```
node examples/scan-and-read.js eth0
```

Ce script détecte les esclaves, échange les `processdata` et lit l'SDO `0x1000` du slave 1.

## Dépannage

- Vérifiez que le sous-module SOEM est initialisé.
- Assurez-vous que votre toolchain C/C++ et CMake sont installés.
- Utilisez `DEBUG=cmake-js:*` pour des traces détaillées.

## Licence

Ce projet est distribué sous licence GPL-2.0-or-later. SOEM est GPLv2 avec exceptions ; la distribution de binaires précompilés peut imposer de publier votre code source. Une licence commerciale de SOEM est disponible pour des utilisations propriétaires.
