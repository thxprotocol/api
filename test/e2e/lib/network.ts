import hre from 'hardhat';
import Web3 from 'web3';
import ISolutionArtifact from '../../../src/artifacts/contracts/contracts/interfaces/ISolution.sol/ISolution.json';
import ExampleTokenArtifact from '../../../src/artifacts/contracts/contracts/ExampleToken.sol/ExampleToken.json';
import { utils } from 'ethers/lib';
import { Contract, Wallet } from 'ethers';
import { PRIVATE_KEY, RPC } from '../../../src/util/secrets';
import { VOTER_PK } from './constants';

const ethers = hre.ethers;
const provider = new ethers.providers.JsonRpcProvider(RPC);

export const admin = new ethers.Wallet(PRIVATE_KEY, provider);
export const voter = new ethers.Wallet(VOTER_PK, provider);
export const testTokenFactory = new ethers.ContractFactory(
    ExampleTokenArtifact.abi,
    ExampleTokenArtifact.bytecode,
    admin,
);

export const solution = new ethers.Contract(
    process.env.ASSET_POOL_FACTORY_ADDRESS,
    ISolutionArtifact.abi,
    provider.getSigner(),
);

export const timeTravel = async (seconds: number) => {
    await provider.send('evm_increaseTime', [seconds]);
    await provider.send('evm_mine', []);
};

export async function signMethod(solution: Contract, name: string, args: any[], account: Wallet) {
    const nonce = await solution.getLatestNonce(account.getAddress());
    const call = solution.interface.encodeFunctionData(name, args);
    const hash = Web3.utils.soliditySha3(call, nonce);
    const sig = await account.signMessage(ethers.utils.arrayify(hash));

    return {
        call,
        nonce,
        sig,
    };
}

export async function deployAssetPoolFactory() {
    const FacetCutAction = {
        Add: 0,
        Replace: 1,
        Remove: 2,
    };
    const getSelectors = function (contract: Contract) {
        const signatures = [];
        for (const key of Object.keys(contract.functions)) {
            signatures.push(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
        }

        return signatures;
    };

    const AssetPoolFacet = await ethers.getContractFactory('AssetPoolFacet');
    const AssetPoolFacetView = await ethers.getContractFactory('AssetPoolFacetView');
    const RolesFacet = await ethers.getContractFactory('RolesFacet');
    const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet');
    const DiamondLoupeFacet = await ethers.getContractFactory('DiamondLoupeFacet');
    const OwnershipFacet = await ethers.getContractFactory('OwnershipFacet');
    const GasStationFacet = await ethers.getContractFactory('GasStationFacet');
    const RewardPollFacet = await ethers.getContractFactory('RewardPollFacet');
    const RewardPollProxyFacet = await ethers.getContractFactory('RewardPollProxyFacet');
    const WithdrawPollFacet = await ethers.getContractFactory('WithdrawPollFacet');
    const WithdrawPollProxyFacet = await ethers.getContractFactory('WithdrawPollProxyFacet');
    const PollProxyFacet = await ethers.getContractFactory('PollProxyFacet');

    const UpdateDiamondFacet = await ethers.getContractFactory('UpdateDiamondFacet');
    const AssetPoolFactory = await ethers.getContractFactory('AssetPoolFactory');

    const assetPoolFacet = await AssetPoolFacet.deploy();
    const updateDiamondFacet = await UpdateDiamondFacet.deploy();
    const assetPoolFacetView = await AssetPoolFacetView.deploy();
    const rolesFacet = await RolesFacet.deploy();
    const diamondCutFacet = await DiamondCutFacet.deploy();
    const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
    const ownershipFacet = await OwnershipFacet.deploy();
    const gasStationFacet = await GasStationFacet.deploy();
    const rewardPollFacet = await RewardPollFacet.deploy();
    const rewardPollProxyFacet = await RewardPollProxyFacet.deploy();
    const withdrawPollFacet = await WithdrawPollFacet.deploy();
    const withdrawPollProxyFacet = await WithdrawPollProxyFacet.deploy();
    const pollProxyFacet = await PollProxyFacet.deploy();

    const diamondCut = [
        {
            action: FacetCutAction.Add,
            facetAddress: assetPoolFacet.address,
            functionSelectors: getSelectors(assetPoolFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: diamondCutFacet.address,
            functionSelectors: getSelectors(diamondCutFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: diamondLoupeFacet.address,
            functionSelectors: getSelectors(diamondLoupeFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: ownershipFacet.address,
            functionSelectors: getSelectors(ownershipFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: gasStationFacet.address,
            functionSelectors: getSelectors(gasStationFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: rewardPollFacet.address,
            functionSelectors: getSelectors(rewardPollFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: rewardPollProxyFacet.address,
            functionSelectors: getSelectors(rewardPollProxyFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: withdrawPollProxyFacet.address,
            functionSelectors: getSelectors(withdrawPollProxyFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: withdrawPollFacet.address,
            functionSelectors: getSelectors(withdrawPollFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: pollProxyFacet.address,
            functionSelectors: getSelectors(pollProxyFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: assetPoolFacetView.address,
            functionSelectors: getSelectors(assetPoolFacetView),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: rolesFacet.address,
            functionSelectors: getSelectors(rolesFacet),
        },
        {
            action: FacetCutAction.Add,
            facetAddress: updateDiamondFacet.address,
            functionSelectors: getSelectors(updateDiamondFacet),
        },
    ];
    let all: any[] = [];
    for (let facet in diamondCut) {
        for (let func in diamondCut[facet].functionSelectors) {
            const elem = diamondCut[facet].functionSelectors[func];
            if (all.includes(elem)) {
                console.error('facet', facet, 'func', elem);
                for (const key of Object.keys(rewardPollFacet.functions)) {
                    console.error(key);
                    console.error(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
                }
                break;
            }
            all.push(elem);
        }
    }

    return { AssetPoolFactory, diamondCut };
}
