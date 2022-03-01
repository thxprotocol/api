import { GastAdminType } from '@/types/enums/GasAdminType';

export type TGasAdmin = {
    type: GastAdminType;
    nonce: number;
    address: string;
    privateKey: string;
};
