import AccessControl from '@thxnetwork/artifacts/artifacts/contracts/01-AccessControl/AccessControl.sol/AccessControl.json';
import MemberAccess from '@thxnetwork/artifacts/artifacts/contracts/03-MemberAccess/MemberAccess.sol/MemberAccess.json';
import Token from '@thxnetwork/artifacts/artifacts/contracts/04-Token/Token.sol/Token.json';
import RelayHub from '@thxnetwork/artifacts/artifacts/contracts/07-RelayHub/RelayHub.sol/RelayHubFacet.json';
import BasePollProxy from '@thxnetwork/artifacts/artifacts/contracts/08-BasePoll/BasePollProxy.sol/BasePollProxy.json';
import WithdrawBy from '@thxnetwork/artifacts/artifacts/contracts/09-WithdrawBypass/WithdrawBy.sol/WithdrawBy.json';
import WithdrawByPoll from '@thxnetwork/artifacts/artifacts/contracts/09-WithdrawBypass/WithdrawByPoll.sol/WithdrawByPoll.json';
import WithdrawByPollProxy from '@thxnetwork/artifacts/artifacts/contracts/09-WithdrawBypass/WithdrawByPollProxy.sol/WithdrawByPollProxy.json';
import RewardBy from '@thxnetwork/artifacts/artifacts/contracts/10-RewardBypass/RewardBy.sol/RewardBy.json';
import RewardByPoll from '@thxnetwork/artifacts/artifacts/contracts/10-RewardBypass/RewardByPoll.sol/RewardByPoll.json';
import RewardByPollProxy from '@thxnetwork/artifacts/artifacts/contracts/10-RewardBypass/RewardByPollProxy.sol/RewardByPollProxy.json';
import UpdateDiamond from '@thxnetwork/artifacts/artifacts/contracts/11-UpdateDiamond/UpdateDiamond.sol/UpdateDiamond.json';

import DiamondCutFacet from '@thxnetwork/artifacts/artifacts/diamond-2/contracts/facets/DiamondCutFacet.sol/DiamondCutFacet.json';
import DiamondLoupeFacet from '@thxnetwork/artifacts/artifacts/diamond-2/contracts/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json';
import OwnershipFacet from '@thxnetwork/artifacts/artifacts/diamond-2/contracts/facets/OwnershipFacet.sol/OwnershipFacet.json';
import Diamond from '@thxnetwork/artifacts/artifacts/diamond-2/contracts/Diamond.sol/Diamond.json';
import AssetPoolFactoryFacet from '@thxnetwork/artifacts/artifacts/contracts/AssetPoolFactory/AssetPoolFactoryFacet.sol/AssetPoolFactoryFacet.json';
import PoolRegistry from '@thxnetwork/artifacts/artifacts/contracts/PoolRegistry.sol/PoolRegistry.json';

import ERC20 from '@thxnetwork/artifacts/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import ERC20LimitedSupply from '@thxnetwork/artifacts/artifacts/contracts/util/TokenLimitedSupply.sol/TokenLimitedSupply.json';
import ERC20UnlimitedSupply from '@thxnetwork/artifacts/artifacts/contracts/util/TokenUnlimitedAccount.sol/TokenUnlimitedAccount.json';
import ExampleToken from '@thxnetwork/artifacts/artifacts/contracts/util/ExampleToken.sol/ExampleToken.json';

// Interfaces
import IAssetPoolFactory from '@thxnetwork/artifacts/artifacts/contracts/AssetPoolFactory/IAssetPoolFactory.sol/IAssetPoolFactory.json';
import IDefaultDiamond from '@thxnetwork/artifacts/artifacts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';

export const Artifacts = {
    AccessControl,
    MemberAccess,
    Token,
    RelayHub,
    BasePollProxy,
    UpdateDiamond,
    WithdrawBy,
    WithdrawByPoll,
    WithdrawByPollProxy,
    RewardBy,
    RewardByPoll,
    RewardByPollProxy,

    DiamondCutFacet,
    DiamondLoupeFacet,
    OwnershipFacet,

    AssetPoolFactoryFacet,
    PoolRegistry,

    Diamond,

    IAssetPoolFactory,
    IDefaultDiamond,

    ERC20,
    ERC20LimitedSupply,
    ERC20UnlimitedSupply,

    ExampleToken,
};

export type ArtifactsKey = keyof typeof Artifacts;
