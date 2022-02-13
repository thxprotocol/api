import { IAssetPool } from '@/models/AssetPool';

import WithdrawalService from '@/services/WithdrawalService';

export async function jobProposeWithdraw(assetPool: IAssetPool, id: string, amount: number, beneficiary: string) {
    await WithdrawalService.proposeWithdraw(assetPool, id, beneficiary, amount);
}
