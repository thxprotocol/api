import { NetworkProvider } from '@/types/enums';
import { TContractEnvironmentConfig } from '@/types/TContractEnvironmentConfig';

export const dev: TContractEnvironmentConfig = {
    [NetworkProvider.Test]: [
        {
            version: '1.0.6',
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
    ],
    [NetworkProvider.Main]: [
        {
            version: '1.0.6',
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
    ],
};
