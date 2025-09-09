# API: SoemMaster (SOEM-Nodejs)

Cette page documente l'API exposée par le wrapper TypeScript `SoemMaster` (fichier `src/index.ts`) et la fonction utilitaire `listInterfaces()` fournie par le binding natif.

## Vue d'ensemble

`SoemMaster` est un wrapper minimal autour du binding natif SOEM (N-API). Il vous permet d'initialiser un master EtherCAT, de découvrir et configurer les esclaves, d'échanger des processdata et lire/écrire des SDO.

Contrat général:
- Entrée principale: nom d'interface réseau (string) dans le constructeur.
- Méthodes renvoyant: boolean, number, Buffer selon l'opération.
- Les erreurs critiques peuvent être lancées côté natif; en JavaScript vérifiez toujours les retours.

---

## Changements récents

Les bindings natifs ont été récemment étendus et la documentation mise à jour:
- Ajout d'un paramètre optionnel `ca?: boolean` aux méthodes `sdoRead` et `sdoWrite` pour activer le mode "Complete Access" lorsqu'il est pris en charge par l'esclave.
- Exposition de fonctions SOEM additionnelles côté Node (SoE, EEPROM, primitives port-bas niveau, gestion de groupes processdata, etc.).
- Correction d'un problème de compilation où des primitives attendant un pointeur `ecx_portt*` recevaient le contexte complet — la correction passe désormais `&ctx_.port`.

Mettez à jour vos tests d'intégration si vous attendez le comportement SDO par défaut; le flag `ca` est optionnel et non intrusif.


## Types

### NetworkInterface

- `name: string` — Nom de l'interface (ex: `eth0`, `Ethernet 2`).
- `description: string` — Description lisible ou étiquette de l'interface.

---

## Classe SoemMaster

Constructeur

### new SoemMaster(ifname?: string)

- `ifname` (optionnel) : nom de l'interface réseau. Défaut `"eth0"`.
- Effet: instancie le binding natif `new native.Master(ifname)`.

Exemple:

```js
const m = new SoemMaster('eth0');
```

Méthodes

### init(): boolean

- Initialise le master et ouvre l'interface.
- Retour: `true` si succès, `false` sinon.
- Edge cases: peut échouer si l'interface n'existe pas ou si les permissions sont insuffisantes.

Usage:
```js
if (!m.init()) throw new Error('init failed');
```

---

### Méthodes additionnelles

Les bindings ont été étendus pour exposer plusieurs primitives SOEM et helpers utiles pour la gestion d'esclaves, la mailbox, les transferts bas-niveau et la configuration DC / groupes processdata.

Pour chaque méthode suivante, l'appel JS invoque directement l'implémentation native. Les retours sont typiques du binding : boolean / number / Buffer / null selon l'opération.

- writeState(slave: number, state: number): number
  - Écrit l'état demandé sur un esclave (slave index 1-based, 0 pour le master). Retourne le workcounter ou un code d'erreur.

- stateCheck(slave: number, reqstate: number, timeout?: number): number
  - Bloque (ou attend) jusqu'à ce que l'esclave atteigne l'état `reqstate` ou que le `timeout` (ms) expire. Retourne l'état final.

- reconfigSlave(slave: number, timeout?: number): number
  - Lance une reconfiguration d'un esclave (par ex. après re-enumeration). Retourne l'état final.

- recoverSlave(slave: number, timeout?: number): number
  - Tente de récupérer un esclave en erreur. Retourne >0 si réussi.

- slaveMbxCyclic(slave: number): number
  - Active la mailbox cyclique (mailbox cyclic) sur l'esclave donné. Retourne un code d'état.

- configDC(): boolean
  - Configure et active les Distributed Clocks (DC) sur le réseau. Retourne true si la configuration a réussi.

- getSlaves(): any[]
  - Retourne une liste d'objets décrivant les esclaves détectés (identifiants, états, tailles d'IO, ...). Utilité pour introspection et UI.

- initRedundant(if1: string, if2: string): boolean
  - Initialise un master redondant sur deux interfaces physiques.

- configMapGroup(group?: number): Buffer | null
  - Configure la map PDO pour un groupe processdata particulier et retourne les informations de mapping (Buffer) ou null.

- sendProcessdataGroup(group?: number): number
- receiveProcessdataGroup(group?: number, timeout?: number): number
  - Variantes groupées de `sendProcessdata()`/`receiveProcessdata()` pour gérer plusieurs groupes processdata.

- mbxHandler(group?: number, limit?: number): number
  - Gestionnaire général de mailbox ; peut être appelé périodiquement pour traiter les messages mailbox (limite d'itérations optionnelle).

- elist2string(): string
  - Convertit la liste d'erreurs/intervalles SOEM internes en une string lisible (utile pour logs et diagnostics).

- SoEread/SoEwrite(...): Buffer | boolean
  - Lecture/écriture de Service over EtherCAT (SoE) pour périphériques supportant SoE (ex: drives). Signature JS :
    - `SoEread(slave, driveNo, elementflags, idn): Buffer | null`
    - `SoEwrite(slave, driveNo, elementflags, idn, data: Buffer): boolean`

- readeeprom(slave: number, eeproma: number, timeout?: number): number
- writeeeprom(slave: number, eeproma: number, data: number, timeout?: number): number
  - Accès EEPROM bas-niveau (lecture/écriture) pour un esclave donné.

- APRD / APWR / LRW / LRD / LWR
  - Primitives d'accès bas-niveau (application read/write, logical read/write) exposées pour des besoins avancés.
  - Signatures JS : `APRD(ADP, ADO, length, timeout)`, `APWR(ADP, ADO, data, timeout)`, `LRW(LogAdr, length, buf, timeout)`, `LRD(LogAdr, length, timeout)`, `LWR(LogAdr, data, timeout)`.
  - Ces fonctions retournent soit un `Buffer` contenant les données lues, soit un nombre (workcounter / code), ou `null` en cas d'échec.

- dcsync0 / dcsync01
  - Helpers pour configurer les synchronisations DC (single / dual cycle). Signatures JS :
    - `dcsync0(slave, act, CyclTime, CyclShift): boolean`
    - `dcsync01(slave, act, CyclTime0, CyclTime1, CyclShift): boolean`

Notes générales
- Ces méthodes correspondent directement aux primitives SOEM — la robustesse (validation d'arguments, conversions, exceptions) est gérée côté natif. En JS, vérifiez toujours les retours et encapsulez les appels critiques dans `try/catch`.
- Pour les transferts SDO/SoE/EEPROM sensibles au timeout, ajustez le paramètre `timeout` lorsque disponible.


### configInit(): number

- Découvre et configure les esclaves EtherCAT.
- Retour: nombre d'esclaves détectés (0 si aucun).
- Doit être appelé après `init()`.

---

### configMapPDO(): void

- Configure la map PDO pour les échanges processdata.
- Nécessite que `configInit()` ait détecté au moins un esclave.

---

### state(): number

- Retourne l'état courant (code numérique) du master/bus.
- Pour interpréter la valeur, se référer à la documentation SOEM/C API.

---

### readState(): number

- Force la lecture/rafraîchissement de l'état et renvoie le code d'état.

---

### sdoRead(slave: number, index: number, sub: number): Buffer

- Lit un SDO sur l'esclave.
- `slave` : index (1-based) de l'esclave.
- `index` : index de l'objet SDO (ex: `0x1000`).
- `sub` : sous-index.
- Retour: `Buffer` contenant les octets lus, ou `null/undefined` en cas d'échec.
- Remarques: convertir le `Buffer` selon le format attendu (ex: `readUInt32LE` pour 32-bit little-endian).

Exemple:
```js
const buf = m.sdoRead(1, 0x1000, 0);
if (buf) console.log('Device type:', buf.readUInt32LE(0));
```

---

### sdoWrite(slave: number, index: number, sub: number, data: Buffer): boolean

- Écrit un SDO sur l'esclave.
- Retour: `true` si l'écriture a réussi, `false` sinon.
- Exemple: écrire un entier 32-bit little-endian

```js
const b = Buffer.alloc(4);
b.writeUInt32LE(0x12345678, 0);
const ok = m.sdoWrite(1, 0x2000, 0, b);
```

---

### sendProcessdata(): number

- Envoie les données process pour le cycle courant.
- Retour: dépend de l'implémentation native (typiquement un code ou nombre d'octets envoyés).

---

### receiveProcessdata(): number

- Réception des données process pour le cycle courant.
- Retour: code WKC (working counter) ou nombre d'octets reçus.
- Utilisation typique: appeler `sendProcessdata()` puis `receiveProcessdata()` dans la boucle cyclique.

---

### close(): void

- Ferme le master et libère les ressources natives.
- Appeler dans un bloc finally pour garantir la libération.

---

## Utilitaires

### SoemMaster.listInterfaces(): NetworkInterface[]

- Méthode statique qui liste les interfaces réseau disponibles utilisables pour EtherCAT.
- Retour: tableau d'objets `{ name, description }`.

Exemple:
```js
const ifs = SoemMaster.listInterfaces();
console.log(ifs);
```

---

## Bonnes pratiques & cas limites

- Toujours vérifier `init()` avant d'appeler `configInit()`.
- Valider les retours `configInit()` (nombre d'esclaves) avant `configMapPDO()`.
- Entourer l'usage d'un `try/finally` et appeler `close()` dans `finally`.
- Sur Linux, assurez-vous que Node a les permissions nécessaires (setcap ou exécution en root).
- Les erreurs critiques côté natif peuvent être lancées: utilisez `try/catch` pour attraper les exceptions inattendues.

---

## Exemple complet

```js
const { SoemMaster } = require('soem-node');

async function demo() {
  const m = new SoemMaster('eth0');
  try {
    if (!m.init()) throw new Error('init failed');
    const slaves = m.configInit();
    if (slaves > 0) {
      m.configMapPDO();
      m.sendProcessdata();
      const wkc = m.receiveProcessdata();
      console.log('WKC:', wkc);
      const buf = m.sdoRead(1, 0x1000, 0);
      if (buf) console.log('Device type:', buf.readUInt32LE(0).toString(16));
    }
  } finally {
    m.close();
  }
}

demo().catch(console.error);
```