import { GastAdminType } from '@/enums/GasAdminType';

export type TGasAdmin = {
    type: GastAdminType;
    nonce: number;
    address: string;
    privateKey: string;
};
