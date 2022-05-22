import { NetworkProvider } from '@/types/enums';
import { getProvider } from '@/util/network';
import { NoDataAtAddressError } from '@/util/errors';

export async function getCodeForAddressOnNetwork(address: string, npid: NetworkProvider) {
    const { web3 } = getProvider(npid);
    const code = await web3.eth.getCode(address);

    if (code === '0x') {
        throw new NoDataAtAddressError(address);
    }
}
