import request from 'supertest';
import app from '@/app';
import { NetworkProvider } from '@/types/enums';

import { isAddress } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import AssetPoolService from '@/services/AssetPoolService';
import { updateAssetPool } from '@/util/upgrades';
import { currentVersion, getContract } from '@/config/contracts';

const user = request.agent(app);

describe('Happy Flow', () => {
    let poolAddress: string, testToken: Contract;

    beforeAll(async () => {
        await beforeAllCallback();

        testToken = getContract(NetworkProvider.Main, 'TokenLimitedSupply');

        await user
            .post('/v1/asset_pools')
            .set('Authorization', getToken('openid dashboard'))
            .send({
                network: NetworkProvider.Main,
                token: {
                    address: testToken.options.address,
                },
            })
            .expect((res: request.Response) => {
                expect(isAddress(res.body.address)).toBe(true);
                poolAddress = res.body.address;
            })
            .expect(201);
    });

    afterAll(afterAllCallback);

    describe('Test pool upgrades', () => {
        it('Three upgrades with different subsets', async () => {
            const pool = await AssetPoolService.getByAddress(poolAddress);

            expect(await AssetPoolService.contractVersion(pool)).toBe(currentVersion);

            await updateAssetPool(pool, 'test-partial-1');
            expect(await AssetPoolService.contractVersion(pool)).toBe('test-partial-1');

            await updateAssetPool(pool, 'test-partial-2');
            expect(await AssetPoolService.contractVersion(pool)).toBe('test-partial-2');

            await updateAssetPool(pool);
            expect(await AssetPoolService.contractVersion(pool)).toBe(currentVersion);
        });
    });
});
