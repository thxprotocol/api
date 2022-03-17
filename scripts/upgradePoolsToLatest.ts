import db from '@/util/database';
import { MONGODB_URI } from '@/config/secrets';
import { updateDiamondContract } from '@/util/upgrades';
import { AssetPool } from '@/models/AssetPool';
import { NetworkProvider } from '@/types/enums';
import { ContractName, currentVersion, DiamondVariant } from '@thxnetwork/artifacts';
import AssetPoolService from '@/services/AssetPoolService';
import { getContract } from '@/config/contracts';

db.connect(MONGODB_URI);

async function main() {
    const startTime = Date.now();
    console.log('Start!', startTime);
    for (const pool of await AssetPool.find({ version: { $ne: currentVersion } })) {
        try {
            console.log('Upgrade:', pool.address, `${pool.variant} ${pool.version} -> ${currentVersion}`);
            await AssetPoolService.updateAssetPool(pool, currentVersion);
        } catch (error) {
            console.error(pool.address, error);
        }
    }

    const diamonds: Partial<Record<ContractName, DiamondVariant>> = {
        AssetPoolRegistry: 'assetPoolRegistry',
        AssetPoolFactory: 'assetPoolFactory',
        TokenFactory: 'tokenFactory',
    };

    for (const [contractName, diamondVariant] of Object.entries(diamonds)) {
        for (const npid in NetworkProvider) {
            try {
                console.log(`Upgrade ${contractName} (${NetworkProvider[npid]}):`, currentVersion);
                const contract = getContract(NetworkProvider.Test, contractName as ContractName);
                await updateDiamondContract(NetworkProvider.Test, contract, diamondVariant);
            } catch (error) {
                console.error(error);
            }
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
