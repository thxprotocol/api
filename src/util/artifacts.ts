import AccessControl from '@thxnetwork/artifacts/artifacts/contracts/01-AccessControl/AccessControl.sol/AccessControl.json';
import MemberID from '@thxnetwork/artifacts/artifacts/contracts/03-MemberAccess/MemberAccess.sol/MemberAccess.json';
import Token from '@thxnetwork/artifacts/artifacts/contracts/04-Token/Token.sol/Token.json';
import WithdrawArtifact from '@thxnetwork/artifacts/artifacts/contracts/05-Withdraw/Withdraw.sol/Withdraw.json';
import WithdrawPollArtifact from '@thxnetwork/artifacts/artifacts/contracts/05-Withdraw/WithdrawPoll.sol/WithdrawPoll.json';
import WithdrawPollProxyArtifact from '@thxnetwork/artifacts/artifacts/contracts/05-Withdraw/WithdrawPollProxy.sol/WithdrawPollProxy.json';
import RewardArtifact from '@thxnetwork/artifacts/artifacts/contracts/06-Reward/Reward.sol/Reward.json';
import RewardPollArtifact from '@thxnetwork/artifacts/artifacts/contracts/06-Reward/RewardPoll.sol/RewardPoll.json';
import RewardPollProxyArtifact from '@thxnetwork/artifacts/artifacts/contracts/06-Reward/RewardPollProxy.sol/RewardPollProxy.json';
import GasStation from '@thxnetwork/artifacts/artifacts/contracts/07-GasStation/GasStation.sol/GasStationFacet.json';
import BasePoll from '@thxnetwork/artifacts/artifacts/contracts/08-BasePoll/BasePollProxy.sol/BasePollProxy.json';
import WithdrawByArtifact from '@thxnetwork/artifacts/artifacts/contracts/09-WithdrawBypass/WithdrawBy.sol/WithdrawBy.json';
import WithdrawByPollArtifact from '@thxnetwork/artifacts/artifacts/contracts/09-WithdrawBypass/WithdrawByPoll.sol/WithdrawByPoll.json';
import WithdrawByPollProxyArtifact from '@thxnetwork/artifacts/artifacts/contracts/09-WithdrawBypass/WithdrawByPollProxy.sol/WithdrawByPollProxy.json';
import RewardByArtifact from '@thxnetwork/artifacts/artifacts/contracts/10-RewardBypass/RewardBy.sol/RewardBy.json';
import RewardByPollArtifact from '@thxnetwork/artifacts/artifacts/contracts/10-RewardBypass/RewardByPoll.sol/RewardByPoll.json';
import RewardByPollProxyArtifact from '@thxnetwork/artifacts/artifacts/contracts/10-RewardBypass/RewardByPollProxy.sol/RewardByPollProxy.json';
import UpdateDiamond from '@thxnetwork/artifacts/artifacts/contracts/11-UpdateDiamond/UpdateDiamond.sol/UpdateDiamond.json';

import DiamondCutFacetArtifact from '@thxnetwork/artifacts/artifacts/diamond-2/contracts/facets/DiamondCutFacet.sol/DiamondCutFacet.json';
import DiamondLoupeFacetArtifact from '@thxnetwork/artifacts/artifacts/diamond-2/contracts/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json';
import OwnershipFacetArtifact from '@thxnetwork/artifacts/artifacts/diamond-2/contracts/facets/OwnershipFacet.sol/OwnershipFacet.json';
import DiamondArtifact from '@thxnetwork/artifacts/artifacts/diamond-2/contracts/Diamond.sol/Diamond.json';
import AssetPoolFactoryFacetArtifact from '@thxnetwork/artifacts/artifacts/contracts/AssetPoolFactory/AssetPoolFactoryFacet.sol/AssetPoolFactoryFacet.json';
import PoolRegistryArtifact from '@thxnetwork/artifacts/artifacts/contracts/PoolRegistry.sol/PoolRegistry.json';

import ERC20Artifact from '@thxnetwork/artifacts/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import ERC20LimitedSupplyArtifact from '@thxnetwork/artifacts/artifacts/contracts/util/TokenLimitedSupply.sol/TokenLimitedSupply.json';
import ERC20UnlimitedSupplyArtifact from '@thxnetwork/artifacts/artifacts/contracts/util/TokenUnlimitedAccount.sol/TokenUnlimitedAccount.json';
import ExampleTokenArtifact from '@thxnetwork/artifacts/artifacts/contracts/util/ExampleToken.sol/ExampleToken.json';

// Interfaces
import IAssetPoolFactoryArtifact from '@thxnetwork/artifacts/artifacts/contracts/AssetPoolFactory/IAssetPoolFactory.sol/IAssetPoolFactory.json';
import IDefaultDiamondArtifact from '@thxnetwork/artifacts/artifacts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';

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

    ERC20: ERC20Artifact,
    ERC20LimitedSupply: ERC20LimitedSupplyArtifact,
    ERC20UnlimitedSupply: ERC20UnlimitedSupplyArtifact,

    ExampleToken: ExampleTokenArtifact,
};
