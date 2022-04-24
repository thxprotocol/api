import { AccountPlanType } from '@/types/enums';

export const tokenName = 'Volunteers United';
export const tokenSymbol = 'VUT';
export const rewardWithdrawAmount = 1000;
export const rewardWithdrawDuration = 60;
export const rewardWithdrawUnlockDate = "2022-04-20";
export const VOTER_PK = '0x97093724e1748ebfa6aa2d2ec4ec68df8678423ab9a12eb2d27ddc74e35e5db9';
export const COLLECTOR_PK = '0x794a8efb7e73278907197b0f65e1c32724810f0399e1a12feb1e6af6fb77dbff';
export const DEPOSITOR_PK = '0x5a05e38394194379795422d2e8c1d33e90033d90defec4880174c39198f707e3';
export const userEmail = 'test.api.bot@thx.network';
export const userEmail2 = 'test.dashboard.user@thx.network';
export const userPassword = 'mellonmellonmellon';
export const userPassword2 = 'mellonmellonmellon';
export const voterEmail = 'test.voter.bot@thx.network';
export const newAddress = '0x253cA584af3E458392982EF246066A6750Fa0735';
export const MaxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
export const sub = '6074cbdd1459355fae4b6a14';
export const sub2 = '6074cbdd1459355fae4b6a15';
export const userWalletAddress = '0xE1ea36CC205923b3fC3b46bb747BE4Fd6bE23E6C';
export const userWalletAddress2 = '0xaf9d56684466fcFcEA0a2B7fC137AB864d642946';
// export const userWalletPrivateKey = '0x668b4ef1e9a288a39974951746e366c632f21c653d3fff89ebe206bdb7194c58';
export const userWalletPrivateKey2 = '0x97093724e1748ebfa6aa2d2ec4ec68df8678423ab9a12eb2d27ddc74e35e5db9';
export const account: any = {
    id: sub,
    address: userWalletAddress,
    plan: AccountPlanType.Basic,
};
export const account2: any = {
    id: sub2,
    address: userWalletAddress2,
    plan: AccountPlanType.Basic,
};

export const rewardId = 1;
export const requestUris = ['http://localhost:8080'];
export const redirectUris = ['http://localhost:8080'];
export const postLogoutRedirectUris = ['http://localhost:8080'];
export const clientId = 'xxxxxxx';
export const clientSecret = 'xxxxxxxxxxxxxx';
export const registrationAccessToken = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
export const adminAddress = '0x08302CF8648A961c607e3e7Bd7B7Ec3230c2A6c5';
export const feeData = {
    fast: {
        maxPriorityFee: 30.095297764066665,
        maxFee: 30.095297785066666,
    },
    estimatedBaseFee: 2.1e-8,
    blockTime: 2,
    blockNumber: 24539906,
};
export const exceedingFeeData = {
    fast: {
        maxPriorityFee: 30.095297764066665,
        maxFee: 401,
    },
    estimatedBaseFee: 2.1e-8,
    blockTime: 3,
    blockNumber: 24539906,
};
