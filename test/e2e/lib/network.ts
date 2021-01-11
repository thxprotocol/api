import Web3 from 'web3';
import { PRIVATE_KEY, RPC } from '../../../src/util/secrets';
import { VOTER_PK } from './constants';
import { ethers } from 'ethers';

const TEST_TOKEN: Artifact = TestToken;
const GAS_STATION: Artifact = GasStation;
const web3 = new Web3();
const provider = new ethers.providers.JsonRpcProvider(RPC);

export const admin = new ethers.Wallet(PRIVATE_KEY, provider);
export const voter = new ethers.Wallet(VOTER_PK, provider);
export const testTokenFactory = new ethers.ContractFactory(TEST_TOKEN.abi, TEST_TOKEN.bytecode, admin);
export const gasStation = new ethers.Contract(process.env.GAS_STATION_ADDRESS, GAS_STATION.abi, provider.getSigner());

export const timeTravel = async (seconds: number) => {
    await provider.send('evm_increaseTime', [seconds]);
    await provider.send('evm_mine', []);
};

export async function signMethod(
    account: { privateKey: string; address: string },
    abi: any,
    contractAddress: string,
    method: string,
    params: any[],
) {
    const wallet = new ethers.Wallet(account.privateKey, provider);
    const nonce = (await gasStation.getLatestNonce(account.address)).toNumber() + 1;
    const contractInterface = new ethers.utils.Interface(abi);
    const call = contractInterface.encodeFunctionData(method, params);
    const hash = web3.utils.soliditySha3(call, contractAddress, gasStation.address, nonce);
    const sig = await wallet.signMessage(ethers.utils.arrayify(hash));

    return {
        call,
        nonce,
        sig,
        contractAddress,
    };
}
