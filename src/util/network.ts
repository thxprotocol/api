import { ethers } from 'ethers';
import { RPC, PRIVATE_KEY, ASSET_POOL_FACTORY_ADDRESS } from '../util/secrets';
import AssetPoolFactoryArtifact from '../artifacts/contracts/contracts/factories/AssetPoolFactory.sol/AssetPoolFactory.json';
import ISolutionArtifact from '../artifacts/contracts/contracts/interfaces/ISolution.sol/ISolution.json';
import GasStationFacetArtifact from '../artifacts/contracts/contracts/facets/GasStationFacet/GasStation.sol/GasStationFacet.json';
import ExampleTokenArtifact from '../artifacts/contracts/contracts/ExampleToken.sol/ExampleToken.json';

export const events = async (tx: any) => {
    tx = await tx;
    tx = await tx.wait();
    return tx.events;
};
function hex2a(hex: any) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
        var v = parseInt(hex.substr(i, 2), 16);
        if (v == 8) continue; // http://www.fileformat.info/info/unicode/char/0008/index.htm
        if (v == 15) continue;
        if (v == 16) continue; // http://www.fileformat.info/info/unicode/char/0010/index.htm
        if (v == 14) continue; // https://www.fileformat.info/info/unicode/char/000e/index.htm
        if (v) str += String.fromCharCode(v);
    }
    return str.trim();
}

export const provider = new ethers.providers.JsonRpcProvider(RPC);
export const admin = new ethers.Wallet(PRIVATE_KEY, provider);
export const assetPoolFactory = new ethers.Contract(ASSET_POOL_FACTORY_ADDRESS, AssetPoolFactoryArtifact.abi, admin);
export const solutionContract = (address: string = null) => {
    return new ethers.Contract(address, ISolutionArtifact.abi, admin);
};
export const tokenContract = (address: string = null) => {
    return new ethers.Contract(address, ExampleTokenArtifact.abi, admin);
};
export function parseLogs(abi: any, logs: any = []) {
    return logs.map((log: any) => {
        const contractInterface = new ethers.utils.Interface(abi);
        try {
            return contractInterface.parseLog(log);
        } catch (e) {}
    });
}
export async function parseResultLog(abi: any, logs: any) {
    const gasStationInterface = new ethers.utils.Interface(GasStationFacetArtifact.abi);
    const event = gasStationInterface.parseLog(logs[logs.length - 1]);

    if (event.args.success) {
        const res = [];
        for (const log of logs) {
            let event;
            try {
                const contractInterface = new ethers.utils.Interface(abi);
                event = contractInterface.parseLog(log);
            } catch (err) {
                continue;
            }
            res.push(event);
        }
        return {
            logs: res,
        };
    } else {
        // remove initial string that indicates this is an error
        // then parse it to hex --> ascii
        const error = hex2a(event.args.data.substr(10));
        return {
            error: error,
        };
    }
}
