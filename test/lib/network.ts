import Web3 from 'web3';
import { Artifact } from '../../src/util/network';
import { PRIVATE_KEY, RPC } from '../../src/util/secrets';
import { VOTER_PK } from './constants';
import * as TestToken from '../../src/artifacts/THXToken.json';
import * as GasStation from '../../src/artifacts/GasStation.json';
import { ethers } from 'ethers';

const web3 = new Web3(RPC);
const provider = new ethers.providers.JsonRpcProvider(RPC);
export const admin = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
export const voter = web3.eth.accounts.privateKeyToAccount(VOTER_PK);

web3.eth.accounts.wallet.add(admin);
web3.eth.accounts.wallet.add(voter);

const options = {
    from: admin.address,
    gas: 6e6,
};
const TEST_TOKEN: Artifact = TestToken;
const GAS_STATION: Artifact = GasStation;
const testTokenContract = new web3.eth.Contract(TEST_TOKEN.abi);
export const gasStation = new web3.eth.Contract(GAS_STATION.abi, process.env.GAS_STATION_ADDRESS);

export const send = (method: string, params: any[] = []) =>
    (web3.currentProvider as any).send({ id: 0, jsonrpc: '2.0', method, params }, () => {});
export const timeTravel = async (seconds: number) => {
    await send('evm_increaseTime', [seconds]);
    await send('evm_mine');
};
export const testTokenInstance = async () =>
    await testTokenContract.deploy({ data: TEST_TOKEN.bytecode, arguments: [admin.address, 1000000000] }).send(options);

export async function signMethod(
    account: { privateKey: string; address: string },
    abi: any,
    contractAddress: string,
    method: string,
    params: any[],
) {
    const wallet = new ethers.Wallet(account.privateKey, provider);
    const nonce = parseInt(await gasStation.methods.getLatestNonce(account.address).call(options), 10) + 1;
    const contractInterface = new ethers.utils.Interface(abi);
    const call = contractInterface.encodeFunctionData(method, params);
    const hash = web3.utils.soliditySha3(call, contractAddress, gasStation.options.address, nonce);
    const sig = await wallet.signMessage(ethers.utils.arrayify(hash));

    return {
        call,
        nonce,
        sig,
    };
}
