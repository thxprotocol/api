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
        {
            version: '1.0.7',
            assetPoolFactory: '',
            assetPoolRegistry: '',
            facets: {
                AccessControl: '0x7f61982fE107cc34D0E28767a9a56e3d356B6507',
                MemberAccess: '0x95697eD5a0D53F8Bb8cE48A93840f3Cd1Bd32B1C',
                Token: '0xA80852F8125d74711BD2f4AC243156Bd59514E57',
                BasePollProxy: '0x606Ff0F9Ed984132E3c2260a5247e4DF4e810D82',
                RelayHub: '0x98A21c1f8b68Bc582c540B30e71747C7aFF5B99C',
                UpdateDiamond: '0xD4Bda921Bc99886b9263215B800cE1F8f9A7E722',
                WithdrawBy: '0x202018d873B2C0cfEFcFc837dEeAedeEb655FeBD',
                WithdrawByPoll: '0xf31f737573E35609310B2f550947DF3F68F6F8fd',
                WithdrawByPollProxy: '0x9Cd8A8ae542596453b9ffB132a31d45bF7EAe0Ab',
                RewardBy: '0x15B91224Cf8EB7119379103dd1d6DEB115a3c896',
                RewardByPoll: '0x0E32321883424AE19C0e3E15Bc6bEC14eB84A1c1',
                RewardByPollProxy: '0x5176B3e60FE1B3c696e56099A5Fa38a2880892c0',
                DiamondCutFacet: '0x5aEcd0A38262276fC76d7f120CCCb3e0AD099C57',
                DiamondLoupeFacet: '0x3F6123Af171B2E42242caE7e6Dd632074E5F3aa2',
                OwnershipFacet: '0x3e9cb89eD9AcB7e8B2203c01D09f13CCE07F8fA6',
                AssetPoolFactoryFacet: '0xdFbd4B46D75299b71c7A9f6cD9D1C6403A40d225',
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
        {
            version: '1.0.5',
            assetPoolFactory: '',
            assetPoolRegistry: '',
            facets: {
                AccessControl: '0x8A2Dd7Bf4Bc354554DC7474d2228b38F9642262b',
                MemberAccess: '0x30adfA805176F9f5a308772cbac596712E585707',
                Token: '0xC65FAEEe04DC37653C63389D46a92088235A7AfD',
                BasePollProxy: '0xCed163D510121cA6aCBc226bCE684C2D70FCa084',
                RelayHub: '0x0b2084E36B2aa78c48881Fa9006a820b9e01A5E1',
                UpdateDiamond: '0xC6A61D3A6eF3d0aE286dc9B65B039bad0BeAf17A',
                WithdrawBy: '0x343014b6B463cE64395d1CDC6891CaC889A5d2A8',
                WithdrawByPoll: '0x7aAD191Cba3bb78421E2176e00912C17b8FE1381',
                WithdrawByPollProxy: '0xA09dD80e80361004234AF0Ea82163a2C0bbc614d',
                RewardBy: '0x5B32F2006D150Ea49Fd1Dd5bcbD49D9317c9935A',
                RewardByPoll: '0xBA420Dd690fE5113911D4EebB166E8632e196603',
                RewardByPollProxy: '0xdfA24D0F0837226fDAb559650782453a69cB4Fb3',
                DiamondCutFacet: '0x6f45aCf5b28A15137c15c0e7741593BbdECd8E5b',
                DiamondLoupeFacet: '0x942833e40EA048Ed6cC5dF5aB520734195ddFa37',
                OwnershipFacet: '0x80418EB58982708d4aAEad4D59c436a2c4eC52a5',
                AssetPoolFactoryFacet: '0xEf7fFAC11AbdD02266478F5D00c391F2ae133b3d',
            },
        },
    ],
};
