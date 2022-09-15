import request from 'supertest';
import app from '@/app';
import { ChainId, ERC20Type } from '@/types/enums';
import { afterAllCallback, beforeAllCallback } from '@/util/jest/config';
import { isAddress } from 'ethers/lib/utils';
import { dashboardAccessToken } from '@/util/jest/constants';
import { createImage } from '@/util/jest/images';

const http = request.agent(app);

describe('ERC20', () => {
    const ACCESS_TOKEN = dashboardAccessToken;
    let tokenId: string;

    beforeAll(async () => {
        await beforeAllCallback();
    });

    afterAll(async () => {
        await afterAllCallback();
    });

    describe('POST /erc20', () => {
        const TOTAL_SUPPLY = 1000,
            name = 'Test Token',
            symbol = 'TTK';

        it('Able to create limited token and return address', async () => {
            const logoImg = await createImage('image1');
            await http
                .post('/v1/erc20')
                .set('Authorization', ACCESS_TOKEN)
                .attach('file', logoImg, { filename: 'logoImg.jpg', contentType: 'image/jpg' })
                .field({
                    name,
                    symbol,
                    chainId: ChainId.Hardhat,
                    totalSupply: TOTAL_SUPPLY,
                    type: ERC20Type.Limited,
                })
                .expect(({ body }: request.Response) => {
                    expect(isAddress(body._id)).toBeDefined();
                    expect(isAddress(body.address)).toBe(true);
                    expect(body.logoImgUrl).toBeDefined();
                    tokenId = body._id;
                })
                .expect(201);
        });

        it('Able to create unlimited token and return address', (done) => {
            http.post('/v1/erc20')
                .set('Authorization', ACCESS_TOKEN)
                .send({
                    name: 'Test Token',
                    symbol: 'TTK',
                    chainId: ChainId.Hardhat,
                    totalSupply: 0,
                    type: ERC20Type.Unlimited,
                })
                .expect(({ body }: request.Response) => {
                    expect(isAddress(body._id)).toBeDefined();
                    expect(isAddress(body.address)).toBe(true);
                })
                .expect(201, done);
        });

        it('Able to return list of created token', (done) => {
            http.get('/v1/erc20')
                .set('Authorization', ACCESS_TOKEN)
                .expect(({ body }: request.Response) => {
                    expect(body.length).toEqual(2);
                })
                .expect(200, done);
        });

        it('Able to return a created token', (done) => {
            http.get('/v1/erc20/' + tokenId)
                .set('Authorization', ACCESS_TOKEN)
                .expect(({ body }: request.Response) => {
                    expect(body).toBeDefined();
                    expect(isAddress(body.address)).toBe(true);
                    expect(body.type).toBe(ERC20Type.Limited);
                    expect(body.totalSupply).toBe(TOTAL_SUPPLY);
                    expect(body.name).toBe(name);
                    expect(body.symbol).toBe(symbol);
                    expect(body.decimals).toBe(18);
                    expect(body.adminBalance).toBe(1000);
                    expect(body.archived).toBe(false);
                })
                .expect(200, done);
        });
    });
    describe('PATCH /erc20', () => {
        it('should to update a created token', (done) => {
            http.patch('/v1/erc20/' + tokenId)
                .set('Authorization', ACCESS_TOKEN)
                .send({
                    archived: true,
                })
                .expect(({ body }: request.Response) => {
                    expect(body).toBeDefined();
                    expect(body.archived).toBe(true);
                })
                .expect(200, done);
        });
    });

    describe('POST /erc20/preview', () => {
        it('should return name symbol and total supply of an oncChain ERC20Token', (done) => {
            http.post('/v1/erc20/preview')
                .set('Authorization', ACCESS_TOKEN)
                .send({
                    chainId: ChainId.Polygon,
                    address: '0x0000000000000000000000000000000000001010', //MATIC TOKEN
                })
                .expect(({ body }: request.Response) => {
                    expect(body).toBeDefined();
                    expect(body.name).toBeDefined();
                    expect(body.symbol).toBe('MATIC');
                    expect(body.totalSupply).toBeDefined();
                })
                .expect(200, done);
        });
    });
});
