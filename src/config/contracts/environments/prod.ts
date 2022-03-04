import { NetworkProvider } from '@/types/enums';
import { TContractEnvironmentConfig } from '@/types/TContractEnvironmentConfig';

export const prod: TContractEnvironmentConfig = {
    [NetworkProvider.Test]: [
        {
            version: '1.0.5',
            assetPoolFactory: '0xDC30889cbFd0574FC3Dd5661Bb627Be67b7DE563',
            assetPoolRegistry: '0xD2129FB1bbc0653eF91B4dFE66d6A4A1D70058d1',
            facets: {
                AccessControl: '0x31C208Fcf231D260E5143F7E345313C80804A647',
                MemberAccess: '0x4E6F15D5c1dF83A8C8156d43E7Cf3067b6B0b7f3',
                Token: '0x69048bF1287fC218ddF194A04024d7B370151Ff8',
                BasePollProxy: '0x8C200D4B4D354DECB2B1381c83E9C1f96F61A87b',
                GasStationFacet: '0x146d7E52376793815fA74B7fA6E0D48706f7fd31',
                UpdateDiamond: '0x276060684Ecdd6c4CB001547499120319676855c',
                WithdrawBy: '0x43d2571e10e18f3315Ac0473172aF1783e5fE5fe',
                WithdrawByPoll: '0x0E6907C33bEcE74192930b7712702A5CecC39660',
                WithdrawByPollProxy: '0x268fb5123af913d05217333Bd241fF28830BDa97',
                RewardBy: '0x78016bd8b32f1F8b64FF436f7A44E1d97E5Cf910',
                RewardByPoll: '0x2B02a610c4E5A6C1c296B145464ca95cBe791EEc',
                RewardByPollProxy: '0x5659da7C702e5de40E60377e56ce24987DD5bF8a',
                DiamondCutFacet: '0x7034E0837d0058EaD1B2d82534ff5a338C60Ea99',
                DiamondLoupeFacet: '0x082E2C352F947A476ac53941424bECD5e7230e9B',
                OwnershipFacet: '0xAD86602fD2e45f5732Ea5F3Db977f8f91153D940',
                AssetPoolFactoryFacet: '0x77611ADEd8922f74a75206a28D09e3E8BB17731c',
            },
        },
    ],
    [NetworkProvider.Main]: [
        {
            version: '1.0.5',
            assetPoolFactory: '0x453d68Ae3E8434fB2818F62C0cABc3267A205bc8',
            assetPoolRegistry: '0x693ba495f5ceC632FE4b0adB54E179052bC6f8D4',
            facets: {
                AccessControl: '0xbb1218948C674985C9D5B1924D68Cb8eB02e5D87',
                MemberAccess: '0xC79ee9E3Aa3d66aD3F434A3b2f578987D2cAd921',
                Token: '0x4ECc1dc2c01223a36a091D46e6258568065F351A',
                BasePollProxy: '0xfF477Cfe2A9E4D4CEf7e6C79Bb4255bDF9C0c0B3',
                GasStationFacet: '0x8cC498f392C255Eed0766B187F8aa5358618cc14',
                UpdateDiamond: '0x8C18A347e134D72A2F80e1F13658110Cc4b9F27a',
                WithdrawBy: '0xC992fb7a1D0Bc4617a4E02924Fdce164e6307149',
                WithdrawByPoll: '0xD7565777F0aFa809126D0bD77b5115B24ecF15A8',
                WithdrawByPollProxy: '0x30FDB3901d62c5099fCcbf1A992e18Ca68dC72E0',
                RewardBy: '0x976b869ba4f396338E92908697Cd4DaE1C30d749',
                RewardByPoll: '0x901880dD72D196A74c115acf450c031d679d4133',
                RewardByPollProxy: '0x65C0B2fD712A56DB5d56372d8E94C5a75a93a639',
                DiamondCutFacet: '0x0dA796866e080916c91779a1b1D5305a63a4391A',
                DiamondLoupeFacet: '0x50b228Da8d5DD077fB0e015e622513DD019Fe3e4',
                OwnershipFacet: '0x72a9174c1A9AEB55D15f2C2de489c47d3DB2131f',
                AssetPoolFactoryFacet: '0x9e8bf47cd812b5E3605599fB086Bc7CF51223699',
            },
        },
    ],
};
