import { NetworkProvider } from '@/types/enums';
import InfuraService from '@/services/InfuraService';
import { parseLogs } from '@/util/events';
import { Artifacts } from '@/util/artifacts';

const POOL_ADDRESS = '0x6D03aC77FbD87CFCd02E78Ed3e0c916d8C638d26';
const WALLET_ADDRESS = '0x861EFc0989DF42d793e3147214FfFcA4D124cAE8';

describe('ITX', () => {
    describe('Sending Transactions', () => {
        let relayTransactionHash = '';

        it('should have balance', async () => {
            const balance = await InfuraService.getAdminBalance(NetworkProvider.Test);
            expect(Number(balance)).toBeGreaterThan(0);
        });

        it('should return transaction hash', async () => {
            const tx = await InfuraService.send(
                POOL_ADDRESS,
                'claimRewardFor',
                [3, WALLET_ADDRESS],
                NetworkProvider.Test,
            );
            relayTransactionHash = tx.relayTransactionHash;
            // relayTransactionHash = '0xc37eecd18d5ca2cd5185f5457c2b191a7477c0151860ecc5ef62de5ef9cd5bdf';
            // relayTransactionHash = '0xc0c1977a0e46008c8a5018ba574ca4e3b1084133a49c7cf0c042957314a38d7f';
            expect(relayTransactionHash).toBeDefined();
        });

        it('should check for status change', async () => {
            const receipt = await InfuraService.waitTransaction(relayTransactionHash, NetworkProvider.Test);
            console.log(receipt);
            expect(receipt).toBeDefined();
            const events = parseLogs(Artifacts.IDefaultDiamond.abi, receipt.logs);
            console.log(events);
            expect(receipt).toBeDefined();
        });
    });
});
