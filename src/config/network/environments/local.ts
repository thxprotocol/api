import { NetworkProvider } from '@/types/enums';

export const local = {
    [NetworkProvider.Test]: [
        {
            version: '1.0.6',
            assetPoolFactory: '0xb3B2b0fc5ce12aE58EEb13E19547Eb2Dd61A79D5',
            assetPoolRegistry: '0xb2Bea6009625407C3c3cF7158185125Ed2C7f101',
            facets: {
                AccessControl: '0x278Ff6d33826D906070eE938CDc9788003749e93',
                MemberAccess: '0xEAB9a65eB0F098f822033192802B53EE159De5F0',
                Token: '0x055cBfeD6df4AFE2452b18fd3D2592D1795592b4',
                BasePollProxy: '0xb63564A81D5d4004F4f22E9aB074cE25540B0C26',
                GasStationFacet: '0x50aF0922d65D04D87d810048Dc640E2474eBfbd9',
                UpdateDiamond: '0x15FC0878406CcF4d2963235A5B1EF68C67F17Ee5',
                WithdrawBy: '0x8613B8E442219e4349fa5602C69431131a7ED114',
                WithdrawByPoll: '0x8B219D3d1FC64e03F6cF3491E7C7A732bF253EC8',
                WithdrawByPollProxy: '0xeDdBA2bDeE7c9006944aCF9379Daa64478E02290',
                RewardBy: '0x3eF13AcF26776BfEd682732ae34cBC86bb355862',
                RewardByPoll: '0xB1456cF726D8D2A2b10dD4db417674A49dB94998',
                RewardByPollProxy: '0xc368fA6A4057BcFD9E49221d8354d5fA6B88945a',
                DiamondCutFacet: '0x439F0128d07f005e0703602f366599ACaaBfEA18',
                DiamondLoupeFacet: '0x24E91C3a2822bDc4bc73512872ab07fD93c8101b',
                OwnershipFacet: '0x76aBe9ec9b15947ba1Ca910695B8b6CffeD8E6CA',
                AssetPoolFactoryFacet: '0x7Cb8d1EAd6303C079c501e93F3ba28C227cd7000',
            },
        },
    ],
    [NetworkProvider.Main]: [
        {
            version: '1.0.6',
            assetPoolFactory: '0xb3B2b0fc5ce12aE58EEb13E19547Eb2Dd61A79D5',
            assetPoolRegistry: '0xb2Bea6009625407C3c3cF7158185125Ed2C7f101',
            facets: {
                AccessControl: '0x278Ff6d33826D906070eE938CDc9788003749e93',
                MemberAccess: '0xEAB9a65eB0F098f822033192802B53EE159De5F0',
                Token: '0x055cBfeD6df4AFE2452b18fd3D2592D1795592b4',
                BasePollProxy: '0xb63564A81D5d4004F4f22E9aB074cE25540B0C26',
                GasStationFacet: '0x50aF0922d65D04D87d810048Dc640E2474eBfbd9',
                UpdateDiamond: '0x15FC0878406CcF4d2963235A5B1EF68C67F17Ee5',
                WithdrawBy: '0x8613B8E442219e4349fa5602C69431131a7ED114',
                WithdrawByPoll: '0x8B219D3d1FC64e03F6cF3491E7C7A732bF253EC8',
                WithdrawByPollProxy: '0xeDdBA2bDeE7c9006944aCF9379Daa64478E02290',
                RewardBy: '0x3eF13AcF26776BfEd682732ae34cBC86bb355862',
                RewardByPoll: '0xB1456cF726D8D2A2b10dD4db417674A49dB94998',
                RewardByPollProxy: '0xc368fA6A4057BcFD9E49221d8354d5fA6B88945a',
                DiamondCutFacet: '0x439F0128d07f005e0703602f366599ACaaBfEA18',
                DiamondLoupeFacet: '0x24E91C3a2822bDc4bc73512872ab07fD93c8101b',
                OwnershipFacet: '0x76aBe9ec9b15947ba1Ca910695B8b6CffeD8E6CA',
                AssetPoolFactoryFacet: '0x7Cb8d1EAd6303C079c501e93F3ba28C227cd7000',
            },
        },
    ],
};
