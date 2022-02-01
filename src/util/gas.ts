import { getGasPriceFromOracle, NetworkProvider } from './network';
import { MAXIMUM_GAS_PRICE } from './secrets';

export async function checkGasPrice() {
    const gasPrice = Number(await getGasPriceFromOracle('FastGasPrice'));
    const maxPrice = Number(MAXIMUM_GAS_PRICE);

    return gasPrice > maxPrice;
}
