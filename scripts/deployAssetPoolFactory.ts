import dotenv from 'dotenv';

import { Contract, ethers, utils } from 'ethers/lib';

import AccessControlArtifact from '../src/artifacts/contracts/contracts/01-AccessControl/AccessControl.sol/AccessControl.json';
import MemberAccessArtifact from '../src/artifacts/contracts/contracts/03-MemberAccess/MemberAccess.sol/MemberAccess.json';
import TokenArtifact from '../src/artifacts/contracts/contracts/04-Token/Token.sol/Token.json';
import BasePollProxyArtifact from '../src/artifacts/contracts/contracts/08-BasePoll/BasePollProxy.sol/BasePollProxy.json';
import GasStationArtifact from '../src/artifacts/contracts/contracts/07-GasStation/GasStation.sol/GasStationFacet.json';
import WithdrawArtifact from '../src/artifacts/contracts/contracts/05-Withdraw/Withdraw.sol/Withdraw.json';
import WithdrawPollArtifact from '../src/artifacts/contracts/contracts/05-Withdraw/WithdrawPoll.sol/WithdrawPoll.json';
import WithdrawPollProxyArtifact from '../src/artifacts/contracts/contracts/05-Withdraw/WithdrawPollProxy.sol/WithdrawPollProxy.json';
import WithdrawByArtifact from '../src/artifacts/contracts/contracts/09-WithdrawBypass/WithdrawBy.sol/WithdrawBy.json';
import WithdrawByPollArtifact from '../src/artifacts/contracts/contracts/09-WithdrawBypass/WithdrawByPoll.sol/WithdrawByPoll.json';
import WithdrawByPollProxyArtifact from '../src/artifacts/contracts/contracts/09-WithdrawBypass/WithdrawByPollProxy.sol/WithdrawByPollProxy.json';
import RewardArtifact from '../src/artifacts/contracts/contracts/06-Reward/Reward.sol/Reward.json';
import RewardPollArtifact from '../src/artifacts/contracts/contracts/06-Reward/RewardPoll.sol/RewardPoll.json';
import RewardPollProxyArtifact from '../src/artifacts/contracts/contracts/06-Reward/RewardPollProxy.sol/RewardPollProxy.json';
import RewardByArtifact from '../src/artifacts/contracts/contracts/10-RewardBypass/RewardBy.sol/RewardBy.json';
import RewardByPollArtifact from '../src/artifacts/contracts/contracts/10-RewardBypass/RewardByPoll.sol/RewardByPoll.json';
import RewardByPollProxyArtifact from '../src/artifacts/contracts/contracts/10-RewardBypass/RewardByPollProxy.sol/RewardByPollProxy.json';
import DiamondCutFacetArtifact from '../src/artifacts/diamond-2/contracts/facets/DiamondCutFacet.sol/DiamondCutFacet.json';
import DiamondLoupeFacetArtifact from '../src/artifacts/diamond-2/contracts/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json';
import OwnershipFacetArtifact from '../src/artifacts/diamond-2/contracts/facets/OwnershipFacet.sol/OwnershipFacet.json';
import UpdateDiamondFacetArtifact from '../src/artifacts/contracts/contracts/11-UpdateDiamond/UpdateDiamond.sol/UpdateDiamond.json';
import AssetPoolFactoryArtifact from '../src/artifacts/contracts/contracts/AssetPoolFactory.sol/AssetPoolFactory.json';

const env = process.env.NODE_ENV;

if (env) {
    dotenv.config({ path: `.env.${env === 'test' ? 'example' : env}` });
} else {
    dotenv.config({ path: '.env' });
}

const provider = new ethers.providers.JsonRpcProvider(process.env.PUBLIC_RPC);
const admin = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function main() {
    const GasStation = new ethers.ContractFactory(GasStationArtifact.abi, GasStationArtifact.bytecode, admin);
    const GasStationFacet = await GasStation.deploy();

    const AccessControl = new ethers.ContractFactory(AccessControlArtifact.abi, AccessControlArtifact.bytecode, admin);
    const AccessControlFacet = await AccessControl.deploy();

    const MemberAccess = new ethers.ContractFactory(MemberAccessArtifact.abi, MemberAccessArtifact.bytecode, admin);
    const MemberAccessFacet = await MemberAccess.deploy();

    const Token = new ethers.ContractFactory(TokenArtifact.abi, TokenArtifact.bytecode, admin);
    const TokenFacet = await Token.deploy();

    const BasePollProxy = new ethers.ContractFactory(BasePollProxyArtifact.abi, BasePollProxyArtifact.bytecode, admin);
    const BasePollProxyFacet = await BasePollProxy.deploy();

    const Withdraw = new ethers.ContractFactory(WithdrawArtifact.abi, WithdrawArtifact.bytecode, admin);
    const WithdrawFacet = await Withdraw.deploy();

    const WithdrawPoll = new ethers.ContractFactory(WithdrawPollArtifact.abi, WithdrawPollArtifact.bytecode, admin);
    const WithdrawPollFacet = await WithdrawPoll.deploy();

    const WithdrawPollProxy = new ethers.ContractFactory(
        WithdrawPollProxyArtifact.abi,
        WithdrawPollProxyArtifact.bytecode,
        admin,
    );
    const WithdrawPollProxyFacet = await WithdrawPollProxy.deploy();

    const WithdrawBy = new ethers.ContractFactory(WithdrawByArtifact.abi, WithdrawByArtifact.bytecode, admin);
    const WithdrawByFacet = await WithdrawBy.deploy();

    const WithdrawByPoll = new ethers.ContractFactory(
        WithdrawByPollArtifact.abi,
        WithdrawByPollArtifact.bytecode,
        admin,
    );
    const WithdrawByPollFacet = await WithdrawByPoll.deploy();

    const WithdrawByPollProxy = new ethers.ContractFactory(
        WithdrawByPollProxyArtifact.abi,
        WithdrawByPollProxyArtifact.bytecode,
        admin,
    );
    const WithdrawByPollProxyFacet = await WithdrawByPollProxy.deploy();

    const Reward = new ethers.ContractFactory(RewardArtifact.abi, RewardArtifact.bytecode, admin);
    const RewardFacet = await Reward.deploy();

    const RewardPoll = new ethers.ContractFactory(RewardPollArtifact.abi, RewardPollArtifact.bytecode, admin);
    const RewardPollFacet = await RewardPoll.deploy();

    const RewardPollProxy = new ethers.ContractFactory(
        RewardPollProxyArtifact.abi,
        RewardPollProxyArtifact.bytecode,
        admin,
    );
    const RewardPollProxyFacet = await RewardPollProxy.deploy();

    const RewardBy = new ethers.ContractFactory(RewardByArtifact.abi, RewardByArtifact.bytecode, admin);
    const RewardByFacet = await RewardBy.deploy();

    const RewardByPoll = new ethers.ContractFactory(RewardByPollArtifact.abi, RewardByPollArtifact.bytecode, admin);
    const RewardByPollFacet = await RewardByPoll.deploy();

    const RewardByPollProxy = new ethers.ContractFactory(
        RewardByPollProxyArtifact.abi,
        RewardByPollProxyArtifact.bytecode,
        admin,
    );
    const RewardByPollProxyFacet = await RewardByPollProxy.deploy();

    const DiamondCut = new ethers.ContractFactory(DiamondCutFacetArtifact.abi, DiamondCutFacetArtifact.bytecode, admin);
    const DiamondCutFacet = await DiamondCut.deploy();

    const DiamondLoupe = new ethers.ContractFactory(
        DiamondLoupeFacetArtifact.abi,
        DiamondLoupeFacetArtifact.bytecode,
        admin,
    );
    const DiamondLoupeFacet = await DiamondLoupe.deploy();

    const Ownership = new ethers.ContractFactory(OwnershipFacetArtifact.abi, OwnershipFacetArtifact.bytecode, admin);
    const OwnershipFacet = await Ownership.deploy();

    const UpdateDiamond = new ethers.ContractFactory(
        UpdateDiamondFacetArtifact.abi,
        UpdateDiamondFacetArtifact.bytecode,
        admin,
    );
    const UpdateDiamondFacet = await UpdateDiamond.deploy();

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

    const facets = [
        AccessControlFacet,
        MemberAccessFacet,
        TokenFacet,
        BasePollProxyFacet,
        WithdrawByFacet,
        WithdrawByPollFacet,
        WithdrawByPollProxyFacet,
        RewardByFacet,
        RewardByPollFacet,
        RewardByPollProxyFacet,
        DiamondCutFacet,
        DiamondLoupeFacet,
        OwnershipFacet,
        GasStationFacet,
        UpdateDiamondFacet,
    ];
    const diamondCut: any[] = [];
    facets.forEach((facet) => {
        diamondCut.push({
            action: FacetCutAction.Add,
            facetAddress: facet.address,
            functionSelectors: getSelectors(facet),
        });
    });
    const AssetPoolFactory = new ethers.ContractFactory(
        AssetPoolFactoryArtifact.abi,
        AssetPoolFactoryArtifact.bytecode,
        admin,
    );
    console.log('AssetPoolFactory', (await AssetPoolFactory.deploy(diamondCut)).address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
