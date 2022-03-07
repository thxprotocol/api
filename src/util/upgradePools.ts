import dotenv from 'dotenv';
import db from '@/util/database';
import { currentVersion } from '@/config/contracts/index';
import { MONGODB_URI } from '@/config/secrets';
import { updateAssetPool } from './upgrades';
import { AssetPool } from '@/models/AssetPool';

dotenv.config();
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
    const endTime = Date.now();
    console.log('Done!', startTime, endTime, endTime - startTime);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
