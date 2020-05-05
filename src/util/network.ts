import axios from 'axios';
import { LocalAddress, CryptoUtils, LoomProvider, Client } from 'loom-js';

const Web3 = require('web3');
const RewardPoolABI = [
    {
        inputs: [
            { internalType: 'string', name: '_name', type: 'string' },
            { internalType: 'address', name: '_tokenAddress', type: 'address' },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'Deposited',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: 'address', name: 'account', type: 'address' }],
        name: 'ManagerAdded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: 'address', name: 'account', type: 'address' }],
        name: 'ManagerRemoved',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: 'address', name: 'account', type: 'address' }],
        name: 'MemberAdded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [{ indexed: true, internalType: 'address', name: 'account', type: 'address' }],
        name: 'MemberRemoved',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
            { indexed: false, internalType: 'address', name: 'reward', type: 'address' },
        ],
        name: 'RewardPollCreated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
            { indexed: false, internalType: 'address', name: 'reward', type: 'address' },
            { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' },
        ],
        name: 'RewardPollFinished',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'proposedAmount', type: 'uint256' },
            { indexed: false, internalType: 'address', name: 'sender', type: 'address' },
        ],
        name: 'RulePollCreated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
            { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' },
            { indexed: false, internalType: 'address', name: 'sender', type: 'address' },
        ],
        name: 'RulePollFinished',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
            { indexed: false, internalType: 'enum RewardPool.RuleState', name: 'state', type: 'uint8' },
            { indexed: false, internalType: 'address', name: 'sender', type: 'address' },
        ],
        name: 'RuleStateChanged',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'beneficiary', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'reward', type: 'uint256' },
        ],
        name: 'Withdrawn',
        type: 'event',
    },
    {
        inputs: [],
        name: 'MAX_VOTED_TOKEN_PERC',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'RULE_POLL_DURATION',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
        name: 'addManager',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
        name: 'addMember',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'sender', type: 'address' }],
        name: 'countDeposits',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'countRewards',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'beneficiary', type: 'address' }],
        name: 'countRewardsOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'countRules',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'receiver', type: 'address' }],
        name: 'countWithdrawels',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'rule', type: 'uint256' },
            { internalType: 'address', name: 'account', type: 'address' },
        ],
        name: 'createReward',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { inputs: [], name: 'createRule', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    {
        inputs: [],
        name: 'creator',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '', type: 'address' },
            { internalType: 'uint256', name: '', type: 'uint256' },
        ],
        name: 'deposits',
        outputs: [
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'address', name: 'sender', type: 'address' },
            { internalType: 'uint256', name: 'created', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
        name: 'isManager',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
        name: 'isMember',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'managers',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'members',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'minVotedTokensPerc',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'name',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'id', type: 'uint256' },
            { internalType: 'bool', name: 'agree', type: 'bool' },
        ],
        name: 'onRewardPollFinish',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'id', type: 'uint256' },
            { internalType: 'bool', name: 'agree', type: 'bool' },
            { internalType: 'uint256', name: 'proposedAmount', type: 'uint256' },
        ],
        name: 'onRulePollFinish',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'receiver', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'uint256', name: 'created', type: 'uint256' },
        ],
        name: 'onWithdrawel',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { inputs: [], name: 'renounceManager', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [], name: 'renounceMember', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    {
        inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
        name: 'revokeVoteForReward',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
        name: 'revokeVoteForRule',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'rewards',
        outputs: [{ internalType: 'contract Reward', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '', type: 'address' },
            { internalType: 'uint256', name: '', type: 'uint256' },
        ],
        name: 'rewardsOf',
        outputs: [{ internalType: 'contract Reward', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'rules',
        outputs: [
            { internalType: 'uint256', name: 'id', type: 'uint256' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'enum RewardPool.RuleState', name: 'state', type: 'uint8' },
            { internalType: 'contract RulePoll', name: 'poll', type: 'address' },
            { internalType: 'address', name: 'creator', type: 'address' },
            { internalType: 'uint256', name: 'created', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'id', type: 'uint256' },
            { internalType: 'uint256', name: 'proposedAmount', type: 'uint256' },
        ],
        name: 'startRulePoll',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'token',
        outputs: [{ internalType: 'contract THXToken', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'string', name: 'value', type: 'string' }],
        name: 'updatePoolName',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'id', type: 'uint256' },
            { internalType: 'bool', name: 'agree', type: 'bool' },
        ],
        name: 'voteForReward',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'id', type: 'uint256' },
            { internalType: 'bool', name: 'agree', type: 'bool' },
        ],
        name: 'voteForRule',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '', type: 'address' },
            { internalType: 'uint256', name: '', type: 'uint256' },
        ],
        name: 'withdrawels',
        outputs: [
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'address', name: 'receiver', type: 'address' },
            { internalType: 'uint256', name: 'created', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
];

export class RewardRule {
    id: number;
    title: string;
    description: string;
    amount: string;

    constructor(rule: any, meta: any) {
        this.id = rule.id;
        this.title = meta.title;
        this.description = meta.description;
        this.amount = rule.amount;
    }
}

export default class Network {
    apiURL = 'https://us-central1-thx-wallet-dev.cloudfunctions.net/api';
    appURL = 'https://thx-wallet-dev.firebaseapp.com';
    dbURL = 'https://thx-wallet-dev.firebaseio.com';
    account: string;
    web3: any;
    utils: any;
    rewardPool: any;

    constructor() {
        const PRIVATE_KEY_ARRAY = CryptoUtils.generatePrivateKey();
        const PUBLIC_KEY = CryptoUtils.publicKeyFromPrivateKey(PRIVATE_KEY_ARRAY);
        const EXTDEV_CHAIN_ID = 'extdev-plasma-us1';
        const client: any = new Client(
            EXTDEV_CHAIN_ID,
            'wss://extdev-plasma-us1.dappchains.com/websocket',
            'wss://extdev-plasma-us1.dappchains.com/queryws',
        );
        this.web3 = new Web3(new LoomProvider(client, PRIVATE_KEY_ARRAY));
        this.account = LocalAddress.fromPublicKey(PUBLIC_KEY).toString();
        this.utils = new Web3().utils;
        this.rewardPool = new this.web3.eth.Contract(RewardPoolABI);
    }

    getQRBuffer(qrBase64: string) {
        const regex = /^data:.+\/(.+);base64,(.*)$/;
        const match = qrBase64.match(regex);

        if (match && match[2]) {
            return Buffer.from(match[2], 'base64');
        } else {
            return;
        }
    }

    async countRules(poolAddress: string) {
        this.rewardPool.options.address = poolAddress;

        try {
            const count = await this.rewardPool.methods.countRules().call({ from: this.account });

            return parseInt(count, 10);
        } catch (e) {
            console.error(e);
        }
    }

    async getRewardPoolAddress(id: string) {
        try {
            const r = await axios({
                method: 'GET',
                url: `${this.dbURL}/slack/${id}/rewardPool.json`,
            });

            return r.data;
        } catch (e) {
            console.error(e);
        }
    }

    async getUID(id: string) {
        try {
            const r = await axios({
                method: 'GET',
                url: `${this.dbURL}/slack/${id}/uid.json`,
            });

            return r.data;
        } catch (e) {
            console.error(e);
        }
    }

    async getMember(uid: string) {
        try {
            const r = await axios({
                method: 'GET',
                url: `${this.dbURL}/users/${uid}.json`,
            });

            return r.data;
        } catch (e) {
            console.error(e);
        }
    }

    async pushReward(poolAddress: string, id: number) {
        try {
            const r = await axios({
                method: 'POST',
                url: `${this.dbURL}/pools/${poolAddress}/rewards.json`,
                data: JSON.stringify({
                    pool: poolAddress,
                    rule: id,
                }),
            });

            return r.data;
        } catch (e) {
            console.error(e);
        }
    }

    async getRewardRule(id: number, poolAddress: string) {
        this.rewardPool.options.address = poolAddress;

        try {
            const rule = await this.rewardPool.methods.rules(id).call({ from: this.account });
            const meta = await axios({
                method: 'GET',
                url: `${this.dbURL}/pools/${poolAddress}/rules/${id}.json`,
            });

            return new RewardRule(rule, meta.data);
        } catch (e) {
            console.error(e);
        }
    }

    async setReward(poolAddress: string, id: number, key: string) {
        try {
            const r = await axios({
                method: 'POST',
                url: `${this.dbURL}/pools/${poolAddress}/rewards/${key}.json`,
                data: JSON.stringify({
                    pool: poolAddress,
                    rule: id,
                    key: key,
                }),
            });

            return r;
        } catch (e) {
            console.error(e);
        }
    }

    async createReward(poolAddress: string, rule: string, address: string) {
        this.rewardPool.options.address = poolAddress;

        try {
            const tx = await this.rewardPool.methods.createReward(rule, address).send({ from: this.account });

            return tx;
        } catch (e) {
            console.error(e);
        }
    }

    async proposeReward(channel: string, member: any, id: any, poolAddress: string, key: string, rule: RewardRule) {
        try {
            const payload: any = {
                as_user: true,
                channel,
                text: `*Congratulations!:moneybag: ${member.firstName} ${
                    member.lastName
                }* has rewarded you *${this.utils.fromWei(rule.amount, 'ether')} THX* for reward rule *${rule.title}*`,
                attachments: [
                    {
                        blocks: [
                            {
                                type: 'section',
                                text: {
                                    type: 'mrkdwn',
                                    text:
                                        "Scan the QR code with your THX wallet and claim this reward. \n You don't have a wallet? No harm done, register a fresh one!",
                                },
                                accessory: {
                                    type: 'image',
                                    image_url: `${this.apiURL}/qr/claim/${poolAddress}/${id}/${key}`,
                                    alt_text: 'qr code for reward verification',
                                },
                            },
                            {
                                type: 'actions',
                                elements: [
                                    {
                                        type: 'button',
                                        url: `${this.appURL}/register`,
                                        text: {
                                            type: 'plain_text',
                                            text: 'Register Wallet',
                                        },
                                        style: 'primary',
                                    },
                                    {
                                        type: 'button',
                                        url: 'https://www.thxprotocol.com/',
                                        text: {
                                            type: 'plain_text',
                                            text: 'More info',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const r = await axios({
                method: 'POST',
                url: 'https://slack.com/api/chat.postMessage',
                headers: {
                    'Authorization': 'Bearer xoxb-874849905696-951441147569-jiqzfWErHKgPlDvBNzE40Jwh',
                    'Content-Type': 'application/json;charset=utf-8',
                },
                data: JSON.stringify(payload),
            }).catch(e => console.error);

            return r;
        } catch (e) {
            console.error(e);
        }
    }
}
