import db from '@/util/database';
import { MONGODB_URI } from '@/config/secrets';
import { getContract } from '@/config/contracts';
import { updateDiamondContract } from '@/util/upgrades';
import { AssetPool } from '@/models/AssetPool';
import { AccountPlanType, NetworkProvider } from '@/types/enums';
import { ContractName, currentVersion, DiamondVariant } from '@thxnetwork/artifacts';
import AssetPoolService from '@/services/AssetPoolService';
import AccountProxy from '@/proxies/AccountProxy';

db.connect(MONGODB_URI);

async function main() {
    const startTime = Date.now();
    console.log('Start!', startTime);
    const diamonds: Partial<Record<ContractName, DiamondVariant>> = {
        PoolRegistry: 'poolRegistry',
        PoolFactory: 'poolFactory',
        TokenFactory: 'tokenFactory',
    };

    for (const [contractName, diamondVariant] of Object.entries(diamonds)) {
        for (const npid of [NetworkProvider.Test, NetworkProvider.Main]) {
            try {
                const contract = getContract(npid, contractName as ContractName);
                const changes = await updateDiamondContract(npid, contract, diamondVariant);
                console.log(
                    `${changes ? 'Upgraded' : 'Skipped'} ${contractName} (${NetworkProvider[npid]}):`,
                    currentVersion,
                );
            } catch (error) {
                console.error(error);
            }
        }
    }

    for (const pool of await AssetPool.find({ version: { $ne: currentVersion } })) {
        try {
            const account = await AccountProxy.getById(pool.sub);
            // We only upgrade paying accounts automatically. Other accounts will see a notification in Dashboard
            if (account.plan !== AccountPlanType.Free) {
                console.log('Upgrade:', pool.address, `${pool.variant} ${pool.version} -> ${currentVersion}`);
                await AssetPoolService.updateAssetPool(pool, currentVersion);
            } else {
                console.log('Skipped:', pool.address, `${pool.variant} ${pool.version} -> Account #${account.id}`);
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
