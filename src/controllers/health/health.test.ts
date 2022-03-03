import request from 'supertest';
import app from '@/app';
import { NetworkProvider } from '@/types/enums';
import { deployExampleToken } from '@/util/jest/network';

import { isAddress } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { getToken } from '@/util/jest/jwt';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import AssetPoolService from '@/services/AssetPoolService';
import { updateAssetPool } from '@/util/upgrades';

const user = request.agent(app);

describe('Happy Flow', () => {
    let dashboardAccessToken: string, poolAddress: string, testToken: Contract;

    beforeAll(async () => {
        await beforeAllCallback();

        testToken = await deployExampleToken();

        dashboardAccessToken = getToken('openid dashboard');
    });

    afterAll(afterAllCallback);

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', (done) => {
            user.post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
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
                .expect(201, done);
        });
    });

    describe('get info of pool', () => {
        it('HTTP 201 (success)', async () => {
            const pool = await AssetPoolService.getByAddress(poolAddress);
            console.log('pool version before', pool.address, await AssetPoolService.contractVersion(pool));

            updateAssetPool(pool, '1.0.6');

            console.log('pool version after', pool.address, await AssetPoolService.contractVersion(pool));
        });
    });
});
