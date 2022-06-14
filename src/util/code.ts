import { ChainId } from '@/types/enums';
import { getProvider } from '@/util/network';
import { NoDataAtAddressError } from '@/util/errors';

export async function getCodeForAddressOnNetwork(address: string, chainId: ChainId) {
    const { web3 } = getProvider(chainId);
    const code = await web3.eth.getCode(address);

    if (code === '0x') {
        throw new NoDataAtAddressError(address);
    }
}
