import BN from 'bn.js';
import { toWei } from 'web3-utils';
import { Contract } from 'web3-eth-contract';

import { NetworkProvider } from '@/types/enums';
import { deployLimitedSupplyERC20Contract, deployUnlimitedSupplyERC20Contract, getProvider } from '@/util/network';

export default class TokenService {
    static async createERC20(params: CreateERC20Params) {
        const { admin } = getProvider(params.network);

        if (Number(params.totalSupply) > 0) {
            const { token, receipt } = await deployLimitedSupplyERC20Contract(
                params.network,
                params.name,
                params.symbol,
                admin.address,
                toWei(new BN(params.totalSupply)),
            );

            return { token, receipt };
        } else {
            const { token, receipt } = await deployUnlimitedSupplyERC20Contract(
                params.network,
                params.name,
                params.symbol,
                admin.address,
            );

            return { token, receipt };
        }
    }
}

export interface CreateERC20Params {
    name: string;
    symbol: string;
    totalSupply: string;
    network: NetworkProvider;
}
