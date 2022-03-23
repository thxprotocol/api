import BN from 'bn.js';
import { toWei } from 'web3-utils';

import Token from '@/models/Token';
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

    static async getAllERC20TokenBySub(sub: string) {
        const tokens = await Token.find({ sub });
        return tokens || [];
    }

    static async getERC20TokenById(id: string) {
        const token = await Token.findById(id);
        return token;
    }
}

export interface CreateERC20Params {
    name: string;
    symbol: string;
    totalSupply: string;
    network: NetworkProvider;
}
