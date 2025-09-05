import { NetworkInterface, SoemMaster } from '../src/index';

export class EtherCATUtils {
  static getAvailableInterfaces(): NetworkInterface[];
  static findBestInterface(): NetworkInterface | null;
  static testInterface(interfaceName: string): boolean;
  static findWorkingInterface(): NetworkInterface | null;
  static createMaster(preferredInterface?: string | null): SoemMaster | null;
  static printInterfaceInfo(): void;
}
