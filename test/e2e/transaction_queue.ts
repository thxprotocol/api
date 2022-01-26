import request, { Response } from 'supertest';
import server from '../../src/server';
import db from '../../src/util/database';
import { rewardWithdrawAmount, tokenName, tokenSymbol, userWalletPrivateKey } from './lib/constants';
import { isAddress } from 'web3-utils';
import { Account } from 'web3-core';
import { getToken } from './lib/jwt';
import { createWallet } from './lib/network';
import { mockClear, mockStart } from './lib/mock';
import { agenda } from '../../src/util/agenda';
import { Job as IJob } from 'agenda';
import { Job } from '../../src/models/Job';

const user = request.agent(server);

describe('Transaction Queue', () => {
    const withdrawalDocumentIdList: string[] = [];
    let adminAccessToken: string,
        dashboardAccessToken: string,
        walletAccessToken: string,
        poolAddress: string,
        userWallet: Account;

    beforeAll(async () => {
        adminAccessToken = getToken('openid admin');
        dashboardAccessToken = getToken('openid dashboard');
        walletAccessToken = getToken('openid user');
        userWallet = createWallet(userWalletPrivateKey);

        await Job.deleteMany({});

        mockStart();
    });

    afterAll(async () => {
        await db.truncate();

        mockClear();
    });

    describe('POST /asset_pools', () => {
        it('HTTP 201 (success)', async () => {
            await user
                .post('/v1/asset_pools')
                .set('Authorization', dashboardAccessToken)
                .send({
                    network: 0,
                    token: {
                        name: tokenName,
                        symbol: tokenSymbol,
                        totalSupply: 0,
                    },
                })
                .expect(async ({ body }: Response) => {
                    expect(isAddress(body.address)).toBe(true);
                    poolAddress = body.address;
                })
                .expect(201);
        });

        it('HTTP 302 when member is added', async () => {
            await user
                .post('/v1/members/')
                .send({ address: userWallet.address })
                .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                .expect(302);
        });
    });

    describe('POST /withdrawals 3x (gasPrice < MAXIMUM_GAS_PRICE)', () => {
        it('should disable job queue', async () => {
            await agenda.disable({ name: 'proposeWithdraw' });
        });

        it('should propose 3 withdrawals', async () => {
            for (const index of [0, 1, 2]) {
                await user
                    .post('/v1/withdrawals')
                    .send({
                        member: userWallet.address,
                        amount: rewardWithdrawAmount,
                    })
                    .set({ AssetPool: poolAddress, Authorization: adminAccessToken })
                    .expect(({ body }: Response) => {
                        expect(body.withdrawalId).toBeUndefined();

                        withdrawalDocumentIdList[index] = body.id;
                    })
                    .expect(201);
            }
        });

        it('should see 3 proposed withdrawals', async () => {
            await user
                .get('/v1/withdrawals?page=1&limit=10')
                .set({ AssetPool: poolAddress, Authorization: walletAccessToken })
                .expect(({ body }: Response) => {
                    expect(body.results.length).toEqual(3);
                    expect(body.total).toEqual(3);

                    for (const result of body.results) {
                        expect(result.job).toBeDefined();
                    }
                })
                .expect(200);
        });

        it('should have 3 jobs scheduled', async () => {
            const jobs = await agenda.jobs({});

            expect(jobs.length).toEqual(3);
            expect(withdrawalDocumentIdList.length).toEqual(3);
        });

        it('should start job queue', async () => {
            await agenda.enable({ name: 'proposeWithdraw' });
        });

        it('should cast 3 complete events', (done) => {
            let index = 0;

            agenda.on('complete:proposeWithdraw', (job: IJob) => {
                expect(job.attrs.data.id).toBe(withdrawalDocumentIdList[index]);
                index++;

                if (index === withdrawalDocumentIdList.length) done();
            });
        });
    });
});
