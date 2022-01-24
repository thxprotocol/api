import { toWei } from 'web3-utils';
import { getGasPrice, NetworkProvider } from './network';
import { MAXIMUM_GAS_PRICE } from './secrets';

export async function checkGasPrice(npid: NetworkProvider) {
    const gasPrice = Number(await getGasPrice(npid));
    const maxPrice = Number(toWei(String(MAXIMUM_GAS_PRICE), 'gwei'));

    return gasPrice > maxPrice;
}
