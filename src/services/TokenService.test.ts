import { NetworkProvider } from '@/types/enums';
import { Contract } from 'web3-eth-contract';
import TokenService from './TokenService';

describe('TokenService', () => {
    const TOTAL_SUPPLY = 1000;
    let limitedToken: Contract;
    it('Able to deploy limited token', async () => {
        const { token } = await TokenService.createERC20Token({
            name: 'Test Token',
            symbol: 'TTK',
            network: NetworkProvider.Test,
            totalSupply: `${TOTAL_SUPPLY}`,
        });

        limitedToken = token;
        expect(limitedToken).toBeDefined();
    });
    // it('Able to deploy unlimited token', async () => {});
});
