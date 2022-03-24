import BN from 'bn.js';
import { Contract } from 'web3-eth-contract';
import { fromWei } from 'web3-utils';

import { MONGODB_URI } from '@/config/secrets';
import { NetworkProvider } from '@/types/enums';
import { getProvider } from '@/util/network';
import db from '@/util/database';

import ERC20Service from './ERC20Service';

describe('ERC20Service', () => {
    const TOTAL_SUPPLY = 1000;
    const DEFAULT_SUB = 'an-unbeliveable-belief-1122';

    let limitedToken: Contract;

    beforeAll(async () => {
        await db.connect(MONGODB_URI);
    });

    afterAll(async () => {
        await db.truncate();
    });

    it('Able to deploy limited token', async () => {
        const { token } = await ERC20Service.create({
            name: 'Test Token',
            symbol: 'TTK',
            network: NetworkProvider.Test,
            totalSupply: `${TOTAL_SUPPLY}`,
            sub: DEFAULT_SUB,
        });

        limitedToken = token;
        expect(limitedToken).toBeDefined();
    });

    it('Able to deploy unlimited token', async () => {
        const { token } = await ERC20Service.create({
            name: 'Test Token',
            symbol: 'TTK',
            network: NetworkProvider.Test,
            totalSupply: '0', // 0 = unlimited
            sub: DEFAULT_SUB,
        });

        expect(token).toBeDefined();
    });

    it('Admin hold correct minted balance', async () => {
        const { admin } = getProvider(NetworkProvider.Test);
        const adminBalance: BN = await limitedToken.methods.balanceOf(admin.address).call();

        expect(Number(fromWei(adminBalance))).toEqual(TOTAL_SUPPLY);
    });

    it('Able to query all deployed tokens by a user', async () => {
        const tokens = await ERC20Service.getAll(DEFAULT_SUB);
        expect(tokens.length).toEqual(2);
    });
});
