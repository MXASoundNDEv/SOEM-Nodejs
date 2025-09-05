export type IfName = string;

export interface NetworkInterface {
    name: string;
    description: string;
}

export class SoemMaster {
    constructor(ifname?: IfName);
    init(): boolean;
    configInit(): number;
    configMapPDO(): void;
    state(): number;
    readState(): number;
    sdoRead(slave: number, index: number, sub: number): Buffer | null;
    sdoWrite(slave: number, index: number, sub: number, data: Buffer): boolean;
    sendProcessdata(): number;
    receiveProcessdata(): number;
    close(): void;
    static listInterfaces(): NetworkInterface[];
}
