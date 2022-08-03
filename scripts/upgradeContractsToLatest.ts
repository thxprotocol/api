import db from '@/util/database';
import { MONGODB_URI } from '@/config/secrets';
import { getContract } from '@/config/contracts';
import { updateDiamondContract } from '@/util/upgrades';
import { AssetPool } from '@/models/AssetPool';
import { AccountPlanType, ChainId } from '@/types/enums';
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
        for (const chainId of [ChainId.PolygonMumbai, ChainId.Polygon]) {
            try {
                const contract = getContract(chainId, contractName as ContractName);
                const tx = await updateDiamondContract(chainId, contract, diamondVariant);
                if (tx) console.log(`Upgraded: ${contractName} (${ChainId[chainId]}):`, currentVersion);
            } catch (error) {
                console.error(error);
            }
        }
    }

    for (const pool of await AssetPool.find({ version: { $ne: currentVersion } })) {
        try {
            const account = await AccountProxy.getById(pool.sub);
            if (!account) return;

            const isPaidPlan = [AccountPlanType.Basic, AccountPlanType.Premium].includes(account.plan);
            const isFreeMumbai = account.plan === AccountPlanType.Free && pool.chainId === ChainId.PolygonMumbai;

            if (isPaidPlan || isFreeMumbai) {
                console.log('Upgrade:', pool.address, `${pool.variant} ${pool.version} -> ${currentVersion}`);
                await AssetPoolService.updateAssetPool(pool, currentVersion);
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
