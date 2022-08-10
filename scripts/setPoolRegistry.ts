import db from '@/util/database';
import { MONGODB_URI } from '@/config/secrets';
import { AssetPool } from '@/models/AssetPool';
import { getContract } from '@/config/contracts';
import { ChainId } from '@/types/enums';
import { BigNumber } from 'ethers';
import TransactionService from '@/services/TransactionService';
import { currentVersion } from '@thxnetwork/artifacts';

db.connect(MONGODB_URI);

const FEE_COLLECTOR_DEV = '0x2e2fe80CD6C4933B3B97b4c0B5c8eC56b073bE27';
const FEE_COLLECTOR = '0x802505465CB707c9347B9631818e14f6066f7513';
const multiplier = BigNumber.from('10').pow(15);
const twoHalfPercent = BigNumber.from('25').mul(multiplier);

async function main() {
    const startTime = Date.now();
    console.log('Start!', startTime);

    const registry = getContract(ChainId.Polygon, 'PoolRegistry', currentVersion);

    await TransactionService.send(
        registry.options.address,
        registry.methods.setFeeCollector(FEE_COLLECTOR),
        ChainId.Polygon,
    );
    await TransactionService.send(
        registry.options.address,
        registry.methods.setFeePercentage(twoHalfPercent),
        ChainId.Polygon,
    );

    for (const pool of await AssetPool.find()) {
        try {
            const currentRegistryAddress = await pool.contract.methods.getPoolRegistry().call();
            const registry = getContract(pool.chainId, 'PoolRegistry', currentVersion);

            if (registry.options.address !== currentRegistryAddress) {
                const receipt = await TransactionService.send(
                    pool.address,
                    pool.contract.methods.setPoolRegistry(registry.options.address),
                    pool.chainId,
                );

                console.log(
                    pool.chainId,
                    await pool.contract.methods.getPoolRegistry().call(),
                    receipt.transactionHash,
                );
            }
        } catch (error) {
            console.error(pool.address, error);
        }
    }

    const endTime = Date.now();
    console.log('Done!', startTime, endTime, endTime - startTime);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
