import AccessControl from '../artifacts/contracts/contracts/01-AccessControl/AccessControl.sol/AccessControl.json';
import MemberID from '../artifacts/contracts/contracts/03-MemberAccess/MemberAccess.sol/MemberAccess.json';
import Token from '../artifacts/contracts/contracts/04-Token/Token.sol/Token.json';
import WithdrawArtifact from '../artifacts/contracts/contracts/05-Withdraw/Withdraw.sol/Withdraw.json';
import WithdrawPollArtifact from '../artifacts/contracts/contracts/05-Withdraw/WithdrawPoll.sol/WithdrawPoll.json';
import WithdrawPollProxyArtifact from '../artifacts/contracts/contracts/05-Withdraw/WithdrawPollProxy.sol/WithdrawPollProxy.json';
import RewardArtifact from '../artifacts/contracts/contracts/06-Reward/Reward.sol/Reward.json';
import RewardPollArtifact from '../artifacts/contracts/contracts/06-Reward/RewardPoll.sol/RewardPoll.json';
import RewardPollProxyArtifact from '../artifacts/contracts/contracts/06-Reward/RewardPollProxy.sol/RewardPollProxy.json';
import GasStation from '../artifacts/contracts/contracts/07-GasStation/GasStation.sol/GasStationFacet.json';
import BasePoll from '../artifacts/contracts/contracts/08-BasePoll/BasePollProxy.sol/BasePollProxy.json';
import WithdrawByArtifact from '../artifacts/contracts/contracts/09-WithdrawBypass/WithdrawBy.sol/WithdrawBy.json';
import WithdrawByPollArtifact from '../artifacts/contracts/contracts/09-WithdrawBypass/WithdrawByPoll.sol/WithdrawByPoll.json';
import WithdrawByPollProxyArtifact from '../artifacts/contracts/contracts/09-WithdrawBypass/WithdrawByPollProxy.sol/WithdrawByPollProxy.json';
import RewardByArtifact from '../artifacts/contracts/contracts/10-RewardBypass/RewardBy.sol/RewardBy.json';
import RewardByPollArtifact from '../artifacts/contracts/contracts/10-RewardBypass/RewardByPoll.sol/RewardByPoll.json';
import RewardByPollProxyArtifact from '../artifacts/contracts/contracts/10-RewardBypass/RewardByPollProxy.sol/RewardByPollProxy.json';
import UpdateDiamond from '../artifacts/contracts/contracts/11-UpdateDiamond/UpdateDiamond.sol/UpdateDiamond.json';

import DiamondCutFacetArtifact from '../artifacts/diamond-2/contracts/facets/DiamondCutFacet.sol/DiamondCutFacet.json';
import DiamondLoupeFacetArtifact from '../artifacts/diamond-2/contracts/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json';
import OwnershipFacetArtifact from '../artifacts/diamond-2/contracts/facets/OwnershipFacet.sol/OwnershipFacet.json';
import DiamondArtifact from '../artifacts/diamond-2/contracts/Diamond.sol/Diamond.json';
import AssetPoolFactoryFacetArtifact from '../artifacts/contracts/contracts/AssetPoolFactory/AssetPoolFactoryFacet.sol/AssetPoolFactoryFacet.json';
import PoolRegistryArtifact from '../artifacts/contracts/contracts/PoolRegistry.sol/PoolRegistry.json';

// Interfaces
import IAssetPoolFactoryArtifact from '../artifacts/contracts/contracts/AssetPoolFactory/IAssetPoolFactory.sol/IAssetPoolFactory.json';
import IDefaultDiamondArtifact from '../artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';

export const Artifacts = {
    AccessControl: AccessControl,
    MemberAccess: MemberID,
    Token: Token,
    GasStationFacet: GasStation,
    BasePollProxy: BasePoll,
    UpdateDiamond: UpdateDiamond,
    Withdraw: WithdrawArtifact,
    WithdrawPoll: WithdrawPollArtifact,
    WithdrawPollProxy: WithdrawPollProxyArtifact,
    Reward: RewardArtifact,
    RewardPoll: RewardPollArtifact,
    RewardPollProxy: RewardPollProxyArtifact,
    WithdrawBy: WithdrawByArtifact,
    WithdrawByPoll: WithdrawByPollArtifact,
    WithdrawByPollProxy: WithdrawByPollProxyArtifact,
    RewardBy: RewardByArtifact,
    RewardByPoll: RewardByPollArtifact,
    RewardByPollProxy: RewardByPollProxyArtifact,

    DiamondCutFacet: DiamondCutFacetArtifact,
    DiamondLoupeFacet: DiamondLoupeFacetArtifact,
    OwnershipFacet: OwnershipFacetArtifact,

    AssetPoolFactoryFacet: AssetPoolFactoryFacetArtifact,
    PoolRegistry: PoolRegistryArtifact,

    Diamond: DiamondArtifact,

    IAssetPoolFactory: IAssetPoolFactoryArtifact,
    IDefaultDiamond: IDefaultDiamondArtifact,
};
