import request from 'supertest';
import app from '@/app';
import { ChainId, ERC20Type } from '../../../types/enums';
import { dashboardAccessToken, tokenName, tokenSymbol } from '@/util/jest/constants';
import { isAddress } from 'web3-utils';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { getRewardConfiguration } from '../../rewards/utils';
import { AssetPoolDocument } from '@/models/AssetPool';
import { agenda, EVENT_SEND_DOWNLOAD_QR_EMAIL } from '@/util/agenda';
import { RewardDocument } from '@/models/Reward';

const user = request.agent(app);

describe('Claims', () => {
    let pool: AssetPoolDocument, reward: RewardDocument, tokenAddress: string;

    beforeAll(async () => {
        await beforeAllCallback();
    });

    afterAll(afterAllCallback);

    it('Create ERC20', (done) => {
        user.post('/v1/erc20')
            .set('Authorization', dashboardAccessToken)
            .send({
                chainId: ChainId.Hardhat,
                name: tokenName,
                symbol: tokenSymbol,
                type: ERC20Type.Unlimited,
                totalSupply: 0,
            })
            .expect(({ body }: request.Response) => {
                expect(isAddress(body.address)).toBe(true);
                tokenAddress = body.address;
            })
            .expect(201, done);
    });

    it('Create Asset Pool', (done) => {
        user.post('/v1/pools')
            .set('Authorization', dashboardAccessToken)
            .send({
                chainId: ChainId.Hardhat,
                erc20tokens: [tokenAddress],
            })
            .expect((res: request.Response) => {
                expect(isAddress(res.body.address)).toBe(true);
                pool = res.body;
            })
            .expect(201, done);
    });

    describe('A reward with limit is 0 (unlimited) and claim_one enabled and amount is greather tham 1', () => {
        it('Create reward', (done) => {
            user.post('/v1/rewards/')
                .set({ 'X-PoolId': pool._id, 'Authorization': dashboardAccessToken })
                .send(getRewardConfiguration('claim-one-is-enabled-and-amount-is-greather-than-1'))
                .expect((res: request.Response) => {
                    expect(res.body.amount).toEqual(10);
                    reward = res.body;
                })
                .expect(201, done);
        });
    });
    describe('multiple qrcodes generation', () => {
        it('should genrate multiple qurcode images', (done) => {
            user.get(`/v1/rewards/${reward.id}/claims/qrcode`)
                .set({ 'X-PoolId': pool._id, 'Authorization': dashboardAccessToken })
                .expect(201, done);
        });

        it('should cast a success event for sendDownloadQrEmail event', (done) => {
            const callback = async () => {
                agenda.off(`success:${EVENT_SEND_DOWNLOAD_QR_EMAIL}`, callback);
                done();
            };
            agenda.on(`success:${EVENT_SEND_DOWNLOAD_QR_EMAIL}`, callback);
        });
    });
});
