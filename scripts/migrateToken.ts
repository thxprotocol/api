import BN from 'bn.js';

import { MONGODB_URI } from '@/config/secrets';
import ERC20 from '@/models/ERC20';
import AssetPoolService from '@/services/AssetPoolService';
import TransactionService from '@/services/TransactionService';
import { ERC20Type, NetworkProvider } from '@/types/enums';
import db from '@/util/database';
import { tokenContract as getTokenContract } from '@/util/network';

export const tokenMigrate = async () => {
    db.connect(MONGODB_URI);
    const assetPools = await AssetPoolService.getAll();

    for (const pool of assetPools) {
        try {
            const contract = pool.contract;

            const tokenAddress = await TransactionService.call(contract.methods.getToken(), NetworkProvider.Test);
            if (tokenAddress === '0x0000000000000000000000000000000000000000') continue;
            const tokenContract = getTokenContract(NetworkProvider.Test, tokenAddress);

            await ERC20.create({
                name: await TransactionService.call(tokenContract.methods.name(), NetworkProvider.Test),
                symbol: await TransactionService.call(tokenContract.methods.symbol(), NetworkProvider.Test),
                address: tokenAddress,
                blockNumber: new BN(tokenContract.defaultBlock.toString()).toNumber(),
                type: ERC20Type.UNKNOWN,
                transactionHash: '',
                network: NetworkProvider.Test,
                sub: pool.sub,
            });
        } catch (e) {
            console.log(e);
        }
    }

    return process.exit();
};

tokenMigrate();
