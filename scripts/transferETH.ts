import { MUMBAI_RELAYER } from '@/config/secrets';
import { ChainId } from '@/types/enums';
import { getProvider } from '@/util/network';

const TO = MUMBAI_RELAYER;
const AMOUNT = 0.1;

async function main() {
    console.log('Start!');
    const { web3, defaultAccount } = getProvider(ChainId.PolygonMumbai);
    const receipt = await web3.eth.sendTransaction({
        from: defaultAccount,
        to: TO,
        value: web3.utils.toWei(String(AMOUNT), 'ether'),
        gas: '53000',
    });
    console.log(receipt);
    console.log('Done!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
