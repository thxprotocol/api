import InfuraService from '@/services/InfuraService';
import { parseUnits } from 'ethers/lib/utils';
import { NetworkProvider } from '@/types/enums';

async function main() {
    console.log('Start!');
    await InfuraService.deposit(parseUnits('10', 'ether'), NetworkProvider.Test);
    await InfuraService.deposit(parseUnits('15', 'ether'), NetworkProvider.Main);
    console.log('Done!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
