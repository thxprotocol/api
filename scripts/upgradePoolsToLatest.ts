import db from '@/util/database';
import { MONGODB_URI } from '@/config/secrets';
import { updateAssetPool, updateAssetPoolFactory } from '@/util/upgrades';
import { AssetPool } from '@/models/AssetPool';
import { NetworkProvider } from '@/types/enums';
import { currentVersion } from '@thxnetwork/artifacts';

db.connect(MONGODB_URI);

async function main() {
    const startTime = Date.now();
    console.log('Start!', startTime);
    for (const pool of await AssetPool.find({ version: { $ne: currentVersion } })) {
        try {
            console.log('Upgrade:', pool.address, `${pool.version} -> ${currentVersion}`);
            await updateAssetPool(pool, currentVersion);
        } catch (error) {
            console.error(pool.address, error);
        }
    }

    try {
        console.log('Upgrade Factory (Mumbai):', currentVersion);
        await updateAssetPoolFactory(NetworkProvider.Test, currentVersion);
        console.log('Upgrade Factory (Mainnet):', currentVersion);
        await updateAssetPoolFactory(NetworkProvider.Main, currentVersion);
    } catch (error) {
        console.error(error);
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
