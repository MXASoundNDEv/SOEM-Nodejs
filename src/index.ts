const native: any = require('../build/Release/soem_addon.node');

/**
 * Représentation d'une interface réseau retournée par `SoemMaster.listInterfaces()`.
 */
export interface NetworkInterface {
  /** Nom de l'interface (ex: "eth0", "Ethernet 2") */
  name: string;
  /** Description lisible de l'interface, si disponible */
  description: string;
}

/**
 * Wrapper TypeScript autour du binding natif SOEM (N-API).
 *
 * Contrat (résumé):
 * - Entrées: nom d'interface réseau (string) optionnel dans le constructeur.
 * - Sorties: méthodes renvoyant des types JS primitifs ou Buffers.
 * - Modes d'erreur: la plupart des méthodes renvoient un booléen ou un code; le binding natif
 *   peut jeter pour les erreurs fatales (ex: problème d'initialisation).
 *
 * Usage typique:
 * const m = new SoemMaster('eth0');
 * if (m.init()) {
 *   const slaves = m.configInit();
 *   ...
 *   m.close();
 * }
 */
export class SoemMaster {
  private _m: any;

  /**
   * Crée une instance du Master SOEM en se liant à une interface réseau.
   * @param ifname Le nom de l'interface réseau à utiliser. Défaut: 'eth0' (modifiable pour Windows).
   */
  constructor(ifname: string = 'eth0') {
    this._m = new native.Master(ifname);
  }

  /**
   * Initialise le master (ouvre l'interface, prépare SOEM).
   * @returns true si l'initialisation a réussi, false sinon.
   */
  init(): boolean { return this._m.init(); }

  /**
   * Lance la découverte et la configuration des esclaves EtherCAT sur le bus.
   * @returns nombre d'esclaves détectés (0 si aucun).
   */
  configInit(): number { return this._m.configInit(); }

  /**
   * Configure la map des PDOs après `configInit()`.
   * Ne renvoie rien; l'appel peut lever une erreur côté natif si mal utilisé.
   */
  configMapPDO(): void { this._m.configMapPDO(); }

  /**
   * Retourne l'état courant du master / bus (valeur numérique dépendant du binding).
   * Voir la documentation SOEM pour l'interprétation des codes d'état.
   */
  state(): number { return this._m.state(); }

  /**
   * Force la lecture de l'état (rafraîchit la représentation interne) et renvoie le code d'état.
   */
  readState(): number { return this._m.readState(); }

  /**
   * Lit un SDO d'un esclave.
   * @param slave Index (1-based) de l'esclave sur le bus.
   * @param index Index de l'objet SDO (ex: 0x1000).
   * @param sub Sous-index de l'objet SDO (ex: 0).
  * @param ca optional Complete Access flag (true = Complete Access)
  * @returns Buffer contenant les octets lus, ou null/undefined si la lecture a échoué.
  */
  sdoRead(slave: number, index: number, sub: number, ca?: boolean): Buffer | null { return this._m.sdoRead(slave, index, sub, ca); }

  /**
   * Écrit un SDO sur un esclave.
   * @param slave Index (1-based) de l'esclave.
   * @param index Index de l'objet SDO.
   * @param sub Sous-index de l'objet SDO.
   * @param data Buffer contenant les octets à écrire.
  * @param data Buffer contenant les octets à écrire.
  * @param ca optional Complete Access flag (true = Complete Access)
  * @returns true si l'écriture a réussi, false sinon.
  */
  sdoWrite(slave: number, index: number, sub: number, data: Buffer, ca?: boolean): boolean { return this._m.sdoWrite(slave, index, sub, data, ca); }

  /**
   * Envoie les données process (processdata) au réseau EtherCAT pour le cycle courant.
   * @returns nombre d'octets envoyés ou un code WKC selon l'implémentation.
   */
  sendProcessdata(): number { return this._m.sendProcessdata(); }

  /**
   * Reçoit les données process (processdata) depuis le réseau EtherCAT pour le cycle courant.
   * @returns code WKC (working counter) ou nombre d'octets reçus selon le binding.
   */
  receiveProcessdata(): number { return this._m.receiveProcessdata(); }

  /**
   * Ferme le master et libère les ressources (sockets/bruts, handles natifs).
   */
  close(): void { this._m.close(); }
  /**
   * Écrit l'état demandé sur un esclave (ou master si slave=0).
   * @returns workcounter ou code d'erreur.
   */
  writeState(slave: number, state: number): number { return this._m.writeState(slave, state); }

  /**
   * Vérifie l'état d'un esclave (blocking).
   * @param timeout en ms (optionnel)
   */
  stateCheck(slave: number, reqstate: number, timeout?: number): number { return this._m.stateCheck(slave, reqstate, timeout); }

  /**
   * Reconfigure un esclave (blocking). Retourne l'état final.
   */
  reconfigSlave(slave: number, timeout?: number): number { return this._m.reconfigSlave(slave, timeout); }

  /**
   * Récupère un esclave (blocking). Retourne >0 si successful.
   */
  recoverSlave(slave: number, timeout?: number): number { return this._m.recoverSlave(slave, timeout); }

  /**
   * Active la mailbox cyclique pour un esclave.
   */
  slaveMbxCyclic(slave: number): number { return this._m.slaveMbxCyclic(slave); }

  /**
   * Configure et active Distributed Clocks (DC).
   */
  configDC(): boolean { return this._m.configDC(); }

  /**
   * Retourne un tableau décrivant les esclaves détectés (name, state, outputs, inputs, ...).
   */
  getSlaves(): any[] { return this._m.getSlaves(); }
  initRedundant(if1: string, if2: string): boolean { return this._m.initRedundant(if1, if2); }
  configMapGroup(group?: number): Buffer | null { return this._m.configMapGroup(group); }
  sendProcessdataGroup(group?: number): number { return this._m.sendProcessdataGroup(group); }
  receiveProcessdataGroup(group?: number, timeout?: number): number { return this._m.receiveProcessdataGroup(group, timeout); }
  mbxHandler(group?: number, limit?: number): number { return this._m.mbxHandler(group, limit); }
  elist2string(): string { return this._m.elist2string(); }
  SoEread(slave: number, driveNo: number, elementflags: number, idn: number): Buffer | null { return this._m.SoEread(slave, driveNo, elementflags, idn); }
  SoEwrite(slave: number, driveNo: number, elementflags: number, idn: number, data: Buffer): boolean { return this._m.SoEwrite(slave, driveNo, elementflags, idn, data); }
  readeeprom(slave: number, eeproma: number, timeout?: number): number { return this._m.readeeprom(slave, eeproma, timeout); }
  writeeeprom(slave: number, eeproma: number, data: number, timeout?: number): number { return this._m.writeeeprom(slave, eeproma, data, timeout); }
  APRD(ADP: number, ADO: number, length: number, timeout?: number): Buffer | null { return this._m.APRD(ADP, ADO, length, timeout); }
  APWR(ADP: number, ADO: number, data: Buffer, timeout?: number): number { return this._m.APWR(ADP, ADO, data, timeout); }
  LRW(LogAdr: number, length: number, buf: Buffer, timeout?: number): number { return this._m.LRW(LogAdr, length, buf, timeout); }
  LRD(LogAdr: number, length: number, timeout?: number): Buffer | null { return this._m.LRD(LogAdr, length, timeout); }
  LWR(LogAdr: number, data: Buffer, timeout?: number): number { return this._m.LWR(LogAdr, data, timeout); }
  dcsync0(slave: number, act: boolean, CyclTime: number, CyclShift: number): boolean { return this._m.dcsync0(slave, act, CyclTime, CyclShift); }
  dcsync01(slave: number, act: boolean, CyclTime0: number, CyclTime1: number, CyclShift: number): boolean { return this._m.dcsync01(slave, act, CyclTime0, CyclTime1, CyclShift); }
  
  /**
   * Liste les interfaces réseau disponibles pour l'usage EtherCAT.
   * @returns tableau d'objets `{ name, description }`.
   */
  static listInterfaces(): NetworkInterface[] {
    return native.Master.listInterfaces();
  }
}
