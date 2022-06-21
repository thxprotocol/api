import { ChainId } from '@/types/enums';
import { getProvider } from '@/util/network';

const TO = '0x1d40a8aa75E6efbf5176472cd481bC2221404CBf';
const AMOUNT = 1;

async function main() {
    console.log('Start!');
    const { web3, admin } = getProvider(ChainId.Polygon);
    const signedTx = await web3.eth.accounts.signTransaction(
        {
            from: admin.address,
            to: TO,
            value: web3.utils.toWei(String(AMOUNT), 'ether'),
            gas: '53000',
        },
        admin.privateKey,
    );
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(receipt);
    console.log('Done!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
