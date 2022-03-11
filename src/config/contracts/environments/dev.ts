import { NetworkProvider } from '@/types/enums';
import { TContractEnvironmentConfig } from '@/types/TContractEnvironmentConfig';

export const dev: TContractEnvironmentConfig = {
    [NetworkProvider.Test]: [
        {
            version: '1.0.5',
            assetPoolFactory: '0x1916f35a1eF5a0Fe97b04cF3c9Fc299f9B33A284',
            assetPoolRegistry: '0xB582400ab52f0BAb1F4f3eD43359f16a88990b97',
            facets: {
                AccessControl: '0x9F811C0B0Dfe688A4D402704EbBEd2Dedad54b60',
                MemberAccess: '0x27840Fe942B6586E1c38DE1F057B5be9F023635b',
                Token: '0x25aB07c33eB51f82E374A4Ca615B9cFbFd1FA791',
                BasePollProxy: '0x98EDdb35BE13D2AB4c40B571776972CDd0091585',
                GasStationFacet: '0xcD7e4587d5887E0Ca51091B13669EEBF5d23C9F0',
                UpdateDiamond: '0xeEA696e46887886B34c82430880d0936cB1ec746',
                WithdrawBy: '0x9E17803bf6BA41e9Eb30b1B36c71E888AA4ccd93',
                WithdrawByPoll: '0xF86ef1D2D253C9cDc6269024234D4b6d28e8595E',
                WithdrawByPollProxy: '0x982AF3ff7187CD8fcC9B95F0653F5A5A3265F883',
                RewardBy: '0x61e60F1C23499dBD4ff41eac33d7e45210B83C28',
                RewardByPoll: '0x4Ce14b21CF4D63eDbFfD801eDa5948F199c0f867',
                RewardByPollProxy: '0xe36c07Cad347794ba0Ed85d4EC1cdB26980ec280',
                DiamondCutFacet: '0x84d8097E49fF59E2958336b175B27370fcdc22dE',
                DiamondLoupeFacet: '0xcB4B4d1E8070093392e8e1A29682d560c4D14c82',
                OwnershipFacet: '0xD834bB724a6Ab8EfDF5828a9ef2B47a0E0634004',
                AssetPoolFactoryFacet: '0xf9c37aE920a9Abd587b4ACf69E2B7DECacBa074b',
            },
        },
        {
            version: '1.0.7',
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
        {
            version: '1.0.8',
            assetPoolFactory: '0x83aFe9Af7D0256234AF467cA5820b045F598E042',
            assetPoolRegistry: '0xb4d92374405285a8197E0cEcD7970525AEAA43Aa',
            facets: {
                AccessControl: '0xEe2b6c529245D9008977426c2681fCFAA6daa7d8',
                MemberAccess: '0x11FbAb4e9fE278ECD2CdcC152bbF39346BAC32EC',
                Token: '0xf9c078EAAE1Bc722A4c834E2254FeD60C7c67DA3',
                BasePollProxy: '0xd8071728A9ED439eC4F19b3E2434F99f7CCea532',
                RelayHub: '0xBAFc524f9F5Db9B7A88C7864a6838E23feDb2706',
                WithdrawBy: '0x97244aB8CB68605AB3fA8c38930197257BD0bC15',
                WithdrawByPoll: '0x703140D48bF434F7A25690bE63E9dc4C7b29991a',
                WithdrawByPollProxy: '0x4c1CA2382ED4A13379EA942Ac17e0BEB89791ca5',
                DiamondCutFacet: '0xa1F48Ad5E3a842AcD6c017C2835646e2816CBa46',
                DiamondLoupeFacet: '0x48ed51f36c73187E886Aaa469370257b799F4FF6',
                OwnershipFacet: '0x614A4161B9a597542b8921BAF55b7fE1e080ed1d',
                AssetPoolFactoryFacet: '0x7bC0694a7a1A8938BCA1477E04114cc3b3aE2ccC',
            },
        },
    ],
    [NetworkProvider.Main]: [
        {
            version: '1.0.5',
            assetPoolFactory: '0x95299F78Caad4EcC896eDc1027706151472558dD',
            assetPoolRegistry: '0x30D9B5A7b2E5f15Bed581b87441863873a370A80',
            facets: {
                AccessControl: '0x1607F5028Bb1775b8Ac93F5a73A0561b8C43C1E2',
                MemberAccess: '0x71916Ac7aBb1ABfA904eb771c29Ad0Aac4B36Ef7',
                Token: '0x4ECc1dc2c01223a36a091D46e6258568065F351A',
                BasePollProxy: '0x42243f9d9f9504231F989dA8985c7ee4F820aC20',
                GasStationFacet: '0xAb0B0CCa6fc7727776A9124EaA1328915E12165f',
                UpdateDiamond: '0xb9FCfeB9eD0E63e58924C1D93a08aC8fB4B81386',
                WithdrawBy: '0xE176f229Efedc0ec223ee474BBF57937a86cf958',
                WithdrawByPoll: '0xFEecAC2c17c039133fB2ff1Aa4328D0Af10504A1',
                WithdrawByPollProxy: '0xfc8cC9C7A8bEb2d4e237946fde93ba6FD4ec01c3',
                RewardBy: '0x96F53fc21ddD0eb2A7A4e7Efab6f9ffE28B9001f',
                RewardByPoll: '0x47fADd4776599E8cD922a6DD275dc3B4c1324442',
                RewardByPollProxy: '0x59695b127A8588E535Ca7Ce268d4C3ef0a38CDc4',
                DiamondCutFacet: '0xd75fF3AA157c8E804bf937477ca919281C2eD763',
                DiamondLoupeFacet: '0x9EbB8cD801490b53E21f1dfc956c2CB0B2f1Ef79',
                OwnershipFacet: '0xe8Fb58becbFAdb7B34BEF9fD7662d86AeBd09d76',
                AssetPoolFactoryFacet: '0x8B2848B1EdE89c5160Ef349e46844642B23F0979',
            },
        },
        {
            version: '1.0.7',
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
        {
            version: '1.0.8',
            assetPoolFactory: '0x3D77fcDb5CcdA66F73E20D1401a533EC7D1FC0fF',
            assetPoolRegistry: '0x1D1037a22b459e902F00A6546E94eA7Ca5298441',
            facets: {
                AccessControl: '0x5Bbf13fD09e1697Ed3B87216774420BaCF98484b',
                MemberAccess: '0xfBe47f27976044949f4B1F4B17B73a8f4EAc940D',
                Token: '0xDeb871B3E37AA187918872C24EBC3B1400947307',
                BasePollProxy: '0x23DaFa4DFB5cebaA244658a622a921a78a933d6D',
                RelayHub: '0xd1EF976C40e06EA3dcCC4BE400F6438363c335a1',
                WithdrawBy: '0x97867F2721E88Bb15ABA01D181c1D4879bAE9191',
                WithdrawByPoll: '0xd1eecC175361Ff5aAd22ed7C3c31FAE022f5a5fB',
                WithdrawByPollProxy: '0x68B224ca0390C3677ddF17e8A0cf2962bda7f7f3',
                DiamondCutFacet: '0x9a3A79f6dbF8Ed5DeABb1967ED275AC3Bd903A7F',
                DiamondLoupeFacet: '0xdd6e810B2446bEaAB32f164B95B441aD57fa3BF3',
                OwnershipFacet: '0xAEcCe70F870eC3a7C01FcD707cA4b89329A2960a',
                AssetPoolFactoryFacet: '0xd4873DD21dCEADE1e6bB859014094A36fD514cb1',
            },
        },
    ],
};
