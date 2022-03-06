import { NetworkProvider } from '@/types/enums';
import { TContractEnvironmentConfig } from '@/types/TContractEnvironmentConfig';

export const dev: TContractEnvironmentConfig = {
    [NetworkProvider.Test]: [
        {
            version: '1.0.5',
            assetPoolFactory: '0x83aFe9Af7D0256234AF467cA5820b045F598E042',
            assetPoolRegistry: '0xb4d92374405285a8197E0cEcD7970525AEAA43Aa',
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
            // TODO Remove manually editted node_modules/@thxnetwork/articsts folder
            version: '1.0.5', // Change this after publish
            assetPoolFactory: '0x3D77fcDb5CcdA66F73E20D1401a533EC7D1FC0fF',
            assetPoolRegistry: '0x1D1037a22b459e902F00A6546E94eA7Ca5298441',
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
