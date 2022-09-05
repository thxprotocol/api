import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import { MAX_DAILY_CONTRACT_VERIFICATIONS } from '@/config/secrets';
import { logger } from '@/util/logger';

export async function verificationProcessor() {
    try {
        // Find all pools where pool.verifiedVersion !== pool.version
        const pools = await AssetPool.aggregate([
            {
                $match: {
                    $expr: {
                        $function: {
                            body: function (col1: string, col2: string) {
                                return !col2 || col1 !== col2;
                            },
                            args: ['$version', '$verifiedVersion'],
                            lang: 'js',
                        },
                    },
                },
            },
        ]);
        if (pools.length == 0) {
            return;
        }
        let numTrsansactions = 0;
        const maxTransactions = Number(MAX_DAILY_CONTRACT_VERIFICATIONS);
        for (let i = 0; i < pools.length; i++) {
            const pool: AssetPoolDocument = pools[i];
            // TODO: RUN VERIFICATION PROCESS
            //
            //
            numTrsansactions++;

            pool.verifiedVersion = pool.version;
            pool.verifiedAt = new Date();
            await pool.save();

            if (numTrsansactions >= maxTransactions) {
                return;
            }
        }
    } catch (error) {
        logger.error(error);
    }
}
