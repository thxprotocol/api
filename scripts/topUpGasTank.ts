import InfuraService from '@/services/InfuraService';
import { parseUnits } from 'ethers/lib/utils';
import { ChainId } from '@/types/enums';

async function main() {
    console.log('Start!');
    await InfuraService.deposit(parseUnits('15', 'ether'), ChainId.PolygonMumbai);
    await InfuraService.deposit(parseUnits('15', 'ether'), ChainId.Polygon);
    console.log('Done!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
